import { test, expect } from '@playwright/test';

test.describe('Device management - View and disconnect devices', () => {
  const mockDevices = [
    {
      id: 'device-1',
      name: 'Chrome on Windows',
      isCurrent: true,
      lastLogin: new Date().toISOString(),
      ProfileDeviceHistory: [{ profile: { name: 'Jean' } }],
    },
    {
      id: 'device-2',
      name: 'Safari on iPhone',
      isCurrent: false,
      lastLogin: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      ProfileDeviceHistory: [{ profile: { name: 'Marie' } }],
    },
    {
      id: 'device-3',
      name: 'Firefox on Mac',
      isCurrent: false,
      lastLogin: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      ProfileDeviceHistory: [{ profile: { name: 'Jean' } }],
    },
  ];

  test.beforeEach(async ({ page }) => {
    // Navigate to login to have a context
    await page.goto('/account-settings/login');
    
    // Configure localStorage
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      localStorage.setItem('deviceId', 'device-1');
      localStorage.setItem('profileId', 'test-profile-id');
    });

    // Mock security-info (verified email) - required by ProtectedRoute
    await page.route('**/customer/security-info', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          emailVerified: true,
          twoFactorEnabled: false,
        }),
      });
    });

    // Mock active-profile - required by ProtectedRoute
    await page.route('**/profiles/active-profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-profile-id',
          name: 'Jean',
          icon: 'alphabet-A',
        }),
      });
    });

    // Mock check-default-profile - required by ProfileCheck
    await page.route('**/profiles/check-default-profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ hasDefaultProfile: true }),
      });
    });
  });

  test('Display of the device list', async ({ page }) => {
    // Mock the device list
    await page.route('**/devices/device**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          devices: mockDevices,
          totalPages: 1,
          currentPage: 1,
        }),
      });
    });

    await page.goto('/account-settings/manage-access');

    // Verify the page title
    await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

    // Verify that all devices are displayed
    const deviceCards = page.locator('.device-card');
    await expect(deviceCards).toHaveCount(3, { timeout: 10000 });

    // Verify the current device
    await expect(page.locator('.device-name').first()).toContainText('Chrome on Windows');
    await expect(page.locator('.device-label')).toContainText('CURRENT DEVICE');

    // Verify the other devices
    await expect(page.locator('.device-name').nth(1)).toContainText('Safari on iPhone');
    await expect(page.locator('.device-name').nth(2)).toContainText('Firefox on Mac');
  });

  test('Current device does not have a Sign Out button', async ({ page }) => {
    await page.route('**/devices/device**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          devices: mockDevices,
          totalPages: 1,
        }),
      });
    });

    await page.goto('/account-settings/manage-access');

    await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

    // The first device (current) should not have a Sign Out button
    const firstDeviceCard = page.locator('.device-card').first();
    await expect(firstDeviceCard.locator('.device-label')).toContainText('CURRENT DEVICE');
    await expect(firstDeviceCard.locator('button.secondary')).toHaveCount(0);

    // Other devices should have a Sign Out button
    const secondDeviceCard = page.locator('.device-card').nth(1);
    await expect(secondDeviceCard.locator('button.secondary')).toContainText('Sign Out');
  });

  test('Sign out of a device', async ({ page }) => {
    let signOutCalled = false;
    let signedOutDeviceId = null;

    // A single handler that handles both types of requests
    await page.route('**/devices/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      // DELETE for sign out
      if (method === 'DELETE') {
        signOutCalled = true;
        signedOutDeviceId = url.split('/').pop();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
        return;
      }

      // GET for the device list
      if (url.includes('/devices/device') && method === 'GET') {
        const devicesToReturn = signOutCalled 
          ? mockDevices.filter(d => d.id !== signedOutDeviceId)
          : mockDevices;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            devices: devicesToReturn,
            totalPages: 1,
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/account-settings/manage-access');

    await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

    // Verify we have 3 devices initially
    await expect(page.locator('.device-card')).toHaveCount(3, { timeout: 10000 });

    // Click on Sign Out of the second device
    const secondDeviceSignOut = page.locator('.device-card').nth(1).locator('button.secondary');
    await secondDeviceSignOut.click();

    // Verify that only 2 devices remain
    await expect(page.locator('.device-card')).toHaveCount(2, { timeout: 10000 });
  });

  test('Display of the profile associated with the device', async ({ page }) => {
    await page.route('**/devices/device**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          devices: mockDevices,
          totalPages: 1,
        }),
      });
    });

    await page.goto('/account-settings/manage-access');

    await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

    // Verify the display of profiles
    await expect(page.locator('.device-info').first()).toContainText('Jean');
    await expect(page.locator('.device-info').nth(1)).toContainText('Marie');
  });

  test('Display of the last login date', async ({ page }) => {
    await page.route('**/devices/device**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          devices: mockDevices,
          totalPages: 1,
        }),
      });
    });

    await page.goto('/account-settings/manage-access');

    await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

    // The current device does not display the date
    const currentDeviceTimestamp = page.locator('.device-card').first().locator('.device-timestamp');
    await expect(currentDeviceTimestamp).not.toContainText('Last login');

    // Other devices display the date
    const otherDeviceTimestamp = page.locator('.device-card').nth(1).locator('.device-timestamp');
    await expect(otherDeviceTimestamp).toContainText('Last login');
  });

  test('Pagination - multiple pages of devices', async ({ page }) => {
    let currentPage = 1;

    await page.route('**/devices/device**', async (route) => {
      const url = new URL(route.request().url());
      const pageParam = url.searchParams.get('page') || '1';
      currentPage = parseInt(pageParam);

      const devicesPage1 = mockDevices;
      const devicesPage2 = [
        {
          id: 'device-4',
          name: 'Chrome on Android',
          isCurrent: false,
          lastLogin: new Date().toISOString(),
          ProfileDeviceHistory: [{ profile: { name: 'Pierre' } }],
        },
      ];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          devices: currentPage === 1 ? devicesPage1 : devicesPage2,
          totalPages: 2,
          currentPage: currentPage,
        }),
      });
    });

    await page.goto('/account-settings/manage-access');

    await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

    // Verify pagination
    await expect(page.locator('.pagination')).toContainText('Page 1 / 2');

    // The Previous button should be disabled
    await expect(page.locator('.pagination button').first()).toBeDisabled();

    // Click on Next
    await page.locator('.pagination button').last().click();

    // Verify we are on page 2
    await expect(page.locator('.pagination')).toContainText('Page 2 / 2', { timeout: 10000 });

    // Verify the content of page 2
    await expect(page.locator('.device-name').first()).toContainText('Chrome on Android');

    // The Next button should be disabled now
    await expect(page.locator('.pagination button').last()).toBeDisabled();
  });

  test('Back button - Go back', async ({ page }) => {
    await page.route('**/devices/device**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          devices: mockDevices,
          totalPages: 1,
        }),
      });
    });

    // First go to the devices page to have a history
    await page.goto('/account-settings/devices');
    await expect(page.locator('h1')).toContainText('Devices', { timeout: 15000 });

    // Click on the link to manage-access
    await page.click('text=Access and devices');
    await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

    // Click on Back
    await page.click('.back-button');

    // Should go back to the devices page
    await expect(page).toHaveURL(/\/account-settings\/devices\/?$/, { timeout: 15000 });
  });

  test('Error loading devices', async ({ page }) => {
    await page.route('**/devices/device**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    await page.goto('/account-settings/manage-access');

    // Verify the error message
    await expect(page.locator('.error')).toContainText('Failed to load profiles', { timeout: 15000 });
  });

  // Note: The "Loading state" test is omitted as it is not reliable on remote server (loading too fast)

  test('Sign Out of All Devices button visible', async ({ page }) => {
    await page.route('**/devices/device**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          devices: mockDevices,
          totalPages: 1,
        }),
      });
    });

    await page.goto('/account-settings/manage-access');

    await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

    // Verify that the Sign Out of All Devices button is present
    await expect(page.locator('.sign-out-all button')).toContainText('Sign Out of All Devices');
  });

  test('Access from the Devices page', async ({ page }) => {
    await page.route('**/devices/device**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          devices: mockDevices,
          totalPages: 1,
        }),
      });
    });

    // Go to the Devices page
    await page.goto('/account-settings/devices');

    await expect(page.locator('h1')).toContainText('Devices', { timeout: 15000 });

    // Verify that the Access and devices link is present
    await expect(page.locator('text=Access and devices')).toBeVisible();
    await expect(page.locator('text=Manage signed-in devices')).toBeVisible();

    // Click on the link
    await page.click('text=Access and devices');

    // Verify we are on the correct page
    await expect(page).toHaveURL(/\/account-settings\/manage-access\/?$/);
    await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });
  });

  test('Device without associated profile displays "Unknown profile"', async ({ page }) => {
    const deviceWithoutProfile = [
      {
        id: 'device-no-profile',
        name: 'Unknown Device',
        isCurrent: false,
        lastLogin: new Date().toISOString(),
        ProfileDeviceHistory: [], // No profile
      },
    ];

    await page.route('**/devices/device**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          devices: deviceWithoutProfile,
          totalPages: 1,
        }),
      });
    });

    await page.goto('/account-settings/manage-access');

    await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

    // Verify that we display "Unknown profile"
    await expect(page.locator('.device-info')).toContainText('Unknown profile');
  });
});

