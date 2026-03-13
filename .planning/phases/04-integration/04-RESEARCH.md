# Phase 4: Integration - Research

**Researched:** 2026-03-13
**Domain:** React Router v6 lazy routes, Lucide icons, Vite code-splitting, nav-component integration
**Confidence:** HIGH

## Summary

Phase 4 ist eine reine Verdrahtungsphase — kein neuer UI-Code, keine neuen Bibliotheken. Alle Bausteine existieren: `StatisticsPage` (default export, fertig), `ErrorBoundary`, `LoadingSpinner`, die Nav-Komponenten `Sidebar` und `MobileTabBar`, und das etablierte lazy-import Pattern aus App.tsx.

Die drei Kernaufgaben sind: (1) lazy-loaded `/statistics` Route in App.tsx einführen und `/dashboard` entfernen, (2) `menuItems` in Sidebar um Statistik an Position 2 erweitern, (3) `tabs` in MobileTabBar um Stats an Position 2 erweitern und Porridge-Tab entfernen.

Code-Splitting ist bereits durch Vites automatisches Dynamic-Import-Chunking sichergestellt — Recharts landet im Statistics-Chunk, nicht im Main-Bundle. Es muss lediglich kein `manualChunks`-Eintrag für Recharts angelegt werden.

**Primäre Empfehlung:** Drei unabhängige Datei-Änderungen (App.tsx, Sidebar.tsx, MobileTabBar.tsx) + eine Datei löschen (Dashboard.tsx) — keine neuen Abhängigkeiten, kein Risiko.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Nav-Reihenfolge & Label**
- Statistik als 2. Eintrag, direkt nach Tagesplanung: Plan → Stats → Gerichte → Profil
- MobileTabBar Label: "Stats" (kurz, passt zum Stil der anderen Labels)
- Sidebar Label: "Statistik" (vollständig)
- Porridge wird aus der MobileTabBar entfernt — bleibt nur in der Sidebar (Desktop)
- Active State: pathname-Match auf `/statistics` — Query-Parameter (`?week=`) irrelevant

**Dashboard-Handling**
- `/dashboard` Route komplett entfernen aus App.tsx
- `Dashboard.tsx` Datei löschen (nur "Coming soon" Placeholder)
- Kein Redirect nötig — Dashboard war nie in der Nav verlinkt
- Lazy import für Dashboard entfernen

**Route & Code-Splitting**
- Neue Route: `/statistics` mit lazy-loaded `StatisticsPage`
- Standard `lazy()` Import — Vite splittet Recharts automatisch in den Statistics-Chunk
- ErrorBoundary + Suspense Wrapper (konsistent mit DayPlanningPage)
- Index Route (/) bleibt bei DayPlanningPage — Tagesplanung ist die Haupt-Aktion

**Deep-Link & Navigation**
- `/statistics` ohne `?week=` Parameter zeigt aktuelle Woche (useWeekParam Default — bereits implementiert)
- Zurück-Navigation von Tagesplanung (nach Chart-Tap) über Browser-History — kein Custom-Back-Button

### Claude's Discretion
- Nav-Icon Wahl (Lucide Icon für Statistik-Eintrag)
- Exakte isActive-Logik in Sidebar (pathname match pattern)
- Reihenfolge der Änderungen beim Implementieren

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NAV-02 | Statistik-Seite ersetzt /dashboard Route und bestehenden Nav-Eintrag (Sidebar + MobileTabBar) | Vollständig durch Code-Analyse abgedeckt: App.tsx zeigt exakten Umbauort, Sidebar/MobileTabBar zeigen menuItems/tabs-Pattern |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-router-dom | bereits installiert | `lazy()`, `<Routes>`, `<Route>`, `useLocation` | Bereits im Projekt, etabliertes Pattern |
| lucide-react | bereits installiert | Icons für Nav-Einträge | Bereits in Sidebar + MobileTabBar verwendet |
| vite | bereits installiert | Automatisches Code-Splitting via Dynamic Import | Bereits konfiguriert in vite.config.ts |

### Supporting
Keine neuen Abhängigkeiten erforderlich.

### Alternatives Considered
Keine — alle Entscheidungen sind bereits gesperrt.

**Installation:**
Keine neuen Pakete.

---

## Architecture Patterns

### Bestehendes Lazy-Import Pattern (App.tsx)

```typescript
// Named exports brauchen .then()-Wrapper:
const DishesPage = lazy(() =>
  import("./components/dishes/DishesPage").then((m) => ({ default: m.DishesPage }))
);

// Default exports können direkt genutzt werden:
const StatisticsPage = lazy(() =>
  import("./components/statistics/StatisticsPage")
);
// StatisticsPage hat `export default function StatisticsPage()` — kein .then() nötig
```

### Bestehendes Route-Wrapping Pattern (App.tsx)

Konsistenz: DayPlanningPage und kritische Lazy-Routes nutzen `ErrorBoundary + Suspense`.

