import { test, expect } from '@playwright/test';

test.describe('Subscription & Payment - Functional Tests', () => {

  test.describe('Membership Page Navigation', () => {

    test('Navigate to Manage payment method', async ({ page }) => {
      await page.goto('/account-settings/membership', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

      await page.click('text=Manage payment method');

      await expect(page).toHaveURL(/\/account-settings\/payment-method\/?/, { timeout: 15000 });
    });

    test('Navigate to View payment history', async ({ page }) => {
      await page.goto('/account-settings/membership', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

      await page.click('text=View payment history');

      await expect(page).toHaveURL(/\/account-settings\/payment-history\/?/, { timeout: 15000 });
    });

    test('Navigate to Change plan from plan card', async ({ page }) => {
      await page.goto('/account-settings/membership', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

      await page.locator('.plan-card .link-card').first().click();

      await expect(page).toHaveURL(/\/account-settings\/change-plan\/?/, { timeout: 15000 });
    });

  });

  test.describe('Payment Method Page', () => {

    test('Add Payment Method opens modal', async ({ page }) => {
      await page.goto('/account-settings/payment-method', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

      await page.click('text=Add Payment Method');

      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
    });

    test('Back button navigates to membership', async ({ page }) => {
      await page.goto('/account-settings/membership', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

      await page.goto('/account-settings/payment-method', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

      await page.click('.back-button');

      await expect(page).toHaveURL(/\/account-settings\/membership\/?/, { timeout: 15000 });
    });

  });

  test.describe('Change Plan Flow', () => {

    test('Back button navigates to membership', async ({ page }) => {
      await page.goto('/account-settings/membership', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

      await page.goto('/account-settings/change-plan', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      await page.click('.back-button');

      await expect(page).toHaveURL(/\/account-settings\/membership\/?/, { timeout: 15000 });
    });

  });

  test.describe('Account Settings Navigation', () => {

    test('Manage membership navigates to Membership page', async ({ page }) => {
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('text=Manage membership')).toBeVisible({ timeout: 15000 });
      await page.click('text=Manage membership');

      await expect(page).toHaveURL(/\/account-settings\/membership\/?/, { timeout: 15000 });
    });

  });

  test.describe('Full Navigation Flow', () => {

    test('Account → Membership → Change Plan → Back', async ({ page }) => {
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await page.click('text=Manage membership');
      await expect(page).toHaveURL(/\/account-settings\/membership\/?/, { timeout: 15000 });

      await page.locator('.plan-card .link-card').first().click();
      await expect(page).toHaveURL(/\/account-settings\/change-plan\/?/, { timeout: 15000 });

      await page.click('.back-button');
      await expect(page).toHaveURL(/\/account-settings\/membership\/?/, { timeout: 15000 });
    });

    test('Account → Membership → Payment Method → Back', async ({ page }) => {
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await page.click('text=Manage membership');
      await expect(page).toHaveURL(/\/account-settings\/membership\/?/, { timeout: 15000 });

      await page.click('text=Manage payment method');
      await expect(page).toHaveURL(/\/account-settings\/payment-method\/?/, { timeout: 15000 });

      await page.click('.back-button');
      await expect(page).toHaveURL(/\/account-settings\/membership\/?/, { timeout: 15000 });
    });

  });

});
