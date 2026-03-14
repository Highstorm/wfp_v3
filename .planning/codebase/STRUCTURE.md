# Codebase Structure

**Analysis Date:** 2026-03-12

## Directory Layout

```
wfp/
├── src/
│   ├── components/              # React components organized by feature
│   │   ├── auth/               # Login, register, profile pages
│   │   ├── dishes/             # Dish management (list, create, edit, import)
│   │   ├── layout/             # App layout (header, sidebar, tab bar)
│   │   ├── meal-planning/      # Day/meal planning UI (main feature)
│   │   ├── porridge/           # Porridge calculator feature
│   │   ├── shared/             # Reusable components (error boundary, toast, loading)
│   │   ├── ui/                 # Low-level UI primitives (buttons, inputs, etc.)
│   │   └── QuantitySelector.tsx # Reusable quantity input component
│   ├── hooks/                   # Custom React hooks
│   ├── repositories/            # Data access layer (Firestore CRUD)
│   ├── services/                # External service integrations
│   ├── stores/                  # Zustand state stores
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Utility functions and helpers
│   ├── lib/                     # Library initializations (Firebase, config)
│   ├── config/                  # Feature flags and configuration
│   ├── App.tsx                  # Root router component
│   ├── main.tsx                 # Application entry point
│   ├── index.css                # Global styles
│   └── env.d.ts                 # TypeScript env var definitions
├── package.json                 # Project metadata and dependencies
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite build configuration
├── index.html                   # HTML template
└── .planning/                   # GSD planning artifacts
    └── codebase/               # Codebase analysis documents
```

## Directory Purposes

**`src/components/`:**
- Purpose: All UI components, organized by feature domain
- Contains: React functional components, pages, layouts, forms
- Key files: DayPlanningPage.tsx, MealPlanForm.tsx, DishesPage.tsx, ProfilePage.tsx, Dashboard.tsx

**`src/components/auth/`:**
- Purpose: Authentication pages and profile management
- Contains: LoginForm, RegisterForm, ProfilePage, AuthRedirect
- Key files: `LoginForm.tsx`, `RegisterForm.tsx`, `ProfilePage.tsx`, `AuthRedirect.tsx`

**`src/components/dishes/`:**
- Purpose: Dish management and creation features
- Contains: List view, detail view, create form, edit form, import from share code
- Key files: `DishesPage.tsx`, `DishForm.tsx`, `CreateDishWithIngredients.tsx`, `EditDishWithIngredients.tsx`, `ImportDishPage.tsx`

**`src/components/layout/`:**
- Purpose: App-wide layout structure and navigation
- Contains: Header with title/user info, Sidebar with main nav, MobileTabBar for mobile nav, Dashboard stats view
- Key files: `ProtectedLayout.tsx`, `Header.tsx`, `Sidebar.tsx`, `MobileTabBar.tsx`, `Dashboard.tsx`

**`src/components/meal-planning/`:**
- Purpose: Core meal planning UI and related forms
- Contains: Day view, meal sections (breakfast/lunch/dinner/snacks), nutrition display, calendar views, goal forms
- Key files: `DayPlanningPage.tsx`, `MealPlanForm.tsx`, `MealSection.tsx`, `SnacksAndExtrasSection.tsx`, `NutritionSummary.tsx`, `SportSection.tsx`, `WeekCalendar.tsx`, `MonthCalendar.tsx`
- Subdirectories: `cards/` (CalorieCard, NutrientCard, DeficitCard)

**`src/components/porridge/`:**
- Purpose: Porridge calculator feature (specialized nutrition tool)
- Contains: Porridge calculation form and display
- Key files: `PorridgeCalculator.tsx`

**`src/components/shared/`:**
- Purpose: Reusable UI components across features
- Contains: Error boundary, toast notifications, loading spinner, 404 page, modals
- Key files: `ErrorBoundary.tsx`, `Toast.tsx`, `LoadingSpinner.tsx`, `NotFound.tsx`