```tsx
// So wird /statistics verdrahtet:
<Route
  path="/statistics"
  element={
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <StatisticsPage />
      </Suspense>
    </ErrorBoundary>
  }
/>
```

### Sidebar menuItems Pattern

```typescript
// Aktuell (Sidebar.tsx, Zeile 28-49):
const menuItems = [
  { to: "/day-planning", label: "Tagesplanung", icon: CalendarDays },
  { to: "/dishes", label: "Gerichte", icon: ChefHat },
  { to: "/porridge", label: "Porridge", icon: UtensilsCrossed, requiresFeature: "porridgeCalculator" },
  { to: "/profile", label: "Profil", icon: User },
];

// Ziel-Zustand:
const menuItems = [
  { to: "/day-planning", label: "Tagesplanung", icon: CalendarDays },
  { to: "/statistics",   label: "Statistik",    icon: BarChart2 },   // NEU an Position 2
  { to: "/dishes",       label: "Gerichte",     icon: ChefHat },
  { to: "/porridge",     label: "Porridge",     icon: UtensilsCrossed, requiresFeature: "porridgeCalculator" },
  { to: "/profile",      label: "Profil",       icon: User },
];
```

### MobileTabBar tabs Pattern

```typescript
// Aktuell (MobileTabBar.tsx, Zeile 19-41):
const tabs: Tab[] = [
  { to: "/day-planning", label: "Plan",     icon: CalendarDays },
  { to: "/dishes",       label: "Gerichte", icon: ChefHat },
  { to: "/porridge",     label: "Porridge", requiresFeature: "porridgeCalculator", icon: UtensilsCrossed },
  { to: "/profile",      label: "Profil",   icon: User },
];

// Ziel-Zustand (Porridge entfernt, Stats an Position 2):
const tabs: Tab[] = [
  { to: "/day-planning", label: "Plan",     icon: CalendarDays },
  { to: "/statistics",   label: "Stats",    icon: BarChart2 },   // NEU an Position 2
  { to: "/dishes",       label: "Gerichte", icon: ChefHat },
  { to: "/profile",      label: "Profil",   icon: User },
];
// Porridge-Tab wird hier vollständig entfernt (nicht nur hinter Feature-Flag)
```

### isActive-Logik für /statistics

Die bestehende Logik in Sidebar (Zeile 65) funktioniert bereits korrekt:
```typescript
const isActive = location.pathname === item.to
  || (item.to !== "/day-planning" && location.pathname.startsWith(item.to));
```
`/statistics` startet nicht mit dem Pfad anderer Routen — kein Konflikt. Query-Params (`?week=`) beeinflussen `pathname` nicht. Keine Änderung an der isActive-Logik erforderlich.

MobileTabBar (Zeile 67-69) verwendet dieselbe Logik — ebenfalls kein Anpassungsbedarf.

### Anti-Patterns to Avoid
- **Dashboard-Redirect anlegen:** Unnötig — Dashboard war nie in der Nav. Kein Nutzer landet dort.
- **manualChunks für Recharts:** Nicht nötig. Vite splittet automatisch bei Dynamic Import.
- **Porridge hinter Feature-Flag in MobileTabBar belassen:** Laut Entscheidung wird Porridge komplett aus MobileTabBar entfernt, nicht nur geflagged.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Code-Splitting | Manuelle Chunk-Konfiguration | `lazy()` + Dynamic Import | Vite splittet automatisch |
| Active-State | Eigene Routen-Match-Logik | `useLocation().pathname` match | Bereits etabliert, funktioniert mit ?week= |
| Suspense Fallback | Eigener Loader | `<LoadingSpinner />` | Bestehende shared Komponente |

---

## Common Pitfalls

### Pitfall 1: Default vs. Named Export beim lazy-Import
**Was schiefgeht:** `.then((m) => ({ default: m.StatisticsPage }))` für einen default export ergibt `undefined`.
**Warum:** `m.StatisticsPage` ist `undefined`, weil der Modul-Key bei default exports `default` heißt.
**Vermeidung:** `StatisticsPage` hat `export default function StatisticsPage()` — direkter Import ohne `.then()`:
```typescript
const StatisticsPage = lazy(() => import("./components/statistics/StatisticsPage"));
```
**Frühwarnung:** TypeScript-Fehler oder Blank-Screen beim Navigieren zu /statistics.

### Pitfall 2: Dashboard-Import vergessen zu entfernen
**Was schiefgeht:** Der `Dashboard` lazy import (App.tsx Zeile 37-39) bleibt stehen, die Route wird aber gelöscht. Tree-Shaking entfernt ihn möglicherweise nicht bei lazy-imports.
**Vermeidung:** Beim Entfernen der Route auch den `const Dashboard = lazy(...)` Import oben löschen.

