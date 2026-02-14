# UI/UX Refactoring Changelog

## Phase 0: Setup & Branching (`9e71ac5`)
- Feature-Branch `feature/ui-ux-refactoring` erstellt
- Baseline-Dokumentation (Bundle Sizes, Tests, Dependencies)
- 18 Unit Tests bestanden, Build erfolgreich

## Phase 1: Design-System (`9ab61b9`)
- Wellness/Health-fokussiertes Farbsystem mit Emerald Green als Primary
- HSL CSS Custom Properties fuer Light + Dark Mode
- Semantische Ernaehrungsfarben: Kalorien=Amber, Protein=Blau, Kohlenhydrate=Gruen, Fett=Rot
- Font Pairing: Plus Jakarta Sans (Headings) + Inter (Body)
- Google Fonts mit Preconnect-Optimierung
- tailwind.config.js → tailwind.config.ts migriert
- Animations-Keyframes: fade-in/out, slide-in, scale-in, progress-fill
- prefers-reduced-motion Support
- Transition-Duration Tokens: fast (150ms), normal (250ms), slow (400ms)

## Phase 2: Komponentenbibliothek & MUI-Entfernung (`2a96844`)
- 15 UI-Primitives unter `src/components/ui/` erstellt:
  - Button (erweitert mit Loading-State), Card, Input (bestehend)
  - Dialog (Headless UI mit Transitions)
  - Badge (6 Varianten via CVA)
  - Progress (ARIA-konform, Groessen-Varianten)
  - Toggle/Switch (Headless UI Switch)
  - Textarea, Label, Select, Skeleton, Avatar, Divider, Tooltip
- Barrel-Export in `src/components/ui/index.ts`
- 5 tote MUI/Emotion-Dependencies entfernt
- `theme.ts` und `QuantitySelector.css` geloescht
- CSS-Utility-Klassen (.card, .btn-primary, etc.) als @apply beibehalten

## Phase 3: Layout-System & Navigation (`cbb91b3`)
- ProtectedLayout mit Desktop-Sidebar erweitert
- Header mit Headless UI Menu umgebaut (md:hidden, mobile-only)
- MobileTabBar komplett auf Tailwind migriert (inline-styles entfernt)
- Lucide Icons systemweit (CalendarDays, ChefHat, UtensilsCrossed, etc.)
- ThemeToggle mit Lucide Sun/Moon Icons
- ARIA-Attribute: role="tablist", role="tab", aria-selected
- data-[focus] States fuer Keyboard-Navigation

## Phase 4: Interaktionen & Micro-UX (`174d0fd`)
- Toast-System redesigned: 4 Varianten (success/error/info/warning)
- Slide-in Animation, Dismiss-Button, role="alert"
- CalorieCard mit SVG Circular Progress Ring (animiert, farbcodiert)
- NutrientCard mit horizontalen Progress Bars und semantischen Farben
- tabular-nums fuer konsistente Zahlenausrichtung

## Phase 5: Accessibility & Performance (`0cfffe0`)
- focus:outline-none → focus-visible:ring-2 in allen Komponenten
- Alle hardcoded gray-* Farben durch semantische Tokens ersetzt
  - bg-gray-50 → bg-muted
  - text-gray-900 → text-foreground
  - text-gray-600/700 → text-muted-foreground
  - text-gray-400 → text-muted-foreground
  - hover:bg-gray-100 → hover:bg-accent
  - hover:text-red-600 → hover:text-destructive
- Dark Mode vollstaendig kompatibel
- MUI-Entfernung validiert (0 Referenzen)
- Bundle-Size-Vergleich dokumentiert
- Font-Loading optimiert (preconnect + display=swap)

## Zusammenfassung

### Entfernt
- @mui/material, @mui/icons-material, @mui/x-date-pickers
- @emotion/react, @emotion/styled
- theme.ts, QuantitySelector.css

### Hinzugefuegt
- 15 UI-Primitive (src/components/ui/)
- Headless UI Komponenten (Dialog, Menu, Switch)
- Vollstaendiges Design-Token-System (CSS Custom Properties)
- Dark Mode Support
- Semantische Ernaehrungsfarben
- SVG Progress Ring (CalorieCard)
- Animierte Progress Bars (NutrientCard)
- Toast-System mit 4 Varianten
- prefers-reduced-motion Support
- WCAG-konforme Fokus-Styles (focus-visible)

### Metriken
- Tests: 18/18 bestanden (Feature Parity)
- TypeScript: 0 Fehler
- Build: erfolgreich
- Hardcoded Farben: 0 verbleibend
- focus:outline-none ohne Ring: 0 verbleibend
