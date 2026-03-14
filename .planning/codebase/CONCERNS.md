# Codebase Concerns

**Analysis Date:** 2026-03-12

## Tech Debt

**Large Component Files:**
- Issue: Multiple component files exceed 600 lines, creating complex, monolithic UI logic
- Files:
  - `src/components/dishes/CreateDishWithIngredients.tsx` (661 lines)
  - `src/components/meal-planning/SnacksAndExtrasSection.tsx` (632 lines)
  - `src/components/dishes/EditDishWithIngredients.tsx` (632 lines)
- Impact: Difficult to test, maintain, and refactor; increased cognitive load when modifying features; dropdown/search logic tightly coupled with component state
- Fix approach: Extract search/dropdown logic into separate custom hooks (`useProductSearch`, `useDropdownState`); create smaller presentational components for ingredient lists and meal items

**Unmanaged setTimeout/Timing Issues:**
- Issue: Multiple setTimeout calls (13+ instances) for handling UI timing, particularly around iOS touch events and dropdown closures
- Files:
  - `src/components/dishes/CreateDishWithIngredients.tsx:94, 190, 288` (300ms/100ms delays)
  - `src/components/meal-planning/SnacksAndExtrasSection.tsx:160` (100ms delay)
  - `src/components/dishes/EditDishWithIngredients.tsx:103, 196, 305` (varying delays)
  - `src/hooks/useMealPlanActions.ts:63` (200ms delay)
- Impact: Race conditions possible; timing-dependent behavior hard to test; mobile/iOS touch events fragile across devices; delays may not work consistently
- Fix approach: Replace setTimeout-based dropdown closures with React ref tracking and Focus/Blur event handling; use AbortController for proper cleanup; create custom hook `useDropdownTiming()` for iOS-safe dropdown behavior

**Lack of Mocking in Testing:**
- Issue: Only 6 component files in codebase use React.memo; 29 useState/useMemo patterns but limited performance optimization
- Files: Most components in `src/components/**/*.tsx`
- Impact: Unnecessary re-renders on parent state changes; performance degradation with large meal/ingredient lists; no isolation of component concerns
- Fix approach: Implement React.memo() for expensive leaf components; create memoized selector functions for computed meal nutrition; extract frequently-rendered sub-components

**Numeric Precision Handling:**
- Issue: 92 instances of Math.round/parseFloat/parseInt scattered throughout without consistent rounding strategy
- Files: Throughout `src/` (nutrition calculations, quantity handling, calorie math)
- Impact: Rounding errors accumulate in meal plan calculations; inconsistent nutrition display; floating-point precision issues especially with ingredient quantities
- Fix approach: Create utility functions `roundNutrition()`, `roundQuantity()` with documented rounding rules; centralize decimal place handling

## Known Bugs

**iOS Touch Event Handling in Dropdowns:**
- Symptoms: Dropdown closes unexpectedly when clicking/tapping items on iPhone; search results not properly selectable on iOS devices
- Files:
  - `src/components/dishes/CreateDishWithIngredients.tsx:85-111` (event listeners with 100ms setTimeout)
  - `src/components/meal-planning/SnacksAndExtrasSection.tsx:152-175` (similar pattern)
- Trigger: User taps on a dropdown search result on iOS; the touchstart event fires, setTimeout fires, and dropdown closes before tap handler executes
- Workaround: Increase setTimeout delay to 300ms+ or tap multiple times; currently mitigated with 100-300ms delays but unreliable
- Root cause: setTimeout race condition between touchstart event listener and tap handler

**Gemini API Timeout Handling:**
- Symptoms: AI search may silently fail after 15 seconds; no user feedback on timeout vs. no results
- Files: `src/services/gemini.service.ts:114-179`
- Current mitigation: 15-second timeout with Promise.race, but timeout resolution doesn't clear loading state in some edge cases
- Issue: Race condition between timeout promise and generatePromise.catch; if timeout wins but user retries quickly, model state is stale

