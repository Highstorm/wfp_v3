# Architecture Research

**Domain:** Weekly statistics dashboard in React + Firestore nutrition tracker
**Researched:** 2026-03-12
**Confidence:** HIGH (based on direct codebase analysis + established patterns)

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────┐
│                    Presentation Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              WeeklyStatsPage (page container)            │  │
│  │  ┌────────────────┐  ┌────────────────────────────────┐  │  │
│  │  │  WeekNavBar    │  │      Summary Cards             │  │  │
│  │  │ (week picker)  │  │  (calories / deficit / sport)  │  │  │
│  │  └────────────────┘  └────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │         CaloriesBarChart (Recharts)                │  │  │
│  │  │     (Mo-So bars + target reference line)           │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │         MacroAverageSection                        │  │  │
│  │  │   (Protein / KH / Fett as % of daily target)       │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────┤
│                    Hook / Logic Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              useWeeklyStats(weekStartDate)               │  │
│  │  - fetches 7 MealPlan docs + WeeklyGoals in parallel     │  │
│  │  - derives DayStats[] via stats.utils.ts                 │  │
│  │  - exposes computed WeeklySummary                        │  │
│  └──────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────┤
│                    Utility / Calculation Layer                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │   stats.utils.ts                                         │  │
│  │   - buildWeekDates(weekStartDate): string[]              │  │
│  │   - computeDayStats(mealPlan, goals): DayStats           │  │
│  │   - computeWeeklySummary(dayStats[]): WeeklySummary      │  │
│  │   - formatWeekLabel(date): string                        │  │
│  └──────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────┤
│                    Repository / Data Layer                      │
│  ┌──────────────────────────┐  ┌───────────────────────────┐  │
│  │  mealplan.repository.ts  │  │  weekly-goals.repository  │  │
│  │  getMealPlanByDate()     │  │  getWeeklyNutritionGoals() │  │
│  │  (already exists)        │  │  (already exists)          │  │
│  └──────────────────────────┘  └───────────────────────────┘  │
├────────────────────────────────────────────────────────────────┤
│                    Firebase / Firestore                         │
│  ┌──────────────────────────┐  ┌───────────────────────────┐  │
│  │  mealPlans collection    │  │  weeklyNutritionGoals      │  │
│  │  (7 docs per week)       │  │  collection                │  │
│  └──────────────────────────┘  └───────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `WeeklyStatsPage` | Page container; manages selected week state; composes all sub-sections | Feature page component in `src/components/statistics/` |
| `WeekNavBar` | Displays current calendar week label; prev/next week buttons | Stateless, receives `weekStartDate` + `onNavigate` as props |
| `SummaryCards` | Renders 3 KPI cards: total calories, cumulative deficit/surplus, total sport calories | Stateless, receives `WeeklySummary` as props |
| `CaloriesBarChart` | Recharts `BarChart` with daily calorie bars and a `ReferenceLine` for the daily calorie target | Stateless, receives `DayStats[]` + `targetCalories` as props |
| `MacroAverageSection` | Shows protein/KH/fat as % of daily target (average over logged days) | Stateless, receives `WeeklySummary.macroAverages` as props |
| `useWeeklyStats` | Parallel-fetches 7 meal plans + weekly goals for the selected week via React Query; derives all computed values | Custom hook in `src/hooks/` wrapping `useMealPlanByDate` x7 + `useWeeklyNutritionGoals` |
| `stats.utils.ts` | Pure calculation functions: date range building, per-day stats, weekly rollup | Utility in `src/utils/` — no side effects, fully testable |

## Recommended Project Structure

```
src/
├── components/
│   └── statistics/               # new feature directory
│       ├── WeeklyStatsPage.tsx   # page container (smart)
│       ├── WeekNavBar.tsx        # week navigation (dumb)
│       ├── SummaryCards.tsx      # KPI summary cards (dumb)
│       ├── CaloriesBarChart.tsx  # Recharts bar chart (dumb)
│       └── MacroAverageSection.tsx # macro % display (dumb)
├── hooks/
│   └── useWeeklyStats.ts         # new hook (data + computation)
├── utils/
│   └── stats.utils.ts            # new pure calculation functions
└── types/
    └── stats.types.ts            # new: DayStats, WeeklySummary types
```

