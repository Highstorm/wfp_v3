# Design System: Weekly Food Planner

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file for that page.
> If not, strictly follow the rules below.

---

**Project:** Weekly Food Planner
**Type:** Health/Nutrition Dashboard SPA
**Stack:** React 18 + TypeScript + Tailwind CSS + Headless UI
**Style:** Soft UI Evolution (health/wellness variant)
**Generated:** 2026-02-14 (refined from ui-ux-pro-max output)

---

## Color Palette

All colors use HSL CSS variables (without `hsl()` wrapper) for Tailwind integration.

### Light Mode

| Role | HSL Value | Hex | Usage |
|------|-----------|-----|-------|
| `--background` | `60 9% 98%` | `#FAFAF9` | Page background (warm off-white) |
| `--foreground` | `222 47% 11%` | `#0F172A` | Primary text |
| `--card` | `0 0% 100%` | `#FFFFFF` | Card surfaces |
| `--card-foreground` | `222 47% 11%` | `#0F172A` | Card text |
| `--popover` | `0 0% 100%` | `#FFFFFF` | Popover/dropdown bg |
| `--popover-foreground` | `222 47% 11%` | `#0F172A` | Popover text |
| `--primary` | `160 84% 39%` | `#059669` | Primary actions, active states |
| `--primary-foreground` | `0 0% 100%` | `#FFFFFF` | Text on primary |
| `--secondary` | `210 40% 96%` | `#F1F5F9` | Subtle surface, secondary bg |
| `--secondary-foreground` | `215 25% 27%` | `#334155` | Text on secondary |
| `--muted` | `210 40% 96%` | `#F1F5F9` | Muted background |
| `--muted-foreground` | `215 16% 47%` | `#64748B` | Placeholder, disabled text |
| `--accent` | `210 40% 96%` | `#F1F5F9` | Hover background |
| `--accent-foreground` | `215 25% 27%` | `#334155` | Hover text |
| `--destructive` | `0 72% 51%` | `#DC2626` | Delete, error actions |
| `--destructive-foreground` | `0 0% 100%` | `#FFFFFF` | Text on destructive |
| `--success` | `142 72% 37%` | `#16A34A` | Success states |
| `--success-foreground` | `0 0% 100%` | `#FFFFFF` | Text on success |
| `--warning` | `38 92% 50%` | `#F59E0B` | Warning states |
| `--warning-foreground` | `0 0% 100%` | `#FFFFFF` | Text on warning |
| `--border` | `214 32% 91%` | `#E2E8F0` | Borders, dividers |
| `--input` | `214 32% 91%` | `#E2E8F0` | Input borders |
| `--ring` | `160 84% 39%` | `#059669` | Focus rings |

### Dark Mode

| Role | HSL Value | Hex |
|------|-----------|-----|
| `--background` | `222 47% 9%` | `#0C1222` |
| `--foreground` | `210 40% 98%` | `#F8FAFC` |
| `--card` | `222 41% 15%` | `#162032` |
| `--card-foreground` | `210 40% 98%` | `#F8FAFC` |
| `--popover` | `222 41% 15%` | `#162032` |
| `--popover-foreground` | `210 40% 98%` | `#F8FAFC` |
| `--primary` | `160 60% 52%` | `#34D399` |
| `--primary-foreground` | `164 86% 16%` | `#064E3B` |
| `--secondary` | `217 33% 17%` | `#1E293B` |
| `--secondary-foreground` | `210 40% 98%` | `#F8FAFC` |
| `--muted` | `217 33% 17%` | `#1E293B` |
| `--muted-foreground` | `215 20% 65%` | `#94A3B8` |
| `--accent` | `217 33% 17%` | `#1E293B` |
| `--accent-foreground` | `210 40% 98%` | `#F8FAFC` |
| `--destructive` | `0 63% 31%` | `#7F1D1D` |
| `--destructive-foreground` | `210 40% 98%` | `#F8FAFC` |
| `--success` | `142 70% 45%` | `#22C55E` |
| `--success-foreground` | `210 40% 98%` | `#F8FAFC` |
| `--warning` | `38 92% 50%` | `#F59E0B` |
| `--warning-foreground` | `222 47% 11%` | `#0F172A` |
| `--border` | `217 33% 17%` | `#1E293B` |
| `--input` | `217 33% 17%` | `#1E293B` |
| `--ring` | `160 60% 52%` | `#34D399` |

### Semantic: Nutrition Colors

