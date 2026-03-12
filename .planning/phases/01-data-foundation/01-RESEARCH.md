# Phase 1: Data Foundation - Research

**Researched:** 2026-03-12
**Domain:** Firestore range query, data aggregation pipeline, TanStack React Query, date-fns ISO week utilities
**Confidence:** HIGH

## Summary

The project already has a mature repository pattern with typed Firestore queries, TanStack React Query hooks, and a `nutrition.utils.ts` module that handles per-MealPlan nutrition calculation. The gap for Phase 1 is narrow and well-defined: add a week-range query function to the mealplan repository, build a pure aggregation utility (`weekly-stats.utils.ts`) that maps 7 days to typed day summaries, resolve the goal hierarchy, and compose everything into a `useWeeklyStats` hook.

The composite Firestore index `[createdBy, date]` is already declared in `firestore.indexes.json`. This removes the blocker noted in STATE.md — the index definition exists and only needs to be confirmed as deployed before production data is loaded. The date format used throughout the codebase is `yyyy-MM-dd` (ISO 8601 string), produced via `localDate.toISOString().split("T")[0]` with timezone offset correction. The aggregation utility must be pure (no Firestore calls) so it can be unit-tested with plain objects.

**Primary recommendation:** Build a single `getMealPlansByWeek(weekStartDate: string)` repository function using Firestore `>=` / `<=` range operators on the `date` field. Feed the result into a pure `aggregateWeeklyStats()` utility. Compose both inside `useWeeklyStats(weekStartDate)` using a single `useQuery` call that also fetches `WeeklyNutritionGoals` and falls back to `UserProfile` for goal resolution.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Definition "geloggter Tag"**
- Ein Tag gilt als geloggt, wenn mindestens eine Mahlzeit (Dish) oder ein TemporaryMeal vorhanden ist
- Leere MealPlan-Dokumente (existiert, aber keine Mahlzeiten) gelten als NICHT geloggt
- Tage nur mit Sport aber ohne Mahlzeiten gelten als NICHT geloggt
- Nicht-geloggte Tage werden als `hasData: false` markiert und fließen NICHT in Durchschnitte oder Defizit ein

**Sport-Kalorien bei nicht-geloggten Tagen**
- Sport-Kalorien werden IMMER in die Wochen-Sportkalorien-Summe eingerechnet, auch von nicht-geloggten Tagen
- Sport-Kalorien von nicht-geloggten Tagen fließen NICHT in die Defizit-Berechnung ein
- Defizit wird nur für geloggte Tage berechnet: (Ziel + Sport) − Gegessen

**Kalorien-Berechnung pro Tag**
- TemporaryMeals werden voll eingerechnet (Kalorien + Makros fließen in Tagessumme)
- Dish.calories enthält bereits die Basiskalorienzahl, `quantity` ist der Multiplikator — `calculateDishNutrition()` aus `nutrition.utils.ts` anwenden
- Mehrere SportActivity-Objekte pro Tag werden addiert
- Sport-Sessions werden als einzelne Aktivitäten gezählt (3 Aktivitäten an 2 Tagen = "3 Sessions")

**Fehlende Makro-Daten**
- Wenn ein Dish kein protein/carbs/fat hat: als 0g behandeln
- Wenn kein Makro-Ziel gesetzt ist (weder WeeklyNutritionGoals noch UserProfile): Makro-%-Bereich wird nicht angezeigt
- Wenn kein Kalorienziel gesetzt ist: keine Defizit-Karte, keine Ziel-Linie im Chart — Kalorien-Summe wird trotzdem gezeigt

**Zielauflösung**
- Kalorienziel: WeeklyNutritionGoals.targetCalories → Fallback UserProfile.targetCalories → kein Ziel
- Jedes Makro-Ziel wird einzeln aufgelöst: WeeklyNutritionGoals > UserProfile > nicht anzeigen
- Beispiel: Protein-Ziel aus Weekly, KH-Ziel aus UserProfile, Fett kein Ziel → Protein und KH als % zeigen, Fett ausblenden

