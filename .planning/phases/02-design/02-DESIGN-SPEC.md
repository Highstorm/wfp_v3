# Design Specification: Statistics Page

**Version:** 1.0
**Phase:** 02-design
**Status:** Final

---

## Overview

Pixel-precise specification for the Weekly Statistics Page. All measurements are in pixels. All colors reference CSS variable tokens from `src/index.css`. This document is the single source of truth for Sebastian building the Penpot screen and for Phase 3 implementing the React components.

---

## Canvas

| Property | Value |
|----------|-------|
| Frame name | "Statistics Page" |
| Width | **375px** |
| Height | ~900px (vertical scroll) |
| Background | `hsl(60, 9%, 98%)` — page background |
| Overflow | Scroll (vertical) |

---

## Section 1: Week Navigation Bar

**Purpose:** Persistent sticky bar for week navigation. Visible at all times while scrolling.

| Property | Value |
|----------|-------|
| Position | Sticky, top: 0 |
| Width | 375px (full width) |
| Height | **52px** |
| Background | `hsl(0, 0%, 100%)` — bg-background |
| Border | Bottom 1px solid `hsl(214, 32%, 91%)` — border-b border-border |
| Padding | 0 8px |

### Layout (horizontal, vertically centered, space-between)

```
[ ◀ ]    [  KW 11 · 10.–16. Mär  ]    [ Heute ]  [ ▶ ]
  40px         flex-1 center             conditional  40px
```

**Left: Prev Button**
| Property | Value |
|----------|-------|
| Size | 40×40px tap target |
| Style | Ghost (no background, no border) |
| Icon | chevron-left (Lucide), 20px, `hsl(215, 16%, 47%)` muted |

**Center: Week Label**
| Property | Value |
|----------|-------|
| Text | "KW 11 · 10.–16. Mär" |
| Font | Inter |
| Weight | 500 (font-medium) |
| Size | **16px** |
| Color | `hsl(222, 84%, 5%)` — foreground |
| Alignment | Center |

**Right: "Heute" Button (CONDITIONAL — only when NOT current week)**
| Property | Value |
|----------|-------|
| Text | "Heute" |
| Font | Inter, 14px |
| Weight | 400 (normal) |
| Color | `hsl(160, 84%, 39%)` — primary (app green) |
| Style | Ghost text button |
| Position | Between center label and right arrow |
| Visibility | HIDDEN when viewing current week; SHOWN when viewing past or future week |

**Right: Next Button**
| Property | Value |
|----------|-------|
| Size | 40×40px tap target |
| Style | Ghost (no background, no border) |
| Icon | chevron-right (Lucide), 20px, `hsl(215, 16%, 47%)` muted |

### States to Show in Design

Show **two frames** side by side in Penpot (or annotate with notes):
1. **State A — Current week:** `[ ◀ ]  KW 11 · 10.–16. Mär  [ ▶ ]` (no Heute button)
2. **State B — Past week:** `[ ◀ ]  KW 10 · 3.–9. Mär  [ Heute ]  [ ▶ ]` (Heute visible)

---

## Section 2: Bar Chart

**Purpose:** Visual weekly overview of daily calorie intake vs. goal.

| Property | Value |
|----------|-------|
| Width | 375px |
| Height | **240px** |
| Padding | 16px left, 16px right |
| Margin | 16px top (below week nav) |
| Background | transparent (page background shows through) |

### Layout

```
[Y-axis]  [Bar][Bar][Bar][Bar][Bar][Bar][Bar]
          [Mo] [Di] [Mi] [Do] [Fr] [Sa] [So]
```

**Y-Axis (left side)**
| Property | Value |
|----------|-------|
| Width | ~40px reserved |
| Labels | 4 scale markers: 0, 1000, 2000, 3000 |
| Font | Inter, **10px** |
| Color | `hsl(215, 16%, 47%)` — muted-foreground |
| Alignment | Right-aligned |

**Bars**
| Property | Value |
|----------|-------|
| Count | 7 (Mo through So) |
| Layout | Evenly spaced within chart area (after Y-axis reserve) |
| Width | ~28px each (with ~8px gap between) |
| Corner radius | 4px (top corners only) |
| Max height | ~200px (maps to chart max, e.g., 3000 kcal) |

**Day Labels (below bars)**
| Property | Value |
|----------|-------|
| Text | "Mo", "Di", "Mi", "Do", "Fr", "Sa", "So" |
| Font | Inter, **12px** |
| Color | `hsl(215, 16%, 47%)` — muted-foreground |
| Position | Below chart area, centered under each bar |

