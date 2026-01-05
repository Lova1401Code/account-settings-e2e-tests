import { test, expect } from '@playwright/test';

test.describe('Profile Management - Real Tests', () => {
  // Ce fichier utilise le storageState global pour l'authentification

  // ============================================
  // PROFILE CREATION TESTS
  // ============================================
  test.describe('Profile Creation', () => {

    test('Display of the profile creation page', async ({ page }) => {
      await page.goto('/account-settings/create-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Create Profile', { timeout: 15000 });
      await expect(page.locator('.create-profile-subtitle')).toContainText('profiles', { timeout: 10000 });
      await expect(page.locator('input#name')).toBeVisible();
      await expect(page.locator('input#isChild')).toBeVisible();
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
      await expect(page.locator('button:has-text("Create Profile")')).toBeVisible();
      await expect(page.locator('.back-button')).toBeVisible();
    });

    test('Validation - Empty profile name shows error', async ({ page }) => {
      await page.goto('/account-settings/create-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Create Profile', { timeout: 15000 });

      // Cliquer sur le champ name puis le quitter pour déclencher la validation
      await page.click('input#name');
      await page.click('input#isChild');

      await expect(page.locator('.error-message')).toContainText('Profile name is required', { timeout: 10000 });
    });

    test('Validation - Name too short shows error', async ({ page }) => {
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

    test('Back button returns to profile selection', async ({ page }) => {
      await page.goto('/account-settings/create-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Create Profile', { timeout: 15000 });
      await page.click('.back-button');

      await expect(page).toHaveURL(/\/account-settings\/select-profile/, { timeout: 15000 });
    });

    test('isChild checkbox is clickable', async ({ page }) => {
      await page.goto('/account-settings/create-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Create Profile', { timeout: 15000 });
      
      const checkbox = page.locator('input#isChild');
      await expect(checkbox).not.toBeChecked();
      await checkbox.check();
      await expect(checkbox).toBeChecked();
    });

  });

  // ============================================
  // PROFILES PAGE TESTS
  // ============================================
  test.describe('Profiles Page', () => {

    test('Display Profiles page with title', async ({ page }) => {
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
    });

    test('Display Email section', async ({ page }) => {
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      await expect(page.locator('.profile-email-menu')).toBeVisible({ timeout: 15000 });
    });

    test('Display Switch Profile section', async ({ page }) => {
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      await expect(page.locator('.switch-profile')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('h2:has-text("Switch Profile")')).toBeVisible();
    });

    test('Display Profile Settings section with profiles', async ({ page }) => {
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      await expect(page.locator('.profile-settings')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('h2:has-text("Profile Settings")')).toBeVisible();
      
      // Au moins un profil doit être affiché
      await expect(page.locator('.profile-settings .link-card').first()).toBeVisible({ timeout: 15000 });
    });

    test('Click on profile navigates to manage-profile-preferences', async ({ page }) => {
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      
      const firstProfile = page.locator('.profile-settings .link-card').first();
      await expect(firstProfile).toBeVisible({ timeout: 15000 });
      await firstProfile.click();

      await expect(page).toHaveURL(/\/account-settings\/manage-profile-preferences\//, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
    });

    test('Switch Active Profile link navigates to select-profile', async ({ page }) => {
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      
      await page.locator('.link-card:has-text("Switch Active Profile")').click();

      await expect(page).toHaveURL(/\/account-settings\/select-profile/, { timeout: 15000 });
    });

  });

  // ============================================
  // MANAGE PROFILE AND PREFERENCES PAGE TESTS
  // ============================================
  test.describe('Manage Profile and Preferences Page', () => {

    // Helper pour aller à la page de gestion du premier profil
    const goToFirstProfileManagement = async (page) => {
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      
      const firstProfile = page.locator('.profile-settings .link-card').first();
      await expect(firstProfile).toBeVisible({ timeout: 15000 });
      await firstProfile.click();
      
      await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
    };

    test('Display Manage Profile and Preferences page', async ({ page }) => {
      await goToFirstProfileManagement(page);
      
      await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
      await expect(page.locator('.back-button')).toBeVisible();
    });

    test('Display Edit personal and contact info link', async ({ page }) => {
      await goToFirstProfileManagement(page);
      
      await expect(page.locator('.link-card:has-text("Edit personal and contact info")')).toBeVisible({ timeout: 15000 });
    });

    test('Display Languages link in preferences', async ({ page }) => {
      await goToFirstProfileManagement(page);
      
      await expect(page.locator('.link-card:has-text("Languages")')).toBeVisible({ timeout: 15000 });
    });

    test('Display Subtitle appearance link', async ({ page }) => {
      await goToFirstProfileManagement(page);
      
      await expect(page.locator('.link-card:has-text("Subtitle appearance")')).toBeVisible({ timeout: 15000 });
    });

    test('Display Playback settings link', async ({ page }) => {
      await goToFirstProfileManagement(page);
      
      await expect(page.locator('.link-card:has-text("Playback settings")')).toBeVisible({ timeout: 15000 });
    });

    test('Display Notification settings link', async ({ page }) => {
      await goToFirstProfileManagement(page);
      
      await expect(page.locator('.link-card:has-text("Notification settings")')).toBeVisible({ timeout: 15000 });
    });

    test('Display Viewing activity link', async ({ page }) => {
      await goToFirstProfileManagement(page);
      
      await expect(page.locator('.link-card:has-text("Viewing activity")')).toBeVisible({ timeout: 15000 });
    });

    test('Display Privacy and data settings link', async ({ page }) => {
      await goToFirstProfileManagement(page);
      
      await expect(page.locator('.link-card:has-text("Privacy and data settings")')).toBeVisible({ timeout: 15000 });
    });

    test('Click Edit personal and contact info navigates to edit profile', async ({ page }) => {
      await goToFirstProfileManagement(page);
      
      await page.locator('.link-card:has-text("Edit personal and contact info")').click();
      
      await expect(page).toHaveURL(/\/account-settings\/edit-profile\//, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText('Edit Profile', { timeout: 15000 });
    });

    test('Back button returns to profiles page', async ({ page }) => {
      await goToFirstProfileManagement(page);
      
      await page.click('.back-button');
      
      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
    });

  });

  // ============================================
  // EDIT PROFILE PAGE TESTS
  // ============================================
  test.describe('Edit Profile Page', () => {

    // Helper pour aller à la page d'édition du premier profil
    const goToFirstProfileEdit = async (page) => {
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      
      const firstProfile = page.locator('.profile-settings .link-card').first();
      await expect(firstProfile).toBeVisible({ timeout: 15000 });
      await firstProfile.click();
      
      await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
      
      await page.locator('.link-card:has-text("Edit personal and contact info")').click();
      
      await expect(page.locator('h1')).toContainText('Edit Profile', { timeout: 15000 });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
    };

    test('Display Edit Profile page with form', async ({ page }) => {
      await goToFirstProfileEdit(page);
      
      await expect(page.locator('h1')).toContainText('Edit Profile', { timeout: 15000 });
      await expect(page.locator('input#name')).toBeVisible();
      await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    });

    test('Profile name field has a value', async ({ page }) => {
      await goToFirstProfileEdit(page);
      
      const nameValue = await page.locator('input#name').inputValue();
      expect(nameValue.length).toBeGreaterThan(0);
    });

    test('Validation - Empty name shows error', async ({ page }) => {
      await goToFirstProfileEdit(page);
      
      const originalName = await page.locator('input#name').inputValue();
      
      await page.fill('input#name', '');
      await page.locator('input#name').blur();
      
      await expect(page.locator('.error-message')).toBeVisible({ timeout: 5000 });
      
      // Restaurer le nom original
      await page.fill('input#name', originalName);
    });

    test('Validation - Name too short shows error', async ({ page }) => {
      await goToFirstProfileEdit(page);
      
      const originalName = await page.locator('input#name').inputValue();
      
      await page.fill('input#name', 'A');
      await page.locator('input#name').blur();
      
      await expect(page.locator('.error-message')).toContainText('at least 2 characters', { timeout: 5000 });
      
      // Restaurer le nom original
      await page.fill('input#name', originalName);
    });

    test('Cancel button goes back', async ({ page }) => {
      await goToFirstProfileEdit(page);
      
      await page.click('button:has-text("Cancel")');
      
      // Devrait revenir à la page précédente (manage-profile-preferences)
      await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
    });

    test('Back button goes back', async ({ page }) => {
      await goToFirstProfileEdit(page);
      
      await page.click('.back-button');
      
      // Devrait revenir à la page précédente
      await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
    });

  });

  // ============================================
  // PROFILE DELETION TESTS
  // ============================================
  test.describe('Profile Deletion Modal', () => {

    // Helper pour aller à la page de gestion d'un profil non-primaire
    const goToNonPrimaryProfileManagement = async (page) => {
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      
      // Essayer de trouver un profil non-primaire
      const profiles = page.locator('.profile-settings .link-card');
      const count = await profiles.count();
      
      for (let i = 0; i < count; i++) {
        const profile = profiles.nth(i);
        const isPrimary = await profile.locator('.primary-profile-badge').isVisible().catch(() => false);
        
        if (!isPrimary) {
          await profile.click();
          await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
          await page.waitForLoadState('networkidle', { timeout: 30000 });
          return true;
        }
      }
      
      return false;
    };

    test('Delete Profile button opens confirmation modal', async ({ page }) => {
      const found = await goToNonPrimaryProfileManagement(page);
      
      if (!found) {
        test.skip();
        return;
      }
      
      // Vérifier si la danger-zone est visible
      const dangerZone = page.locator('.danger-zone');
      const isDangerZoneVisible = await dangerZone.isVisible();
      
      if (!isDangerZoneVisible) {
        // C'est probablement le profil primaire
        test.skip();
        return;
      }
      
      await page.locator('.danger-zone .link-card:has-text("Delete Profile")').click();
      
      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.modal-header')).toContainText('Delete Profile');
      await expect(page.locator('.modal-body')).toContainText("won't be able to access it again");
      await expect(page.locator('.modal-actions button:has-text("Delete profile")')).toBeVisible();
      await expect(page.locator('.modal-actions button:has-text("Never mind")')).toBeVisible();
    });

    test('Cancel deletion with Never mind', async ({ page }) => {
      const found = await goToNonPrimaryProfileManagement(page);
      
      if (!found) {
        test.skip();
        return;
      }
      
      const dangerZone = page.locator('.danger-zone');
      const isDangerZoneVisible = await dangerZone.isVisible();
      
      if (!isDangerZoneVisible) {
        test.skip();
        return;
      }
      
      await page.locator('.danger-zone .link-card:has-text("Delete Profile")').click();
      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
      
      await page.click('.modal-actions button:has-text("Never mind")');
      
      await expect(page.locator('.modal-overlay')).not.toBeVisible();
      await expect(page.locator('h1')).toContainText('Manage Profile and Preferences');
    });

    test('Close delete modal with close button', async ({ page }) => {
      const found = await goToNonPrimaryProfileManagement(page);
      
      if (!found) {
        test.skip();
        return;
      }
      
      const dangerZone = page.locator('.danger-zone');
      const isDangerZoneVisible = await dangerZone.isVisible();
      
      if (!isDangerZoneVisible) {
        test.skip();
        return;
      }
      
      await page.locator('.danger-zone .link-card:has-text("Delete Profile")').click();
      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
      
      await page.click('.modal-close');
      
      await expect(page.locator('.modal-overlay')).not.toBeVisible();
    });

    test('Primary profile shows info message instead of delete', async ({ page }) => {
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      
      // Chercher le profil primaire
      const primaryProfile = page.locator('.profile-settings .link-card:has(.primary-profile-badge)').first();
      const isPrimaryVisible = await primaryProfile.isVisible().catch(() => false);
      
      if (!isPrimaryVisible) {
        test.skip();
        return;
      }
      
      await primaryProfile.click();
      await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      
      // Le profil primaire ne doit pas avoir de danger-zone
      await expect(page.locator('.primary-profile-info')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.primary-profile-info')).toContainText('cannot be deleted');
    });

  });

});
