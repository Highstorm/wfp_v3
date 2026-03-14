---
phase: 1
slug: data-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.0.18 |
| **Config file** | `vitest.config.ts` (root) — `environment: "node"`, `globals: true` |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm run test:unit` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit`
- **After every plan wave:** Run `npm run test:unit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | DATA-01, DATA-02, DATA-03, DATA-04 | unit | `npm run test:unit -- weekly-stats` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | DATA-01 | unit | `npm run test:unit -- weekly-stats` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | DATA-02, DATA-04 | unit | `npm run test:unit -- weekly-stats` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | DATA-03 | unit | `npm run test:unit -- weekly-stats` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | DATA-01, DATA-02, DATA-03, DATA-04 | unit | `npm run test:unit -- weekly-stats` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/utils/__tests__/weekly-stats.utils.test.ts` — stubs for DATA-02, DATA-03, DATA-04 (pure function tests)
- [ ] `src/types/weekly-stats.types.ts` — `DayStats`, `WeeklyStats`, `ResolvedGoals` interfaces

*Vitest config and test infrastructure already exist — no framework setup needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `getMealPlansByWeek` returns correct docs from Firestore | DATA-01 | Firestore cannot be unit-tested without mocking; integration check preferred | Inspect hook output in React Query DevTools with known test data |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
