---
phase: 2
slug: design
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-13
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | N/A — design artifact phase (Penpot visual review) |
| **Config file** | none — no automated tests for design phase |
| **Quick run command** | N/A |
| **Full suite command** | N/A |
| **Estimated runtime** | ~0 seconds (manual review only) |

---

## Sampling Rate

- **After every task commit:** Visual inspection of Penpot screen
- **After every plan wave:** Review against ROADMAP success criteria checklist
- **Before `/gsd:verify-work`:** All 4 success criteria from ROADMAP.md verified visually
- **Max feedback latency:** N/A (manual)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | VIS-01 | manual-only | N/A — visual design artifact | N/A | ⬜ pending |
| 02-01-02 | 01 | 1 | VIS-02 | manual-only | N/A — visual design artifact | N/A | ⬜ pending |
| 02-01-03 | 01 | 1 | VIS-03 | manual-only | N/A — visual design artifact | N/A | ⬜ pending |
| 02-01-04 | 01 | 1 | SUM-01 | manual-only | N/A — visual design artifact | N/A | ⬜ pending |
| 02-01-05 | 01 | 1 | SUM-02 | manual-only | N/A — visual design artifact | N/A | ⬜ pending |
| 02-01-06 | 01 | 1 | SUM-03 | manual-only | N/A — visual design artifact | N/A | ⬜ pending |
| 02-01-07 | 01 | 1 | MAC-01 | manual-only | N/A — visual design artifact | N/A | ⬜ pending |
| 02-01-08 | 01 | 1 | NAV-01 | manual-only | N/A — visual design artifact | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test files required — this is a design-only phase.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bar chart shows daily calories with goal line | VIS-01 | Visual design artifact in Penpot | Verify 7 bars + horizontal goal line visible in screen |
| Unlogged days grayed in chart | VIS-02 | Visual design artifact | Verify placeholder bars use muted/gray color |
| Chart mobile-optimized (375px) | VIS-03 | Visual design artifact | Verify frame width is 375px |
| Kalorien card shows total weekly calories | SUM-01 | Visual design artifact | Verify card with label + big number visible |
| Defizit card shows cumulative deficit/surplus | SUM-02 | Visual design artifact | Verify deficit card with color coding |
| Sport card shows kcal + session count | SUM-03 | Visual design artifact | Verify sport card with two values |
| Macro % section with 3-column grid | MAC-01 | Visual design artifact | Verify 3-column layout for P/C/F |
| Week navigation with prev/next | NAV-01 | Visual design artifact | Verify arrows + week label + Heute button |

---

## Validation Sign-Off

- [x] All tasks have manual verify instructions
- [x] Sampling continuity: manual review per task
- [x] Wave 0 covers all MISSING references (N/A — no automated tests needed)
- [x] No watch-mode flags
- [x] Feedback latency: immediate (visual)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
