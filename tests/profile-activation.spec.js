import { test, expect } from '@playwright/test';

test.describe('Profile Activation', () => {

  test.beforeEach(async ({ page }) => {
    // Set up authentication tokens before each test
    await page.goto('/account-settings/login'); // Go to a page to access localStorage
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      localStorage.setItem('deviceId', 'mock-device-id');
    });
  });

  test('Display profile selection page with list of profiles', async ({ page }) => {
    // Mock APIs
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
          body: JSON.stringify([
            { id: 'profile-1', name: 'Jean', icon: 'alphabet-A' },
            { id: 'profile-2', name: 'Marie', icon: 'alphabet-B' },
            { id: 'profile-3', name: 'Enfants', icon: 'animals-1' },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/profiles/get-number-profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 3 }),
      });
    });

    // Go to profile selection page
    await page.goto('/account-settings/select-profile');

    // Verify the title
    await expect(page.locator('h1')).toContainText("Who's watching?");

    // Verify that the 3 profiles are displayed
    await expect(page.locator('.profile-item')).toHaveCount(4); // 3 profiles + 1 "Add Profile"

    // Verify profile names
    await expect(page.locator('.profile-name:has-text("Jean")')).toBeVisible();
    await expect(page.locator('.profile-name:has-text("Marie")')).toBeVisible();
    await expect(page.locator('.profile-name:has-text("Enfants")')).toBeVisible();

    // Verify that the "Add Profile" button is visible
    await expect(page.locator('.profile-name:has-text("Add Profile")')).toBeVisible();

    // Verify the "Manage Profiles" button
    await expect(page.locator('button:has-text("MANAGE PROFILES")')).toBeVisible();
  });

  test('Click on a profile → activation and redirection to home page', async ({ page }) => {
    // Mock APIs
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
          body: JSON.stringify([
            { id: 'profile-1', name: 'Jean', icon: 'alphabet-A' },
            { id: 'profile-2', name: 'Marie', icon: 'alphabet-B' },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/profiles/get-number-profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 2 }),
      });
    });

    // Mock profile activation
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

    // Go to profile selection page
    await page.goto('/account-settings/select-profile');

    // Wait for profiles to load
    await expect(page.locator('.profile-name:has-text("Jean")')).toBeVisible();

    // Click on the "Jean" profile and wait for navigation
    await Promise.all([
      page.waitForURL('/', { timeout: 15000 }),
      page.locator('.profile-item:has-text("Jean")').click(),
    ]);

    // Verify we are on the home page
    await expect(page).toHaveURL('/');
  });

  test('Activation of another profile (Marie)', async ({ page }) => {
    // Mock APIs
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
          body: JSON.stringify([
            { id: 'profile-1', name: 'Jean', icon: 'alphabet-A' },
            { id: 'profile-2', name: 'Marie', icon: 'alphabet-B' },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/profiles/get-number-profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 2 }),
      });
    });

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

    await page.goto('/account-settings/select-profile');

    // Wait for profiles to load
    await expect(page.locator('.profile-name:has-text("Marie")')).toBeVisible();

    // Click on the "Marie" profile and wait for navigation
    await Promise.all([
      page.waitForURL('/', { timeout: 15000 }),
      page.locator('.profile-item:has-text("Marie")').click(),
    ]);

    // Verify we are on the home page
    await expect(page).toHaveURL('/');

    // Verify that the correct profile ID is saved (after navigation)
    await page.waitForFunction(() => localStorage.getItem('profileId') === 'profile-2', { timeout: 5000 });
  });

  test('"Manage Profiles" mode → click on profile redirects to management page', async ({ page }) => {
    // Mock APIs
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
          body: JSON.stringify([
            { id: 'profile-1', name: 'Jean', icon: 'alphabet-A' },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/profiles/get-number-profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 1 }),
      });
    });

    await page.goto('/account-settings/select-profile');

    // Wait for profile to load
    await expect(page.locator('.profile-name:has-text("Jean")')).toBeVisible();

    // Click on "Manage Profiles"
    await page.click('button:has-text("MANAGE PROFILES")');

    // Verify that the title changes
    await expect(page.locator('h1')).toContainText('Manage Profiles');

    // Verify that the button becomes "DONE"
    await expect(page.locator('button:has-text("DONE")')).toBeVisible();

    // Click on the profile in management mode
    await page.locator('.profile-item:has-text("Jean")').click();

    // Verify redirection to profile management page
    await page.waitForURL(/\/account-settings\/manage-profile-preferences\/profile-1/);
  });

  test('Maximum 5 profiles reached → message displayed and no "Add Profile" button', async ({ page }) => {
    // Mock APIs
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
          body: JSON.stringify([
            { id: 'profile-1', name: 'Profil 1', icon: 'alphabet-A' },
            { id: 'profile-2', name: 'Profil 2', icon: 'alphabet-B' },
            { id: 'profile-3', name: 'Profil 3', icon: 'alphabet-C' },
            { id: 'profile-4', name: 'Profil 4', icon: 'alphabet-D' },
            { id: 'profile-5', name: 'Profil 5', icon: 'alphabet-E' },
          ]),
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

    // Verify that the 5 profiles are displayed (without "Add Profile")
    await expect(page.locator('.profile-item')).toHaveCount(5);

    // Verify the maximum reached message
    await expect(page.locator('.max-profiles-message')).toContainText('Maximum number of profiles (5) reached');

    // Verify that "Add Profile" is not visible
    await expect(page.locator('.profile-name:has-text("Add Profile")')).not.toBeVisible();
  });

  test('Error during profile activation → error message displayed', async ({ page }) => {
    // Mock APIs
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
          body: JSON.stringify([
            { id: 'profile-1', name: 'Jean', icon: 'alphabet-A' },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/profiles/get-number-profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 1 }),
      });
    });

    // Mock activation with error
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

    // Wait for profile to load
    await expect(page.locator('.profile-name:has-text("Jean")')).toBeVisible();

    // Click on the profile
    await page.locator('.profile-item:has-text("Jean")').click();

    // Verify that the error message is displayed
    await expect(page.locator('.error-message')).toContainText('Failed to activate profile');

    // Verify we are still on the selection page (accepts with or without trailing slash)
    await expect(page).toHaveURL(/\/account-settings\/select-profile\/?$/);
  });

});

