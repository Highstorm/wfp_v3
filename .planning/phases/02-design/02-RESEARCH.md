# Phase 2: Design - Research

**Researched:** 2026-03-13
**Domain:** Penpot design artifact creation — visual design of weekly statistics page
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Page Layout & Hierarchy**
- Chart first (~240px Höhe), dann Summary Cards, dann Makro-Sektion
- Gesamtstruktur von oben nach unten: Week Nav (sticky) → Bar Chart → Summary Cards (2+1 Grid) → Makro-Durchschnitte
- Mobile-first: 375px Breite als Basis

**Summary Card Design**
- Einfacher Stil: Label oben, große Zahl darunter, optionaler Subtitle (wie bestehendes DeficitCard-Pattern)
- Kalorien-Karte: Gesamtkalorien + Ø pro Tag als Subtitle (nur geloggte Tage)
- Defizit-Karte: Farbkodiert — grün bei Defizit (Ziel eingehalten), rot bei Überschuss
- Sport-Karte: kcal gesamt + Anzahl Sessions (z.B. "1,230 kcal · 4 Sessions")
- Card-Grid: Kalorien und Defizit nebeneinander (2 Spalten), Sport darunter volle Breite

**Bar Chart Appearance**
- Balkenfarbe nach Zielstatus: grün wenn unter/am Ziel, rot wenn drüber
- Ziel-Referenzlinie: gestrichelt mit Label "Ziel: X kcal" rechts
- Nicht geloggte Tage: kleiner grauer Placeholder-Balken (nicht leer, nicht verwechselbar mit 0)
- Keine Werte-Labels auf den Balken — Chart bleibt clean
- Y-Achse mit Skalierung als Referenz

**Week Navigation**
- Sticky am oberen Rand, bleibt beim Scrollen sichtbar
- Format: "KW 11 · 10.–16. Mär" (Kalenderwoche + Datumsbereich mit abgekürztem Monat)
- Prev/Next Pfeile (◀ ▶) links und rechts
- "Heute"-Button erscheint nur wenn nicht aktuelle Woche angezeigt wird
- Kein Swipe-Gesture — nur Buttons

**Macro-Durchschnitte**
- Eigene Sektion unterhalb der Summary Cards
- 3-Spalten Grid: Protein, Kohlenhydrate, Fett — jeweils als % des Tagesziels
- Nur geloggte Tage in Durchschnitt (aus Phase 1 übernommen)
- Fehlende Makro-Ziele → Bereich nicht anzeigen (aus Phase 1 übernommen)

### Claude's Discretion
- Exakte Farbtöne für grün/rot (innerhalb des bestehenden Farbsystems)
- Spacing und Padding innerhalb der Sektionen
- Typografie-Größen (konsistent mit bestehendem Styleguide)
- Loading/Skeleton-States
- Exakte Balkenbreite und -abstände im Chart

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIS-01 | Balkendiagramm zeigt Kalorien pro Tag (Mo–So) mit Tagesziel als Referenzlinie | Bar chart layout, color rules, and reference line position are fully specified in locked decisions |
| VIS-02 | Nicht geloggte Tage sind im Chart ausgegraut dargestellt | Gray placeholder bar pattern documented in locked decisions; color token `--muted` covers this |
| VIS-03 | Chart ist responsive und mobile-optimiert | 375px canvas confirmed; chart at ~240px height is the design constraint |
| SUM-01 | Karte zeigt Gesamtkalorien der Woche | Card pattern (Label + big number + subtitle) maps directly to DeficitCard DOM structure |
| SUM-02 | Karte zeigt kumuliertes Defizit/Überschuss | Color-coded card (green/red) uses existing `--success`/`--destructive` tokens |
| SUM-03 | Karte zeigt Sportkalorien gesamt (Anzahl Sessions + kcal) | Full-width card below 2-column grid; subtitle format "X kcal · Y Sessions" |
| MAC-01 | Durchschnittliche Makro-Zielerreichung in % — nur geloggte Tage | 3-column macro grid mirrors NutritionSummary.tsx structure; uses `text-protein`, `text-carbs`, `text-fat` tokens |
| NAV-01 | Wochennavigation zum Blättern zwischen Kalenderwochen | Sticky nav bar with prev/next + conditional "Heute" button; format "KW XX · DD.–DD. Mon" |
</phase_requirements>

