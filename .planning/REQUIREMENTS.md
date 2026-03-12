# Requirements: WFP Weekly Statistics

**Defined:** 2026-03-12
**Core Value:** Ich weiß jederzeit, was ich gegessen habe und ob ich meine Nährwertziele einhalte.

## v1 Requirements

Requirements for the weekly statistics page. Each maps to roadmap phases.

### Data Layer

- [ ] **DATA-01**: App kann MealPlans für eine ganze Woche (Mo–So) per Range-Query aus Firestore laden
- [x] **DATA-02**: Wochendaten werden zu Tagessummen aggregiert (Kalorien gegessen, Sportkalorien, Defizit/Überschuss)
- [x] **DATA-03**: Kalorienziel wird korrekt aufgelöst (WeeklyNutritionGoals → Fallback UserProfile)
- [x] **DATA-04**: Nicht geloggte Tage werden als "keine Daten" markiert und aus Durchschnittswerten ausgeschlossen

### Visualization

- [ ] **VIS-01**: Balkendiagramm zeigt Kalorien pro Tag (Mo–So) mit Tagesziel als Referenzlinie
- [ ] **VIS-02**: Nicht geloggte Tage sind im Chart ausgegraut dargestellt
- [ ] **VIS-03**: Chart ist responsive und mobile-optimiert

### Summary Cards

- [ ] **SUM-01**: Karte zeigt Gesamtkalorien der Woche
- [ ] **SUM-02**: Karte zeigt kumuliertes Defizit/Überschuss (Formel: Σ(Ziel + Sport − Gegessen))
- [ ] **SUM-03**: Karte zeigt Sportkalorien gesamt (Anzahl Sessions + kcal)

### Macros

- [ ] **MAC-01**: Durchschnittliche Makro-Zielerreichung in % (Protein, KH, Fett) — nur geloggte Tage

### Navigation

- [ ] **NAV-01**: Wochennavigation zum Blättern zwischen Kalenderwochen
- [ ] **NAV-02**: Statistik-Seite ersetzt /dashboard Route und bestehenden Nav-Eintrag (Sidebar + MobileTabBar)

## v2 Requirements

### Visualization Enhancements

- **VIS-04**: Farbkodierte Balken (grün = unter Ziel, rot = über Ziel)
- **VIS-05**: Gestapelte Balken für Netto-Kalorien (Gegessen vs. Sport-Offset)

### Additional Stats

- **STAT-01**: Anzahl geloggte Tage der Woche anzeigen
- **STAT-02**: Bester/schlechtester Tag der Woche hervorheben

## Out of Scope

| Feature | Reason |
|---------|--------|
| Monatsansicht | Wochenansicht reicht — Komplexität überwiegt Nutzen |
| Jahresansicht | Zu viele Daten, zu wenig Nutzen für persönliches Tracking |
| Wochen-Vergleich | Einfache Wochenansicht zuerst, Vergleich ist v2+ |
| Datenexport | Nicht benötigt |
| Gewichtstracking | Separate Funktion, nicht Teil der Kalorien-Statistik |
| StomachPain-Overlay | Existiert im Datenmodell, kein aktueller Use-Case |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Complete (01-01) |
| DATA-03 | Phase 1 | Complete (01-01) |
| DATA-04 | Phase 1 | Complete (01-01) |
| VIS-01 | Phase 2 | Pending |
| VIS-02 | Phase 2 | Pending |
| VIS-03 | Phase 2 | Pending |
| SUM-01 | Phase 2 | Pending |
| SUM-02 | Phase 2 | Pending |
| SUM-03 | Phase 2 | Pending |
| MAC-01 | Phase 2 | Pending |
| NAV-01 | Phase 2 | Pending |
| NAV-02 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-12*
*Last updated: 2026-03-12 after plan 01-01 completion (DATA-02, DATA-03, DATA-04 complete)*
