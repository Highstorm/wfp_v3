# Architecture

**Analysis Date:** 2026-03-12

## Pattern Overview

**Overall:** Layered MVC with component-driven frontend, repository pattern for data access, and service/hook abstraction for business logic.

**Key Characteristics:**
- React 18 with client-side routing via React Router
- Vite-based single-page application with code splitting
- Firebase (Firestore + Auth) as backend and data store
- TanStack React Query for server state management
- Zustand for client form state
- Tailwind CSS + Headless UI for styling and components

## Layers

**Presentation Layer:**
- Purpose: Render UI and handle user interactions
- Location: `src/components/`
- Contains: React components, pages, layouts, shared UI components
- Depends on: Hooks, stores, shared utilities
- Used by: React Router for page rendering

**Container/Smart Components:**
- Purpose: Orchestrate data fetching, state management, and business logic
- Location: `src/components/` (feature directories like `meal-planning/`, `dishes/`)
- Contains: Feature pages and form components that use hooks
- Depends on: Custom hooks (`useDishes`, `useMealPlans`), stores
- Used by: Presentation components, Router

**Hook Layer (Custom Hooks):**
- Purpose: Encapsulate data fetching, mutations, and stateful logic
- Location: `src/hooks/`
- Contains: React Query hooks, form state hooks, feature-specific logic
- Depends on: Repositories, services, TanStack React Query, Zustand stores
- Used by: Components, other hooks
- Key files: `useDishes.ts`, `useMealPlanActions.ts`, `useMealPlanFormState.ts`, `useMealPlans.ts`

**Repository Layer (Data Access):**
- Purpose: Abstract Firebase Firestore operations and authentication checks
- Location: `src/repositories/`
- Contains: CRUD operations for Dishes, MealPlans, Profiles, WeeklyGoals, SharedDishes
- Depends on: Firebase SDKs, type definitions
- Used by: Custom hooks via React Query
- Key files: `dish.repository.ts`, `mealplan.repository.ts`, `profile.repository.ts`, `shared-dish.repository.ts`, `weekly-goals.repository.ts`

**Service Layer (Business Logic):**
- Purpose: External service integration and domain-specific calculations
- Location: `src/services/`
- Contains: Gemini API integration, OpenFoodFacts API integration, Intervals.icu integration
- Depends on: Firebase, external APIs, utilities
- Used by: Hooks, components for AI, nutrition lookup, sport tracking
- Key files: `gemini.service.ts`, `openfoodfacts.service.ts`, `intervals.service.ts`

**State Management Layer:**
- Purpose: Manage client-side form state and authentication state
- Location: `src/stores/`
- Contains: Zustand stores for form data (auth, meals)
- Depends on: Zustand
- Used by: Components for form state synchronization
- Key files: `auth.store.ts`

**Utilities Layer:**
- Purpose: Domain calculations, logging, code generation
- Location: `src/utils/`
- Contains: Nutrition calculations, logging utilities, share code generation
- Depends on: Type definitions
- Used by: Services, hooks, components
- Key files: `nutrition.utils.ts`, `logger.ts`, `share-code.utils.ts`

**Type Layer:**
- Purpose: Centralized TypeScript type definitions
- Location: `src/types/`
- Contains: Domain model types (Dish, MealPlan, UserProfile, etc.)
- Depends on: None
- Used by: All other layers
- Key files: `dish.types.ts`, `mealplan.types.ts`, `profile.types.ts`, `weekly-goals.types.ts`, `shared-dish.types.ts`

**Configuration Layer:**
- Purpose: Firebase initialization and early access feature flags
- Location: `src/lib/`, `src/config/`
- Contains: Firebase app initialization, porridge config
- Depends on: Environment variables
- Used by: Repositories, services
- Key files: `src/lib/firebase.ts`, `src/config/earlyAccessFeatures.ts`

## Data Flow

**Meal Planning Feature:**

1. User loads DayPlanningPage (`src/components/meal-planning/DayPlanningPage.tsx`)
2. Component renders MealPlanForm (`src/components/meal-planning/MealPlanForm.tsx`)
3. MealPlanForm initializes state via `useMealPlanFormState()` hook
4. Form displays meal sections (breakfast, lunch, dinner, snacks)
5. User selects a dish from list
6. `useMealPlanActions().handleAddDish()` adds dish to current meal section
7. User saves meal plan
8. `useMealPlanActions().handleSaveMealPlan()` calls `useMealPlanFormState().createMealPlan()`
9. Hook calls `createMealPlan()` from `src/repositories/mealplan.repository.ts`
10. Repository validates auth, structures data, saves to Firestore
11. React Query cache invalidates and refetches meal plans
12. Component re-renders with updated data

**Dish Creation with Ingredients:**

1. User navigates to `/dishes/create-with-ingredients`
2. CreateDishWithIngredients component loads
3. User enters ingredients via form
4. `useMealPlanFormState().calculateIngredientNutrition()` computes macros
5. User can optionally call Gemini service to enrich data
6. `gemini.service.generateNutritionFromDescription()` uses Firebase AI SDK
7. Results merged into ingredient data
8. User saves dish via `useCreateDish()` mutation hook
9. `createDish()` repository function saves to Firestore with nutrition data
10. React Query invalidates ["dishes"] query key
11. useDishes hook refetches and updates UI

