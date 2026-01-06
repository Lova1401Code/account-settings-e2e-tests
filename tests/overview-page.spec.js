import { test, expect } from '@playwright/test';

test.describe('Overview Page - Functional Tests', () => {

  // Helper pour attendre que la page Overview soit complètement chargée
  const waitForOverviewPage = async (page) => {
    await page.goto('/account-settings/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('Overview', { timeout: 15000 });
  };

  test.describe('Membership & Billing', () => {
    
    test('Displays membership information correctly', async ({ page }) => {
      await waitForOverviewPage(page);
      
      // Wait for membership card to load
      const membershipCard = page.locator('.membership-card');
      await expect(membershipCard).toBeVisible({ timeout: 15000 });
      
      // Check all required fields are displayed
      await expect(page.locator('.membership-label:has-text("Member since")')).toBeVisible();
      await expect(page.locator('.membership-label:has-text("Plan")')).toBeVisible();
      await expect(page.locator('.membership-label:has-text("Next payment")')).toBeVisible();
      await expect(page.locator('.membership-label:has-text("Payment method")')).toBeVisible();
      
      // Check plan value (should be either plan name or "No plan")
      const planValue = await page.locator('.membership-row:has(.membership-label:has-text("Plan")) .membership-value').textContent();
      expect(planValue.includes('plan') || planValue.includes('No plan')).toBeTruthy();
      
      // Check payment method value (should be card ending or "No payment method")
      const paymentValue = await page.locator('.membership-row:has(.membership-label:has-text("Payment method")) .membership-value').textContent();
      expect(paymentValue.includes('••••') || paymentValue.includes('No payment method')).toBeTruthy();
    });

    test('Manage membership link navigates to membership page', async ({ page }) => {
      await waitForOverviewPage(page);
      
      await expect(page.locator('.membership-card')).toBeVisible({ timeout: 15000 });
      
      const manageMembershipLink = page.locator('.membership-actions .link-card:has-text("Manage membership")');
      await expect(manageMembershipLink).toBeVisible({ timeout: 10000 });
      await manageMembershipLink.click();
      
      await expect(page).toHaveURL(/\/account-settings\/membership/, { timeout: 10000 });
    });
  });

  test.describe('Quick Links Navigation', () => {
    
    test('Change plan navigates correctly', async ({ page }) => {
      await waitForOverviewPage(page);
      await page.locator('.quick-links .link-card:has-text("Change plan")').click();
      await expect(page).toHaveURL(/\/account-settings\/change-plan/, { timeout: 10000 });
    });

    test('Manage payment method navigates correctly', async ({ page }) => {
      await waitForOverviewPage(page);
      await page.locator('.quick-links .link-card:has-text("Manage payment method")').click();
      await expect(page).toHaveURL(/\/account-settings\/payment-method/, { timeout: 10000 });
    });

    test('Manage access and devices navigates correctly', async ({ page }) => {
      await waitForOverviewPage(page);
      await page.locator('.quick-links .link-card:has-text("Manage access and devices")').click();
      await expect(page).toHaveURL(/\/account-settings\/manage-access/, { timeout: 10000 });
    });

    test('Update password navigates correctly', async ({ page }) => {
      await waitForOverviewPage(page);
      await page.locator('.quick-links .link-card:has-text("Update password")').click();
      await expect(page).toHaveURL(/\/account-settings\/change-password/, { timeout: 10000 });
    });

    test('Edit settings navigates correctly', async ({ page }) => {
      await waitForOverviewPage(page);
      await page.locator('.quick-links .link-card:has-text("Edit settings")').click();
      await expect(page).toHaveURL(/\/account-settings\/manage-profile-preferences/, { timeout: 10000 });
    });

    test('Manage profiles navigates correctly', async ({ page }) => {
      await waitForOverviewPage(page);
      await page.locator('.quick-links .link-card:has-text("Manage profiles")').click();
      await expect(page).toHaveURL(/\/account-settings\/profiles/, { timeout: 10000 });
    });

    test('My contact information navigates correctly', async ({ page }) => {
      await waitForOverviewPage(page);
      await page.locator('.quick-links .link-card:has-text("My contact information")').click();
      await expect(page).toHaveURL(/\/account-settings\/security/, { timeout: 10000 });
    });
  });

  test.describe('Sidebar Navigation', () => {
    
    test('Overview is active when on overview page', async ({ page }) => {
      await waitForOverviewPage(page);
      const overviewItem = page.locator('.sidebar-item:has-text("Overview")');
      await expect(overviewItem).toHaveClass(/active/);
    });

    test('Sidebar links navigate to correct pages', async ({ page }) => {
      const sidebarLinks = [
        { name: 'Membership', url: /\/account-settings\/membership/ },
        { name: 'Security', url: /\/account-settings\/security/ },
        { name: 'Devices', url: /\/account-settings\/devices/ },
        { name: 'Profiles', url: /\/account-settings\/profiles/ },
        { name: 'Preferences', url: /\/account-settings\/preferences/ },
        { name: 'FAQ', url: /\/account-settings\/faq/ },
      ];

      for (const link of sidebarLinks) {
        // Navigation directe au lieu de recharger la page entière
        await page.goto('/account-settings/', { waitUntil: 'load' });
        await expect(page.locator('h1')).toContainText('Overview', { timeout: 10000 });
        
        const sidebarItem = page.locator(`.sidebar-item:has-text("${link.name}")`);
        await expect(sidebarItem).toBeVisible({ timeout: 5000 });
        await sidebarItem.click();
        await expect(page).toHaveURL(link.url, { timeout: 15000 });
      }
    });
  });

});

