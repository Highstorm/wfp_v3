import { test, expect } from "@playwright/test";

const TEST_USER = {
  email: "playwritght.test@example.com",
  password: "playwright.test123!",
};

test.describe("Gemini AI - Gericht erstellen (Porridge)", () => {
  test.beforeEach(async ({ page }) => {
    // Login vor jedem Test
    await page.goto("/login");
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button:has-text("Anmelden")');
    await expect(page).toHaveURL("/day-planning");
  });

  test("should create Porridge dish with AI ingredients", async ({ page }) => {
    // Navigiere zu "Gericht aus Zutaten erstellen"
    await page.goto("/dishes/create-with-ingredients");
    await expect(page.locator("h1:has-text('Gericht aus Zutaten erstellen')")).toBeVisible();
    
    // Prüfe ob KI-Suche verfügbar ist
    const aiButton = page.locator('button[aria-label="KI-Suche"]').first();
    const isAIAvailable = await aiButton.isVisible().catch(() => false);
    
    if (!isAIAvailable) {
      test.skip();
      return;
    }

    const searchInput = page.locator('input[id="search"]');
    
    // Füge "Wasser" hinzu
    await searchInput.click();
    await searchInput.fill("Wasser");
    await page.waitForTimeout(600);
    await aiButton.click();
    await page.waitForTimeout(3000);
    
    const waterResult = page.locator('.dish-list-item').filter({ hasText: /Wasser/i }).first();
    await expect(waterResult).toBeVisible({ timeout: 10000 });
    await waterResult.click();
    await page.waitForTimeout(500);
    
    // Füge "Haferflocken" hinzu
    await searchInput.click();
    await searchInput.fill("Haferflocken");
    await page.waitForTimeout(600);
    await aiButton.click();
    await page.waitForTimeout(3000);
    
    const haferflockenResult = page.locator('.dish-list-item').filter({ hasText: /Haferflocken/i }).first();
    await expect(haferflockenResult).toBeVisible({ timeout: 10000 });
    await haferflockenResult.click();
    await page.waitForTimeout(500);
    
    // Füge "Koro Erdnussmus" hinzu
    await searchInput.click();
    await searchInput.fill("Koro Erdnussmus");
    await page.waitForTimeout(600);
    await aiButton.click();
    await page.waitForTimeout(3000);
    
    const erdnussmusResult = page.locator('.dish-list-item').filter({ hasText: /Erdnussmus|Erdnuss/i }).first();
    await expect(erdnussmusResult).toBeVisible({ timeout: 10000 });
    await erdnussmusResult.click();
    await page.waitForTimeout(500);
    
    // Prüfe ob alle drei Zutaten hinzugefügt wurden
    await expect(page.locator('text=Wasser').first()).toBeVisible();
    await expect(page.locator('text=Haferflocken').first()).toBeVisible();
    await expect(page.locator('text=Erdnussmus').first()).toBeVisible();
    
    // Setze Gerichtsname
    const dishNameInput = page.locator('input[placeholder*="Gerichtsname"]').first();
    await dishNameInput.fill("Porridge");
    
    // Wähle Kategorie "Frühstück"
    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption("breakfast");
    
    // Prüfe ob Speichern-Button aktiviert ist
    const saveButton = page.locator('button[type="submit"]').first();
    await expect(saveButton).toBeEnabled();
    
    // Speichere Gericht
    await saveButton.click();
    
    // Prüfe ob Erfolgsmeldung angezeigt wird
    await expect(page.locator('text=erfolgreich erstellt').first()).toBeVisible({ timeout: 5000 });
    
    // Prüfe ob zur Gerichtsliste navigiert wurde
    await expect(page).toHaveURL("/dishes", { timeout: 5000 });
    
    // Prüfe ob das Porridge-Gericht in der Liste erscheint
    await expect(page.locator('text=Porridge').first()).toBeVisible({ timeout: 3000 });
  });

  test("should not allow saving dish without name", async ({ page }) => {
    // Navigiere zu "Gericht aus Zutaten erstellen"
    await page.goto("/dishes/create-with-ingredients");
    await expect(page.locator("h1:has-text('Gericht aus Zutaten erstellen')")).toBeVisible();
    
    // Prüfe ob KI-Suche verfügbar ist
    const aiButton = page.locator('button[aria-label="KI-Suche"]').first();
    const isAIAvailable = await aiButton.isVisible().catch(() => false);
    
    if (!isAIAvailable) {
      test.skip();
      return;
    }

    const searchInput = page.locator('input[id="search"]');
    
    // Füge eine Zutat hinzu
    await searchInput.click();
    await searchInput.fill("Wasser");
    await page.waitForTimeout(600);
    await aiButton.click();
    await page.waitForTimeout(3000);
    
    const waterResult = page.locator('.dish-list-item').filter({ hasText: /Wasser/i }).first();
    await expect(waterResult).toBeVisible({ timeout: 10000 });
    await waterResult.click();
    await page.waitForTimeout(500);
    
    // Wähle Kategorie
    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption("breakfast");
    
    // Lass Gerichtsname leer
    // Prüfe ob Speichern-Button deaktiviert ist
    const saveButton = page.locator('button[type="submit"]').first();
    await expect(saveButton).toBeDisabled();
  });

  test("should not allow saving dish without ingredients", async ({ page }) => {
    // Navigiere zu "Gericht aus Zutaten erstellen"
    await page.goto("/dishes/create-with-ingredients");
    await expect(page.locator("h1:has-text('Gericht aus Zutaten erstellen')")).toBeVisible();
    
    // Setze Gerichtsname
    const dishNameInput = page.locator('input[placeholder*="Gerichtsname"]').first();
    await dishNameInput.fill("Porridge");
    
    // Wähle Kategorie
    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption("breakfast");
    
    // Lass Zutaten leer
    // Prüfe ob Speichern-Button deaktiviert ist
    const saveButton = page.locator('button[type="submit"]').first();
    await expect(saveButton).toBeDisabled();
  });

  test("should not allow saving dish without category", async ({ page }) => {
    // Navigiere zu "Gericht aus Zutaten erstellen"
    await page.goto("/dishes/create-with-ingredients");
    await expect(page.locator("h1:has-text('Gericht aus Zutaten erstellen')")).toBeVisible();
    
    // Prüfe ob KI-Suche verfügbar ist
    const aiButton = page.locator('button[aria-label="KI-Suche"]').first();
    const isAIAvailable = await aiButton.isVisible().catch(() => false);
    
    if (!isAIAvailable) {
      test.skip();
      return;
    }

    const searchInput = page.locator('input[id="search"]');
    
    // Füge eine Zutat hinzu
    await searchInput.click();
    await searchInput.fill("Wasser");
    await page.waitForTimeout(600);
    await aiButton.click();
    await page.waitForTimeout(3000);
    
    const waterResult = page.locator('.dish-list-item').filter({ hasText: /Wasser/i }).first();
    await expect(waterResult).toBeVisible({ timeout: 10000 });
    await waterResult.click();
    await page.waitForTimeout(500);
    
    // Setze Gerichtsname
    const dishNameInput = page.locator('input[placeholder*="Gerichtsname"]').first();
    await dishNameInput.fill("Porridge");
    
    // Lass Kategorie leer
    // Prüfe ob Speichern-Button deaktiviert ist
    const saveButton = page.locator('button[type="submit"]').first();
    await expect(saveButton).toBeDisabled();
  });

  test("should handle AI search error gracefully", async ({ page }) => {
    // Navigiere zu "Gericht aus Zutaten erstellen"
    await page.goto("/dishes/create-with-ingredients");
    await expect(page.locator("h1:has-text('Gericht aus Zutaten erstellen')")).toBeVisible();
    
    // Prüfe ob KI-Suche verfügbar ist
    const aiButton = page.locator('button[aria-label="KI-Suche"]').first();
    const isAIAvailable = await aiButton.isVisible().catch(() => false);
    
    if (!isAIAvailable) {
      test.skip();
      return;
    }

    const searchInput = page.locator('input[id="search"]');
    
    // Versuche eine sehr spezifische/ungewöhnliche Query, die möglicherweise fehlschlägt
    await searchInput.click();
    await searchInput.fill("xyz123abc456");
    await page.waitForTimeout(600);
    await aiButton.click();
    
    // Warte auf Antwort (oder Timeout)
    await page.waitForTimeout(5000);
    
    // Prüfe ob entweder ein Ergebnis angezeigt wird oder keine Fehlermeldung die UI blockiert
    // Die App sollte graceful mit dem Fehler umgehen (kein Ergebnis, aber UI bleibt funktionsfähig)
    const errorMessage = page.locator('text=Fehler').first();
    const hasError = await errorMessage.isVisible().catch(() => false);
    
    // Wenn ein Fehler angezeigt wird, sollte er nicht die gesamte UI blockieren
    if (hasError) {
      // Prüfe ob das Suchfeld noch funktioniert
      await searchInput.click();
      await expect(searchInput).toBeFocused();
    }
  });
});

