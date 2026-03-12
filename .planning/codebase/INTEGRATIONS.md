# External Integrations

**Analysis Date:** 2026-03-12

## APIs & External Services

**Food Data:**
- OpenFoodFacts Search-a-licious API - Product and nutrition data lookup
  - SDK/Client: Custom HTTP fetch wrapper in `src/services/openfoodfacts.service.ts`
  - Endpoint: `https://search.openfoodfacts.org/search`
  - Proxy in dev: `/api/openfoodfacts` configured in `vite.config.ts`
  - Note: Production uses direct browser request (CORS dependency)
  - Mobile limitation: Search may fail on mobile due to CORS, falls back to AI search

**AI/ML:**
- Google Gemini API (via Firebase AI) - Nutrition data extraction and food search
  - SDK/Client: Firebase AI module (`firebase/ai`)
  - Model: `gemini-2.5-flash`
  - Service: `src/services/gemini.service.ts`
  - Auth: Via Firebase authentication (included in `VITE_FIREBASE_APP_ID`)
  - Capabilities:
    - `searchNutritionWithAI()` - Search for nutrition data by text query
    - `analyzeNutritionLabelWithAI()` - Extract nutrition from label images (base64 encoded)
  - Timeout: 15 seconds per request
  - Thinking budget: 0 (disabled)

## Data Storage

**Primary Database:**
- Firestore (Firebase) - Document database
  - Connection: Via Firebase initialization in `src/lib/firebase.ts`
  - Client: Firebase SDK (`firebase/firestore`)
  - Collections: Inferred from repositories:
    - Users/Profiles: `src/repositories/profile.repository.ts`
    - Dishes: `src/repositories/dish.repository.ts`
    - Meal Plans: `src/repositories/mealplan.repository.ts`
    - Weekly Goals: `src/repositories/weekly-goals.repository.ts`
    - Shared Dishes: `src/repositories/shared-dish.repository.ts`

**File Storage:**
- Browser local storage only (no persistent file storage backend)
- Image data passed to Gemini as base64 in requests

**Caching:**
- Client-side only via TanStack React Query
  - Stale time: 5 minutes
  - GC time: 30 minutes
  - Config: `src/main.tsx`

## Authentication & Identity

**Auth Provider:**
- Firebase Authentication
  - Implementation: Email/password authentication
  - Modules: `firebase/auth`
  - Entry points:
    - Login: `src/components/auth/LoginForm.tsx` → `signInWithEmailAndPassword()`
    - Register: `src/components/auth/RegisterForm.tsx` → `createUserWithEmailAndPassword()`
  - Auth state management: Used in repositories and components
  - Protected routes: `src/components/auth/AuthRedirect.tsx`

## Monitoring & Observability

**Error Tracking:**
- Custom logger in `src/utils/logger.ts`
- No third-party error tracking service detected

**Logs:**
- Console-based logging with structured format
- Logger used in: OpenFoodFacts service, Gemini service, Firebase initialization

## CI/CD & Deployment

**Hosting:**
- Not detected in codebase - likely external deployment platform

**CI Pipeline:**
- Playwright E2E tests configured with CI detection via `process.env.CI`
- Test retries: 2 in CI, 0 in local
- Worker threads: 1 in CI (parallel), multiple local
- Base URL: `http://localhost:5173` (dev server)

**Build Artifact:**
- Vite produces static bundle: `dist/`
- Output includes chunk splits for vendors

## Environment Configuration

**Required env vars:**
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID

**Optional env vars:**
- `VITE_GEMINI_API_KEY` - Explicit Gemini API key (optional, may use Firebase defaults)

**Secrets location:**
- `.env` file (Git-ignored, `.gitignore` applied)
- Example template: `.env.example`

## Webhooks & Callbacks

**Incoming:**
- Shared dish import via share code: `src/App.tsx` route `/shared-dish/:shareCode`
  - Component: `ImportDishPage.tsx`
  - Not a webhook, but URL-based share pattern

**Outgoing:**
- None detected

## Cross-Service Data Flow

**Nutrition Search Flow:**
1. User searches for food in `CreateDishWithIngredients.tsx` or `EditDishWithIngredients.tsx`
2. Query sent to `searchProducts()` in `openfoodfacts.service.ts`
3. If OpenFoodFacts fails or returns no results, fallback to `searchNutritionWithAI()` in `gemini.service.ts`
4. Results converted to `SearchableProduct` type
5. User selection converted to `DishIngredient` via `productToIngredient()`

**Label Scan Flow:**
1. User captures image in component
2. Image converted to base64
3. Sent to `analyzeNutritionLabelWithAI()` with MIME type
4. Gemini extracts nutrition values and returns JSON
5. Parsed and converted to ingredient/product format

**Meal Planning Data Flow:**
1. Components fetch/update via repositories
2. Repositories use `db` (Firestore) and `auth` from `src/lib/firebase.ts`
3. TanStack Query caches results in memory
4. State persisted to Firestore for all users

---

*Integration audit: 2026-03-12*
