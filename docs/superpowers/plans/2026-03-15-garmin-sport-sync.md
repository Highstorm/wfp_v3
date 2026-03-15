# Garmin Sport Sync — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically sync Garmin sport activities into daily meal plans, with exclusive toggle between Garmin and Intervals.icu as sync source.

**Architecture:** New Cloud Function `garmin_activities` fetches activities from Garmin API. A unified `useSportSync` hook replaces `useIntervalsSync`, routing to either Garmin or Intervals based on `profile.sportSyncSource`. Settings UI provides exclusive toggle with confirmation dialog on source switch.

**Tech Stack:** Python Cloud Functions (garminconnect library), React hooks, Firebase Firestore, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-15-garmin-sport-sync-design.md`

---

## Chunk 1: Data Model & Cloud Function

### Task 1: Extend data models

**Files:**
- Modify: `src/types/profile.types.ts:9-27`
- Modify: `src/types/mealplan.types.ts:1-9`

- [ ] **Step 1: Add `sportSyncSource` to UserProfile**

In `src/types/profile.types.ts`, add to the `UserProfile` interface:

```typescript
sportSyncSource?: "garmin" | "intervals" | null;
```

Add it after `useGarminTargetCalories` (line 25).

- [ ] **Step 2: Add `garminActivityId` to SportActivity**

In `src/types/mealplan.types.ts`, add to the `SportActivity` interface:

```typescript
garminActivityId?: string;  // Garmin activity ID for dedup
```

Add it after `intervalsId` (line 6).

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/types/profile.types.ts src/types/mealplan.types.ts
git commit -m "feat: add sportSyncSource and garminActivityId to data models"
```

---

### Task 2: Cloud Function `garmin_activities`

**Files:**
- Modify: `functions/main.py:163-189`

- [ ] **Step 1: Add `garmin_activities` Cloud Function**

Add this new function before `garmin_disconnect` in `functions/main.py` (insert at line 163):

```python
@https_fn.on_call()
def garmin_activities(req: https_fn.CallableRequest) -> dict:
    """Fetch sport activities from Garmin Connect for a given date."""
    if req.auth is None:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="Authentication required.",
        )

    uid = req.auth.uid
    date_str = req.data.get("date")

    if not date_str:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="date is required (YYYY-MM-DD).",
        )

    db = firestore.client()

    # Read tokens
    token_doc = db.collection("garminTokens").document(uid).get()
    if not token_doc.exists:
        return {"error": "NOT_CONNECTED"}

    token_data = token_doc.to_dict()["oauthTokens"]

    # Initialize Garmin client with saved tokens
    try:
        client = Garmin()
        client.login(tokenstore=token_data)
    except Exception as e:
        logger.error(f"garmin_activities: token error: {type(e).__name__}: {e}")
        return {"error": "TOKEN_EXPIRED"}

    # Fetch activities for date
    try:
        raw_activities = client.get_activities_fordate(date_str)
    except Exception as e:
        logger.error(f"garmin_activities: API error: {type(e).__name__}: {e}")
        return {"error": "GARMIN_UNAVAILABLE"}

    # Update tokens (may have been refreshed)
    updated_token_data = client.garth.dumps()
    db.collection("garminTokens").document(uid).update({
        "oauthTokens": updated_token_data,
        "lastSyncAt": SERVER_TIMESTAMP,
    })

    # Map to output schema
    activities = []
    if raw_activities:
        for a in raw_activities:
            activity_id = a.get("activityId")
            if not activity_id:
                continue
            activities.append({
                "activityId": str(activity_id),
                "activityName": a.get("activityName", "Aktivität"),
                "calories": a.get("calories", 0),
                "movingDuration": a.get("movingDuration", 0),
            })

    logger.info(f"garmin_activities: found {len(activities)} activities for {date_str}")

    return {"activities": activities}
```

- [ ] **Step 2: Update `garmin_disconnect` to reset `sportSyncSource`**

In the `garmin_disconnect` function, add `"sportSyncSource": firestore.DELETE_FIELD` to the profile update (around line 182-187):

```python
    db.collection("profiles").document(email).set({
        "garminConnected": False,
        "garminConnectedAt": firestore.DELETE_FIELD,
        "useGarminTargetCalories": False,
        "garminDailySummaries": firestore.DELETE_FIELD,
        "sportSyncSource": firestore.DELETE_FIELD,
    }, merge=True)
```

