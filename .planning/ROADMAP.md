# Roadmap: WFP — Weekly Statistics Page

## Overview

Adding a weekly statistics page to an existing React/Firebase nutrition tracker. The work flows in one direction: correct data first, design second, UI third, wiring last. Phase 1 builds the data foundation (types, utilities, Firestore range query, goal resolution, hook). Phase 2 creates a visual design in the Pencil editor using the existing wfp_v3.pen styleguide as reference. Phase 3 builds every presentational component against that design and typed data. Phase 4 assembles the page, wires routing, and replaces the existing dashboard nav entry. After Phase 4 ships, Sebastian can open the statistics page, browse any calendar week, and immediately see his calorie balance, deficit, macro averages, and sport totals.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Data Foundation** - Types, utilities, Firestore range query, goal resolution, and the useWeeklyStats hook (completed 2026-03-12)
- [x] **Phase 2: Design** - Visual design der Statistik-Seite in wfp_v3.pen anhand Requirements und bestehendem Styleguide (completed 2026-03-13)
- [ ] **Phase 3: Statistics UI** - Bar chart, summary cards, macro averages, and week navigation components — nach Design
- [ ] **Phase 4: Integration** - Page assembly, lazy-loaded route, and nav wiring

## Phase Details

### Phase 1: Data Foundation
**Goal**: The weekly statistics data pipeline is correct, typed, and independently verifiable — no UI required
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. Calling the repository with a Monday date returns exactly the 7 MealPlan documents for that ISO week (or fewer if some days have no entry)
  2. Days with no MealPlan document are represented as `hasData: false` entries and produce no contribution to averages or deficit totals
  3. The calorie goal resolves via WeeklyNutritionGoals first, falling back to UserProfile — readable in a unit test without touching Firestore
  4. The deficit for any logged day equals (targetCalories + sportCalories) − eatenCalories, verifiable by inspecting hook output in React Query DevTools
**Plans:** 2/2 plans complete
Plans:
- [x] 01-01-PLAN.md — TDD: Types, goal resolution, and weekly aggregation pure functions with unit tests
- [ ] 01-02-PLAN.md — Firestore range query (getMealPlansByWeek) and useWeeklyStats React Query hook

### Phase 2: Design
**Goal**: Ein visuelles Design der Statistik-Seite existiert in wfp_v3.pen, das als Referenz für die UI-Implementierung dient
**Depends on**: Phase 1 (Types und Datenstruktur müssen bekannt sein)
**Requirements**: VIS-01, VIS-02, VIS-03, SUM-01, SUM-02, SUM-03, MAC-01, NAV-01 (Design-Vorlage für alle UI-Requirements)
**Design Reference**: `wfp_v3.pen` (enthält bestehenden Styleguide der App)
**Success Criteria** (what must be TRUE):
  1. Ein Design-Screen in wfp_v3.pen zeigt die vollständige Statistik-Seite (Mobile-Ansicht, 375px)
  2. Design enthält: Wochennavigation, Summary-Cards (Kalorien, Defizit, Sport), Balkendiagramm mit Ziel-Linie, Makro-%-Anzeige
  3. Nicht geloggte Tage sind visuell als ausgegraut erkennbar
  4. Design nutzt den bestehenden Styleguide aus wfp_v3.pen (Farben, Typografie, Spacing)
**Plans:** 1/1 plans complete
Plans:
- [ ] 02-01-PLAN.md — Design specification and Penpot screen creation

### Phase 3: Statistics UI
**Goal**: Every statistics component renders correct, readable data from the Phase 1 hook — matching the Phase 2 design
**Depends on**: Phase 1 (data), Phase 2 (design)
**Requirements**: VIS-01, VIS-02, VIS-03, SUM-01, SUM-02, SUM-03, MAC-01, NAV-01
**Success Criteria** (what must be TRUE):
  1. The bar chart shows one bar per day (Mon-Sun), a horizontal reference line at the calorie goal, and visually distinct (grayed) bars for days with no data
  2. The three summary cards display total calories consumed, cumulative deficit/surplus, and total sport calories with session count — all matching the hook output
  3. The macro section shows Protein, Carbs, and Fat each as a percentage of daily goal, averaged over logged days only
  4. The week navigation shows the current ISO week label and prev/next buttons that shift the displayed week
  5. All components are legible and non-overflowing on a 375px wide screen
  6. UI matches the Phase 2 design from wfp_v3.pen (Farben, Layout, Spacing)
**Plans:** 1/2 plans executed
Plans:
- [ ] 03-01-PLAN.md — TDD: Install recharts + stats utility helpers (formatWeekLabel, calcMacroPercent, toChartData)
- [ ] 03-02-PLAN.md — All statistics components (WeekNav, SummaryCards, MacroAverages, BarChart) + StatisticsPage shell

### Phase 4: Integration
**Goal**: The statistics page is live at its own route, accessible from every navigation entry point, and does not regress existing app performance
**Depends on**: Phase 3
**Requirements**: NAV-02
**Success Criteria** (what must be TRUE):
  1. Navigating to /statistics (or tapping the nav entry on mobile) loads the full statistics page for the current ISO week
  2. The existing /dashboard route and its nav entry in both Sidebar and MobileTabBar are replaced by the statistics entry — no duplicate nav items
  3. The Recharts library does not appear in the main bundle (vite build output shows it only in the statistics route chunk)
  4. Navigating away from the statistics page and back to the meal planner works without errors or stale state
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Data Foundation | 2/2 | Complete   | 2026-03-12 |
| 2. Design | 1/1 | Complete   | 2026-03-13 |
| 3. Statistics UI | 1/2 | In Progress|  |
| 4. Integration | 0/? | Not started | - |
