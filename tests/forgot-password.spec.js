import { test, expect } from '@playwright/test';

test.describe('Forgot Password - Functional Tests', () => {

  test('Submit valid email shows confirmation page (with mock)', async ({ page }) => {
    const testEmail = 'test@example.com';

    // Mock the API (necessary - we don't want to send real emails)
    await page.route('**/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Reset link sent' }),
      });
    });

    await page.goto('/account-settings/forgot-password');
    await expect(page.locator('h1')).toContainText('Forgot Password', { timeout: 10000 });

    // Fill and submit
    await page.fill('input#email', testEmail);
    await page.click('button[type="submit"]');

    // Should show confirmation
    await expect(page.locator('h1')).toContainText('Check your email', { timeout: 10000 });
    await expect(page.locator('.forgot-password-content p').first()).toContainText(testEmail);
  });

  test('Invalid email format triggers validation', async ({ page }) => {
    await page.goto('/account-settings/forgot-password');
    await expect(page.locator('h1')).toContainText('Forgot Password', { timeout: 10000 });

    // Enter invalid email
    await page.fill('input#email', 'invalid-email');
    await page.click('button[type="submit"]');

    // Should stay on page (HTML5 or JS validation)
    await expect(page).toHaveURL(/\/account-settings\/forgot-password/);
  });

  test('API error shows error message', async ({ page }) => {
    await page.route('**/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Email not found' }),
      });
    });

    await page.goto('/account-settings/forgot-password');
    await page.fill('input#email', 'notfound@example.com');
    await page.click('button[type="submit"]');

    // Error should appear
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 10000 });
  });

  test('Back to Login navigates to login page', async ({ page }) => {
    await page.goto('/account-settings/forgot-password');
    await expect(page.locator('h1')).toContainText('Forgot Password', { timeout: 10000 });

    await page.click('button.back-to-login');

    await page.waitForURL('/account-settings/login', { timeout: 10000 });
  });

  test('Reset password with matching passwords succeeds (with mock)', async ({ page }) => {
    const newPassword = 'NewSecurePassword123!';

    await page.route('**/auth/reset-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/account-settings/reset-password?token=mock-reset-token');
    await expect(page.locator('h1')).toContainText('Reset Your Password', { timeout: 10000 });

    await page.fill('input#new-password', newPassword);
    await page.fill('input#confirm-password', newPassword);
    await page.click('button[type="submit"]');

    await expect(page.locator('h1')).toContainText('Password Reset Successful', { timeout: 10000 });
  });

  test('Reset password with mismatched passwords shows error', async ({ page }) => {
    await page.goto('/account-settings/reset-password?token=mock-reset-token');
    await expect(page.locator('h1')).toContainText('Reset Your Password', { timeout: 10000 });

    await page.fill('input#new-password', 'Password123!');
    await page.fill('input#confirm-password', 'DifferentPassword123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toContainText('Passwords do not match');
  });

  test('Reset password too short triggers HTML5 validation', async ({ page }) => {
    await page.goto('/account-settings/reset-password?token=mock-reset-token');
    await expect(page.locator('h1')).toContainText('Reset Your Password', { timeout: 10000 });

    await page.fill('input#new-password', '1234567'); // Less than 8 chars
    await page.fill('input#confirm-password', '1234567');
    await page.click('button[type="submit"]');

    // Should stay on page
    await expect(page).toHaveURL(/\/account-settings\/reset-password/);

    // Field should be invalid
    const isValid = await page.locator('input#new-password').evaluate(el => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test('Invalid/expired token shows error', async ({ page }) => {
    await page.route('**/auth/reset-password', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Token expired or invalid' }),
      });
    });

    await page.goto('/account-settings/reset-password?token=expired-token');
    await page.fill('input#new-password', 'NewPassword123!');
    await page.fill('input#confirm-password', 'NewPassword123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toBeVisible({ timeout: 10000 });
  });

  test('After successful reset, Back to Login navigates correctly', async ({ page }) => {
    await page.route('**/auth/reset-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/account-settings/reset-password?token=mock-reset-token');
    await page.fill('input#new-password', 'NewPassword123!');
    await page.fill('input#confirm-password', 'NewPassword123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('h1')).toContainText('Password Reset Successful', { timeout: 10000 });

    await page.click('button.back-to-login');
    await page.waitForURL('/account-settings/login', { timeout: 10000 });
  });

});
