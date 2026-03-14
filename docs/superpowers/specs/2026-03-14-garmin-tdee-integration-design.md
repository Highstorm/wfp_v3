# Garmin TDEE Integration — Design Spec

## Ziel

Den täglichen Gesamtkalorienverbrauch (TDEE) von Garmin Connect als dynamisches Tagesziel (`targetCalories`) in der App nutzen. Statt eines statisch eingetragenen Kalorienziels wird der von Garmin berechnete Tagesverbrauch (basierend auf Aktivität, Herzfrequenz, etc.) als Zielwert verwendet.

## Kontext

- Die App trackt tägliche Ernährung mit Kalorienzielen und Makronährstoffen
- Sport-Aktivitäten werden über Intervals.icu geladen (mit Garmin-Kalorien-Korrektur)
- Zwei User nutzen die App, beide mit Garmin-Uhren
- Es gibt kein offizielles Garmin-API für Einzelentwickler — die inoffizielle `python-garminconnect`-Library wird verwendet

## Architektur-Entscheidungen

### Intervals.icu reicht nicht

Die Intervals.icu Wellness-API hat kein Feld für den täglichen Kalorienverbrauch. Garmin synct nur Wellness-Daten wie Schlaf, HRV, Gewicht, SpO2 — aber keine Kalorienwerte. Daher ist ein direkter Garmin-Connect-Zugriff nötig.

### Python Cloud Functions statt Container

Firebase Cloud Functions (2nd gen) unterstützen Python nativ. Kein Container-Setup nötig. Die `garminconnect`-Library ist Python-basiert.

### Drei getrennte Cloud Functions

Saubere Trennung von Authentifizierung, Datenabruf und Disconnect:

1. **`garmin_connect`** — Login/Token-Management
2. **`garmin_daily_summary`** — Tageswerte abrufen
3. **`garmin_disconnect`** — Verbindung trennen, Tokens löschen

### On-Demand statt Scheduled

Der Garmin-TDEE wird bei Bedarf abgerufen (App öffnen / manueller Sync), nicht per Scheduled Job. Der Wert ändert sich über den Tag, daher ist ein aktueller Abruf sinnvoller.

### Toggle statt Ersetzung

Ein Profil-Toggle `useGarminTargetCalories` erlaubt flexibles Wechseln zwischen statischem und dynamischem Tagesziel. Der manuell eingestellte Wert geht nicht verloren.

---

## Backend: Cloud Functions

### 1. `garmin_connect` — Authentifizierung

**Trigger:** HTTPS Callable
**Input:** `{ garminEmail: string, garminPassword: string }` + Firebase Auth Token
**Ablauf:**

1. Firebase Auth Token verifizieren → `uid` extrahieren
2. Mit `garminconnect`-Library bei Garmin authentifizieren
3. OAuth-Tokens (via `garth`) serialisieren
4. Tokens in Firestore speichern: `garminTokens/{uid}`
5. `garminConnected: true` im Profil setzen: `profiles/{email}`
6. Response: `{ success: true }`

**Fehlerbehandlung:**
- Ungültige Garmin-Credentials → `{ error: "INVALID_CREDENTIALS" }`
- Kein Firebase Auth → HTTP 401

**Wichtig:** Garmin Email/Passwort werden **nicht** gespeichert — nur die resultierenden OAuth-Tokens.

### 2. `garmin_daily_summary` — Daten-Abruf

**Trigger:** HTTPS Callable
**Input:** `{ date: string }` (Format: "YYYY-MM-DD") + Firebase Auth Token
**Ablauf:**

1. Firebase Auth Token verifizieren → `uid` und `email` extrahieren
2. OAuth-Tokens aus `garminTokens/{uid}` lesen
3. `garminconnect`-Client mit gespeicherten Tokens initialisieren
4. `get_user_summary(date)` aufrufen
5. `totalKilocalories`, `activeKilocalories`, `bmrKilocalories` extrahieren
6. Aktualisierte Tokens zurückschreiben (falls durch Refresh erneuert)
7. `garminDailySummaries[date]` im Profil aktualisieren: `profiles/{email}`
8. Response: `{ totalCalories, activeCalories, bmrCalories }`

**Fehlerbehandlung:**
- Keine Tokens vorhanden → `{ error: "NOT_CONNECTED" }`
- Tokens abgelaufen und Refresh fehlgeschlagen → `{ error: "TOKEN_EXPIRED" }` (User muss sich neu verbinden)
- Garmin-API nicht erreichbar → `{ error: "GARMIN_UNAVAILABLE" }`

