# Project Research Summary

**Project:** WFP — Weekly Statistics Page
**Domain:** Nutrition tracking — weekly calorie and macro statistics dashboard
**Researched:** 2026-03-12
**Confidence:** HIGH

## Executive Summary

This milestone adds a weekly statistics page to an existing React 18 + Firestore nutrition tracking app. All four research areas converge on the same conclusion: the core patterns needed (data fetching with TanStack Query, date math with date-fns, typed calculation in utility functions, dumb presentational components) are already established in the codebase — this feature follows existing grooves rather than introducing new ones. The single new dependency is `recharts@3.8.0`, which adds the bar chart primitive. Everything else (data layer, routing, navigation wiring) reuses what already exists.

The recommended approach is to build strictly bottom-up: define types first, implement pure calculation utilities second, wire the data-fetching hook third, then build presentational components, and wire navigation last. This order is dictated by the component dependency graph from architecture research and mirrors the build order already used for the meal-planning feature. The most important structural decision — to use a date-range Firestore query rather than 7 individual point reads — must be made in the data layer phase before any UI work begins.

The key risk is the gap between "7 individual queries (easy but wrong)" and "one range query (correct but requires a new repository function and a Firestore composite index)." A second risk is goal resolution: the app has two calorie goal sources (`UserProfile.targetCalories` and `WeeklyNutritionGoals.targetCalories`) and the statistics hook must resolve them via a shared utility, not by reading the profile directly. Both risks are well-understood and have clear prevention strategies; neither should block delivery if addressed in the data layer phase.

## Key Findings

### Recommended Stack

The existing stack is already decided and only one new library is needed. `recharts@3.8.0` is the clear choice for this use case: it has the highest adoption of any React chart library (3.6M+ weekly npm downloads), ships full TypeScript generics in v3 (no separate `@types` package), and provides `BarChart`, `Bar`, `ReferenceLine`, and `ResponsiveContainer` as first-class built-in primitives. Its composable component API is idiomatic React and consistent with the codebase style. The macro percentage display (Protein / Carbs / Fat as % of goal) should be rendered as Tailwind-width `<div>` progress bars — not a chart — because Recharts adds unnecessary complexity for a simple progress indicator.

**Core technologies:**
- `recharts@3.8.0`: bar chart with goal reference line — lightest full-featured chart library, React 18 + TypeScript 5.x confirmed compatible
- `React 18 / TanStack Query 5` (existing): parallel data fetching via `useQueries` — already in use for meal planning
- `date-fns 4.1` (existing): ISO week calculation via `startOfISOWeek`, `eachDayOfInterval` — consistent with existing Firestore date key format
- `Firebase Firestore` (existing): MealPlan and WeeklyNutritionGoals collections — existing repositories cover both

### Expected Features

**Must have (table stakes — launch with v1):**
- Calorie bar chart (Mon–Sun, one bar per day) — the primary reason to open a stats page
- Daily goal reference line on the chart — makes bars meaningful; without it they are uninterpretable
- Week navigation (prev/next) with current week label — users cannot review the past without this
- Three summary cards: total calories consumed, cumulative deficit/surplus, total sport calories burned
- Macro weekly averages (Protein / Carbs / Fat as % of daily goal, averaged over logged days only)
- Graceful empty state for missing days — chart must distinguish "no entry" from "ate nothing"
- Navigation entry in bottom nav and sidebar — the page is invisible without it

**Should have (add after v1 validation):**
- Color-coded bars (green = deficit, red = surplus) — low implementation cost, high visual clarity
- "Days logged" counter in summary (e.g., "4/7 Tage erfasst")
- Net calorie bars (stacked/grouped showing eaten vs. goal+sport)

**Defer (v2+):**
- Stomach pain heatmap overlay — data exists in the type, but needs its own design pass
- Month view — separate milestone; adds significant data load and layout complexity
- Week-over-week comparison — doubles data load, ambiguous with missing days

### Architecture Approach

The feature follows a strict four-layer architecture: a Firestore data layer (existing repositories), a hook layer (`useWeeklyStats`), a pure utility layer (`stats.utils.ts`), and dumb presentational components. All data fetching lives in the hook; all calculation logic lives in utility functions; components receive pre-computed typed props and render nothing else. This is identical to the pattern used for the meal-planning feature and makes every calculation function independently testable. The hook uses `useQueries` from TanStack Query to fire all 7 daily queries (or 1 range query) in parallel.