**Nutrition Data Loss on Component Unmount:**
- Symptoms: Form state lost when navigating away during AI image analysis
- Files:
  - `src/components/dishes/DishForm.tsx:46-95`
  - `src/components/meal-planning/SnacksAndExtrasSection.tsx:60-100`
- Trigger: User uploads image, then navigates to another page before analysis completes
- Workaround: Wait for analysis to complete before navigating
- Risk: Unfinished nutrition label analyses don't persist; FileReader state is abandoned

## Security Considerations

**Firebase Authentication - No Timeout:**
- Risk: User stays authenticated indefinitely; no session expiration
- Files: `src/lib/firebase.ts`, `src/stores/auth.store.ts`
- Current mitigation: Browser session cookies handled by Firebase SDK defaults
- Recommendations: Implement explicit session timeout (30-60 min inactivity); add logout-on-inactivity; store session expiry timestamp

**Unvalidated External API Data:**
- Risk: Gemini AI responses and OpenFoodFacts data not fully validated before use in nutrition calculations
- Files:
  - `src/services/gemini.service.ts:247-290` (parseGeminiResponse)
  - `src/services/openfoodfacts.service.ts` (nutrition value extraction)
- Current mitigation: Basic null checks and JSON parsing with try-catch
- Recommendations:
  - Add schema validation (e.g., Zod) for API responses
  - Validate nutrition values are within reasonable ranges (0-2000 kcal per serving)
  - Sanitize product names before display

**Image Upload Processing:**
- Risk: No file type validation; no file size limits for image uploads
- Files: `src/components/dishes/DishForm.tsx:46-95`, `src/components/meal-planning/SnacksAndExtrasSection.tsx:60-100`
- Current mitigation: HTML input type="file" but no server-side validation
- Recommendations:
  - Add client-side file type check (MIME type whitelist)
  - Enforce max file size (e.g., 5MB)
  - Add server-side validation before sending to Gemini API

**Bare @ts-ignore Usage:**
- Risk: Type safety bypasses in critical paths
- Files:
  - `src/services/gemini.service.ts:34` (@ts-ignore for dynamic firebase/ai import)
  - `src/components/auth/LoginForm.tsx`, `src/components/auth/RegisterForm.tsx` (multiple @ts-ignore)
  - `src/components/dishes/CreateDishWithIngredients.tsx` (@ts-ignore for handlers)
- Impact: Silent runtime errors possible; Firebase SDK version compatibility not enforced
- Recommendations: Create proper type definitions; use type guards instead of @ts-ignore

## Performance Bottlenecks

**Expensive Meal Plan Re-renders:**
- Problem: MealPlanForm calculates total nutrition on every render; all meal sections re-render when parent state changes
- Files:
  - `src/components/meal-planning/MealPlanForm.tsx:96-100` (calculateTotalNutrition called during render)
  - `src/hooks/useMealPlanFormState.ts` (state object includes all meals, all re-create on single field change)
- Cause: No useMemo for computed nutrition; all state stored in single reducer-like useState
- Current bottleneck: With 50+ ingredients across 4 meal types, recalculating on every keystroke in search
- Improvement path:
  - Memoize calculateTotalNutrition with useMemo
  - Split state into smaller domains (breakfast state, lunch state, etc.) to minimize re-renders
  - Use React.memo for MealSection components with proper key

**Gemini API Latency:**
- Problem: 15-second timeout is too aggressive for complex nutrition label scanning; no retry logic
- Files: `src/services/gemini.service.ts:114-179`
- Cause: Single Promise.race with hard timeout; no exponential backoff
- Impact: Users see "no results" when API is just slow; must manually retry
- Improvement path: Increase timeout to 30 seconds for image analysis; implement retry with exponential backoff (3 retries, 1s/2s/4s)

**Unindexed Firestore Queries:**
- Problem: No indexes specified for multi-field queries (createdBy + date)
- Files: `src/repositories/mealplan.repository.ts:41-65` (getMealPlanByDate uses two where clauses)
- Impact: Queries scale poorly as user meal plans grow; Firestore will warn about missing indexes
- Improvement path: Define composite indexes in Firebase console; consider denormalizing user ID into partition key

