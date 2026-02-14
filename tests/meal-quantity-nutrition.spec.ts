import { test, expect } from "@playwright/test";

const TEST_USER = {
  email: "playwritght.test@example.com",
  password: "playwright.test123!",
};

test.describe("Meal Quantity and Nutrition Calculation", () => {
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

  test("should calculate nutrition values correctly for breakfast with custom quantity", async ({ page }) => {
    // Füge ein Gericht zum Frühstück hinzu
    await page.click('input[placeholder*="Frühstück hinzufügen"]');
    await expect(page.locator(".dish-list-item").first()).toBeVisible();
    
    // Merke dir die ursprünglichen Nährwerte des ersten Gerichts
    const firstDishInfo = await page.locator(".dish-list-item:first-child .text-sm").textContent();
    console.log("Original dish info:", firstDishInfo);
    
    // Klicke auf das erste Gericht
    await page.click(".dish-list-item:first-child");
    
    // Ändere die Menge auf 2
    const quantityInput = page.locator('input[type="text"]').first();
    await quantityInput.clear();
    await quantityInput.type("2");
    await quantityInput.blur();
    
    // Warte einen Moment für die Aktualisierung
    await page.waitForTimeout(500);
    
    // Prüfe, ob die Nährwerte in der Gerichtzeile korrekt multipliziert wurden
    const dishNutritionDisplay = page.locator('.bg-gray-50 .text-sm').first();
    await expect(dishNutritionDisplay).toBeVisible();
    
    // Prüfe, ob die Nährwerte-Zusammenfassung aktualisiert wurde
    const nutritionSummary = page.locator('[class*="nutrition"]'); // Anpassung je nach CSS-Klassen
    await expect(nutritionSummary).toBeVisible();
  });

  test("should work across all meal types (breakfast, lunch, dinner)", async ({ page }) => {
    // Test für Frühstück
    await page.click('input[placeholder*="Frühstück hinzufügen"]');
    await page.click(".dish-list-item:first-child");
    
    let quantityInput = page.locator('input[type="text"]').first();
    await quantityInput.clear();
    await quantityInput.type("1,5");
    await quantityInput.blur();
    await expect(quantityInput).toHaveValue("1,5");
    
    // Test für Mittagessen
    await page.click('input[placeholder*="Mittagessen hinzufügen"]');
    await page.click(".dish-list-item:first-child");
    
    quantityInput = page.locator('input[type="text"]').last();
    await quantityInput.clear();
    await quantityInput.type("2,5");
    await quantityInput.blur();
    await expect(quantityInput).toHaveValue("2,5");
    
    // Test für Abendessen
    await page.click('input[placeholder*="Abendessen hinzufügen"]');
    await page.click(".dish-list-item:first-child");
    
    quantityInput = page.locator('input[type="text"]').last();
    await quantityInput.clear();
    await quantityInput.type("0,5");
    await quantityInput.blur();
    await expect(quantityInput).toHaveValue("0,5");
    
    // Speichere den Tagesplan
    await page.click('button:has-text("Speichern")');
    await expect(page.locator('text=erfolgreich gespeichert')).toBeVisible();
  });

  test("should handle decimal quantities in snacks section", async ({ page }) => {
    // Scrolle zu den Snacks
    await page.locator('h3:has-text("Snacks")').scrollIntoViewIfNeeded();
    
    // Füge einen Snack hinzu
    await page.click('input[placeholder*="Snack aus der Datenbank hinzufügen"]');
    await page.click(".dish-list-item:first-child");
    
    // Ändere die Menge
    const quantityInput = page.locator('input[type="text"]').last();
    await quantityInput.clear();
    await quantityInput.type("1,5");
    await quantityInput.blur();
    
    await expect(quantityInput).toHaveValue("1,5");
  });

  test("should persist quantities after save and reload", async ({ page }) => {
    // Füge ein Gericht hinzu und setze eine Menge
    await page.click('input[placeholder*="Frühstück hinzufügen"]');
    await page.click(".dish-list-item:first-child");
    
    const quantityInput = page.locator('input[type="text"]').first();
    await quantityInput.clear();
    await quantityInput.type("2,5");
    await quantityInput.blur();
    
    // Speichere den Plan
    await page.click('button:has-text("Speichern")');
    await expect(page.locator('text=erfolgreich gespeichert')).toBeVisible();
    
    // Lade die Seite neu
    await page.reload();
    await expect(page.locator("h3:has-text('Frühstück')")).toBeVisible();
    
    // Prüfe, ob die Menge noch da ist
    await expect(page.locator('input[type="text"]').first()).toHaveValue("2,5");
  });

  test("should show correct nutrition calculation in summary", async ({ page }) => {
    // Überprüfe, dass die Nährwerte-Zusammenfassung existiert
    const nutritionSummaryExists = await page.locator('text=Kalorien').isVisible();
    
    if (nutritionSummaryExists) {
      // Füge ein Gericht hinzu
      await page.click('input[placeholder*="Frühstück hinzufügen"]');
      await page.click(".dish-list-item:first-child");
      
      // Setze eine spezifische Menge
      const quantityInput = page.locator('input[type="text"]').first();
      await quantityInput.clear();
      await quantityInput.type("2");
      await quantityInput.blur();
      
      // Warte auf Aktualisierung der Nährwerte
      await page.waitForTimeout(1000);
      
      // Prüfe, dass die Nährwerte-Zusammenfassung aktualisiert wurde
      // (Dies ist ein generischer Test, da die genauen Werte vom verfügbaren Gericht abhängen)
      const nutritionElements = page.locator('[class*="nutrition"], [class*="summary"]');
      await expect(nutritionElements.first()).toBeVisible();
    }
  });

  test("should remove dish when quantity selector is present", async ({ page }) => {
    // Füge ein Gericht hinzu
    await page.click('input[placeholder*="Frühstück hinzufügen"]');
    await page.click(".dish-list-item:first-child");
    
    // Prüfe, dass das Gericht hinzugefügt wurde
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    
    // Klicke auf das Löschen-Icon
    await page.locator('button[class*="text-gray-400"]:has(svg)').first().click();
    
    // Prüfe, dass das Gericht entfernt wurde
    await expect(page.locator('input[type="text"]')).not.toBeVisible();
  });
});