- [ ] **Step 3: Commit**

```bash
git add functions/main.py
git commit -m "feat: add garmin_activities Cloud Function and reset sportSyncSource on disconnect"
```

---

### Task 3: Frontend service for Garmin activities

**Files:**
- Modify: `src/services/garmin.service.ts:1-49`

- [ ] **Step 1: Add types and function**

Add the following after the existing `GarminDailySummaryResponse` interface (line 16) in `src/services/garmin.service.ts`:

```typescript
export interface GarminActivity {
  activityId: string;
  activityName: string;
  calories: number;
  movingDuration: number;
}

export interface GarminActivitiesResponse {
  activities?: GarminActivity[];
  error?: string;
}
```

Add the following function after `fetchGarminDailySummary` (line 40):

```typescript
export async function fetchGarminActivities(
  date: string
): Promise<GarminActivitiesResponse> {
  const callable = httpsCallable<
    { date: string },
    GarminActivitiesResponse
  >(functions, "garmin_activities");
  const result = await callable({ date });
  return result.data;
}
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/services/garmin.service.ts
git commit -m "feat: add fetchGarminActivities service function"
```

---

## Chunk 2: useSportSync Hook

### Task 4: Create `useSportSync` hook

**Files:**
- Create: `src/hooks/useSportSync.ts`
- Delete: `src/hooks/useIntervalsSync.ts`

- [ ] **Step 1: Create `useSportSync.ts`**

Create `src/hooks/useSportSync.ts`:

```typescript
import { useEffect, useRef } from "react";
import { IntervalsService } from "../services/intervals.service";
import { fetchGarminActivities } from "../services/garmin.service";
import type { SportActivity } from "../types";
import type { MealPlanFormState } from "./useMealPlanFormState";

export function useSportSync(
  state: Pick<
    MealPlanFormState,
    "date" | "mealPlan" | "setMessage" | "intervalsCredentials" | "profile"
  >,
  handleAddSportActivity: (activity: SportActivity) => void
) {
  const { date, mealPlan, setMessage, intervalsCredentials, profile } = state;
  const syncedDates = useRef(new Set<string>());
  const sportSyncSource = profile?.sportSyncSource ?? null;

  // Auto-sync on date open (once per date per session)
  useEffect(() => {
    if (!sportSyncSource || syncedDates.current.has(date)) {
      return;
    }
    syncedDates.current.add(date);
    syncActivities(true);
  }, [date, sportSyncSource]);

  async function syncActivities(isAutoSync = false) {
    if (sportSyncSource === "garmin") {
      await syncGarminActivities(isAutoSync);
    } else if (sportSyncSource === "intervals") {
      await syncIntervalsActivities(isAutoSync);
    }
  }

  async function syncGarminActivities(isAutoSync: boolean) {
    try {
      const result = await fetchGarminActivities(date);
      if (result.error) {
        if (!isAutoSync) {
          const messages: Record<string, string> = {
            NOT_CONNECTED: "Nicht mit Garmin verbunden.",
            TOKEN_EXPIRED: "Garmin-Sitzung abgelaufen. Bitte neu verbinden.",
            GARMIN_UNAVAILABLE: "Garmin nicht erreichbar.",
          };
          setMessage({
            text: messages[result.error] ?? "Fehler beim Laden der Aktivitäten.",
            type: "error",
          });
        }
        return;
      }

      let newActivitiesAdded = false;
      for (const activity of result.activities ?? []) {
        const alreadyExists = mealPlan?.sports?.some(
          (sport) => sport.garminActivityId === activity.activityId
        );
        if (!alreadyExists) {
          handleAddSportActivity({
            description: activity.activityName,
            calories: activity.calories,
            garminActivityId: activity.activityId,
            movingTime: activity.movingDuration,
            source: "GARMIN",
          });
          newActivitiesAdded = true;
        }
      }

      if (!isAutoSync) {
        setMessage({
          text: newActivitiesAdded
            ? "Garmin-Aktivitäten synchronisiert."
            : "Keine neuen Aktivitäten gefunden.",
          type: newActivitiesAdded ? "success" : "info",
        });
      }
    } catch {
      if (!isAutoSync) {
        setMessage({
          text: "Fehler beim Laden der Garmin-Aktivitäten.",
          type: "error",
        });
      }
    }
  }

  async function syncIntervalsActivities(isAutoSync: boolean) {
    if (!intervalsCredentials) {
      if (!isAutoSync) {
        setMessage({
          text: "Keine Intervals.icu Credentials gefunden.",
          type: "error",
        });
      }
      return;
    }

    try {
      const activities = await IntervalsService.getActivitiesForDate(
        date,
        intervalsCredentials
      );
      let newActivitiesAdded = false;

      for (const activity of activities) {
        const alreadyExists = mealPlan?.sports?.some((sport) => {
          const sameById =
            sport.intervalsId && sport.intervalsId === String(activity.id);
          const sameByData =
            !sport.intervalsId &&
            sport.description === activity.name &&
            sport.calories === activity.calories;
          return Boolean(sameById || sameByData);
        });

        if (!alreadyExists) {
          handleAddSportActivity({
            description: activity.name,
            calories: activity.calories,
            intervalsId: String(activity.id),
            movingTime: activity.movingTime,
            source: activity.source,
          });
          newActivitiesAdded = true;
        }
      }

      if (!isAutoSync) {
        setMessage({
          text: newActivitiesAdded
            ? "Aktivitäten synchronisiert."
            : "Keine neuen Aktivitäten gefunden.",
          type: newActivitiesAdded ? "success" : "info",
        });
      }
    } catch (error) {
      if (!isAutoSync) {
        if (error instanceof Error && error.message === "STRAVA_RESTRICTED") {
          setMessage({
            text: "Strava-Aktivitäten sind über die Intervals.icu API nicht verfügbar.",
            type: "error",
          });
        } else {
          setMessage({
            text: "Fehler beim Laden der Aktivitäten.",
            type: "error",
          });
        }
      }
    }
  }

  const handleSyncActivities = () => syncActivities(false);

  return { handleSyncActivities, sportSyncSource } as const;
}
```

