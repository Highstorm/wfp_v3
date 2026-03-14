---
phase: 01-data-foundation
plan: 02
subsystem: database
tags: [firestore, react-query, date-fns, hooks, repository-pattern]

# Dependency graph
requires:
  - phase: 01-data-foundation/01-01
    provides: "WeeklyStats types, resolveGoals, aggregateWeeklyStats utilities"
provides:
  - "getMealPlansByWeek Firestore range query function"
  - "useWeeklyStats React Query hook composing full weekly data pipeline"
affects:
  - "Phase 3 UI components (statistics page, weekly chart)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Repository range query using Firestore >= / <= operators on string date field"
    - "React Query hook composing multiple repository calls via Promise.all"

key-files:
  created:
    - src/hooks/useWeeklyStats.ts
  modified:
    - src/repositories/mealplan.repository.ts
    - src/repositories/index.ts
    - src/hooks/index.ts

key-decisions:
  - "Array.isArray guard applied to both sports AND temporaryMeals in getMealPlansByWeek (getMealPlanByDate only guards sports — gap closed)"
  - "staleTime: 2 minutes for useWeeklyStats — reasonable for stats that don't change frequently"

patterns-established:
  - "Promise.all pattern: fetch mealPlans + weeklyGoals + profileGoals in parallel before composing"
  - "enabled: !!weekStartDate guard prevents query when no date provided"

requirements-completed: [DATA-01]

# Metrics
duration: 4min
completed: 2026-03-12
---

# Phase 1 Plan 02: Data Foundation Summary

**Firestore range query `getMealPlansByWeek` and React Query `useWeeklyStats` hook wiring Plan 01 utilities into a cached, parallel-fetching consumer API**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-12T20:18:00Z
- **Completed:** 2026-03-12T20:22:00Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments

- Added `getMealPlansByWeek` with Firestore `>=` / `<=` range query on string `date` field (uses composite index `[createdBy, date]` from Plan 01 research)
- Created `useWeeklyStats` hook with `Promise.all` parallel fetch of MealPlans, WeeklyGoals, and ProfileGoals, composing through `resolveGoals` + `aggregateWeeklyStats`
- Exported both from respective barrel files (`repositories/index.ts`, `hooks/index.ts`)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add getMealPlansByWeek and useWeeklyStats hook** - `6e7ad48` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/repositories/mealplan.repository.ts` - Added `getMealPlansByWeek` range query with Array.isArray guards on both sports and temporaryMeals
- `src/repositories/index.ts` - Added `getMealPlansByWeek` to barrel export
- `src/hooks/useWeeklyStats.ts` - New React Query hook composing the full weekly stats pipeline
- `src/hooks/index.ts` - Added `useWeeklyStats` barrel export

## Decisions Made

- Applied `Array.isArray` guard to both `sports` AND `temporaryMeals` fields in `getMealPlansByWeek`. The existing `getMealPlanByDate` only guards `sports` — this is a known gap identified in RESEARCH.md. Closed proactively in the new function.
- `staleTime: 1000 * 60 * 2` (2 minutes) chosen for weekly stats cache — stats change only when user logs meals/sport, so 2 min revalidation is a reasonable default before Phase 3 wires mutation invalidation.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `getMealPlansByWeek` and `useWeeklyStats` are ready for Phase 3 UI consumption
- Composite Firestore index `[createdBy, date]` must be deployed before first real data load (pre-existing blocker from STATE.md)
- Phase 3 should wire React Query `invalidateQueries(["weeklyStats"])` on meal plan mutations to keep the cache fresh

---
*Phase: 01-data-foundation*
*Completed: 2026-03-12*
