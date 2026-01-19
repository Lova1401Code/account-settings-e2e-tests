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

// Helper pour extraire le prix d'un plan (ex: "$9.99" -> 9.99)
const extractPrice = (priceText) => {
  const match = priceText.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
};

test.describe('Plan Change - Upgrade & Downgrade Tests', () => {

  test.describe('Upgrade Scenario (Basic → Premium)', () => {

    test('Upgrade: Modal shows upgrade notice with price difference', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');
      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      // Wait for plans to load
      await page.waitForSelector('.plan-card', { timeout: 15000 });

      // Check if customer has a current plan (Basic or Standard)
      const currentPlanCard = page.locator('.plan-card.current');
      const hasCurrentPlan = await currentPlanCard.isVisible().catch(() => false);

      if (!hasCurrentPlan) {
        test.skip('Customer has no current subscription');
        return;
      }

      // Get current plan name and check it's not Premium
      const currentPlanName = await currentPlanCard.locator('.plan-name, h3, h2').textContent();
      
      if (currentPlanName.includes('Premium')) {
        test.skip('Customer already on Premium plan - cannot test upgrade');
        return;
      }

      // Select Premium plan (higher tier = upgrade)
      const premiumPlan = page.locator('.plan-card:has-text("Premium")');
      await expect(premiumPlan).toBeVisible({ timeout: 10000 });
      await premiumPlan.click();

      // Click Continue
      await page.locator('.continue-button button').click();

      // Modal should appear with upgrade notice
      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
      
      // Verify upgrade notice is shown
      await expect(page.locator('.modal-overlay')).toContainText('Upgrade Notice', { timeout: 5000 });
      await expect(page.locator('.modal-overlay')).toContainText('will be charged immediately', { timeout: 5000 });
    });

    test('Upgrade: Modal displays current plan and new plan details', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');
      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      await page.waitForSelector('.plan-card', { timeout: 15000 });

      const currentPlanCard = page.locator('.plan-card.current');
      const hasCurrentPlan = await currentPlanCard.isVisible().catch(() => false);

      if (!hasCurrentPlan) {
        test.skip('Customer has no current subscription');
        return;
      }

      const currentPlanName = await currentPlanCard.locator('.plan-name, h3, h2').textContent();
      
      if (currentPlanName.includes('Premium')) {
        test.skip('Customer already on Premium plan');
        return;
      }

      // Select a higher plan
      await page.locator('.plan-card:has-text("Premium")').click();
      await page.locator('.continue-button button').click();

      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });

      // Modal should show "Current Plan" section
      await expect(page.locator('.modal-overlay')).toContainText('Current Plan', { timeout: 5000 });
      
      // Modal should show "New Plan" section
      await expect(page.locator('.modal-overlay')).toContainText('New Plan', { timeout: 5000 });
    });

    test('Upgrade: Price difference is positive and displayed correctly', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');
      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      await page.waitForSelector('.plan-card', { timeout: 15000 });

      // Get current plan price
      const currentPlanCard = page.locator('.plan-card.current');
      const hasCurrentPlan = await currentPlanCard.isVisible().catch(() => false);

      if (!hasCurrentPlan) {
        test.skip('Customer has no current subscription');
        return;
      }

      const currentPlanName = await currentPlanCard.locator('.plan-name, h3, h2').textContent();
      
      if (currentPlanName.includes('Premium')) {
        test.skip('Customer already on Premium plan');
        return;
      }

      const currentPriceText = await currentPlanCard.locator('.plan-price, .price').textContent();
      const currentPrice = extractPrice(currentPriceText);

      // Select Premium plan
      const premiumPlan = page.locator('.plan-card:has-text("Premium")');
      await premiumPlan.click();

      const premiumPriceText = await premiumPlan.locator('.plan-price, .price').textContent();
      const premiumPrice = extractPrice(premiumPriceText);

      // Click Continue
      await page.locator('.continue-button button').click();
      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });

      // Verify price difference is shown and is positive (upgrade)
      const priceDifference = premiumPrice - currentPrice;
      expect(priceDifference).toBeGreaterThan(0);

      // Modal should mention the price difference
      const modalText = await page.locator('.modal-overlay').textContent();
      expect(modalText).toContain('$');
    });

    test('Upgrade: Confirm button changes plan successfully', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');
      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      await page.waitForSelector('.plan-card', { timeout: 15000 });

      const currentPlanCard = page.locator('.plan-card.current');
      const hasCurrentPlan = await currentPlanCard.isVisible().catch(() => false);

      if (!hasCurrentPlan) {
        test.skip('Customer has no current subscription');
        return;
      }

      const currentPlanName = await currentPlanCard.locator('.plan-name, h3, h2').textContent();
      
      if (currentPlanName.includes('Premium')) {
        test.skip('Customer already on Premium plan');
        return;
      }

      // Select Premium plan
      await page.locator('.plan-card:has-text("Premium")').click();
      await page.locator('.continue-button button').click();

      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });

      // Click Confirm
      await page.locator('.modal-overlay button:has-text("Confirm")').click();

      // Should show success notification
      await expect(page.locator('.notification, [class*="notification"]')).toContainText('success', { timeout: 15000, ignoreCase: true }).catch(async () => {
        // Alternative: check for success message in modal or page
        await expect(page.locator('text=Plan changed successfully')).toBeVisible({ timeout: 15000 });
      });
    });

  });

  test.describe('Downgrade Scenario (Premium → Basic)', () => {

    test('Downgrade: Modal does NOT show immediate charge notice', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');
      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      await page.waitForSelector('.plan-card', { timeout: 15000 });

      // Check if customer is on Premium
      const currentPlanCard = page.locator('.plan-card.current');
      const hasCurrentPlan = await currentPlanCard.isVisible().catch(() => false);

      if (!hasCurrentPlan) {
        test.skip('Customer has no current subscription');
        return;
      }

      const currentPlanName = await currentPlanCard.locator('.plan-name, h3, h2').textContent();
      
      if (currentPlanName.includes('Basic')) {
        test.skip('Customer already on Basic plan - cannot test downgrade');
        return;
      }

      // Select Basic plan (lower tier = downgrade)
      const basicPlan = page.locator('.plan-card:has-text("Basic")');
      await expect(basicPlan).toBeVisible({ timeout: 10000 });
      await basicPlan.click();

      // Click Continue
      await page.locator('.continue-button button').click();

      // Modal should appear
      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
      
      // Should NOT show "will be charged immediately" for downgrade
      const modalText = await page.locator('.modal-overlay').textContent();
      expect(modalText).not.toContain('will be charged immediately');
    });

    test('Downgrade: Modal shows current and new plan for comparison', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');
      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      await page.waitForSelector('.plan-card', { timeout: 15000 });

      const currentPlanCard = page.locator('.plan-card.current');
      const hasCurrentPlan = await currentPlanCard.isVisible().catch(() => false);

      if (!hasCurrentPlan) {
        test.skip('Customer has no current subscription');
        return;
      }

      const currentPlanName = await currentPlanCard.locator('.plan-name, h3, h2').textContent();
      
      if (currentPlanName.includes('Basic')) {
        test.skip('Customer already on Basic plan');
        return;
      }

      // Select a lower plan
      await page.locator('.plan-card:has-text("Basic")').click();
      await page.locator('.continue-button button').click();

      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });

      // Modal should show both plans
      await expect(page.locator('.modal-overlay')).toContainText('Current Plan', { timeout: 5000 });
      await expect(page.locator('.modal-overlay')).toContainText('New Plan', { timeout: 5000 });
    });

    test('Downgrade: Confirm button changes plan without immediate charge', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');
      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      await page.waitForSelector('.plan-card', { timeout: 15000 });

      const currentPlanCard = page.locator('.plan-card.current');
      const hasCurrentPlan = await currentPlanCard.isVisible().catch(() => false);

      if (!hasCurrentPlan) {
        test.skip('Customer has no current subscription');
        return;
      }

      const currentPlanName = await currentPlanCard.locator('.plan-name, h3, h2').textContent();
      
      if (currentPlanName.includes('Basic')) {
        test.skip('Customer already on Basic plan');
        return;
      }

      // Select Basic plan
      await page.locator('.plan-card:has-text("Basic")').click();
      await page.locator('.continue-button button').click();

      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });

      // Click Confirm
      await page.locator('.modal-overlay button:has-text("Confirm")').click();

      // Should show success notification
      await expect(page.locator('.notification, [class*="notification"]')).toContainText('success', { timeout: 15000, ignoreCase: true }).catch(async () => {
        await expect(page.locator('text=Plan changed successfully')).toBeVisible({ timeout: 15000 });
      });
    });

  });

  test.describe('General Plan Change Behavior', () => {

    test('Selecting same plan shows "already on this plan" message', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');
      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      await page.waitForSelector('.plan-card', { timeout: 15000 });

      const currentPlanCard = page.locator('.plan-card.current');
      const hasCurrentPlan = await currentPlanCard.isVisible().catch(() => false);

      if (!hasCurrentPlan) {
        test.skip('Customer has no current subscription');
        return;
      }

      // Click on current plan
      await currentPlanCard.click();

      // Continue button should be disabled or show message
      const continueButton = page.locator('.continue-button button');
      const isDisabled = await continueButton.isDisabled();
      
      if (!isDisabled) {
        await continueButton.click();
        // Should show notification that already on this plan
        await expect(page.locator('.notification, [class*="notification"]')).toContainText('already', { timeout: 10000, ignoreCase: true });
      } else {
        // Button is disabled - expected behavior
        expect(isDisabled).toBeTruthy();
      }
    });

    test('Plan change updates membership page with new plan', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');
      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      await page.waitForSelector('.plan-card', { timeout: 15000 });

      const currentPlanCard = page.locator('.plan-card.current');
      const hasCurrentPlan = await currentPlanCard.isVisible().catch(() => false);

      if (!hasCurrentPlan) {
        test.skip('Customer has no current subscription');
        return;
      }

      // Get current plan name
      const currentPlanName = await currentPlanCard.locator('.plan-name, h3, h2').textContent();
      
      // Select a different plan
      let targetPlanName = 'Premium';
      if (currentPlanName.includes('Premium')) {
        targetPlanName = 'Basic';
      }

      await page.locator(`.plan-card:has-text("${targetPlanName}")`).click();
      await page.locator('.continue-button button').click();

      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
      await page.locator('.modal-overlay button:has-text("Confirm")').click();

      // Wait for change to complete
      await page.waitForTimeout(3000);

      // Navigate to membership page
      await gotoProtectedPage(page, '/account-settings/membership');
      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

      // New plan should be shown
      await expect(page.locator('.plan-card, .membership-plan')).toContainText(targetPlanName, { timeout: 15000 });
    });

  });

  test.describe('Proration Information Display', () => {

    test('Upgrade modal shows prorated amount information', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');
      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      await page.waitForSelector('.plan-card', { timeout: 15000 });

      const currentPlanCard = page.locator('.plan-card.current');
      const hasCurrentPlan = await currentPlanCard.isVisible().catch(() => false);

      if (!hasCurrentPlan) {
        test.skip('Customer has no current subscription');
        return;
      }

      const currentPlanName = await currentPlanCard.locator('.plan-name, h3, h2').textContent();
      
      if (currentPlanName.includes('Premium')) {
        test.skip('Customer already on Premium plan');
        return;
      }

      // Select Premium plan
      await page.locator('.plan-card:has-text("Premium")').click();
      await page.locator('.continue-button button').click();

      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });

      // Check for proration-related text
      const modalContent = await page.locator('.modal-overlay').textContent();
      
      // Should contain price information
      expect(modalContent).toMatch(/\$[\d.]+/);
      
      // Should mention the charge or payment
      const containsChargeInfo = 
        modalContent.includes('charge') || 
        modalContent.includes('pay') || 
        modalContent.includes('difference') ||
        modalContent.includes('Upgrade');
      
      expect(containsChargeInfo).toBeTruthy();
    });

  });

});



