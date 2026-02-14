import { test, expect } from "@playwright/test";
import { TEST_USER } from "./fixtures";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should redirect to login page when not authenticated", async ({
    page,
  }) => {
    await expect(page).toHaveURL("/login");
  });

  test("should show error message with invalid credentials", async ({
    page,
  }) => {
    await page.fill('input[type="email"]', "invalid@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button:has-text("Anmelden")');

    await expect(
      page.locator("text=E-Mail oder Passwort ist falsch")
    ).toBeVisible();
  });

  test("should navigate to register page", async ({ page }) => {
    await page.click("text=Jetzt registrieren");
    await expect(page).toHaveURL("/register");
  });

  test("should show error for existing email during registration", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.fill('input[id="name"]', TEST_USER.name);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);

    await page.click('button:has-text("Account erstellen")');

    await expect(page.locator("text=Diese E-Mail-Adresse wird bereits verwendet.")).toBeVisible({ timeout: 10000 });
  });

  test("should successfully login and logout", async ({ page }) => {
    // Login with the test user
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button:has-text("Anmelden")');

    // After redesign we land on /day-planning by default
    await expect(page).toHaveURL("/day-planning", { timeout: 10000 });
    await expect(page.locator("text=Weekly Food Planner")).toBeVisible();

    // Logout via menu toggle
    await page.click('button#menu-button, button[aria-label="Menü öffnen"]');
    await page.click('button:has-text("Abmelden")');
    await expect(page).toHaveURL("/login");
  });

  test("should successfully register new user", async ({ page }) => {
    const randomEmail = `test${Math.random()
      .toString(36)
      .substring(7)}@example.com`;

    await page.goto("/register");
    await page.fill('input[id="name"]', "New Test User");
    await page.fill('input[type="email"]', randomEmail);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button:has-text("Account erstellen")');

    await expect(page).toHaveURL("/day-planning", { timeout: 10000 });
    await expect(page.locator("text=Weekly Food Planner")).toBeVisible();
  });
});
