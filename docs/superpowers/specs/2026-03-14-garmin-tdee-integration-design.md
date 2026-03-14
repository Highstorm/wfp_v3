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

### Zwei getrennte Cloud Functions

Saubere Trennung von Authentifizierung und Datenabruf:

1. **`garmin_connect`** — Login/Token-Management
2. **`garmin_daily_summary`** — Tageswerte abrufen

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
7. `garminDailySummary` im Profil aktualisieren: `profiles/{email}`
8. Response: `{ totalCalories, activeCalories, bmrCalories }`

**Fehlerbehandlung:**
- Keine Tokens vorhanden → `{ error: "NOT_CONNECTED" }`
- Tokens abgelaufen und Refresh fehlgeschlagen → `{ error: "TOKEN_EXPIRED" }` (User muss sich neu verbinden)
- Garmin-API nicht erreichbar → `{ error: "GARMIN_UNAVAILABLE" }`

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
  garminDailySummary: {
    totalCalories: number;      // Garmin TDEE
    activeCalories: number;     // Aktive Kalorien
    bmrCalories: number;        // Grundumsatz laut Garmin
    date: string;               // "YYYY-MM-DD"
    syncedAt: Timestamp;
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

Wenn `useGarminTargetCalories === true` und `garminDailySummary` vorhanden:
- `targetCalories`-Feld wird **read-only**
- Zeigt den Garmin-TDEE-Wert an
- Hinweistext darunter: "Von Garmin (zuletzt {syncedAt})"

Wenn Toggle aus oder keine Daten:
- Normales editierbares Feld wie bisher

### NutritionSummary — Tagesansicht

Wenn `useGarminTargetCalories === true`:
- `targetCalories` wird aus `garminDailySummary.totalCalories` gelesen statt aus dem Profil
- Restliche Berechnung bleibt identisch: `effectiveTarget = targetCalories + correctedSportCalories`

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
  → CF speichert garminDailySummary ins Profil
  → CF refresht Tokens falls nötig
  → Client liest aktualisiertes Profil → zeigt Garmin-TDEE als targetCalories
```

### Kalorienberechnung (useGarminTargetCalories=true)

```
targetCalories = garminDailySummary.totalCalories
effectiveTarget = targetCalories + correctedSportCalories
deficit = effectiveTarget - eatenCalories
```

---

## Abgrenzung zur bestehenden Garmin-Kalorien-Korrektur

Die **Sport-Kalorien-Korrektur** (Ruheanteil aus Garmin-Aktivitäten abziehen) bleibt unverändert bestehen. Sie korrigiert einzelne Sport-Aktivitäten, die über Intervals.icu geladen werden.

Der **Garmin-TDEE** ist der Gesamtverbrauch des Tages (Ruhe + Aktivität + NEAT). Er ersetzt `targetCalories`, nicht die Sport-Kalorien-Korrektur.

Beide Features sind unabhängig voneinander.

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
