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

test.describe('Language settings', () => {

  // Helper pour naviguer vers la page des langues du premier profil
  const goToLanguagesPage = async (page) => {
    // Aller sur la page des profils
    await gotoProtectedPage(page, '/account-settings/profiles');
    await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
    await page.waitForTimeout(500);
    
    // Cliquer sur le premier profil
    const firstProfile = page.locator('.profile-settings .link-card').first();
    await expect(firstProfile).toBeVisible({ timeout: 15000 });
    await firstProfile.click();
    
    // Attendre d'être sur la page manage-profile-preferences
    await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
    await page.waitForTimeout(500);
    
    // Cliquer sur "Languages" avec attente explicite
    const languagesLink = page.locator('.link-card:has-text("Languages")');
    await expect(languagesLink).toBeVisible({ timeout: 15000 });
    await languagesLink.click();
    
    // Attendre d'être sur la page des langues avec retry
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1')).toContainText('Languages', { timeout: 20000 });
  };

  test('Display of the language settings page', async ({ page }) => {
    await goToLanguagesPage(page);

    // Verify the page title
    await expect(page.locator('h1')).toContainText('Languages');

    // Verify the subtitle
    await expect(page.locator('.languages-subtitle')).toContainText('Choose your preferred language');
  });

  test('Display of the Display Language section', async ({ page }) => {
    await goToLanguagesPage(page);

    // Verify the Display Language section
    await expect(page.locator('.section-title').first()).toContainText('Display Language');
    await expect(page.locator('.language-display')).toBeVisible();
  });

  test('Display of the Shows & Movies Languages section', async ({ page }) => {
    await goToLanguagesPage(page);

    // Verify the Shows & Movies Languages section
    await expect(page.locator('text=Shows & Movies Languages')).toBeVisible();
    
    // Verify that the select is present
    const showingSelect = page.locator('select[name="showingLanguage"]');
    await expect(showingSelect).toBeVisible();
  });

  test('Display of the Audio Preference section', async ({ page }) => {
    await goToLanguagesPage(page);

    // Verify the Audio section
    await expect(page.locator('text=Choose your preferred audio language')).toBeVisible();
    
    // Verify that the audio select is present
    const audioSelect = page.locator('select[name="audioLanguage"]');
    await expect(audioSelect).toBeVisible();
  });

  test('Display of the Subtitle Preference section', async ({ page }) => {
    await goToLanguagesPage(page);

    // Verify the Subtitle section
    await expect(page.getByRole('heading', { name: 'Subtitle Preference' })).toBeVisible();
    
    // Verify that the subtitle select is present
    const subtitleSelect = page.locator('select[name="subtitleLanguage"]');
    await expect(subtitleSelect).toBeVisible();
  });

  test('Available languages are displayed in the selects', async ({ page }) => {
    await goToLanguagesPage(page);

    // Verify that the language options are present
    const showingSelect = page.locator('select[name="showingLanguage"]');
    const optionsCount = await showingSelect.locator('option').count();
    expect(optionsCount).toBeGreaterThan(0);

    // Verify some specific languages
    await expect(showingSelect).toContainText('English');
  });

  test('Change the Shows & Movies language', async ({ page }) => {
    await goToLanguagesPage(page);

    // Get current value
    const showingSelect = page.locator('select[name="showingLanguage"]');
    const currentValue = await showingSelect.inputValue();

    // Select a different language
    const options = await showingSelect.locator('option').allTextContents();
    const differentLanguage = options.find(opt => opt !== currentValue) || 'French';
    await showingSelect.selectOption(differentLanguage);

    // Verify that the selection has changed
    await expect(showingSelect).toHaveValue(differentLanguage);

    // The Save button should be enabled now
    const saveButton = page.locator('button[type="submit"]');
    await expect(saveButton).toBeEnabled();

    // Reset to original value to not affect other tests
    await showingSelect.selectOption(currentValue);
  });

  test('Change the audio language', async ({ page }) => {
    await goToLanguagesPage(page);

    // Get current value
    const audioSelect = page.locator('select[name="audioLanguage"]');
    const currentValue = await audioSelect.inputValue();

    // Select a different language
    const options = await audioSelect.locator('option').allTextContents();
    const differentLanguage = options.find(opt => opt !== currentValue) || 'Spanish';
    await audioSelect.selectOption(differentLanguage);

    // Verify that the selection has changed
    await expect(audioSelect).toHaveValue(differentLanguage);

    // Reset to original value
    await audioSelect.selectOption(currentValue);
  });

  test('Change the subtitle language', async ({ page }) => {
    await goToLanguagesPage(page);

    // Get current value
    const subtitleSelect = page.locator('select[name="subtitleLanguage"]');
    const currentValue = await subtitleSelect.inputValue();

    // Select a different language
    const options = await subtitleSelect.locator('option').allTextContents();
    const differentLanguage = options.find(opt => opt !== currentValue) || 'German';
    await subtitleSelect.selectOption(differentLanguage);

    // Verify that the selection has changed
    await expect(subtitleSelect).toHaveValue(differentLanguage);

    // Reset to original value
    await subtitleSelect.selectOption(currentValue);
  });

  test('Save button disabled by default (no change)', async ({ page }) => {
    await goToLanguagesPage(page);

    // The Save button should be disabled without change
    const saveButton = page.locator('button[type="submit"]');
    await expect(saveButton).toBeDisabled();
  });

  test('Save button enabled after a change', async ({ page }) => {
    await goToLanguagesPage(page);

    // Get current value
    const audioSelect = page.locator('select[name="audioLanguage"]');
    await expect(audioSelect).toBeVisible({ timeout: 10000 });
    const currentValue = await audioSelect.inputValue();

    // Get available option values (not text)
    const optionValues = await audioSelect.locator('option').evaluateAll(opts => 
      opts.map(opt => opt.value).filter(v => v)
    );
    
    // Select a different value
    const differentValue = optionValues.find(v => v !== currentValue) || optionValues[0];
    await audioSelect.selectOption(differentValue);

    // The Save button should be enabled
    const saveButton = page.locator('button[type="submit"]');
    await expect(saveButton).toBeEnabled({ timeout: 10000 });

    // Reset to original value
    await audioSelect.selectOption(currentValue);
  });

  test('Cancel button goes back', async ({ page }) => {
    await goToLanguagesPage(page);

    // Click on Cancel
    await page.click('button.secondary');

    // Should go back to Manage Profile and Preferences
    await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
  });

  test('Back button goes back', async ({ page }) => {
    await goToLanguagesPage(page);

    // Click on Back
    await page.click('.back-button');

    // Should go back to Manage Profile and Preferences
    await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
  });

  test('Navigation from the Preferences page', async ({ page }) => {
    // Go to preferences page
    await gotoProtectedPage(page, '/account-settings/preferences');

    // Verify that the Languages button is visible
    const languagesButton = page.getByRole('button', { name: /Languages.*Set languages for/i }).first();
    await expect(languagesButton).toBeVisible({ timeout: 15000 });

    // Click on Languages
    await languagesButton.click();

    // Verify the navigation
    await expect(page).toHaveURL(/\/account-settings\/languages\//, { timeout: 15000 });
  });

});

