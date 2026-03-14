# Phase 3: Statistics UI - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Alle Statistik-Komponenten als React-UI umsetzen: Bar Chart, Summary Cards, Makro-Durchschnitte und Wochennavigation. Konsumiert Daten aus dem Phase-1-Hook (`useWeeklyStats`), folgt dem Phase-2-Design aus `wfp_v3.pen`. Kein Routing, kein Nav-Wiring — das ist Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Chart-Interaktion
- Tap/Hover auf Balken zeigt Tooltip mit: gegessene Kalorien, Sportkalorien, Defizit
- Tap auf einen Balken navigiert zur Tagesplanung (`/day-planning?date=YYYY-MM-DD`)
- Auch graue Balken (nicht geloggte Tage) navigieren zur Tagesplanung — User kann dort anfangen zu loggen
- Tooltip zeigt alle drei Werte: Kalorien + Sport + Defizit

### Wochenwechsel-Verhalten
- Harter Schnitt beim Wochenwechsel — keine Slide- oder Fade-Animation
- Einfacher Spinner (bestehendes `LoadingSpinner` Pattern) während neue Wochendaten laden
- Nur Button-Navigation (Prev/Next/Heute) — kein Swipe-Gesture
- Angezeigte Woche als Query-Parameter in der URL: `/statistics?week=2026-03-09`
- Bei Reload wird Woche aus URL gelesen, ohne Parameter startet aktuelle Woche

### Zahlenformate
- Kalorien: Ganzzahl ohne Tausender-Trennung (`.toFixed(0)`) — konsistent mit bestehendem NutritionSummary
- Makro-Durchschnitte: Ganzzahl-Prozent ohne Dezimalstelle (z.B. "85%")
- Defizit in Summary Card: Ganzzahl kcal

### Leer-Zustand (keine Daten für die Woche)
- Chart zeigt 7 graue Stub-Balken (wie Design) + Hinweis-Text: "Keine Daten für diese Woche. Starte mit der Tagesplanung!"
- Summary Cards bleiben sichtbar mit "–" als Wert — konsistentes Layout
- Makro-Sektion: wird nicht angezeigt wenn keine geloggten Tage

### Recharts-Konfiguration
- Subtile Einblend-Animation: Balken fahren beim Laden von unten hoch (Recharts built-in)
- Chart mit Padding links/rechts innerhalb der Card — wie andere Sektionen
- Balken mit abgerundeten oberen Ecken (radius ~4px)
- Y-Achse: dezente Zahlen links als Orientierungshilfe (500, 1000, 1500, ...)
- X-Achse: Wochentage Mo–So als Labels

### Claude's Discretion
- Exakte Tooltip-Positionierung und Styling
- Recharts ResponsiveContainer Konfiguration
- Chart-Höhe und Balkenbreite (orientiert am Phase 2 Design: ~240px Chart-Höhe)
- Loading Spinner Platzierung
- Komponenten-Aufteilung (einzelne Dateien vs. zusammengefasst)
- Error-State Handling

</decisions>

<specifics>
## Specific Ideas

- Chart-Balken farbkodiert wie im Design: grün = unter/am Ziel, rot = über Ziel, grau = nicht geloggt
- DeficitCard-Farblogik übertragen: positiv = Defizit (grün), negativ = Überschuss (rot)
- NutritionSummary 3-Spalten Pattern wiederverwenden für Makro-Sektion
- Week Nav Format: "KW 11 · 10.–16. Mär" (aus Phase 2 Design)
- Tap auf Chart-Balken → Navigation zur Tagesplanung (schneller Kontextwechsel)
- URL-State für Woche ermöglicht Bookmarking einer bestimmten Woche

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useWeeklyStats(weekStartDate)`: Hook liefert `WeeklyStats` mit allen Daten — direkt konsumierbar
- `WeeklyStats`, `DayStats`, `ResolvedGoals` Types: Vollständig typisiert aus Phase 1
- `DeficitCard.tsx`: Label+Wert Card Pattern — Basis für Summary Cards
- `NutritionSummary.tsx`: 3-Spalten Grid für Makros (`grid-cols-3 gap-4`) — Pattern wiederverwenden
- `LoadingSpinner`: Bestehendes Loading-Pattern in `src/components/shared/`
- `cn()` Utility: Tailwind Klassen-Merging aus `src/lib/utils`
- Lucide Icons: `ChevronLeft`, `ChevronRight` etc. für Navigation

### Established Patterns
- Card-Layout: `.card p-4` mit Flexbox
- Farbsystem: `hsl(var(--destructive))` für rot, `hsl(var(--success))` für grün
- Zahlen-Display: `tabular-nums` Klasse, `font-display font-black` für große Zahlen
- Dark Mode: `dark:` Prefix für alle Farben
- React Query: `useQuery<T, Error>` mit typed queryKey Arrays
- Routing: `useNavigate()`, `useSearchParams()` aus react-router-dom

### Integration Points
- `useWeeklyStats(weekStartDate)` — einzige Datenquelle, weekStartDate als ISO-String (Montag)
- Navigation: `useNavigate()` für Tap-to-Day, `useSearchParams()` für week Query-Parameter
- CSS Variablen: `--color-calories`, `--color-protein`, `--color-carbs`, `--color-fat`, `--success`, `--destructive`
- Phase 4 wird die Komponenten in eine Page assemblen und Route + Nav verdrahten

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-statistics-ui*
*Context gathered: 2026-03-13*
