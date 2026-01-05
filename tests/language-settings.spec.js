import { test, expect } from '@playwright/test';

// Helper pour naviguer vers une page protégée
const gotoProtectedPage = async (page, url, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const securityInfoPromise = page.waitForResponse(
      response => response.url().includes('/customer/security-info') && response.status() === 200,
      { timeout: 30000 }
    ).catch(() => null);
    
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await securityInfoPromise;
    await page.waitForTimeout(1000);
    
    const h1Text = await page.locator('h1').textContent().catch(() => '');
    if (!h1Text.includes('Email verification')) {
      return;
    }
    await page.waitForTimeout(2000);
  }
};

test.describe('Language Settings - Functional Tests', () => {

  const goToLanguagesPage = async (page) => {
    await gotoProtectedPage(page, '/account-settings/profiles');
    await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
    
    const firstProfile = page.locator('.profile-settings .link-card').first();
    await expect(firstProfile).toBeVisible({ timeout: 15000 });
    await firstProfile.click();
    
    await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
    
    await page.locator('.link-card:has-text("Languages")').click();
    
    await expect(page.locator('h1')).toContainText('Languages', { timeout: 20000 });
  };

  test('Change Shows & Movies language enables Save button', async ({ page }) => {
    await goToLanguagesPage(page);

    const showingSelect = page.locator('select[name="showingLanguage"]');
    const currentValue = await showingSelect.inputValue();

    const options = await showingSelect.locator('option').allTextContents();
    const differentLanguage = options.find(opt => opt !== currentValue) || 'French';
    await showingSelect.selectOption(differentLanguage);

    const saveButton = page.locator('button[type="submit"]');
    await expect(saveButton).toBeEnabled();

    // Reset
    await showingSelect.selectOption(currentValue);
  });

  test('Save button disabled when no changes made', async ({ page }) => {
    await goToLanguagesPage(page);

    const saveButton = page.locator('button[type="submit"]');
    await expect(saveButton).toBeDisabled();
  });

  test('Change audio language', async ({ page }) => {
    await goToLanguagesPage(page);

    const audioSelect = page.locator('select[name="audioLanguage"]');
    const currentValue = await audioSelect.inputValue();

    const options = await audioSelect.locator('option').allTextContents();
    const differentLanguage = options.find(opt => opt !== currentValue) || 'Spanish';
    await audioSelect.selectOption(differentLanguage);

    await expect(audioSelect).toHaveValue(differentLanguage);

    // Reset
    await audioSelect.selectOption(currentValue);
  });

  test('Change subtitle language', async ({ page }) => {
    await goToLanguagesPage(page);

    const subtitleSelect = page.locator('select[name="subtitleLanguage"]');
    const currentValue = await subtitleSelect.inputValue();

    const options = await subtitleSelect.locator('option').allTextContents();
    const differentLanguage = options.find(opt => opt !== currentValue) || 'German';
    await subtitleSelect.selectOption(differentLanguage);

    await expect(subtitleSelect).toHaveValue(differentLanguage);

    // Reset
    await subtitleSelect.selectOption(currentValue);
  });

  test('Cancel button navigates back', async ({ page }) => {
    await goToLanguagesPage(page);

    await page.click('button.secondary');

    await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
  });

  test('Back button navigates back', async ({ page }) => {
    await goToLanguagesPage(page);

    await page.click('.back-button');

    await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
  });

  test('Navigate to Languages from Preferences page', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/preferences');

    const languagesButton = page.getByRole('button', { name: /Languages.*Set languages for/i }).first();
    await expect(languagesButton).toBeVisible({ timeout: 15000 });

    await languagesButton.click();

    await expect(page).toHaveURL(/\/account-settings\/languages\//, { timeout: 15000 });
  });

});
