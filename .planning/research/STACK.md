# Stack Research

**Domain:** React charting / statistics visualization (nutrition tracking)
**Researched:** 2026-03-12
**Confidence:** HIGH

## Context

This is an additive milestone — the existing stack (React 18.2, TypeScript 5.2, Tailwind CSS 3.4, date-fns 4.1, TanStack Query 5.64, Firebase 12.5) is already decided and must not change. This research covers only the charting library needed for the weekly statistics page.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| recharts | 3.8.0 | Bar charts, ReferenceLine, responsive containers | Highest adoption (3.6M+ weekly npm downloads), first-class TypeScript generics in v3, composable React component API matches existing code style, ships `ReferenceLine` and `ResponsiveContainer` as built-in primitives, lightest bundle among full-featured alternatives (uses selective D3 submodules, not all of D3), explicit React 18 support confirmed |

No other new core technologies are needed. All data fetching (TanStack Query), date math (date-fns), and styling (Tailwind) are already in the stack.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| recharts | 3.8.0 | `BarChart`, `Bar`, `XAxis`, `YAxis`, `ReferenceLine`, `ResponsiveContainer`, `Tooltip` | Every chart component on the statistics page |

No additional supporting libraries are required. Recharts covers all chart primitives needed (bar chart + reference line + responsive wrapper). Color and typography come from existing Tailwind tokens.

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| TypeScript (existing, 5.2.2) | Type-safe chart data and props | Recharts 3.x ships full TypeScript generics for `data` and `dataKey`; no `@types/recharts` package needed (types are bundled) |

## Installation

```bash
# Single addition to existing project
npm install recharts@3.8.0
```

No dev dependencies needed — types are bundled in recharts 3.x.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| recharts 3.x | nivo | If you need server-side rendering (SSR), canvas rendering, or 20+ chart types. Larger bundle. Overkill for a single bar chart view. |
| recharts 3.x | victory | If building a React Native app alongside the web app or need best-in-class ARIA/accessibility by default. Larger bundle than recharts, fewer community resources. |
| recharts 3.x | visx (Airbnb) | If you need near-D3-level control and have significant chart complexity. Low-level API requires writing more code for basic charts. Poor trade-off for a simple bar chart + reference line. |
| recharts 3.x | Chart.js (react-chartjs-2) | If you need Canvas rendering for large datasets (1000+ data points). Canvas is unnecessary for 7 data points per week. Imperative API is a poor fit for React. |
| recharts 3.x | tremor / shadcn charts | If you want pre-styled dashboard components with zero configuration. Both wrap recharts internally anyway — no benefit to adding an abstraction layer here. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| D3.js directly | Imperative DOM manipulation paradigm conflicts with React's declarative model; requires significant boilerplate for simple charts; full D3 bundle is ~500 KB | recharts (uses selective D3 submodules internally) |
| recharts 2.x | Active development is on 3.x; 2.x lacks TypeScript generics for data/dataKey, has the now-removed `alwaysShow` prop on ReferenceLine, and will not receive bug fixes | recharts 3.x |
| Chart.js / react-chartjs-2 | Canvas-based, imperative config object API, not composable with React's component model, poor Tailwind integration (custom color strings instead of CSS variables) | recharts |
| @types/recharts | Stale community types package for recharts 1.x — recharts 3.x ships its own types | None needed; types bundled |

## Stack Patterns by Variant

**For the weekly bar chart (calories per day vs. goal):**
- Use `ResponsiveContainer` as the outermost wrapper (percentage width, fixed height ~220px on mobile)
- Use `BarChart` with `Bar` for daily calorie data
- Use `ReferenceLine` with `y={calorieGoal}` for the daily target line
- Apply Tailwind color tokens via `fill` and `stroke` props as inline CSS variables (e.g., `fill="var(--color-nutrition-protein)"`)

**For macro average display (% of daily goal):**
- This is a calculated number display (Protein 87%, Carbs 102%, Fat 74%), not a chart
- Do NOT use a chart library for this — render as styled `<div>` bars with Tailwind width utilities (`w-[87%]`)
- Recharts adds unnecessary complexity for a simple progress bar

**If adding more chart types later (trend lines, monthly view):**
- recharts `LineChart` and `ComposedChart` are available in the same package — no new dependency needed

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| recharts@3.8.0 | react@18.2.0 | Confirmed; peer dep is React 16.8+ |
| recharts@3.8.0 | typescript@5.2.2 | Confirmed; recharts 3.x requires TypeScript 5.x |
| recharts@3.8.0 | tailwindcss@3.4.1 | Compatible — Tailwind applies to wrapper divs; chart internals styled via recharts props |
| recharts@3.8.0 | vite@5.1.0 | No known issues; standard ES module build |

## Key recharts 3.x Upgrade Notes

These breaking changes from 2.x → 3.x are relevant if any existing recharts code exists (none found in current codebase):

- `accessibilityLayer` now defaults to `true` — keyboard events no longer trigger `onMouseMove`
- Custom tooltip prop type changed from `TooltipProps` to `TooltipContentProps`
- `CategoricalChartState` removed from `<Customized />` — use hooks instead
- Y-axes render alphabetically by `yAxisId` in multi-axis charts
- Tooltip must render before Legend in JSX (z-index is determined by render order in SVG)

## Sources

- [recharts npm page](https://www.npmjs.com/package/recharts) — latest version 3.8.0 confirmed (HIGH confidence)
- [recharts GitHub releases](https://github.com/recharts/recharts/releases) — 3.8.0 released March 6, 2025 (HIGH confidence)
- [recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide) — breaking changes verified (HIGH confidence)
- [recharts ReferenceLine API](https://recharts.github.io/en-US/api/ReferenceLine/) — `y` prop for horizontal reference lines confirmed (HIGH confidence)
- [LogRocket React chart libraries comparison 2025](https://blog.logrocket.com/best-react-chart-libraries-2025/) — bundle size and feature comparison (MEDIUM confidence, secondary source)

---
*Stack research for: React charting / nutrition statistics visualization*
*Researched: 2026-03-12*