- [ ] **Step 2: Delete `useIntervalsSync.ts`**

```bash
rm src/hooks/useIntervalsSync.ts
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: Errors in MealPlanForm.tsx (expected — will fix in Task 5)

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useSportSync.ts
git rm src/hooks/useIntervalsSync.ts
git commit -m "feat: add useSportSync hook replacing useIntervalsSync"
```

---

## Chunk 3: UI Integration

### Task 5: Update SportSection props

**Files:**
- Modify: `src/components/meal-planning/SportSection.tsx:1-12`

- [ ] **Step 1: Replace `onLoadIntervalsActivities` with `onSyncActivities`**

In `SportSection.tsx`, update the interface (lines 6-12):

```typescript
interface SportSectionProps {
  activities: SportActivity[];
  baseCalories: number | null;
  onAddActivity: (activity: SportActivity) => void;
  onRemoveActivity: (index: number) => void;
  onSyncActivities?: () => void;
}
```

Update the destructured props (lines 14-19):

```typescript
export const SportSection = ({
  activities = [],
  baseCalories,
  onAddActivity,
  onRemoveActivity,
  onSyncActivities,
}: SportSectionProps) => {
```

- [ ] **Step 2: Update the sync button (lines 106-111)**

Replace the Intervals-specific button:

```typescript
            {onSyncActivities && (
              <button
                onClick={onSyncActivities}
                className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation py-1"
              >
                Aktivitäten synchronisieren
              </button>
            )}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/meal-planning/SportSection.tsx
git commit -m "feat: update SportSection with generic sync button"
```

---

### Task 6: Wire up MealPlanForm

**Files:**
- Modify: `src/components/meal-planning/MealPlanForm.tsx:1-23, 175-183`

- [ ] **Step 1: Replace useIntervalsSync with useSportSync**

Update imports (lines 12-13): replace

```typescript
import { useIntervalsSync } from "../../hooks/useIntervalsSync";
```

with:

```typescript
import { useSportSync } from "../../hooks/useSportSync";
```

Update hook usage (lines 19-22): replace

```typescript
  const { handleLoadIntervalsActivities } = useIntervalsSync(
    state,
    actions.handleAddSportActivity
  );
```

with:

```typescript
  const { handleSyncActivities, sportSyncSource } = useSportSync(
    state,
    actions.handleAddSportActivity
  );
```

- [ ] **Step 2: Update SportSection props (line 182)**

Replace:

```typescript
              onLoadIntervalsActivities={handleLoadIntervalsActivities}
```

with:

```typescript
              onSyncActivities={sportSyncSource ? handleSyncActivities : undefined}
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/meal-planning/MealPlanForm.tsx
git commit -m "feat: wire useSportSync into MealPlanForm"
```

