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

test.describe('Security & Identity - Functional Tests', () => {

  test('Email click opens verification modal with change option', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/security');
    await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

    // Click on Email section
    await page.locator('.link-card:has(.link-title:text-is("Email"))').click();

    // Modal should open with options
    await expect(page.locator('.modal-overlay, .modal.open')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.modal-content button:has-text("Change Email")')).toBeVisible();
  });

  test('Change Email flow - password verification then update modal', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/security');
    await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

    // Open email modal and click change
    await page.locator('.link-card:has(.link-title:text-is("Email"))').click();
    await expect(page.locator('.modal-overlay, .modal.open')).toBeVisible({ timeout: 10000 });
    await page.locator('.modal-content button:has-text("Change Email")').click();

    // Should navigate to identity confirmation
    await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText("Confirm it's you");

    // Enter correct password
    await page.fill('input[type="password"]', testUser.password);
    await page.locator('button.submit-button:has-text("Continue")').click();

    // Update Email modal should open
    await expect(page.locator('.modal.open h2:has-text("Update Email")')).toBeVisible({ timeout: 10000 });
  });

  test('Identity confirmation - wrong password shows error', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/security');
    await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

    await page.locator('.link-card:has(.link-title:text-is("Email"))').click();
    await expect(page.locator('.modal-overlay, .modal.open')).toBeVisible({ timeout: 10000 });
    await page.locator('.modal-content button:has-text("Change Email")').click();

    await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });

    // Enter wrong password
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.locator('button.submit-button:has-text("Continue")').click();

    // Error message should appear
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 10000 });
  });

  test('Identity confirmation - continue button disabled when password empty', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/security');
    await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

    await page.locator('.link-card:has(.link-title:text-is("Email"))').click();
    await expect(page.locator('.modal-overlay, .modal.open')).toBeVisible({ timeout: 10000 });
    await page.locator('.modal-content button:has-text("Change Email")').click();

    await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });

    // Continue button should be disabled
    await expect(page.locator('button.submit-button:has-text("Continue")')).toBeDisabled();
  });

  test('Email a code button sends verification code', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/security');
    await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

    await page.locator('.link-card:has(.link-title:text-is("Email"))').click();
    await expect(page.locator('.modal-overlay, .modal.open')).toBeVisible({ timeout: 10000 });
    await page.locator('.modal-content button:has-text("Change Email")').click();

    await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });

    // Click "Email a code"
    await page.locator('button.code-button').click();

    // Verification modal should open
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
  });

  test('Backup contact - password verification opens backup modal', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/security');
    await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

    // Click on Backup contact
    await page.locator('.link-card:has(.link-title:text-is("Backup contact"))').click();

    // Should go to identity confirmation
    await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText("Confirm it's you");

    // Enter password
    await page.fill('input[type="password"]', testUser.password);
    await page.locator('button.submit-button:has-text("Continue")').click();

    // Backup contact modal should open
    const addModal = page.locator('.modal.open h2:has-text("Add Backup Contact")');
    const listModal = page.locator('.backup-contact-list-modal h2:has-text("Backup Contacts")');
    await expect(addModal.or(listModal)).toBeVisible({ timeout: 15000 });
  });

  test('Add backup contact - validation for WhatsApp format', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/security');
    await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

    // Check if Add backup button exists
    const addButton = page.locator('button.add-backup-button');
    const isVisible = await addButton.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip('No Add backup contact button visible');
      return;
    }

    await addButton.click();
    await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });
    await page.fill('input[type="password"]', testUser.password);
    await page.locator('button.submit-button:has-text("Continue")').click();

    await expect(page.locator('.modal.open h2:has-text("Add Backup Contact")')).toBeVisible({ timeout: 15000 });

    // Check if WhatsApp is available
    const select = page.locator('.modal.open select');
    const options = await select.locator('option').allTextContents();
    
    if (!options.some(opt => opt.includes('WhatsApp'))) {
      test.skip('WhatsApp option not available');
      return;
    }

    // Select WhatsApp and enter invalid format
    await select.selectOption('WhatsApp');
    await page.locator('.modal.open input[type="text"]').fill('0612345678');
    await page.locator('.modal.open button[type="submit"]').click();

    // Should show validation error
    await expect(page.locator('.error-message')).toContainText('WhatsApp', { timeout: 5000 });
  });

  test('Add backup contact - validation for Telegram format', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/security');
    await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

    const addButton = page.locator('button.add-backup-button');
    const isVisible = await addButton.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip('No Add backup contact button visible');
      return;
    }

    await addButton.click();
    await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });
    await page.fill('input[type="password"]', testUser.password);
    await page.locator('button.submit-button:has-text("Continue")').click();

    await expect(page.locator('.modal.open h2:has-text("Add Backup Contact")')).toBeVisible({ timeout: 15000 });

    const select = page.locator('.modal.open select');
    const options = await select.locator('option').allTextContents();
    
    if (!options.some(opt => opt.includes('Telegram'))) {
      test.skip('Telegram option not available');
      return;
    }

    // Select Telegram and enter invalid format (without @)
    await select.selectOption('Telegram');
    await page.locator('.modal.open input[type="text"]').fill('testuser');
    await page.locator('.modal.open button[type="submit"]').click();

    // Should show validation error
    await expect(page.locator('.error-message')).toContainText('Telegram', { timeout: 5000 });
  });

  test('Mobile phone - password verification opens phone modal', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/security');
    await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

    // Click on Mobile phone
    await page.locator('.link-card:has(.link-title:text-is("Mobile phone"))').click();

    // Should go to identity confirmation
    await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });

    // Enter password
    await page.fill('input[type="password"]', testUser.password);
    await page.locator('button.submit-button:has-text("Continue")').click();

    // Phone modal should open
    await expect(page.locator('.modal.open > .modal-content > h2')).toContainText('Phone', { timeout: 15000 });
  });

  test('Password link navigates to change password page', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/security');
    await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

    await page.locator('.link-card:has(.link-title:text-is("Password"))').click();

    await expect(page).toHaveURL(/\/account-settings\/change-password\/?/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Change password');
  });

  test('Access and devices navigates to manage-access page', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/security');
    await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

    await page.click('text=Access and devices');

    await expect(page).toHaveURL(/\/account-settings\/manage-access\/?/, { timeout: 15000 });
  });

  test('Personal info access opens modal', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/security');
    await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

    await page.click('text=Personal info access');

    await expect(page.locator('.modal-overlay, .modal.open')).toBeVisible({ timeout: 10000 });
  });

});
