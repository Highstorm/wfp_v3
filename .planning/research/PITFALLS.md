# Pitfalls Research

**Domain:** Weekly statistics page with charts — React + Firestore nutrition tracking app
**Researched:** 2026-03-12
**Confidence:** HIGH (based on direct codebase analysis + established React/Firestore patterns)

## Critical Pitfalls

### Pitfall 1: 7 Separate Firestore Reads Instead of a Date-Range Query

**What goes wrong:**
The week view fetches each day's MealPlan individually by calling `getMealPlanByDate()` seven times in a loop. Each call is a separate Firestore query with its own round-trip. On slow mobile connections, the page can take 2-4 seconds to render the chart, and Firestore bills 7 read operations per page load instead of 1.

**Why it happens:**
The existing `useMealPlanByDate(date)` hook queries by exact date string — the obvious way to reuse existing infrastructure is to call it 7 times. Developers reach for what's already working.

**How to avoid:**
Add a new repository function `getMealPlansByDateRange(startDate: string, endDate: string)` using a Firestore compound query with `where("date", ">=", startDate)` and `where("date", "<=", endDate)`. This requires a composite index on `(createdBy, date)` in Firestore — create the index in `firestore.indexes.json` or the console before deploying. Wrap it in a single `useQuery` hook with cache key `["mealPlans", "week", weekStartDate]`.

**Warning signs:**
- Network tab in DevTools shows 7 Firestore requests firing in parallel on week load
- Slow initial render on the statistics page relative to day planning page
- React Query devtools shows 7 separate query keys for `["mealPlans", "byDate", ...]`

**Phase to address:**
Data layer phase — design the repository function before building any UI.

---

### Pitfall 2: Computing Statistics Directly in the Component

**What goes wrong:**
Calorie totals, macro percentages, deficit calculation, and sport calories are computed inline inside the statistics component using `.reduce()` calls scattered through JSX. When the week navigation changes, React re-computes all aggregates on every render — including re-renders triggered by unrelated state (hover state on a chart bar, tooltip visibility). The logic is also untestable.

**Why it happens:**
The existing `nutrition.utils.ts` functions return data per MealPlan. It's tempting to loop over 7 plans and call `calculateTotalMealPlanNutrition(plan)` inline in the component. The jump to aggregating further (weekly averages, cumulative deficit) happens incrementally without noticing the computation cost.

**How to avoid:**
Put all week-level aggregations in a dedicated `useWeeklyStats(weekStartDate)` hook that derives from the raw MealPlan query data. Use `useMemo` inside the hook to prevent recomputation on unrelated renders. Expose typed output (`WeeklyStats`) with fields `dailyCalories`, `avgMacroPercents`, `totalSportCalories`, `cumulativeDeficit`. Use the existing `calculateTotalMealPlanNutrition()` and `calculateTotalBurnedCalories()` from `nutrition.utils.ts` as building blocks — don't reimplement.

**Warning signs:**
- Calculation logic is more than 5 lines inside a component's render body
- The deficit formula `(targetCalories + sportCalories) - eatenCalories` appears in JSX rather than a utility
- No unit tests possible for the aggregation logic

**Phase to address:**
Data layer / hook phase — implement `useWeeklyStats` before wiring any chart component.

---

### Pitfall 3: Missing Days Treated as Zero Instead of "No Data"

**What goes wrong:**
If Sebastian hasn't logged food on a given day (common on Sundays or travel days), no MealPlan document exists for that date. The bar chart renders a `0 kcal` bar — visually identical to "ate nothing" — when the correct interpretation is "no entry". Summary cards show a weekly average that is deflated by the missing days, making the deficit look larger than it is.

**Why it happens:**
The Firestore query returns only documents that exist. Iterating over results and mapping by date leaves gaps for missing dates. Developers fill gaps with `|| 0` as a default.

