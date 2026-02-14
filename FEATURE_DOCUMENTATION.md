# Feature: Mengen-Unterstützung für alle Mahlzeiten mit Dezimalzahlen

## Übersicht

Dieses Feature erweitert die Meal-Planning-App um die Möglichkeit, Mengen für Gerichte in allen Mahlzeittypen (Frühstück, Mittagessen, Abendessen und Snacks) anzugeben. Die Mengen können als Dezimalzahlen eingegeben werden und die Nährwerte werden automatisch entsprechend multipliziert.

## Neue Funktionalität

### 1. Erweiterte QuantitySelector Komponente

**Datei:** `src/components/QuantitySelector.tsx`

**Verbesserungen:**
- ✅ Unterstützung für Dezimalzahlen (z.B. 1,5 oder 2,5)
- ✅ Deutsche Lokalisierung (Komma statt Punkt)
- ✅ Flexibler Schritt-Wert (Standard: 0,5)
- ✅ Konfigurierbarer Minimalwert (Standard: 0,5)
- ✅ Automatische Formatierung (ganze Zahlen ohne Dezimalstellen)
- ✅ Eingabe-Validierung mit Fallback auf Minimum

**Beispiele:**
- Eingabe von "1,5" oder "1.5" wird als "1,5" angezeigt
- Ganze Zahlen wie "2" werden ohne ",0" angezeigt
- Ungültige Eingaben werden auf Minimum (0,5) zurückgesetzt

### 2. Erweiterte MealSection Komponente

**Datei:** `src/components/meal-planning/MealSection.tsx`

**Neue Features:**
- ✅ QuantitySelector für alle Gerichte in Frühstück, Mittagessen und Abendessen
- ✅ Nährwerte-Anzeige wird automatisch mit der Menge multipliziert
- ✅ Responsive Layout mit Quantity-Selector und Lösch-Button nebeneinander

**Nährwerte-Berechnung:**
```typescript
// Beispiel für 1,5 Portionen eines Gerichts mit 200 kcal
calories: Math.round((dish.calories || 0) * quantity) // 300 kcal
protein: Math.round((dish.protein || 0) * quantity * 10) / 10 // Auf 0,1g genau
```

### 3. Erweiterte MealPlanForm Komponente

**Datei:** `src/components/meal-planning/MealPlanForm.tsx`

**Verbesserungen:**
- ✅ `handleUpdateDishQuantity` Funktion unterstützt alle Mahlzeittypen
- ✅ Aktualisierte Nährwerte-Berechnung in `calculateTotalNutrition`
- ✅ Alle Gerichte werden standardmäßig mit Menge 1 hinzugefügt

## Benutzerführung

### Mengen eingeben

1. **Über Buttons:** 
   - `+` Button erhöht um 0,5
   - `-` Button verringert um 0,5 (Minimum: 0,5)

2. **Über Texteingabe:**
   - Direkte Eingabe von Dezimalzahlen
   - Sowohl Komma (1,5) als auch Punkt (1.5) werden akzeptiert
   - Anzeige erfolgt immer mit Komma (deutsche Lokalisierung)

3. **Validierung:**
   - Minimum: 0,5 Portionen
   - Maximum: unbegrenzt
   - Nur eine Nachkommastelle erlaubt
   - Ungültige Eingaben werden automatisch korrigiert

### Nährwerte-Berechnung

- **Pro Gericht:** Anzeige der multiplizierten Werte direkt beim Gericht
- **Gesamt-Übersicht:** Summierung aller Gerichte mit ihren jeweiligen Mengen
- **Runden:** 
  - Kalorien: Auf ganze Zahlen
  - Protein/Kohlenhydrate/Fett: Auf 0,1g genau

## Tests

### E2E-Tests (Playwright)

**Datei:** `tests/QuantitySelector.spec.ts`
- Test der Grundfunktionalität (Plus/Minus Buttons)
- Test der Dezimalzahlen-Eingabe
- Test der deutschen Lokalisierung
- Test der Validierung und Fehlerbehandlung

**Datei:** `tests/meal-quantity-nutrition.spec.ts`
- Test der Nährwerte-Berechnung
- Test über alle Mahlzeittypen hinweg
- Test der Persistierung nach Speichern/Neu laden
- Test der Integration mit bestehenden Features

### Test-Ausführung

```bash
# Alle Tests ausführen
npm run test:e2e

# Spezifische Tests ausführen
npx playwright test QuantitySelector.spec.ts
npx playwright test meal-quantity-nutrition.spec.ts
```

## Technische Details

### TypeScript-Typen

Die bestehenden `Dish`-Interfaces wurden um eine optionale `quantity`-Property erweitert:

```typescript
interface Dish {
  // ... bestehende Properties
  quantity?: number; // Neu hinzugefügt
}
```

### Backwards-Kompatibilität

- ✅ Bestehende Gerichte ohne Mengen-Angabe werden automatisch mit Menge 1 behandelt
- ✅ Die Snacks-Funktionalität bleibt unverändert 
- ✅ Keine Breaking Changes in der API

### Performance-Optimierungen

- Nährwerte-Berechnung erfolgt nur bei Änderungen
- Effiziente State-Updates durch gezielte Objekt-Updates
- Minimale Re-Renders durch React-Optimierungen

## Deployment

Das Feature ist vollständig im Feature-Branch `feature/meal-quantity-with-decimal-support` implementiert.

### Merge-Vorbereitung

1. ✅ Alle Tests implementiert und dokumentiert
2. ✅ Backwards-Kompatibilität gewährleistet
3. ✅ Deutsche Lokalisierung implementiert
4. ✅ Error-Handling implementiert
5. ✅ Responsive Design berücksichtigt

### Nach dem Merge

- Feature ist sofort verfügbar für alle Nutzer
- Bestehende Tagespläne funktionieren weiterhin
- Neue Gerichte können mit Dezimalmengen hinzugefügt werden

## Benutzer-Benefits

1. **Präzisere Portionsangaben:** 1,5 Portionen statt nur ganze Zahlen
2. **Genauere Nährwerte:** Bessere Kontrolle über die tägliche Nährstoffaufnahme  
3. **Einheitliche Bedienung:** Alle Mahlzeittypen haben jetzt die gleiche Funktionalität
4. **Deutsche Lokalisierung:** Komma-Notation entspricht deutschen Standards
5. **Intuitive Bedienung:** Plus/Minus Buttons für schnelle Anpassungen