**Large Test Files Without Mocking:**
- Problem: Playwright E2E tests (227 lines) load entire app for simple input tests
- Files: `tests/gemini-ai-dish-creation.spec.ts` (227 lines)
- Impact: Tests are slow (15+ seconds per suite); flaky due to AI API latency; hard to isolate failures
- Improvement path: Split into unit tests with mocked services; use Playwright only for critical user flows (login, meal save, share)

## Fragile Areas

**Search Dropdown Logic - Highly Complex:**
- Files:
  - `src/components/dishes/CreateDishWithIngredients.tsx:85-408` (dropdown, search, AI integration)
  - `src/components/meal-planning/SnacksAndExtrasSection.tsx:152-300` (similar pattern)
- Why fragile:
  - Multiple overlapping event listeners (mousedown, touchstart, click, blur, focus)
  - setTimeout race conditions
  - State tied to dropdown visibility (showDropdown, searchQuery, aiSearchResult, isAISearching)
  - iOS-specific timing logic duplicated across two files
- Safe modification:
  - Extract into custom hook `useSearchableDropdown()` to centralize event handling
  - Unit test the hook independently with React Testing Library
  - Use AbortController instead of setTimeout for cleanup
- Test coverage: Search/dropdown behavior NOT tested; only integration tests for dish creation

**AI Integration - Dependency on External Service:**
- Files:
  - `src/services/gemini.service.ts` (Firebase Generative AI SDK)
  - `src/components/dishes/CreateDishWithIngredients.tsx` (integrates AI search)
  - `src/components/meal-planning/SnacksAndExtrasSection.tsx` (image analysis)
- Why fragile:
  - Firebase AI SDK is dynamically imported with @ts-ignore
  - No fallback UI if Gemini API is unavailable
  - Image analysis results not validated for nutritional plausibility
  - Depends on Google Cloud project configuration
- Safe modification:
  - Add feature flag `GEMINI_ENABLED` to gracefully disable
  - Implement offline mode that shows warning "AI features unavailable"
  - Add validation for nutrition values (sanity check: 0-3000 kcal/100g max)
- Test coverage: Gemini mocked in tests; real API calls only in E2E

**Complex State Management in Meal Planning:**
- Files: `src/hooks/useMealPlanFormState.ts` (263 lines, 20+ state variables)
- Why fragile:
  - State mutations happen through multiple action functions
  - No single source of truth; same data referenced multiple ways
  - Date changes trigger complex cascading resets
  - Intervals sync adds external API calls into state management
- Safe modification:
  - Consider migrating to Zustand store for centralized state
  - Add state validation/guards to prevent invalid transitions
  - Document state machine (loading → saving → saved)
- Test coverage: Form state tested indirectly through E2E tests only

## Scaling Limits

**Meal Plan State Object:**
- Current capacity: Handles ~50-100 dishes per day across 4 meal types + snacks
- Limit: Beyond 200 dishes/day, rendering becomes noticeably slow (MealSection re-renders)
- Scaling path:
  - Implement virtual scrolling for large dish lists using react-window
  - Paginate snacks/extras instead of rendering all at once
  - Move to local state management (Zustand) to prevent parent component re-renders

**Firestore Read Operations:**
- Current capacity: User with 100 meal plans can load data in <1s
- Limit: 1000+ meal plans causes unindexed query warnings; loadAll pattern unsustainable
- Scaling path:
  - Implement pagination (fetch 30 days at a time)
  - Add composite indexes for (createdBy, date) queries
  - Consider caching strategy with React Query staleTime

**Firebase Realtime Sync:**
- Current capacity: Single user; no multi-device sync implemented
- Limit: No handling for concurrent edits from different devices
- Scaling path:
  - Add optimistic updates with conflict resolution
  - Implement last-write-wins or operational transformation
  - Add session versioning to detect conflicts