Navigation changes (touch existing files):
```
src/
├── App.tsx                       # add /statistics route + lazy import
├── components/layout/
│   ├── MobileTabBar.tsx          # add statistics tab entry
│   └── Sidebar.tsx               # add statistics nav entry
```

### Structure Rationale

- **statistics/ feature directory:** Follows the established pattern of co-locating feature components (`meal-planning/`, `dishes/`, `porridge/`). All statistics UI lives here.
- **useWeeklyStats.ts in hooks/:** Follows the existing convention where hooks wrap repositories + React Query. Keeps component files lean.
- **stats.utils.ts in utils/:** Calculation logic is pure and domain-specific. Mirrors `nutrition.utils.ts` which already handles dish/macro math. Isolating it here makes it trivially testable and reusable.
- **stats.types.ts in types/:** Consistent with `mealplan.types.ts`, `weekly-goals.types.ts` — dedicated type file per domain.

## Architectural Patterns

### Pattern 1: Parallel Query Fetching with React Query

**What:** Fetch the 7 daily meal plans and the weekly goal concurrently using multiple `useQuery` calls (or `useQueries`) inside a single custom hook.
**When to use:** When data for a week must be assembled from 7 independent Firestore documents. Loading them sequentially would be 7x slower.
**Trade-offs:** `useQueries` returns an array; the hook must synthesize loading/error states across all 7 results. Worth it for perceived performance.

**Example:**
```typescript
// src/hooks/useWeeklyStats.ts
import { useQueries } from "@tanstack/react-query";
import { useWeeklyNutritionGoals } from "./useWeeklyGoals";
import { getMealPlanByDate } from "../repositories/mealplan.repository";
import { buildWeekDates, computeDayStats, computeWeeklySummary } from "../utils/stats.utils";

export const useWeeklyStats = (weekStartDate: string) => {
  const dates = buildWeekDates(weekStartDate); // ["2026-03-09", ..., "2026-03-15"]

  const mealPlanQueries = useQueries({
    queries: dates.map((date) => ({
      queryKey: ["mealPlans", "byDate", date],
      queryFn: () => getMealPlanByDate(date),
      enabled: !!weekStartDate,
    })),
  });

  const { data: goals } = useWeeklyNutritionGoals(weekStartDate);

  const isLoading = mealPlanQueries.some((q) => q.isLoading);
  const isError = mealPlanQueries.some((q) => q.isError);

  const dayStats = mealPlanQueries.map((q, i) =>
    computeDayStats(dates[i], q.data ?? null, goals ?? null)
  );

  const summary = computeWeeklySummary(dayStats);

  return { dayStats, summary, goals, isLoading, isError };
};
```

### Pattern 2: Derived State in Utility Functions (not in components)

**What:** All calorie/macro/deficit calculations happen in `stats.utils.ts` as pure functions that receive raw data and return typed result objects. Components receive pre-computed values as props.
**When to use:** Whenever computation logic is non-trivial (deficit formula = (goal + sport) - eaten) and must be consistent across multiple display components.
**Trade-offs:** Adds a utils file but eliminates duplicated inline math and makes computation independently testable.

**Example:**
```typescript
// src/utils/stats.utils.ts
import { calculateTotalMealPlanNutrition, calculateTotalBurnedCalories } from "./nutrition.utils";
import type { MealPlan } from "../types";
import type { WeeklyNutritionGoals } from "../types/weekly-goals.types";
import type { DayStats, WeeklySummary } from "../types/stats.types";
import { startOfWeek, addDays, format } from "date-fns";

export function buildWeekDates(weekStartDate: string): string[] {
  const start = new Date(weekStartDate);
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(start, i), "yyyy-MM-dd")
  );
}

export function computeDayStats(
  date: string,
  mealPlan: MealPlan | null,
  goals: WeeklyNutritionGoals | null
): DayStats {
  const nutrition = mealPlan ? calculateTotalMealPlanNutrition(mealPlan) : null;
  const sportCalories = mealPlan ? calculateTotalBurnedCalories(mealPlan.sports) : 0;
  const targetCalories = goals?.targetCalories ?? 0;
  const deficit = nutrition
    ? (targetCalories + sportCalories) - nutrition.calories
    : null;

  return { date, nutrition, sportCalories, targetCalories, deficit, hasData: !!mealPlan };
}
```

