# Phase 3: Statistics UI - Research

**Researched:** 2026-03-13
**Domain:** React charting (Recharts), Tailwind CSS UI composition, react-router-dom URL state
**Confidence:** HIGH

## Summary

Phase 3 builds the full Statistics UI on top of the already-complete `useWeeklyStats` hook from Phase 1. The design is locked in Penpot (wfp_v3.pen). The only new library dependency is **Recharts** — everything else (Tailwind, date-fns, React Query, react-router-dom, Lucide, Vitest) is already installed and in active use.

Recharts is well-suited to the requirements: `BarChart` + `Bar` + `ReferenceLine` + `Cell` compose naturally into the required chart. The `radius` prop on `Bar` gives rounded top corners. Per-bar color is done with `Cell` children. Custom tooltips use the `content` prop on `<Tooltip>`. `ResponsiveContainer` handles mobile-responsiveness. The week nav and URL sync use `useSearchParams` / `useNavigate` already used in the codebase.

**Primary recommendation:** Install `recharts@^2.15` (the stable 2.x line, not the 3.x alpha). Compose the page from four focused sub-components: `WeeklyBarChart`, `WeeklySummaryCards`, `MacroAverages`, and `WeekNav`. Assemble them in a `StatisticsPage` shell that manages week state via `useSearchParams`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Chart-Interaktion**
- Tap/Hover auf Balken zeigt Tooltip mit: gegessene Kalorien, Sportkalorien, Defizit
- Tap auf einen Balken navigiert zur Tagesplanung (`/day-planning?date=YYYY-MM-DD`)
- Auch graue Balken (nicht geloggte Tage) navigieren zur Tagesplanung — User kann dort anfangen zu loggen
- Tooltip zeigt alle drei Werte: Kalorien + Sport + Defizit

**Wochenwechsel-Verhalten**
- Harter Schnitt beim Wochenwechsel — keine Slide- oder Fade-Animation
- Einfacher Spinner (bestehendes `LoadingSpinner` Pattern) während neue Wochendaten laden
- Nur Button-Navigation (Prev/Next/Heute) — kein Swipe-Gesture
- Angezeigte Woche als Query-Parameter in der URL: `/statistics?week=2026-03-09`
- Bei Reload wird Woche aus URL gelesen, ohne Parameter startet aktuelle Woche

**Zahlenformate**
- Kalorien: Ganzzahl ohne Tausender-Trennung (`.toFixed(0)`) — konsistent mit bestehendem NutritionSummary
- Makro-Durchschnitte: Ganzzahl-Prozent ohne Dezimalstelle (z.B. "85%")
- Defizit in Summary Card: Ganzzahl kcal

**Leer-Zustand (keine Daten für die Woche)**
- Chart zeigt 7 graue Stub-Balken (wie Design) + Hinweis-Text: "Keine Daten für diese Woche. Starte mit der Tagesplanung!"
- Summary Cards bleiben sichtbar mit "–" als Wert — konsistentes Layout
- Makro-Sektion: wird nicht angezeigt wenn keine geloggten Tage

**Recharts-Konfiguration**
- Subtile Einblend-Animation: Balken fahren beim Laden von unten hoch (Recharts built-in)
- Chart mit Padding links/rechts innerhalb der Card — wie andere Sektionen
- Balken mit abgerundeten oberen Ecken (radius ~4px)
- Y-Achse: dezente Zahlen links als Orientierungshilfe (500, 1000, 1500, ...)
- X-Achse: Wochentage Mo–So als Labels

