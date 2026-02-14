import { test, expect } from "@playwright/test";
import { loginTestUser } from "./fixtures";

test.describe("Gemini AI - Snack hinzufügen", () => {
  // Diese Tests benötigen eine funktionierende Gemini AI API.
  // Überspringe sie, wenn E2E_SKIP_AI_TESTS gesetzt ist.
  test.skip(!!process.env.E2E_SKIP_AI_TESTS, "AI tests disabled via E2E_SKIP_AI_TESTS");

  test.beforeEach(async ({ page }) => {
    await loginTestUser(page);
    await expect(page.locator("h3:has-text('Frühstück')")).toBeVisible();
  });

  test("should add snack 'Koro Erdnussmus' via AI search", async ({ page }) => {
    // Scrolle zu den Snacks
    await page.locator('h3:has-text("Snacks")').scrollIntoViewIfNeeded();

    // Prüfe ob KI-Suche verfügbar ist (Button sollte sichtbar sein)
    const aiButton = page.locator('button[aria-label="KI-Suche"]').first();
    const isAIAvailable = await aiButton.isVisible().catch(() => false);

    if (!isAIAvailable) {
      test.skip();
      return;
    }

    // Klicke auf das Snack-Suchfeld
    const snackInput = page.locator('input[placeholder*="Snack aus der Datenbank hinzufügen"]');
    await snackInput.click();

    // Tippe "Koro Erdnussmus" ein
    await snackInput.fill("Koro Erdnussmus");

    // Warte kurz, damit die debounced Suche startet
    await page.waitForTimeout(600);

    // Klicke auf den KI-Suche Button
    await aiButton.click();

    // Warte auf AI-Suche (kann 2-5 Sekunden dauern)
    await page.waitForTimeout(3000);

    // Prüfe ob AI-Ergebnis angezeigt wird
    const aiResult = page.locator('.dish-list-item').filter({ hasText: /Erdnussmus|Erdnuss/i }).first();
    await expect(aiResult).toBeVisible({ timeout: 10000 });

    // Klicke auf das AI-Ergebnis, um es hinzuzufügen
    await aiResult.click();

    // Prüfe ob der Snack zur Liste hinzugefügt wurde
    await expect(page.locator('text=Erdnussmus').first()).toBeVisible({ timeout: 5000 });

    // Prüfe ob Nährwerte angezeigt werden
    const nutritionInfo = page.locator('.text-sm').filter({ hasText: /kcal|Kalorien/i }).first();
    await expect(nutritionInfo).toBeVisible({ timeout: 3000 });
  });

  test("should handle invalid query for AI search", async ({ page }) => {
    // Scrolle zu den Snacks
    await page.locator('h3:has-text("Snacks")').scrollIntoViewIfNeeded();

    // Prüfe ob KI-Suche verfügbar ist
    const aiButton = page.locator('button[aria-label="KI-Suche"]').first();
    const isAIAvailable = await aiButton.isVisible().catch(() => false);

    if (!isAIAvailable) {
      test.skip();
      return;
    }

    // Klicke auf das Snack-Suchfeld
    const snackInput = page.locator('input[placeholder*="Snack aus der Datenbank hinzufügen"]');
    await snackInput.click();

    // Tippe eine zu kurze Query ein (weniger als 3 Zeichen)
    await snackInput.fill("ab");

    // Warte kurz
    await page.waitForTimeout(600);

    // Prüfe ob KI-Button deaktiviert ist (zu kurze Query)
    await expect(aiButton).toBeDisabled();
  });

  test("should show loading state during AI search", async ({ page }) => {
    // Scrolle zu den Snacks
    await page.locator('h3:has-text("Snacks")').scrollIntoViewIfNeeded();

    // Prüfe ob KI-Suche verfügbar ist
    const aiButton = page.locator('button[aria-label="KI-Suche"]').first();
    const isAIAvailable = await aiButton.isVisible().catch(() => false);

    if (!isAIAvailable) {
      test.skip();
      return;
    }

    // Klicke auf das Snack-Suchfeld
    const snackInput = page.locator('input[placeholder*="Snack aus der Datenbank hinzufügen"]');
    await snackInput.click();

    // Tippe eine gültige Query ein
    await snackInput.fill("Koro Erdnussmus");

    // Warte kurz
    await page.waitForTimeout(600);

    // Klicke auf den KI-Suche Button
    await aiButton.click();

    // Prüfe ob Loading-Spinner angezeigt wird
    const loadingSpinner = page.locator('svg.animate-spin').first();
    await expect(loadingSpinner).toBeVisible({ timeout: 2000 });
  });
});