### Pattern 3: Dumb Presentational Components for Charts

**What:** `CaloriesBarChart`, `SummaryCards`, and `MacroAverageSection` are pure presentational components — they receive all data as typed props and render nothing else.
**When to use:** Chart components should never fetch their own data. This makes them reusable and prevents data-fetching logic from leaking into visual components.
**Trade-offs:** Requires careful prop interface design upfront, but avoids hidden side effects in chart components.

## Data Flow

### Request Flow

```
User lands on /statistics (or navigates week)
    ↓
WeeklyStatsPage: sets weekStartDate state (date-fns startOfWeek)
    ↓
useWeeklyStats(weekStartDate)
    ↓
useQueries → 7x getMealPlanByDate() + useWeeklyNutritionGoals()
    ↓                                  ↓
Firestore mealPlans collection    Firestore weeklyNutritionGoals
    ↓
mealPlanQueries[].data + goals.data arrive
    ↓
computeDayStats() × 7 (pure, in stats.utils.ts)
    ↓
computeWeeklySummary() (pure, in stats.utils.ts)
    ↓
{ dayStats[], summary, isLoading } returned to WeeklyStatsPage
    ↓
Props passed down to SummaryCards, CaloriesBarChart, MacroAverageSection
    ↓
React renders UI
```

### State Management

```
weekStartDate (local useState in WeeklyStatsPage)
    ↓ (prop)
WeekNavBar → user clicks prev/next → calls setWeekStartDate
    ↓ (re-triggers)
useWeeklyStats re-runs with new weekStartDate
    ↓
React Query checks cache: cache hit = instant, miss = Firestore fetch
    ↓
Components re-render with new week data
```

### Key Data Flows

1. **Week navigation:** `weekStartDate` is local state in `WeeklyStatsPage`. `WeekNavBar` receives it plus an `onNavigate` callback. When the user taps prev/next, `WeekNavBar` calls `onNavigate(newDate)`, state updates, `useWeeklyStats` reruns, React Query serves from cache or fetches fresh.

2. **Goals fallback:** `useWeeklyNutritionGoals(weekStartDate)` may return null if no week-specific goal exists. `computeDayStats` handles this gracefully with a `targetCalories ?? 0` fallback. The chart still renders with bars but the reference line is hidden or at 0.

3. **Empty day handling:** Days with no logged meal plan return `null` from `getMealPlanByDate`. `computeDayStats` handles this by returning `{ hasData: false, nutrition: null, deficit: null }`. `CaloriesBarChart` can render these as empty/grey bars using the `hasData` flag.

4. **Cache sharing:** `getMealPlanByDate` uses query key `["mealPlans", "byDate", date]` — the same key already used in `useMealPlanByDate` for the day planning view. Any day the user has already visited is served instantly from React Query cache on the stats page.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single user (current) | 7 parallel Firestore reads per week view — fine, well within Firestore free tier |
| Multi-user personal app | No changes needed; all queries are already user-scoped via `createdBy` filter |
| If weeks grow to months | Add date-range query to repository: `getMealPlansByDateRange(start, end)` to replace 7 point lookups with one compound query; requires Firestore composite index on `[createdBy, date]` |

### Scaling Priorities

1. **First bottleneck:** 7 parallel Firestore reads is not a bottleneck for a personal app. If it became one, a `getMealPlansByDateRange` repository function with a single compound query would replace all 7.
2. **Second bottleneck:** Client-side computation in `stats.utils.ts` is O(7) — negligible. No optimization needed.

## Anti-Patterns

### Anti-Pattern 1: Fetching data inside chart components

**What people do:** Place `useQuery` or `useMealPlanByDate` calls directly inside `CaloriesBarChart` or `SummaryCards`.
**Why it's wrong:** Chart components become untestable, tightly coupled to Firestore, and cannot be reused with different data sources. It violates the dumb/smart component split that the existing codebase follows.
**Do this instead:** All data fetching in `useWeeklyStats` hook. Charts receive pre-computed props only.

### Anti-Pattern 2: Sequential (waterfall) Firestore fetches for the 7 days

