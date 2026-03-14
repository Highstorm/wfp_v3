# Phase 1: Data Foundation - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Types, Utilities, Firestore Range Query, Goal Resolution und der useWeeklyStats Hook. Reine Daten-Pipeline — kein UI. Die Phase liefert korrekte, typisierte Wochendaten, die von Phase 3 (Statistics UI) konsumiert werden.

</domain>

<decisions>
## Implementation Decisions

### Definition "geloggter Tag"
- Ein Tag gilt als geloggt, wenn mindestens eine Mahlzeit (Dish) oder ein TemporaryMeal vorhanden ist
- Leere MealPlan-Dokumente (existiert, aber keine Mahlzeiten) gelten als NICHT geloggt
- Tage nur mit Sport aber ohne Mahlzeiten gelten als NICHT geloggt
- Nicht-geloggte Tage werden als `hasData: false` markiert und fließen NICHT in Durchschnitte oder Defizit ein

### Sport-Kalorien bei nicht-geloggten Tagen
- Sport-Kalorien werden IMMER in die Wochen-Sportkalorien-Summe eingerechnet, auch von nicht-geloggten Tagen
- Sport-Kalorien von nicht-geloggten Tagen fließen NICHT in die Defizit-Berechnung ein
- Defizit wird nur für geloggte Tage berechnet: (Ziel + Sport) − Gegessen

### Kalorien-Berechnung pro Tag
- TemporaryMeals werden voll eingerechnet (Kalorien + Makros fließen in Tagessumme)
- Dish.calories enthält bereits die Gesamtkalorien (quantity ist schon eingerechnet) — einfach summieren
- Mehrere SportActivity-Objekte pro Tag werden addiert
- Sport-Sessions werden als einzelne Aktivitäten gezählt (3 Aktivitäten an 2 Tagen = "3 Sessions")

### Fehlende Makro-Daten
- Wenn ein Dish kein protein/carbs/fat hat: als 0g behandeln
- Wenn kein Makro-Ziel gesetzt ist (weder WeeklyNutritionGoals noch UserProfile): Makro-%-Bereich wird nicht angezeigt
- Wenn kein Kalorienziel gesetzt ist: keine Defizit-Karte, keine Ziel-Linie im Chart — Kalorien-Summe wird trotzdem gezeigt

### Zielauflösung
- Kalorienziel: WeeklyNutritionGoals.targetCalories → Fallback UserProfile.targetCalories → kein Ziel
- Jedes Makro-Ziel wird einzeln aufgelöst: WeeklyNutritionGoals > UserProfile > nicht anzeigen
- Beispiel: Protein-Ziel aus Weekly, KH-Ziel aus UserProfile, Fett kein Ziel → Protein und KH als % zeigen, Fett ausblenden

### Claude's Discretion
- Firestore Range Query Strategie (einzelne Queries vs. >= / <= Range)
- Hook-Rückgabeformat und interne Datenstrukturen
- Aggregations-Utility Architektur
- Testing-Strategie (Unit Tests, Mocking-Ansatz)

</decisions>

<specifics>
## Specific Ideas

- Defizit-Formel ist fix: (Tagesziel + Sportkalorien) − gegessene Kalorien
- Makros als % des Tagesziels, nicht als absolute Gramm-Werte
- Nur 7 Tage pro Wochenansicht laden (Performance-Constraint aus PROJECT.md)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `mealplan.repository.ts`: Hat `getMealPlanByDate(date)` für einzelne Tage — Range Query muss neu gebaut werden
- `weekly-goals.repository.ts`: Hat `getWeeklyNutritionGoals(weekStartDate)` — direkt nutzbar
- `profile.repository.ts`: Hat UserProfile mit Fallback-Zielen
- `useMealPlanByDate` Hook: React Query Pattern mit `queryKey: ["mealPlans", "byDate", date]`

### Established Patterns
- Repository-Layer: Direkte Firestore-Calls mit `auth.currentUser` Check
- Hooks: TanStack React Query mit typed queryKey Arrays
- Types: Separate `.types.ts` Dateien pro Domain
- Date-Handling: `date-fns` Library vorhanden

### Integration Points
- `MealPlan.date` ist ein String (Format prüfen) — Key für Range Query
- `MealPlan.sports: SportActivity[]` — Kalorien pro Aktivität
- `MealPlan.temporaryMeals: TemporaryMeal[]` — eigene Kalorien und Makros
- `Dish.calories: number` (required), `Dish.protein/carbs/fat` (optional)
- `WeeklyNutritionGoals.weekStartDate` — Montag der Woche als String
- Firestore Composite Index auf [createdBy, date] muss deployed werden (Blocker aus STATE.md)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-data-foundation*
*Context gathered: 2026-03-12*
