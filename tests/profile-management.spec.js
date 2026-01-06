import { test, expect } from '@playwright/test';

// Helper pour naviguer vers une page protégée (gère la redirection Email verification)
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

// Helper pour s'assurer qu'on peut créer un profil
// Ne supprime un profil que si le maximum de 5 est atteint
const ensureCanCreateProfile = async (page) => {
  await gotoProtectedPage(page, '/account-settings/select-profile');
  await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });
  
  const profileCount = await page.locator('.profile-item:not(.add-profile)').count();
  
  // Si moins de 5 profils, on peut créer sans supprimer
  if (profileCount < 5) {
    return true;
  }
  
  // Maximum atteint (5 profils) - supprimer un profil non-primary pour faire de la place
  await gotoProtectedPage(page, '/account-settings/profiles');
  await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
  
  const profiles = page.locator('.profile-settings .link-card');
  const count = await profiles.count();
  
  for (let i = count - 1; i >= 0; i--) {
    const profile = profiles.nth(i);
    const isPrimary = await profile.locator('.primary-profile-badge').isVisible().catch(() => false);
    
    if (!isPrimary) {
      await profile.click();
      await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
      
      const dangerZone = page.locator('.danger-zone');
      if (await dangerZone.isVisible()) {
        await page.locator('.danger-zone .link-card:has-text("Delete Profile")').click();
        await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
        await page.click('.modal-actions button:has-text("Delete profile")');
        await expect(page).toHaveURL(/\/account-settings\/select-profile/, { timeout: 15000 });
        return true; // Profil supprimé avec succès
      }
    }
  }
  
  // Aucun profil non-primary trouvé à supprimer (tous sont primary ou pas de danger zone)
  return false;
};

