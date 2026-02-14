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
