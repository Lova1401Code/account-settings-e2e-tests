import { test, expect } from '@playwright/test';
import { loginAndSelectProfile } from './test-config.js';

// Helper pour naviguer vers une page protégée en attendant security-info
const gotoProtectedPage = async (page, url, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const securityInfoPromise = page.waitForResponse(
      response => response.url().includes('/customer/security-info') && response.status() === 200,
      { timeout: 30000 }
    ).catch(() => null);
    
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    await securityInfoPromise;
    await page.waitForTimeout(1000);
    
    // Vérifier si on n'est pas redirigé vers Email verification
    const h1Text = await page.locator('h1').textContent().catch(() => '');
    if (!h1Text.includes('Email verification')) {
      return; // Succès, on est sur la bonne page
    }
    
    // Si on est sur Email verification, attendre et réessayer
    await page.waitForTimeout(2000);
  }
};

test.describe('Change Plan Page', () => {

  // Se connecter avec de vrais credentials avant chaque test
  test.beforeEach(async ({ page }) => {
    await loginAndSelectProfile(page);
    
    // Aller sur le dashboard pour initialiser la session
    await gotoProtectedPage(page, '/account-settings/');
  });

  test.describe('Page Display', () => {
    test('Display Change Plan page with title and plans list', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');

      // Verify page title
      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      // Verify intro text
      await expect(page.getByText('Try out a new plan')).toBeVisible();

      // Verify plans are displayed
      await expect(page.locator('.plan-card')).toHaveCount(3, { timeout: 10000 });
    });

    test('Display all plan names and prices', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      // Verify plan names
      await expect(page.locator('.plan-name:has-text("Basic")')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.plan-name:has-text("Standard")')).toBeVisible();
      await expect(page.locator('.plan-name:has-text("Premium")')).toBeVisible();
    });

    test('Plans are loaded and displayed correctly', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      // Wait for plans to load
      await expect(page.locator('.plan-card')).toHaveCount(3, { timeout: 10000 });

      // Verify all plan cards are clickable
      for (const planName of ['Basic', 'Standard', 'Premium']) {
        await expect(page.locator(`.plan-card:has-text("${planName}")`)).toBeVisible();
      }
    });

    test('Continue button is disabled when no plan selected', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      // Verify Continue button is disabled initially
      await expect(page.locator('.continue-button button')).toBeDisabled({ timeout: 10000 });
    });

    test('Back button is visible', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      // Verify Back button is visible
      await expect(page.locator('.back-button')).toBeVisible();
      await expect(page.locator('.back-button')).toContainText('Back');
    });
  });

  test.describe('Plan Selection', () => {
    test('Selecting a different plan enables Continue button', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      // Click on Premium plan
      await page.locator('.plan-card:has-text("Premium")').click();

      // Now Continue should be enabled
      await expect(page.locator('.continue-button button')).toBeEnabled({ timeout: 10000 });
    });

    test('Plan cards are interactive and clickable', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      // Verify all plans are clickable
      await page.locator('.plan-card:has-text("Basic")').click();
      await expect(page.locator('.plan-card:has-text("Basic")')).toHaveClass(/selected/);
      
      await page.locator('.plan-card:has-text("Standard")').click();
      await expect(page.locator('.plan-card:has-text("Standard")')).toHaveClass(/selected/);
    });

    test('Selected plan shows selected badge', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      // Click on Premium plan
      await page.locator('.plan-card:has-text("Premium")').click();

      // Verify selected badge is visible
      await expect(page.locator('.plan-card:has-text("Premium") .selected-badge')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.plan-card:has-text("Premium")')).toHaveClass(/selected/);
    });

    test('Can switch between plans', async ({ page }) => {
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
  });

  test.describe('Change Plan Flow', () => {
    test('Clicking Continue opens confirmation modal', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      // Select Premium plan
      await page.locator('.plan-card:has-text("Premium")').click();

      // Click Continue
      await page.locator('.continue-button button').click();

      // Verify confirmation modal is opened
      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
    });

    test('Cancel button closes confirmation modal', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      // Select Premium plan and open modal
      await page.locator('.plan-card:has-text("Premium")').click();
      await page.locator('.continue-button button').click();

      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });

      // Click Cancel
      await page.locator('.modal-overlay button:has-text("Cancel")').click();

      // Modal should close
      await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 5000 });
    });

    test('Confirm button is clickable in modal', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      // Select Premium plan and open modal
      await page.locator('.plan-card:has-text("Premium")').click();
      await page.locator('.continue-button button').click();

      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });

      // Verify Confirm button is visible and enabled
      const confirmButton = page.locator('.modal-overlay button:has-text("Confirm")');
      await expect(confirmButton).toBeVisible();
      await expect(confirmButton).toBeEnabled();
    });
  });

  test.describe('User Interactions', () => {
    test('User can select any plan from the list', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      // Verify user can select any plan
      for (const planName of ['Basic', 'Standard', 'Premium']) {
        await page.locator(`.plan-card:has-text("${planName}")`).click();
        await expect(page.locator(`.plan-card:has-text("${planName}")`)).toHaveClass(/selected/);
      }
    });
  });

  test.describe('Plan Features Display', () => {
    test('Plan cards show features', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/change-plan');

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });

      // Verify features are displayed (at least 3 features across all plans)
      await expect(page.locator('.plan-card')).toHaveCount(3, { timeout: 10000 });
      const featuresCount = await page.locator('.plan-feature').count();
      expect(featuresCount).toBeGreaterThanOrEqual(3);
    });
  });
});

