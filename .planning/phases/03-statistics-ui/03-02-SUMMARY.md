---
phase: 03-statistics-ui
plan: 02
subsystem: ui
tags: [react, recharts, react-router, date-fns, statistics, charts]

# Dependency graph
requires:
  - phase: 03-01
    provides: stats.utils.ts with toChartData, CHART_COLORS, calcMacroPercent, formatWeekLabel
  - phase: 01-02
    provides: useWeeklyStats hook + WeeklyStats types

provides:
  - useWeekParam hook for URL-driven week state
  - WeekNav component with KW label and prev/next/heute navigation
  - WeeklySummaryCards with 3 cards (kcal, deficit, sport)
  - MacroAverages grid (hidden when no logged days)
  - WeeklyBarChart with color-coded bars, reference line, tooltip, click-to-day
  - StatisticsPage assembling all components

affects: [03-03-routing, future navigation integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useSearchParams for URL-driven state (useWeekParam)
    - Recharts ResponsiveContainer + Cell per-bar coloring
    - Dark mode detection via document.documentElement.classList for Recharts SVG fills
    - Hard cut on week change (no transition animations) — spinner handles loading gap

key-files:
  created:
    - src/hooks/useWeekParam.ts
    - src/components/statistics/WeekNav.tsx
    - src/components/statistics/WeeklySummaryCards.tsx
    - src/components/statistics/MacroAverages.tsx
    - src/components/statistics/WeeklyBarChart.tsx
    - src/components/statistics/StatisticsPage.tsx
  modified:
    - src/hooks/index.ts

key-decisions:
  - "animationBegin={0} belongs on Bar not BarChart in Recharts API"

patterns-established:
  - "Statistics components receive data as props from StatisticsPage — no duplicate hook subscriptions"
  - "MacroAverages returns null when loggedDayCount === 0 — hides section for empty weeks"
  - "WeeklySummaryCards shows dash (–) for zero/null values in empty week state"
  - "Heute button hidden (not disabled) on current week per Phase 2 design decision"

requirements-completed: [VIS-01, VIS-02, VIS-03, SUM-01, SUM-02, SUM-03, MAC-01, NAV-01]

# Metrics
duration: 8min
completed: 2026-03-13
---

# Phase 3 Plan 02: Statistics UI Components Summary

**5 React components + 1 hook delivering the full statistics page: weekly bar chart with color-coded bars/reference line/tooltip, 3 summary cards, macro % averages, and URL-driven week navigation**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-13T10:12:53Z
- **Completed:** 2026-03-13T10:20:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- useWeekParam hook reads/writes ?week= URL param with startOfISOWeek, prev/next/today helpers
- WeeklyBarChart renders 7 color-coded bars (green=under goal, red=over goal, gray=no data), dashed reference line at calorie target, custom tooltip, click-to-day navigation
- WeeklySummaryCards shows total kcal, cumulative deficit (color-coded), and sport kcal + sessions
- MacroAverages shows Protein/Carbs/Fat as % of goal (integer, no decimal), hidden on empty weeks
- StatisticsPage assembles all components with loading spinner + error state, single useWeeklyStats call

## Task Commits

Each task was committed atomically:

1. **Task 1: useWeekParam + WeekNav + WeeklySummaryCards + MacroAverages** - `e5dc8c9` (feat)
2. **Task 2: WeeklyBarChart + StatisticsPage** - `d329744` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `src/hooks/useWeekParam.ts` — URL-driven week state with startOfISOWeek and navigation helpers
- `src/hooks/index.ts` — Added useWeekParam export to barrel
- `src/components/statistics/WeekNav.tsx` — KW label with prev/next arrows, conditional Heute button
- `src/components/statistics/WeeklySummaryCards.tsx` — 3 cards with empty state dashes
- `src/components/statistics/MacroAverages.tsx` — 3-column macro % grid, returns null when no data
- `src/components/statistics/WeeklyBarChart.tsx` — Recharts bar chart with Cell coloring, tooltip, click nav
- `src/components/statistics/StatisticsPage.tsx` — Page shell with loading/error/data states

## Decisions Made
- `animationBegin={0}` is a `Bar` prop, not a `BarChart` prop in Recharts — auto-fixed during Task 2 TypeScript check

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Moved animationBegin from BarChart to Bar**
- **Found during:** Task 2 (WeeklyBarChart)
- **Issue:** `animationBegin` is not a valid BarChart prop — TypeScript error TS2322
- **Fix:** Removed from BarChart, added to Bar element
- **Files modified:** src/components/statistics/WeeklyBarChart.tsx
- **Verification:** `npx tsc --noEmit` passed after fix
- **Committed in:** d329744 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** One-line fix, no scope change.

## Issues Encountered
None beyond the Recharts prop placement noted above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All statistics UI components are complete and TypeScript-clean
- StatisticsPage is ready to be wired into the router (Phase 3, Plan 03)
- All 73 existing tests continue to pass

---
*Phase: 03-statistics-ui*
*Completed: 2026-03-13*

## Self-Check: PASSED

All 6 created files found on disk. Both task commits (e5dc8c9, d329744) confirmed in git log.
