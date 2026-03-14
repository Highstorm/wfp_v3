# UI/UX Refactoring Baseline

## Build Baseline (vor Refactoring)

### Bundle Sizes
| Chunk | Groesse | Gzip |
|-------|---------|------|
| index.css | 38.48 kB | 6.97 kB |
| ui-vendor.js | 0.93 kB | 0.58 kB |
| index.js | 123.04 kB | 34.62 kB |
| react-vendor.js | 162.53 kB | 53.08 kB |
| firebase-vendor.js | 539.66 kB | 126.43 kB |

### Dependencies (zu entfernen)
- @mui/material: ^6.3.1
- @mui/icons-material: ^6.3.1
- @mui/x-date-pickers: ^7.23.3
- @emotion/react: ^11.14.0
- @emotion/styled: ^11.14.0

### Test Baseline
- Unit Tests: 18 passed (2 files)
- Build: erfolgreich (0 Fehler, 0 Warnungen)

### Styling-Zustand
- MUI/Emotion in package.json aber NICHT importiert in src/
- Tailwind CSS + CSS-Variablen (HSL) als primaeres Styling-System
- 3 shadcn-style UI-Primitives vorhanden (Button, Card, Input)
- 1 CSS-Datei: QuantitySelector.css
- theme.ts: ungenutzte alte Theme-Definition

---

## Build After (nach Refactoring)

### Bundle Sizes
| Chunk | Groesse | Gzip | Delta |
|-------|---------|------|-------|
| index.css | 39.99 kB | 7.23 kB | +1.51 kB (+3.7%) |
| ui-vendor.js | 84.08 kB | 29.28 kB | +83.15 kB (Headless UI) |
| index.js | 161.69 kB | 45.83 kB | +38.65 kB |
| react-vendor.js | 162.54 kB | 53.09 kB | +0.01 kB (unchanged) |
| firebase-vendor.js | 539.66 kB | 126.43 kB | 0 kB (unchanged) |
| Route chunks (lazy) | 84.34 kB | 26.50 kB | (existed before) |

### Dependencies entfernt
- @mui/material: removed
- @mui/icons-material: removed
- @mui/x-date-pickers: removed
- @emotion/react: removed
- @emotion/styled: removed

### Dependencies hinzugefuegt
- @headlessui/react: ^2.2.0 (accessible unstyled components)
- lucide-react: icons (already existed, now primary icon system)
- class-variance-authority: component variants (already existed)

### Test After
- Unit Tests: 18 passed (2 files) - feature parity
- TypeScript: 0 errors
- Build: erfolgreich (0 Fehler, 0 Warnungen)

### Zusammenfassung
- CSS: +3.7% (new design tokens, animations, dark mode variables)
- JS: ui-vendor growth from Headless UI (Dialog, Menu, Switch, Transition) - provides real accessible component functionality that was missing before
- 5 dead npm dependencies removed from package.json
- 2 dead files removed (theme.ts, QuantitySelector.css)
- 15 UI primitives added under src/components/ui/
- All hardcoded gray-* colors replaced with semantic theme tokens
- Dark mode fully supported via CSS custom properties
