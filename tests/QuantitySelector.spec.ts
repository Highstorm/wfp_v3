import { test, expect } from "@playwright/test";

const TEST_USER = {
  email: "playwritght.test@example.com",
  password: "playwright.test123!",
};

test.describe("QuantitySelector Component", () => {
  test.beforeEach(async ({ page }) => {
    // Login vor jedem Test
    await page.goto("/login");
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button:has-text("Anmelden")');
    await expect(page).toHaveURL("/day-planning");
    
    // Gehe zur Tagesplanung
    await page.click('text=Tagesplanung');
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
    await expect(page.locator('input[type="text"]').first()).toHaveValue("1");
  });

  test("should increase quantity with + button", async ({ page }) => {
    // Füge ein Gericht hinzu
    await page.click('input[placeholder*="Frühstück hinzufügen"]');
    await page.click(".dish-list-item:first-child");
    
    // Klicke auf den Plus-Button
    await page.click('button:has-text("+")');
    
    // Prüfe, ob die Menge auf 1,5 erhöht wurde
    await expect(page.locator('input[type="text"]').first()).toHaveValue("1,5");
  });

  test("should decrease quantity with - button", async ({ page }) => {
    // Füge ein Gericht hinzu
    await page.click('input[placeholder*="Frühstück hinzufügen"]');
    await page.click(".dish-list-item:first-child");
    
    // Erhöhe zuerst die Menge
    await page.click('button:has-text("+")'); // sollte jetzt 1,5 sein
    await page.click('button:has-text("+")'); // sollte jetzt 2 sein
    
    // Klicke auf den Minus-Button
    await page.click('button:has-text("-")');
    
    // Prüfe, ob die Menge auf 1,5 verringert wurde
    await expect(page.locator('input[type="text"]').first()).toHaveValue("1,5");
  });

  test("should accept decimal input with comma", async ({ page }) => {
    // Füge ein Gericht hinzu
    await page.click('input[placeholder*="Frühstück hinzufügen"]');
    await page.click(".dish-list-item:first-child");
    
    // Gib eine Dezimalzahl mit Komma ein
    const quantityInput = page.locator('input[type="text"]').first();
    await quantityInput.clear();
    await quantityInput.type("2,5");
    await quantityInput.blur();
    
    // Prüfe, ob der Wert korrekt angezeigt wird
    await expect(quantityInput).toHaveValue("2,5");
  });

  test("should accept decimal input with dot", async ({ page }) => {
    // Füge ein Gericht hinzu
    await page.click('input[placeholder*="Frühstück hinzufügen"]');
    await page.click(".dish-list-item:first-child");
    
    // Gib eine Dezimalzahl mit Punkt ein
    const quantityInput = page.locator('input[type="text"]').first();
    await quantityInput.clear();
    await quantityInput.type("3.5");
    await quantityInput.blur();
    
    // Prüfe, ob der Wert korrekt als Komma angezeigt wird
    await expect(quantityInput).toHaveValue("3,5");
  });

  test("should not allow values below minimum", async ({ page }) => {
    // Füge ein Gericht hinzu
    await page.click('input[placeholder*="Frühstück hinzufügen"]');
    await page.click(".dish-list-item:first-child");
    
    // Versuche eine Menge unter dem Minimum einzugeben
    const quantityInput = page.locator('input[type="text"]').first();
    await quantityInput.clear();
    await quantityInput.type("0.2");
    await quantityInput.blur();
    
    // Prüfe, ob der Wert auf das Minimum (0.5) zurückgesetzt wurde
    await expect(quantityInput).toHaveValue("0,5");
  });

  test("should reset invalid input to minimum", async ({ page }) => {
    // Füge ein Gericht hinzu
    await page.click('input[placeholder*="Frühstück hinzufügen"]');
    await page.click(".dish-list-item:first-child");
    
    // Gib einen ungültigen Wert ein
    const quantityInput = page.locator('input[type="text"]').first();
    await quantityInput.clear();
    await quantityInput.type("abc");
    await quantityInput.blur();
    
    // Prüfe, ob der Wert auf das Minimum zurückgesetzt wurde
    await expect(quantityInput).toHaveValue("0,5");
  });

  test("should show whole numbers without decimal places", async ({ page }) => {
    // Füge ein Gericht hinzu
    await page.click('input[placeholder*="Frühstück hinzufügen"]');
    await page.click(".dish-list-item:first-child");
    
    // Gib eine ganze Zahl ein
    const quantityInput = page.locator('input[type="text"]').first();
    await quantityInput.clear();
    await quantityInput.type("3");
    await quantityInput.blur();
    
    // Prüfe, ob die ganze Zahl ohne .0 angezeigt wird
    await expect(quantityInput).toHaveValue("3");
  });
});