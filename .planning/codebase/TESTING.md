# Testing Patterns

**Analysis Date:** 2026-03-12

## Test Framework

**Runner:**
- Playwright (E2E) - version `^1.49.1` defined in package.json
- Vitest (Unit) - version `^4.0.18` for running TypeScript tests
- Config: `tests/` directory for Playwright E2E tests, `src/**/*.{test,spec}.{ts,tsx}` for unit tests

**Assertion Library:**
- Playwright's built-in assertions (via `expect` from `@playwright/test`)
- No separate assertion library found; using Playwright's `expect()` API

**Run Commands:**
```bash
npm run test:e2e              # Run Playwright E2E tests
npm run test:e2e:ui          # Run with Playwright UI mode
npm run test:e2e:debug       # Run with debug mode
npm run test:unit            # Run Vitest unit tests once
npm run test:unit:watch      # Run Vitest in watch mode with hot reload
```

## Test File Organization

**Location:**
- E2E tests: `tests/` directory at project root (separate from src)
- Unit tests: `src/**/__tests__/` directories (co-located with source)
- Vitest configured to find: `src/**/*.{test,spec}.{ts,tsx}`

**Naming:**
- Test files: `.spec.ts` suffix (e.g., `QuantitySelector.spec.ts`, `meal-quantity-nutrition.spec.ts`)
- Fixture files: `fixtures.ts` for shared test utilities

**Structure:**
```
tests/
├── fixtures.ts           # Shared test data, helpers, login function
├── auth.spec.ts
├── gemini-ai-snack.spec.ts
├── gemini-ai-dish-creation.spec.ts
├── QuantitySelector.spec.ts
└── meal-quantity-nutrition.spec.ts

src/
└── utils/
    └── __tests__/        # Unit test location (if used)
```

## Test Structure

**Suite Organization:**
Tests use `test.describe()` blocks to organize related tests:

```typescript
test.describe("QuantitySelector Component", () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page);
    await expect(page.locator("h3:has-text('Frühstück')")).toBeVisible();
  });

  test("should display default quantity of 1", async ({ page }) => {
    // test implementation
  });

  test("should increase quantity with + button", async ({ page }) => {
    // test implementation
  });
});
```

**Patterns:**

1. **Setup Pattern:** Use `test.beforeEach()` for common setup (login, navigation)
2. **Teardown Pattern:** Implicit cleanup via Playwright (no explicit teardown observed)
3. **Assertion Pattern:** Playwright's `expect()` with chain assertions

**Common Playwright Assertions:**
```typescript
await expect(page.locator("selector")).toBeVisible();
await expect(page.locator("selector")).toHaveValue("expected");
await expect(page.locator("selector")).toHaveURL("/path");
await expect(page.locator("selector")).not.toBeVisible();
```

## Mocking

**Framework:** None detected for E2E tests (uses real browser and application)

**Patterns for Test Data:**
Fixtures file provides test user credentials and login helper:

```typescript
// From tests/fixtures.ts
export const TEST_USER = {
  email: process.env.E2E_TEST_USER_EMAIL!,
  password: process.env.E2E_TEST_USER_PASSWORD!,
  name: process.env.E2E_TEST_USER_NAME || "Test User",
};

export async function loginTestUser(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button:has-text("Anmelden")');
  await expect(page).toHaveURL("/day-planning", { timeout: 10000 });
}
```

**What to Mock:**
- E2E tests do not mock APIs; they test against live/test Firebase backend
- Test credentials loaded from `.env.test` file

**What NOT to Mock:**
- Don't mock Firebase authentication (test with real credentials)
- Don't mock DOM elements; use Playwright locators to interact with real DOM
- Don't mock navigation; test real routing via `page.goto()` and `page.click()`

## Fixtures and Factories

**Test Data:**
Centralized in `tests/fixtures.ts`:

```typescript
import { Page, expect } from "@playwright/test";
import dotenv from "dotenv";

export const TEST_USER = {
  email: process.env.E2E_TEST_USER_EMAIL!,
  password: process.env.E2E_TEST_USER_PASSWORD!,
  name: process.env.E2E_TEST_USER_NAME || "Test User",
};
```

**Fixture Functions:**
- `loginTestUser(page)`: Reusable login helper that navigates, fills credentials, clicks login, waits for navigation
- Used in `test.beforeEach()` to set up authenticated context

**Location:**
- `tests/fixtures.ts` for E2E test utilities
- No factory pattern observed; fixtures are minimal and environment-dependent

## Coverage

**Requirements:** None enforced

**View Coverage:**
No coverage command defined in package.json; no coverage collection configured in vitest or Playwright.

**Current State:**
- Unit tests: Minimal (few test files in tests/ directory)
- E2E tests: Focused on user workflows (meal planning, quantity selection, nutrition calculations)
- Coverage: Gaps in critical utility functions and repositories

