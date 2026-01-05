import { test, expect } from '@playwright/test';
import { loginAndSelectProfile } from './test-config.js';

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

test.describe('Manage Access Page', () => {

  test.beforeEach(async ({ page }) => {
    await loginAndSelectProfile(page);
  });

  test.describe('Page Display', () => {
    test('Display Manage Access page with title', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/manage-access');

      // Verify page title
      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

      // Verify intro text
      await expect(page.getByText('These signed-in devices have recently been active')).toBeVisible();
    });

    test('Display list of connected devices', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/manage-access');

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

      // Verify at least one device is displayed (the current one)
      const deviceCards = page.locator('.device-card');
      const count = await deviceCards.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('Current device is marked with badge', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/manage-access');

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

      // Verify current device badge
      await expect(page.locator('.device-label:has-text("CURRENT DEVICE")')).toBeVisible({ timeout: 10000 });
    });

    test('Back button is visible', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/manage-access');

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

      // Verify Back button
      await expect(page.locator('.back-button')).toBeVisible();
      await expect(page.locator('.back-button')).toContainText('Back');
    });

    test('Back button navigates back', async ({ page }) => {
      // First go to security page
      await gotoProtectedPage(page, '/account-settings/security');
      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Then go to manage-access
      await gotoProtectedPage(page, '/account-settings/manage-access');
      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

      // Click Back
      await page.click('.back-button');

      // Should go back to security page
      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });
    });
  });

  test.describe('Device Sign Out', () => {
    test('Sign Out button is NOT visible for current device', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/manage-access');

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

      // The current device card should not have a Sign Out button
      const currentDeviceCard = page.locator('.device-card:has(.device-label:has-text("CURRENT DEVICE"))');
      await expect(currentDeviceCard).toBeVisible({ timeout: 10000 });
      await expect(currentDeviceCard.locator('button:has-text("Sign Out")')).not.toBeVisible();
    });

    test('Sign Out of All Devices button is visible', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/manage-access');

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

      // Verify Sign Out of All Devices button
      await expect(page.locator('.sign-out-all button')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.sign-out-all button')).toContainText('Sign Out of All Devices');
    });
  });

  test.describe('Pagination', () => {
    test('Pagination controls are visible', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/manage-access');

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

      // Verify pagination controls (may or may not be visible depending on device count)
      const pagination = page.locator('.pagination');
      const paginationExists = await pagination.isVisible().catch(() => false);
      
      if (paginationExists) {
        await expect(page.locator('.pagination button:has-text("Previous")')).toBeVisible();
        await expect(page.locator('.pagination button:has-text("Next")')).toBeVisible();
      }
    });

    test('Display current page number if pagination exists', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/manage-access');

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

      // Verify page number display if pagination exists
      const pagination = page.locator('.pagination');
      const paginationExists = await pagination.isVisible().catch(() => false);
      
      if (paginationExists) {
        await expect(page.locator('.pagination')).toContainText('Page', { timeout: 10000 });
      }
    });
  });

  test.describe('Device Information', () => {
    test('Device cards display device information', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/manage-access');

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

      // Verify at least one device card is present
      const deviceCard = page.locator('.device-card').first();
      await expect(deviceCard).toBeVisible({ timeout: 10000 });
    });

    test('Devices note is displayed', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/manage-access');

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

      // Verify note text
      await expect(page.getByText('This list may not be complete')).toBeVisible({ timeout: 10000 });
    });

    test('Learn More link is visible', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/manage-access');

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

      // Verify Learn More link
      await expect(page.locator('.devices-note a:has-text("Learn More")')).toBeVisible({ timeout: 10000 });
    });
  });

});