**What people do:** `await getMealPlanByDate(day1)`, then `await getMealPlanByDate(day2)`, etc. in a loop.
**Why it's wrong:** 7 sequential network requests are 7x slower than parallel. On a slow connection this is the difference between 200ms and 1.4 seconds.
**Do this instead:** Use `useQueries` from TanStack React Query which fires all 7 queries in parallel.

### Anti-Pattern 3: Calculating deficit/macro-averages inline in JSX

**What people do:** Compute `(targetCalories + sportCalories) - eaten` directly inside component render functions.
**Why it's wrong:** Duplicated logic across components, untestable, hard to adjust the formula later (Sebastian has a specific deficit model).
**Do this instead:** All calculations in `stats.utils.ts` pure functions. Components receive pre-computed `DayStats` and `WeeklySummary` objects.

### Anti-Pattern 4: Duplicating the week-start date derivation

**What people do:** Derive "Monday of current week" from `new Date()` in multiple places using different approaches.
**Why it's wrong:** `date-fns` locale config affects `startOfWeek` (Sunday vs Monday). One inconsistent call breaks week alignment.
**Do this instead:** Single `buildWeekDates(weekStartDate)` utility function using `date-fns` with explicit `{ weekStartsOn: 1 }` option (Monday). Initial `weekStartDate` derived once in `WeeklyStatsPage` using the same helper.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Recharts | Import `BarChart`, `Bar`, `XAxis`, `YAxis`, `ReferenceLine`, `Tooltip` from `recharts` directly in `CaloriesBarChart.tsx` | No wrapper needed; pass `DayStats[]` mapped to `{ day: string, calories: number }` array |
| Firebase Firestore | Via existing repositories — no new Firestore code needed for basic stats | Repository layer already handles auth checks and data mapping |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `WeeklyStatsPage` → `useWeeklyStats` | Hook call, returns typed `{ dayStats, summary, isLoading, isError }` | Hook is the single data + computation boundary; page does no calculations |
| `useWeeklyStats` → repositories | Direct import of `getMealPlanByDate` (already exists) and `getWeeklyNutritionGoals` (already exists) | No new repository functions needed unless date-range query optimization is added later |
| `useWeeklyStats` → `stats.utils.ts` | Pure function calls; no async, no side effects | Utils are called synchronously after query data arrives |
| `nutrition.utils.ts` ← `stats.utils.ts` | `stats.utils.ts` imports and reuses `calculateTotalMealPlanNutrition` + `calculateTotalBurnedCalories` | Avoids duplicating nutrition math that already exists and is tested |
| Navigation (Sidebar + MobileTabBar) → `/statistics` | Add one entry to each `menuItems`/`tabs` array; follows existing `requiresFeature` guard pattern if needed | Minimal change; both nav components are data-driven arrays |

## Build Order Implications

The components have clear dependencies that dictate build order:

1. **Types first** (`stats.types.ts`) — `DayStats` and `WeeklySummary` interfaces needed by everything else.
2. **Utils second** (`stats.utils.ts`) — pure functions; depends only on existing `nutrition.utils.ts` and types.
3. **Hook third** (`useWeeklyStats.ts`) — depends on utils, types, and existing repositories.
4. **Presentational components** (`SummaryCards`, `CaloriesBarChart`, `MacroAverageSection`, `WeekNavBar`) — depend only on types, can be built in parallel with each other.
5. **Page container last** (`WeeklyStatsPage`) — composes everything above.
6. **Navigation wiring last** (`App.tsx`, `Sidebar.tsx`, `MobileTabBar.tsx`) — add route + nav entries once page is ready.

Recharts must be installed (`npm install recharts`) before step 4.

## Sources

- Direct codebase analysis: `src/hooks/`, `src/repositories/`, `src/components/layout/`, `src/utils/nutrition.utils.ts`, `src/types/`
- Existing pattern: `useMealPlanByDate` query key reuse for cache sharing
- TanStack React Query v5 `useQueries` API (parallel queries pattern)
- Existing navigation pattern in `MobileTabBar.tsx` and `Sidebar.tsx` (array-driven, `requiresFeature` guard)

---
*Architecture research for: Weekly statistics dashboard — React + Firestore nutrition tracker*
*Researched: 2026-03-12*