---

## Summary

Phase 2 is a pure design artifact phase. The deliverable is a single Penpot screen in `wfp_v3.pen` showing the complete statistics page at 375px width. No code is written. The planner should structure this as one focused task: open the design file, build the screen using existing components/styleguide, and verify all visual requirements are met.

All design decisions are already locked by the CONTEXT.md discussion. The designer's job is to translate them into Penpot frames using the existing styleguide atoms (colors, typography, card shapes, spacing system). The codebase has been thoroughly audited — every CSS variable, card pattern, and component structure is documented below so the design maps precisely to what Phase 3 will implement.

The single biggest risk is design drift: creating new color values or spacing tokens that don't exist in the codebase. All design choices must stay within the documented CSS variable system.

**Primary recommendation:** One plan, one task — build the Penpot frame using only existing styleguide atoms. The spec is complete and unambiguous.

---

## Standard Stack

### Core Design Tool
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Penpot | Unknown | Design file format `.pen` | Project already uses it; existing styleguide is in `wfp_v3.pen` |

### Design File Location
- **Path:** `/Users/sebastianpieper/Development/wfp_v3.pen`
- **Status:** Exists, contains existing styleguide for the app
- **Access:** Must be opened in Penpot desktop or Penpot Cloud with import

---

## Architecture Patterns

### Recommended Screen Structure (375px frame, vertical scroll)

```
Frame: "Statistics Page" (375 × ~900px, mobile)
├── Week Navigation Bar (sticky, ~52px)
│   ├── ◀ Button (left)
│   ├── "KW 11 · 10.–16. Mär" (center, medium weight)
│   ├── "Heute" Button (conditional, right — ghost style)
│   └── ▶ Button (right)
├── Bar Chart Section (~240px height)
│   ├── Y-Axis labels (left side, muted text)
│   ├── 7 Bars (Mo–So)
│   │   ├── Logged + on target → success color
│   │   ├── Logged + over target → destructive color
│   │   └── Not logged → small gray placeholder
│   ├── Goal reference line (dashed, full width)
│   └── "Ziel: X kcal" label (right side of line, muted)
├── Summary Cards Section (padding: 16px)
│   ├── 2-column grid
│   │   ├── Kalorien Card (card style, p-4)
│   │   │   ├── "Kalorien" (sm, muted)
│   │   │   ├── "12,450" (2xl bold, tabular-nums)
│   │   │   └── "Ø 1,780 kcal/Tag" (xs, muted)
│   │   └── Defizit Card (card style, p-4)
│   │       ├── "Defizit" (sm, muted)
│   │       ├── "3,200" (2xl bold, success OR destructive)
│   │       └── "kcal" unit (sm, normal)
│   └── Sport Card (full width, card style, p-4)
│       ├── "Sport" (sm, muted)
│       ├── "4,560" (2xl bold, tabular-nums)
│       └── "kcal · 4 Sessions" (sm, muted)
└── Macro Averages Section (padding: 16px)
    ├── Section heading "Makro-Durchschnitte" (sm, muted, optional)
    └── 3-column grid
        ├── Protein (value in %, text-protein color, label below)
        ├── Kohlenhydrate (value in %, text-carbs color, label below)
        └── Fett (value in %, text-fat color, label below)
```

### Pattern 1: Card Layout (from codebase)
**What:** `.card p-4` — bg-card, rounded-lg, border border-border, shadow-soft
**When to use:** All three summary cards, week nav bar background
**CSS tokens to use:**
```
bg: hsl(var(--card))                 // card background
border: hsl(var(--border))           // 1px border
shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)
border-radius: var(--radius-lg) = 0.75rem = 12px
padding: 16px (p-4 = 1rem)
```