**Defizit-Formel:** (Tagesziel + Sportkalorien) − gegessene Kalorien

**Performance:** Nur 7 Tage pro Wochenansicht laden

### Claude's Discretion
- Firestore Range Query Strategie (einzelne Queries vs. >= / <= Range)
- Hook-Rückgabeformat und interne Datenstrukturen
- Aggregations-Utility Architektur
- Testing-Strategie (Unit Tests, Mocking-Ansatz)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | App kann MealPlans für eine ganze Woche (Mo–So) per Range-Query aus Firestore laden | Firestore `>=`/`<=` on `date` field; composite index `[createdBy, date]` already in `firestore.indexes.json`; `getMealPlansByWeek()` is the new repository function |
| DATA-02 | Wochendaten werden zu Tagessummen aggregiert (Kalorien gegessen, Sportkalorien, Defizit/Überschuss) | Pure `aggregateWeeklyStats()` utility; reuses existing `calculateTotalMealPlanNutrition()` and `calculateTotalBurnedCalories()`; no Firestore calls so fully unit-testable |
| DATA-03 | Kalorienziel wird korrekt aufgelöst (WeeklyNutritionGoals → Fallback UserProfile) | `resolveGoals()` pure function; existing `getWeeklyNutritionGoals()` and `getNutritionGoals()` repositories used; per-macro resolution required |
| DATA-04 | Nicht geloggte Tage werden als "keine Daten" markiert und aus Durchschnittswerten ausgeschlossen | `hasData` boolean on `DayStats`; isLogged = (dishes.length > 0 OR temporaryMeals.length > 0); sport calories still counted in week total |
</phase_requirements>

---

## Standard Stack

### Core (already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase | ^12.5.0 | Firestore range query via `where("date", ">=", monday)` + `where("date", "<=", sunday)` | Existing pattern; composite index already defined |
| @tanstack/react-query | 5.64.0 | `useQuery` for `useWeeklyStats` hook | Established pattern throughout codebase |
| date-fns | 4.1.0 | `startOfISOWeek`, `endOfISOWeek`, `eachDayOfInterval`, `format`, `addWeeks`, `subWeeks` | Already used; ISO week functions confirmed working |
| vitest | 4.0.18 | Unit tests for pure aggregation utilities | Already configured; test infrastructure exists |
| typescript | ^5.2.2 | Types for `DayStats`, `WeeklyStats`, `ResolvedGoals` | Established `.types.ts` pattern |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended File Structure

```
src/
├── repositories/
│   └── mealplan.repository.ts        # ADD: getMealPlansByWeek()
├── types/
│   └── weekly-stats.types.ts         # NEW: DayStats, WeeklyStats, ResolvedGoals
├── utils/
│   ├── nutrition.utils.ts            # EXISTING — reuse as-is
│   ├── weekly-stats.utils.ts         # NEW: aggregateWeeklyStats(), resolveGoals()
│   └── __tests__/
│       └── weekly-stats.utils.test.ts  # NEW: unit tests for pure functions
└── hooks/
    └── useWeeklyStats.ts             # NEW: useWeeklyStats(weekStartDate)
```

### Pattern 1: Firestore Range Query with `>=` / `<=`

**What:** Single Firestore query fetching all 7 MealPlan documents for a week using range operators on the string-formatted `date` field.

**When to use:** Any time a week's data is needed. The single-range-query approach is preferred over 7 individual `getMealPlanByDate` calls to avoid 7× read cost and waterfall loading.

**Why it works:** `MealPlan.date` is stored as `yyyy-MM-dd` string (ISO 8601). Lexicographic ordering of this format equals chronological ordering, so `>=` / `<=` comparisons are correct.

**Requires:** Composite index on `[createdBy (ASC), date (ASC)]` — already defined in `firestore.indexes.json`. Must be deployed (`firebase deploy --only firestore:indexes`) before first production use.

