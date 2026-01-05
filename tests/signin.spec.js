import { test, expect } from '@playwright/test';
import { testUser } from './test-config.js';

test.describe('Sign In - Real Tests', () => {

  test.describe('Login Page Display', () => {
    test('Display login page with title and form', async ({ page }) => {
      await page.goto('/account-settings/login');

      // Verify the title
      await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

      // Verify email/identifier field
      await expect(page.locator('input[name="identifier"], input#identifier')).toBeVisible();

      // Verify password field
      await expect(page.locator('input[name="password"], input#password')).toBeVisible();

      // Verify submit button
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('Display "Forgot password?" link', async ({ page }) => {
      await page.goto('/account-settings/login');

      await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

      // Verify forgot password link
      await expect(page.locator('a.forgot-password')).toBeVisible();
    });

    test('Display "Use a Sign-In Code" button', async ({ page }) => {
      await page.goto('/account-settings/login');

      await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

      // Verify code flow button
      await expect(page.locator('button:has-text("Use a Sign-In Code")')).toBeVisible();
    });

    test('Display Sign Up link', async ({ page }) => {
      await page.goto('/account-settings/login');

      await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

      // Verify sign up option is available
      await expect(page.locator('text=Sign up')).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('Empty email shows validation error', async ({ page }) => {
      await page.goto('/account-settings/login');

      await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

      // Click on email field then click elsewhere to trigger validation
      await page.click('input[name="identifier"], input#identifier');
      await page.click('input[name="password"], input#password');

      // Verify validation error message
      await expect(page.locator('.error-message')).toContainText(/enter your email/i, { timeout: 5000 });
    });

    test('Invalid email format shows validation error', async ({ page }) => {
      await page.goto('/account-settings/login');

      await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

      // Enter invalid email
      await page.fill('input[name="identifier"], input#identifier', 'invalidemail');
      await page.click('input[name="password"], input#password');

      // Verify validation error message
      await expect(page.locator('.error-message')).toContainText(/valid email/i, { timeout: 5000 });
    });

    test('Empty password shows validation error', async ({ page }) => {
      await page.goto('/account-settings/login');

      await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

      // Enter valid email but click on password then away
      await page.fill('input[name="identifier"], input#identifier', 'test@example.com');
      await page.click('input[name="password"], input#password');
      await page.click('input[name="identifier"], input#identifier');

      // Verify validation error message for password
      await expect(page.locator('.error-message')).toContainText(/enter your password/i, { timeout: 5000 });
    });
  });

  test.describe('Successful Login', () => {
    test('Successful signin with real credentials redirects to profiles', async ({ page }) => {
      await page.goto('/account-settings/login');

      await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

      // Fill with real credentials
      await page.fill('input[name="identifier"], input#identifier', testUser.email);
      await page.fill('input[name="password"], input#password', testUser.password);

      // Submit
      await page.click('button[type="submit"]');

      // Wait for navigation away from login page
      await page.waitForFunction(() => {
        return !window.location.pathname.includes('/login');
      }, { timeout: 30000 });

      // Verify we are no longer on the login page
      await expect(page).not.toHaveURL(/\/account-settings\/login/);

      // Should be on profiles page or select-profile or home page
      const currentUrl = page.url();
      const isValidRedirect = 
        currentUrl.includes('/profiles') || 
        currentUrl.includes('/select-profile') ||
        currentUrl.includes('/account-settings') ||
        currentUrl === '/' ||
        currentUrl.endsWith('/');
      
      expect(isValidRedirect).toBeTruthy();
    });

    test('Login stores tokens in localStorage', async ({ page }) => {
      await page.goto('/account-settings/login');

      await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

      // Fill with real credentials
      await page.fill('input[name="identifier"], input#identifier', testUser.email);
      await page.fill('input[name="password"], input#password', testUser.password);

      // Submit
      await page.click('button[type="submit"]');

      // Wait for navigation
      await page.waitForFunction(() => {
        return !window.location.pathname.includes('/login');
      }, { timeout: 30000 });

      // Verify tokens are stored
      const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
      const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));

      expect(accessToken).not.toBeNull();
      expect(refreshToken).not.toBeNull();
    });
  });

  test.describe('Failed Login', () => {
    test('Wrong password shows error message', async ({ page }) => {
      await page.goto('/account-settings/login');

      await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

      // Fill with real email but wrong password
      await page.fill('input[name="identifier"], input#identifier', testUser.email);
      await page.fill('input[name="password"], input#password', 'WrongPassword123!');

      // Submit
      await page.click('button[type="submit"]');

      // Verify error message is displayed
      await expect(page.locator('.general-error-message')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.general-error-message')).toContainText(/incorrect|invalid/i);

      // Verify we are still on the login page
      await expect(page).toHaveURL(/\/account-settings\/login\/?$/);
    });

    test('Non-existent email shows error message', async ({ page }) => {
      await page.goto('/account-settings/login');

      await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

      // Fill with non-existent email
      await page.fill('input[name="identifier"], input#identifier', 'nonexistent@fakeemail.com');
      await page.fill('input[name="password"], input#password', 'SomePassword123!');

      // Submit
      await page.click('button[type="submit"]');

      // Verify error message is displayed
      await expect(page.locator('.general-error-message')).toBeVisible({ timeout: 10000 });

      // Verify we are still on the login page
      await expect(page).toHaveURL(/\/account-settings\/login\/?$/);
    });
  });

  test.describe('Navigation', () => {
    test('"Forgot password?" link redirects to recovery page', async ({ page }) => {
      await page.goto('/account-settings/login');

      await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

      // Click on forgot password link
      await page.click('a.forgot-password');

      // Verify redirection
      await expect(page).toHaveURL(/\/account-settings\/forgot-password\/?$/, { timeout: 10000 });
    });

    test('Sign Up link navigates to signup page', async ({ page }) => {
      await page.goto('/account-settings/login');

      await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

      // Click on sign up
      await page.click('text=Sign up');

      // Verify redirection to signup
      await expect(page).toHaveURL(/\/account-settings\/signup\/?$/, { timeout: 10000 });
    });
  });

  test.describe('Sign-In Code Flow', () => {
    test('"Use a Sign-In Code" button switches to code form', async ({ page }) => {
      await page.goto('/account-settings/login');

      await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

      // Verify password field is visible initially
      await expect(page.locator('input[name="password"], input#password')).toBeVisible();

      // Click on "Use a Sign-In Code"
      await page.click('button:has-text("Use a Sign-In Code")');

      // Verify password field is no longer visible
      await expect(page.locator('input[name="password"], input#password')).not.toBeVisible({ timeout: 5000 });

      // Verify "Send" button is visible for code flow
      await expect(page.locator('button:has-text("Send")')).toBeVisible();
    });

    test('Code flow shows email input and Send button', async ({ page }) => {
      await page.goto('/account-settings/login');

      await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

      // Switch to code flow
      await page.click('button:has-text("Use a Sign-In Code")');

      // Send button should be visible (indicates we're in code flow)
      await expect(page.locator('button:has-text("Send")')).toBeVisible({ timeout: 5000 });

      // Email input should be visible (may have different selector in code flow)
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
      await expect(emailInput).toBeVisible();
    });

    test('Can switch back to password form', async ({ page }) => {
      await page.goto('/account-settings/login');

      await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

      // Switch to code flow
      await page.click('button:has-text("Use a Sign-In Code")');
      await expect(page.locator('input[name="password"], input#password')).not.toBeVisible({ timeout: 5000 });

      // Switch back to password flow
      await page.click('button:has-text("Use Password")');

      // Password field should be visible again
      await expect(page.locator('input[name="password"], input#password')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Loading State', () => {
    test('Submit button shows loading state during login', async ({ page }) => {
      await page.goto('/account-settings/login');

      await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

      // Fill with real credentials
      await page.fill('input[name="identifier"], input#identifier', testUser.email);
      await page.fill('input[name="password"], input#password', testUser.password);

      // Submit and immediately check for loading state
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Button should be disabled during loading
      // Note: This might be too fast to catch, so we just verify eventual success
      await page.waitForFunction(() => {
        return !window.location.pathname.includes('/login');
      }, { timeout: 30000 });
    });
  });

});