**Goal Reference Line (Ziel-Linie)**
| Property | Value |
|----------|-------|
| Position | Horizontal line at Y-position corresponding to `goals.targetCalories` (2,100 kcal in sample) |
| Style | Dashed, 1px |
| Color | `hsl(215, 16%, 47%)` — muted-foreground |
| Label | "Ziel: 2.100 kcal" — right-aligned, 11px, `hsl(215, 16%, 47%)` |
| Extends | Full width of chart area |

### Bar Color Rules

| Condition | Bar Color | CSS Token |
|-----------|-----------|-----------|
| `hasData = true` AND `eatenCalories <= targetCalories` | **Success green** | `hsl(142, 72%, 37%)` — `hsl(var(--success))` |
| `hasData = true` AND `eatenCalories > targetCalories` | **Destructive red** | `hsl(0, 72%, 51%)` — `hsl(var(--destructive))` |
| `hasData = false` (day not logged) | **Gray stub, fixed height ~24px** | `hsl(210, 40%, 96%)` — `hsl(var(--muted))` |

Note: Gray stub has a **fixed small height** (~24px) regardless of scale. This visually distinguishes "not logged" from "logged 0 kcal". Days with legitimately 0 kcal logged show a minimal but distinct green bar at baseline.

### Sample Data for Design

| Day | Calories | vs. Goal (2,100) | Bar Color | Bar Height (approx) |
|-----|----------|-------------------|-----------|---------------------|
| Mo | 1,850 kcal | Under target | Success green | ~124px |
| Di | 2,300 kcal | Over target | Destructive red | ~154px |
| Mi | 1,950 kcal | Under target | Success green | ~130px |
| Do | (not logged) | — | Gray stub | 24px (fixed) |
| Fr | 2,100 kcal | At target (=) | Success green | ~140px |
| Sa | 2,500 kcal | Over target | Destructive red | ~167px |
| So | 1,700 kcal | Under target | Success green | ~113px |

Bar heights are proportional. Scale: 3,000 kcal = 200px → 1 kcal = 0.0667px.

---

## Section 3: Summary Cards

**Purpose:** Three cards presenting aggregated weekly numbers.

| Property | Value |
|----------|-------|
| Padding | 16px horizontal, 16px top |
| Gap between cards | **12px** (gap-3) |

### Card Base Style (applies to all 3 cards)

| Property | Value |
|----------|-------|
| Background | `hsl(0, 0%, 100%)` — bg-card |
| Border | 1px solid `hsl(214, 32%, 91%)` — border |
| Border radius | **12px** (radius-lg = 0.75rem) |
| Shadow | `0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)` — shadow-soft |
| Padding | **16px** (p-4) |

### Row 1: 2-Column Grid

**Card 1: Kalorien**

| Element | Value | Style |
|---------|-------|-------|
| Label | "Kalorien" | 14px Inter, `hsl(215, 16%, 47%)` muted, normal weight |
| Main number | "12.400" | **24px** Inter bold, `tabular-nums`, foreground color |
| Subtitle | "Ø 2.067 kcal/Tag" | 12px Inter, `hsl(215, 16%, 47%)` muted |

*Data mapping: `WeeklyStats.totalEatenCalories` → main number; `WeeklyStats.avgEatenCalories` → subtitle (only logged days)*

**Card 2: Defizit**

| Element | Value | Style |
|---------|-------|-------|
| Label | "Defizit" | 14px Inter, `hsl(215, 16%, 47%)` muted, normal weight |
| Main number | "2.200" | **24px** Inter bold, `tabular-nums`, **colored** |
| Unit | "kcal" | 14px Inter, normal weight, same color as number |

Number color rule:
- Positive value (deficit = good): `hsl(142, 72%, 37%)` — success green
- Negative value (surplus = bad): `hsl(0, 72%, 51%)` — destructive red

*Data mapping: `WeeklyStats.totalDeficit` → main number; positive = green, negative = red*

### Row 2: Full-Width Sport Card

**Card 3: Sport**

| Element | Value | Style |
|---------|-------|-------|
| Label | "Sport" | 14px Inter, `hsl(215, 16%, 47%)` muted, normal weight |
| Main number | "1.230" | **24px** Inter bold, `tabular-nums`, foreground color |
| Subtitle | "kcal · 4 Sessions" | 14px Inter, `hsl(215, 16%, 47%)` muted |

*Data mapping: `WeeklyStats.totalSportCalories` → main number; `WeeklyStats.totalSportSessions` → session count in subtitle*