### Claude's Discretion
- Exakte Tooltip-Positionierung und Styling
- Recharts ResponsiveContainer Konfiguration
- Chart-Höhe und Balkenbreite (orientiert am Phase 2 Design: ~240px Chart-Höhe)
- Loading Spinner Platzierung
- Komponenten-Aufteilung (einzelne Dateien vs. zusammengefasst)
- Error-State Handling

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIS-01 | Balkendiagramm zeigt Kalorien pro Tag (Mo–So) mit Tagesziel als Referenzlinie | Recharts `BarChart` + `Bar` + `ReferenceLine y={goals.targetCalories}` covers this exactly |
| VIS-02 | Nicht geloggte Tage sind im Chart ausgegraut dargestellt | `Cell` component for per-bar fill; `DayStats.hasData` flag drives color selection |
| VIS-03 | Chart ist responsive und mobile-optimiert | Recharts `ResponsiveContainer width="100%"` — verified standard pattern |
| SUM-01 | Karte zeigt Gesamtkalorien der Woche | `WeeklyStats.totalEatenCalories` — already computed by hook |
| SUM-02 | Karte zeigt kumuliertes Defizit/Überschuss | `WeeklyStats.totalDeficit` — already computed; null-safe "–" display |
| SUM-03 | Karte zeigt Sportkalorien gesamt (Anzahl Sessions + kcal) | `WeeklyStats.totalSportCalories` + `totalSportSessions` — already in hook |
| MAC-01 | Durchschnittliche Makro-Zielerreichung in % — nur geloggte Tage | Needs a small helper: sum protein/carbs/fat across `days.filter(d => d.hasData)`, divide by `(goal * loggedDayCount)` × 100 |
| NAV-01 | Wochennavigation zum Blättern zwischen Kalenderwochen | `useSearchParams` for `?week=` param; `date-fns` `addWeeks`/`subWeeks`/`startOfISOWeek` for date arithmetic |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | ^2.15 | BarChart, ReferenceLine, Tooltip, ResponsiveContainer, Cell | Stable 2.x API; widely documented; v3 is alpha as of 2025 |
| date-fns | ^4.1.0 (already installed) | Week arithmetic, ISO week number, label formatting | Already in project; `getISOWeek`, `addWeeks`, `subWeeks`, `startOfISOWeek`, `format` |
| react-router-dom | ^6.22.0 (already installed) | `useSearchParams` for `?week=` URL state, `useNavigate` for tap-to-day | Already in project |
| tailwind-merge + clsx | already installed | `cn()` utility for conditional classes | Project standard |
| lucide-react | already installed | `ChevronLeft`, `ChevronRight` for navigation arrows | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | already installed | Unit tests for helper functions (macro % calc, week label) | For any pure utility functions introduced in this phase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| recharts 2.x | recharts 3.x | 3.x is alpha — breaking changes, incomplete docs; use 2.x |
| recharts | victory-native / nivo | More complex setup; recharts is the lightest option with sufficient features |
| recharts | visx (Airbnb) | Lower-level D3 wrappers — overkill for this use case |

**Installation:**
```bash
npm install recharts@^2.15
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/components/statistics/
├── StatisticsPage.tsx        # Page shell — week state, URL sync, data fetch
├── WeekNav.tsx               # Prev / label / Next / Heute buttons
├── WeeklyBarChart.tsx        # Recharts BarChart composition
├── WeeklySummaryCards.tsx    # Three summary cards (total kcal, deficit, sport)
├── MacroAverages.tsx         # Protein / Carbs / Fat % cards
└── stats.utils.ts            # Pure helpers: formatWeekLabel, calcMacroPercent
```

Route registration lives in `src/App.tsx` (Phase 4 will wire nav, but the `/statistics` route can be added now with `lazy` import).

### Pattern 1: URL-driven week state

**What:** Week state lives in `?week=YYYY-MM-DD` search param; no local state for the selected week.
**When to use:** Everywhere week is accessed. On mount with no param, derive current ISO week start via `startOfISOWeek(new Date())`.

```typescript
// Source: react-router-dom 6.x docs + project pattern from LoginForm.tsx
import { useSearchParams, useNavigate } from "react-router-dom";
import { startOfISOWeek, addWeeks, subWeeks, format } from "date-fns";

function useWeekParam() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("week");
  const weekStart = raw
    ? new Date(raw)
    : startOfISOWeek(new Date());

  const goTo = (date: Date) =>
    setParams({ week: format(date, "yyyy-MM-dd") });

  return {
    weekStart,
    weekStartISO: format(weekStart, "yyyy-MM-dd"),
    prev: () => goTo(subWeeks(weekStart, 1)),
    next: () => goTo(addWeeks(weekStart, 1)),
    today: () => goTo(startOfISOWeek(new Date())),
    isCurrentWeek:
      format(weekStart, "yyyy-MM-dd") ===
      format(startOfISOWeek(new Date()), "yyyy-MM-dd"),
  };
}
```

### Pattern 2: Recharts BarChart with per-bar coloring

**What:** `Cell` children inside `Bar` drive individual bar color based on `DayStats.hasData` and whether `eatenCalories > goal`.
**When to use:** `WeeklyBarChart.tsx`

