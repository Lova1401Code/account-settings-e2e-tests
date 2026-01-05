import { test, expect } from '@playwright/test';

test.describe('Device Management - Functional Tests', () => {

  test('Navigate from Devices to Manage Access', async ({ page }) => {
    await page.goto('/account-settings/devices', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('Devices', { timeout: 15000 });

    await page.click('text=Access and devices');

    await expect(page).toHaveURL(/\/account-settings\/manage-access\/?/, { timeout: 15000 });
  });

  test('Current device has CURRENT DEVICE label', async ({ page }) => {
    await page.goto('/account-settings/manage-access', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

    await expect(page.locator('.device-label:has-text("CURRENT DEVICE")')).toBeVisible({ timeout: 15000 });
  });

  test('Current device cannot be signed out', async ({ page }) => {
    await page.goto('/account-settings/manage-access', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

    const currentDeviceCard = page.locator('.device-card:has(.device-label:has-text("CURRENT DEVICE"))');
    await expect(currentDeviceCard).toBeVisible({ timeout: 15000 });
    
    // Current device should not have Sign Out button
    await expect(currentDeviceCard.locator('button.secondary')).toHaveCount(0);
  });

  test('Other devices have Sign Out button', async ({ page }) => {
    await page.goto('/account-settings/manage-access', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

    const deviceCount = await page.locator('.device-card').count();

    if (deviceCount > 1) {
      const nonCurrentDevices = page.locator('.device-card:not(:has(.device-label:has-text("CURRENT DEVICE")))');
      const nonCurrentCount = await nonCurrentDevices.count();

      if (nonCurrentCount > 0) {
        await expect(nonCurrentDevices.first().locator('button.secondary')).toContainText('Sign Out');
      }
    } else {
      test.skip('Only current device exists');
    }
  });

  test('Back button navigates to previous page', async ({ page }) => {
    await page.goto('/account-settings/devices', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('Devices', { timeout: 15000 });

    await page.click('text=Access and devices');
    await expect(page).toHaveURL(/\/account-settings\/manage-access\/?/, { timeout: 15000 });

    await page.click('.back-button');

    await expect(page).toHaveURL(/\/account-settings\/devices\/?/, { timeout: 15000 });
  });

  test('Sign Out of All Devices button is present', async ({ page }) => {
    await page.goto('/account-settings/manage-access', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

    const signOutAllButton = page.locator('.sign-out-all button');
    await expect(signOutAllButton).toContainText('Sign Out of All Devices', { timeout: 15000 });
    await expect(signOutAllButton).toBeEnabled();
  });

  test('Pagination Previous button disabled on first page', async ({ page }) => {
    await page.goto('/account-settings/manage-access', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

    await expect(page.locator('.pagination button:has-text("Previous")')).toBeDisabled();
  });

  test('Full navigation flow: Account → Devices → Manage Access → Back', async ({ page }) => {
    await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    await page.click('text=Devices');
    await expect(page).toHaveURL(/\/account-settings\/devices\/?/, { timeout: 15000 });

    await page.click('text=Access and devices');
    await expect(page).toHaveURL(/\/account-settings\/manage-access\/?/, { timeout: 15000 });

    await page.click('.back-button');
    await expect(page).toHaveURL(/\/account-settings\/devices\/?/, { timeout: 15000 });
  });

});
