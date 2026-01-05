import { test, expect } from '@playwright/test';

test.describe('Payment method - Payment method management', () => {
  // Ce fichier utilise le storageState global pour l'authentification
  // Tests avec les vraies données du backend

  test('Display of the payment methods page', async ({ page }) => {
    await page.goto('/account-settings/payment-method');

    // Verify the page title
    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    // Verify the subtitle
    await expect(page.locator('.payment-method-subtitle')).toContainText('Control how you pay');
  });

  test('Display of the default payment method section', async ({ page }) => {
    await page.goto('/account-settings/payment-method');

    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    // Verify that either default card or empty state is visible
    const hasDefaultCard = await page.locator('.default-card').isVisible().catch(() => false);
    const hasEmptyCard = await page.locator('.empty-method-card').isVisible().catch(() => false);
    
    expect(hasDefaultCard || hasEmptyCard).toBeTruthy();
  });

  test('"Add Payment Method" button visible', async ({ page }) => {
    await page.goto('/account-settings/payment-method');

    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    // Verify the Add Payment Method button
    await expect(page.locator('.add-payment-section button')).toBeVisible();
  });

  test('Add Payment Method button text', async ({ page }) => {
    await page.goto('/account-settings/payment-method');

    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    // Verify the Add Payment Method button text
    await expect(page.locator('.add-payment-section button')).toContainText('Add Payment Method');
  });

  test('Opening the add payment method modal', async ({ page }) => {
    await page.goto('/account-settings/payment-method');

    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    // Click on "Add Payment Method"
    await page.click('.add-payment-section button');

    // Verify that the modal is open
    await expect(page.locator('.modal, [role="dialog"], .add-payment-modal')).toBeVisible({ timeout: 10000 });
  });

  test('Back button is visible', async ({ page }) => {
    await page.goto('/account-settings/payment-method');

    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    // Verify the Back button
    await expect(page.locator('.back-button')).toBeVisible();
  });

  test('Back button navigates back', async ({ page }) => {
    // First go to membership to have a history
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Then go to payment-method
    await page.goto('/account-settings/payment-method');
    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    // Click on Back
    await page.click('.back-button');

    // Should go back to membership
    await expect(page).toHaveURL(/\/account-settings\/membership\/?$/, { timeout: 15000 });
  });

  test('Navigation from the Membership page', async ({ page }) => {
    // Go to membership
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Click on "Manage payment method"
    await page.click('text=Manage payment method');

    // Verify the navigation
    await expect(page).toHaveURL(/\/account-settings\/payment-method\/?$/);
    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });
  });

  test.describe('With payment method saved', () => {
    // Ces tests vérifient le comportement quand une méthode de paiement existe
    
    test('Default card shows badge', async ({ page }) => {
      await page.goto('/account-settings/payment-method');
      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

      const defaultCard = page.locator('.default-card');
      const hasDefaultCard = await defaultCard.isVisible().catch(() => false);

      if (hasDefaultCard) {
        // Verify the default badge
        await expect(defaultCard.locator('.badge-default')).toContainText('Default');
      }
    });

    test('Card number is masked', async ({ page }) => {
      await page.goto('/account-settings/payment-method');
      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

      const cardNumber = page.locator('.payment-card-number').first();
      const hasCardNumber = await cardNumber.isVisible().catch(() => false);

      if (hasCardNumber) {
        // Verify the masked number format (•••• •••• •••• XXXX)
        await expect(cardNumber).toContainText('••••');
      }
    });

    test('Update button on default card', async ({ page }) => {
      await page.goto('/account-settings/payment-method');
      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

      const defaultCard = page.locator('.default-card');
      const hasDefaultCard = await defaultCard.isVisible().catch(() => false);

      if (hasDefaultCard) {
        // Verify the Update button
        await expect(defaultCard.locator('button.secondary')).toContainText('Update');
      }
    });
  });

  test.describe('Without payment method', () => {
    test('Empty state message displayed when no payment method', async ({ page }) => {
      await page.goto('/account-settings/payment-method');
      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

      const emptyCard = page.locator('.empty-method-card');
      const hasEmptyCard = await emptyCard.isVisible().catch(() => false);

      if (hasEmptyCard) {
        // Verify the empty state message
        await expect(emptyCard).toContainText('No payment method');
      }
    });
  });
});