**How to avoid:**
Build the 7-day data structure from the calendar week first (Mo–So using date-fns `eachDayOfInterval`), then left-join MealPlan documents into it. Distinguish three states per day: `"logged"` (plan exists), `"empty"` (plan exists but has no dishes), `"missing"` (no plan document). For `"missing"` days: render the bar at 0 height but in a muted/striped style; exclude them from weekly averages and cumulative deficit. Confirm the intended behavior with Sebastian before implementing.

**Warning signs:**
- A week with 5 logged days shows an average lower than the 5-day average
- Chart bars for missing days look identical to days where 0 kcal was logged
- No conditional branch distinguishing `null` (missing plan) from a plan with 0 dishes

**Phase to address:**
Data layer + chart rendering phase — define the `DayStats` type with an explicit `hasData: boolean` flag from the start.

---

### Pitfall 4: Goal Resolution Complexity Hidden Inside the Statistics Hook

**What goes wrong:**
The app has two sources for calorie/macro goals: `UserProfile.targetCalories` (global default) and `WeeklyNutritionGoals.targetCalories` (per-week override, if `weeklyNutritionGoalsEnabled` is true). The statistics hook or component picks one source without considering the feature flag, resulting in wrong reference lines on the bar chart or incorrect deficit calculations for weeks where Sebastian used a week-specific goal.

**Why it happens:**
The day planning page already resolves this somewhere, but its goal resolution logic is buried in `useMealPlanFormState`. The statistics page developer reads the profile directly, not realizing there is a per-week override.

**How to avoid:**
Extract a reusable `resolveCalorieGoal(profile: UserProfile, weeklyGoals: WeeklyNutritionGoals | null): number` utility function in `nutrition.utils.ts` (or a new `goals.utils.ts`). The `useWeeklyStats` hook calls this utility — it never reads `UserProfile.targetCalories` directly. This same function should be used in the day planning hook to avoid drift.

**Warning signs:**
- The statistics hook imports `UserProfile` and accesses `.targetCalories` directly
- The reference line on the bar chart shows 2000 kcal even though Sebastian set a week-specific goal of 1800 kcal
- Two separate goal-resolution code paths exist in hooks

**Phase to address:**
Data layer / hook phase — resolve goal sourcing before any visual work.

---

### Pitfall 5: Recharts Bundle Bloat on Initial Load

**What goes wrong:**
Recharts is ~250 KB minified (pre-gzip). If imported at the top of the statistics page component without lazy-loading, it enters the main bundle. The day planning page (the home route) pays the chart penalty on every load even though Sebastian may never visit the statistics page.

**Why it happens:**
The app already uses `React.lazy()` for route-level code splitting (confirmed in `App.tsx` with lazy-loaded components). But within the statistics page component, chart components are imported at the top level, bypassing the route split.

**How to avoid:**
The statistics page itself should be route-lazy-loaded (consistent with existing pattern in `App.tsx`). Within the statistics page, import Recharts components directly — they will be bundled into the lazy chunk for the statistics route, not the main bundle. Do not import Recharts in any component that is part of the main bundle. Verify with `vite build --report` or `rollup-plugin-visualizer` after implementation.

**Warning signs:**
- `vite build` output shows Recharts in the main chunk rather than a split chunk
- The home/day-planning route's Lighthouse score drops after adding the statistics page
- Statistics route is not wrapped in `React.lazy()` in `App.tsx`

**Phase to address:**
UI / chart rendering phase — check bundle output before considering the phase done.

---

### Pitfall 6: Week Navigation Causes Stale Cache Cross-Contamination

**What goes wrong:**
Navigating from week A to week B and back to week A shows stale data if a MealPlan was logged in week A during the browsing session. React Query's cache key for the week query `["mealPlans", "week", weekStartDate]` is not invalidated when individual meal plans change via the existing `useCreateMealPlan` / `useUpdateMealPlan` hooks.

**Why it happens:**
The mutation hooks in `useMealPlans.ts` invalidate `["mealPlans"]` broadly, but the new week-level query key is scoped differently. The invalidation logic does not know about the new key.

