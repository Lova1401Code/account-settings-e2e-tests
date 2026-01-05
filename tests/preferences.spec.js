import { test, expect } from '@playwright/test';

test.describe('Preferences Menu', () => {

 const goToPreferences = async (page) => {
    await page.goto('/account-settings/preferences', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    await expect(page.getByText('Languages').first()).toBeVisible({ timeout: 15000 });
    
     await page.waitForFunction(() => localStorage.getItem('profileId') !== null, { timeout: 15000 });
  };

  test.describe('Preferences Page - Display', () => {
    test('Display Preferences page with title', async ({ page }) => {
      await goToPreferences(page);

      await expect(page.locator('.link-card').first()).toBeVisible({ timeout: 15000 });
    });

    test('Display Languages menu item', async ({ page }) => {
      await goToPreferences(page);

      await expect(page.locator('.link-title:has-text("Languages"), .link-card:has-text("Languages")').first()).toBeVisible({ timeout: 15000 });
    });

    test('Display Subtitle appearance menu item', async ({ page }) => {
      await goToPreferences(page);

      await expect(page.locator('.link-title:has-text("Subtitle"), .link-card:has-text("Subtitle")').first()).toBeVisible({ timeout: 15000 });
    });

    test('Display Playback settings menu item', async ({ page }) => {
      await goToPreferences(page);

      await expect(page.locator('.link-title:has-text("Playback"), .link-card:has-text("Playback")').first()).toBeVisible({ timeout: 15000 });
    });

    test('Display Notification settings menu item', async ({ page }) => {
      await goToPreferences(page);

      await expect(page.locator('.link-title:has-text("Notification"), .link-card:has-text("Notification")').first()).toBeVisible({ timeout: 15000 });
    });

    test('Display Viewing activity menu item', async ({ page }) => {
      await goToPreferences(page);

      await expect(page.locator('.link-title:has-text("Viewing"), .link-card:has-text("Viewing")').first()).toBeVisible({ timeout: 15000 });
    });

    test('Display Privacy settings menu item', async ({ page }) => {
      await goToPreferences(page);

      await expect(page.locator('.link-title:has-text("Privacy"), .link-card:has-text("Privacy")').first()).toBeVisible({ timeout: 15000 });
    });

    test('Click on Languages navigates to language settings', async ({ page }) => {
      await goToPreferences(page);

      await page.locator('.link-card:has-text("Languages")').first().click();

      await expect(page).toHaveURL(/\/languages\//, { timeout: 15000 });
    });

    test('Click on Subtitle appearance navigates correctly', async ({ page }) => {
      await goToPreferences(page);

      await page.locator('.link-card:has-text("Subtitle")').first().click();

      await expect(page).toHaveURL(/\/subtitle-appearance\//, { timeout: 15000 });
    });

    test('Click on Playback settings navigates correctly', async ({ page }) => {
      await goToPreferences(page);

      // Cliquer sur Playback settings
      await page.locator('.link-card:has-text("Playback")').first().click();

      await expect(page).toHaveURL(/\/playback-settings\//, { timeout: 15000 });
    });

    test('Click on Notification settings navigates correctly', async ({ page }) => {
      await goToPreferences(page);

      // Cliquer sur Notification settings
      await page.locator('.link-card:has-text("Notification")').first().click();

      // Vérifier la navigation
      await expect(page).toHaveURL(/\/notification-settings\//, { timeout: 15000 });
    });

    test('Click on Viewing activity navigates correctly', async ({ page }) => {
      await goToPreferences(page);

      // Cliquer sur Viewing activity
      await page.locator('.link-card:has-text("Viewing")').first().click();

      // Vérifier la navigation
      await expect(page).toHaveURL(/\/viewing-activity\//, { timeout: 15000 });
    });

    test('Click on Privacy settings navigates correctly', async ({ page }) => {
      await goToPreferences(page);

      // Cliquer sur Privacy settings
      await page.locator('.link-card:has-text("Privacy")').first().click();

      // Vérifier la navigation
      await expect(page).toHaveURL(/\/privacy-settings\//, { timeout: 15000 });
    });
  });

  test.describe('Languages Page', () => {
    test('Display Languages page with title', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Languages")').first().click();
      await expect(page).toHaveURL(/\/languages\//, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText('Languages', { timeout: 15000 });
    });

    test('Display all language selects', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Languages")').first().click();
      await expect(page).toHaveURL(/\/languages\//, { timeout: 15000 });
      
      // Vérifier que les 3 selects sont visibles
      await expect(page.locator('select[name="showingLanguage"]')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('select[name="audioLanguage"]')).toBeVisible();
      await expect(page.locator('select[name="subtitleLanguage"]')).toBeVisible();
    });

    test('Save Changes button is disabled by default', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Languages")').first().click();
      await expect(page).toHaveURL(/\/languages\//, { timeout: 15000 });
      
      // Le bouton Save Changes doit être désactivé par défaut
      await expect(page.locator('button[type="submit"]')).toBeDisabled({ timeout: 15000 });
    });

    test('Change Shows & Movies language enables Save button', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Languages")').first().click();
      await expect(page).toHaveURL(/\/languages\//, { timeout: 15000 });
      
      // Récupérer la valeur actuelle
      const select = page.locator('select[name="showingLanguage"]');
      await expect(select).toBeVisible({ timeout: 15000 });
      const currentValue = await select.inputValue();
      
      // Changer la valeur (prendre une autre option)
      const options = await select.locator('option').allTextContents();
      const newValue = options.find(opt => opt !== currentValue) || options[1];
      await select.selectOption(newValue);
      
      // Vérifier que le bouton Save est maintenant actif
      await expect(page.locator('button[type="submit"]')).toBeEnabled();
    });

    test('Change Audio language and save successfully', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Languages")').first().click();
      await expect(page).toHaveURL(/\/languages\//, { timeout: 15000 });
      
      // Changer la langue audio
      const select = page.locator('select[name="audioLanguage"]');
      await expect(select).toBeVisible({ timeout: 15000 });
      const options = await select.locator('option').allTextContents();
      const newValue = options.length > 1 ? options[1] : options[0];
      await select.selectOption(newValue);
      
      // Cliquer sur Save Changes
      await page.locator('button[type="submit"]').click();
      
      // Vérifier le message de succès
      await expect(page.locator('.success-message')).toContainText('Language preferences saved successfully', { timeout: 15000 });
    });

    test('Change Subtitle language and verify value persists', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Languages")').first().click();
      await expect(page).toHaveURL(/\/languages\//, { timeout: 15000 });
      
      // Changer la langue des sous-titres
      const select = page.locator('select[name="subtitleLanguage"]');
      await expect(select).toBeVisible({ timeout: 15000 });
      const options = await select.locator('option').allTextContents();
      const newValue = options.length > 1 ? options[1] : options[0];
      await select.selectOption(newValue);
      
      // Sauvegarder
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('.success-message')).toBeVisible({ timeout: 15000 });
      
      // Recharger la page et vérifier que la valeur est conservée
      await page.reload();
      await expect(select).toBeVisible({ timeout: 15000 });
      const savedValue = await select.inputValue();
      expect(savedValue).toBe(newValue);
    });

    test('Cancel button navigates back', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Languages")').first().click();
      await expect(page).toHaveURL(/\/languages\//, { timeout: 15000 });
      
      // Cliquer sur Cancel
      await page.locator('button.secondary:has-text("Cancel")').click();
      
      // Vérifier qu'on est revenu à la page précédente
      await expect(page).toHaveURL(/\/preferences/, { timeout: 15000 });
    });
  });

  test.describe('Subtitle Appearance Page', () => {
    test('Display Subtitle Appearance page with title', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Subtitle")').first().click();
      await expect(page).toHaveURL(/\/subtitle-appearance\//, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText('Subtitle', { timeout: 15000 });
    });

    test('Display Font settings', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Subtitle")').first().click();
      await expect(page).toHaveURL(/\/subtitle-appearance\//, { timeout: 15000 });
      await expect(page.getByText('Font Family').first()).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Playback Settings Page', () => {
    test('Display Playback Settings page with title', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Playback")').first().click();
      await expect(page).toHaveURL(/\/playback-settings\//, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText('Playback', { timeout: 15000 });
    });

    test('Display Autoplay section', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Playback")').first().click();
      await expect(page).toHaveURL(/\/playback-settings\//, { timeout: 15000 });
      await expect(page.getByText('Autoplay').first()).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Notification Settings Page', () => {
    test('Display Notification Settings page with title', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Notification")').first().click();

      await expect(page.locator('h1')).toContainText('Notification', { timeout: 15000 });
    });

    test('Display Email section', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Notification")').first().click();

      await expect(page.locator('h1')).toContainText('Notification', { timeout: 15000 });
      await expect(page.getByRole('heading', { name: 'Email' })).toBeVisible();
    });
  });

  test.describe('Viewing Activity Page', () => {
    test('Display Viewing Activity page with title', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Viewing")').first().click();

      await expect(page.locator('h1')).toContainText('Activity', { timeout: 15000 });
    });

    test('Display tabs for Watching and Ratings', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Viewing")').first().click();

      await expect(page.locator('h1')).toContainText('Activity', { timeout: 15000 });
      await expect(page.locator('.tab-button:has-text("Watching")').first()).toBeVisible();
      await expect(page.locator('.tab-button:has-text("Ratings")').first()).toBeVisible();
    });
  });

  test.describe('Privacy Settings Page', () => {
    test('Display Privacy Settings page with title', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Privacy")').first().click();

      await expect(page.locator('h1')).toContainText('Privacy', { timeout: 15000 });
    });
  });
});
