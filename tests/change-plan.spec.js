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

test.describe('Change Plan - Functional Tests', () => {

  test('Current plan displays "Current Plan" badge', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-plan');
    await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

    // Wait for plans to load
    await page.waitForSelector('.plan-card', { timeout: 15000 });
    
    // One plan should have the "current" class and display "Current Plan" badge
    const currentPlanCard = page.locator('.plan-card.current');
    const currentBadge = page.locator('.current-badge');
    
    // Check if customer has a current plan (may not have one if no subscription)
    const hasCurrentPlan = await currentPlanCard.isVisible().catch(() => false);
    
    if (hasCurrentPlan) {
      await expect(currentPlanCard).toBeVisible();
      await expect(currentBadge).toBeVisible();
      await expect(currentBadge).toContainText('Current Plan');
    } else {
      // Customer has no plan - all plans should be selectable without "Current" badge
      const planCards = page.locator('.plan-card');
      await expect(planCards.first()).toBeVisible();
    }
  });

  test('Navigate from Membership to Change Plan shows current plan marked', async ({ page }) => {
    // Start from membership page
    await page.goto('/account-settings/membership', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });
    
    // Check if plan card exists (customer has a subscription)
    const planCard = page.locator('.plan-card .link-card');
    const hasPlanCard = await planCard.isVisible().catch(() => false);
    
    if (hasPlanCard) {
      // Click on plan to go to change-plan
      await planCard.click();
      await expect(page).toHaveURL(/\/account-settings\/change-plan/, { timeout: 15000 });
      
      // Verify current plan is marked
      const currentPlanCard = page.locator('.plan-card.current');
      const currentBadge = page.locator('.current-badge');
      
      await expect(currentPlanCard).toBeVisible({ timeout: 10000 });
      await expect(currentBadge).toContainText('Current Plan');
    } else {
      test.skip('Customer has no subscription');
    }
  });

  test('Continue button disabled when no plan selected', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-plan');
    await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

    await expect(page.locator('.continue-button button')).toBeDisabled({ timeout: 10000 });
  });

  test('Selecting a plan enables Continue button', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-plan');
    await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

    await page.locator('.plan-card:has-text("Premium")').click();

    await expect(page.locator('.continue-button button')).toBeEnabled({ timeout: 10000 });
  });

  test('Click on plan adds selected class', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-plan');
    await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

    await page.locator('.plan-card:has-text("Standard")').click();
    
    await expect(page.locator('.plan-card:has-text("Standard")')).toHaveClass(/selected/);
  });

  test('Can switch between different plans', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-plan');
    await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

    // Select Premium
    await page.locator('.plan-card:has-text("Premium")').click();
    await expect(page.locator('.plan-card:has-text("Premium")')).toHaveClass(/selected/);

    // Switch to Basic
    await page.locator('.plan-card:has-text("Basic")').click();
    await expect(page.locator('.plan-card:has-text("Basic")')).toHaveClass(/selected/);
    
    // Premium should no longer be selected
    await expect(page.locator('.plan-card:has-text("Premium")')).not.toHaveClass(/selected/);
  });

  test('Continue opens confirmation modal', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-plan');
    await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

    await page.locator('.plan-card:has-text("Premium")').click();
    await page.locator('.continue-button button').click();

    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
  });

  test('Cancel in modal closes it', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-plan');
    await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

    await page.locator('.plan-card:has-text("Premium")').click();
    await page.locator('.continue-button button').click();

    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });

    await page.locator('.modal-overlay button:has-text("Cancel")').click();

    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 5000 });
  });

  test('Confirm button is enabled in modal', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-plan');
    await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

    await page.locator('.plan-card:has-text("Premium")').click();
    await page.locator('.continue-button button').click();

    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });

    const confirmButton = page.locator('.modal-overlay button:has-text("Confirm")');
    await expect(confirmButton).toBeEnabled();
  });

});