**Major components:**
1. `WeeklyStatsPage` (smart) — manages `weekStartDate` state, composes all sub-sections, no business logic
2. `useWeeklyStats(weekStartDate)` (hook) — parallel-fetches 7 MealPlans + WeeklyGoals, derives `DayStats[]` and `WeeklySummary`
3. `stats.utils.ts` (pure utilities) — `buildWeekDates`, `computeDayStats`, `computeWeeklySummary`, `formatWeekLabel`
4. `CaloriesBarChart` (dumb) — Recharts `BarChart` + `ReferenceLine`, receives `DayStats[]` + `targetCalories`
5. `SummaryCards` (dumb) — renders 3 KPI cards, receives `WeeklySummary`
6. `MacroAverageSection` (dumb) — renders macro % progress bars using Tailwind widths, no Recharts
7. `WeekNavBar` (dumb) — prev/next buttons + week label, receives `weekStartDate` + `onNavigate` callback

### Critical Pitfalls

1. **7 individual Firestore reads instead of a range query** — add `getMealPlansByDateRange(start, end)` to the repository with a compound `where("date", ">=", ...) + where("date", "<=", ...)` query; create the required Firestore composite index on `[createdBy, date]` before first deploy. Never reuse `useMealPlanByDate` 7 times.

2. **Missing days treated as zero instead of "no data"** — build the 7-slot data structure from the calendar week first, then left-join MealPlan documents. `DayStats` must have an explicit `hasData: boolean` flag from the start; missing days must be visually distinct in the chart and excluded from weekly averages and deficit calculations.

3. **Wrong calorie goal source** — the app has two goal sources (`UserProfile.targetCalories` and `WeeklyNutritionGoals.targetCalories`). Extract a `resolveCalorieGoal(profile, weeklyGoals)` utility and use it exclusively in `useWeeklyStats`. Never read `UserProfile.targetCalories` directly in the hook.

4. **Recharts in the main bundle** — the statistics page must be route-lazy-loaded in `App.tsx` (consistent with existing pattern). Recharts then lands in the split chunk for the statistics route, not the main bundle. Verify with `vite build` output before considering the phase done.

5. **Stale week cache after meal plan mutations** — define the week-level React Query key as `["mealPlans", "week", weekStartDate]` nested under `["mealPlans"]` so existing `invalidateQueries({ queryKey: ["mealPlans"] })` calls in mutation hooks cascade correctly. Do not invent a disconnected key hierarchy.

## Implications for Roadmap

Based on combined research, the build order is clear from dependencies. There are no ambiguous sequencing decisions.

### Phase 1: Foundation — Types, Utilities, and Data Layer

**Rationale:** Everything else depends on the types and calculation utilities being defined first. The Firestore range query and composite index must exist before any UI can render real data. Getting goal resolution right here prevents a hard-to-fix bug later.
**Delivers:** `stats.types.ts` (DayStats, WeeklySummary), `stats.utils.ts` (pure calculation functions), `getMealPlansByDateRange` repository function, `resolveCalorieGoal` utility, Firestore composite index deployed.
**Addresses:** Table-stakes features: calorie data, deficit calculation, macro averages, sport calories.
**Avoids:** All four data-layer pitfalls (range query, missing days, goal resolution, cache key hierarchy).

### Phase 2: Hook — useWeeklyStats

**Rationale:** The hook is the single composition point for data and calculation. It must be complete and tested before any component can display real numbers.
**Delivers:** `useWeeklyStats(weekStartDate)` hook using `useQueries` for parallel fetching, full `DayStats[]` and `WeeklySummary` output, correct `staleTime` configuration.
**Uses:** `stats.utils.ts` from Phase 1, existing `getMealPlansByDateRange`, existing `useWeeklyNutritionGoals`.
**Implements:** Hook layer from architecture.

### Phase 3: Presentational Components

**Rationale:** Once the hook provides typed, correct data, all four presentational components can be built in parallel — they have no dependencies on each other.
**Delivers:** `CaloriesBarChart` (Recharts bar chart + reference line), `SummaryCards` (3 KPI cards), `MacroAverageSection` (Tailwind progress bars), `WeekNavBar` (prev/next navigation).
**Uses:** `recharts@3.8.0` (must be installed first: `npm install recharts@3.8.0`), Tailwind tokens for colors, `DayStats[]` and `WeeklySummary` types from Phase 1.
**Implements:** All dumb component layer from architecture.

### Phase 4: Page Assembly and Navigation Wiring

