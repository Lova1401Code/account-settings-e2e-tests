import { test, expect } from '@playwright/test';
import { testUser } from './test-config.js';

test.describe('Sign In - Functional Tests', () => {

  test('User can login with valid credentials and is redirected', async ({ page }) => {
    await page.goto('/account-settings/login');
    await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

    // Fill login form with real credentials
    await page.fill('input[name="identifier"], input#identifier', testUser.email);
    await page.fill('input[name="password"], input#password', testUser.password);

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect away from login page
    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 30000 });
    await expect(page).not.toHaveURL(/\/account-settings\/login/);

    // Verify tokens are stored
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(accessToken).not.toBeNull();
  });

  test('Login with wrong password shows error and stays on page', async ({ page }) => {
    await page.goto('/account-settings/login');
    await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

    // Fill with wrong password
    await page.fill('input[name="identifier"], input#identifier', testUser.email);
    await page.fill('input[name="password"], input#password', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Error message should appear
    await expect(page.locator('.general-error-message')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.general-error-message')).toContainText(/incorrect|invalid/i);

    // Should stay on login page
    await expect(page).toHaveURL(/\/account-settings\/login\/?$/);
  });

  test('Login with non-existent email shows error', async ({ page }) => {
    await page.goto('/account-settings/login');
    await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

    await page.fill('input[name="identifier"], input#identifier', 'nonexistent@fakeemail.com');
    await page.fill('input[name="password"], input#password', 'SomePassword123!');
    await page.click('button[type="submit"]');

    // Error message should appear
    await expect(page.locator('.general-error-message')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/account-settings\/login\/?$/);
  });

  test('Form validation - empty email triggers error on blur', async ({ page }) => {
    await page.goto('/account-settings/login');
    await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

    // Click email then click away
    await page.click('input[name="identifier"], input#identifier');
    await page.click('input[name="password"], input#password');

    // Validation error should appear
    await expect(page.locator('.error-message')).toContainText(/enter your email/i, { timeout: 5000 });
  });

  test('Form validation - invalid email format triggers error', async ({ page }) => {
    await page.goto('/account-settings/login');
    await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

    await page.fill('input[name="identifier"], input#identifier', 'invalidemail');
    await page.click('input[name="password"], input#password');

    // Validation error should appear
    await expect(page.locator('.error-message')).toContainText(/valid email/i, { timeout: 5000 });
  });

  test('Forgot password link navigates to recovery page', async ({ page }) => {
    await page.goto('/account-settings/login');
    await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

    await page.click('a.forgot-password');

    await expect(page).toHaveURL(/\/account-settings\/forgot-password\/?$/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Forgot Password');
  });

  test('Sign-In Code flow - switching to code mode hides password field', async ({ page }) => {
    await page.goto('/account-settings/login');
    await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

    // Password field visible initially
    await expect(page.locator('input[name="password"], input#password')).toBeVisible();

    // Switch to code mode
    await page.click('button:has-text("Use a Sign-In Code")');

    // Password field should be hidden, Send button visible
    await expect(page.locator('input[name="password"], input#password')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Send")')).toBeVisible();
  });

  test('Sign-In Code flow - can switch back to password mode', async ({ page }) => {
    await page.goto('/account-settings/login');
    await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

    // Switch to code mode
    await page.click('button:has-text("Use a Sign-In Code")');
    await expect(page.locator('input[name="password"], input#password')).not.toBeVisible({ timeout: 5000 });

    // Switch back to password mode
    await page.click('button:has-text("Use Password")');

    // Password field should be visible again
    await expect(page.locator('input[name="password"], input#password')).toBeVisible({ timeout: 5000 });
  });

  test('Sign Up link navigates to signup page', async ({ page }) => {
    await page.goto('/account-settings/login');
    await expect(page.locator('h1')).toContainText('Sign In', { timeout: 15000 });

    await page.click('text=Sign up');

    await expect(page).toHaveURL(/\/account-settings\/signup\/?$/, { timeout: 10000 });
  });

});
