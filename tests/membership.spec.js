import { test, expect } from '@playwright/test';

test.describe('Membership - Functional Tests', () => {

  test('Navigate to Change Plan page from membership', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Click on plan card to change plan
    await page.click('.plan-card .link-card');

    // Should navigate to change-plan
    await expect(page).toHaveURL(/\/account-settings\/change-plan\/?$/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Change Plan');
  });

  test('Navigate to Manage payment method page', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    await page.click('text=Manage payment method');

    await expect(page).toHaveURL(/\/account-settings\/payment-method\/?$/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Manage payment method');
  });

  test('Navigate to Payment history page', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    await page.click('text=View payment history');

    await expect(page).toHaveURL(/\/account-settings\/payment-history\/?$/, { timeout: 15000 });
  });

  test('Cancel membership button is present and clickable', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Cancel button should be visible and clickable
    const cancelButton = page.locator('.cancel-membership');
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toBeEnabled();
  });

});
