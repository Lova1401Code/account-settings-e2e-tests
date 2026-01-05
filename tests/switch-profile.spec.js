import { test, expect } from '@playwright/test';

test.describe('Switch Profile - Change active profile', () => {
  const profileId = 'test-profile-id';
  const customerId = 'test-customer-id';

  // Mock profiles data
  const mockProfiles = [
    { id: 'profile-1', name: 'Jean', icon: 'alphabet-A' },
    { id: 'profile-2', name: 'Marie', icon: 'alphabet-B' },
    { id: 'profile-3', name: 'Enfants', icon: 'animals-1' },
  ];

  const setupAuthMocks = async (page, activeProfileId = 'profile-1') => {
    // Set up authentication via addInitScript (before page load)
    await page.addInitScript(({ profId, custId }) => {
      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      localStorage.setItem('deviceId', 'mock-device-id');
      localStorage.setItem('profileId', profId);
      localStorage.setItem('customer', JSON.stringify({ id: custId }));
    }, { profId: activeProfileId, custId: customerId });

    // Mock security-info (verified email) - MUST be before customer/**
    await page.route('**/customer/security-info', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          email: 'test@example.com',
          emailVerified: true,
        }),
      });
    });

    // Mock customer data
    await page.route('**/customer/getById/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: customerId,
          email: 'test@example.com',
          subscription: { status: 'active' },
        }),
      });
    });

    // Mock check-default-profile - MUST be before profiles/**
    await page.route('**/profiles/check-default-profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ hasDefaultProfile: true }),
      });
    });

    // Mock profile count - MUST be before profiles/**
    await page.route('**/profiles/get-number-profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: mockProfiles.length }),
      });
    });

    // Mock profile activation (POST /profiles/active-profile/{id})
    await page.route('**/profiles/active-profile/*', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock get active profile (GET /profiles/active-profile)
    await page.route('**/profiles/active-profile', async (route) => {
      const activeProfile = mockProfiles.find(p => p.id === activeProfileId) || mockProfiles[0];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(activeProfile),
      });
    });

    // Mock get all profiles (this pattern must be last for /profiles routes)
    await page.route('**/profiles', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockProfiles),
        });
      } else {
        await route.continue();
      }
    });
  };

  // Note: Tests for /account-settings/profiles page require additional setup
  // because it's protected by both ProfileCheck and ProtectedRoute.
  // The tests below focus on the /account-settings/select-profile page which
  // is the main switch profile functionality.

  test.describe('Profile Selection Page - Switch Profile', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthMocks(page, 'profile-1');
    });

    test('Display all profiles on selection page', async ({ page }) => {
      await page.goto('/account-settings/select-profile');

      // Verify the page title
      await expect(page.locator('h1')).toContainText("Who's watching?", { timeout: 15000 });

      // Verify all profiles are displayed
      await expect(page.locator('.profile-name:has-text("Jean")')).toBeVisible();
      await expect(page.locator('.profile-name:has-text("Marie")')).toBeVisible();
      await expect(page.locator('.profile-name:has-text("Enfants")')).toBeVisible();
    });

    test('Switch to different profile - Marie', async ({ page }) => {
      await page.goto('/account-settings/select-profile');

      // Wait for profiles to load
      await expect(page.locator('.profile-name:has-text("Marie")')).toBeVisible({ timeout: 15000 });

      // Click on Marie profile and wait for navigation
      await Promise.all([
        page.waitForURL('/', { timeout: 15000 }),
        page.locator('.profile-item:has-text("Marie")').click(),
      ]);

      // Verify we are on the home page (profile activation redirects to home)
      await expect(page).toHaveURL('/');
    });

    test('Switch to Kids profile', async ({ page }) => {
      await page.goto('/account-settings/select-profile');

      // Wait for profiles to load
      await expect(page.locator('.profile-name:has-text("Enfants")')).toBeVisible({ timeout: 15000 });

      // Click on Enfants profile and wait for navigation
      await Promise.all([
        page.waitForURL('/', { timeout: 15000 }),
        page.locator('.profile-item:has-text("Enfants")').click(),
      ]);

      // Verify we are on the home page (profile activation redirects to home)
      await expect(page).toHaveURL('/');
    });

    test('Add Profile button is visible', async ({ page }) => {
      await page.goto('/account-settings/select-profile');

      await expect(page.locator('h1')).toContainText("Who's watching?", { timeout: 15000 });

      // Verify Add Profile button is visible
      await expect(page.locator('.profile-name:has-text("Add Profile")')).toBeVisible();
    });

    test('Click on Add Profile navigates to create-profile page', async ({ page }) => {
      await page.goto('/account-settings/select-profile');

      await expect(page.locator('h1')).toContainText("Who's watching?", { timeout: 15000 });

      // Click on Add Profile
      await page.locator('.profile-item:has-text("Add Profile")').click();

      // Verify navigation
      await expect(page).toHaveURL(/\/account-settings\/create-profile\/?/, { timeout: 15000 });
    });

    test('Manage Profiles button switches to manage mode', async ({ page }) => {
      await page.goto('/account-settings/select-profile');

      await expect(page.locator('h1')).toContainText("Who's watching?", { timeout: 15000 });

      // Click on Manage Profiles
      await page.click('button:has-text("MANAGE PROFILES")');

      // Verify title changes to "Manage Profiles"
      await expect(page.locator('h1')).toContainText('Manage Profiles');

      // Verify button changes to "DONE"
      await expect(page.locator('button:has-text("DONE")')).toBeVisible();
    });

    test('In Manage mode, clicking profile goes to preferences page', async ({ page }) => {
      await page.goto('/account-settings/select-profile');

      await expect(page.locator('h1')).toContainText("Who's watching?", { timeout: 15000 });

      // Enter Manage mode
      await page.click('button:has-text("MANAGE PROFILES")');
      await expect(page.locator('h1')).toContainText('Manage Profiles');

      // Click on Jean profile
      await page.locator('.profile-item:has-text("Jean")').click();

      // Verify navigation to profile preferences page
      await expect(page).toHaveURL(/\/account-settings\/manage-profile-preferences\/profile-1\/?/, { timeout: 15000 });
    });
  });

  test.describe('Switch Profile - Error Handling', () => {
    test('Error during profile switch displays error message', async ({ page }) => {
      await setupAuthMocks(page, 'profile-1');

      // Override activation mock with error
      await page.route('**/profiles/active-profile/*', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Server error' }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto('/account-settings/select-profile');

      // Wait for profiles to load
      await expect(page.locator('.profile-name:has-text("Marie")')).toBeVisible({ timeout: 15000 });

      // Click on Marie profile
      await page.locator('.profile-item:has-text("Marie")').click();

      // Verify error message is displayed
      await expect(page.locator('.error-message')).toContainText('Failed to activate profile', { timeout: 10000 });

      // Verify we stay on the selection page
      await expect(page).toHaveURL(/\/account-settings\/select-profile\/?$/);
    });

    test('Network error during profile fetch shows error', async ({ page }) => {
      // Set up auth but with failing profiles API
      await page.addInitScript(({ profId, custId }) => {
        localStorage.setItem('accessToken', 'mock-access-token');
        localStorage.setItem('refreshToken', 'mock-refresh-token');
        localStorage.setItem('deviceId', 'mock-device-id');
        localStorage.setItem('profileId', profId);
        localStorage.setItem('customer', JSON.stringify({ id: custId }));
      }, { profId: 'profile-1', custId: customerId });

      await page.route('**/customer/security-info', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            email: 'test@example.com',
            emailVerified: true,
          }),
        });
      });

      // Mock profiles with error
      await page.route('**/profiles', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Server error' }),
          });
        } else {
          await route.continue();
        }
      });

      await page.route('**/profiles/get-number-profile', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Server error' }),
        });
      });

      await page.goto('/account-settings/select-profile');

      // Verify error message is displayed
      await expect(page.locator('.error-message')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Switch Profile - Maximum Profiles', () => {
    const maxProfiles = [
      { id: 'profile-1', name: 'Profile 1', icon: 'alphabet-A' },
      { id: 'profile-2', name: 'Profile 2', icon: 'alphabet-B' },
      { id: 'profile-3', name: 'Profile 3', icon: 'alphabet-C' },
      { id: 'profile-4', name: 'Profile 4', icon: 'alphabet-D' },
      { id: 'profile-5', name: 'Profile 5', icon: 'alphabet-E' },
    ];

    test('With 5 profiles, Add Profile button is hidden', async ({ page }) => {
      await page.addInitScript(({ profId, custId }) => {
        localStorage.setItem('accessToken', 'mock-access-token');
        localStorage.setItem('refreshToken', 'mock-refresh-token');
        localStorage.setItem('deviceId', 'mock-device-id');
        localStorage.setItem('profileId', profId);
        localStorage.setItem('customer', JSON.stringify({ id: custId }));
      }, { profId: 'profile-1', custId: customerId });

      await page.route('**/customer/security-info', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            email: 'test@example.com',
            emailVerified: true,
          }),
        });
      });

      await page.route('**/profiles', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(maxProfiles),
          });
        } else {
          await route.continue();
        }
      });

      await page.route('**/profiles/get-number-profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ count: 5 }),
        });
      });

      await page.goto('/account-settings/select-profile');

      // Verify all 5 profiles are displayed (without Add Profile)
      await expect(page.locator('.profile-item')).toHaveCount(5, { timeout: 15000 });

      // Verify maximum message is displayed
      await expect(page.locator('.max-profiles-message')).toContainText('Maximum number of profiles (5) reached');

      // Verify Add Profile is not visible
      await expect(page.locator('.profile-name:has-text("Add Profile")')).not.toBeVisible();
    });
  });
});