test.describe('Profile Management - Functional Tests', () => {

  test.describe('Profile Creation', () => {

    test('Empty profile name shows validation error', async ({ page }) => {
      // Ensure we can create a profile first
      await ensureCanCreateProfile(page);
      
      await gotoProtectedPage(page, '/account-settings/create-profile');
      await expect(page.locator('h1')).toContainText('Create Profile', { timeout: 15000 });

      // Trigger validation
      await page.click('input#name');
      await page.click('input#isChild');

      await expect(page.locator('.error-message')).toContainText('Profile name is required', { timeout: 10000 });
    });

    test('Name too short shows validation error', async ({ page }) => {
      // Ensure we can create a profile first
      await ensureCanCreateProfile(page);
      
      await gotoProtectedPage(page, '/account-settings/create-profile');
      await expect(page.locator('h1')).toContainText('Create Profile', { timeout: 15000 });

      await page.fill('input#name', 'A');
      await page.click('input#isChild');

      await expect(page.locator('.error-message')).toContainText('at least 2 characters', { timeout: 10000 });
    });

    test('Cancel button returns to profile selection', async ({ page }) => {
      // Ensure we can create a profile first
      await ensureCanCreateProfile(page);
      
      await gotoProtectedPage(page, '/account-settings/create-profile');
      await expect(page.locator('h1')).toContainText('Create Profile', { timeout: 15000 });

      await page.click('button:has-text("Cancel")');

      await expect(page).toHaveURL(/\/account-settings\/select-profile/, { timeout: 15000 });
    });

    test('isChild checkbox toggles', async ({ page }) => {
      // Ensure we can create a profile first
      await ensureCanCreateProfile(page);
      
      await gotoProtectedPage(page, '/account-settings/create-profile');
      await expect(page.locator('h1')).toContainText('Create Profile', { timeout: 15000 });
      
      const checkbox = page.locator('input#isChild');
      await expect(checkbox).not.toBeChecked();
      await checkbox.check();
      await expect(checkbox).toBeChecked();
    });

    test('Profile creation succeeds with valid data', async ({ page }) => {
      // Ensure we can create a profile first
      const canCreate = await ensureCanCreateProfile(page);
      
      if (!canCreate) {
        test.skip('Cannot free up space for profile creation');
        return;
      }
      
      // Go to create profile page
      await gotoProtectedPage(page, '/account-settings/create-profile');
      await expect(page.locator('h1')).toContainText('Create Profile', { timeout: 15000 });
      
      // Generate unique profile name
      const testProfileName = `Test_${Date.now().toString().slice(-6)}`;
      
      // Fill form and ensure no validation errors
      const nameInput = page.locator('input#name');
      await expect(nameInput).toBeVisible({ timeout: 5000 });
      await nameInput.fill(testProfileName);
      await nameInput.blur();
      
      // Wait and verify no validation error
      await page.waitForTimeout(500);
      const errorMessage = page.locator('.error-message');
      const hasError = await errorMessage.isVisible().catch(() => false);
      if (hasError) {
        const errorText = await errorMessage.textContent();
        console.log('Validation error:', errorText);
      }
      
      // Try multiple selectors for the submit button
      const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first();
      await expect(submitButton).toBeVisible({ timeout: 5000 });
      await expect(submitButton).toBeEnabled({ timeout: 5000 });
      
      // Click with promise.all to wait for potential navigation
      await Promise.all([
        page.waitForURL(url => !url.pathname.includes('/create-profile'), { timeout: 30000 }).catch(() => null),
        submitButton.click()
      ]);
      
      // Additional wait for navigation
      await page.waitForTimeout(2000);
      
      // Should redirect away from create-profile page
      await expect(page).not.toHaveURL(/\/create-profile/, { timeout: 20000 });
      
      // Navigate to profiles to verify the new profile exists
      await gotoProtectedPage(page, '/account-settings/profiles');
      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      
      // Wait for profiles to load
      await page.waitForTimeout(2000);
      
      // Verify the new profile appears in the list (use first() to avoid strict mode violation)
      const testProfile = page.locator(`.profile-settings .link-card:has-text("${testProfileName}")`).first();
      await expect(testProfile).toBeVisible({ timeout: 15000 });
      
      // CLEANUP: Delete the profile we just created
      await testProfile.click();
      await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
      
      const deleteButton = page.locator('.danger-zone .link-card:has-text("Delete Profile")');
      if (await deleteButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await deleteButton.click();
        await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
        await page.click('.modal-actions button:has-text("Delete profile")');
        await expect(page).toHaveURL(/\/account-settings\/select-profile/, { timeout: 15000 });
      }
    });

  });

  test.describe('Profiles Navigation', () => {

    test('Click on profile navigates to manage-profile-preferences', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/profiles');
      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      
      const firstProfile = page.locator('.profile-settings .link-card').first();
      await expect(firstProfile).toBeVisible({ timeout: 15000 });
      await firstProfile.click();

      await expect(page).toHaveURL(/\/account-settings\/manage-profile-preferences\//, { timeout: 15000 });
    });

    test('Switch Active Profile navigates to select-profile', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/profiles');
      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      
      await page.locator('.link-card:has-text("Switch Active Profile")').click();

      await expect(page).toHaveURL(/\/account-settings\/select-profile/, { timeout: 15000 });
    });

    test('Edit profile navigates to edit-profile page', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/profiles');
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
      await gotoProtectedPage(page, '/account-settings/profiles');
      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      
      const firstProfile = page.locator('.profile-settings .link-card').first();
      await expect(firstProfile).toBeVisible({ timeout: 15000 });
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

    test('Profile update succeeds with Save button', async ({ page }) => {
      await goToFirstProfileEdit(page);
      
      // Get original name
      const originalName = await page.locator('input#name').inputValue();
      
      // Change name temporarily
      const newName = `${originalName}_edited`;
      await page.fill('input#name', newName);
      
      // Click Save button
      await page.click('button[type="submit"]:has-text("Save")');
      
      // Should redirect to profiles page after successful update
      await expect(page).toHaveURL(/\/account-settings\/profiles/, { timeout: 15000 });
      
      // Verify the updated name appears
      await expect(page.locator(`text=${newName}`)).toBeVisible({ timeout: 10000 });
      
      // Restore original name
      const updatedProfile = page.locator(`.profile-settings .link-card:has-text("${newName}")`);
      await updatedProfile.click();
      await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
      await page.locator('.link-card:has-text("Edit personal and contact info")').click();
      await expect(page.locator('h1')).toContainText('Edit Profile', { timeout: 15000 });
      
      await page.fill('input#name', originalName);
      await page.click('button[type="submit"]:has-text("Save")');
      await expect(page).toHaveURL(/\/account-settings\/profiles/, { timeout: 15000 });
    });

    test('Invalid email shows validation error', async ({ page }) => {
      await goToFirstProfileEdit(page);
      
      // Find email field if it exists
      const emailInput = page.locator('input#email, input[name="email"]');
      const hasEmailField = await emailInput.isVisible().catch(() => false);
      
      if (hasEmailField) {
        // Clear and enter invalid email
        await emailInput.fill('invalid-email');
        await emailInput.blur();
        
        // Should show validation error
        await expect(page.locator('.error-message')).toContainText('valid email', { timeout: 5000 });
        
        // Clear the invalid email
        await emailInput.fill('');
      } else {
        test.skip('Email field not visible on this page');
      }
    });

    test('Avatar change from edit page works', async ({ page }) => {
      await goToFirstProfileEdit(page);
      
      // Get current avatar selector button (has class avatar-selector-box)
      const avatarButton = page.locator('.avatar-selector-box');
      await expect(avatarButton).toBeVisible({ timeout: 10000 });
      
      // Click on avatar to go to selection page
      await avatarButton.click();
      
      // Should navigate to avatar selection page
      await expect(page).toHaveURL(/\/account-settings\/avatar-selection/, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 10000 });
      
      // Select a different avatar
      const avatars = page.locator('.avatar-item');
      const avatarCount = await avatars.count();
      
      if (avatarCount > 1) {
        // Click on a different avatar (not the first one which might be selected)
        await avatars.nth(2).click();
        
        // Should redirect back to edit page with selectedAvatar parameter
        await expect(page).toHaveURL(/selectedAvatar=/, { timeout: 10000 });
      }
    });

  });

  test.describe('Profile Deletion', () => {

    test('Delete button on non-primary profile opens confirmation modal', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/profiles');
      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      
      // Wait for profiles to fully load
      await page.waitForTimeout(2000);
      
      // Find non-primary profile
      const profiles = page.locator('.profile-settings .link-card');
      await expect(profiles.first()).toBeVisible({ timeout: 15000 });
      const count = await profiles.count();
      
      for (let i = 0; i < count; i++) {
        // Re-fetch profiles on each iteration to avoid stale elements
        await gotoProtectedPage(page, '/account-settings/profiles');
        await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
        await page.waitForTimeout(1000);
        
        const refreshedProfiles = page.locator('.profile-settings .link-card');
        const currentCount = await refreshedProfiles.count();
        
        if (i >= currentCount) break;
        
        const profile = refreshedProfiles.nth(i);
        const isPrimary = await profile.locator('.primary-profile-badge').isVisible().catch(() => false);
        
        if (!isPrimary) {
          await profile.click();
          await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
          
          const dangerZone = page.locator('.danger-zone');
          if (await dangerZone.isVisible({ timeout: 5000 }).catch(() => false)) {
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
      await gotoProtectedPage(page, '/account-settings/profiles');
      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      
      // Wait for profiles to load
      await page.waitForTimeout(2000);
      
      const profiles = page.locator('.profile-settings .link-card');
      await expect(profiles.first()).toBeVisible({ timeout: 10000 });
      const count = await profiles.count();
      
      for (let i = 0; i < count; i++) {
        // Re-navigate to profiles page for each iteration
        await gotoProtectedPage(page, '/account-settings/profiles');
        await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
        await page.waitForTimeout(1000);
        
        const profilesList = page.locator('.profile-settings .link-card');
        const currentCount = await profilesList.count();
        
        if (i >= currentCount) break;
        
        const profile = profilesList.nth(i);
        const isPrimary = await profile.locator('.primary-profile-badge').isVisible().catch(() => false);
        
        if (!isPrimary) {
          await profile.click();
          await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
          
          const dangerZone = page.locator('.danger-zone');
          if (await dangerZone.isVisible({ timeout: 5000 }).catch(() => false)) {
            await page.locator('.danger-zone .link-card:has-text("Delete Profile")').click();
            await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
            
            await page.click('.modal-actions button:has-text("Never mind")');
            
            await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 5000 });
            return;
          }
        }
      }
      
      test.skip('No non-primary profile found');
    });

    test('Primary profile shows info message (cannot be deleted)', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/profiles');
      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      
      const primaryProfile = page.locator('.profile-settings .link-card:has(.primary-profile-badge)').first();
      
      if (await primaryProfile.isVisible().catch(() => false)) {
        await primaryProfile.click();
        await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
        
        await expect(page.locator('.primary-profile-info')).toContainText('cannot be deleted', { timeout: 10000 });
      } else {
        test.skip('No primary profile badge found');
      }
    });

    test('Profile deletion succeeds when confirmed', async ({ page }) => {
      // First, create a test profile to delete
      await gotoProtectedPage(page, '/account-settings/select-profile');
      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });
      
      const initialProfileCount = await page.locator('.profile-item:not(.add-profile)').count();
      
      if (initialProfileCount >= 5) {
        test.skip('Maximum profiles reached - cannot create test profile');
        return;
      }
      
      // Create a test profile to delete
      await gotoProtectedPage(page, '/account-settings/create-profile');
      await expect(page.locator('h1')).toContainText('Create Profile', { timeout: 15000 });
      
      const testProfileName = `ToDelete_${Date.now().toString().slice(-6)}`;
      const nameInput = page.locator('input#name');
      await expect(nameInput).toBeVisible({ timeout: 5000 });
      await nameInput.fill(testProfileName);
      await nameInput.blur();
      
      // Submit the form with wait for navigation
      const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first();
      await expect(submitButton).toBeVisible({ timeout: 5000 });
      await expect(submitButton).toBeEnabled({ timeout: 5000 });
      
      await Promise.all([
        page.waitForURL(url => !url.pathname.includes('/create-profile'), { timeout: 30000 }).catch(() => null),
        submitButton.click()
      ]);
      
      await page.waitForTimeout(2000);
      await expect(page).not.toHaveURL(/\/create-profile/, { timeout: 20000 });
      
      // Navigate to profiles page
      await gotoProtectedPage(page, '/account-settings/profiles');
      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      await page.waitForTimeout(2000);
      
      // Find and click the test profile
      const testProfile = page.locator(`.profile-settings .link-card:has-text("${testProfileName}")`).first();
      await expect(testProfile).toBeVisible({ timeout: 15000 });
      await testProfile.click();
      
      await expect(page.locator('h1')).toContainText('Manage Profile and Preferences', { timeout: 15000 });
      
      // Click Delete Profile in danger zone
      const deleteButton = page.locator('.danger-zone .link-card:has-text("Delete Profile")');
      await expect(deleteButton).toBeVisible({ timeout: 10000 });
      await deleteButton.click();
      
      // Modal should appear
      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.modal-header, .modal-title')).toContainText('Delete Profile');
      
      // Confirm deletion
      await page.click('.modal-actions button:has-text("Delete profile")');
      
      // Should redirect to select-profile after successful deletion
      await expect(page).toHaveURL(/\/account-settings\/select-profile/, { timeout: 15000 });
      
      // Wait for page to stabilize and profiles to refresh
      await page.waitForLoadState('load', { timeout: 15000 });
      await page.waitForTimeout(2000);
      
      // Navigate to profiles page to verify deletion
      await gotoProtectedPage(page, '/account-settings/profiles');
      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      await page.waitForTimeout(2000);
      
      // Verify the profile is no longer in the list
      await expect(page.locator(`.profile-settings .link-card:has-text("${testProfileName}")`)).not.toBeVisible({ timeout: 10000 });
    });

  });

});
