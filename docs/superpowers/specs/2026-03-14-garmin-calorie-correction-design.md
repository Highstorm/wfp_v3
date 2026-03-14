# Garmin Calorie Correction

## Problem

Sport sessions imported from Garmin via Intervals.icu include total calories (active + resting), while other sources like Zwift report only active calories. Since the user's calorie target already accounts for resting metabolic rate, Garmin activities overcount by the resting calories burned during the activity duration.

## Solution

Automatically correct Garmin-sourced sport calories by subtracting the resting calorie component: `corrected = original - (movingTime_h * baseCalories / 24)`. Show a visual indicator on corrected activities.

## Data Layer

### IntervalsActivityDetail (intervals.service.ts)

Add two fields from the Intervals API response:

- `movingTime: number` — activity duration in seconds (from API field `moving_time`)
- `source: string` — import source (from API field `source`, e.g. "GARMIN", "ZWIFT")

### SportActivity (mealplan.types.ts)

Extend with optional fields:

```typescript
interface SportActivity {
  calories: number;
  description?: string;
  intervalsId?: string;
  movingTime?: number;   // NEW: duration in seconds
  source?: string;       // NEW: e.g. "GARMIN", "ZWIFT"
}
```

Manual activities have no `source`/`movingTime` and are never corrected.

## Correction Logic (nutrition.utils.ts)

New pure function:

```typescript
interface CalorieCorrection {
  calories: number;       // final value used for calculations
  originalCalories: number;
  restingDeduction: number;
  wasCorrected: boolean;
}

function correctActivityCalories(
  activity: SportActivity,
  baseCalories: number | null
): CalorieCorrection
```

Rules:
- Correct when: `source` contains "garmin" (case-insensitive) AND `baseCalories > 0` AND `movingTime > 0`
- Formula: `restPerHour = baseCalories / 24`, `deduction = restPerHour * (movingTime / 3600)`, `corrected = Math.max(0, Math.round(original - deduction))`
- Otherwise: no correction, return original calories with `wasCorrected: false`

Update `calculateTotalBurnedCalories` to accept `baseCalories` and use corrected values.

## Profile Display (UserSettingsForm.tsx)

Below the existing "Grundbedarf" input field:
- Read-only display: "Ruheverbrauch pro Stunde"
- Value: `Math.round(baseCalories / 24)` kcal/h
- Styled as muted/disabled text
- Only visible when `baseCalories` is set and > 0

## SportSection UI (SportSection.tsx)

### Uncorrected activity (Zwift, manual, etc.)
```
Zwift Ride                    320 kcal
```

### Corrected activity (Garmin)
```
Morning Run    380 kcal [garmin-delta] (450 - 70)
```

- `380 kcal` in normal text color
- Garmin delta icon (blue triangle SVG, ~14px inline) followed by `(450 - 70)` in `text-muted-foreground`
- 450 = original calories from Garmin, 70 = resting deduction

### Garmin Delta Icon
Extract the blue triangle path from the Garmin logo SVG and save as `src/assets/garmin-delta.svg`. The path data:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="239.443 0 26.24 27.688" width="14" height="14">
  <path d="M265.682 27.688l-25.992-.001c-.953 0-1.771-.474-2.247-1.299s-.476-1.769.001-2.594l12.997-22.498A2.533 2.533 0 0 1 252.687 0c.952 0 1.77.472 2.246 1.296l12.995 22.499a2.53 2.53 0 0 1 .001 2.595 2.536 2.536 0 0 1-2.247 1.298z" fill="#007cc2"/>
</svg>
```

## Affected Files

| File | Change |
|------|--------|
| `src/services/intervals.service.ts` | Map `moving_time` + `source` from API detail response |
| `src/types/mealplan.types.ts` | Add `movingTime?` and `source?` to SportActivity |
| `src/utils/nutrition.utils.ts` | Add `correctActivityCalories()`, update `calculateTotalBurnedCalories()` |
| `src/hooks/useIntervalsSync.ts` | Pass through new fields when creating SportActivity |
| `src/components/meal-planning/SportSection.tsx` | Show correction indicator with Garmin icon |
| `src/components/auth/UserSettingsForm.tsx` | Show read-only resting kcal/h below Grundbedarf |
| `src/assets/garmin-delta.svg` | Blue triangle icon extracted from Garmin logo |

## Testing

- Pure function `correctActivityCalories`: unit tests for Garmin correction, non-Garmin passthrough, missing baseCalories, edge cases (0 duration, negative result clamped to 0)
- `calculateTotalBurnedCalories` with mixed corrected/uncorrected activities
- Existing tests must continue to pass (backward-compatible optional fields)