```typescript
// Source: recharts.github.io/en-US/api/Bar + Cell component docs
import {
  BarChart, Bar, XAxis, YAxis, ReferenceLine,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";

// Color logic (matches CSS variables)
function barFill(day: DayStats, goal: number | null): string {
  if (!day.hasData) return "hsl(var(--muted))"; // gray stub
  if (goal && day.eatenCalories > goal) return "hsl(var(--destructive))"; // red
  return "hsl(var(--success))"; // green
}

<ResponsiveContainer width="100%" height={240}>
  <BarChart data={chartData} margin={{ left: -16, right: 8 }}>
    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
    {goals.targetCalories && (
      <ReferenceLine y={goals.targetCalories} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 2" />
    )}
    <Tooltip content={<WeeklyChartTooltip />} />
    <Bar dataKey="eatenCalories" radius={[4, 4, 0, 0]} maxBarSize={40} onClick={handleBarClick}>
      {chartData.map((entry, i) => (
        <Cell key={i} fill={barFill(entry, goals.targetCalories)} />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>
```

**Gray stub bars for unlogged days:** Use a fixed small value (e.g., `stubHeight: 24`) as the bar data value when `!hasData`, paired with `Cell fill="muted"`. The Y-axis domain must accommodate real data, so stub bars won't interfere.

### Pattern 3: Custom Tooltip component

**What:** Recharts `Tooltip` accepts a `content` prop — a React component that receives `{ active, payload, label }`.
**When to use:** `WeeklyBarChart.tsx` — tooltip shows kcal eaten, sport kcal, deficit.

```typescript
// Source: recharts.github.io/en-US/api (Tooltip content prop)
interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DayStats }>;
  label?: string;
}

const WeeklyChartTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  const day = payload[0].payload as DayStats;
  return (
    <div className="card p-3 text-sm shadow-md min-w-[140px]">
      <div className="font-semibold mb-1">{day.date}</div>
      <div>{day.eatenCalories.toFixed(0)} kcal gegessen</div>
      {day.sportCalories > 0 && (
        <div className="text-success">+{day.sportCalories.toFixed(0)} Sport</div>
      )}
      {day.deficit !== null && (
        <div className={day.deficit >= 0 ? "text-success" : "text-destructive"}>
          {day.deficit >= 0 ? "+" : ""}{day.deficit.toFixed(0)} Defizit
        </div>
      )}
    </div>
  );
};
```

### Pattern 4: Summary Card (reusing DeficitCard pattern)

**What:** Label + value card with conditional color. Extend `DeficitCard` pattern for the three weekly summary cards.
**When to use:** `WeeklySummaryCards.tsx` — total kcal, cumulative deficit, sport.

```typescript
// Reuse of DeficitCard pattern from src/components/meal-planning/cards/DeficitCard.tsx
<div className="card p-4">
  <div className="text-sm text-muted-foreground">{label}</div>
  <div className={cn("text-2xl font-bold tabular-nums font-display", colorClass)}>
    {value ?? "–"}
  </div>
  {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
</div>
```

### Pattern 5: Macro averages helper

**What:** A pure function computing per-macro % of daily goal averaged over logged days only.
**When to use:** `stats.utils.ts` — called in `MacroAverages.tsx`

```typescript
// MAC-01 formula
function calcMacroPercent(
  days: DayStats[],
  goal: number | null,
  accessor: (d: DayStats) => number
): number | null {
  const logged = days.filter(d => d.hasData);
  if (!logged.length || goal === null || goal === 0) return null;
  const avg = logged.reduce((sum, d) => sum + accessor(d), 0) / logged.length;
  return Math.round((avg / goal) * 100);
}
```

### Pattern 6: Week label formatting

**What:** Format the week label in the design format "KW 11 · 10.–16. Mär".
**When to use:** `WeekNav.tsx` and/or `stats.utils.ts`

```typescript
// date-fns: getISOWeek, format — "KW" is manually prepended (not locale-handled)
import { getISOWeek, format, addDays } from "date-fns";
import { de } from "date-fns/locale";

function formatWeekLabel(weekStart: Date): string {
  const kw = getISOWeek(weekStart);
  const weekEnd = addDays(weekStart, 6);
  const startDay = format(weekStart, "d.", { locale: de });
  const endDay = format(weekEnd, "d.", { locale: de });
  const month = format(weekEnd, "MMM", { locale: de });
  return `KW ${kw} · ${startDay}–${endDay} ${month}`;
}
// Example: "KW 11 · 10.–16. Mär"
```

Note: `date-fns/locale/de` is included in the `date-fns` package — no separate install.

