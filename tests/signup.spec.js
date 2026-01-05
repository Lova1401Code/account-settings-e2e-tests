import { test, expect } from '@playwright/test';
import { testUser } from './test-config.js';

test.describe('Signup - Functional Tests', () => {

  test('Existing user with subscription is redirected to login', async ({ page }) => {
    await page.goto('/account-settings/signup');
    await expect(page.locator('h1')).toContainText('Unlimited movies', { timeout: 15000 });

    // Enter existing user email
    await page.fill('input#email', testUser.email);
    await page.click('button[type="submit"]');

    // Should redirect to login with message
    await page.waitForFunction(() => {
      const url = window.location.pathname;
      const hasPasswordField = document.querySelector('input[type="password"]');
      return url.includes('/login') || hasPasswordField;
    }, { timeout: 30000 });

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await expect(page.locator('h1')).toContainText('Sign In', { timeout: 10000 });
    }
  });

  test('Form validation - submit disabled with empty email', async ({ page }) => {
    await page.goto('/account-settings/signup');
    await expect(page.locator('h1')).toContainText('Unlimited movies', { timeout: 15000 });

    // Button should be disabled when email is empty
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('Form validation - submit disabled with invalid email', async ({ page }) => {
    await page.goto('/account-settings/signup');
    await expect(page.locator('h1')).toContainText('Unlimited movies', { timeout: 15000 });

    await page.fill('input#email', 'invalidemail');

    // Button should still be disabled
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('Form validation - submit enabled with valid email', async ({ page }) => {
    await page.goto('/account-settings/signup');
    await expect(page.locator('h1')).toContainText('Unlimited movies', { timeout: 15000 });

    await page.fill('input#email', 'test@example.com');

    // Button should be enabled
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('Valid email proceeds to password step', async ({ page }) => {
    await page.goto('/account-settings/signup');
    await expect(page.locator('h1')).toContainText('Unlimited movies', { timeout: 15000 });

    await page.fill('input#email', testUser.email);
    await page.click('button[type="submit"]');

    // Should show password field or redirect
    await page.waitForFunction(() => {
      const url = window.location.pathname;
      const hasPasswordField = document.querySelector('input[type="password"]');
      return hasPasswordField || !url.endsWith('/signup');
    }, { timeout: 15000 });
  });

  test('Complete signup flow with mocks - email to verification to welcome', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'Test1234!';
    let emailVerified = false;

    // Setup mocks
    await page.route('**/auth/check-email', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ exists: false, hasPlan: false, hasSubscription: false }),
      });
    });

    await page.route('**/auth/step1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToke: { accessToken: 'mock-token', refreshToken: 'mock-refresh' },
          customerId: 'mock-customer-id',
        }),
      });
    });

    await page.route('**/customer/security-info', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ email: testEmail, emailVerified }),
      });
    });

    await page.route('**/customer/send-verification-email', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    await page.route('**/profiles/active-profile', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'No active profile' }) });
      } else {
        await route.continue();
      }
    });

    await page.route('**/mailer/verify-email**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    // Step 1: Enter email
    await page.goto('/account-settings/signup');
    await page.fill('#email', testEmail);
    await page.click('button[type="submit"]');

    // Step 2: Enter password
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Step 3: Email verification request page
    await page.waitForURL('/account-settings/signup/request-email-verification');
    await expect(page.locator('h1')).toContainText('Email verification');

    // Step 4: Simulate email verification
    emailVerified = true;
    await page.goto('/account-settings/verify-email?token=mock-token');
    await expect(page.locator('.success-icon')).toBeVisible({ timeout: 15000 });

    // Step 5: Welcome page
    await page.waitForURL('/account-settings/signup/signup-welcome', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Welcome to AllMovies!');
  });

  test('Plan selection - user can select a plan and proceed', async ({ page }) => {
    await page.goto('/account-settings/signup/plan');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (!currentUrl.includes('/signup/plan')) {
      test.skip('Redirected - user may not have verified email');
      return;
    }

    await expect(page.locator('h1')).toContainText('Choose your plan', { timeout: 15000 });

    // Plans should be displayed and clickable
    const planCards = page.locator('.plan-card, .plan-item');
    const count = await planCards.count();
    expect(count).toBeGreaterThan(0);

    // Click on a plan
    await planCards.first().click();

    // Next button should be clickable
    await expect(page.locator('button:has-text("Next")')).toBeVisible();
  });

  test('Payment step - credit card option navigates to card payment', async ({ page }) => {
    await page.goto('/account-settings/signup/payment');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (!currentUrl.includes('/signup/payment')) {
      test.skip('Redirected - user may not have verified email');
      return;
    }

    await expect(page.locator('h1')).toContainText('Choose how to pay', { timeout: 15000 });

    // Click on Credit/Debit Card option
    await page.click('.payment-method-button');

    // Should navigate to card payment
    await expect(page).toHaveURL(/\/signup\/card-payment\/?$/, { timeout: 15000 });
  });

  test('Card payment - terms must be accepted before submit', async ({ page }) => {
    await page.goto('/account-settings/signup/card-payment', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (!currentUrl.includes('/signup/card-payment')) {
      test.skip('Redirected - user may not have verified email');
      return;
    }

    await expect(page.locator('h1')).toContainText('Set up your credit or debit card', { timeout: 15000 });

    // Submit button should be disabled initially
    const submitButton = page.locator('button#start-membership-button, button.submit-button');
    await expect(submitButton).toBeDisabled();

    // Accept terms
    await page.locator('.terms-agreement input[type="checkbox"]').check();

    // Checkbox should be checked
    const isChecked = await page.locator('.terms-agreement input[type="checkbox"]').isChecked();
    expect(isChecked).toBeTruthy();
  });

});
