import { test, expect } from "@playwright/test";
import { loginTestUser } from "./fixtures";

// Selector for the QuantitySelector input (has placeholder="1" and is centered)
const quantityInputSelector = 'input[placeholder="1"]';

test.describe("QuantitySelector Component", () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page);
    await expect(page.locator("h3:has-text('Frühstück')")).toBeVisible();
  });

  test("should display default quantity of 1", async ({ page }) => {
    // Füge ein Gericht zu einer Mahlzeit hinzu um den QuantitySelector zu sehen
    await page.click('input[placeholder*="Frühstück hinzufügen"]');

    // Warte darauf, dass die Gerichtsliste erscheint
    await expect(page.locator(".dish-list-item").first()).toBeVisible();

    // Klicke auf das erste Gericht
    await page.click(".dish-list-item:first-child");

    // Prüfe, ob der QuantitySelector mit dem Standardwert 1 angezeigt wird
    await expect(page.locator(quantityInputSelector).first()).toHaveValue("1");
  });

  test("should increase quantity with + button", async ({ page }) => {
    await page.click('input[placeholder*="Frühstück hinzufügen"]');
    await page.click(".dish-list-item:first-child");

    // Klicke auf den Plus-Button (step=1, also 1 → 2)
    await page.click('button:has-text("+")');

    await expect(page.locator(quantityInputSelector).first()).toHaveValue("2");
  });

  test("should decrease quantity with - button", async ({ page }) => {
    await page.click('input[placeholder*="Frühstück hinzufügen"]');
    await page.click(".dish-list-item:first-child");

    // Erhöhe zuerst (1 → 2 → 3)
    await page.click('button:has-text("+")');
    await page.click('button:has-text("+")');

    // Klicke auf den Minus-Button (3 → 2)
    await page.click('button:has-text("-")');

    await expect(page.locator(quantityInputSelector).first()).toHaveValue("2");
  });

  test("should accept decimal input with comma", async ({ page }) => {
    await page.click('input[placeholder*="Frühstück hinzufügen"]');
    await page.click(".dish-list-item:first-child");

    // Gib eine Dezimalzahl mit Komma ein
    const quantityInput = page.locator(quantityInputSelector).first();
    await quantityInput.click();
    await quantityInput.fill("2,5");
    await quantityInput.blur();

    // formatDisplayValue zeigt Komma an
    await expect(quantityInput).toHaveValue("2,5");
  });

  test("should accept decimal input with dot", async ({ page }) => {
    await page.click('input[placeholder*="Frühstück hinzufügen"]');
    await page.click(".dish-list-item:first-child");

    // Gib eine Dezimalzahl mit Punkt ein
    const quantityInput = page.locator(quantityInputSelector).first();
    await quantityInput.click();
    await quantityInput.fill("3.5");
    await quantityInput.blur();

    // formatDisplayValue zeigt Komma an
    await expect(quantityInput).toHaveValue("3,5");
  });

  test("should not allow values below minimum", async ({ page }) => {
    await page.click('input[placeholder*="Frühstück hinzufügen"]');
    await page.click(".dish-list-item:first-child");

    // Versuche eine Menge unter dem Minimum (0.1) einzugeben
    const quantityInput = page.locator(quantityInputSelector).first();
    await quantityInput.click();
    await quantityInput.fill("0.05");
    await quantityInput.blur();

    // Unter min=0.1 → wird auf 1 zurückgesetzt (handleInputBlur Logik)
    await expect(quantityInput).toHaveValue("1");
  });

  test("should reset invalid input to default", async ({ page }) => {
    await page.click('input[placeholder*="Frühstück hinzufügen"]');
    await page.click(".dish-list-item:first-child");

    // Gib einen ungültigen Wert ein
    const quantityInput = page.locator(quantityInputSelector).first();
    await quantityInput.click();
    await quantityInput.fill("abc");
    await quantityInput.blur();

    // Ungültige Eingabe → wird auf 1 zurückgesetzt
    await expect(quantityInput).toHaveValue("1");
  });

  test("should show whole numbers without decimal places", async ({ page }) => {
    await page.click('input[placeholder*="Frühstück hinzufügen"]');
    await page.click(".dish-list-item:first-child");

    // Gib eine ganze Zahl ein
    const quantityInput = page.locator(quantityInputSelector).first();
    await quantityInput.click();
    await quantityInput.fill("3");
    await quantityInput.blur();

    // Ganze Zahl ohne .0
    await expect(quantityInput).toHaveValue("3");
  });
});