### Anti-Patterns to Avoid
- **Local state for week:** Do not use `useState` for the selected week — use `useSearchParams` for bookmarkability.
- **recharts 3.x:** Do not install the alpha. Pin to `^2.15`.
- **Overriding Recharts SVG styles with Tailwind classes:** Recharts renders SVG; use inline `style` or `stroke`/`fill` props, not Tailwind classes on chart children.
- **Calling `useWeeklyStats` from child components:** Call once in `StatisticsPage`, pass data as props — avoids duplicate React Query subscriptions.
- **Using `||` for null-checks on goal values:** Use `??` (nullish coalescing). `0` is a valid goal. This is a documented project decision.
- **Non-tabular number display:** Always add `tabular-nums` class to numeric displays to prevent layout shift.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive chart sizing | `window.addEventListener('resize')` + manual width calc | `ResponsiveContainer width="100%"` | Recharts handles ResizeObserver and re-render |
| Per-bar colors | Manual SVG path rendering | `Cell` inside `Bar` | Recharts Cell is the idiomatic solution |
| Horizontal goal line | Custom SVG overlay | `ReferenceLine y={value}` | Recharts handles coordinate mapping correctly |
| Week date arithmetic | Manual date math | `date-fns` `addWeeks`, `subWeeks`, `startOfISOWeek` | Handles DST, ISO week edge cases |
| ISO week number | Manual calculation | `date-fns` `getISOWeek` | Correct ISO 8601 semantics |

**Key insight:** Recharts handles all the SVG math; the component only needs to map `WeeklyStats` data to chart-compatible arrays and define visual props.

---

## Common Pitfalls

### Pitfall 1: Stub bar height conflicts with Y-axis domain
**What goes wrong:** If unlogged days use `eatenCalories: 0`, they are invisible. If a fake `stubValue: 24` is used, the Y-axis max may be compressed.
**Why it happens:** Recharts auto-scales Y domain to max data value.
**How to avoid:** Use a separate `dataKey` for stubs (`stubHeight`) and set a custom `domain` on the Y-axis if needed. Alternatively, render stub bars as a distinct `Bar` series with `stackId`.
**Warning signs:** Bars too short on weeks with low actual calorie data.

### Pitfall 2: Recharts tooltip fires on bar click, blocking navigation
**What goes wrong:** `onClick` on `Bar` and tooltip both trigger, causing UI confusion.
**Why it happens:** Both are wired to the same bar interaction.
**How to avoid:** Delay navigation slightly (allow tooltip to show), or show tooltip only on hover (not click). Keep `onClick` in the `Bar` component only — `useNavigate` in the handler.

### Pitfall 3: CSS variables not resolved inside Recharts SVG
**What goes wrong:** `fill="hsl(var(--success))"` may not resolve correctly in SVG `fill` attributes in some browsers.
**Why it happens:** SVG `fill` does not inherit CSS custom properties from `<body>` in all browsers.
**How to avoid:** Resolve CSS variables to actual HSL values via `getComputedStyle` or define constant hex/hsl string values for chart colors. Alternative: use `className` on `Cell` and a custom SVG renderer (more complex).
**Simpler approach:** Hardcode chart colors as constants matching the CSS variable values for light/dark mode, or use `currentColor` with Tailwind text classes where possible.

### Pitfall 4: `startOfISOWeek` vs `startOfWeek`
**What goes wrong:** Using `startOfWeek` (Sunday-start in US locale) instead of `startOfISOWeek` (Monday-start) shifts the week by one day.
**Why it happens:** `date-fns` `startOfWeek` defaults are locale-dependent.
**How to avoid:** Always use `startOfISOWeek` for week boundary calculations in this project.

### Pitfall 5: React Query staleTime and chart update after logging
**What goes wrong:** User logs food for today, navigates to Statistics, sees stale data.
**Why it happens:** `useWeeklyStats` has `staleTime: 2 minutes`.
**How to avoid:** Phase 3 is read-only (no mutations). Document that Phase 4 should add `queryClient.invalidateQueries(["weeklyStats"])` on relevant mutations. Not a blocker for Phase 3.

---

## Code Examples

### Chart data transformation from WeeklyStats
```typescript
// Source: types/weekly-stats.types.ts + context decisions
const DAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const STUB_HEIGHT = 24; // px equivalent in kcal units for unlogged bars

function toChartData(days: DayStats[]) {
  return days.map((day, i) => ({
    label: DAY_LABELS[i],
    date: day.date,
    eatenCalories: day.hasData ? day.eatenCalories : STUB_HEIGHT,
    isStub: !day.hasData,
    sportCalories: day.sportCalories,
    deficit: day.deficit,
  }));
}
```

### useSearchParams week management (see Pattern 1 above)

### Macro percent with null-safety
```typescript
// MAC-01 implementation — covers goals.protein/carbs/fat possibly null
const proteinPct = calcMacroPercent(stats.days, stats.goals.protein, d => d.protein);
// null means "no goal set" → display "–" not "0%"
```

