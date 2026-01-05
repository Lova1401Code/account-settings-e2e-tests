import { test, expect } from '@playwright/test';

test.describe('Complete signup with email verification', () => {
  
  test('Email and password step', async ({ page }) => {
    // Go to the signup page
    await page.goto('/account-settings/signup');

    // Verify that the page loads with the title
    await expect(page.locator('h1')).toContainText('Unlimited movies, TV shows, and more');

    // Fill the email field with a valid address
    await page.fill('#email', 'test@example.com');

    // Click the "Get Started" button
    await page.click('button[type="submit"]');

    // Wait for the next step to load (SignupStep)
    // Verify that the password field appears
    await expect(page.locator('input[type="password"]')).toBeVisible();

    await page.fill('input[type="password"]', 'test1234');

    await page.click('button[type="submit"]');

    await page.waitForURL('/account-settings/signup/request-email-verification');

    await expect(page.locator('h1')).toContainText('Email verification');
  });

  test('Complete signup flow → email verification → welcome (with mocks)', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'Test1234!';

    // Mutable state for the security-info mock
    let emailVerified = false;

    // ===== SET UP ALL MOCKS AT THE BEGINNING =====

    // Mock check-email: new user
    await page.route('**/auth/check-email', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ exists: false, hasPlan: false, hasSubscription: false }),
      });
    });

    // Mock step1: successful signup
    await page.route('**/auth/step1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToke: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
          },
          customerId: 'mock-customer-id',
        }),
      });
    });

    // Mock security-info: uses the mutable emailVerified variable
    await page.route('**/customer/security-info', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          email: testEmail,
          emailVerified: emailVerified, // This value will be read at the time of the call
        }),
      });
    });

    // Mock send-verification-email
    await page.route('**/customer/send-verification-email', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Mock active-profile (no active profile for a new user)
    await page.route('**/profiles/active-profile', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'No active profile' }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock verify-email (configured from the beginning)
    await page.route('**/mailer/verify-email**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Email verified successfully' }),
      });
    });

    // ========== Step 1: Signup page - enter email ==========
    await page.goto('/account-settings/signup');
    await expect(page.locator('h1')).toContainText('Unlimited movies, TV shows, and more');
    await page.fill('#email', testEmail);
    await page.click('button[type="submit"]');

    // ========== Step 2: Enter password ==========
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // ========== Step 3: Email verification request page ==========
    await page.waitForURL('/account-settings/signup/request-email-verification');
    await expect(page.locator('h1')).toContainText('Email verification');

    // Verify that the email is displayed
    await expect(page.locator('input#email')).toHaveValue(testEmail);

    // ========== Step 4: Simulate email verification ==========
    // Update the state so that subsequent calls to security-info return emailVerified = true
    emailVerified = true;

    // Navigate to the verification page with a mocked token
    // (simulates clicking the link in the email)
    await page.goto('/account-settings/verify-email?token=mock-verification-token');

    // Wait for the success message (spinner then checkmark)
    await expect(page.locator('.success-icon')).toBeVisible({ timeout: 15000 });

    // ========== Step 5: Signup-welcome page ==========
    await page.waitForURL('/account-settings/signup/signup-welcome', { timeout: 15000 });

    // Verify the content of the welcome page
    await expect(page.locator('h1')).toContainText('Welcome to AllMovies!');
    await expect(page.locator('.success-icon')).toContainText('✓');
    await expect(page.locator('text=Your email has been successfully verified')).toBeVisible();

    // Verify that the "Go to AllMovies" button is present
    await expect(page.locator('button:has-text("Go to AllMovies")')).toBeVisible();
  });

  test('Display "Choose a plan" button if no plan', async ({ page }) => {
    const testEmail = 'test@example.com';

    // Set authentication tokens in localStorage before navigating
    await page.goto('/account-settings/signup');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      localStorage.setItem('deviceId', 'mock-device-id');
    });

    // Mock security-info with verified email
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

    // Mock check-email: user without plan
    await page.route('**/auth/check-email', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ exists: true, hasPlan: false, hasSubscription: false }),
      });
    });

    // Go directly to signup-welcome
    await page.goto('/account-settings/signup/signup-welcome');

    // Verify that both buttons are present
    await expect(page.locator('button:has-text("Go to AllMovies")')).toBeVisible();
    await expect(page.locator('button:has-text("Choose a plan")')).toBeVisible({ timeout: 5000 });
  });

  test('No "Choose a plan" button if already has a plan', async ({ page }) => {
    const testEmail = 'test@example.com';

    // Set authentication tokens in localStorage before navigating
    await page.goto('/account-settings/signup');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      localStorage.setItem('deviceId', 'mock-device-id');
    });

    // Mock security-info with verified email
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

    // Mock check-email: user with plan
    await page.route('**/auth/check-email', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ exists: true, hasPlan: true, hasSubscription: true }),
      });
    });

    // Go directly to signup-welcome
    await page.goto('/account-settings/signup/signup-welcome');

    // Verify that only the "Go to AllMovies" button is present
    await expect(page.locator('button:has-text("Go to AllMovies")')).toBeVisible();
    await expect(page.locator('button:has-text("Choose a plan")')).not.toBeVisible();
  });
});

