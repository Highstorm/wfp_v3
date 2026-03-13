---
phase: 3
slug: statistics-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | vite.config.ts |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | MAC-01 | unit | `npx vitest run src/utils/__tests__/stats.utils.test.ts` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 0 | NAV-01 | unit | `npx vitest run src/utils/__tests__/stats.utils.test.ts` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 0 | SUM-02 | unit | `npx vitest run src/utils/__tests__/stats.utils.test.ts` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | VIS-01 | manual | — visual inspection | ❌ manual-only | ⬜ pending |
| 3-02-02 | 02 | 1 | VIS-02 | unit | `npx vitest run src/utils/__tests__/stats.utils.test.ts` | ❌ W0 | ⬜ pending |
| 3-02-03 | 02 | 1 | VIS-03 | manual | — visual inspection at 375px | ❌ manual-only | ⬜ pending |
| 3-03-01 | 03 | 1 | SUM-01 | unit | `npx vitest run src/utils/__tests__/stats.utils.test.ts` | ❌ W0 | ⬜ pending |
| 3-03-02 | 03 | 1 | SUM-03 | unit | `npx vitest run src/utils/__tests__/stats.utils.test.ts` | ❌ W0 | ⬜ pending |
| 3-04-01 | 04 | 1 | NAV-01 | unit | `npx vitest run src/utils/__tests__/stats.utils.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/utils/__tests__/stats.utils.test.ts` — stubs for MAC-01 (calcMacroPercent), NAV-01 (formatWeekLabel), SUM-02 (null display logic)
- [ ] Install recharts: `npm install recharts@^2.15`

*Existing Vitest infrastructure covers framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bar chart renders 7 bars + ReferenceLine | VIS-01 | Visual SVG rendering | Open /statistics, verify 7 bars visible with horizontal goal line |
| Chart does not overflow at 375px | VIS-03 | Viewport-dependent layout | Open DevTools, set viewport to 375px, verify no horizontal scroll |
| UI matches Penpot design | SC-6 | Visual design fidelity | Compare screenshot with wfp_v3.pen Statistics screen |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