```typescript
// Source: Firestore docs — compound queries with range filters
// src/repositories/mealplan.repository.ts (addition)
export const getMealPlansByWeek = async (
  weekStartDate: string // "yyyy-MM-dd" — Monday of the ISO week
): Promise<MealPlan[]> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  const weekStart = parseISO(weekStartDate);
  const weekEnd = endOfISOWeek(weekStart);
  const weekEndStr = format(weekEnd, "yyyy-MM-dd");

  const q = query(
    collection(db, "mealPlans"),
    where("createdBy", "==", auth.currentUser.uid),
    where("date", ">=", weekStartDate),
    where("date", "<=", weekEndStr)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    sports: Array.isArray(d.data().sports) ? d.data().sports : [],
    temporaryMeals: Array.isArray(d.data().temporaryMeals) ? d.data().temporaryMeals : [],
    createdAt: d.data().createdAt?.toDate() || new Date(),
    updatedAt: d.data().updatedAt?.toDate() || new Date(),
  })) as MealPlan[];
};
```

### Pattern 2: Pure Aggregation Utility

**What:** A pure function that takes raw fetched data (MealPlans array + goals) and returns a fully typed `WeeklyStats` object. No Firestore calls, no React, no side effects.

**When to use:** Called inside `useWeeklyStats` query function. Pure means it's unit-testable with plain object fixtures.

```typescript
// src/types/weekly-stats.types.ts
export interface DayStats {
  date: string;           // "yyyy-MM-dd"
  hasData: boolean;       // true only if ≥1 dish OR temporaryMeal
  eatenCalories: number;  // 0 if !hasData
  sportCalories: number;  // always sum of activities (even if !hasData)
  deficit: number | null; // null if !hasData or no calorie goal
  protein: number;        // 0 if !hasData
  carbs: number;
  fat: number;
  sportSessions: number;  // count of SportActivity objects
}

export interface ResolvedGoals {
  targetCalories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export interface WeeklyStats {
  weekStartDate: string;
  days: DayStats[];           // always 7 entries, Mon–Sun
  goals: ResolvedGoals;
  totalEatenCalories: number; // sum of logged days only
  totalSportCalories: number; // sum of ALL days (logged + unlogged)
  totalSportSessions: number; // count of ALL sport activities across week
  totalDeficit: number | null; // null if no goal; sum of logged day deficits
  loggedDayCount: number;
  avgEatenCalories: number | null; // null if loggedDayCount === 0
}
```

### Pattern 3: Goal Resolution — Pure Function

**What:** Takes `WeeklyNutritionGoals | null` and `NutritionGoals` (from UserProfile) and returns `ResolvedGoals` with per-macro fallback logic.

```typescript
// src/utils/weekly-stats.utils.ts
export function resolveGoals(
  weeklyGoals: WeeklyNutritionGoals | null,
  profileGoals: NutritionGoals
): ResolvedGoals {
  return {
    targetCalories: weeklyGoals?.targetCalories ?? profileGoals.targetCalories ?? null,
    protein: weeklyGoals?.protein ?? profileGoals.protein ?? null,
    carbs: weeklyGoals?.carbs ?? profileGoals.carbs ?? null,
    fat: weeklyGoals?.fat ?? profileGoals.fat ?? null,
  };
}
```

### Pattern 4: useWeeklyStats Hook

**What:** Single React Query hook that fetches MealPlans, WeeklyNutritionGoals, and UserProfile — then composes them through aggregation and goal resolution.

**When to use:** Consumed by Phase 2 (Statistics UI) components. Returns standard React Query shape.

```typescript
// src/hooks/useWeeklyStats.ts
export const useWeeklyStats = (weekStartDate: string) => {
  return useQuery<WeeklyStats, Error>({
    queryKey: ["weeklyStats", weekStartDate],
    queryFn: async () => {
      const [mealPlans, weeklyGoals, profileGoals] = await Promise.all([
        getMealPlansByWeek(weekStartDate),
        getWeeklyNutritionGoals(weekStartDate),
        getNutritionGoals(),
      ]);
      const goals = resolveGoals(weeklyGoals, profileGoals);
      return aggregateWeeklyStats(weekStartDate, mealPlans, goals);
    },
    enabled: !!weekStartDate,
    staleTime: 1000 * 60 * 2,
  });
};
```