---

## Section 4: Macro Averages

**Purpose:** Weekly average macro consumption as percentage of daily goal, per-macro breakdown.

| Property | Value |
|----------|-------|
| Padding | 16px horizontal, 16px top, 24px bottom |
| Background | transparent |

### Section Heading (optional)

| Property | Value |
|----------|-------|
| Text | "Ø Makros" |
| Font | Inter, **14px** |
| Color | `hsl(215, 16%, 47%)` — muted-foreground |
| Weight | Normal |
| Margin bottom | 8px |

### 3-Column Grid

| Property | Value |
|----------|-------|
| Columns | 3 equal columns |
| Gap | **16px** (gap-4) |

**Column structure (same for all 3):**

```
[Large % Number]  ← 24px bold, tabular-nums, macro color
[Label text]      ← 12px muted
```

**Column 1: Protein**

| Element | Value | Style |
|---------|-------|-------|
| Value | "87%" | **24px** Inter, `font-display` (Outfit), bold, `tabular-nums` |
| Color | `hsl(217, 91%, 60%)` — `hsl(var(--color-protein))` protein blue |
| Label | "Protein" | 12px, `hsl(215, 16%, 47%)` muted |

**Column 2: Kohlenhydrate**

| Element | Value | Style |
|---------|-------|-------|
| Value | "102%" | **24px** Inter, `font-display` (Outfit), bold, `tabular-nums` |
| Color | `hsl(160, 84%, 39%)` — `hsl(var(--color-carbs))` carbs green |
| Label | "Kohlenhydrate" | 12px, `hsl(215, 16%, 47%)` muted |

**Column 3: Fett**

| Element | Value | Style |
|---------|-------|-------|
| Value | "94%" | **24px** Inter, `font-display` (Outfit), bold, `tabular-nums` |
| Color | `hsl(0, 84%, 60%)` — `hsl(var(--color-fat))` fat red |
| Label | "Fett" | 12px, `hsl(215, 16%, 47%)` muted |

*Data mapping: `WeeklyStats.avgProteinPercent`, `WeeklyStats.avgCarbsPercent`, `WeeklyStats.avgFatPercent` — only shown when `ResolvedGoals.protein/carbs/fat` are NOT null*

---

## Data Mapping Reference

Full mapping from visual element to `WeeklyStats` data fields (as defined in `src/types/weekly-stats.types.ts`):

| Visual Element | Data Field | Notes |
|----------------|------------|-------|
| Bar height (each day) | `days[n].eatenCalories` | n=0 (Mo) through n=6 (So) |
| Bar color (green/red) | `days[n].eatenCalories` vs `goals.targetCalories` | green ≤ target, red > target |
| Gray stub (no bar) | `days[n].hasData === false` | Fixed 24px height |
| Goal reference line Y | `goals.targetCalories` | 2,100 kcal in sample |
| Kalorien card number | `WeeklyStats.totalEatenCalories` | Sum of logged days only |
| Kalorien card subtitle | `WeeklyStats.avgEatenCalories` | Average per logged day |
| Defizit card number | `WeeklyStats.totalDeficit` | Positive = deficit (green), Negative = surplus (red) |
| Sport card number | `WeeklyStats.totalSportCalories` | Total sport kcal across week |
| Sport card subtitle | `WeeklyStats.totalSportSessions` | Count of sessions, e.g. "4 Sessions" |
| Protein % | `WeeklyStats.avgProteinPercent` | Average of logged days |
| Kohlenhydrate % | `WeeklyStats.avgCarbsPercent` | Average of logged days |
| Fett % | `WeeklyStats.avgFatPercent` | Average of logged days |
| Week label | Computed from `startDate` | Format: "KW {n} · {DD}.–{DD}. {Mon}" |
| Macro section visibility | `goals.protein !== null && goals.carbs !== null && goals.fat !== null` | Hide entire section if any macro goal is null |

---

## Complete CSS Variable Reference

All values are light-mode. Use CSS variables in code; use exact HSL values in Penpot:

