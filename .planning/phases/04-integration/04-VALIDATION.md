---
phase: 4
slug: integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm run test:unit` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit`
- **After every plan wave:** Run `npm run test:unit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | NAV-02 | build-check | `npm run build` | ✅ | ⬜ pending |
| 04-01-02 | 01 | 1 | NAV-02 | manual | Browser smoke test | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm run build` + Chunk-Analyse — verifiziert dass Recharts nur im Statistics-Chunk landet
- [ ] Bestehende Unit-Tests grün als Regressionsnetz

*Existing infrastructure covers all phase requirements — keine neuen Test-Dateien nötig.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| /statistics Route rendert StatisticsPage | NAV-02 | Route-Rendering braucht Browser-Env, kein React Testing Library im Projekt | 1. `npm run dev` 2. Navigate to /statistics 3. Verify StatisticsPage renders |
| /dashboard Route existiert nicht mehr | NAV-02 | Kein automatisierbarer Route-Test | 1. Navigate to /dashboard 2. Verify 404 or no content |
| Nav-Einträge korrekt in Sidebar + MobileTabBar | NAV-02 | Visueller Check, kein DOM-Test-Setup | 1. Check Sidebar: Statistik at position 2 2. Check MobileTabBar: Stats at position 2, no Porridge |
| Navigation hin und zurück ohne Fehler | NAV-02 | Browser state management | 1. /statistics → /day-planning → /statistics 2. No errors in console |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