### Pattern 5: "Logged Day" Check

**What:** A day is logged if its MealPlan document has at least one Dish in any meal slot OR at least one TemporaryMeal. Sport-only or empty MealPlan documents are NOT logged.

```typescript
function isLoggedDay(plan: MealPlan): boolean {
  const dishCount =
    plan.breakfast.length +
    plan.lunch.length +
    plan.dinner.length +
    plan.snacks.length;
  const tempMealCount = (plan.temporaryMeals ?? []).length;
  return dishCount > 0 || tempMealCount > 0;
}
```

### Anti-Patterns to Avoid

- **7 individual queries instead of range query:** Causes 7 Firestore reads and serial waterfall. Use `getMealPlansByWeek()`.
- **Mixing aggregation logic into the hook:** Makes unit testing require React Query wrappers. Keep `aggregateWeeklyStats()` as a pure utility.
- **Including unlogged days in averages:** The hook output must exclude `hasData: false` days from `avgEatenCalories` and `totalDeficit`.
- **Using `new Date(dateString)` without timezone handling:** The existing codebase uses `localDate.toISOString().split("T")[0]` with timezone offset. Use `date-fns` `format(date, 'yyyy-MM-dd')` consistently.
- **Calling `startOfWeek` instead of `startOfISOWeek`:** `startOfWeek` defaults to Sunday in some locales. `startOfISOWeek` always returns Monday. Use `startOfISOWeek`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-day calorie sum | Custom dish/meal loop | `calculateTotalMealPlanNutrition(plan)` from `nutrition.utils.ts` | Already handles dishes (with quantity), temporaryMeals, and optional macros |
| Sport calorie sum | Manual activity loop | `calculateTotalBurnedCalories(plan.sports)` from `nutrition.utils.ts` | Already handles edge cases |
| Week date range | Manual date arithmetic | `startOfISOWeek`, `endOfISOWeek`, `eachDayOfInterval` from `date-fns` | ISO week (Mon–Sun) already verified working in this codebase |
| Query caching | Custom state management | `useQuery` from `@tanstack/react-query` | Established pattern; DevTools integration for verification |

**Key insight:** The nutrition calculation layer is already complete and tested. Phase 1 wires it into a week-scoped data fetch — it does not re-implement calorie math.

---

## Common Pitfalls

### Pitfall 1: Firestore Index Not Deployed

**What goes wrong:** The `[createdBy, date]` composite index is defined in `firestore.indexes.json` but may not be deployed to the Firestore project yet. The range query will succeed locally if using the emulator but fail in production with a "requires an index" error message containing a console link.

**Why it happens:** `firebase.indexes.json` is a declaration, not an automatic deployment. Deploy requires `firebase deploy --only firestore:indexes`.

**How to avoid:** Verify the index is deployed before testing against production Firestore. If working against the emulator, no deployment is needed.

**Warning signs:** Firestore error "The query requires an index" in the browser console during testing.

### Pitfall 2: Missing Days vs. No-Data Days

**What goes wrong:** If a user has no MealPlan document for Tuesday, that day has no Firestore entry. The range query returns fewer than 7 documents. The aggregation must still produce 7 `DayStats` entries — one per day of the week — with `hasData: false` for missing days.

**Why it happens:** Firestore only returns documents that exist. Non-existent days return nothing.

**How to avoid:** In `aggregateWeeklyStats`, generate the 7 day dates with `eachDayOfInterval` first, then look up each date in the fetched MealPlans array by date string comparison.

```typescript
// Pattern: build 7-day skeleton first
const weekDays = eachDayOfInterval({ start: parseISO(weekStartDate), end: endOfISOWeek(parseISO(weekStartDate)) });
const planByDate = new Map(mealPlans.map(p => [p.date, p]));
const days = weekDays.map(day => {
  const dateStr = format(day, "yyyy-MM-dd");
  const plan = planByDate.get(dateStr);
  return buildDayStats(dateStr, plan ?? null, goals);
});
```

