# Phase 2: Design - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Ein visuelles Design der Statistik-Seite in wfp_v3.pen, das als Referenz für die UI-Implementierung in Phase 3 dient. Mobile-first (375px). Nutzt den bestehenden Styleguide aus wfp_v3.pen.

</domain>

<decisions>
## Implementation Decisions

### Page Layout & Hierarchy
- Chart first (~240px Höhe), dann Summary Cards, dann Makro-Sektion
- Gesamtstruktur von oben nach unten: Week Nav (sticky) → Bar Chart → Summary Cards (2+1 Grid) → Makro-Durchschnitte
- Mobile-first: 375px Breite als Basis

### Summary Card Design
- Einfacher Stil: Label oben, große Zahl darunter, optionaler Subtitle (wie bestehendes DeficitCard-Pattern)
- Kalorien-Karte: Gesamtkalorien + Ø pro Tag als Subtitle (nur geloggte Tage)
- Defizit-Karte: Farbkodiert — grün bei Defizit (Ziel eingehalten), rot bei Überschuss
- Sport-Karte: kcal gesamt + Anzahl Sessions (z.B. "1,230 kcal · 4 Sessions")
- Card-Grid: Kalorien und Defizit nebeneinander (2 Spalten), Sport darunter volle Breite

### Bar Chart Appearance
- Balkenfarbe nach Zielstatus: grün wenn unter/am Ziel, rot wenn drüber
- Ziel-Referenzlinie: gestrichelt mit Label "Ziel: X kcal" rechts
- Nicht geloggte Tage: kleiner grauer Placeholder-Balken (nicht leer, nicht verwechselbar mit 0)
- Keine Werte-Labels auf den Balken — Chart bleibt clean
- Y-Achse mit Skalierung als Referenz

### Week Navigation
- Sticky am oberen Rand, bleibt beim Scrollen sichtbar
- Format: "KW 11 · 10.–16. Mär" (Kalenderwoche + Datumsbereich mit abgekürztem Monat)
- Prev/Next Pfeile (◀ ▶) links und rechts
- "Heute"-Button erscheint nur wenn nicht aktuelle Woche angezeigt wird
- Kein Swipe-Gesture — nur Buttons

### Macro-Durchschnitte
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

</decisions>

<specifics>
## Specific Ideas

- Chart-Balken farbkodiert wie CalorieCard: grün = on target, rot = over target
- DeficitCard-Logik übertragen: positive Zahl = Defizit (grün), negative = Überschuss (rot)
- NutritionSummary 3-Spalten Pattern wiederverwenden für Makro-Sektion
- "Heute"-Button ähnlich gängigen Kalender-Apps

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.card p-4` CSS-Klasse: Standard Card-Pattern in der App
- `CalorieCard.tsx`: Ring-basierte Kalorienanzeige mit isOver/isOnTarget Logik
- `DeficitCard.tsx`: Einfaches Label+Wert Card Pattern
- `NutritionSummary.tsx`: 3-Spalten Makro-Grid mit Protein/KH/Fett
- CSS Variablen: `--color-calories`, `--color-protein`, `--color-carbs`, `--color-fat`, `--destructive`, `--success`

### Established Patterns
- Card-Layout: `.card p-4` mit flexbox
- Farbsystem: `hsl(var(--destructive))` für rot, `hsl(var(--success))` für grün
- Tabular Nums: `tabular-nums` Klasse für Zahlen
- Dark Mode: `dark:` Prefix für alle Farben
- font-display: `font-display font-black` für große Zahlen (aus NutritionSummary)

### Integration Points
- Design-Datei: `wfp_v3.pen` (außerhalb des Repos: `/Users/sebastianpieper/Development/wfp_v3.pen`)
- Bestehender Styleguide in wfp_v3.pen muss als Referenz genutzt werden
- Phase 1 Types: `WeeklyStats`, `DaySummary` mit allen Datenfeldern

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-design*
*Context gathered: 2026-03-13*
