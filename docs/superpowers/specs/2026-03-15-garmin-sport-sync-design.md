# Garmin Sport Sync — Design Spec

## Problem

Sport-Aktivitäten können aktuell nur manuell oder über Intervals.icu geladen werden. Garmin-Nutzer möchten ihre Aktivitäten automatisch synchronisieren, ohne Umweg über Intervals.

## Lösung

Garmin-Aktivitäten werden automatisch beim Öffnen eines Tages geladen und als Sport-Einträge im MealPlan eingefügt. Der Nutzer kann zwischen Garmin und Intervals als Sync-Quelle wählen — immer nur eine gleichzeitig aktiv. Ein manueller Refresh-Button ist ebenfalls verfügbar.

## Datenmodell

### UserProfile — neues Feld

```typescript
sportSyncSource: "garmin" | "intervals" | null  // null = kein Auto-Sync
```

Dieses Feld ersetzt die implizite Logik, bei der Intervals-Sync davon abhängt ob Credentials vorhanden sind. Stattdessen ist der Sync-Modus explizit konfigurierbar.

### SportActivity — neues optionales Feld

```typescript
garminActivityId?: string  // Eindeutige Garmin-Activity-ID für Duplikat-Erkennung
```

Das bestehende `intervalsId`-Feld bleibt für Intervals-Aktivitäten. Beide IDs dienen der Duplikat-Erkennung beim Sync.

## Cloud Function: `garmin_activities`

Neue Cloud Function in `functions/main.py`:

- **Trigger**: Callable Function, authentifiziert
- **Input**: `{ date: "YYYY-MM-DD" }`
- **Ablauf**:
  1. Liest Garmin OAuth-Tokens aus `garminTokens/{uid}`
  2. Initialisiert Garmin-Client mit gespeicherten Tokens
  3. Ruft `client.get_activities_fordate(date_str)` auf (garminconnect-Library — exakte Methode muss gegen installierte Version verifiziert werden, ggf. `get_activities()` mit Datumsfilter)
  4. Mappt Garmin-API-Felder auf Output-Schema:
     - `activityId` ← Garmin-Feld `activityId`
     - `activityName` ← Garmin-Feld `activityName`
     - `calories` ← Garmin-Feld `calories` (Gesamtkalorien der Aktivität)
     - `movingDuration` ← Garmin-Feld `movingDuration` (in Sekunden)
  5. Aktualisierte OAuth-Tokens zurück in `garminTokens/{uid}` schreiben (analog zu `garmin_daily_summary`, da garth Tokens bei Bedarf refresht)
  6. Gibt Array zurück
- **Output**:
  ```json
  {
    "activities": [
      {
        "activityId": "123456789",
        "activityName": "Morning Run",
        "calories": 450,
        "movingDuration": 3600
      }
    ]
  }
  ```
- **Fehler**: `TOKEN_EXPIRED`, `GARMIN_UNAVAILABLE`
- **Kein Firestore-Write für Aktivitäten** — sie werden nur zurückgegeben, das Frontend fügt sie in den MealPlan ein

## Frontend

### garmin.service.ts — neue Funktion

```typescript
fetchGarminActivities(date: string): Promise<GarminActivitiesResponse>
```

Ruft die `garmin_activities` Cloud Function auf.

### useSportSync.ts — neuer Hook (ersetzt useIntervalsSync)

Zentraler Hook für Sport-Synchronisation:

- Liest `profile.sportSyncSource` aus
- **Auto-Sync**: Beim Öffnen eines Tages wird einmal pro Date pro Session synchronisiert (wie `useGarminSync` für TDEE)
  - `"garmin"` → `fetchGarminActivities(date)`
  - `"intervals"` → `IntervalsService.getActivitiesForDate(date)`
  - `null` → kein Auto-Sync
- **Manueller Sync**: Exportiert `handleSyncActivities()` für den Button
- **Duplikat-Erkennung**: Prüft ob `garminActivityId` bzw. `intervalsId` bereits in `mealPlan.sports` existiert
- **Manuelle Einträge bleiben erhalten** — nur neue Aktivitäten aus der Sync-Quelle werden hinzugefügt

### SportSection.tsx — Anpassungen

- Der "Aktivitäten aus Intervals laden"-Button wird zu **"Aktivitäten synchronisieren"**
- Prop-Interface: `onSyncActivities?: () => void` (optional — wird nur übergeben wenn `sportSyncSource !== null`)
- Button nur gerendert wenn `onSyncActivities` vorhanden
- "+ Aktivität hinzufügen" bleibt unverändert

### UserSettingsForm.tsx — Sport-Sync-Toggle

Neuer Abschnitt "Sport-Synchronisation" in den Settings:

- **Drei Optionen**: Aus / Intervals / Garmin
- Garmin nur wählbar wenn `garminConnected === true`
- Intervals nur wählbar wenn Intervals-Credentials vorhanden
- **Bestätigungsdialog beim Wechsel**: Wenn der Nutzer von einer aktiven Quelle zur anderen wechselt, erscheint ein Dialog: "Sport-Sync über [aktuelle Quelle] wird deaktiviert und [neue Quelle] aktiviert. Fortfahren?"
- Speichert `sportSyncSource` im Profil

### useIntervalsSync.ts — wird gelöscht

Die Sync-Logik wandert vollständig in `useSportSync`. Der bestehende `useIntervalsSync`-Hook wird entfernt.

### MealPlanForm.tsx — Anpassungen

- Ersetzt `useIntervalsSync` durch `useSportSync`
- Übergibt `handleSyncActivities` statt `handleLoadIntervalsActivities` an SportSection
- Auto-Sync läuft über den Hook automatisch

## Zusammenfassung der Änderungen

| Datei | Änderung |
|---|---|
| `src/types/profile.types.ts` | `sportSyncSource` Feld hinzufügen |
| `src/types/mealplan.types.ts` | `garminActivityId` Feld hinzufügen |
| `functions/main.py` | Neue `garmin_activities` Cloud Function |
| `src/services/garmin.service.ts` | `fetchGarminActivities()` hinzufügen |
| `src/hooks/useSportSync.ts` | Neuer Hook — ersetzt `useIntervalsSync` |
| `src/hooks/useIntervalsSync.ts` | Löschen |
| `src/components/meal-planning/SportSection.tsx` | Generischer Sync-Button |
| `src/components/meal-planning/MealPlanForm.tsx` | `useSportSync` statt `useIntervalsSync` |
| `src/components/auth/UserSettingsForm.tsx` | Sport-Sync-Toggle mit Bestätigungsdialog |
| `functions/main.py` (`garmin_disconnect`) | `sportSyncSource` auf `null` zurücksetzen beim Disconnect |
