import { test, expect } from '@playwright/test';

test.describe('Switch Profile - Functional Tests', () => {

  test('Click on profile switches and redirects to home', async ({ page }) => {
    await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

    const profiles = page.locator('.profile-item:not(.add-profile)');
    await expect(profiles.first()).toBeVisible({ timeout: 15000 });

    await profiles.first().click();

    // Wait for navigation away from select-profile
    await page.waitForLoadState('load', { timeout: 15000 });
    await expect(page).not.toHaveURL(/\/select-profile/, { timeout: 15000 });
  });

  test('Profile switch saves profileId to localStorage', async ({ page }) => {
    await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

    const profiles = page.locator('.profile-item:not(.add-profile)');
    await expect(profiles.first()).toBeVisible({ timeout: 15000 });

    await profiles.first().click();
    
    // Wait for navigation away from select-profile
    await page.waitForLoadState('load', { timeout: 15000 });
    await expect(page).not.toHaveURL(/\/select-profile/, { timeout: 15000 });
    await page.waitForTimeout(1000);

    const profileId = await page.evaluate(() => localStorage.getItem('profileId'));
    expect(profileId).toBeTruthy();
  });

  test('Add Profile button navigates to create-profile', async ({ page }) => {
    await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

    const addProfileButton = page.locator('.profile-item.add-profile');
    
    if (await addProfileButton.isVisible()) {
      await addProfileButton.click();
      await expect(page).toHaveURL(/\/account-settings\/create-profile/, { timeout: 15000 });
    } else {
      test.skip('Max profiles reached - Add Profile not visible');
    }
  });

  test('Manage Profiles button switches to manage mode', async ({ page }) => {
    await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

    await page.click('button:has-text("MANAGE PROFILES")');

    await expect(page.locator('h1')).toContainText('Manage Profiles');
    await expect(page.locator('button:has-text("DONE")')).toBeVisible();
  });

  test('In manage mode, clicking profile goes to preferences', async ({ page }) => {
    await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

    await page.click('button:has-text("MANAGE PROFILES")');
    await expect(page.locator('h1')).toContainText('Manage Profiles');

    const firstProfile = page.locator('.profile-item:not(.add-profile)').first();
    await expect(firstProfile).toBeVisible({ timeout: 15000 });
    await firstProfile.click();

    await expect(page).toHaveURL(/\/account-settings\/manage-profile-preferences\//, { timeout: 15000 });
  });

  test('DONE button returns to selection mode', async ({ page }) => {
    await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

    await page.click('button:has-text("MANAGE PROFILES")');
    await expect(page.locator('h1')).toContainText('Manage Profiles');

    await page.click('button:has-text("DONE")');

    await expect(page.locator('h1')).toContainText("Who's watching");
  });

  test('Switch Active Profile from profiles page', async ({ page }) => {
    await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });

    await page.locator('.link-card:has-text("Switch Active Profile")').click();

    await expect(page).toHaveURL(/\/account-settings\/select-profile/, { timeout: 15000 });
  });

  test('Switch between multiple profiles', async ({ page }) => {
    await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

    const profiles = page.locator('.profile-item:not(.add-profile)');
    await expect(profiles.first()).toBeVisible({ timeout: 15000 });
    const profileCount = await profiles.count();

    if (profileCount >= 2) {
      // First switch - click and wait for navigation
      await profiles.first().click();
      await expect(page).not.toHaveURL(/\/select-profile/, { timeout: 20000 });
      
      // Wait for page to fully stabilize (wait for networkidle or load)
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
      await page.waitForTimeout(2000);
      
      // Verify profileId is saved
      const firstProfileId = await page.evaluate(() => localStorage.getItem('profileId'));
      expect(firstProfileId).toBeTruthy();

      // Back to selection
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });
      
      // Re-fetch profiles after navigation
      const refreshedProfiles = page.locator('.profile-item:not(.add-profile)');
      await expect(refreshedProfiles.first()).toBeVisible({ timeout: 15000 });

      // Second switch - click and wait for navigation
      await refreshedProfiles.nth(1).click();
      await expect(page).not.toHaveURL(/\/select-profile/, { timeout: 20000 });
      
      // Wait for page to fully stabilize
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
      await page.waitForTimeout(2000);
      
      // Verify profileId is saved
      const secondProfileId = await page.evaluate(() => localStorage.getItem('profileId'));
      expect(secondProfileId).toBeTruthy();
    } else {
      test.skip('Need at least 2 profiles to test switching');
    }
  });

  test('Maximum profiles hides Add Profile button', async ({ page }) => {
    await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

    const profileCount = await page.locator('.profile-item:not(.add-profile)').count();

    if (profileCount === 5) {
      await expect(page.locator('.profile-item.add-profile')).not.toBeVisible();
    } else {
      await expect(page.locator('.profile-item.add-profile')).toBeVisible();
    }
  });

});