### Pattern 2: Typography Scale (from codebase)
**What:** Established text sizes used in existing components
```
Label (sm):    14px, text-muted-foreground, normal weight
Big Number:    24px (text-2xl), bold, tabular-nums
Hero Number:   96px (text-8xl), font-display (Outfit), font-black, tabular-nums
Subtitle:      12px (text-xs), text-muted-foreground
Section head:  14px, text-muted-foreground, uppercase optional
```
**Note:** `font-display` = Outfit font. `font-sans` = Inter. Numbers with units use Inter; hero stats use Outfit.

### Pattern 3: Color Usage (from codebase)
**What:** Semantic CSS variables — use ONLY these, no custom hex values
```
Green (on target / Defizit):  hsl(var(--success))     = hsl(142 72% 37%) light / hsl(142 70% 45%) dark
Red (over target / Überschuss): hsl(var(--destructive)) = hsl(0 72% 51%) light / hsl(0 63% 31%) dark
Gray placeholder bars:        hsl(var(--muted))        = hsl(210 40% 96%) light / hsl(217 33% 17%) dark
Protein:                      hsl(var(--color-protein)) = hsl(217 91% 60%)
Carbs:                        hsl(var(--color-carbs))   = hsl(160 84% 39%)
Fat:                          hsl(var(--color-fat))     = hsl(0 84% 60%)
Calories:                     hsl(var(--color-calories))= hsl(38 92% 50%)
Muted text:                   hsl(var(--muted-foreground))
Primary (app green):          hsl(var(--primary)) = hsl(160 84% 39%)
```

### Pattern 4: Week Navigation Bar
**What:** Sticky top bar with centered week label and flanking arrow buttons
**Structure mirroring existing MobileTabBar:** `border-b border-border bg-background`
**Button style:** `.btn-ghost` — transparent bg, hover with accent
**Typography:** medium weight (font-medium), ~16px, Inter

### Anti-Patterns to Avoid
- **Custom hex colors:** Never introduce hex values — always use CSS variable tokens
- **Recreating CalorieCard ring:** The weekly Kalorien card is NOT a ring chart — it's the simple DeficitCard pattern (Label + big number + subtitle)
- **Labels on bars:** Locked decision prohibits value labels on bar chart bars — keep chart clean
- **Swipe affordances:** No swipe gesture indicators — navigation is button-only
- **Showing macros when goal is null:** If macro goal is null, the entire macro section is hidden — design should show the "has goals" state only

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color values | Custom hex/rgb | CSS variable tokens from `src/index.css` | Phase 3 implements with these exact tokens; design drift breaks implementation |
| Card styling | New card shapes | `.card` pattern: radius-lg, border, shadow-soft | Existing pattern is what Phase 3 will code |
| Typography | New font sizes | Established text-sm/text-2xl/text-xs scale | Already defined in Tailwind config |
| Spacing | Arbitrary padding | 4px grid: p-4=16px, gap-4=16px, p-6=24px | Tailwind spacing is 4px increments |

**Key insight:** Every design element has a direct code counterpart. The design is a pixel-accurate specification for Phase 3 — deviations create implementation rework.

---

## Common Pitfalls

### Pitfall 1: Bar Chart Height Ambiguity
**What goes wrong:** Chart height is "~240px" but Y-axis scale depends on data values — unclear how to represent in a static design
**Why it happens:** Charts are dynamic; design is static
**How to avoid:** Use representative sample data (e.g., week with mix of on-target, over-target, and unlogged days). Annotate the design with "example data" notes. Show the chart at 240px height as a fixed frame.
**Warning signs:** If the chart frame has no Y-axis values at all, Phase 3 won't know the scale behavior

### Pitfall 2: Forgetting Dark Mode
**What goes wrong:** Design only shows light mode; Phase 3 must support dark mode
**Why it happens:** It's easy to design only one theme
**How to avoid:** Either show both variants in the design, OR annotate which CSS tokens are used (tokens automatically adapt). Annotating tokens is sufficient — dark mode is handled by CSS variables, not separate frames.
**Warning signs:** Design shows specific hex values instead of token references

