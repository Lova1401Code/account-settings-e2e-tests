import { test, expect } from '@playwright/test';

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

test.describe('Manage Access - Functional Tests', () => {

  test('Current device cannot be signed out (no Sign Out button)', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/manage-access');
    await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

    // Current device card should exist but have no Sign Out button
    const currentDeviceCard = page.locator('.device-card:has(.device-label:has-text("CURRENT DEVICE"))');
    await expect(currentDeviceCard).toBeVisible({ timeout: 10000 });
    await expect(currentDeviceCard.locator('button:has-text("Sign Out")')).not.toBeVisible();
  });

  test('At least one device (current) is listed', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/manage-access');
    await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

    // Should have at least one device
    const deviceCount = await page.locator('.device-card').count();
    expect(deviceCount).toBeGreaterThanOrEqual(1);
  });

  test('Back button navigates to security page', async ({ page }) => {
    // First go to security
    await gotoProtectedPage(page, '/account-settings/security');
    await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

    // Then to manage-access
    await gotoProtectedPage(page, '/account-settings/manage-access');
    await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

    // Click Back
    await page.click('.back-button');

    // Should return to security
    await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });
  });

  test('Sign Out of All Devices button is functional', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/manage-access');
    await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

    // Sign Out of All button should be present
    const signOutAllButton = page.locator('.sign-out-all button');
    await expect(signOutAllButton).toBeVisible({ timeout: 10000 });
    await expect(signOutAllButton).toBeEnabled();
  });

});
