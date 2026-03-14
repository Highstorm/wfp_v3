---
phase: 01-data-foundation
plan: "01"
subsystem: data-aggregation
tags: [types, pure-functions, tdd, weekly-stats, goal-resolution]
dependency_graph:
  requires: []
  provides: [weekly-stats-types, resolveGoals, aggregateWeeklyStats]
  affects: [useWeeklyStats-hook, statistics-ui]
tech_stack:
  added: []
  patterns: [pure-function, tdd-red-green, nullish-coalescing, date-fns-iso-week]
key_files:
  created:
    - src/types/weekly-stats.types.ts
    - src/utils/weekly-stats.utils.ts
    - src/utils/__tests__/weekly-stats.utils.test.ts
  modified:
    - src/types/index.ts
decisions:
  - "Use ?? (nullish coalescing) exclusively in resolveGoals — 0 is treated as a valid set value, not a fallback trigger"
  - "Dish fixtures in tests need createdBy field — Dish interface requires it; discovered via tsc --noEmit"
metrics:
  duration_minutes: 3
  completed_date: "2026-03-12"
  tasks_completed: 1
  files_changed: 4
---

# Phase 1 Plan 01: Weekly Stats Types and Aggregation Summary

**One-liner:** Pure `resolveGoals` and `aggregateWeeklyStats` functions with per-macro weekly-to-profile fallback and 7-day ISO-week aggregation with logged/unlogged day split.

## What Was Built

### Types (`src/types/weekly-stats.types.ts`)

Three interfaces exported from the new file and re-exported from the barrel (`src/types/index.ts`):

- `DayStats` — per-day snapshot: `hasData`, `eatenCalories`, `sportCalories`, `deficit`, macros, `sportSessions`
- `ResolvedGoals` — effective goals after fallback: `targetCalories`, `protein`, `carbs`, `fat` (all `number | null`)
- `WeeklyStats` — full week view: 7 `DayStats` entries, `goals`, totals, `loggedDayCount`, `avgEatenCalories`

### Utils (`src/utils/weekly-stats.utils.ts`)

**`resolveGoals(weeklyGoals, profileGoals)`** — resolves each of the four goal fields independently:
- `WeeklyNutritionGoals.field ?? NutritionGoals.field ?? null`
- Uses `??` exclusively so `0` is recognized as "set" rather than falling through

**`aggregateWeeklyStats(weekStartDate, mealPlans, goals)`** — pure aggregation:
- Generates the 7-day skeleton with `eachDayOfInterval` + `endOfISOWeek` (date-fns)
- Looks up each day in a `Map<string, MealPlan>` keyed by `yyyy-MM-dd`
- `isLoggedDay`: `dishCount > 0 || temporaryMeals.length > 0` (sport-only = not logged)
- `sportCalories` collected for ALL days (logged + unlogged) into `totalSportCalories`
- `deficit` only computed for logged days with a non-null calorie goal
- `avgEatenCalories` divides by `loggedDayCount`, never by 7
- Reuses `calculateTotalMealPlanNutrition` and `calculateTotalBurnedCalories` from `nutrition.utils.ts` — no calorie math reimplemented

### Tests (`src/utils/__tests__/weekly-stats.utils.test.ts`)

28 unit tests covering:
- `resolveGoals`: full weekly, null weekly (profile fallback), both null, per-macro independence, zero-is-set
- `aggregateWeeklyStats`: 7-entry guarantee, Mon-Sun dates, hasData logic (no doc / empty doc / dish / temporaryMeal), eatenCalories / sportCalories / deficit semantics, totalSportCalories across all days, avgEatenCalories divides by loggedDayCount, totalSportSessions count, totalDeficit sum, macro aggregation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed invalid `sharedDishId` field from Dish test fixtures**
- **Found during:** TypeScript compilation check (`tsc --noEmit`) after GREEN implementation
- **Issue:** Test fixtures included `sharedDishId: undefined` and bare `ingredients: []` on `Dish` objects; `Dish` interface has neither `sharedDishId` nor required `ingredients` (it's optional `DishIngredient[]`)
- **Fix:** Added `buildDish()` helper in test file using only valid `Dish` fields; removed all `sharedDishId` references
- **Files modified:** `src/utils/__tests__/weekly-stats.utils.test.ts`
- **Commit:** 49e805c (included in GREEN commit)

## Verification Results

```
Test Files  1 passed (1)
Tests       28 passed (28)
tsc --noEmit: clean (no errors)
```

## Self-Check

- [x] `src/types/weekly-stats.types.ts` — FOUND
- [x] `src/utils/weekly-stats.utils.ts` — FOUND
- [x] `src/utils/__tests__/weekly-stats.utils.test.ts` — FOUND
- [x] `src/types/index.ts` — modified, barrel export added
- [x] RED commit `354fee5` — FOUND
- [x] GREEN commit `49e805c` — FOUND

## Self-Check: PASSED
