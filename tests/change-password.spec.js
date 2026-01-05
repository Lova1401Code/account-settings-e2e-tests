import { test, expect } from '@playwright/test';
import { testUser } from './test-config.js';

// Helper pour naviguer vers une page protégée
const gotoProtectedPage = async (page, url, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const securityInfoPromise = page.waitForResponse(
      response => response.url().includes('/customer/security-info') && response.status() === 200,
      { timeout: 30000 }
    ).catch(() => null);
    
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await securityInfoPromise;
    await page.waitForTimeout(1000);
    
    const h1Text = await page.locator('h1').textContent().catch(() => '');
    if (!h1Text.includes('Email verification')) {
      return;
    }
    await page.waitForTimeout(2000);
  }
};

test.describe('Change Password - Functional Tests', () => {

  test('Successfully change password (same password to keep account usable)', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-password');
    await expect(page.locator('h1')).toContainText('Change password', { timeout: 15000 });

    await page.fill('input#currentPassword', testUser.password);
    await page.fill('input#newPassword', testUser.password);
    await page.fill('input#confirmPassword', testUser.password);

    await page.click('button[type="submit"]');

    await expect(page.locator('.success-message')).toContainText('Password changed successfully!', { timeout: 10000 });
    await page.waitForURL(/\/account-settings\/security\/?$/, { timeout: 5000 });
  });

  test('Error when passwords do not match', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-password');
    await expect(page.locator('h1')).toContainText('Change password', { timeout: 15000 });

    await page.fill('input#currentPassword', testUser.password);
    await page.fill('input#newPassword', 'NewPassword123!');
    await page.fill('input#confirmPassword', 'DifferentPassword456!');

    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toContainText('New passwords do not match');
  });

  test('Error when current password is wrong', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-password');
    await expect(page.locator('h1')).toContainText('Change password', { timeout: 15000 });

    await page.fill('input#currentPassword', 'WrongCurrentPassword!');
    await page.fill('input#newPassword', testUser.password);
    await page.fill('input#confirmPassword', testUser.password);

    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toBeVisible({ timeout: 10000 });
  });

  test('Password too short triggers HTML5 validation', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-password');
    await expect(page.locator('h1')).toContainText('Change password', { timeout: 15000 });

    await page.fill('input#currentPassword', testUser.password);
    await page.fill('input#newPassword', '12345'); // Too short
    await page.fill('input#confirmPassword', '12345');

    await page.click('button[type="submit"]');

    // Should stay on page due to HTML5 validation
    await expect(page).toHaveURL(/\/account-settings\/change-password/);
    
    // Field should be invalid
    const isValid = await page.locator('input#newPassword').evaluate(el => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test('Sign out all devices checkbox toggles', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-password');
    await expect(page.locator('h1')).toContainText('Change password', { timeout: 15000 });

    const checkbox = page.locator('input#signOutAll');
    
    // Should be unchecked by default
    await expect(checkbox).not.toBeChecked();

    // Check it
    await checkbox.check();
    await expect(checkbox).toBeChecked();

    // Uncheck it
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  test('Cancel button navigates back to security', async ({ page }) => {
    // First go to security to have history
    await gotoProtectedPage(page, '/account-settings/security');
    await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

    // Then to change-password
    await gotoProtectedPage(page, '/account-settings/change-password');
    await expect(page.locator('h1')).toContainText('Change password', { timeout: 15000 });

    // Click Cancel
    await page.click('button.secondary');

    await page.waitForURL(/\/account-settings\/security\/?$/, { timeout: 15000 });
  });

  test('Forgot password link navigates to recovery', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-password');
    await expect(page.locator('h1')).toContainText('Change password', { timeout: 15000 });

    await page.click('a.forgot-password');

    // Accept both /forgot-password and /account-settings/forgot-password
    await expect(page).toHaveURL(/\/forgot-password\/?$/, { timeout: 10000 });
  });

});
