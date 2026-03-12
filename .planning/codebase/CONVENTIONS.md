# Coding Conventions

**Analysis Date:** 2026-03-12

## Naming Patterns

**Files:**
- React components (functional): PascalCase (e.g., `DishForm.tsx`, `QuantitySelector.tsx`, `LoginForm.tsx`)
- Services: camelCase with `.service` suffix (e.g., `gemini.service.ts`, `openfoodfacts.service.ts`)
- Utilities: camelCase with `.utils` suffix (e.g., `nutrition.utils.ts`, `share-code.utils.ts`)
- Hooks: camelCase prefixed with `use` (e.g., `useDishes.ts`, `useMealPlans.ts`)
- Types/Interfaces: PascalCase with `.types` suffix (e.g., `dish.types.ts`, `mealplan.types.ts`)
- Stores/State: camelCase with `.store` suffix (e.g., `auth.store.ts`)
- Repositories: camelCase with `.repository` suffix (e.g., `dish.repository.ts`)
- Index files: `index.ts` as barrel exports

**Functions:**
- camelCase for all functions (e.g., `handleSubmit`, `calculateDishNutrition`, `loginTestUser`)
- Prefixed with verb: `handle*` for event handlers, `calculate*` for computations, `get*`/`fetch*` for data retrieval
- Event handlers: `handle[Event]` pattern (e.g., `handleInputChange`, `handleSubmit`, `handleDecrease`)
- Private/internal methods in classes: use underscore prefix if needed (none observed in codebase)

**Variables:**
- camelCase for all variables (e.g., `formData`, `quantityInput`, `dishNutrition`)
- Constants: UPPER_SNAKE_CASE or camelCase (example: `ZERO_NUTRITION` in `nutrition.utils.ts`)
- State variables: descriptive camelCase (e.g., `isEditing`, `hasGeminiAPIKey`, `isLoading`)
- Boolean flags: `is*` prefix (e.g., `isAnalyzing`, `isEditing`, `hasError`)

**Types:**
- Interface names: PascalCase without suffix in some cases (e.g., `Logger`, `NutritionValues`) or with suffix for domain types (`DishFormData`)
- Generic type parameters: Single uppercase letter or descriptive (e.g., `<Dish, Error>`)
- Optional properties in interfaces: marked with `?` (e.g., `rating?: number`, `recipe?: string`)

## Code Style

**Formatting:**
- TypeScript strict mode enabled (`strict: true` in tsconfig.json)
- No explicit formatter config (ESLint/Prettier) found; rely on TypeScript and IDE
- Indentation: 2 spaces (inferred from source files)
- Line length: No hard limit observed; varies between 80-100 characters in practice
- Trailing commas: Used in objects and imports

**Linting:**
- TypeScript compiler with strict flags: `noUnusedLocals`, `noUnusedParameters`
- No `.eslintrc` or `.prettierrc` found in repository
- Type checking enforced via `tsc` before build

**Code Organization:**
- Imports grouped: React/external → relative paths
- Use of absolute imports via TypeScript paths (not observed with aliases in tsconfig)
- Barrel exports in `index.ts` files for organizing multiple exports (e.g., `src/hooks/index.ts`, `src/repositories/index.ts`)

## Import Organization

**Order:**
1. React and React-DOM imports
2. Third-party packages (react-router-dom, @tanstack/react-query, Firebase, etc.)
3. Type imports (usually grouped with relative imports)
4. Relative imports from same project (`../` or `./`)

**Examples:**
```typescript
// From src/components/dishes/DishForm.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDishes, useCreateDish, useUpdateDish } from "../../hooks/useDishes";
import { analyzeNutritionLabelWithAI, isGeminiAvailable } from "../../services/gemini.service";
import { logger } from "../../utils/logger";
```

**Path style:**
- Relative imports with `../../` for parent directory navigation
- No path aliases observed; use relative paths consistently
- Type imports on same line as regular imports (no separate `import type` blocks observed)

## Error Handling

**Patterns:**
- Try-catch blocks for async operations (e.g., in `handleImageUpload` in DishForm)
- Logging via centralized `logger` utility with levels: debug, info, warn, error
- Error messages displayed to user via state (`setMessage`) or toast notifications
- Generic user-facing fallback messages in German (e.g., "Fehler beim Verarbeiten des Bildes.")
- Error boundary component (`ErrorBoundary.tsx`) at route level for React errors
- Null/undefined checks with optional chaining (`?.`) and nullish coalescing (`??`)

**Example from DishForm.tsx:**
```typescript
try {
  // operation
  setMessage("Nährwerte erfolgreich gescannt!");
} catch (error) {
  logger.error("Image upload error:", error);
  setMessage("Fehler beim Verarbeiten des Bildes.");
}
```

## Logging

**Framework:** Centralized logger in `src/utils/logger.ts`