## Test Types

**Unit Tests:**
- Scope: Individual functions (utilities, calculations)
- Approach: Vitest for synchronous testing of pure functions
- Location: `src/**/*.spec.ts` (if present)
- Not heavily used in this codebase (no unit test files found in src/)

**Integration Tests:**
- Scope: Features involving multiple components and state (meals, dishes, nutrition)
- Not explicitly separated; E2E tests serve dual purpose
- Example: `meal-quantity-nutrition.spec.ts` tests quantity changes affecting displayed nutrition

**E2E Tests:**
- Framework: Playwright
- Scope: Full user workflows from login to meal planning actions
- Approach: Browser automation against deployed/running app
- Test environment: Live Firebase backend with test user credentials
- Base URL: `http://localhost:5173` (configured in `playwright.config.ts`)
- Timeout: 30 seconds per test, 2 retries in CI

## E2E Test Configuration

**File:** `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  timeout: 30000,
});
```

**Key Settings:**
- Parallel execution enabled (`fullyParallel: true`) for speed
- Three browser projects: Chromium, Firefox, WebKit for cross-browser validation
- Web server auto-starts with `npm run dev` if not already running
- Trace collection on first retry for debugging failures
- HTML reporter for visual test results

## Vitest Configuration

**File:** `vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
```

**Key Settings:**
- Environment: Node (not jsdom, suitable for utility/logic testing)
- Global test APIs: `describe`, `test`, `expect` available without imports
- Include pattern: Finds all test files in src/ with `.test.ts` or `.spec.ts`

## Common E2E Test Patterns

### Login Pattern
All authenticated tests start with login:
```typescript
test.describe("Feature requiring auth", () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page);
    await expect(page.locator("h3:has-text('Frühstück')")).toBeVisible();
  });
});
```

### Interaction Pattern
Typical flow: click input → wait for list → click item → verify state change:
```typescript
test("should increase quantity", async ({ page }) => {
  await page.click('input[placeholder*="Frühstück hinzufügen"]');
  await page.click(".dish-list-item:first-child");
  await page.click('button:has-text("+")');
  await expect(page.locator(quantityInputSelector)).toHaveValue("2");
});
```

### Selector Pattern
Strong reliance on semantic selectors:
- Placeholder text: `'input[placeholder*="Frühstück hinzufügen"]'`
- Button text: `'button:has-text("Anmelden")'`
- Heading text: `"h3:has-text('Frühstück')"`
- Custom data attributes: `.dish-list-item`, `.dish-item-nutrition`
- ARIA labels: `'button[aria-label="Gericht entfernen"]'`

### Decimal Input Pattern
Tests validate comma/dot input normalization:
```typescript
test("should accept decimal input with comma", async ({ page }) => {
  const quantityInput = page.locator(quantityInputSelector);
  await quantityInput.fill("2,5");
  await quantityInput.blur();
  await expect(quantityInput).toHaveValue("2,5");
});
```

## Test Examples

### From tests/QuantitySelector.spec.ts
Tests component behaviors in isolation:
- Default quantity display
- Increment/decrement buttons
- Decimal input with comma/dot support
- Minimum value enforcement
- Invalid input handling

### From tests/meal-quantity-nutrition.spec.ts
Tests cross-component integration:
- Adding meals to different meal sections
- Quantity changes reflected in UI
- Decimal quantities across multiple meal types
- Removal of dishes with quantity selectors

### From tests/auth.spec.ts
Tests authentication flow (not shown but implied):
- Login with valid credentials
- Registration workflow
- Session persistence

## Test Execution

**Local Development:**
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests
npm run test:e2e        # Run all E2E tests
npm run test:e2e:ui     # Playwright UI for debugging
```

**CI Environment:**
- Retries: 2 attempts per test
- Workers: 1 (serial execution for stability)
- Auto-retry on failure with trace collection
- HTML report generated for review

## Test Data Management

**Environment Variables:**
Test credentials stored in `.env.test`:
- `E2E_TEST_USER_EMAIL`: Email of test Firebase account
- `E2E_TEST_USER_PASSWORD`: Password of test account
- `E2E_TEST_USER_NAME`: Display name (default: "Test User")

Loaded at test startup via `dotenv.config()` in `tests/fixtures.ts`.

## Known Gaps

**Unit Testing:**
- No unit tests for utility functions (nutrition calculations, share-code generation)
- No tests for repositories (dish.repository, mealplan.repository)
- Limited hook testing

**E2E Coverage:**
- Missing tests for error states (invalid input, network failures)
- No test for AI/Gemini nutrition scanning feature completeness
- Limited dark mode testing
- No accessibility (a11y) testing beyond semantic selectors

**Performance Testing:**
- No performance/load tests
- No visual regression testing

---

*Testing analysis: 2026-03-12*