**`src/components/ui/`:**
- Purpose: Low-level UI primitives and design system components
- Contains: Basic building blocks (buttons, inputs, selects, cards, dialogs, forms, badges, etc.)
- Key files: Component library components from Headless UI + custom wrappers

**`src/hooks/`:**
- Purpose: Custom React hooks for data fetching and stateful logic
- Contains: React Query hooks for queries/mutations, feature-specific state hooks
- Key files: `useDishes.ts`, `useMealPlans.ts`, `useMealPlanFormState.ts`, `useMealPlanActions.ts`, `useProfile.ts`, `useWeeklyGoals.ts`, `useSharedDishes.ts`, `useFeatureAccess.ts`, `useIntervalsSync.ts`

**`src/repositories/`:**
- Purpose: Data access layer abstracting Firestore operations
- Contains: CRUD functions for each domain entity
- Key files: `dish.repository.ts`, `mealplan.repository.ts`, `profile.repository.ts`, `weekly-goals.repository.ts`, `shared-dish.repository.ts`, `index.ts` (barrel export)

**`src/services/`:**
- Purpose: External service integrations and business logic
- Contains: Gemini AI integration, OpenFoodFacts API integration, Intervals.icu integration
- Key files: `gemini.service.ts`, `openfoodfacts.service.ts`, `intervals.service.ts`

**`src/stores/`:**
- Purpose: Zustand state stores for client-side state
- Contains: Form state, global app state
- Key files: `auth.store.ts`

**`src/types/`:**
- Purpose: Centralized TypeScript type definitions
- Contains: Domain model interfaces
- Key files: `dish.types.ts`, `mealplan.types.ts`, `profile.types.ts`, `weekly-goals.types.ts`, `shared-dish.types.ts`, `firebase-ai.d.ts`, `index.ts` (barrel export)

**`src/utils/`:**
- Purpose: Utility functions for calculations, logging, and helpers
- Contains: Nutrition calculations, logging, share code generation
- Key files: `nutrition.utils.ts`, `logger.ts`, `share-code.utils.ts`, `index.ts` (barrel export)
- Subdirectories: `__tests__/` (unit tests)

**`src/lib/`:**
- Purpose: Library initialization and configuration
- Contains: Firebase app initialization, porridge config constants
- Key files: `firebase.ts`, `porridgeConfig.ts`, `toast.ts`, `utils.ts`

**`src/config/`:**
- Purpose: Feature flags and configuration constants
- Contains: Early access feature definitions and feature access logic
- Key files: `earlyAccessFeatures.ts`, `earlyAccessConfig.json`

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React DOM root initialization with React Query provider
- `src/App.tsx`: Router setup with all route definitions
- `src/components/layout/ProtectedLayout.tsx`: Protected route wrapper component

**Configuration:**
- `src/lib/firebase.ts`: Firebase initialization with environment variables
- `vite.config.ts`: Build configuration, code splitting, API proxying
- `tsconfig.json`: TypeScript compiler options
- `package.json`: Dependencies and scripts

**Core Logic:**
- `src/hooks/useMealPlanFormState.ts`: Main state management for meal planning UI
- `src/hooks/useMealPlanActions.ts`: Business logic actions for meal plans
- `src/utils/nutrition.utils.ts`: Nutrition calculation algorithms
- `src/services/gemini.service.ts`: AI-powered ingredient/nutrition enrichment
- `src/services/openfoodfacts.service.ts`: External nutrition database integration

**Testing:**
- `src/utils/__tests__/`: Unit tests for utilities
- Test files follow pattern: `*.test.ts` or `*.spec.ts`
- E2E tests in project root: `tests/` directory (playwright)

## Naming Conventions