**How to avoid:**
In `useCreateMealPlan` and `useUpdateMealPlan`, add invalidation of the week-level query: `queryClient.invalidateQueries({ queryKey: ["mealPlans", "week"] })` (without the specific date — this invalidates all week queries). Alternatively, use React Query's `queryClient.invalidateQueries({ queryKey: ["mealPlans"] })` which already exists and would cascade if the week key is nested under `["mealPlans"]`. Confirm the key hierarchy is consistent.

**Warning signs:**
- Logging food on Monday and then visiting the weekly stats still shows the pre-log calorie total
- After saving a meal plan and navigating to stats, the chart bar for today has not updated
- Week navigation back to current week shows old data

**Phase to address:**
Data layer / hook phase — define the query key hierarchy before writing any queries.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Reuse `useMealPlanByDate` 7 times | No new repository code | 7x Firestore reads per page load, 7 cache entries | Never — add the range query |
| Inline deficit calculation in JSX | Faster to write | Untestable, duplicated if dashboard adds summary cards later | Never |
| Skip `"missing"` vs `"empty"` distinction | Simpler initial code | Wrong weekly averages, misleading chart | Acceptable only if all 7 days are always logged (they aren't) |
| Hard-code `UserProfile.targetCalories` as goal | Avoids goal resolution complexity | Wrong reference line when week-goals feature is enabled | Never — Sebastian has `weeklyNutritionGoalsEnabled` |
| Import Recharts in page component without checking bundle | Faster to implement | Main bundle grows, home page slows down | Never — route lazy-loading is already the established pattern |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Firestore date range query | Using JS `Date` objects in `where()` clauses | Use ISO date strings (`"YYYY-MM-DD"`) — all existing MealPlan documents store `date` as a string, not a Timestamp |
| Firestore composite index | Running `where("createdBy", ...) + where("date", ">=", ...)` without a composite index | Create the index in `firestore.indexes.json` before first deploy; Firestore throws a specific error with a console link to create it |
| Recharts responsive containers | Fixed-width chart inside a flex/grid parent | Wrap every chart in `<ResponsiveContainer width="100%" height={...}>` — without it, chart collapses to 0px on mobile |
| React Query + Firestore | Using `staleTime: 0` (default) on week data | Set `staleTime: 5 * 60 * 1000` on the week query — week data changes infrequently, no need to refetch on every tab focus |
| `WeeklyNutritionGoals` nullable fields | Treating `null` protein/carbs/fat goals as `0` | `null` means "goal not set" — the macro percentage bar should render as "no goal" state, not "0% achievement" |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| 7 individual date queries | 7 network requests visible in DevTools, slow chart render | Single range query in new repository function | Every page load — immediately noticeable |
| No `staleTime` on week query | Network request fires every time user switches tab back to stats page | Set `staleTime: 5min` on week query | Noticeable on repeated navigation within a session |
| Recharts re-rendering on tooltip hover | Chart re-renders entire component tree on bar hover | Keep chart data in `useMemo`, avoid passing inline objects as props to Recharts components | With 7 bars + 2 datasets this is minor but avoidable |
| Missing days deflating averages | Wrong weekly average, Sebastian sees false deficit numbers | Explicit `hasData` flag, exclude missing days from averages | Every week with at least one unlogged day |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Week query without `createdBy` filter | Any authenticated user could query another user's MealPlans by guessing date strings | The new `getMealPlansByDateRange` must include `where("createdBy", "==", auth.currentUser.uid)` — same pattern as all existing repository functions |
| Exposing sport calories from Intervals.icu credentials in aggregated data | Low — data stays client-side | Not a concern for this feature, but `intervals.icu-API-KEY` is already in UserProfile in Firestore — ensure it is never included in stats API responses |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading skeleton for chart | Page shows blank area for 1-2 seconds while 7 plans load | Render 7 grey placeholder bars at fixed height during loading state |
| Week navigation without clear "current week" indicator | Sebastian cannot tell which week he is viewing at a glance | Show ISO week number + date range (e.g. "KW 11 — 10.–16. März") in the header |
| Macro % bars without goal context | "72% Protein" is meaningless without knowing the goal in grams | Show goal gram value in tooltip: "72% — 108g of 150g goal" |
| Summary cards showing inflated deficit on partial weeks | Current week on Friday shows 4-day deficit, looks worse than full weeks | Label partial weeks explicitly: "4 von 7 Tagen erfasst" |
| Chart bar for today appears identical to past days | Cannot distinguish "today, still eating" from "completed day" | Highlight today's bar with a distinct color or pattern |

---

## "Looks Done But Isn't" Checklist

- [ ] **Week range query:** Does it include a `createdBy` filter? Run with two test user accounts to verify isolation.
- [ ] **Missing days:** Does the chart show a visually distinct state for unlogged days vs. logged 0-calorie days?
- [ ] **Goal resolution:** Does the reference line use `WeeklyNutritionGoals` when `weeklyNutritionGoalsEnabled` is true in the profile?
- [ ] **Macro percentages:** What renders when a macro goal is `null`? Verify no division-by-zero and no "0%" false result.
- [ ] **Bundle:** Does `vite build` output show Recharts in the statistics route chunk, not the main bundle?
- [ ] **Cache invalidation:** After saving a new meal plan, does navigating to the statistics page reflect the change?
- [ ] **Sport calories:** Is `calculateTotalBurnedCalories(plan.sports)` used, or is sport calories re-implemented inline?
- [ ] **Week navigation:** Does navigating to previous/next week update the Firestore query (not just client-side state)?

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| 7 individual queries shipped to production | LOW | Add `getMealPlansByDateRange`, new hook, swap query in stats component, deploy |
| Calculation logic in component | MEDIUM | Extract to `useWeeklyStats` hook, add tests, refactor component to consume hook |
| Missing days treated as zero | MEDIUM | Add `hasData` flag to `DayStats` type, update all consumers (chart, summary cards, averages) |
| Wrong goal source | LOW | Add `resolveCalorieGoal` utility, update hook to use it, test against week with custom goals |
| Recharts in main bundle | LOW | Verify statistics route is lazy-loaded in `App.tsx` — if it is, Recharts is already in the split chunk |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 7 individual queries | Data layer phase (repository + hook) | Check React Query devtools: single query key `["mealPlans", "week", date]` |
| Calculation in component | Data layer phase (hook) | `useWeeklyStats` hook exists and is covered by unit tests |
| Missing days as zero | Data layer phase (type definition) | `DayStats` type has `hasData: boolean`; chart has distinct empty-day rendering |
| Wrong goal resolution | Data layer phase (utility) | `resolveCalorieGoal` utility exists; reference line matches week-specific goal |
| Recharts bundle bloat | UI phase (post-build check) | `vite build` output shows Recharts only in the stats chunk |
| Stale cache after mutation | Data layer phase (query keys) | After creating a meal plan, stats page shows updated data without refresh |
| Missing Firestore composite index | Data layer phase (deploy) | First deploy to staging with new range query succeeds without Firestore index error |

---

## Sources

- Direct analysis of `/src/repositories/mealplan.repository.ts` — confirmed `date` stored as string, no range query exists
- Direct analysis of `/src/hooks/useMealPlans.ts` — confirmed invalidation keys, no week-level key
- Direct analysis of `/src/types/mealplan.types.ts`, `profile.types.ts`, `weekly-goals.types.ts` — confirmed nullable goal fields and goal duality
- Direct analysis of `/src/utils/nutrition.utils.ts` — confirmed existing utility functions to reuse
- Direct analysis of `/package.json` — confirmed Recharts is NOT yet installed (no chart library in dependencies)
- Firestore documentation: composite index requirement for multi-field range queries (HIGH confidence)
- Recharts documentation: bundle size ~250 KB minified, `ResponsiveContainer` required for mobile (MEDIUM confidence — based on Recharts 2.x, current version)
- React Query v5 cache invalidation patterns: broad key invalidation cascades to partial-match sub-keys (HIGH confidence)

---
*Pitfalls research for: Weekly statistics page — React + Firestore nutrition tracking*
*Researched: 2026-03-12*
