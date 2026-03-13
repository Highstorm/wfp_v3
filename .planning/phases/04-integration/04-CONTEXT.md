# Phase 4: Integration - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Statistik-Seite als lazy-loaded Route verdrahten, in Sidebar und MobileTabBar einbinden, Dashboard-Route und Placeholder entfernen. Kein neuer UI-Code — alle Komponenten kommen aus Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Nav-Reihenfolge & Label
- Statistik als 2. Eintrag, direkt nach Tagesplanung: Plan → Stats → Gerichte → Profil
- MobileTabBar Label: "Stats" (kurz, passt zum Stil der anderen Labels)
- Sidebar Label: "Statistik" (vollständig)
- Porridge wird aus der MobileTabBar entfernt — bleibt nur in der Sidebar (Desktop)
- Active State: pathname-Match auf `/statistics` — Query-Parameter (`?week=`) irrelevant

### Dashboard-Handling
- `/dashboard` Route komplett entfernen aus App.tsx
- `Dashboard.tsx` Datei löschen (nur "Coming soon" Placeholder)
- Kein Redirect nötig — Dashboard war nie in der Nav verlinkt
- Lazy import für Dashboard entfernen

### Route & Code-Splitting
- Neue Route: `/statistics` mit lazy-loaded `StatisticsPage`
- Standard `lazy()` Import — Vite splittet Recharts automatisch in den Statistics-Chunk
- ErrorBoundary + Suspense Wrapper (konsistent mit DayPlanningPage)
- Index Route (/) bleibt bei DayPlanningPage — Tagesplanung ist die Haupt-Aktion

### Deep-Link & Navigation
- `/statistics` ohne `?week=` Parameter zeigt aktuelle Woche (useWeekParam Default — bereits implementiert)
- Zurück-Navigation von Tagesplanung (nach Chart-Tap) über Browser-History — kein Custom-Back-Button

### Claude's Discretion
- Nav-Icon Wahl (Lucide Icon für Statistik-Eintrag)
- Exakte isActive-Logik in Sidebar (pathname match pattern)
- Reihenfolge der Änderungen beim Implementieren

</decisions>

<specifics>
## Specific Ideas

- MobileTabBar: 4 Tabs Maximum — Porridge als Feature-Flag-Item nur in Sidebar
- Stats-Tab optisch konsistent mit bestehendem Tab-Style (gleiche Höhe, gleiche Schriftgröße)
- Lazy-Import Pattern exakt wie bestehende: `.then((m) => ({ default: m.StatisticsPage }))` — aber StatisticsPage hat bereits default export, also direkt `import()`

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `StatisticsPage` (default export): Fertige Page-Komponente aus Phase 3, bereit für lazy loading
- `LoadingSpinner`: Bestehender Suspense-Fallback in `src/components/shared/`
- `ErrorBoundary`: Bestehender Error-Wrapper in `src/components/shared/`
- `useFeatureAccess`: Hook für Feature-Flag Prüfung (Porridge)
- Lucide Icons: Bereits importiert in Sidebar/MobileTabBar

### Established Patterns
- Lazy loading: `const X = lazy(() => import("./path"))` mit `.then()` für named exports
- Route wrapping: `<ErrorBoundary><Suspense fallback={<LoadingSpinner />}><Component /></Suspense></ErrorBoundary>`
- Nav-Arrays: Datengetrieben in Sidebar (`menuItems`) und MobileTabBar (`tabs`)
- Active detection: `location.pathname === item.to || location.pathname.startsWith(item.to)`

### Integration Points
- `App.tsx`: Neue lazy-loaded Route + Dashboard-Route entfernen
- `Sidebar.tsx`: Neuer menuItem für Statistik an Position 2
- `MobileTabBar.tsx`: Neuer Tab für Stats an Position 2, Porridge-Tab entfernen
- `Dashboard.tsx`: Datei löschen
- Vite build output: Verifizieren dass Recharts nur im Statistics-Chunk landet

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-integration*
*Context gathered: 2026-03-13*
