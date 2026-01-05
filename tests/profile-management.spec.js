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
      return;
    }
    
    await page.waitForTimeout(2000);
  }
};

// Helper pour naviguer vers la page manage-profile-preferences du premier profil
const goToFirstProfileManagement = async (page) => {
  await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
  
  const firstProfile = page.locator('.profile-settings .link-card').first();
  await expect(firstProfile).toBeVisible({ timeout: 15000 });
  await firstProfile.click();
  
  await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
};

test.describe('Profile Management', () => {

  test.beforeEach(async ({ page }) => {
    await loginAndSelectProfile(page);
  });

  // ============================================
  // PROFILE CREATION TESTS
  // ============================================
  test.describe('Profile Creation', () => {

    test('Display of the profile creation page', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/');
      await gotoProtectedPage(page, '/account-settings/create-profile');

      await expect(page.locator('h1')).toContainText('Create Profile', { timeout: 15000 });
      await expect(page.locator('.create-profile-subtitle')).toContainText('profiles', { timeout: 10000 });
      await expect(page.locator('input#name')).toBeVisible();
      await expect(page.locator('input#isChild')).toBeVisible();
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
      await expect(page.locator('button:has-text("Create Profile")')).toBeVisible();
      await expect(page.locator('.back-button')).toBeVisible();
    });

    test('Validation - Empty profile name shows error', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/');
      await gotoProtectedPage(page, '/account-settings/create-profile');

      await expect(page.locator('h1')).toContainText('Create Profile', { timeout: 15000 });

      await page.click('input#name');
      await page.click('input#isChild');

      await expect(page.locator('.error-message')).toContainText('Profile name is required');
      await page.click('button:has-text("Create Profile")');
      await expect(page.locator('.error-message')).toBeVisible();
      await expect(page).toHaveURL(/\/account-settings\/create-profile/);
    });

    test('Validation - Name too short shows error', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/');
      await gotoProtectedPage(page, '/account-settings/create-profile');

      await expect(page.locator('h1')).toContainText('Create Profile', { timeout: 15000 });

      await page.fill('input#name', 'A');
      await page.click('input#isChild');

      await expect(page.locator('.error-message')).toContainText('at least 2 characters');
    });

    test('Cancel button returns to profile selection', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/');
      await gotoProtectedPage(page, '/account-settings/create-profile');

      await expect(page.locator('h1')).toContainText('Create Profile', { timeout: 15000 });
      await page.click('button:has-text("Cancel")');

      await page.waitForURL(/\/account-settings\/select-profile/, { timeout: 15000 });
    });

    test('Back button returns to profile selection', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/');
      await gotoProtectedPage(page, '/account-settings/create-profile');

      await expect(page.locator('h1')).toContainText('Create Profile', { timeout: 15000 });
      await page.click('.back-button');

      await page.waitForURL(/\/account-settings\/select-profile/, { timeout: 15000 });
    });

  });

  // ============================================
  // PROFILE MODIFICATION TESTS
  // ============================================
  test.describe('Profile Modification', () => {

    test('Navigate to edit profile page', async ({ page }) => {
      await goToFirstProfileManagement(page);
      
      await page.click('.link-card:has-text("Edit personal and contact info")');
      await expect(page.locator('h1')).toContainText('Edit Profile', { timeout: 15000 });
      await expect(page.locator('input#name')).toBeVisible();
    });

    test('Display of the edit profile page', async ({ page }) => {
      await goToFirstProfileManagement(page);
      await page.click('.link-card:has-text("Edit personal and contact info")');
      await expect(page.locator('h1')).toContainText('Edit Profile', { timeout: 15000 });
      
      const nameValue = await page.locator('input#name').inputValue();
      expect(nameValue.length).toBeGreaterThan(0);
      
      await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    });

    test('Validation - Empty name shows error', async ({ page }) => {
      await goToFirstProfileManagement(page);
      await page.click('.link-card:has-text("Edit personal and contact info")');
      await expect(page.locator('h1')).toContainText('Edit Profile', { timeout: 15000 });
      
      const originalName = await page.locator('input#name').inputValue();
      
      await page.fill('input#name', '');
      await page.locator('input#name').blur();
      
      await expect(page.locator('.error-message')).toBeVisible({ timeout: 5000 });
      
      await page.fill('input#name', originalName);
    });

    test('Validation - Name too short shows error', async ({ page }) => {
      await goToFirstProfileManagement(page);
      await page.click('.link-card:has-text("Edit personal and contact info")');
      await expect(page.locator('h1')).toContainText('Edit Profile', { timeout: 15000 });
      
      const originalName = await page.locator('input#name').inputValue();
      
      await page.fill('input#name', 'A');
      await page.locator('input#name').blur();
      
      await expect(page.locator('.error-message')).toContainText('at least 2 characters', { timeout: 5000 });
      
      await page.fill('input#name', originalName);
    });

    test('Cancel button goes back', async ({ page }) => {
      await goToFirstProfileManagement(page);
      await page.click('.link-card:has-text("Edit personal and contact info")');
      await expect(page.locator('h1')).toContainText('Edit Profile', { timeout: 15000 });
      
      await page.click('button:has-text("Cancel")');
      
      await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
    });

  });

  // ============================================
  // PROFILE DELETION TESTS
  // ============================================
  test.describe('Profile Deletion', () => {

    test('Delete Profile button opens confirmation modal', async ({ page }) => {
      await goToFirstProfileManagement(page);
      
      await page.click('.danger-zone .link-card:has-text("Delete Profile")');
      
      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.modal-header')).toContainText('Delete Profile');
      await expect(page.locator('.modal-body')).toContainText("won't be able to access it again");
      await expect(page.locator('.modal-actions button:has-text("Delete profile")')).toBeVisible();
      await expect(page.locator('.modal-actions button:has-text("Never mind")')).toBeVisible();
    });

    test('Cancel deletion with Never mind', async ({ page }) => {
      await goToFirstProfileManagement(page);
      
      await page.click('.danger-zone .link-card:has-text("Delete Profile")');
      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
      
      await page.click('.modal-actions button:has-text("Never mind")');
      
      await expect(page.locator('.modal-overlay')).not.toBeVisible();
      await expect(page.locator('h1')).toContainText('Manage Profile and Preferences');
    });

    test('Close delete modal with close button', async ({ page }) => {
      await goToFirstProfileManagement(page);
      
      await page.click('.danger-zone .link-card:has-text("Delete Profile")');
      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
      
      await page.click('.modal-close');
      
      await expect(page.locator('.modal-overlay')).not.toBeVisible();
    });

    test('Back button on manage-profile-preferences works', async ({ page }) => {
      await goToFirstProfileManagement(page);
      
      await page.click('.back-button');
      
      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
    });

  });

});