### Pitfall 3: Porridge-Tab in MobileTabBar mit Feature-Flag statt vollständig entfernen
**Was schiefgeht:** Porridge bleibt als geflaggtes Item, erscheint aber wenn das Feature aktiv ist.
**Vermeidung:** Den `porridge`-Eintrag aus dem `tabs`-Array komplett entfernen (nicht nur requiresFeature setzen).

### Pitfall 4: Lucide Icon-Name falsch
**Was schiefgeht:** `BarChart` ist in neueren Lucide-Versionen umbenannt. Import schlägt fehl.
**Vermeidung:** Empfohlene Icons für Statistik: `BarChart2`, `BarChart3`, `TrendingUp`, `LineChart` — alle in Lucide verfügbar. Im Zweifel `BarChart2` nutzen (stable).

---

## Code Examples

### /statistics Route in App.tsx (vollständig)
```tsx
// Source: Analyse App.tsx, etabliertes Pattern
const StatisticsPage = lazy(() =>
  import("./components/statistics/StatisticsPage")
);

// In <Routes>:
<Route
  path="/statistics"
  element={
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <StatisticsPage />
      </Suspense>
    </ErrorBoundary>
  }
/>
// Dashboard Route entfernen (war Zeile 71-77)
// Dashboard lazy import entfernen (war Zeile 37-39)
```

### Vite Build-Verifikation (Code-Splitting Check)
```bash
npm run build
# Output sollte zeigen:
# dist/assets/StatisticsPage-[hash].js  (enthält Recharts)
# dist/assets/index-[hash].js           (enthält KEIN Recharts)
```

---

## State of the Art

| Alt | Aktuell | Wann | Impact |
|-----|---------|------|--------|
| Dashboard Placeholder an /dashboard | StatisticsPage an /statistics | Phase 4 | NAV-02 erfüllt |
| 4 Tabs inkl. Porridge (feature-gated) | 4 Tabs ohne Porridge, mit Stats | Phase 4 | Sauberere Mobile-Nav |

---

## Open Questions

1. **Welches Lucide Icon für Statistik?**
   - Was wir wissen: `BarChart2`, `BarChart3`, `TrendingUp`, `LineChart` sind alle verfügbar
   - Offen: Optik-Entscheidung liegt bei Claude (laut CONTEXT.md: Claude's Discretion)
   - Empfehlung: `BarChart2` — klar erkennbar, konsistent mit Statistik-Semantik

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm run test:unit` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NAV-02 | /statistics Route rendert StatisticsPage (kein 404) | smoke / manual | `npm run test:unit` (kein Unit-Test sinnvoll — Route-Rendering braucht Browser-Env) | ❌ manual-only |
| NAV-02 | /dashboard Route existiert nicht mehr (404 oder Redirect) | manual | — | ❌ manual-only |
| NAV-02 | Recharts nicht im Main-Bundle | build-check | `npm run build && ls dist/assets/` | ❌ Wave 0 build-check |

**Hinweis:** Route-Integration-Tests sind für diese Phase manual-only, weil: (1) Vitest läuft in Node-Env (kein DOM), (2) keine React Testing Library im Projekt, (3) der Aufwand für Setup übersteigt den Nutzen bei einer 3-Datei-Änderung. Der Vite-Build-Check für Code-Splitting ist die wichtigste automatisierbare Verifikation.

### Sampling Rate
- **Per task commit:** `npm run test:unit` (bestehende Utils-Tests sichern Regressionen)
- **Per wave merge:** `npm run test:unit`
- **Phase gate:** `npm run test:unit` grün + manueller Smoke-Test im Browser vor `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `npm run build` + Chunk-Analyse — deckt NAV-02 Recharts-Splitting ab (kein neues Test-File nötig, nur Build-Verifikationsschritt)

*(Keine neuen Test-Files erforderlich — die Phase ändert keine Utility-Logik, nur Routing und Nav-Konfiguration)*

---

## Sources

### Primary (HIGH confidence)
- Direkte Code-Analyse App.tsx — vollständige Route-Struktur, lazy-Patterns, Dashboard-Route
- Direkte Code-Analyse Sidebar.tsx — menuItems-Array, isActive-Logik
- Direkte Code-Analyse MobileTabBar.tsx — tabs-Array, Feature-Flag-Filtering
- Direkte Code-Analyse StatisticsPage.tsx — export default bestätigt
- vite.config.ts — manualChunks-Konfiguration, kein Recharts-Eintrag

### Secondary (MEDIUM confidence)
- Vite-Dokumentation: Dynamic imports werden automatisch gesplittet (bekanntes Verhalten, bestätigt durch vite.config.ts-Struktur)

### Tertiary (LOW confidence)
Keine LOW-confidence Findings.

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — Alle Bibliotheken bereits im Projekt installiert und genutzt
- Architecture: HIGH — Direkte Code-Analyse der zu ändernden Dateien
- Pitfalls: HIGH — Aus konkretem Code-Kontext abgeleitet (default vs. named export ist verifizierbar)

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stabiles Ecosystem, keine fast-moving Abhängigkeiten)
