import { test, expect } from '@playwright/test';
import { testUser } from './test-config.js';

// Helper pour naviguer vers une page protégée en attendant security-info
const gotoProtectedPage = async (page, url, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const securityInfoPromise = page.waitForResponse(
      response => response.url().includes('/customer/security-info') && response.status() === 200,
      { timeout: 30000 }
    ).catch(() => null);
    
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    await securityInfoPromise;
    await page.waitForTimeout(1000);
    
    // Vérifier si on n'est pas redirigé vers Email verification
    const h1Text = await page.locator('h1').textContent().catch(() => '');
    if (!h1Text.includes('Email verification')) {
      return; // Succès, on est sur la bonne page
    }
    
    // Si on est sur Email verification, attendre et réessayer
    await page.waitForTimeout(2000);
  }
};

test.describe('Password change', () => {

  test('Display of the password change page', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-password');

    await expect(page.locator('h1')).toContainText('Change password', { timeout: 15000 });

    await expect(page.locator('.change-password-subtitle')).toContainText('Protect your account');

    await expect(page.locator('input#currentPassword')).toBeVisible();
    await expect(page.locator('input#newPassword')).toBeVisible();
    await expect(page.locator('input#confirmPassword')).toBeVisible();

    await expect(page.locator('input#signOutAll')).toBeVisible();
    await expect(page.locator('label[for="signOutAll"]')).toContainText('Sign out of all devices');

    await expect(page.locator('button[type="submit"]')).toContainText('Save');
    await expect(page.locator('button.secondary')).toContainText('Cancel');

    await expect(page.locator('a.forgot-password')).toBeVisible();
  });

  test('Successful password change', async ({ page }) => {
    const currentPassword = testUser.password;
    const newPassword = testUser.password;

    await gotoProtectedPage(page, '/account-settings/change-password');

    await expect(page.locator('h1')).toContainText('Change password', { timeout: 15000 });

    await page.fill('input#currentPassword', currentPassword);
    await page.fill('input#newPassword', newPassword);
    await page.fill('input#confirmPassword', newPassword);

    await page.click('button[type="submit"]');

    await expect(page.locator('.success-message')).toContainText('Password changed successfully!');

    await page.waitForURL('/account-settings/security', { timeout: 5000 });
  });

  test('Error - Passwords do not match', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-password');

    await expect(page.locator('h1')).toContainText('Change password', { timeout: 15000 });

    await page.fill('input#currentPassword', testUser.password);
    await page.fill('input#newPassword', 'NewPassword123');
    await page.fill('input#confirmPassword', 'DifferentPassword123');

    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toContainText('New passwords do not match');
  });

  test('Error - Password too short (native HTML validation)', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-password');

    await expect(page.locator('h1')).toContainText('Change password', { timeout: 15000 });

    // Fill with a password too short (less than 6 characters)
    await page.fill('input#currentPassword', testUser.password);
    await page.fill('input#newPassword', '12345');
    await page.fill('input#confirmPassword', '12345');

    // Verify that the field has the minLength constraint
    const minLength = await page.locator('input#newPassword').getAttribute('minLength');
    expect(minLength).toBe('6');

    // Try to submit - native HTML validation prevents submission
    await page.click('button[type="submit"]');

    // The form should not be submitted, we stay on the same page
    await expect(page).toHaveURL(/\/account-settings\/change-password/);

    // Verify that the field is invalid (HTML5 validation)
    const isValid = await page.locator('input#newPassword').evaluate(el => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test('Error - Current password incorrect (API error)', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-password');

    await expect(page.locator('h1')).toContainText('Change password', { timeout: 15000 });

    // Fill the form with wrong current password
    await page.fill('input#currentPassword', 'WrongPassword');
    await page.fill('input#newPassword', testUser.password);
    await page.fill('input#confirmPassword', testUser.password);

    // Submit
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 10000 });
  });

  test('Checkbox "Sign out of all devices" works', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-password');

    await expect(page.locator('h1')).toContainText('Change password', { timeout: 15000 });

    // The checkbox should be unchecked by default
    await expect(page.locator('input#signOutAll')).not.toBeChecked();

    // Check the checkbox
    await page.click('input#signOutAll');

    // Verify it is checked
    await expect(page.locator('input#signOutAll')).toBeChecked();

    // Uncheck the checkbox
    await page.click('input#signOutAll');

    // Verify it is unchecked
    await expect(page.locator('input#signOutAll')).not.toBeChecked();
  });

  test('Cancel button - Go back', async ({ page }) => {
    // First go to the security page to have history
    await gotoProtectedPage(page, '/account-settings/security');
    await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

    // Then go to the password change page
    await gotoProtectedPage(page, '/account-settings/change-password');

    await expect(page.locator('h1')).toContainText('Change password', { timeout: 15000 });

    // Click on Cancel
    await page.click('button.secondary');

    // Should go back to the security page (navigate(-1)) - accepts with or without trailing slash
    await page.waitForURL(/\/account-settings\/security\/?$/, { timeout: 15000 });
  });

  test('Back button - Go back', async ({ page }) => {
    // First go to the security page to have history
    await gotoProtectedPage(page, '/account-settings/security');
    await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

    // Then go to the password change page
    await gotoProtectedPage(page, '/account-settings/change-password');

    await expect(page.locator('h1')).toContainText('Change password', { timeout: 15000 });

    // Click on the Back button
    await page.click('.back-button');

    // Should go back to the security page - accepts with or without trailing slash
    await page.waitForURL(/\/account-settings\/security\/?$/, { timeout: 15000 });
  });

  test('Save button disabled during loading', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-password');

    await expect(page.locator('h1')).toContainText('Change password', { timeout: 15000 });

    // Fill the form - utiliser le même mot de passe pour que le compte reste utilisable
    await page.fill('input#currentPassword', testUser.password);
    await page.fill('input#newPassword', testUser.password);
    await page.fill('input#confirmPassword', testUser.password);

    // Submit
    await page.click('button[type="submit"]');

    // Verify that the button shows "Processing..." and is disabled
    await expect(page.locator('button[type="submit"]')).toContainText('Processing...');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();

    // Wait for loading to finish
    await expect(page.locator('.success-message')).toContainText('Password changed successfully!', { timeout: 10000 });
  });

});

