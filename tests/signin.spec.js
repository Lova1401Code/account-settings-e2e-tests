import { test, expect } from '@playwright/test';

test.describe('Sign In', () => {

  test('Successful signin with email and password → redirect to select-profile', async ({ page }) => {
    const testEmail = 'test@example.com';
    const testPassword = 'Test1234!';

    // ===== SET UP ALL MOCKS (persistent for all navigations) =====

    // Mock signinCustomer: successful login
    await page.route('**/auth/signinCustomer', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          customer: {
            id: 'mock-customer-id',
            email: testEmail,
          },
          device: {
            deviceId: 'mock-device-id',
          },
        }),
      });
    });

    // Mock security-info: email verified
    await page.route('**/customer/security-info', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          email: testEmail,
          emailVerified: true,
        }),
      });
    });

    // Mock profiles: returns a list of profiles
    await page.route('**/profiles', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'profile-1', name: 'Profile 1', avatar: '/avatars/Alphabet/A.png' },
            { id: 'profile-2', name: 'Profile 2', avatar: '/avatars/Alphabet/B.png' },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Mock active-profile: no active profile
    await page.route('**/profiles/active-profile', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: null }), // No active profile
        });
      } else {
        await route.continue();
      }
    });

    // Mock check-default-profile
    await page.route('**/profiles/check-default-profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ hasDefaultProfile: true }),
      });
    });

    // ========== Step 1: Go to the login page ==========
    await page.goto('/account-settings/login');
    
    // Verify that the "Sign In" title is displayed
    await expect(page.locator('h1')).toContainText('Sign In');

    // ========== Step 2: Fill the form ==========
    await page.fill('input[name="identifier"]', testEmail);
    await page.fill('input[name="password"]', testPassword);

    // ========== Step 3: Submit the form ==========
    await page.click('button[type="submit"]');

    // ========== Step 4: Verify we leave the login page ==========
    // Wait for URL to change (leave /login)
    await page.waitForFunction(() => {
      return !window.location.pathname.includes('/login');
    }, { timeout: 15000 });

    // Verify we are no longer on the login page
    await expect(page).not.toHaveURL(/\/account-settings\/login/);

    // Verify we are on a profiles page (select-profile or profiles)
    await expect(page).toHaveURL(/\/account-settings\/(profiles|select-profile)/);
  });

  test('Failed signin with wrong password → error message', async ({ page }) => {
    const testEmail = 'test@example.com';
    const testPassword = 'wrongpassword';

    // Mock signinCustomer: login failure
    await page.route('**/auth/signinCustomer', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Invalid credentials',
        }),
      });
    });

    // Go to the login page
    await page.goto('/account-settings/login');

    // Fill the form
    await page.fill('input[name="identifier"]', testEmail);
    await page.fill('input[name="password"]', testPassword);

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify that the error message is displayed
    await expect(page.locator('.general-error-message')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.general-error-message')).toContainText(/incorrect|invalid/i);

    // Verify we are still on the login page (accepts with or without trailing slash)
    await expect(page).toHaveURL(/\/account-settings\/login\/?$/);
  });

  test('Signin with empty email → validation error', async ({ page }) => {
    // Go to the login page
    await page.goto('/account-settings/login');

    // Leave email empty and click on password field to trigger validation
    await page.click('input[name="identifier"]');
    await page.click('input[name="password"]');

    // Verify that the validation error message is displayed
    await expect(page.locator('.error-message')).toContainText(/enter your email/i);
  });

  test('"Forgot password?" link redirects to recovery page', async ({ page }) => {
    // Go to the login page
    await page.goto('/account-settings/login');

    // Click on the "Forgot password?" link
    await page.click('a.forgot-password');

    // Verify the redirection
    await page.waitForURL('/account-settings/forgot-password');
    await expect(page).toHaveURL('/account-settings/forgot-password');
  });

  test('"Use a Sign-In Code" button displays code form', async ({ page }) => {
    // Go to the login page
    await page.goto('/account-settings/login');

    // Verify we are in password mode by default
    await expect(page.locator('input[name="password"]')).toBeVisible();

    // Click on "Use a Sign-In Code"
    await page.click('button:has-text("Use a Sign-In Code")');

    // Verify that the code form is displayed (password field disappears)
    await expect(page.locator('input[name="password"]')).not.toBeVisible();
    
    // The button to send the code should be visible
    await expect(page.locator('button:has-text("Send")')).toBeVisible();
  });

});