| Token | Light Hex | Dark Hex | Usage |
|-------|-----------|----------|-------|
| `--color-calories` | `#F59E0B` | `#FBBF24` | Calorie indicators |
| `--color-protein` | `#3B82F6` | `#60A5FA` | Protein bars/labels |
| `--color-carbs` | `#059669` | `#34D399` | Carbohydrate indicators |
| `--color-fat` | `#EF4444` | `#F87171` | Fat indicators |

---

## Typography

### Font Stack

- **Heading:** Plus Jakarta Sans (500, 600, 700, 800)
- **Body/UI:** Inter (300, 400, 500, 600, 700)

### Google Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet" />
```

### Type Scale

| Token | Size | Weight | Font | Usage |
|-------|------|--------|------|-------|
| `heading-1` | `1.875rem` (30px) | 700 | Plus Jakarta Sans | Page titles |
| `heading-2` | `1.5rem` (24px) | 600 | Plus Jakarta Sans | Section titles |
| `heading-3` | `1.25rem` (20px) | 600 | Plus Jakarta Sans | Card titles |
| `heading-4` | `1.125rem` (18px) | 600 | Plus Jakarta Sans | Subsections |
| `body` | `0.875rem` (14px) | 400 | Inter | Default body text |
| `body-lg` | `1rem` (16px) | 400 | Inter | Large body text |
| `caption` | `0.75rem` (12px) | 500 | Inter | Labels, hints |
| `label` | `0.875rem` (14px) | 500 | Inter | Form labels, table headers |
| `number` | `0.875rem` (14px) | 600 | Inter | Nutrition values (tabular-nums) |
| `number-lg` | `1.5rem` (24px) | 700 | Inter | Hero numbers (calories) |

### Numeric Display

All nutritional values use `font-variant-numeric: tabular-nums` for aligned columns.

---

## Spacing

Follows Tailwind's default scale. Key usage guidelines:

| Context | Spacing |
|---------|---------|
| Inside cards | `p-4` (16px) mobile, `p-6` (24px) desktop |
| Between cards | `gap-3` (12px) mobile, `gap-4` (16px) desktop |
| Section margins | `space-y-6` (24px) |
| Form field gaps | `space-y-4` (16px) |
| Icon-to-text | `gap-2` (8px) |
| Button content | `gap-2` (8px) |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `0.375rem` (6px) | Badges, small elements |
| `--radius-md` | `0.5rem` (8px) | Inputs, buttons |
| `--radius-lg` | `0.75rem` (12px) | Cards, dialogs |
| `--radius-xl` | `1rem` (16px) | Large containers |
| `--radius-full` | `9999px` | Avatars, pills |

---

## Shadows

| Token | Light | Dark |
|-------|-------|------|
| `shadow-soft` | `0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)` | `0 1px 2px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.3)` |
| `shadow-glass` | `0 1px 2px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)` | `0 1px 2px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.4)` |
| `shadow-elevated` | `0 4px 6px rgba(0,0,0,0.05), 0 12px 32px rgba(0,0,0,0.1)` | `0 4px 6px rgba(0,0,0,0.3), 0 12px 32px rgba(0,0,0,0.5)` |

---

## Transitions

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `transition-fast` | `150ms` | `ease-out` | Hover, focus, active |
| `transition-normal` | `250ms` | `ease-in-out` | Panels, menus, dropdowns |
| `transition-slow` | `400ms` | `ease-in-out` | Page transitions, modals |

All transitions behind `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Icon System

- **Library:** Lucide React (already installed)
- **Default size:** `h-5 w-5` (20px) for UI, `h-6 w-6` (24px) for navigation
- **Stroke width:** 1.5 (Lucide default)
- **No emojis as icons** - SVGs only

---

## Anti-Patterns (FORBIDDEN)

- Emojis as functional icons
- Missing `cursor-pointer` on clickable elements
- Layout-shifting hover transforms (use `shadow` changes instead of `scale`)
- Low contrast text (< 4.5:1 ratio)
- Instant state changes without transitions
- Invisible focus states
- `outline-none` without ring replacement
- Inline styles (use Tailwind classes only)
- Color-only status indication (always pair with icon or text)
- Nested scrollable containers on mobile

---

## Pre-Delivery Checklist

- [ ] No emojis used as icons (SVG: Lucide)
- [ ] All icons from Lucide icon set (consistent)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Dark mode: text contrast 4.5:1 minimum
- [ ] Focus states visible (`ring-2 ring-ring ring-offset-2`)
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content behind fixed navbars
- [ ] No horizontal scroll on mobile
- [ ] Tabular numbers for all nutritional values
- [ ] Loading states for async operations
- [ ] Error states for form fields
- [ ] `aria-label` on icon-only buttons
- [ ] Keyboard navigation functional