### Pitfall 3: Gray Placeholder vs. Zero-Calorie Day
**What goes wrong:** Unlogged days and days with legitimately 0 calories look the same
**Why it happens:** Both cases could render as "no bar"
**How to avoid:** Design shows explicitly small (e.g., 20-24px) gray placeholder stub for unlogged days. Days with actual 0 kcal logged show a minimal but distinct green bar at the baseline.
**Warning signs:** All-or-nothing bar treatment (bar or no bar)

### Pitfall 4: "Heute" Button Layout
**What goes wrong:** Button appears even when viewing current week, pushing nav content
**Why it happens:** Fixed layout doesn't account for conditional element
**How to avoid:** Design shows BOTH states — with and without "Heute" button — or shows the button appearing as an overlay/badge rather than layout-shifting element. Locked decision says button only appears when not current week, so design the "past week" state as primary and note the absence in current week.
**Warning signs:** Single-state nav design with no annotation about conditional button

### Pitfall 5: WeeklyStats Data Mapping Confusion
**What goes wrong:** Design labels don't match what the data actually provides
**Why it happens:** Designer uses intuitive labels that don't match WeeklyStats field names
**How to avoid:** Verify design labels against `WeeklyStats` type:
```
totalEatenCalories  → Kalorien-Karte Hauptzahl
avgEatenCalories    → Kalorien-Karte Subtitle (Ø pro Tag)
totalDeficit        → Defizit-Karte Hauptzahl (positive = Defizit grün)
totalSportCalories  → Sport-Karte Hauptzahl
totalSportSessions  → Sport-Karte Subtitle (X Sessions)
days[n].eatenCalories → Bar height
days[n].hasData     → false = gray placeholder bar
goals.targetCalories → Referenzlinie Y-position
```

---

## Code Examples

Existing patterns that design must reflect:

### DeficitCard Pattern (basis for all 3 summary cards)
```typescript
// Source: src/components/meal-planning/cards/DeficitCard.tsx
<div className="card p-4">
  <div className="text-sm text-muted-foreground">Defizit</div>
  <div className="text-2xl font-bold">
    {value} kcal
  </div>
  {subtitle && (
    <div className="text-sm text-muted-foreground">{subtitle}</div>
  )}
</div>
```

### Color-Coded Value (Defizit/Überschuss)
```typescript
// Source: src/components/meal-planning/cards/CalorieCard.tsx
className={cn(
  "text-2xl font-bold tabular-nums",
  isOver ? "text-destructive" : isOnTarget ? "text-success" : "text-foreground"
)}
```

### Macro Grid Pattern (3-column)
```typescript
// Source: src/components/meal-planning/NutritionSummary.tsx
<div className="grid grid-cols-3 gap-4 mt-6">
  <div>
    <div className="font-display font-extrabold text-2xl tabular-nums text-protein">
      {protein}%
    </div>
    <div className="text-xs text-muted-foreground">Protein</div>
  </div>
  // ... carbs, fat same structure
</div>
```

