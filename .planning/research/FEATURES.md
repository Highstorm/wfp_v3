# Feature Research

**Domain:** Nutrition tracking — weekly statistics page
**Researched:** 2026-03-12
**Confidence:** HIGH (based on competitor analysis of MyFitnessPal, Cronometer, CaliCalo, MacroFactor + existing codebase inspection)

## Feature Landscape

### Table Stakes (Users Expect These)

Features a user expects the moment they open a "statistics" page. Missing any of these makes the page feel pointless or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Calorie bar chart (7 days) | Visual scanning of intake patterns is the primary reason to open a stats page | MEDIUM | Mon–Sun, bar per day. Recharts `BarChart` with a `ReferenceLine` for goal. |
| Daily calorie goal reference line | Without it, bars are meaningless numbers — no sense of over/under | LOW | Single horizontal line from `WeeklyNutritionGoals.targetCalories` |
| Week navigation (prev/next) | Users expect to scroll back in time to review past weeks | LOW | date-fns `startOfISOWeek` / `endOfISOWeek`. ISO week (Mon–Sun) matches existing Firestore date keys. |
| Current week label ("KW 11 · 10.–16. März 2026") | Context anchor so the user knows which week they are viewing | LOW | Pure formatting, no fetch needed. |
| Summary card: total calories consumed | Aggregate view for the week at a glance | LOW | Sum across days with `calculateTotalMealPlanNutrition` (already exists). |
| Summary card: cumulative deficit / surplus | Core metric for a fitness-oriented user — "am I on track?" | MEDIUM | `(targetCalories + sportCalories) − eatenCalories` per day, summed. Sebastians preferred formula (documented in PROJECT.md). |
| Summary card: total sport calories burned | Exercise contribution needs its own card to be understandable | LOW | `calculateTotalBurnedCalories` already exists. |
| Days with data vs. days without | Page must gracefully handle days where no MealPlan document exists (user didn't log) | LOW | Render bar at 0 or grayed out. Do not crash or show stale data. |
| Macro weekly averages | Protein / Carbs / Fat as % of daily goal — week average | MEDIUM | Average across logged days only (exclude zero-data days from denominator). Use `WeeklyNutritionGoals` for targets. |
| Navigation entry (bottom nav + sidebar) | Page is invisible without a nav link | LOW | Add alongside existing nav items. Icon: chart/graph. |

### Differentiators (Competitive Advantage)

Features that go beyond what is expected and add genuine insight for Sebastian specifically.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Net calorie bars (eaten vs. goal+sport stacked) | Shows the *actual* deficit per day visually, not just raw intake — aligns with Sebastians formula | HIGH | Stacked or grouped bar showing eaten vs. goal+sport. Recharts supports this natively. Requires sport calories on each bar datum. |
| Color coding: deficit (green) / surplus (red) per bar | Instant visual feedback without reading numbers | LOW | Conditional bar fill via `Cell` in Recharts. |
| Macro achievement indicators (% of goal, color-coded) | Seeing that protein was only 72% of goal is more actionable than seeing "89g" | LOW | Progress-bar style row per macro. Already have the formula. |
| Empty-week state with friendly message | "No data logged this week" is more trustworthy than a blank chart | LOW | Check if all 7 days are missing before rendering. |
| "Days logged" counter in summary | Transparency — "4/7 days tracked" builds trust in the weekly average | LOW | Count days where a MealPlan document exists and has meals. |
| Stomach pain heatmap overlay | `MealPlan.stomachPainLevel` is already stored — makes it useful | HIGH | Dot or bar annotation on the chart. Worth deferring to v1.x, data is already there. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem natural to add but should be deliberately avoided for this milestone.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Month / year view | "Can I see the whole month?" feels like a natural extension | Requires loading 28–31 MealPlan documents per render; complicates week navigation state; outside milestone scope per PROJECT.md | Navigation by week is sufficient. Add month view as a separate future milestone only. |
| Week-over-week comparison | "Is this week better than last week?" is a common question | Doubles the data load, doubles the layout complexity, ambiguous when days are missing in either week | A single cumulative deficit number and the bar chart are enough signal. |
| Export / download (CSV, PNG) | Users sometimes want data portability | Low demand for personal-use app; adds surface area (permissions, file APIs); explicitly out of scope in PROJECT.md | None needed. Data lives in Firebase and is always accessible via the app. |
| Weight tracking integration | Calorie deficit implies weight loss, so "show weight trend" feels connected | Weight is a separate data source not tracked in this app; scope creep risk; explicitly out of scope in PROJECT.md | Keep calorie deficit as the proxy. Weight tracking is its own future milestone. |
| Real-time / live updates while navigating | Refreshing chart as user navigates days feels polished | Firestore reads cost money; React Query caching is sufficient; 7-document batch load per week is fast enough | Load once per week navigation, cache with TanStack Query. No polling needed. |
| Micronutrient breakdown | "Show me my vitamin D intake" is a Cronometer feature | The data model (`MealPlan`, `Dish`) does not store micronutrients; would require schema changes | Protein / carbs / fat are the tracked macros — stay within the data that exists. |

## Feature Dependencies

```
Week navigation (prev/next)
    └──requires──> Week date range calculation (date-fns startOfISOWeek)
                       └──requires──> 7x MealPlan fetch by date string

Calorie bar chart
    └──requires──> 7x MealPlan daily calorie totals (calculateTotalMealPlanNutrition)
    └──requires──> WeeklyNutritionGoals.targetCalories (reference line)

Cumulative deficit card
    └──requires──> 7x MealPlan daily calorie totals
    └──requires──> 7x MealPlan sport calories (calculateTotalBurnedCalories)
    └──requires──> WeeklyNutritionGoals.targetCalories

Macro weekly averages
    └──requires──> 7x MealPlan daily macro totals
    └──requires──> WeeklyNutritionGoals (protein, carbs, fat targets)
    └──requires──> Days-logged count (to compute true average, not diluted by zero days)

Net calorie bars (differentiator)
    └──requires──> Calorie bar chart (extends it)
    └──requires──> Sport calories per day

Stomach pain overlay (differentiator, deferred)
    └──requires──> Calorie bar chart
    └──requires──> MealPlan.stomachPainLevel field (already exists in type)
```

### Dependency Notes

- **Week navigation requires date range calculation:** The existing Firestore key format is `YYYY-MM-DD` (ISO date string). date-fns `eachDayOfInterval(startOfISOWeek, endOfISOWeek)` generates exactly the 7 keys to query.
- **Macro averages require days-logged count:** Dividing macro totals by 7 when only 4 days have data produces a misleading low average. Must divide by the number of days that have a MealPlan with actual food entries.
- **Cumulative deficit requires sport calories:** The deficit formula `(targetCalories + sportCalories) − eatenCalories` is Sebastian's preferred model. Sport is already on each MealPlan as `sports: SportActivity[]`.
- **Net calorie bars extend the basic bar chart:** Both share the same data shape; net bars add a second data series. They can be built as an enhancement once the basic chart works.

## MVP Definition

### Launch With (v1)

Minimum set that delivers the stated core value: "weekly overview of calorie progress."

- [ ] Week navigation (prev/next, current week label) — without this, there is no page, just a static view
- [ ] Calorie bar chart (Mon–Sun, one bar per day) — the primary visual
- [ ] Daily goal reference line on bar chart — makes bars meaningful
- [ ] Summary card: total calories consumed — quick week total
- [ ] Summary card: cumulative deficit/surplus — the fitness insight
- [ ] Summary card: total sport calories — explains the deficit calculation
- [ ] Macro weekly averages (% of goal, per macro) — rounds out nutrition picture
- [ ] Graceful empty state (missing days shown as 0 / labeled) — data integrity
- [ ] Navigation entry added to bottom nav and sidebar — discoverability

### Add After Validation (v1.x)

Features to add once the core page is working and used.

- [ ] Color coding per bar (green/red for deficit/surplus) — add when basic chart is live; low cost, high clarity
- [ ] "Days logged" counter — add once empty-state handling is confirmed correct
- [ ] Net calorie bars (grouped/stacked showing eaten vs. goal+sport) — add if the reference line alone feels insufficient

### Future Consideration (v2+)

- [ ] Stomach pain overlay — data exists, but feature needs its own design pass; defer until there is a concrete use case beyond curiosity
- [ ] Month view — separate milestone; do not attempt while weekly page is new
- [ ] Week-over-week comparison — separate milestone

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Calorie bar chart with goal line | HIGH | MEDIUM | P1 |
| Week navigation | HIGH | LOW | P1 |
| Summary cards (3 cards) | HIGH | LOW | P1 |
| Macro weekly averages | HIGH | MEDIUM | P1 |
| Navigation entry | HIGH | LOW | P1 |
| Empty state handling | MEDIUM | LOW | P1 |
| Color-coded bars | MEDIUM | LOW | P2 |
| Days-logged counter | MEDIUM | LOW | P2 |
| Net calorie bars (stacked) | MEDIUM | HIGH | P2 |
| Stomach pain overlay | LOW | HIGH | P3 |
| Month view | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | MyFitnessPal | Cronometer | CaliCalo | WFP approach |
|---------|--------------|------------|----------|--------------|
| Weekly calorie bar chart | Yes (week view, % of macro per day) | Yes (customizable chart) | Yes (7-day net graph) | Bar chart per day with goal reference line |
| Goal reference line | Yes | Yes | Implicit (net = 0 line) | Explicit horizontal reference line |
| Macro breakdown | Weekly average per nutrient vs. goal | Swipe to see macros/micros | Not prominent | % of goal per macro, week average |
| Exercise calories | Included in net calorie calculation | Tracked separately | Included in net | Displayed as own card, included in deficit formula |
| Deficit / surplus display | Net calories label | Not a primary metric | Core feature (deficit tracker) | Cumulative deficit card + per-day on chart |
| Week navigation | Yes | Yes | 7-day window | ISO week nav (Mon–Sun) |
| Empty days | Shown as 0 | Shown as 0 | Not applicable | Bar at 0, visually distinguished |

## Sources

- [MyFitnessPal Weekly Digest](https://support.myfitnesspal.com/hc/en-us/articles/360032622591-Weekly-Digest) — weekly view features
- [Cronometer vs. MyFitnessPal (Katelynn Nutrition)](https://www.katelynannutrition.com/blog/cronometer-vs-mfp) — feature comparison
- [CaliCalo App Store listing](https://apps.apple.com/us/app/calicalo-watch-your-calories/id1205082048) — 7-day net calories graph pattern
- Codebase inspection: `src/types/mealplan.types.ts`, `src/types/weekly-goals.types.ts`, `src/utils/nutrition.utils.ts` — confirmed existing data model and utility functions
- PROJECT.md — confirmed deficit formula, out-of-scope features, and stack constraints

---
*Feature research for: nutrition tracking weekly statistics page*
*Researched: 2026-03-12*
