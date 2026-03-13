---
phase: 02-design
plan: "01"
subsystem: ui
tags: [design-spec, statistics-page, penpot, mobile-375px]

# Dependency graph
requires:
  - phase: 01-data-foundation
    provides: WeeklyStats type, DayStats type, ResolvedGoals type, aggregation logic
provides:
  - "Pixel-precise design specification for the weekly statistics page (02-DESIGN-SPEC.md)"
  - "CSS variable reference table with exact HSL values for Penpot"
  - "Data mapping table linking visual elements to WeeklyStats fields"
affects:
  - "03-ui-implementation — primary reference for all component development"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Statistics page layout: sticky nav → bar chart → 2+1 summary cards → 3-col macro grid"
    - "Bar chart color coding: green=on-target, red=over-target, gray-stub=unlogged"
    - "DeficitCard pattern for all 3 summary cards (Label + big number + optional subtitle)"
    - "Macro percentages use font-display (Outfit) font for large numbers"

key-files:
  created:
    - ".planning/phases/02-design/02-DESIGN-SPEC.md"
  modified: []

key-decisions:
  - "Bar chart bars: no value labels on bars, color-coded only (locked from CONTEXT.md)"
  - "Gray stub bars at fixed 24px height for unlogged days (distinguishable from 0-kcal logged days)"
  - "Heute button: ghost text button between center label and right arrow, hidden on current week"
  - "Macro section heading: Ø Makros in 14px muted above 3-column grid"
  - "Week navigation: sticky 52px bar, border-b, Ghost buttons for arrows"

patterns-established:
  - "Statistics card: .card p-4 with Label (14px muted) + Big number (24px bold tabular-nums) + Subtitle (12px muted)"
  - "Macro value: font-display font-extrabold 24px tabular-nums in macro color"

requirements-completed:
  - VIS-01
  - VIS-02
  - VIS-03
  - SUM-01
  - SUM-02
  - SUM-03
  - MAC-01
  - NAV-01

# Metrics
duration: 4min
completed: 2026-03-13
---

# Phase 2 Plan 01: Design Specification Summary

**Pixel-precise statistics page design spec at 375px covering week nav, color-coded bar chart, 3 summary cards (2+1 grid), and macro % grid — all referencing existing CSS variable tokens**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-13T07:56:04Z
- **Completed:** 2026-03-13T07:58:00Z
- **Tasks:** 1 of 2 complete (Task 2 requires human action in Penpot)
- **Files modified:** 1

## Accomplishments

- Created comprehensive 02-DESIGN-SPEC.md with all 4 page sections fully specified
- Bar chart spec with sample data, color rules, Y-axis, and dashed goal reference line
- Summary cards spec (Kalorien, Defizit, Sport) with exact typography and color rules
- Complete CSS variable reference table (12 tokens with HSL values) for Penpot use
- Data mapping table linking each visual element to `WeeklyStats` field names

## Task Commits

1. **Task 1: Create pixel-precise design specification** - `258b3e4` (feat)
2. **Task 2: Build Penpot design screen** — awaiting human action (blocking checkpoint)

## Files Created/Modified

- `.planning/phases/02-design/02-DESIGN-SPEC.md` — Complete pixel-precise design specification for statistics page; includes all 4 sections, CSS token reference, typography guide, spacing guide, data mapping table, and anti-patterns

## Decisions Made

- All design decisions were already locked in 02-CONTEXT.md; this plan translated them into a buildable specification
- "Heute" button placement resolved: ghost text button between week label and right arrow (avoids layout shift)
- Macro section heading: "Ø Makros" in 14px muted text (adds hierarchy without noise)
- Gray stub bars: fixed 24px height for unlogged days (per Research Pitfall 3 guidance)

## Deviations from Plan

None — plan executed exactly as written for Task 1.

## Issues Encountered

None.

## User Setup Required

**Task 2 requires manual action:**

Sebastian must build the Penpot screen from the specification:
1. Open `/Users/sebastianpieper/Development/wfp_v3.pen` in Penpot
2. Create new frame "Statistics Page" at 375px width
3. Build all 4 sections following `02-DESIGN-SPEC.md`
4. Verify against the checklist in the plan's `<how-to-verify>` section
5. Signal completion by typing "design complete"

## Next Phase Readiness

- 02-DESIGN-SPEC.md provides complete, unambiguous specification for Phase 3
- All 8 requirements (VIS-01 through NAV-01) are specified in the document
- Phase 3 can proceed once Penpot screen is built and human-verified
- No blockers beyond the required Penpot design work

---
*Phase: 02-design*
*Completed: 2026-03-13*
