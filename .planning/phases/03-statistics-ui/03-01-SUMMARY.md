---
phase: 03-statistics-ui
plan: 01
subsystem: ui
tags: [recharts, date-fns, statistics, chart, tdd, vitest]

# Dependency graph
requires:
  - phase: 01-data-foundation
    provides: DayStats, WeeklyStats, ResolvedGoals types from weekly-stats.types.ts
provides:
  - formatWeekLabel: German KW-format week label from Monday date
  - calcMacroPercent: macro goal percentage averaged over logged days
  - toChartData: maps DayStats[] to ChartDataPoint[] with stub support
  - CHART_COLORS: explicit HSL strings for Recharts SVG (success/destructive/muted, light/dark)
  - DAY_LABELS: German short day names ["Mo","Di","Mi","Do","Fr","Sa","So"]
affects: [03-statistics-ui plan 02 (presentational components)]

# Tech tracking
tech-stack:
  added: [recharts@^2.15.4]
  patterns: [TDD red-green, explicit HSL for Recharts SVG, LLL format with trailing-dot strip for German months]

key-files:
  created:
    - src/utils/stats.utils.ts
    - src/utils/__tests__/stats.utils.test.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Use LLL date-fns format (not MMM) for German month abbreviations — avoids full inflected form (März vs Mär)"
  - "Strip trailing dot from LLL output for months like Jan. to ensure clean label format"
  - "STUB_HEIGHT = 24 kcal-unit height for unlogged day bars — consistent with design decision from Phase 2"
  - "CHART_COLORS hardcodes HSL values from index.css — CSS variables cannot be resolved inside Recharts SVG fill attributes"

patterns-established:
  - "LLL locale format + trailing dot strip for German short month names in labels"
  - "Explicit HSL strings (not CSS vars) for any value used in Recharts SVG attributes"

requirements-completed: [VIS-02, MAC-01, NAV-01]

# Metrics
duration: 2min
completed: 2026-03-13
---

# Phase 3 Plan 01: Statistics Utilities Summary

**recharts installed and pure stats helpers (formatWeekLabel, calcMacroPercent, toChartData, CHART_COLORS, DAY_LABELS) built TDD with 27 passing tests**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-13T09:08:57Z
- **Completed:** 2026-03-13T09:10:57Z
- **Tasks:** 3 (install + RED + GREEN)
- **Files modified:** 4

## Accomplishments

- recharts@^2.15.4 added to project dependencies
- 27 unit tests covering all 5 exports written first (TDD RED) and confirmed failing
- All 5 exports implemented, all 27 tests passing (TDD GREEN)
- `tsc --noEmit` clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Install recharts** - `eb29b5a` (chore)
2. **Task 2: TDD RED — failing tests** - `a38dac3` (test)
3. **Task 3: TDD GREEN — implementation** - `7d26f25` (feat)

_Note: TDD tasks have separate commits for RED (test) and GREEN (feat)_

## Files Created/Modified

- `src/utils/stats.utils.ts` - Pure helpers: formatWeekLabel, calcMacroPercent, toChartData, CHART_COLORS, DAY_LABELS, ChartDataPoint interface
- `src/utils/__tests__/stats.utils.test.ts` - 27 unit tests, 7 describe blocks
- `package.json` - Added recharts@^2.15.4 dependency
- `package-lock.json` - Updated lock file

## Decisions Made

- Used `LLL` date-fns format token instead of `MMM` for German localization: `MMM` returns inflected full abbreviation ("März"), `LLL` returns standalone form ("Mär").
- Strip trailing dot from `LLL` output since some German month abbreviations (e.g., "Jan.") include it.
- `CHART_COLORS` hardcodes HSL strings instead of using CSS variables because Recharts renders into SVG where CSS variable resolution does not work.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] formatWeekLabel used wrong date-fns format token for German months**
- **Found during:** TDD GREEN (implementation)
- **Issue:** `MMM` with `de` locale returns inflected form "März" instead of abbreviated "Mär", and "Jan." instead of "Jan"
- **Fix:** Switched to `LLL` format token and added trailing-dot strip for months that include it
- **Files modified:** src/utils/stats.utils.ts
- **Verification:** Both formatWeekLabel tests now pass (KW 11 and cross-year KW 1)
- **Committed in:** 7d26f25 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug in format token choice)
**Impact on plan:** Necessary for correct German month abbreviations. No scope creep.

## Issues Encountered

date-fns German locale `MMM` format produces different output than expected by the plan spec. `LLL` (standalone form) with trailing-dot strip produces the correct "Mär", "Jan" etc. abbreviations.

## Next Phase Readiness

- All pure utility functions ready for Plan 02 (presentational components)
- `ChartDataPoint` interface exported and ready for bar chart component
- `CHART_COLORS` ready for use in Recharts `<Bar fill={...}>`
- recharts installed and ready for component development

---
*Phase: 03-statistics-ui*
*Completed: 2026-03-13*
