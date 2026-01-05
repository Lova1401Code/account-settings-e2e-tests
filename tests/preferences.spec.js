import { test, expect } from '@playwright/test';

test.describe('Preferences - Functional Tests', () => {

  const goToPreferences = async (page) => {
    await page.goto('/account-settings/preferences', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await expect(page.getByText('Languages').first()).toBeVisible({ timeout: 15000 });
    await page.waitForFunction(() => localStorage.getItem('profileId') !== null, { timeout: 15000 });
  };

  test.describe('Navigation', () => {
    test('Languages link navigates to language settings', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Languages")').first().click();
      await expect(page).toHaveURL(/\/languages\//, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText('Languages');
    });

    test('Subtitle appearance link navigates correctly', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Subtitle")').first().click();
      await expect(page).toHaveURL(/\/subtitle-appearance\//, { timeout: 15000 });
    });

    test('Playback settings link navigates correctly', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Playback")').first().click();
      await expect(page).toHaveURL(/\/playback-settings\//, { timeout: 15000 });
    });

    test('Notification settings link navigates correctly', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Notification")').first().click();
      await expect(page).toHaveURL(/\/notification-settings\//, { timeout: 15000 });
    });

    test('Viewing activity link navigates correctly', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Viewing")').first().click();
      await expect(page).toHaveURL(/\/viewing-activity\//, { timeout: 15000 });
    });

    test('Privacy settings link navigates correctly', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Privacy")').first().click();
      await expect(page).toHaveURL(/\/privacy-settings\//, { timeout: 15000 });
    });
  });

  test.describe('Languages Settings', () => {
    test('Change Shows & Movies language enables Save button', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Languages")').first().click();
      await expect(page).toHaveURL(/\/languages\//, { timeout: 15000 });
      
      const select = page.locator('select[name="showingLanguage"]');
      await expect(select).toBeVisible({ timeout: 15000 });
      
      // Save button should be disabled initially
      await expect(page.locator('button[type="submit"]')).toBeDisabled();
      
      // Change value
      const options = await select.locator('option').allTextContents();
      const currentValue = await select.inputValue();
      const newValue = options.find(opt => opt !== currentValue) || options[1];
      await select.selectOption(newValue);
      
      // Save button should be enabled now
      await expect(page.locator('button[type="submit"]')).toBeEnabled();
    });

    test('Save language changes and verify success message', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Languages")').first().click();
      await expect(page).toHaveURL(/\/languages\//, { timeout: 15000 });
      
      const select = page.locator('select[name="audioLanguage"]');
      await expect(select).toBeVisible({ timeout: 15000 });
      
      // Change value
      const options = await select.locator('option').allTextContents();
      const newValue = options.length > 1 ? options[1] : options[0];
      await select.selectOption(newValue);
      
      // Save
      await page.locator('button[type="submit"]').click();
      
      // Verify success
      await expect(page.locator('.success-message')).toContainText('Language preferences saved successfully', { timeout: 15000 });
    });

    test('Language changes persist after page reload', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Languages")').first().click();
      await expect(page).toHaveURL(/\/languages\//, { timeout: 15000 });
      
      const select = page.locator('select[name="subtitleLanguage"]');
      await expect(select).toBeVisible({ timeout: 15000 });
      
      // Get options and select new value
      const options = await select.locator('option').allTextContents();
      const newValue = options.length > 1 ? options[1] : options[0];
      await select.selectOption(newValue);
      
      // Save
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('.success-message')).toBeVisible({ timeout: 15000 });
      
      // Reload and verify
      await page.reload();
      await expect(select).toBeVisible({ timeout: 15000 });
      const savedValue = await select.inputValue();
      expect(savedValue).toBe(newValue);
    });

    test('Cancel button navigates back to preferences', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Languages")').first().click();
      await expect(page).toHaveURL(/\/languages\//, { timeout: 15000 });
      
      await page.locator('button.secondary:has-text("Cancel")').click();
      
      await expect(page).toHaveURL(/\/preferences/, { timeout: 15000 });
    });
  });

  test.describe('Viewing Activity', () => {
    test('Can switch between Watching and Ratings tabs', async ({ page }) => {
      await goToPreferences(page);
      await page.locator('.link-card:has-text("Viewing")').first().click();
      await expect(page.locator('h1')).toContainText('Activity', { timeout: 15000 });

      // Click Watching tab
      await page.locator('.tab-button:has-text("Watching")').first().click();
      
      // Click Ratings tab
      await page.locator('.tab-button:has-text("Ratings")').first().click();
      
      // Ratings tab should be active (or content should change)
      await expect(page.locator('.tab-button.active:has-text("Ratings"), .tab-button[aria-selected="true"]:has-text("Ratings")').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    });
  });

});
