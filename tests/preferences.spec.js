import { test, expect } from '@playwright/test';

test.describe('Preferences Menu', () => {
  const customerId = 'test-customer-id';
  const profileId = 'test-profile-id';

  const mockProfile = {
    id: profileId,
    name: 'Test Profile',
    icon: 'alphabet-A',
    email: 'profile@example.com',
    notifyWhatYouWatch: true,
    notifyWatchRecommendations: false,
    notifyMembershipOffers: true,
    notifyAccountUpdates: false,
    notifyNewSeasonsEpisodes: true,
  };

  const mockWatchHistory = {
    data: [
      { id: 'w1', movie: { title: 'Test Movie 1' }, lastWatched: '2024-01-15', contentType: 'movie', progress: 50 },
      { id: 'w2', serie: { name: 'Test Series 1' }, lastWatched: '2024-01-14', contentType: 'series', progress: 100 },
    ],
    total: 2,
    page: 1,
  };

  const mockRatingHistory = {
    likes: [
      { id: 'r1', movie: { title: 'Rated Movie 1' }, value: 1, createdAt: '2024-01-15' },
      { id: 'r2', serie: { name: 'Rated Series 1' }, value: 2, createdAt: '2024-01-14' },
    ],
  };

  const setupAuthMocks = async (page, profileData = mockProfile) => {
    // Navigate to login first to have context for localStorage
    await page.goto('/account-settings/login');

    // Configure localStorage
    await page.evaluate(({ profId, custId }) => {
      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      localStorage.setItem('deviceId', 'mock-device-id');
      localStorage.setItem('profileId', profId);
      localStorage.setItem('customer', JSON.stringify({ id: custId }));
    }, { profId: profileId, custId: customerId });

    // Mock all API routes in one handler to avoid LIFO conflicts
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();

      // Customer routes
      if (url.includes('/customer/getById/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: customerId,
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
          }),
        });
        return;
      }

      if (url.includes('/customer/security-info')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            email: 'test@example.com',
            emailVerified: true,
          }),
        });
        return;
      }

      // Profile routes
      if (url.includes('/profiles/check-default-profile')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ hasDefaultProfile: true }),
        });
        return;
      }

      if (url.includes('/profiles/active-profile')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(profileData),
        });
        return;
      }

      if (url.includes('/profiles/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(profileData),
        });
        return;
      }

      // Activity routes
      if (url.includes('/activity/watch-history')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockWatchHistory),
        });
        return;
      }

      if (url.includes('/activity/liked-all')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockRatingHistory),
        });
        return;
      }

      // Default: continue with original request
      await route.continue();
    });
  };

  test.describe('Preferences Page - Display', () => {
    test('Display Preferences page with all menu items', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto('/account-settings/preferences');

      // Verify all preference options are displayed (using .link-title for specificity)
      await expect(page.locator('.link-title:has-text("Languages")')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('.link-title:has-text("Subtitle appearance")')).toBeVisible();
      await expect(page.locator('.link-title:has-text("Playback settings")')).toBeVisible();
      await expect(page.locator('.link-title:has-text("Notification settings")')).toBeVisible();
      await expect(page.locator('.link-title:has-text("Viewing activity")')).toBeVisible();
      await expect(page.locator('.link-title:has-text("Privacy and data settings")')).toBeVisible();
    });

    test('Click on Languages navigates to language settings', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto('/account-settings/preferences');

      await expect(page.locator('.link-title:has-text("Languages")')).toBeVisible({ timeout: 15000 });

      // Click on Languages
      await page.locator('.link-card:has-text("Set languages for display")').click();

      // Verify navigation
      await expect(page).toHaveURL(/\/account-settings\/languages\//, { timeout: 15000 });
    });

    test('Click on Subtitle appearance navigates correctly', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto('/account-settings/preferences');

      await expect(page.locator('.link-title:has-text("Subtitle appearance")')).toBeVisible({ timeout: 15000 });

      // Click on Subtitle appearance
      await page.locator('.link-card:has-text("Customize subtitle look")').click();

      // Verify navigation
      await expect(page).toHaveURL(/\/account-settings\/subtitle-appearance\//, { timeout: 15000 });
    });

    test('Click on Playback settings navigates correctly', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto('/account-settings/preferences');

      await expect(page.locator('.link-title:has-text("Playback settings")')).toBeVisible({ timeout: 15000 });

      // Click on Playback settings
      await page.locator('.link-card:has-text("Set autoplay and audio")').click();

      // Verify navigation
      await expect(page).toHaveURL(/\/account-settings\/playback-settings\//, { timeout: 15000 });
    });

    test('Click on Notification settings navigates correctly', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto('/account-settings/preferences');

      await expect(page.locator('.link-title:has-text("Notification settings")')).toBeVisible({ timeout: 15000 });

      // Click on Notification settings
      await page.locator('.link-card:has-text("Manage email, text, and push")').click();

      // Verify navigation
      await expect(page).toHaveURL(/\/account-settings\/notification-settings\//, { timeout: 15000 });
    });

    test('Click on Viewing activity navigates correctly', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto('/account-settings/preferences');

      await expect(page.locator('.link-title:has-text("Viewing activity")')).toBeVisible({ timeout: 15000 });

      // Click on Viewing activity
      await page.locator('.link-card:has-text("Manage viewing history")').click();

      // Verify navigation
      await expect(page).toHaveURL(/\/account-settings\/viewing-activity\//, { timeout: 15000 });
    });

    test('Click on Privacy and data settings navigates correctly', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto('/account-settings/preferences');

      await expect(page.locator('.link-title:has-text("Privacy and data settings")')).toBeVisible({ timeout: 15000 });

      // Click on Privacy settings
      await page.locator('.link-card:has-text("Manage usage of personal info")').click();

      // Verify navigation
      await expect(page).toHaveURL(/\/account-settings\/privacy-settings\//, { timeout: 15000 });
    });
  });

  test.describe('Subtitle Appearance Page', () => {
    test('Display Subtitle Appearance page with all options', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/subtitle-appearance/${profileId}`);

      // Verify page title
      await expect(page.locator('h1')).toContainText('Subtitle Appearance', { timeout: 15000 });

      // Verify all settings are displayed
      await expect(page.getByText('Font Family')).toBeVisible();
      await expect(page.getByText('Font Size')).toBeVisible();
      await expect(page.getByText('Text Color')).toBeVisible();
      await expect(page.getByText('Shadow Type')).toBeVisible();
      await expect(page.getByText('Background Color')).toBeVisible();
      await expect(page.getByText('Window Color')).toBeVisible();
    });

    test('Change font family setting', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/subtitle-appearance/${profileId}`);

      await expect(page.locator('h1')).toContainText('Subtitle Appearance', { timeout: 15000 });

      // Change font family
      await page.selectOption('select[name="fontFamily"]', 'Arial');

      // Verify selection changed
      await expect(page.locator('select[name="fontFamily"]')).toHaveValue('Arial');
    });

    test('Change font size setting', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/subtitle-appearance/${profileId}`);

      await expect(page.locator('h1')).toContainText('Subtitle Appearance', { timeout: 15000 });

      // Change font size
      await page.selectOption('select[name="fontSize"]', 'large');

      // Verify selection changed
      await expect(page.locator('select[name="fontSize"]')).toHaveValue('large');
    });

    test('Save Changes button enabled after changes', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/subtitle-appearance/${profileId}`);

      await expect(page.locator('h1')).toContainText('Subtitle Appearance', { timeout: 15000 });

      // Initially Save Changes should be disabled
      await expect(page.locator('button[type="submit"]')).toBeDisabled();

      // Make a change
      await page.selectOption('select[name="fontSize"]', 'large');

      // Now Save Changes should be enabled
      await expect(page.locator('button[type="submit"]')).toBeEnabled();
    });

    test('Reset to Default button works', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/subtitle-appearance/${profileId}`);

      await expect(page.locator('h1')).toContainText('Subtitle Appearance', { timeout: 15000 });

      // Make some changes
      await page.selectOption('select[name="fontSize"]', 'large');
      await page.selectOption('select[name="fontFamily"]', 'Arial');

      // Click Reset to Default
      await page.click('button:has-text("Reset to Default")');

      // Verify values are reset
      await expect(page.locator('select[name="fontFamily"]')).toHaveValue('Netflix Sans');
      await expect(page.locator('select[name="fontSize"]')).toHaveValue('medium');
    });

    test('Preview text updates with settings', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/subtitle-appearance/${profileId}`);

      await expect(page.locator('h1')).toContainText('Subtitle Appearance', { timeout: 15000 });

      // Verify preview text is visible
      await expect(page.getByText('Sample subtitle text for preview')).toBeVisible();
    });
  });

  test.describe('Playback Settings Page', () => {
    test('Display Playback Settings page with all options', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/playback-settings/${profileId}`);

      // Verify page title
      await expect(page.locator('h1')).toContainText('Playback Settings', { timeout: 15000 });

      // Verify sections are displayed
      await expect(page.getByText('Autoplay Controls')).toBeVisible();
      await expect(page.getByText('Data Usage per Screen')).toBeVisible();
    });

    test('Toggle autoplay next episode', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/playback-settings/${profileId}`);

      await expect(page.locator('h1')).toContainText('Playback Settings', { timeout: 15000 });

      // Get initial state
      const autoplayNextCheckbox = page.locator('#autoplayNext');
      const initialState = await autoplayNextCheckbox.isChecked();

      // Toggle the checkbox
      await autoplayNextCheckbox.click();

      // Verify state changed
      const newState = await autoplayNextCheckbox.isChecked();
      expect(newState).toBe(!initialState);
    });

    test('Toggle autoplay previews', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/playback-settings/${profileId}`);

      await expect(page.locator('h1')).toContainText('Playback Settings', { timeout: 15000 });

      // Get initial state
      const autoplayPreviewsCheckbox = page.locator('#autoplayPreviews');
      const initialState = await autoplayPreviewsCheckbox.isChecked();

      // Toggle the checkbox
      await autoplayPreviewsCheckbox.click();

      // Verify state changed
      const newState = await autoplayPreviewsCheckbox.isChecked();
      expect(newState).toBe(!initialState);
    });

    test('Change data usage setting', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/playback-settings/${profileId}`);

      await expect(page.locator('h1')).toContainText('Playback Settings', { timeout: 15000 });

      // Change data usage
      await page.selectOption('select[name="dataUsage"]', 'high');

      // Verify selection and description changed
      await expect(page.locator('select[name="dataUsage"]')).toHaveValue('high');
      await expect(page.getByText('Best quality, uses more data')).toBeVisible();
    });

    test('Save Changes shows success message', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/playback-settings/${profileId}`);

      await expect(page.locator('h1')).toContainText('Playback Settings', { timeout: 15000 });

      // Make a change
      await page.locator('#autoplayNext').click();

      // Click Save Changes
      await page.click('button[type="submit"]');

      // Verify success message
      await expect(page.getByText('Playback settings saved successfully')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Notification Settings Page', () => {
    test('Display Notification Settings page', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/notification-settings/${profileId}`);

      // Verify page title
      await expect(page.locator('h1')).toContainText('Notification Settings', { timeout: 15000 });

      // Verify sections are displayed (use h2, h3 for specificity)
      await expect(page.locator('h2:has-text("What to Watch")')).toBeVisible();
      await expect(page.locator('.notification-type h3:has-text("Email")')).toBeVisible();
      await expect(page.locator('.notification-type h3:has-text("Push notifications")')).toBeVisible();
    });

    test('Display email status when profile has email', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/notification-settings/${profileId}`);

      await expect(page.locator('h1')).toContainText('Notification Settings', { timeout: 15000 });

      // Verify email is shown as active
      await expect(page.getByText('Active (profile@example.com)')).toBeVisible();
    });

    test('Display push notification status', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/notification-settings/${profileId}`);

      await expect(page.locator('h1')).toContainText('Notification Settings', { timeout: 15000 });

      // Verify push notification status (should be Active since some are true in mockProfile)
      await expect(page.locator('.notification-type:has-text("Push notifications") .status-text')).toContainText('Active');
    });

    test('Click Manage Push Notifications navigates correctly', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/notification-settings/${profileId}`);

      await expect(page.locator('h1')).toContainText('Notification Settings', { timeout: 15000 });

      // Click Manage Push Notifications
      await page.click('button:has-text("Manage Push Notifications")');

      // Verify navigation
      await expect(page).toHaveURL(/\/account-settings\/manage-push-notifications\//, { timeout: 15000 });
    });

    test('Click Change Email button navigates correctly', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/notification-settings/${profileId}`);

      await expect(page.locator('h1')).toContainText('Notification Settings', { timeout: 15000 });

      // Click Change Email
      await page.click('button:has-text("Change Email")');

      // Verify navigation
      await expect(page).toHaveURL(/\/account-settings\/manage-emails\//, { timeout: 15000 });
    });
  });

  test.describe('Viewing Activity Page', () => {
    test('Display Viewing Activity page with tabs', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/viewing-activity/${profileId}`);

      // Verify page title with profile name
      await expect(page.locator('h1.activity')).toContainText('Activity for Test Profile', { timeout: 15000 });

      // Verify tabs are displayed
      await expect(page.locator('.tab-button:has-text("Watching")')).toBeVisible();
      await expect(page.locator('.tab-button:has-text("Ratings")')).toBeVisible();
    });

    test('Display watch history in Watching tab', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/viewing-activity/${profileId}`);

      await expect(page.locator('h1.activity')).toContainText('Activity for Test Profile', { timeout: 15000 });

      // Verify Watching tab is active by default
      await expect(page.locator('.tab-button.active:has-text("Watching")')).toBeVisible();

      // Verify watch history items are displayed
      await expect(page.getByText('Test Movie 1')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Test Series 1')).toBeVisible();
    });

    test('Switch to Ratings tab', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/viewing-activity/${profileId}`);

      await expect(page.locator('h1.activity')).toContainText('Activity for Test Profile', { timeout: 15000 });

      // Click Ratings tab
      await page.locator('.tab-button:has-text("Ratings")').click();

      // Verify Ratings tab is now active
      await expect(page.locator('.tab-button.active:has-text("Ratings")')).toBeVisible();

      // Verify rating items are displayed
      await expect(page.getByText('Rated Movie 1')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Rated Series 1')).toBeVisible();
    });

    test('Report a problem button visible in Watching tab', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/viewing-activity/${profileId}`);

      await expect(page.locator('h1.activity')).toContainText('Activity for Test Profile', { timeout: 15000 });

      // Verify Report a problem button is visible
      await expect(page.locator('button:has-text("Report a problem")').first()).toBeVisible({ timeout: 10000 });
    });

    test('Rating buttons visible in Ratings tab', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/viewing-activity/${profileId}`);

      await expect(page.locator('h1.activity')).toContainText('Activity for Test Profile', { timeout: 15000 });

      // Switch to Ratings tab
      await page.locator('.tab-button:has-text("Ratings")').click();

      // Verify rating buttons are visible
      await expect(page.locator('.rating-buttons').first()).toBeVisible({ timeout: 10000 });
    });

    test('Back to Your Account button is visible and clickable', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/viewing-activity/${profileId}`);

      await expect(page.locator('h1.activity')).toContainText('Activity for Test Profile', { timeout: 15000 });

      // Verify Back to Your Account button is visible
      const backButton = page.locator('button:has-text("Back to Your Account")');
      await expect(backButton).toBeVisible();
      await expect(backButton).toBeEnabled();
    });
  });

  test.describe('Privacy Settings Page', () => {
    test('Display Privacy Settings page', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/privacy-settings/${profileId}`);

      // Verify page title
      await expect(page.locator('h1')).toContainText('Privacy Settings', { timeout: 15000 });

      // Verify sections are displayed
      await expect(page.getByText('Profile Privacy')).toBeVisible();
      await expect(page.getByText('Data Privacy')).toBeVisible();
    });

    test('PIN Lock toggle is displayed', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/privacy-settings/${profileId}`);

      await expect(page.locator('h1')).toContainText('Privacy Settings', { timeout: 15000 });

      // Verify PIN Lock is displayed
      await expect(page.getByText('PIN Lock')).toBeVisible();
      await expect(page.getByText('Require a PIN to access this profile')).toBeVisible();
    });

    test('Data sharing checkbox is displayed and clickable', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/privacy-settings/${profileId}`);

      await expect(page.locator('h1')).toContainText('Privacy Settings', { timeout: 15000 });

      // Verify data sharing checkbox is displayed
      const checkbox = page.locator('.checkbox-group input[type="checkbox"]');
      await expect(checkbox).toBeVisible();

      // Toggle the checkbox
      const initialState = await checkbox.isChecked();
      await checkbox.click();
      const newState = await checkbox.isChecked();
      expect(newState).toBe(!initialState);
    });

    test('Manage viewing activity link works', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto(`/account-settings/privacy-settings/${profileId}`);

      await expect(page.locator('h1')).toContainText('Privacy Settings', { timeout: 15000 });

      // Click on Manage viewing activity link
      await page.click('a:has-text("Manage viewing activity")');

      // Verify navigation
      await expect(page).toHaveURL(/\/account-settings\/viewing-activity\//, { timeout: 15000 });
    });
  });
});