**Nutrition Lookup Flow:**

1. User clicks "search OpenFoodFacts" for ingredient
2. Component calls `openfoodfacts.service.searchProduct()`
3. Service fetches from OpenFoodFacts API (proxied via Vite)
4. Returns SearchableProduct[] with parsed nutrition info
5. User selects product
6. Product nutrition data merged into ingredient form
7. Submitted with dish creation

**Sport Activity Sync with Intervals.icu:**

1. User links Intervals.icu account (stores credentials)
2. MealPlanForm renders SportSection
3. User triggers sync via `useMealPlanActions().handleSyncIntervals()`
4. IntervalsService fetches activities for date range
5. Activities converted to SportActivity objects (calories burned)
6. Added to current meal plan's sports array
7. Saved with meal plan

**State Management:**

- **Server State:** Dishes, MealPlans, Profiles (managed by React Query via hooks)
- **Form State:** Auth form data (managed by Zustand auth.store)
- **Local UI State:** Selected date, expanded sections, search term (managed by useMealPlanFormState hook)
- **Auth State:** Current user (managed by Firebase Auth, checked in repositories)

## Key Abstractions

**Repository Pattern:**
- Purpose: Isolate Firestore operations behind consistent interface
- Examples: `src/repositories/dish.repository.ts`, `src/repositories/mealplan.repository.ts`
- Pattern: Each repository exports async functions (getDishes, createDish, etc.) that check auth and handle data transformation

**Custom Hooks with React Query:**
- Purpose: Combine data fetching with mutation handling and cache management
- Examples: `useDishes()` queries dishes, `useCreateDish()` mutates dishes
- Pattern: Hooks wrap repository functions in useQuery/useMutation, handle invalidation

**Service Layer for External APIs:**
- Purpose: Encapsulate external service calls and domain logic
- Examples: `gemini.service.ts` for AI, `openfoodfacts.service.ts` for nutrition lookup
- Pattern: Services export async functions with typed responses, error handling

**Form State Hook:**
- Purpose: Centralize complex meal plan form state in single hook
- Examples: `useMealPlanFormState()` manages date, meal sections, UI visibility
- Pattern: Custom hook with useReducer-like setter functions

## Entry Points

**Application Entry:**
- Location: `src/main.tsx`
- Triggers: Browser loads app
- Responsibilities: Initialize React DOM, wrap App with QueryClientProvider for React Query, render root component

**App Component:**
- Location: `src/App.tsx`
- Triggers: Called from main.tsx
- Responsibilities: Set up BrowserRouter, define all routes with lazy-loaded components, render Toast and error boundaries

**Protected Routes:**
- Location: `src/components/layout/ProtectedLayout.tsx`
- Triggers: Routes after `/login` and `/register`
- Responsibilities: Render Sidebar, Header, MobileTabBar layout wrapper, outlet for nested routes

**Feature Pages:**
- Day Planning: `src/components/meal-planning/DayPlanningPage.tsx` (home page and /day-planning route)
- Dishes: `src/components/dishes/DishesPage.tsx` (list, create, edit)
- Dashboard: `src/components/layout/Dashboard.tsx` (/dashboard route)
- Porridge Calculator: `src/components/porridge/PorridgeCalculator.tsx` (/porridge route)
- Profile: `src/components/auth/ProfilePage.tsx` (/profile route)

## Error Handling

**Strategy:** Layered error handling with Firebase auth checks at repository level, service-level try-catch with logging, component-level error boundaries.

**Patterns:**
- **Auth Check:** Every repository function checks `auth.currentUser` and throws "Not authenticated" error
- **Data Validation:** Repositories validate required fields before save (e.g., `if (!dish.name || typeof dish.calories !== "number")`)
- **API Errors:** Services use try-catch and log via `logger.debug()`/`logger.warn()`
- **Component Errors:** ErrorBoundary wrapper (`src/components/shared/ErrorBoundary.tsx`) catches React errors on meal planning and dish edit pages
- **Network Errors:** React Query handles mutation errors, components display toast notifications via Toast component

## Cross-Cutting Concerns

**Logging:** Custom `logger` utility at `src/utils/logger.ts` with debug/warn/error levels used in services

**Validation:** Repository-level field validation before Firestore writes; form-level validation in components (Zod not detected, manual validation)

**Authentication:** Firebase Auth integration via `src/lib/firebase.ts`; AuthRedirect component (`src/components/auth/AuthRedirect.tsx`) protects nested routes; currentUser check in all repositories

**Authorization:** User-scoped data access via "createdBy" field in repositories (dishes filtered by `where("createdBy", "==", auth.currentUser.uid)`)

**Data Normalization:** Undefined/null value cleanup before Firestore writes in createDish/updateDish to avoid storage issues

---

*Architecture analysis: 2026-03-12*
