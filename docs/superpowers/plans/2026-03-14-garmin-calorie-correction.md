# Garmin Calorie Correction Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically correct Garmin sport calories by subtracting resting metabolic calories, and show a visual indicator on corrected activities.

**Architecture:** Extend SportActivity type with `movingTime` and `source` from the Intervals API. Add a pure correction function in nutrition.utils. Update SportSection UI to show Garmin delta icon + correction formula. Show derived resting kcal/h in NutritionGoalsForm.

**Tech Stack:** React, TypeScript, Tailwind CSS, Recharts, Firebase/Firestore, Intervals.icu API

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types/mealplan.types.ts` | Modify | Add `movingTime?` and `source?` to SportActivity |
| `src/services/intervals.service.ts` | Modify | Map `moving_time` + `source` from API response |
| `src/hooks/useIntervalsSync.ts` | Modify | Pass through `movingTime` and `source` fields |
| `src/utils/nutrition.utils.ts` | Modify | Add `correctActivityCalories()`, update `calculateTotalBurnedCalories()` |
| `src/utils/__tests__/nutrition.utils.test.ts` | Modify | Tests for correction logic |
| `src/assets/garmin-delta.svg` | Create | Blue triangle icon from Garmin logo |
| `src/components/meal-planning/SportSection.tsx` | Modify | Show correction indicator with Garmin icon |
| `src/components/meal-planning/NutritionGoalsForm.tsx` | Modify | Show read-only resting kcal/h |
| `src/components/meal-planning/MealPlanForm.tsx` | Modify | Pass `baseCalories` to `calculateTotalBurnedCalories` |

---

### Task 1: Extend SportActivity type

**Files:**
- Modify: `src/types/mealplan.types.ts:3-7`

- [ ] **Step 1: Add optional fields to SportActivity**

```typescript
export interface SportActivity {
  calories: number;
  description?: string;
  intervalsId?: string;
  movingTime?: number;   // duration in seconds from Intervals API
  source?: string;       // e.g. "GARMIN", "ZWIFT" from Intervals API
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS (optional fields are backward-compatible)

- [ ] **Step 3: Commit**

```bash
git add src/types/mealplan.types.ts
git commit -m "feat: add movingTime and source fields to SportActivity type"
```

---

### Task 2: Map new fields from Intervals API

**Files:**
- Modify: `src/services/intervals.service.ts:17-21`

- [ ] **Step 1: Extend IntervalsActivityDetail interface**

```typescript
export interface IntervalsActivityDetail {
  id: string;
  name: string;
  calories: number;
  movingTime: number;  // seconds
  source: string;
}
```

- [ ] **Step 2: Update the mapping in getActivitiesForDate (line 84-90)**

Replace the `.map()` at the end of `getActivitiesForDate`:

```typescript
    return detailedActivities
      .filter((activity) => activity && typeof activity.calories === 'number')
      .map((activity) => ({
        id: String(activity.id),
        name: activity.name || 'Aktivität',
        calories: activity.calories!,
        movingTime: (activity as Record<string, unknown>).moving_time as number || 0,
        source: activity.source || '',
      }));
```

Note: The detail endpoint returns `moving_time` (snake_case). Cast through `Record<string, unknown>` since `IntervalsActivityRaw` has `[key: string]: unknown`.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/services/intervals.service.ts
git commit -m "feat: map movingTime and source from Intervals API response"
```

---

### Task 3: Pass new fields through useIntervalsSync

**Files:**
- Modify: `src/hooks/useIntervalsSync.ts:41-46`

- [ ] **Step 1: Include movingTime and source in handleAddSportActivity call**

Update the `handleAddSportActivity` call inside the `for` loop (line 42-46):

```typescript
        if (!existingActivity) {
          handleAddSportActivity({
            description: activity.name,
            calories: activity.calories,
            intervalsId: String(activity.id),
            movingTime: activity.movingTime,
            source: activity.source,
          });
          newActivitiesAdded = true;
        }
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useIntervalsSync.ts
git commit -m "feat: pass movingTime and source through intervals sync"
```

---

### Task 4: Implement calorie correction logic (TDD)

**Files:**
- Modify: `src/utils/nutrition.utils.ts`
- Modify: `src/utils/__tests__/nutrition.utils.test.ts`

- [ ] **Step 1: Write failing tests for correctActivityCalories**

Add to `src/utils/__tests__/nutrition.utils.test.ts`:

```typescript
import {
  calculateDishNutrition,
  calculateIngredientNutrition,
  calculateTemporaryMealNutrition,
  calculateTotalBurnedCalories,
  correctActivityCalories,
} from "../nutrition.utils";

// ... existing tests ...

describe("correctActivityCalories", () => {
  it("corrects Garmin activity: subtracts resting calories for duration", () => {
    const result = correctActivityCalories(
      { calories: 450, source: "GARMIN", movingTime: 3600 },
      1800
    );
    // restPerHour = 1800/24 = 75, deduction = 75 * 1 = 75
    expect(result).toEqual({
      calories: 375,
      originalCalories: 450,
      restingDeduction: 75,
      wasCorrected: true,
    });
  });

  it("handles case-insensitive garmin source", () => {
    const result = correctActivityCalories(
      { calories: 300, source: "garmin", movingTime: 1800 },
      2400
    );
    // restPerHour = 2400/24 = 100, deduction = 100 * 0.5 = 50
    expect(result).toEqual({
      calories: 250,
      originalCalories: 300,
      restingDeduction: 50,
      wasCorrected: true,
    });
  });

  it("handles source containing garmin (e.g. GARMIN_CONNECT)", () => {
    const result = correctActivityCalories(
      { calories: 200, source: "GARMIN_CONNECT", movingTime: 3600 },
      1800
    );
    expect(result.wasCorrected).toBe(true);
    expect(result.calories).toBe(125);
  });

  it("does not correct non-Garmin activities", () => {
    const result = correctActivityCalories(
      { calories: 300, source: "ZWIFT", movingTime: 3600 },
      1800
    );
    expect(result).toEqual({
      calories: 300,
      originalCalories: 300,
      restingDeduction: 0,
      wasCorrected: false,
    });
  });

  it("does not correct when baseCalories is null", () => {
    const result = correctActivityCalories(
      { calories: 300, source: "GARMIN", movingTime: 3600 },
      null
    );
    expect(result.wasCorrected).toBe(false);
    expect(result.calories).toBe(300);
  });

  it("does not correct when baseCalories is 0", () => {
    const result = correctActivityCalories(
      { calories: 300, source: "GARMIN", movingTime: 3600 },
      0
    );
    expect(result.wasCorrected).toBe(false);
    expect(result.calories).toBe(300);
  });

  it("does not correct when movingTime is missing", () => {
    const result = correctActivityCalories(
      { calories: 300, source: "GARMIN" },
      1800
    );
    expect(result.wasCorrected).toBe(false);
    expect(result.calories).toBe(300);
  });

  it("does not correct when source is missing", () => {
    const result = correctActivityCalories(
      { calories: 300, movingTime: 3600 },
      1800
    );
    expect(result.wasCorrected).toBe(false);
    expect(result.calories).toBe(300);
  });

  it("clamps corrected calories to 0 minimum", () => {
    const result = correctActivityCalories(
      { calories: 10, source: "GARMIN", movingTime: 7200 },
      2400
    );
    // restPerHour = 100, deduction = 200, but clamped to 0
    expect(result.calories).toBe(0);
    expect(result.restingDeduction).toBe(200);
    expect(result.wasCorrected).toBe(true);
  });

  it("rounds corrected calories to nearest integer", () => {
    const result = correctActivityCalories(
      { calories: 300, source: "GARMIN", movingTime: 2700 },
      1800
    );
    // restPerHour = 75, deduction = 75 * 0.75 = 56.25 → rounds
    expect(result.calories).toBe(244);
    expect(result.restingDeduction).toBe(56);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit -- --reporter=verbose 2>&1 | tail -30`
Expected: FAIL — `correctActivityCalories` is not exported

- [ ] **Step 3: Implement correctActivityCalories**

Add to `src/utils/nutrition.utils.ts` before `calculateTotalBurnedCalories`:

```typescript
export interface CalorieCorrection {
  calories: number;
  originalCalories: number;
  restingDeduction: number;
  wasCorrected: boolean;
}

/** Correct Garmin activity calories by subtracting resting metabolic component. */
export function correctActivityCalories(
  activity: SportActivity,
  baseCalories: number | null
): CalorieCorrection {
  const original = activity.calories;
  const source = activity.source?.toLowerCase() ?? "";
  const movingTime = activity.movingTime ?? 0;

  if (!source.includes("garmin") || !baseCalories || baseCalories <= 0 || movingTime <= 0) {
    return { calories: original, originalCalories: original, restingDeduction: 0, wasCorrected: false };
  }

  const restPerHour = baseCalories / 24;
  const restingDeduction = Math.round(restPerHour * (movingTime / 3600));
  const corrected = Math.max(0, Math.round(original - restingDeduction));

  return { calories: corrected, originalCalories: original, restingDeduction, wasCorrected: true };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit -- --reporter=verbose 2>&1 | tail -30`
Expected: All tests PASS

- [ ] **Step 5: Update calculateTotalBurnedCalories to use correction**

Replace the existing function:

```typescript
/** Sum burned calories from sport activities, applying Garmin correction when baseCalories is available. */
export function calculateTotalBurnedCalories(
  activities: SportActivity[],
  baseCalories: number | null = null
): number {
  return activities.reduce((total, activity) => {
    const { calories } = correctActivityCalories(activity, baseCalories);
    return total + calories;
  }, 0);
}
```

- [ ] **Step 6: Update existing calculateTotalBurnedCalories tests**

The existing tests pass `activities` without `source`/`movingTime`, and don't pass `baseCalories`. The default `null` means no correction — they should still pass as-is. Verify:

Run: `npm run test:unit -- --reporter=verbose 2>&1 | tail -30`
Expected: All tests PASS (backward-compatible)

- [ ] **Step 7: Add a test for calculateTotalBurnedCalories with mixed activities**

Add to the existing `describe("calculateTotalBurnedCalories")` block:

```typescript
  it("applies Garmin correction when baseCalories is provided", () => {
    const activities: SportActivity[] = [
      { calories: 450, description: "Garmin Run", source: "GARMIN", movingTime: 3600 },
      { calories: 300, description: "Zwift Ride", source: "ZWIFT", movingTime: 3600 },
    ];
    // Garmin: 450 - 75 = 375, Zwift: 300 (no correction)
    expect(calculateTotalBurnedCalories(activities, 1800)).toBe(675);
  });
```

- [ ] **Step 8: Run all tests**

Run: `npm run test:unit`
Expected: All PASS

- [ ] **Step 9: Commit**

```bash
git add src/utils/nutrition.utils.ts src/utils/__tests__/nutrition.utils.test.ts
git commit -m "feat: add Garmin calorie correction logic with TDD"
```

---

### Task 5: Create Garmin delta SVG icon

**Files:**
- Create: `src/assets/garmin-delta.svg`

- [ ] **Step 1: Create the SVG file**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26.24 27.688" width="14" height="14">
  <path d="M26.239 27.688L.247 27.687c-.953 0-1.771-.474-2.247-1.299s-.476-1.769.001-2.594L10.998 1.296A2.533 2.533 0 0 1 13.244 0c.952 0 1.77.472 2.246 1.296l12.995 22.499a2.53 2.53 0 0 1 .001 2.595 2.536 2.536 0 0 1-2.247 1.298z" fill="#007cc2" transform="translate(0.247, 0)"/>
</svg>
```

Note: Shifted the path origin so the viewBox starts at 0,0.

- [ ] **Step 2: Verify file exists**

Run: `ls -la src/assets/garmin-delta.svg`

- [ ] **Step 3: Commit**

```bash
git add src/assets/garmin-delta.svg
git commit -m "feat: add Garmin delta triangle icon"
```

---

### Task 6: Update SportSection UI with correction indicator

**Files:**
- Modify: `src/components/meal-planning/SportSection.tsx`

- [ ] **Step 1: Replace the local SportActivity interface with the shared type and add correction import**

Replace lines 1-13:

```typescript
import { useState } from "react";
import type { SportActivity } from "../../types";
import { correctActivityCalories } from "../../utils/nutrition.utils";
import GarminDelta from "../../assets/garmin-delta.svg";

interface SportSectionProps {
  activities: SportActivity[];
  baseCalories: number | null;
  onAddActivity: (activity: SportActivity) => void;
  onRemoveActivity: (index: number) => void;
  onLoadIntervalsActivities: () => void;
}
```

- [ ] **Step 2: Update the component signature and totalBurned calculation**

```typescript
export const SportSection = ({
  activities = [],
  baseCalories,
  onAddActivity,
  onRemoveActivity,
  onLoadIntervalsActivities,
}: SportSectionProps) => {
  const [calories, setCalories] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isFormVisible, setIsFormVisible] = useState(false);

  const totalBurned = activities.reduce((sum, a) => {
    const { calories: corrected } = correctActivityCalories(a, baseCalories);
    return sum + corrected;
  }, 0);
```

- [ ] **Step 3: Update the activity display to show correction indicator**

Replace the activity card inner content (the `<div className="flex-1 min-w-0">` block, lines 60-66):

```typescript
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {activity.description || "Aktivität"}
                </div>
                {(() => {
                  const correction = correctActivityCalories(activity, baseCalories);
                  return (
                    <div className="flex items-center gap-1.5 text-xs tabular-nums">
                      <span className="text-muted-foreground">
                        -{correction.calories} kcal
                      </span>
                      {correction.wasCorrected && (
                        <span className="flex items-center gap-1 text-muted-foreground/60">
                          <img src={GarminDelta} alt="Garmin" className="w-3 h-3 inline-block" />
                          ({correction.originalCalories} - {correction.restingDeduction})
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/meal-planning/SportSection.tsx
git commit -m "feat: show Garmin correction indicator in SportSection"
```

---

### Task 7: Pass baseCalories through MealPlanForm

**Files:**
- Modify: `src/components/meal-planning/MealPlanForm.tsx:99`

- [ ] **Step 1: Update calculateTotalBurnedCalories call to pass baseCalories**

Find line 99:
```typescript
        burnedCalories={calculateTotalBurnedCalories(mealPlan.sports || [])}
```

Replace with:
```typescript
        burnedCalories={calculateTotalBurnedCalories(mealPlan.sports || [], combinedNutritionGoals.baseCalories)}
```

- [ ] **Step 2: Pass baseCalories to SportSection**

Find the `<SportSection` usage in MealPlanForm.tsx and add the `baseCalories` prop:

```typescript
            <SportSection
              activities={mealPlan.sports || []}
              baseCalories={combinedNutritionGoals.baseCalories}
              onAddActivity={actions.handleAddSportActivity}
              onRemoveActivity={actions.handleRemoveSportActivity}
              onLoadIntervalsActivities={handleLoadIntervalsActivities}
            />
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Run all tests**

Run: `npm run test:unit`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/meal-planning/MealPlanForm.tsx
git commit -m "feat: pass baseCalories for Garmin calorie correction"
```

---

### Task 8: Show resting kcal/h in NutritionGoalsForm

**Files:**
- Modify: `src/components/meal-planning/NutritionGoalsForm.tsx:158-172`

- [ ] **Step 1: Add read-only resting kcal/h display below baseCalories input**

Replace lines 158-172 (the baseCalories `<div>` block):

```typescript
        {/* Base calories below */}
        <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-xl p-3">
          <label htmlFor="baseCalories" className="block text-xs text-muted-foreground mb-1">
            Grundumsatz (kcal)
          </label>
          <input
            id="baseCalories"
            type="number"
            value={goals.baseCalories ?? ""}
            onChange={handleChange("baseCalories")}
            className="w-full bg-transparent font-medium outline-none placeholder:text-muted-foreground/50"
            min="0"
            placeholder="1800"
          />
          {goals.baseCalories !== null && goals.baseCalories > 0 && (
            <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <span className="text-xs text-muted-foreground">
                Ruheverbrauch pro Stunde:{" "}
                <span className="font-medium tabular-nums">
                  {Math.round(goals.baseCalories / 24)} kcal/h
                </span>
              </span>
            </div>
          )}
        </div>
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/meal-planning/NutritionGoalsForm.tsx
git commit -m "feat: show resting kcal/h derived from Grundumsatz"
```

---

### Task 9: Update weekly stats aggregation

**Files:**
- Modify: `src/utils/weekly-stats.utils.ts:64`

- [ ] **Step 1: Check how calculateTotalBurnedCalories is called in weekly-stats**

The call at line 64 is: `const sportCalories = calculateTotalBurnedCalories(sports);`
This is used for the statistics page aggregation. It should also apply Garmin correction.

Update to pass `baseCalories`:

```typescript
const sportCalories = calculateTotalBurnedCalories(sports, goals.baseCalories);
```

Check the function signature of `aggregateDayStats` to see if `goals` is available — it receives `ResolvedGoals` which has `baseCalories`.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Run all tests**

Run: `npm run test:unit`
Expected: All PASS (weekly-stats tests use mock data without `source`/`movingTime`, default correction = no-op)

- [ ] **Step 4: Commit**

```bash
git add src/utils/weekly-stats.utils.ts
git commit -m "feat: apply Garmin correction in weekly stats aggregation"
```

---

### Task 10: Final verification

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 2: All unit tests**

Run: `npm run test:unit`
Expected: All PASS

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: Successful build, no errors

- [ ] **Step 4: Commit any remaining changes**

If any files were missed, add and commit.
