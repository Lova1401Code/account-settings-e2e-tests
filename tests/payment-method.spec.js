import { test, expect } from '@playwright/test';

test.describe('Payment Method - Functional Tests', () => {

  // Helper pour naviguer et attendre le chargement
  const gotoPaymentMethod = async (page) => {
    await page.goto('/account-settings/payment-method', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });
  };

  test.describe('Payment Information Display', () => {

    test('Default card displays payment info (brand, masked number, added date)', async ({ page }) => {
      await gotoPaymentMethod(page);
      
      const defaultCard = page.locator('.default-card');
      const hasPaymentMethod = await defaultCard.isVisible().catch(() => false);
      
      if (hasPaymentMethod) {
        // Card brand should be visible (Visa, Mastercard, etc.)
        const brand = defaultCard.locator('.payment-brand');
        await expect(brand).toBeVisible();
        
        // Masked card number should be displayed
        const cardNumber = defaultCard.locator('.payment-card-number');
        await expect(cardNumber).toBeVisible();
        await expect(cardNumber).toContainText('••••');
        
        // "Default" badge should be visible
        const defaultBadge = defaultCard.locator('.badge-default');
        await expect(defaultBadge).toBeVisible();
        await expect(defaultBadge).toContainText('Default');
        
        // Added date should be visible
        const addedDate = defaultCard.locator('.meta-item:has(.meta-label:has-text("Added"))');
        await expect(addedDate).toBeVisible();
      } else {
        // No payment method - should show empty state
        const emptyCard = page.locator('.empty-method-card');
        await expect(emptyCard).toBeVisible();
        await expect(emptyCard).toContainText('No payment method saved');
      }
    });

    test('Shows "No payment method saved" when no card exists', async ({ page }) => {
      await gotoPaymentMethod(page);
      
      const defaultCard = page.locator('.default-card');
      const hasPaymentMethod = await defaultCard.isVisible().catch(() => false);
      
      if (!hasPaymentMethod) {
        const emptyCard = page.locator('.empty-method-card');
        await expect(emptyCard).toBeVisible();
        await expect(emptyCard).toContainText('No payment method saved');
      }
    });
  });

  test.describe('Update Payment Method', () => {

    test('Update button on default card opens modal', async ({ page }) => {
      await gotoPaymentMethod(page);
      
      const defaultCard = page.locator('.default-card');
      const hasPaymentMethod = await defaultCard.isVisible().catch(() => false);
      
      if (hasPaymentMethod) {
        const updateButton = defaultCard.locator('button.secondary:has-text("Update")');
        await expect(updateButton).toBeVisible();
        
        await updateButton.click();
        
        // Modal should open
        await expect(page.locator('.modal-overlay, .modal, [role="dialog"]')).toBeVisible({ timeout: 10000 });
      } else {
        test.skip('No payment method to update');
      }
    });
  });

  test.describe('Add Payment Method', () => {

    test('Add Payment Method button is always visible', async ({ page }) => {
      await gotoPaymentMethod(page);
      
      const addButton = page.locator('.add-payment-section button');
      await expect(addButton).toBeVisible();
      await expect(addButton).toContainText('Add Payment Method');
    });

    test('Add Payment Method button opens modal', async ({ page }) => {
      await gotoPaymentMethod(page);
      
      await page.click('.add-payment-section button');
      
      await expect(page.locator('.modal-overlay, .modal, [role="dialog"]')).toBeVisible({ timeout: 10000 });
    });

    test('Modal has payment form fields', async ({ page }) => {
      await gotoPaymentMethod(page);
      
      await page.click('.add-payment-section button');
      
      const modal = page.locator('.modal-overlay, .modal, [role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 10000 });
      
      // Modal should have card input fields or iframe (Stripe/payment provider)
      const hasCardInput = await modal.locator('input, iframe, .card-element').first().isVisible().catch(() => false);
      expect(hasCardInput).toBeTruthy();
    });

    test('Modal can be closed', async ({ page }) => {
      await gotoPaymentMethod(page);
      
      await page.click('.add-payment-section button');
      
      const modal = page.locator('.modal-overlay, .modal, [role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 10000 });
      
      // Close modal via close button or cancel
      const closeButton = modal.locator('button:has-text("Cancel"), .close-button, button[aria-label="Close"]');
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
      } else {
        // Click outside modal
        await page.click('.modal-overlay', { position: { x: 10, y: 10 } });
      }
      
      await expect(modal).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Multiple Payment Methods', () => {

    test('Non-default cards have "Set as default" button', async ({ page }) => {
      await gotoPaymentMethod(page);
      
      const otherMethods = page.locator('.other-payments .payment-method-card');
      const hasOtherMethods = await otherMethods.first().isVisible().catch(() => false);
      
      if (hasOtherMethods) {
        const setDefaultButton = otherMethods.first().locator('button:has-text("Set as default")');
        await expect(setDefaultButton).toBeVisible();
      }
    });

    test('Non-default cards have "Remove" button', async ({ page }) => {
      await gotoPaymentMethod(page);
      
      const otherMethods = page.locator('.other-payments .payment-method-card');
      const hasOtherMethods = await otherMethods.first().isVisible().catch(() => false);
      
      if (hasOtherMethods) {
        const removeButton = otherMethods.first().locator('button:has-text("Remove")');
        await expect(removeButton).toBeVisible();
      }
    });
  });

  test.describe('Navigation', () => {

    test('Navigate from Membership to Payment Method', async ({ page }) => {
      await page.goto('/account-settings/membership', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

      await page.click('text=Manage payment method');

      await expect(page).toHaveURL(/\/account-settings\/payment-method\/?$/);
      await expect(page.locator('h1')).toContainText('Manage payment method');
    });

    test('Back button navigates back', async ({ page }) => {
      await page.goto('/account-settings/membership', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

      await page.goto('/account-settings/payment-method', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

      await page.click('.back-button');

      await expect(page).toHaveURL(/\/account-settings\/membership\/?$/, { timeout: 15000 });
    });
  });

});
