import { test, expect } from '@playwright/test';

test.describe('Profile Management - Functional Tests', () => {

  test.describe('Profile Creation', () => {

    test('Empty profile name shows validation error', async ({ page }) => {
      await page.goto('/account-settings/create-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Create Profile', { timeout: 15000 });

      // Trigger validation
      await page.click('input#name');
      await page.click('input#isChild');

      await expect(page.locator('.error-message')).toContainText('Profile name is required', { timeout: 10000 });
    });

    test('Name too short shows validation error', async ({ page }) => {
      await page.goto('/account-settings/create-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Create Profile', { timeout: 15000 });

      await page.fill('input#name', 'A');
      await page.click('input#isChild');

      await expect(page.locator('.error-message')).toContainText('at least 2 characters', { timeout: 10000 });
    });

    test('Cancel button returns to profile selection', async ({ page }) => {
      await page.goto('/account-settings/create-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Create Profile', { timeout: 15000 });

      await page.click('button:has-text("Cancel")');

      await expect(page).toHaveURL(/\/account-settings\/select-profile/, { timeout: 15000 });
    });

    test('isChild checkbox toggles', async ({ page }) => {
      await page.goto('/account-settings/create-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Create Profile', { timeout: 15000 });
      
      const checkbox = page.locator('input#isChild');
      await expect(checkbox).not.toBeChecked();
      await checkbox.check();
      await expect(checkbox).toBeChecked();
    });

  });

  test.describe('Profiles Navigation', () => {

    test('Click on profile navigates to manage-profile-preferences', async ({ page }) => {
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      
      const firstProfile = page.locator('.profile-settings .link-card').first();
      await expect(firstProfile).toBeVisible({ timeout: 15000 });
      await firstProfile.click();

      await expect(page).toHaveURL(/\/account-settings\/manage-profile-preferences\//, { timeout: 15000 });
    });

    test('Switch Active Profile navigates to select-profile', async ({ page }) => {
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      
      await page.locator('.link-card:has-text("Switch Active Profile")').click();

      await expect(page).toHaveURL(/\/account-settings\/select-profile/, { timeout: 15000 });
    });

    test('Edit profile navigates to edit-profile page', async ({ page }) => {
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      
      const firstProfile = page.locator('.profile-settings .link-card').first();
      await firstProfile.click();
      
      await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
      
      await page.locator('.link-card:has-text("Edit personal and contact info")').click();
      
      await expect(page).toHaveURL(/\/account-settings\/edit-profile\//, { timeout: 15000 });
    });

  });

  test.describe('Edit Profile', () => {

    const goToFirstProfileEdit = async (page) => {
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      
      const firstProfile = page.locator('.profile-settings .link-card').first();
      await firstProfile.click();
      
      await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
      await page.locator('.link-card:has-text("Edit personal and contact info")').click();
      await expect(page.locator('h1')).toContainText('Edit Profile', { timeout: 15000 });
    };

    test('Empty profile name shows validation error', async ({ page }) => {
      await goToFirstProfileEdit(page);
      
      const originalName = await page.locator('input#name').inputValue();
      
      await page.fill('input#name', '');
      await page.locator('input#name').blur();
      
      await expect(page.locator('.error-message')).toBeVisible({ timeout: 5000 });
      
      // Restore name
      await page.fill('input#name', originalName);
    });

    test('Name too short shows validation error', async ({ page }) => {
      await goToFirstProfileEdit(page);
      
      const originalName = await page.locator('input#name').inputValue();
      
      await page.fill('input#name', 'A');
      await page.locator('input#name').blur();
      
      await expect(page.locator('.error-message')).toContainText('at least 2 characters', { timeout: 5000 });
      
      // Restore name
      await page.fill('input#name', originalName);
    });

    test('Cancel button navigates back', async ({ page }) => {
      await goToFirstProfileEdit(page);
      
      await page.click('button:has-text("Cancel")');
      
      await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
    });

  });

  test.describe('Profile Deletion', () => {

    test('Delete button on non-primary profile opens confirmation modal', async ({ page }) => {
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      
      // Find non-primary profile
      const profiles = page.locator('.profile-settings .link-card');
      const count = await profiles.count();
      
      for (let i = 0; i < count; i++) {
        const profile = profiles.nth(i);
        const isPrimary = await profile.locator('.primary-profile-badge').isVisible().catch(() => false);
        
        if (!isPrimary) {
          await profile.click();
          await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
          
          const dangerZone = page.locator('.danger-zone');
          if (await dangerZone.isVisible()) {
            await page.locator('.danger-zone .link-card:has-text("Delete Profile")').click();
            
            await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
            await expect(page.locator('.modal-header')).toContainText('Delete Profile');
            return;
          }
        }
      }
      
      test.skip('No non-primary profile found');
    });

    test('Never mind button closes deletion modal', async ({ page }) => {
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      
      const profiles = page.locator('.profile-settings .link-card');
      const count = await profiles.count();
      
      for (let i = 0; i < count; i++) {
        const profile = profiles.nth(i);
        const isPrimary = await profile.locator('.primary-profile-badge').isVisible().catch(() => false);
        
        if (!isPrimary) {
          await profile.click();
          await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
          
          const dangerZone = page.locator('.danger-zone');
          if (await dangerZone.isVisible()) {
            await page.locator('.danger-zone .link-card:has-text("Delete Profile")').click();
            await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
            
            await page.click('.modal-actions button:has-text("Never mind")');
            
            await expect(page.locator('.modal-overlay')).not.toBeVisible();
            return;
          }
        }
      }
      
      test.skip('No non-primary profile found');
    });

    test('Primary profile shows info message (cannot be deleted)', async ({ page }) => {
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      
      const primaryProfile = page.locator('.profile-settings .link-card:has(.primary-profile-badge)').first();
      
      if (await primaryProfile.isVisible().catch(() => false)) {
        await primaryProfile.click();
        await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
        
        await expect(page.locator('.primary-profile-info')).toContainText('cannot be deleted', { timeout: 10000 });
      } else {
        test.skip('No primary profile badge found');
      }
    });

  });

});