### Pitfall 3: Empty MealPlan = Not Logged

**What goes wrong:** A MealPlan document can exist (e.g. created by navigation) but contain zero dishes and zero temporaryMeals. Treating document existence as "logged" would produce `hasData: true` with 0 calories.

**Why it happens:** The app may create empty MealPlan documents when a user opens a day page.

**How to avoid:** Always apply `isLoggedDay(plan)` check — document existence alone is not sufficient.

### Pitfall 4: Sport Calories Double-Counting

**What goes wrong:** Sport calories from unlogged days must be added to `totalSportCalories` but NOT to the deficit calculation for those days.

**Why it happens:** The locked decision has a split: week-total sport includes all days; per-day deficit only counts logged days.

**How to avoid:** In `aggregateWeeklyStats`, sum `sportCalories` across all days (regardless of `hasData`) for `totalSportCalories`. For `deficit` on a specific day: return `null` if `!hasData` or `!goals.targetCalories`.

### Pitfall 5: Macro Null vs. Zero

**What goes wrong:** `WeeklyNutritionGoals.protein` is typed as `number | null`. Using `??` (nullish coalescing) correctly handles `null` as "not set" but `0` as "set to zero". Using `||` would incorrectly treat `0` as "not set" and fall through to the profile goal.

**Why it happens:** A goal of `0g protein` is valid (edge case).

**How to avoid:** Use `??` (nullish coalescing) exclusively in `resolveGoals()`.

---

## Code Examples

### Week Date Range Generation

```typescript
// Source: date-fns 4.1.0 — verified against installed package
import { startOfISOWeek, endOfISOWeek, eachDayOfInterval, format, parseISO } from "date-fns";

// weekStartDate: "2026-03-09" (Monday)
const weekStart = parseISO(weekStartDate);
const weekEnd = endOfISOWeek(weekStart); // Sunday

// Produces: ["2026-03-09", "2026-03-10", ..., "2026-03-15"]
const weekDates = eachDayOfInterval({ start: weekStart, end: weekEnd })
  .map(d => format(d, "yyyy-MM-dd"));
```

### Existing Nutrition Utilities (reuse)

```typescript
// Source: src/utils/nutrition.utils.ts — existing, tested
import {
  calculateTotalMealPlanNutrition,  // handles dishes (with quantity) + temporaryMeals
  calculateTotalBurnedCalories,     // sums SportActivity[].calories
} from "../utils";

// Per-day totals:
const nutrition = calculateTotalMealPlanNutrition(plan); // { calories, protein, carbs, fat }
const sportCal = calculateTotalBurnedCalories(plan.sports ?? []);
```

### Firestore Range Query Pattern

```typescript
// Source: Firebase Firestore docs — compound range queries
import { query, collection, where, getDocs } from "firebase/firestore";

const q = query(
  collection(db, "mealPlans"),
  where("createdBy", "==", auth.currentUser.uid),
  where("date", ">=", "2026-03-09"),
  where("date", "<=", "2026-03-15")
);
const snapshot = await getDocs(q);
```

### React Query Hook Pattern (existing convention)

```typescript
// Source: src/hooks/useWeeklyGoals.ts — existing pattern
export const useWeeklyStats = (weekStartDate: string) => {
  return useQuery<WeeklyStats, Error>({
    queryKey: ["weeklyStats", weekStartDate],
    queryFn: () => fetchAndAggregateWeeklyStats(weekStartDate),
    enabled: !!weekStartDate,
    staleTime: 1000 * 60 * 2,
  });
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useMealPlans()` fetching all plans then filtering in memory | `getMealPlansByWeek()` with Firestore range query | Phase 1 (now) | 7 reads max vs. N reads for all plans |
| No weekly aggregation type | Typed `WeeklyStats` / `DayStats` | Phase 1 (now) | Phase 2 UI can consume typed data without re-aggregation |

**Deprecated/outdated:**
- Filtering `mealPlans` by week client-side (like `WeekCalendar.tsx` lines 43–47): avoid this pattern for the statistics pipeline — it loads all data and filters in memory.