## Dependencies at Risk

**Firebase SDK - Major Version 12:**
- Risk: Breaking changes between Firebase SDK v11 → v12; Generative AI SDK is unstable
- Files: `src/lib/firebase.ts`, `src/services/gemini.service.ts`
- Current version: firebase@^12.5.0
- Impact: Dynamic import of firebase/ai may fail on Firebase version downgrades; no version lock
- Migration plan:
  - Lock Firebase version to ^12.5.0 minimum in package.json
  - Add tests that verify firebase/ai SDK availability
  - Create fallback when Firebase AI SDK not available

**React Router v6 - Router Wrapper Pattern:**
- Risk: Future versions may deprecate BrowserRouter wrapping approach
- Files: `src/App.tsx` (BrowserRouter as Router)
- Migration plan: Already using modern Route API; no immediate action needed

**TanStack React Query - Polling Queries:**
- Risk: No polling implemented; infinite scrolling queries could cause excessive API calls
- Files: Throughout `src/hooks/` (useQuery hooks)
- Improvement: Set staleTime and cacheTime appropriately to avoid redundant Firestore reads

## Missing Critical Features

**Offline Mode:**
- Problem: App requires internet; no offline caching of meal plans or dishes
- Blocks: Users cannot view/plan meals without connection; forms are lost on disconnect
- Impact: Medium - affects mobile users on unreliable connections
- Implementation: Add service worker with IndexedDB caching for meal plans/dishes

**User Feedback for Long-Running Operations:**
- Problem: AI image analysis and nutrient searches have no progress indicator beyond loading spinner
- Blocks: Users don't know if app is processing or stuck
- Impact: Medium - poor UX for slow connections
- Implementation: Add progress events from Gemini API; display estimated time remaining

**Meal Plan Sharing Beyond Share Codes:**
- Problem: Can only share individual dishes via code; cannot share entire meal plans
- Blocks: Users cannot collaborate on weekly meal planning
- Implementation: Create public/private meal plan URLs with permission model

## Test Coverage Gaps

**Component-Level Unit Tests Missing:**
- What's not tested:
  - Meal section add/remove/update functionality (MealSection, SnacksAndExtrasSection)
  - Dish form validation and submission (DishForm, CreateDishWithIngredients)
  - Nutrition goal form changes (NutritionGoalsForm, WeeklyNutritionGoalsForm)
- Files: `src/components/meal-planning/` and `src/components/dishes/` (limited test coverage)
- Risk: Bug regressions in UI flows go unnoticed; only caught in E2E tests (slow feedback)
- Priority: High - these are critical user flows

**Nutrition Calculation Correctness:**
- What's not tested: Edge cases for ingredient-based nutrition (fractional quantities, unit conversions)
- Files: `src/utils/nutrition.utils.ts` has tests but missing edge cases
- Risk: Nutrition values may be slightly off (e.g., 1.5 bananas × 90kcal = rounding errors)
- Priority: High - affects core app functionality

**Error Boundary Coverage:**
- What's not tested: ErrorBoundary component doesn't have tests; retry behavior not verified
- Files: `src/components/shared/ErrorBoundary.tsx` (no tests)
- Risk: Errors during component render cause blank pages; hard to debug
- Priority: Medium - good to have for reliability

**API Failure Scenarios:**
- What's not tested:
  - Gemini API timeout (15 second cutoff)
  - OpenFoodFacts API 404/500 responses
  - Firebase Firestore transaction failures
- Files: Service layer tests are minimal
- Risk: App silently fails without user feedback; unhandled promise rejections
- Priority: Medium - affects reliability

**Mobile Responsiveness:**
- What's not tested: Playwright tests don't verify mobile layouts; only desktop browser used
- Files: All `.tsx` files with responsive classes (sm:, md: prefixes)
- Risk: Mobile experience may be broken; untested on actual phones
- Priority: High - given ongoing UI/UX redesign in feature/ui-ux-refactoring branch

---

*Concerns audit: 2026-03-12*