**Files:**
- Components: PascalCase.tsx (e.g., `DayPlanningPage.tsx`, `MealPlanForm.tsx`)
- Hooks: camelCase starting with "use" (e.g., `useDishes.ts`, `useMealPlanActions.ts`)
- Repositories: camelCase with ".repository" suffix (e.g., `dish.repository.ts`)
- Services: camelCase with ".service" suffix (e.g., `gemini.service.ts`)
- Stores: camelCase with ".store" suffix (e.g., `auth.store.ts`)
- Types: camelCase with ".types" suffix (e.g., `dish.types.ts`)
- Utils: camelCase with domain prefix (e.g., `nutrition.utils.ts`, `logger.ts`)

**Directories:**
- Feature folders: lowercase with hyphens (e.g., `meal-planning`, `porridge`, `shared`)
- Domain directories: lowercase plural (e.g., `components`, `hooks`, `repositories`)

**TypeScript:**
- Interfaces: PascalCase (e.g., `Dish`, `MealPlan`, `NutritionGoals`)
- Types: PascalCase (e.g., `DishIngredient`, `SportActivity`)
- Constants: UPPER_SNAKE_CASE (e.g., `ZERO_NUTRITION`, `GEMINI_MODEL`)
- Functions: camelCase (e.g., `calculateDishNutrition`, `getDishes`)
- Variables: camelCase (e.g., `queryClient`, `currentUser`)

## Where to Add New Code

**New Feature (e.g., new meal section or tracking type):**
- Primary code: Create feature directory in `src/components/` (e.g., `src/components/feature-name/`)
- Container component: `src/components/feature-name/FeatureNamePage.tsx` (main page) or `src/components/feature-name/FeatureNameForm.tsx` (form)
- Hooks: Add to `src/hooks/useFeatureName.ts` if complex state needed
- Repository: If new data entity, add `src/repositories/feature-name.repository.ts`
- Types: Add types to `src/types/feature-name.types.ts` or extend existing types
- Tests: Add tests in `tests/` for E2E or `src/utils/__tests__/` for utilities

**New Component/Module:**
- Presentation component: `src/components/feature/ComponentName.tsx`
- Reusable component: `src/components/shared/ComponentName.tsx` or `src/components/ui/ComponentName.tsx`
- If UI primitive: Place in `src/components/ui/`
- If feature-specific shared component: Place in `src/components/feature/`

**Utilities:**
- Shared calculation logic: `src/utils/domain-name.utils.ts` (e.g., `nutrition.utils.ts`)
- Export from `src/utils/index.ts` barrel file for easier imports
- Add tests alongside in `src/utils/__tests__/domain-name.test.ts`

**Services (External APIs):**
- New external integration: `src/services/service-name.service.ts`
- Export functions with typed responses
- Handle errors with logger utility
- Document API contract in JSDoc comments

**State Management:**
- Form state: Add to `src/stores/` as new Zustand store with `.store.ts` suffix
- Server state: Use React Query hooks in `src/hooks/` (already preferred)

**Data Access:**
- New entity CRUD: Create `src/repositories/entity-name.repository.ts`
- Export functions from `src/repositories/index.ts`
- Follow pattern: check auth, validate data, call Firestore, handle errors

## Special Directories

**`src/components/ui/`:**
- Purpose: Headless UI and custom primitive components
- Generated: No (manually maintained)
- Committed: Yes
- Contains: Reusable design system components (Button, Input, Card, Dialog, etc.)

**`src/utils/__tests__/`:**
- Purpose: Unit tests for utility functions
- Generated: No (manually maintained)
- Committed: Yes
- Pattern: Test files co-located with utilities they test

**`tests/`:**
- Purpose: End-to-end (E2E) tests with Playwright
- Generated: No (manually maintained)
- Committed: Yes
- Pattern: Playwright test files for critical user flows

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents
- Generated: Yes (by `/gsd:map-codebase`)
- Committed: Yes
- Contains: ARCHITECTURE.md, STRUCTURE.md, and other analysis docs

**Build output:**
- `dist/`: Built production bundle (generated, not committed)
- `node_modules/`: Dependencies (generated, not committed)

---

*Structure analysis: 2026-03-12*