| Token | CSS Variable | Light Mode HSL | Penpot Color |
|-------|-------------|----------------|-------------|
| Page background | `--background` | `hsl(60, 9%, 98%)` | Used as canvas background |
| Card background | `--card` | `hsl(0, 0%, 100%)` | Card fill |
| Border | `--border` | `hsl(214, 32%, 91%)` | Card border, nav border |
| Foreground | `--foreground` | `hsl(222, 84%, 5%)` | Primary text |
| Muted foreground | `--muted-foreground` | `hsl(215, 16%, 47%)` | Labels, subtitles, muted text |
| Muted background | `--muted` | `hsl(210, 40%, 96%)` | Gray stub bars for unlogged days |
| Success (green) | `--success` | `hsl(142, 72%, 37%)` | On-target bars, deficit card |
| Destructive (red) | `--destructive` | `hsl(0, 72%, 51%)` | Over-target bars, surplus card |
| Primary (app green) | `--primary` | `hsl(160, 84%, 39%)` | "Heute" button, primary actions |
| Protein (blue) | `--color-protein` | `hsl(217, 91%, 60%)` | Protein macro value |
| Carbs (green) | `--color-carbs` | `hsl(160, 84%, 39%)` | Carbs macro value |
| Fat (red) | `--color-fat` | `hsl(0, 84%, 60%)` | Fat macro value |
| Calories (amber) | `--color-calories` | `hsl(38, 92%, 50%)` | (Not used in this design) |

---

## Typography Reference

| Role | Size | Font | Weight | Class |
|------|------|------|--------|-------|
| Card label | 14px | Inter | 400 | `text-sm text-muted-foreground` |
| Big number | 24px | Inter | 700 | `text-2xl font-bold tabular-nums` |
| Macro number | 24px | Outfit | 900 | `font-display font-extrabold tabular-nums` |
| Subtitle | 12px | Inter | 400 | `text-xs text-muted-foreground` |
| Day label (chart) | 12px | Inter | 400 | `text-xs text-muted-foreground` |
| Y-axis label | 10px | Inter | 400 | `text-[10px] text-muted-foreground` |
| Goal label | 11px | Inter | 400 | `text-[11px] text-muted-foreground` |
| Week label (nav) | 16px | Inter | 500 | `text-base font-medium` |
| Section heading | 14px | Inter | 400 | `text-sm text-muted-foreground` |

---

## Spacing Reference (4px grid)

| Token | Value | Usage |
|-------|-------|-------|
| `p-4` | 16px | Card padding, section horizontal padding |
| `p-3` | 12px | (not used here) |
| `p-6` | 24px | Section bottom padding |
| `gap-3` | 12px | Gap between summary cards |
| `gap-4` | 16px | Gap between macro columns |
| `mt-4` | 16px | Top margin between sections |

---

## Anti-Patterns (do NOT use in Penpot)

- No custom hex values — use the HSL values from the CSS Variable Reference table above
- No ring chart on Kalorien card — it uses the simple Label+Number pattern (not CalorieCard ring)
- No value labels on chart bars — bars are color-coded only, no numbers overlaid
- No swipe gesture affordances — navigation is buttons only
- No Heute button in current-week state — only shown when NOT on current week
- Do not show macro section when macro goals are null — design shows "has goals" state only

---

## Page Layout Summary

Full top-to-bottom layout at 375px:

```
┌─────────────────────────────────────────┐
│  Week Navigation Bar (52px, sticky)     │  bg-background, border-b
│  ◀  KW 11 · 10.–16. Mär  [Heute]  ▶   │
├─────────────────────────────────────────┤
│  Bar Chart (~240px)                     │  padding: 16px
│                                         │
│  [Y] ████          ████ ████            │
│  [Y] ████ ████ ████ ▬▬▬ ████ ████ ████ │
│  [Y]  Mo   Di   Mi   Do   Fr   Sa   So  │
│       - - - - - Ziel: 2.100 kcal - - -  │
├─────────────────────────────────────────┤
│  Summary Cards (padding: 16px)          │
│  ┌──────────────┐ ┌──────────────┐     │
│  │ Kalorien     │ │ Defizit      │     │
│  │ 12.400       │ │ 2.200 kcal   │     │
│  │ Ø 2.067/Tag  │ │ (green)      │     │
│  └──────────────┘ └──────────────┘     │
│  ┌────────────────────────────────┐    │
│  │ Sport                          │    │
│  │ 1.230   kcal · 4 Sessions      │    │
│  └────────────────────────────────┘    │
├─────────────────────────────────────────┤
│  Macro Averages (padding: 16px)         │
│  Ø Makros                               │
│  [  87%   ] [  102%  ] [  94%   ]      │
│  [ Protein] [  KH   ] [  Fett  ]      │
└─────────────────────────────────────────┘
```

Total page height estimate: 52px (nav) + 256px (chart+margin) + 220px (cards) + 120px (macros) ≈ **648px–900px** depending on content density.
