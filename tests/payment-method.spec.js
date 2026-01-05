import { test, expect } from '@playwright/test';

test.describe('Payment Method - Functional Tests', () => {

  test('Add Payment Method button opens modal', async ({ page }) => {
    await page.goto('/account-settings/payment-method');
    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    await page.click('.add-payment-section button');

    await expect(page.locator('.modal, [role="dialog"], .add-payment-modal')).toBeVisible({ timeout: 10000 });
  });

  test('Back button navigates to membership', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    await page.goto('/account-settings/payment-method');
    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    await page.click('.back-button');

    await expect(page).toHaveURL(/\/account-settings\/membership\/?$/, { timeout: 15000 });
  });

  test('Navigate from Membership to Payment Method', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    await page.click('text=Manage payment method');

    await expect(page).toHaveURL(/\/account-settings\/payment-method\/?$/);
    await expect(page.locator('h1')).toContainText('Manage payment method');
  });

  test('Default card shows masked number', async ({ page }) => {
    await page.goto('/account-settings/payment-method');
    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    const cardNumber = page.locator('.payment-card-number').first();
    
    if (await cardNumber.isVisible().catch(() => false)) {
      await expect(cardNumber).toContainText('••••');
    }
  });

  test('Default card has Update button', async ({ page }) => {
    await page.goto('/account-settings/payment-method');
    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    const defaultCard = page.locator('.default-card');
    
    if (await defaultCard.isVisible().catch(() => false)) {
      await expect(defaultCard.locator('button.secondary')).toContainText('Update');
    }
  });

});
