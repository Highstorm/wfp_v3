import { Page, expect } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

export const TEST_USER = {
  email: process.env.E2E_TEST_USER_EMAIL!,
  password: process.env.E2E_TEST_USER_PASSWORD!,
  name: process.env.E2E_TEST_USER_NAME || "Test User",
};

/**
 * Login the test user and wait for navigation to /day-planning.
 */
export async function loginTestUser(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button:has-text("Anmelden")');
  await expect(page).toHaveURL("/day-planning", { timeout: 10000 });
}
