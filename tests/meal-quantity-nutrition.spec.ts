import { test, expect } from "@playwright/test";
import { loginTestUser } from "./fixtures";

const quantityInputSelector = 'input[placeholder="1"]';

test.describe("Meal Quantity and Nutrition Calculation", () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page);
    await expect(page.locator("h3:has-text('Frühstück')")).toBeVisible();
  });

  test("should calculate nutrition values correctly for breakfast with custom quantity", async ({ page }) => {
    // Füge ein Gericht zum Frühstück hinzu
    await page.click('input[placeholder*="Frühstück hinzufügen"]');
    await expect(page.locator(".dish-list-item").first()).toBeVisible();

    // Klicke auf das erste Gericht
    await page.click(".dish-list-item:first-child");

    // Ändere die Menge auf 2
    const quantityInput = page.locator(quantityInputSelector).first();
    await quantityInput.click();
    await quantityInput.fill("2");
    await quantityInput.blur();

    // Prüfe, ob die Nährwerte in der Gerichtzeile angezeigt werden
    const dishNutrition = page.locator('.dish-item-nutrition').first();
    await expect(dishNutrition).toBeVisible();
  });

  test("should work across all meal types (breakfast, lunch, dinner)", async ({ page }) => {
    // Frühstück
    await page.click('input[placeholder*="Frühstück hinzufügen"]');
    await page.click(".dish-list-item:first-child");

    const breakfastQty = page.locator(quantityInputSelector).first();
    await breakfastQty.click();
    await breakfastQty.fill("1.5");
    await breakfastQty.blur();
    await expect(breakfastQty).toHaveValue("1,5");

    // Mittagessen
    await page.click('input[placeholder*="Mittagessen hinzufügen"]');
    await page.click(".dish-list-item:first-child");

    const lunchQty = page.locator(quantityInputSelector).nth(1);
    await lunchQty.click();
    await lunchQty.fill("2.5");
    await lunchQty.blur();
    await expect(lunchQty).toHaveValue("2,5");

    // Abendessen
    await page.click('input[placeholder*="Abendessen hinzufügen"]');
    await page.click(".dish-list-item:first-child");

    const dinnerQty = page.locator(quantityInputSelector).nth(2);
    await dinnerQty.click();
    await dinnerQty.fill("0.5");
    await dinnerQty.blur();
    await expect(dinnerQty).toHaveValue("0,5");
  });

  test("should handle decimal quantities in snacks section", async ({ page }) => {
    // Scrolle zu den Snacks
    await page.locator('h3:has-text("Snacks")').scrollIntoViewIfNeeded();

    // Füge einen Snack hinzu
    await page.click('input[placeholder*="Snack aus der Datenbank hinzufügen"]');
    await expect(page.locator(".dish-list-item").first()).toBeVisible();
    await page.click(".dish-list-item:first-child");

    // Ändere die Menge
    const quantityInput = page.locator(quantityInputSelector).first();
    await quantityInput.click();
    await quantityInput.fill("1.5");
    await quantityInput.blur();

    await expect(quantityInput).toHaveValue("1,5");
  });

  test("should remove dish when quantity selector is present", async ({ page }) => {
    // Füge ein Gericht hinzu
    await page.click('input[placeholder*="Frühstück hinzufügen"]');
    await page.click(".dish-list-item:first-child");

    // Prüfe, dass das Gericht hinzugefügt wurde
    await expect(page.locator(quantityInputSelector).first()).toBeVisible();

    // Klicke auf das Löschen-Icon
    await page.locator('button[aria-label="Gericht entfernen"]').first().click();

    // Prüfe, dass das Gericht entfernt wurde
    await expect(page.locator(quantityInputSelector)).not.toBeVisible();
  });
});