---

## Open Questions

1. **Firestore Index Deployment Status**
   - What we know: `firestore.indexes.json` contains the `[createdBy, date]` composite index definition
   - What's unclear: Whether it has been deployed to the live Firestore project
   - Recommendation: First task in Wave 0 should verify deployment; add `firebase deploy --only firestore:indexes` to the Wave 0 setup checklist

2. **`temporaryMeals` Array Defense**
   - What we know: `getMealPlanByDate` in the repository explicitly guards `sports` with `Array.isArray` fallback but does NOT guard `temporaryMeals`
   - What's unclear: Whether old Firestore documents lack the `temporaryMeals` field
   - Recommendation: The new `getMealPlansByWeek` function should apply the same `Array.isArray` guard to `temporaryMeals` as is done for `sports`

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | `vitest.config.ts` (root) — `environment: "node"`, `globals: true` |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm run test:unit` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | `getMealPlansByWeek` returns only docs within date range | unit (pure logic test via mock) | `npm run test:unit -- weekly-stats` | Wave 0 |
| DATA-02 | `aggregateWeeklyStats` sums calories/sport/deficit correctly | unit | `npm run test:unit -- weekly-stats` | Wave 0 |
| DATA-03 | `resolveGoals` applies WeeklyNutritionGoals → UserProfile fallback per macro | unit | `npm run test:unit -- weekly-stats` | Wave 0 |
| DATA-04 | Days with no dishes/temporaryMeals have `hasData: false`; excluded from averages | unit | `npm run test:unit -- weekly-stats` | Wave 0 |

**Note on DATA-01 testing:** `getMealPlansByWeek` calls Firestore, which cannot be unit-tested without mocking. The recommended approach is to test the range boundary logic separately in a pure helper if needed, and treat the repository function as integration-tested manually via React Query DevTools. The pure `aggregateWeeklyStats` utility covers the correctness guarantees described in the success criteria.

### Sampling Rate

- **Per task commit:** `npm run test:unit`
- **Per wave merge:** `npm run test:unit`
- **Phase gate:** All unit tests green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/utils/__tests__/weekly-stats.utils.test.ts` — covers DATA-02, DATA-03, DATA-04 (pure function tests)
- [ ] `src/types/weekly-stats.types.ts` — `DayStats`, `WeeklyStats`, `ResolvedGoals` interfaces

*(Vitest config and test infrastructure already exist — no framework setup needed)*

---

## Sources

### Primary (HIGH confidence)

- Codebase inspection — `src/repositories/mealplan.repository.ts`: existing Firestore query pattern with `[createdBy, date]` where clauses
- Codebase inspection — `firestore.indexes.json`: composite index on `[createdBy ASC, date ASC]` for `mealPlans` collection
- Codebase inspection — `src/utils/nutrition.utils.ts`: `calculateTotalMealPlanNutrition`, `calculateTotalBurnedCalories` — existing, unit-tested
- Codebase inspection — `vitest.config.ts`: `environment: "node"`, `globals: true`, `include: ["src/**/*.{test,spec}.{ts,tsx}"]`
- date-fns 4.1.0 installed package — `startOfISOWeek`, `endOfISOWeek`, `eachDayOfInterval`, `format`, `parseISO` confirmed available and correct (verified with `node -e` against installed package)
- `@tanstack/react-query` 5.64.0 — existing hook pattern in `useWeeklyGoals.ts` and `useMealPlans.ts`

### Secondary (MEDIUM confidence)

- Firestore Compound Query docs (range operators on same field require composite index) — aligned with `firestore.indexes.json` structure already in repo
- CONTEXT.md locked decisions — nutrition calculation rules, goal resolution hierarchy, sport/logged day split

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are installed and in use; no new dependencies needed
- Architecture: HIGH — repository pattern, hook structure, and utility pattern all derived from existing codebase conventions
- Pitfalls: HIGH — index deployment status and missing-day handling derived from codebase inspection; `temporaryMeals` array guard gap directly observed in repository code

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable stack — date-fns and React Query APIs are stable)
