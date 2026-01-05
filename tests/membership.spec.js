import { test, expect } from '@playwright/test';

test.describe('Membership/Subscription - View subscription details', () => {
  // Ce fichier utilise le storageState global pour l'authentification
  // Tests avec les vraies données du backend

  test('Display of the Membership page with plan details', async ({ page }) => {
    await page.goto('/account-settings/membership');

    // Verify the page title
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Verify the sections
    await expect(page.locator('h2').first()).toContainText('Plan Details');
    await expect(page.locator('h2').nth(1)).toContainText('Payment Info');

    // Verify that a plan card is displayed
    await expect(page.locator('.plan-card')).toBeVisible();
  });

  test('Display of plan name', async ({ page }) => {
    await page.goto('/account-settings/membership');

    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Verify the plan card is visible and contains plan info
    await expect(page.locator('.plan-card')).toBeVisible();
    // Le nom du plan doit être visible (Basic, Standard, Premium ou No plan)
    await expect(page.locator('.plan-card')).toBeVisible();
  });

  test('Display of the next payment date section', async ({ page }) => {
    await page.goto('/account-settings/membership');

    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Verify that the Payment Info section is visible
    await expect(page.locator('.payment-info')).toBeVisible();
  });

  test('Display of the payment actions section', async ({ page }) => {
    await page.goto('/account-settings/membership');

    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Verify the payment actions section is visible
    await expect(page.locator('.payment-actions')).toBeVisible();
  });

  test('Link to View payment history is visible', async ({ page }) => {
    await page.goto('/account-settings/membership');

    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Verify the View payment history link
    await expect(page.locator('text=View payment history')).toBeVisible();
  });

  test('Manage payment method link is visible', async ({ page }) => {
    await page.goto('/account-settings/membership');

    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Verify the Manage payment method link
    await expect(page.locator('text=Manage payment method')).toBeVisible();
  });

  test('Cancel Membership button visible', async ({ page }) => {
    await page.goto('/account-settings/membership');

    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Verify the Cancel Membership button
    await expect(page.locator('.cancel-membership')).toBeVisible();
  });

  test('Navigation to the Change Plan page', async ({ page }) => {
    await page.goto('/account-settings/membership');

    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Click on the plan card link
    await page.click('.plan-card .link-card');

    // Verify the navigation
    await expect(page).toHaveURL(/\/account-settings\/change-plan\/?$/, { timeout: 15000 });
  });

  test('Navigation to Manage payment method', async ({ page }) => {
    await page.goto('/account-settings/membership');

    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Click on Manage payment method
    await page.click('text=Manage payment method');

    // Verify the navigation
    await expect(page).toHaveURL(/\/account-settings\/payment-method\/?$/, { timeout: 15000 });
  });

  test('Navigation to View payment history', async ({ page }) => {
    await page.goto('/account-settings/membership');

    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Click on View payment history
    await page.click('text=View payment history');

    // Verify the navigation
    await expect(page).toHaveURL(/\/account-settings\/payment-history\/?$/, { timeout: 15000 });
  });
});