### CSS Variable Reference for Penpot
```
Background:       hsl(60, 9%, 98%)    — light mode canvas
Card:             hsl(0, 0%, 100%)    — card surface
Border:           hsl(214, 32%, 91%)  — card border
Muted text:       hsl(215, 16%, 47%)  — labels
Success (green):  hsl(142, 72%, 37%)  — on target / deficit
Destructive (red):hsl(0, 72%, 51%)    — over target / surplus
Protein (blue):   hsl(217, 91%, 60%)  — protein color
Carbs (green):    hsl(160, 84%, 39%)  — carbs color (= primary)
Fat (red-ish):    hsl(0, 84%, 60%)    — fat color
Calories (amber): hsl(38, 92%, 50%)   — calorie color
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Kalorien Card with ring chart | Simple Label+Number DeficitCard pattern | Ring is NOT used for weekly stats — simpler pattern chosen in CONTEXT.md |
| Dashboard placeholder ("Coming soon") | Statistics page replaces /dashboard | Phase 4 concern; design phase ignores routing |

---

## Open Questions

1. **Loading/Skeleton States**
   - What we know: Skeleton states are Claude's Discretion area
   - What's unclear: Should the design include a skeleton frame, or is it deferred to Phase 3?
   - Recommendation: Show one skeleton state frame in the design (gray bars in chart, placeholder card values) — gives Phase 3 a target; takes minimal extra design time

2. **"Heute" Button Placement**
   - What we know: Button appears only when not on current week; it flanks the right arrow
   - What's unclear: Does it replace the right arrow? Appear between label and right arrow? Or above?
   - Recommendation: Show "Heute" as a small text button between the week label and ▶ button. This avoids layout shift — it appears in a reserved slot.

3. **Macro Section Heading**
   - What we know: Section exists below summary cards; 3-column grid layout
   - What's unclear: Is there a visible section heading (e.g., "Makros" or "Ø Makros")?
   - Recommendation: Add "Ø Makros" as a small muted label above the grid — helps visual hierarchy without adding noise

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 (unit) + Playwright 1.49.1 (E2E) |
| Config file | `vitest.config.ts` (unit) / `playwright.config.ts` (E2E) |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm run test:e2e` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIS-01 | Bar chart shows daily calories with goal line | manual-only | N/A — visual design artifact | N/A |
| VIS-02 | Unlogged days are grayed in chart | manual-only | N/A — visual design artifact | N/A |
| VIS-03 | Chart is mobile-optimized (375px) | manual-only | N/A — visual design artifact | N/A |
| SUM-01 | Kalorien card shows total weekly calories | manual-only | N/A — visual design artifact | N/A |
| SUM-02 | Defizit card shows cumulative deficit/surplus | manual-only | N/A — visual design artifact | N/A |
| SUM-03 | Sport card shows kcal + session count | manual-only | N/A — visual design artifact | N/A |
| MAC-01 | Macro % section visible with 3-column grid | manual-only | N/A — visual design artifact | N/A |
| NAV-01 | Week navigation with prev/next and format | manual-only | N/A — visual design artifact | N/A |

**Note:** Phase 2 is entirely a design artifact phase. All verification is manual — reviewing the Penpot screen against the success criteria. No automated tests apply to this phase.

### Sampling Rate
- **Per task commit:** N/A — visual inspection only
- **Per wave merge:** Visual review against success criteria checklist
- **Phase gate:** All 4 success criteria from ROADMAP.md verified before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements (N/A: design-only phase, no test files required)

---

## Sources

### Primary (HIGH confidence)
- `src/index.css` — complete CSS variable system, all color tokens with HSL values
- `src/components/meal-planning/cards/DeficitCard.tsx` — card DOM pattern for summary cards
- `src/components/meal-planning/cards/CalorieCard.tsx` — color-coding logic (isOver/isOnTarget)
- `src/components/meal-planning/NutritionSummary.tsx` — 3-column macro grid pattern
- `tailwind.config.ts` — complete token system (colors, spacing, shadows, radius, typography)
- `src/types/weekly-stats.types.ts` — `WeeklyStats` and `DayStats` data shapes from Phase 1
- `.planning/phases/02-design/02-CONTEXT.md` — all locked design decisions

### Secondary (MEDIUM confidence)
- `src/components/layout/MobileTabBar.tsx` — nav bar structural pattern for week navigation
- `.planning/ROADMAP.md` — phase success criteria and scope boundaries
- `.planning/codebase/CONVENTIONS.md` — spacing, typography, and Tailwind class conventions

---

## Metadata

**Confidence breakdown:**
- Design constraints (locked decisions): HIGH — fully documented in CONTEXT.md
- CSS token values: HIGH — read directly from source files
- Penpot tool specifics: LOW — tool not directly inspectable; design file format is binary
- Component DOM patterns: HIGH — read from actual source components

**Research date:** 2026-03-13
**Valid until:** 2026-06-13 (stable — CSS tokens and components don't change without Phase 3 work)
