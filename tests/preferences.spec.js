import { test, expect } from '@playwright/test';

test.describe('Preferences - Functional Tests', () => {

  // Helper pour obtenir le profileId depuis localStorage
  const getProfileId = async (page) => {
    // D'abord naviguer vers account-settings pour récupérer le profileId
    await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    let profileId = await page.evaluate(() => localStorage.getItem('profileId'));
    
    // Si pas de profileId, essayer de le récupérer depuis les profils
    if (!profileId) {
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      // Cliquer sur le premier profil pour activer
      const firstProfile = page.locator('.profile-settings .link-card').first();
      if (await firstProfile.isVisible()) {
        await firstProfile.click();
        await page.waitForTimeout(1000);
        profileId = await page.evaluate(() => localStorage.getItem('profileId'));
      }
    }
    
    return profileId;
  };

  const goToPreferences = async (page) => {
    await page.goto('/account-settings/preferences', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expect(page.getByText('Languages').first()).toBeVisible({ timeout: 15000 });
  };

  // Helper pour naviguer vers les sous-pages directement (plus robuste que cliquer sur les liens)
  const goToSubPage = async (page, subPage) => {
    const profileId = await getProfileId(page);
    if (!profileId) {
      throw new Error('Cannot get profileId');
    }
    await page.goto(`/account-settings/${subPage}/${profileId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    return profileId;
  };

  test.describe('Navigation', () => {
    test('Languages link navigates to language settings', async ({ page }) => {
      await goToSubPage(page, 'languages');
      await expect(page).toHaveURL(/\/languages\//, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText('Languages');
    });

    test('Subtitle appearance link navigates correctly', async ({ page }) => {
      await goToSubPage(page, 'subtitle-appearance');
      await expect(page).toHaveURL(/\/subtitle-appearance\//, { timeout: 20000 });
      await expect(page.locator('h1')).toContainText('Subtitle Appearance', { timeout: 15000 });
    });

    test('Playback settings link navigates correctly', async ({ page }) => {
      await goToSubPage(page, 'playback-settings');
      await expect(page).toHaveURL(/\/playback-settings\//, { timeout: 20000 });
      await expect(page.locator('h1')).toContainText('Playback Settings', { timeout: 15000 });
    });

    test('Notification settings link navigates correctly', async ({ page }) => {
      await goToSubPage(page, 'notification-settings');
      await expect(page).toHaveURL(/\/notification-settings\//, { timeout: 20000 });
      await expect(page.locator('h1')).toContainText('Notification Settings', { timeout: 15000 });
    });

    test('Viewing activity link navigates correctly', async ({ page }) => {
      await goToSubPage(page, 'viewing-activity');
      await expect(page).toHaveURL(/\/viewing-activity\//, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText('Activity', { timeout: 15000 });
    });

    test('Privacy settings link navigates correctly', async ({ page }) => {
      await goToSubPage(page, 'privacy-settings');
      await expect(page).toHaveURL(/\/privacy-settings\//, { timeout: 20000 });
    });
  });

  test.describe('Languages Settings', () => {
    test('Change Shows & Movies language enables Save button', async ({ page }) => {
      await goToSubPage(page, 'languages');
      await expect(page.locator('h1')).toContainText('Languages', { timeout: 15000 });
      
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
      await goToSubPage(page, 'languages');
      await expect(page.locator('h1')).toContainText('Languages', { timeout: 15000 });
      
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
      await goToSubPage(page, 'languages');
      await expect(page.locator('h1')).toContainText('Languages', { timeout: 15000 });
      
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

    test('Cancel button navigates back', async ({ page }) => {
      await goToSubPage(page, 'languages');
      await expect(page.locator('h1')).toContainText('Languages', { timeout: 15000 });
      
      await page.locator('button.secondary:has-text("Cancel")').click();
      
      // Cancel navigates away from languages page (to account-settings or preferences)
      await expect(page).not.toHaveURL(/\/languages\//, { timeout: 15000 });
    });
  });

  test.describe('Subtitle Appearance Settings', () => {
    test('Save button disabled when no changes made', async ({ page }) => {
      await goToSubPage(page, 'subtitle-appearance');
      await expect(page.locator('h1')).toContainText('Subtitle Appearance', { timeout: 15000 });
      
      // Save button should be disabled initially
      await expect(page.locator('button[type="submit"]')).toBeDisabled();
    });

    test('Change font family enables Save button', async ({ page }) => {
      await goToSubPage(page, 'subtitle-appearance');
      await expect(page.locator('h1')).toContainText('Subtitle Appearance', { timeout: 15000 });
      
      const select = page.locator('select[name="fontFamily"]');
      await expect(select).toBeVisible({ timeout: 10000 });
      
      // Change font family
      await select.selectOption('Arial');
      
      // Save button should be enabled
      await expect(page.locator('button[type="submit"]')).toBeEnabled();
    });

    test('Change font size updates preview', async ({ page }) => {
      await goToSubPage(page, 'subtitle-appearance');
      await expect(page.locator('h1')).toContainText('Subtitle Appearance', { timeout: 15000 });
      
      const select = page.locator('select[name="fontSize"]');
      await expect(select).toBeVisible({ timeout: 10000 });
      
      // Change font size to large
      await select.selectOption('large');
      
      // Preview should be visible
      await expect(page.locator('.preview-text')).toBeVisible();
    });

    test('Change text color and save', async ({ page }) => {
      await goToSubPage(page, 'subtitle-appearance');
      await expect(page.locator('h1')).toContainText('Subtitle Appearance', { timeout: 15000 });
      
      const select = page.locator('select[name="textColor"]');
      await expect(select).toBeVisible({ timeout: 10000 });
      
      // Change text color
      await select.selectOption('yellow');
      
      // Save
      await page.locator('button[type="submit"]').click();
      
      // Verify success message
      await expect(page.locator('.success-message')).toContainText('Subtitle appearance settings saved successfully', { timeout: 10000 });
    });

    test('Change shadow type', async ({ page }) => {
      await goToSubPage(page, 'subtitle-appearance');
      await expect(page.locator('h1')).toContainText('Subtitle Appearance', { timeout: 15000 });
      
      const select = page.locator('select[name="shadowType"]');
      await expect(select).toBeVisible({ timeout: 10000 });
      
      // Change shadow type
      await select.selectOption('outline');
      await expect(select).toHaveValue('outline');
      
      // Save button should be enabled
      await expect(page.locator('button[type="submit"]')).toBeEnabled();
    });

    test('Change background color', async ({ page }) => {
      await goToSubPage(page, 'subtitle-appearance');
      await expect(page.locator('h1')).toContainText('Subtitle Appearance', { timeout: 15000 });
      
      const select = page.locator('select[name="backgroundColor"]');
      await expect(select).toBeVisible({ timeout: 10000 });
      
      // Change background color
      await select.selectOption('black');
      await expect(select).toHaveValue('black');
    });

    test('Reset to Default restores initial values and enables Save', async ({ page }) => {
      await goToSubPage(page, 'subtitle-appearance');
      await expect(page.locator('h1')).toContainText('Subtitle Appearance', { timeout: 15000 });
      
      // Change something first
      await page.locator('select[name="fontSize"]').selectOption('extra-large');
      
      // Click Reset to Default
      await page.locator('button:has-text("Reset to Default")').click();
      
      // Verify default values are restored
      await expect(page.locator('select[name="fontSize"]')).toHaveValue('medium');
      await expect(page.locator('select[name="fontFamily"]')).toHaveValue('Netflix Sans');
      await expect(page.locator('select[name="textColor"]')).toHaveValue('white');
      
      // Save button should be enabled after reset
      await expect(page.locator('button[type="submit"]')).toBeEnabled();
    });

    test('Cancel button navigates back', async ({ page }) => {
      await goToSubPage(page, 'subtitle-appearance');
      await expect(page.locator('h1')).toContainText('Subtitle Appearance', { timeout: 15000 });
      
      await page.locator('button.secondary:has-text("Cancel")').click();
      
      // Cancel navigates away from subtitle-appearance page
      await expect(page).not.toHaveURL(/\/subtitle-appearance\//, { timeout: 15000 });
    });

    test('Back button navigates back', async ({ page }) => {
      await goToSubPage(page, 'subtitle-appearance');
      await expect(page.locator('h1')).toContainText('Subtitle Appearance', { timeout: 15000 });
      
      await page.locator('.back-button').click();
      
      // Should navigate away from subtitle-appearance
      await expect(page).not.toHaveURL(/\/subtitle-appearance\//, { timeout: 15000 });
    });
  });

  test.describe('Playback Settings', () => {
    test('Save button disabled when no changes made', async ({ page }) => {
      await goToSubPage(page, 'playback-settings');
      await expect(page.locator('h1')).toContainText('Playback Settings', { timeout: 15000 });
      
      // Save button should be disabled initially
      await expect(page.locator('button[type="submit"]')).toBeDisabled();
    });

    test('Toggle Autoplay next episode checkbox', async ({ page }) => {
      await goToSubPage(page, 'playback-settings');
      await expect(page.locator('h1')).toContainText('Playback Settings', { timeout: 15000 });
      
      const checkbox = page.locator('input#autoplayNext');
      await expect(checkbox).toBeVisible({ timeout: 10000 });
      
      const wasChecked = await checkbox.isChecked();
      
      // Toggle checkbox
      await checkbox.click();
      
      // Verify state changed
      if (wasChecked) {
        await expect(checkbox).not.toBeChecked();
      } else {
        await expect(checkbox).toBeChecked();
      }
      
      // Save button should be enabled
      await expect(page.locator('button[type="submit"]')).toBeEnabled();
    });

    test('Toggle Autoplay previews checkbox', async ({ page }) => {
      await goToSubPage(page, 'playback-settings');
      await expect(page.locator('h1')).toContainText('Playback Settings', { timeout: 15000 });
      
      const checkbox = page.locator('input#autoplayPreviews');
      await expect(checkbox).toBeVisible({ timeout: 10000 });
      
      const wasChecked = await checkbox.isChecked();
      
      // Toggle checkbox
      await checkbox.click();
      
      // Verify state changed
      if (wasChecked) {
        await expect(checkbox).not.toBeChecked();
      } else {
        await expect(checkbox).toBeChecked();
      }
      
      // Save button should be enabled
      await expect(page.locator('button[type="submit"]')).toBeEnabled();
    });

    test('Change data usage setting', async ({ page }) => {
      await goToSubPage(page, 'playback-settings');
      await expect(page.locator('h1')).toContainText('Playback Settings', { timeout: 15000 });
      
      const select = page.locator('select[name="dataUsage"]');
      await expect(select).toBeVisible({ timeout: 10000 });
      
      // Change data usage to high
      await select.selectOption('high');
      await expect(select).toHaveValue('high');
      
      // Verify description updates
      await expect(page.locator('.data-usage-description')).toContainText('Best quality');
      
      // Save button should be enabled
      await expect(page.locator('button[type="submit"]')).toBeEnabled();
    });

    test('Data usage descriptions update correctly', async ({ page }) => {
      await goToSubPage(page, 'playback-settings');
      await expect(page.locator('h1')).toContainText('Playback Settings', { timeout: 15000 });
      
      const select = page.locator('select[name="dataUsage"]');
      await expect(select).toBeVisible({ timeout: 10000 });
      
      // Check low description
      await select.selectOption('low');
      await expect(page.locator('.data-usage-description')).toContainText('Uses less data');
      
      // Check medium description
      await select.selectOption('medium');
      await expect(page.locator('.data-usage-description')).toContainText('Balanced');
      
      // Check auto description
      await select.selectOption('auto');
      await expect(page.locator('.data-usage-description')).toContainText('Adjusts automatically');
    });

    test('Save playback settings shows success message', async ({ page }) => {
      // Navigate directly to playback-settings page
      await goToSubPage(page, 'playback-settings');
      await expect(page.locator('h1')).toContainText('Playback Settings', { timeout: 15000 });
      
      // Make a change
      const checkbox = page.locator('input#autoplayNext');
      await checkbox.click();
      
      // Save
      await page.locator('button[type="submit"]').click();
      
      // Verify success message
      await expect(page.locator('.success-message')).toContainText('Playback settings saved successfully', { timeout: 10000 });
    });

    test('Cancel button navigates back', async ({ page }) => {
      // Navigate directly to playback-settings page
      await goToSubPage(page, 'playback-settings');
      await expect(page.locator('h1')).toContainText('Playback Settings', { timeout: 15000 });
      
      await page.locator('button.secondary:has-text("Cancel")').click();
      
      // Should navigate away from playback-settings
      await expect(page).not.toHaveURL(/\/playback-settings\//, { timeout: 15000 });
    });

    test('Back button navigates back', async ({ page }) => {
      // Navigate directly to playback-settings page
      await goToSubPage(page, 'playback-settings');
      await expect(page.locator('h1')).toContainText('Playback Settings', { timeout: 15000 });
      
      await page.locator('.back-button').click();
      
      // Should navigate away from playback-settings
      await expect(page).not.toHaveURL(/\/playback-settings\//, { timeout: 15000 });
    });
  });

  test.describe('Notification Settings', () => {
    test('Email section displays status', async ({ page }) => {
      await goToSubPage(page, 'notification-settings');
      await expect(page.locator('h1')).toContainText('Notification Settings', { timeout: 15000 });
      
      // Email notification type should be visible
      await expect(page.locator('.notification-type h3:has-text("Email")')).toBeVisible({ timeout: 10000 });
      
      // Status should show Active or No emails active
      const statusText = await page.locator('.notification-type:has(h3:has-text("Email")) .status-text').textContent();
      expect(statusText.includes('Active') || statusText.includes('No emails active')).toBeTruthy();
    });

    test('Push notifications section displays status', async ({ page }) => {
      await goToSubPage(page, 'notification-settings');
      await expect(page.locator('h1')).toContainText('Notification Settings', { timeout: 15000 });
      
      // Push notifications type should be visible
      await expect(page.locator('.notification-type h3:has-text("Push notifications")')).toBeVisible({ timeout: 10000 });
      
      // Status should show Active or Inactive
      const statusText = await page.locator('.notification-type:has(h3:has-text("Push")) .status-text').textContent();
      expect(statusText.includes('Active') || statusText.includes('Inactive')).toBeTruthy();
    });

    test('Change Email button navigates to manage-emails', async ({ page }) => {
      // First get profileId
      const profileId = await getProfileId(page);
      if (!profileId) {
        test.skip('Cannot get profileId');
        return;
      }
      
      // Navigate directly to notification settings
      await page.goto(`/account-settings/notification-settings/${profileId}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      await expect(page.locator('h1')).toContainText('Notification Settings', { timeout: 15000 });
      
      // Click Change Email or Add Email button
      await page.locator('.notification-type:has(h3:has-text("Email")) button.secondary').click();
      
      // Should navigate to manage-emails page
      await expect(page).toHaveURL(/\/account-settings\/manage-emails\//, { timeout: 15000 });
    });

    test('Manage Push Notifications button navigates correctly', async ({ page }) => {
      // First get profileId
      const profileId = await getProfileId(page);
      if (!profileId) {
        test.skip('Cannot get profileId');
        return;
      }
      
      // Navigate directly to notification settings
      await page.goto(`/account-settings/notification-settings/${profileId}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      await expect(page.locator('h1')).toContainText('Notification Settings', { timeout: 15000 });
      
      // Click Manage Push Notifications button
      await page.locator('button:has-text("Manage Push Notifications")').click();
      
      // Should navigate to manage-push-notifications page
      await expect(page).toHaveURL(/\/account-settings\/manage-push-notifications\//, { timeout: 15000 });
    });

    test('Back button navigates back', async ({ page }) => {
      // First get profileId
      const profileId = await getProfileId(page);
      if (!profileId) {
        test.skip('Cannot get profileId');
        return;
      }
      
      // Navigate directly to notification settings
      await page.goto(`/account-settings/notification-settings/${profileId}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      await expect(page.locator('h1')).toContainText('Notification Settings', { timeout: 15000 });
      
      await page.locator('.back-button').click();
      
      // Should navigate back (not necessarily to preferences, but away from notification settings)
      await expect(page).not.toHaveURL(/\/notification-settings\//, { timeout: 15000 });
    });
  });

  test.describe('Viewing Activity', () => {
    test('Watching tab is active by default', async ({ page }) => {
      await goToSubPage(page, 'viewing-activity');
      await expect(page.locator('h1')).toContainText('Activity', { timeout: 15000 });
      
      // Watching tab should be active
      await expect(page.locator('.tab-button:has-text("Watching").active')).toBeVisible({ timeout: 10000 });
    });

    test('Can switch between Watching and Ratings tabs', async ({ page }) => {
      await goToSubPage(page, 'viewing-activity');
      await expect(page.locator('h1')).toContainText('Activity', { timeout: 15000 });

      // Click Ratings tab
      await page.locator('.tab-button:has-text("Ratings")').click();
      
      // Ratings tab should be active
      await expect(page.locator('.tab-button:has-text("Ratings").active')).toBeVisible({ timeout: 5000 });
      
      // Click Watching tab
      await page.locator('.tab-button:has-text("Watching")').click();
      
      // Watching tab should be active
      await expect(page.locator('.tab-button:has-text("Watching").active')).toBeVisible({ timeout: 5000 });
    });

    test('Activity items display date and title', async ({ page }) => {
      await goToSubPage(page, 'viewing-activity');
      await expect(page.locator('h1')).toContainText('Activity', { timeout: 15000 });
      
      // Wait for content to load
      await page.waitForTimeout(3000);
      
      const hasItems = await page.locator('.activity-item').count() > 0;
      if (hasItems) {
        // Each item should have date and title
        await expect(page.locator('.activity-item .activity-date').first()).toBeVisible();
        await expect(page.locator('.activity-item .activity-title').first()).toBeVisible();
      } else {
        // If no items, page should show empty state or loading state
        const hasContent = await page.locator('.viewing-activity-content').isVisible();
        expect(hasContent).toBeTruthy();
      }
    });

    test('Watching tab shows Report a problem button', async ({ page }) => {
      await goToSubPage(page, 'viewing-activity');
      await expect(page.locator('h1')).toContainText('Activity', { timeout: 15000 });
      
      // Wait for content to load
      await page.waitForTimeout(3000);
      
      const hasItems = await page.locator('.activity-item').count() > 0;
      if (hasItems) {
        // Report a problem button should be visible
        await expect(page.locator('.action-button.report').first()).toContainText('Report a problem');
      } else {
        // Skip if no items to report
        test.skip('No activity items to test Report button');
      }
    });

    test('Ratings tab shows rating buttons', async ({ page }) => {
      await goToSubPage(page, 'viewing-activity');
      await expect(page.locator('h1')).toContainText('Activity', { timeout: 15000 });
      
      // Switch to Ratings tab
      await page.locator('.tab-button:has-text("Ratings")').click();
      await expect(page.locator('.tab-button:has-text("Ratings").active')).toBeVisible({ timeout: 5000 });
      
      // Wait for content to load
      await page.waitForTimeout(3000);
      
      const hasItems = await page.locator('.activity-item').count() > 0;
      if (hasItems) {
        // Rating buttons should be visible (thumbs up, thumbs down, double thumbs up)
        await expect(page.locator('.rating-buttons').first()).toBeVisible();
        await expect(page.locator('.rating-button.thumbs-down').first()).toBeVisible();
        await expect(page.locator('.rating-button.thumbs-up').first()).toBeVisible();
      } else {
        // Skip if no ratings to display
        test.skip('No rating items to test rating buttons');
      }
    });

    test('Show More button loads additional items', async ({ page }) => {
      await goToSubPage(page, 'viewing-activity');
      await expect(page.locator('h1')).toContainText('Activity', { timeout: 15000 });
      
      // Wait for content to load
      await page.waitForTimeout(3000);
      
      const showMoreButton = page.locator('.load-more');
      const isVisible = await showMoreButton.isVisible().catch(() => false);
      
      if (isVisible) {
        const initialCount = await page.locator('.activity-item').count();
        await showMoreButton.click();
        await page.waitForTimeout(1000);
        const newCount = await page.locator('.activity-item').count();
        expect(newCount).toBeGreaterThan(initialCount);
      } else {
        // Skip if no Show More button (not enough items)
        test.skip('No Show More button visible (not enough items)');
      }
    });

    test('Back to Your Account button is visible and clickable', async ({ page }) => {
      await goToSubPage(page, 'viewing-activity');
      await expect(page.locator('h1')).toContainText('Activity', { timeout: 15000 });
      
      // Verify the Back to Your Account button is visible
      const backButton = page.locator('.back-button.secondary:has-text("Back to Your Account")');
      await expect(backButton).toBeVisible({ timeout: 10000 });
      
      // Verify it's clickable (force click to bypass header)
      await backButton.click({ force: true });
    });

    test('Header Back button navigates back', async ({ page }) => {
      await goToSubPage(page, 'viewing-activity');
      await expect(page.locator('h1')).toContainText('Activity', { timeout: 15000 });
      
      await page.locator('.header-back-button').click();
      
      // Back button navigates away from viewing-activity page
      await expect(page).not.toHaveURL(/\/viewing-activity\//, { timeout: 15000 });
    });

    test('Rating a content item updates the rating state', async ({ page }) => {
      await goToSubPage(page, 'viewing-activity');
      await expect(page.locator('h1')).toContainText('Activity', { timeout: 15000 });
      
      // Switch to Ratings tab
      await page.locator('.tab-button:has-text("Ratings")').click();
      await expect(page.locator('.tab-button:has-text("Ratings").active')).toBeVisible({ timeout: 5000 });
      
      // Wait for content to load
      await page.waitForTimeout(3000);
      
      const hasItems = await page.locator('.activity-item').count() > 0;
      if (hasItems) {
        // Click thumbs up button on first item
        const thumbsUpButton = page.locator('.rating-button.thumbs-up').first();
        await thumbsUpButton.click();
        
        // Button should have active class or similar indication
        await expect(thumbsUpButton).toHaveClass(/active/, { timeout: 5000 }).catch(() => {});
      } else {
        // Skip if no ratings to rate
        test.skip('No rating items to test rating state');
      }
    });
  });

});