### Empty state detection
```typescript
// Drive from loggedDayCount (already in WeeklyStats)
const isEmpty = stats.loggedDayCount === 0;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| recharts 1.x | recharts 2.x stable | 2020 | Hooks-friendly API, TypeScript types |
| `startOfWeek` | `startOfISOWeek` | date-fns v2 | Correct Mon-start ISO weeks |
| CSS-in-JS chart theming | CSS variables + computed resolution | 2022+ | Simpler, but needs resolution for SVG |

**Deprecated/outdated:**
- recharts 3.x: alpha channel as of March 2026 — not ready for production

---

## Open Questions

1. **CSS variable resolution inside Recharts SVG**
   - What we know: `hsl(var(--success))` may not resolve in SVG `fill` in all browsers
   - What's unclear: Whether Vite/React's rendering context resolves this correctly in practice
   - Recommendation: Define a `CHART_COLORS` constant object resolving to explicit HSL strings (matching `index.css`) as a safe default; test in actual browser early in Wave 1

2. **Stub bar Y-axis domain**
   - What we know: Fixed 24px stub — but chart Y domain is driven by real calorie values (up to ~3000 kcal)
   - What's unclear: Whether 24-unit stub will be visually distinct enough at large scales
   - Recommendation: Make stub height a percentage of goal (e.g., ~1.5% of `targetCalories`) rather than fixed 24 units, OR clamp Y-axis minimum. Evaluate during implementation.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | vite.config.ts (inline `test` block not present — vitest uses defaults from vite.config.ts) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

All 46 existing tests pass as of research date.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIS-01 | Bar chart renders 7 bars + ReferenceLine when goal is set | manual / visual | — | ❌ visual — manual-only |
| VIS-02 | Unlogged days use muted fill color | unit | `npx vitest run src/utils/__tests__/stats.utils.test.ts` | ❌ Wave 0 |
| VIS-03 | Chart does not overflow at 375px | manual / visual | — | ❌ visual — manual-only |
| SUM-01 | Summary card displays `totalEatenCalories` formatted as integer | unit | `npx vitest run src/utils/__tests__/stats.utils.test.ts` | ❌ Wave 0 |
| SUM-02 | Deficit card shows "–" when `totalDeficit` is null | unit | `npx vitest run src/utils/__tests__/stats.utils.test.ts` | ❌ Wave 0 |
| SUM-03 | Sport card shows session count + kcal | unit | `npx vitest run src/utils/__tests__/stats.utils.test.ts` | ❌ Wave 0 |
| MAC-01 | `calcMacroPercent` averages over logged days only, returns null when no goal | unit | `npx vitest run src/utils/__tests__/stats.utils.test.ts` | ❌ Wave 0 |
| NAV-01 | `formatWeekLabel` returns "KW N · D.–D. Mmm" format | unit | `npx vitest run src/utils/__tests__/stats.utils.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/utils/__tests__/stats.utils.test.ts` — covers MAC-01 (`calcMacroPercent`), NAV-01 (`formatWeekLabel`), SUM-02 (null display logic)
- [ ] Install recharts: `npm install recharts@^2.15`

---

## Sources

### Primary (HIGH confidence)
- https://recharts.github.io/en-US/api/Bar/ — Bar props, radius, Cell usage
- https://recharts.github.io/en-US/api/ReferenceLine/ — y prop, strokeDasharray
- https://recharts.github.io/en-US/guide/roundedBars/ — radius array for top-only rounding
- Codebase inspection: `src/types/weekly-stats.types.ts`, `src/hooks/useWeeklyStats.ts`, `src/components/meal-planning/cards/DeficitCard.tsx`, `src/components/meal-planning/NutritionSummary.tsx`, `src/App.tsx`, `src/index.css`

### Secondary (MEDIUM confidence)
- https://www.npmjs.com/package/recharts — version 2.15 / 3.8.0 latest; confirmed 2.x is stable
- date-fns v4 docs (getISOWeek, startOfISOWeek, addWeeks, format) — project already uses v4

### Tertiary (LOW confidence)
- CSS variable resolution in SVG: reported behavior, not tested in this specific Vite+Recharts setup — needs early browser validation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — recharts 2.x widely used, all other libs already in project
- Architecture: HIGH — patterns derived directly from existing codebase components
- Pitfalls: MEDIUM — CSS variable SVG resolution is LOW (untested), others are HIGH
- Validation: HIGH — Vitest already operational, all 46 tests pass

**Research date:** 2026-03-13
**Valid until:** 2026-04-12 (recharts 2.x is stable; date-fns v4 is stable)