**Validierung:** Wenn `totalKilocalories` unplausibel ist (< 500 kcal), wird der Wert nicht gespeichert und stattdessen `{ error: "IMPLAUSIBLE_VALUE" }` zurückgegeben. Das verhindert, dass ein noch nicht synchronisierter Tageswert das Kalorienziel verfälscht.

### 3. `garmin_disconnect` — Verbindung trennen

**Trigger:** HTTPS Callable
**Input:** Firebase Auth Token
**Ablauf:**

1. Firebase Auth Token verifizieren → `uid` und `email` extrahieren
2. Dokument `garminTokens/{uid}` löschen
3. Im Profil `profiles/{email}` setzen: `garminConnected: false`, `useGarminTargetCalories: false`, `garminDailySummaries: null`
4. Response: `{ success: true }`

---

## Infrastruktur: Cloud Functions Setup

Das Projekt hat bisher keine Cloud Functions. Folgendes wird benötigt:

- Neuer Ordner `functions/` mit Python-Projektstruktur
- `functions/main.py` — Function-Definitionen
- `functions/requirements.txt` — Python-Abhängigkeiten (`garminconnect`, `firebase-admin`, `firebase-functions`)
- Erweiterung von `firebase.json` um `functions`-Konfiguration mit Python Runtime
- Firebase-Projekt muss den Blaze-Plan (Pay-as-you-go) nutzen für Cloud Functions

**Hinweis zur Email-Auflösung:** Cloud Functions nutzen das Firebase Admin SDK, das über `auth.get_user(uid)` die Email des Users auflöst. So wird die `profiles/{email}`-Adressierung zuverlässig bedient, auch wenn das ID-Token kein `email`-Claim enthält.

---

## Firestore: Datenmodell

### Neue Collection: `garminTokens/{uid}`

```typescript
{
  oauthTokens: string;       // Serialisierte garth OAuth-Tokens
  connectedAt: Timestamp;
  lastSyncAt: Timestamp;
}
```

**Security Rules:** Komplett gesperrt für Client-Zugriff. Nur Cloud Functions mit Admin SDK können lesen/schreiben.

### Erweiterung: `profiles/{email}`

```typescript
{
  // ... bestehende Felder ...
  garminConnected: boolean;
  useGarminTargetCalories: boolean;
  garminDailySummaries: {
    [date: string]: {             // Key = "YYYY-MM-DD"
      totalCalories: number;      // Garmin TDEE
      activeCalories: number;     // Aktive Kalorien
      bmrCalories: number;        // Grundumsatz laut Garmin
      syncedAt: Timestamp;
    };
  } | null;
}
```

### Firestore Security Rules

```
match /garminTokens/{uid} {
  allow read, write: if false;  // Nur Admin SDK
}
```

Profil-Rules bleiben unverändert (Owner-basiert).

---

## Frontend: UI-Änderungen

### UserSettingsForm — Neue "Garmin Connect" Sektion

Position: Unterhalb des Intervals.icu-Bereichs.

**Zustand: Nicht verbunden**
- Garmin-Email Eingabefeld
- Garmin-Passwort Eingabefeld
- "Mit Garmin verbinden" Button
- Fehleranzeige bei ungültigen Credentials

**Zustand: Verbunden**
- Grüner Status-Text: "Verbunden seit {connectedAt}"
- "Trennen" Button (löscht Tokens und setzt `garminConnected: false`)
- Toggle: "Garmin-TDEE als Tagesziel verwenden" (`useGarminTargetCalories`)
- "Sync" Button zum manuellen Abruf

### NutritionGoalsForm — Dynamisches Tagesziel

Wenn `useGarminTargetCalories === true` und `garminDailySummaries[date]` vorhanden:
- `targetCalories`-Feld wird **read-only**
- Zeigt den Garmin-TDEE-Wert an
- Hinweistext darunter: "Von Garmin (zuletzt {syncedAt})"

Wenn Toggle aus oder keine Daten:
- Normales editierbares Feld wie bisher

### NutritionSummary — Tagesansicht

Wenn `useGarminTargetCalories === true` und Garmin-Daten für den Tag vorhanden:
- `targetCalories` wird aus `garminDailySummaries[date].totalCalories` gelesen statt aus dem Profil
- **Wichtig:** Sport-Kalorien werden **nicht** addiert: `effectiveTarget = garminTDEE` (ohne `+ correctedSportCalories`), weil der Garmin-TDEE bereits alle Aktivitäten des Tages beinhaltet (siehe Abschnitt "Interaktion mit Sport-Kalorien-Korrektur")
- Fallback: Wenn keine Garmin-Daten für den Tag vorhanden → statisches `targetCalories` + `correctedSportCalories` wie bisher