---

### Task 7: Sport Sync Toggle in UserSettings

**Files:**
- Modify: `src/components/auth/UserSettingsForm.tsx`

- [ ] **Step 1: Add sport sync source state and handler**

After the `handleGarminToggle` function (line 253), add:

```typescript
  const [sportSyncConfirmDialog, setSportSyncConfirmDialog] = useState<{
    isOpen: boolean;
    newSource: "garmin" | "intervals" | null;
  }>({ isOpen: false, newSource: null });

  const currentSportSyncSource = profile?.sportSyncSource ?? null;

  const handleSportSyncSourceChange = async (newSource: "garmin" | "intervals" | null) => {
    // If switching from one active source to another, confirm first
    if (currentSportSyncSource && newSource && currentSportSyncSource !== newSource) {
      setSportSyncConfirmDialog({ isOpen: true, newSource });
      return;
    }
    await saveSportSyncSource(newSource);
  };

  const saveSportSyncSource = async (newSource: "garmin" | "intervals" | null) => {
    if (!auth.currentUser?.email) return;
    await setDoc(
      doc(db, "profiles", auth.currentUser.email),
      { sportSyncSource: newSource },
      { merge: true }
    );
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    setSportSyncConfirmDialog({ isOpen: false, newSource: null });
  };
```

- [ ] **Step 2: Add Sport Sync Toggle UI**

After the Intervals.icu section (after line 378, before the Garmin Connect section), add a new section:

```tsx
        {/* Sport Sync Source */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sport-Synchronisation</h3>
          {[
            { value: null, label: "Aus" },
            { value: "intervals" as const, label: "Intervals.icu", disabled: !profile?.["intervals.icu-API-KEY"] || !profile?.["intervals.icu-AthleteID"] },
            { value: "garmin" as const, label: "Garmin Connect", disabled: !profile?.garminConnected },
          ].map((option) => (
            <label
              key={option.label}
              className={`flex items-center justify-between bg-zinc-100 dark:bg-zinc-800/50 rounded-xl px-4 py-3 transition-colors ${
                option.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-zinc-200/70 dark:hover:bg-zinc-800/70"
              }`}
            >
              <span className="text-sm font-medium">{option.label}</span>
              <div className="relative">
                <input
                  type="radio"
                  name="sportSyncSource"
                  checked={currentSportSyncSource === option.value}
                  onChange={() => !option.disabled && handleSportSyncSourceChange(option.value)}
                  disabled={option.disabled}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 rounded-full peer-checked:border-primary peer-checked:bg-primary transition-colors flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
              </div>
            </label>
          ))}
        </div>
```

- [ ] **Step 3: Add confirmation dialog**

Before the closing `</form>` tag (line 517), add:

```tsx
      {/* Sport Sync Source Confirm Dialog */}
      {sportSyncConfirmDialog.isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-medium">Sport-Sync wechseln?</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Sport-Sync über <strong>{currentSportSyncSource === "garmin" ? "Garmin" : "Intervals.icu"}</strong> wird
              deaktiviert und <strong>{sportSyncConfirmDialog.newSource === "garmin" ? "Garmin" : "Intervals.icu"}</strong> aktiviert.
              Fortfahren?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setSportSyncConfirmDialog({ isOpen: false, newSource: null })}
                className="btn-secondary"
              >
                Abbrechen
              </button>
              <button
                onClick={() => saveSportSyncSource(sportSyncConfirmDialog.newSource)}
                className="btn-primary"
              >
                Wechseln
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
```

Also add `createPortal` to the imports at the top of the file:

```typescript
import { createPortal } from "react-dom";
```

- [ ] **Step 4: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/UserSettingsForm.tsx
git commit -m "feat: add sport sync source toggle with confirmation dialog"
```

---

## Chunk 4: Verification & Deploy

### Task 8: Build and deploy

- [ ] **Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Deploy Cloud Functions**

Run: `npx firebase deploy --only functions`
Expected: All 4 functions deployed (garmin_connect, garmin_daily_summary, garmin_activities, garmin_disconnect)

- [ ] **Step 3: Deploy hosting**

Run: `npx firebase deploy --only hosting`
Expected: Deploy complete

- [ ] **Step 4: Commit any remaining changes and push**

```bash
git push -u origin feature/garmin-sport-sync
```