**Implementation:**
- Custom Logger interface with four methods: `debug()`, `info()`, `warn()`, `error()`
- All log messages prefixed with `[WFP]` tag for debugging
- Debug and info only in development (`import.meta.env.DEV`)
- Warn and error always logged

**Patterns:**
- Use `logger.error()` for caught exceptions: `logger.error("Error description:", error)`
- Use `logger.debug()` for detailed trace info (dev only)
- Import centralized logger: `import { logger } from "../../utils/logger"`

## Comments

**When to Comment:**
- Complex logic with multiple branches (e.g., quantity selector validation)
- Non-obvious calculations (e.g., nutrition factor computations)
- Translations/German text explanations (common in this German-language app)
- JSDoc for exported functions and utilities

**JSDoc/TSDoc:**
- Used sparsely; seen in some utility functions (e.g., `nutrition.utils.ts`)
- Pattern: Function descriptions with `/** ... */` before export

**Example from nutrition.utils.ts:**
```typescript
/** Calculate nutrition for dishes with quantity multiplier. */
export function calculateDishNutrition(
  dishes: Array<{ calories: number; protein?: number; carbs?: number; fat?: number; quantity?: number }>
): NutritionValues {
```

## Function Design

**Size:** Typically 30-100 lines; larger functions (150+ lines) have clear sections with comments

**Parameters:**
- Named object parameters for multiple related values (e.g., `DishFormData` interface in DishForm)
- Destructuring preferred: `{ id } = useParams()`
- Optional parameters use `?` in TypeScript
- Callback handlers typed explicitly: `(e: React.ChangeEvent<HTMLInputElement>) => void`

**Return Values:**
- React components return JSX (`React.ReactNode`)
- Hooks return typed data from `@tanstack/react-query` (e.g., `useQuery<Dish[], Error>`)
- Utilities return explicit types (e.g., `NutritionValues` interface)
- Async functions return `Promise<T>`

## Module Design

**Exports:**
- Named exports preferred (e.g., `export const useDishes = () => { ... }`)
- Default exports used for React component pages (e.g., `export default App`)
- Mixing of default and named exports in some files (example: DishForm exports named function but file may have default)

**Barrel Files:**
- Used in `src/hooks/index.ts`, `src/repositories/index.ts`, `src/types/index.ts`
- Consolidate multiple exports for easier imports

**Example from src/repositories/index.ts structure:**
```typescript
export * from "./dish.repository";
export * from "./mealplan.repository";
// ... other repositories
```

## Component Patterns

**Functional Components:**
- All components are functional (hook-based) except `ErrorBoundary`
- No class components except for error boundary
- Props destructured in function signature or used inline

**Hooks Usage:**
- `useState` for local component state
- `useQuery`/`useMutation` from `@tanstack/react-query` for server state
- `useParams`, `useNavigate` from `react-router-dom` for routing
- Custom hooks from `src/hooks/` for complex logic

**State Management:**
- Local component state with `useState` for UI state (isEditing, isAnalyzing, formData)
- `@tanstack/react-query` for server-side state (dishes, mealPlans)
- `zustand` store for global auth state (`src/stores/auth.store.ts`)
- Form state managed locally in components before submission

## Tailwind CSS Conventions

**Classes:**
- Inline class strings for styling (no CSS modules observed)
- Utility classes: `flex`, `items-center`, `gap-*`, `px-*`, `py-*`, `rounded-*`
- Dark mode with `dark:` prefix (e.g., `dark:bg-white`, `dark:text-zinc-900`)
- Custom components defined in `src/index.css` using `@layer components`

**Custom utilities:**
- `.card`: card component styling
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`: button variants
- `.input`: form input styling
- `.slider`: range input styling for StomachPainTracker

**Color system:**
- CSS variables for semantic colors: `--primary`, `--destructive`, `--success`, etc.
- Nutrition semantic colors: `--color-calories`, `--color-protein`, `--color-carbs`, `--color-fat`
- High contrast dark mode support with inverted theme variables

## Type System

**Approach:**
- Strict TypeScript with `strict: true`
- Explicit type annotations on function returns and parameters
- Interface-based types for domain models (Dish, MealPlan, etc.)
- Generic typing for React hooks: `useQuery<T, ErrorType>`

**Common Type Patterns:**
- Request/response types with explicit interface definitions
- Optional properties with `?` and `undefined` in unions
- Discriminated unions for type narrowing (e.g., `category: "breakfast" | "mainDish" | "snack"`)
- Never use `any`; use `unknown` or specific types

## Internationalization (i18n)

**Approach:** No i18n library detected; German strings hardcoded directly

**Patterns:**
- German UI text inline in components: "Gericht bearbeiten", "Nährwerte erfolgreich gescannt!"
- German comments in code for non-obvious logic
- English in code structure and variable names
- Consistent German terminology: "Gericht" (dish), "Nährwert" (nutrition), "Mahlzeit" (meal)

---

*Convention analysis: 2026-03-12*