**Rationale:** The page container and navigation changes touch existing shared files (App.tsx, Sidebar.tsx, MobileTabBar.tsx) and should come last to minimize merge risk.
**Delivers:** `WeeklyStatsPage` composing all components, `/statistics` route with `React.lazy()` lazy-load, nav entries in sidebar and mobile tab bar, empty-week state.
**Avoids:** Recharts bundle bloat pitfall (lazy-load enforced here), cache invalidation pitfall (verify mutation hooks cascade to week queries).
**Verification:** `vite build` output checked to confirm Recharts in statistics chunk only; Lighthouse score on home route unchanged.

### Phase Ordering Rationale

- Types must precede utilities; utilities must precede the hook; the hook must precede components; components must precede the page. This is a strict dependency chain with no shortcuts.
- Presentational components in Phase 3 can all be built in parallel since they share only the type contracts established in Phase 1.
- Navigation wiring is last because it touches shared layout files — isolating these changes reduces risk of breaking the existing app.
- Installing `recharts@3.8.0` is a prerequisite for Phase 3, but can happen any time before Phase 3 begins.

### Research Flags

Phases with standard patterns (skip research-phase):
- **Phase 1 (data layer):** Firestore range queries and composite indexes are well-documented. The pattern is identical to existing repository functions.
- **Phase 2 (hook):** `useQueries` parallel fetching is standard TanStack Query v5 — documented pattern, no ambiguity.
- **Phase 3 (components):** Recharts `BarChart` + `ReferenceLine` is straightforward. The macro progress bars use only Tailwind utilities.
- **Phase 4 (assembly):** Route lazy-loading, nav wiring, and page composition all follow existing app patterns exactly.

No phases require a deeper `/gsd:research-phase` pass. All patterns are well-documented with high-confidence sources.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | recharts@3.8.0 confirmed on npm; React 18 + TypeScript 5.x peer dep verified; no other new libraries needed |
| Features | HIGH | Competitor analysis (MyFitnessPal, Cronometer, CaliCalo) + direct codebase inspection of existing types and utilities |
| Architecture | HIGH | Based on direct codebase analysis of existing hooks, repositories, and component patterns |
| Pitfalls | HIGH | Based on direct analysis of actual codebase files (repository, hook, types, utils); pitfalls are grounded in the real code, not hypothetical |

**Overall confidence: HIGH**

### Gaps to Address

- **"Missing" vs. "empty" day distinction:** Pitfalls research recommends distinguishing three day states (`logged`, `empty`, `missing`). The correct visual treatment for each state (chart bar style, inclusion in averages) should be confirmed with Sebastian before implementation — specifically whether a logged-but-no-food day should count in the denominator for macro averages.
- **`WeeklyNutritionGoals` null macro fields:** When a per-macro goal is `null`, the macro percentage bar should show a "no goal set" state rather than 0%. The exact UX for this state is not specified and should be defined during Phase 3 implementation.
- **Range query vs. 7 individual queries:** Architecture research notes that 7 parallel Firestore reads is acceptable for a personal app on the free tier. Pitfalls research recommends a range query as the correct approach. The implementation should start with the range query (correct approach) and not take the 7-reads shortcut even for speed.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: `src/hooks/useMealPlans.ts`, `src/repositories/mealplan.repository.ts`, `src/utils/nutrition.utils.ts`, `src/types/mealplan.types.ts`, `src/types/weekly-goals.types.ts`, `src/components/layout/` — architecture and pitfall findings
- [recharts npm page](https://www.npmjs.com/package/recharts) — version 3.8.0 confirmed
- [recharts GitHub releases](https://github.com/recharts/recharts/releases) — 3.8.0 released March 6, 2025
- [recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide) — breaking changes verified
- Firestore documentation — composite index requirement for multi-field range queries
- TanStack React Query v5 — `useQueries` parallel queries pattern

### Secondary (MEDIUM confidence)
- [LogRocket React chart libraries comparison 2025](https://blog.logrocket.com/best-react-chart-libraries-2025/) — bundle size and feature comparison used to select recharts over alternatives
- [MyFitnessPal Weekly Digest](https://support.myfitnesspal.com/hc/en-us/articles/360032622591-Weekly-Digest) — weekly stats feature patterns
- [Cronometer vs. MyFitnessPal (Katelynn Nutrition)](https://www.katelynannutrition.com/blog/cronometer-vs-mfp) — feature comparison
- [CaliCalo App Store listing](https://apps.apple.com/us/app/calicalo-watch-your-calories/id1205082048) — 7-day net calories graph pattern

---
*Research completed: 2026-03-12*
*Ready for roadmap: yes*