---

## Datenfluss

### Garmin verbinden

```
User gibt Garmin-Credentials im Profil ein
  → Client ruft Cloud Function `garmin_connect` auf
  → CF authentifiziert bei Garmin, speichert Tokens in garminTokens/{uid}
  → CF setzt garminConnected=true im Profil
  → Client liest Profil-Update → zeigt "Verbunden"
```

### Tageswerte synchronisieren

```
User öffnet App / klickt "Sync"
  → Client ruft Cloud Function `garmin_daily_summary` mit { date } auf
  → CF liest Tokens aus garminTokens/{uid}
  → CF ruft Garmin get_user_summary(date) auf
  → CF speichert garminDailySummaries[date] ins Profil
  → CF refresht Tokens falls nötig
  → Client liest aktualisiertes Profil → zeigt Garmin-TDEE als targetCalories
```

### Kalorienberechnung (useGarminTargetCalories=true)

```
garminData = garminDailySummaries[date]

Wenn garminData vorhanden:
  effectiveTarget = garminData.totalCalories   // TDEE beinhaltet bereits Sport
  deficit = effectiveTarget - eatenCalories

Wenn garminData NICHT vorhanden (Fallback):
  effectiveTarget = targetCalories + correctedSportCalories   // wie bisher
  deficit = effectiveTarget - eatenCalories
```

---

## Interaktion mit Sport-Kalorien-Korrektur

### Das Problem: Doppelzählung vermeiden

Garmin-TDEE = BMR + NEAT + Sport. Er enthält also bereits alle Aktivitätskalorien des Tages. Die bisherige Formel `effectiveTarget = targetCalories + correctedSportCalories` würde Sport doppelt zählen.

### Die Lösung

Wenn `useGarminTargetCalories === true` und Garmin-Daten für den Tag vorhanden:
- `effectiveTarget = garminTDEE` — **keine Addition von Sport-Kalorien**
- Die Sport-Kalorien-Korrektur bleibt in der **Anzeige** der einzelnen Aktivitäten (SportSection) bestehen — dort wird weiterhin gezeigt, wie viel Garmin gemeldet hat vs. korrigierter Wert
- Die korrigierten Sport-Kalorien werden aber **nicht** auf das Tagesziel addiert

Wenn `useGarminTargetCalories === false` oder keine Garmin-Daten:
- Alles bleibt wie bisher: `effectiveTarget = targetCalories + correctedSportCalories`

### Wochenstatistik

`aggregateWeeklyStats()` prüft pro Tag, ob Garmin-Daten vorhanden sind:
- Ja → `effectiveTarget = garminDailySummaries[date].totalCalories`, Sport-Kalorien nicht addieren
- Nein → Fallback auf statisches `targetCalories + correctedSportCalories`

Die `garminDailySummaries`-Map im Profil wird an `aggregateWeeklyStats()` übergeben, sodass jeder Tag seinen eigenen TDEE-Wert hat.

---

## Technische Abhängigkeiten

- `python-garminconnect` (PyPI) — Inoffizielle Garmin Connect API
- `garth` (wird von garminconnect genutzt) — OAuth Token Management
- `firebase-admin` (Python) — Firestore-Zugriff aus Cloud Functions
- `firebase-functions` (Python) — Cloud Function Framework
- Firebase Cloud Functions 2nd gen mit Python Runtime

---

## Offene Risiken

1. **Inoffizielle API:** `garminconnect` basiert auf Reverse-Engineering. Garmin könnte die API ändern oder den Zugang blockieren. Mitigation: Toggle erlaubt Fallback auf statisches Ziel.
2. **Token-Lebensdauer:** OAuth-Tokens laufen nach ~3 Monaten ab. Refresh passiert automatisch, aber wenn der Refresh-Token selbst abläuft, muss der User sich neu verbinden. Die App zeigt in dem Fall einen Hinweis.
3. **Rate Limiting:** Garmin könnte häufige API-Aufrufe throttlen. On-Demand-Abruf (nicht automatisch) minimiert das Risiko.
4. **garth Token-Serialisierung:** Das Serialisierungsformat von `garth` kann sich zwischen Library-Versionen ändern. Bei einem Update müssten sich User ggf. neu verbinden. Mitigation: Library-Version pinnen in `requirements.txt`.
5. **Partial-TDEE:** Am frühen Morgen kann der Garmin-TDEE noch sehr niedrig sein (Uhr noch nicht synchronisiert). Mitigation: Werte < 500 kcal werden als unplausibel abgelehnt.
