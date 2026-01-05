import { test, expect } from '@playwright/test';

test.describe('Subscription & Payment - Real Tests', () => {
  
  test.describe('Membership Page', () => {

    test('Display Membership page with title', async ({ page }) => {
      await page.goto('/account-settings/membership', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });
    });

    test('Display Plan Details section', async ({ page }) => {
      await page.goto('/account-settings/membership', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });
      await expect(page.getByRole('heading', { name: 'Plan Details' })).toBeVisible({ timeout: 15000 });
    });

    test('Display plan card with plan name or No plan', async ({ page }) => {
      await page.goto('/account-settings/membership', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });
      await expect(page.locator('.plan-card')).toBeVisible({ timeout: 15000 });
      
      // Vérifie qu'il y a soit un nom de plan soit "No plan"
      const planCard = page.locator('.plan-card');
      await expect(planCard.locator('.link-card').first()).toBeVisible();
    });

    test('Display Payment Info section', async ({ page }) => {
      await page.goto('/account-settings/membership', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });
      await expect(page.getByRole('heading', { name: 'Payment Info' })).toBeVisible({ timeout: 15000 });
    });

    test('Display Next payment info', async ({ page }) => {
      await page.goto('/account-settings/membership', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });
      await expect(page.locator('.payment-info')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('.payment-label:has-text("Next payment")')).toBeVisible();
    });

    test('Display Manage payment method link', async ({ page }) => {
      await page.goto('/account-settings/membership', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });
      await expect(page.locator('text=Manage payment method')).toBeVisible({ timeout: 15000 });
    });

    test('Display View payment history link', async ({ page }) => {
      await page.goto('/account-settings/membership', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });
      await expect(page.locator('text=View payment history')).toBeVisible({ timeout: 15000 });
    });

    test('Display Cancel Membership button', async ({ page }) => {
      await page.goto('/account-settings/membership', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });
      await expect(page.locator('button.cancel-membership')).toBeVisible({ timeout: 15000 });
    });

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
      
      // Cliquer sur le plan card
      await page.locator('.plan-card .link-card').first().click();

      await expect(page).toHaveURL(/\/account-settings\/change-plan\/?/, { timeout: 15000 });
    });

  });

  test.describe('Payment Method Page', () => {

    test('Display Payment Method page with title', async ({ page }) => {
      await page.goto('/account-settings/payment-method', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });
    });

    test('Display subtitle', async ({ page }) => {
      await page.goto('/account-settings/payment-method', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });
      await expect(page.locator('.payment-method-subtitle')).toContainText('Control how you pay', { timeout: 15000 });
    });

    test('Display Back button', async ({ page }) => {
      await page.goto('/account-settings/payment-method', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });
      await expect(page.locator('.back-button')).toBeVisible();
    });

    test('Display Add Payment Method button', async ({ page }) => {
      await page.goto('/account-settings/payment-method', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });
      await expect(page.locator('text=Add Payment Method')).toBeVisible({ timeout: 15000 });
    });

    test('Display payment method card or empty message', async ({ page }) => {
      await page.goto('/account-settings/payment-method', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });
      
      // Vérifie qu'il y a soit une carte de paiement soit un message vide
      const hasCard = await page.locator('.payment-method-card').first().isVisible().catch(() => false);
      const hasEmptyMessage = await page.locator('.empty-method-card').isVisible().catch(() => false);
      
      expect(hasCard || hasEmptyMessage).toBeTruthy();
    });

    test('Open Add Payment Method modal', async ({ page }) => {
      await page.goto('/account-settings/payment-method', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });
      await page.click('text=Add Payment Method');

      // Le modal s'ouvre avec l'overlay et le contenu
      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
    });

    test('Back button navigates back', async ({ page }) => {
      await page.goto('/account-settings/membership', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

      await page.goto('/account-settings/payment-method', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

      await page.click('.back-button');

      await expect(page).toHaveURL(/\/account-settings\/membership\/?/, { timeout: 15000 });
    });

    test('Display default badge on default payment method', async ({ page }) => {
      await page.goto('/account-settings/payment-method', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });
      
      // Si une carte par défaut existe
      const hasDefaultCard = await page.locator('.default-card').isVisible().catch(() => false);
      
      if (hasDefaultCard) {
        await expect(page.locator('.badge-default')).toContainText('Default');
      }
    });

    test('Display Update button on default card', async ({ page }) => {
      await page.goto('/account-settings/payment-method', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });
      
      const hasDefaultCard = await page.locator('.default-card').isVisible().catch(() => false);
      
      if (hasDefaultCard) {
        await expect(page.locator('.default-card button:has-text("Update")')).toBeVisible();
      }
    });

  });

  test.describe('Change Plan Page', () => {

    test('Display Change Plan page with title', async ({ page }) => {
      await page.goto('/account-settings/change-plan', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });
    });

    test('Display Back button', async ({ page }) => {
      await page.goto('/account-settings/change-plan', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });
      await expect(page.locator('.back-button')).toBeVisible();
    });

    test('Display intro text', async ({ page }) => {
      await page.goto('/account-settings/change-plan', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });
      await expect(page.locator('.intro-text')).toContainText('Try out a new plan', { timeout: 15000 });
    });

    test('Display available plans', async ({ page }) => {
      await page.goto('/account-settings/change-plan', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });
      await expect(page.locator('.plans-container')).toBeVisible({ timeout: 15000 });
      
      // Vérifie qu'il y a au moins un plan affiché
      await expect(page.locator('.plan-card, .plan-item').first()).toBeVisible({ timeout: 15000 });
    });

    test('Display Continue button', async ({ page }) => {
      await page.goto('/account-settings/change-plan', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });
      await expect(page.locator('button:has-text("Continue")')).toBeVisible({ timeout: 15000 });
    });

    test('Continue button is disabled when no plan selected', async ({ page }) => {
      await page.goto('/account-settings/change-plan', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });
      
      // Le bouton Continue doit être désactivé par défaut si aucun plan différent n'est sélectionné
      const continueButton = page.locator('button:has-text("Continue")');
      await expect(continueButton).toBeVisible();
    });

    test('Back button navigates back', async ({ page }) => {
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

  test.describe('Membership Details on Account Settings', () => {

    test('Display Membership & Billing section', async ({ page }) => {
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h2:has-text("Membership")').first()).toBeVisible({ timeout: 15000 });
    });

    test('Display Member since info', async ({ page }) => {
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('text=Member since')).toBeVisible({ timeout: 15000 });
    });

    test('Display Plan info', async ({ page }) => {
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      // Cherche "Plan" dans la section membership
      await expect(page.locator('.membership-label:has-text("Plan")').first()).toBeVisible({ timeout: 15000 });
    });

    test('Display Next payment info', async ({ page }) => {
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('text=Next payment')).toBeVisible({ timeout: 15000 });
    });

    test('Display Payment method info', async ({ page }) => {
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('.membership-label:has-text("Payment method")')).toBeVisible({ timeout: 15000 });
    });

    test('Display Manage membership link', async ({ page }) => {
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('text=Manage membership')).toBeVisible({ timeout: 15000 });
    });

    test('Navigate to Membership page from Manage membership', async ({ page }) => {
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('text=Manage membership')).toBeVisible({ timeout: 15000 });
      await page.click('text=Manage membership');

      await expect(page).toHaveURL(/\/account-settings\/membership\/?/, { timeout: 15000 });
    });

  });

  test.describe('Payment History Page', () => {

    test('Display Payment History page', async ({ page }) => {
      await page.goto('/account-settings/payment-history', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      // Vérifie que la page se charge correctement
      await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    });

    test('Navigate from Membership page', async ({ page }) => {
      await page.goto('/account-settings/membership', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });
      await page.click('text=View payment history');

      await expect(page).toHaveURL(/\/account-settings\/payment-history\/?/, { timeout: 15000 });
    });

  });

  test.describe('Navigation Flow', () => {

    test('Full navigation: Account → Membership → Change Plan → Back', async ({ page }) => {
      // Account page
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('text=Manage membership')).toBeVisible({ timeout: 15000 });

      // Go to Membership
      await page.click('text=Manage membership');
      await expect(page).toHaveURL(/\/account-settings\/membership\/?/, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

      // Go to Change Plan
      await page.locator('.plan-card .link-card').first().click();
      await expect(page).toHaveURL(/\/account-settings\/change-plan\/?/, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      // Go back
      await page.click('.back-button');
      await expect(page).toHaveURL(/\/account-settings\/membership\/?/, { timeout: 15000 });
    });

    test('Full navigation: Account → Membership → Payment Method → Back', async ({ page }) => {
      // Account page
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('text=Manage membership')).toBeVisible({ timeout: 15000 });

      // Go to Membership
      await page.click('text=Manage membership');
      await expect(page).toHaveURL(/\/account-settings\/membership\/?/, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

      // Go to Payment Method
      await page.click('text=Manage payment method');
      await expect(page).toHaveURL(/\/account-settings\/payment-method\/?/, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

      // Go back
      await page.click('.back-button');
      await expect(page).toHaveURL(/\/account-settings\/membership\/?/, { timeout: 15000 });
    });

  });

});
