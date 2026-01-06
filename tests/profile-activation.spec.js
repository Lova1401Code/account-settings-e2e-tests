import { test, expect } from '@playwright/test';

test.describe('Profile Activation - Functional Tests', () => {

  test('Click on profile activates it and redirects to home', async ({ page }) => {
    await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

    const firstProfile = page.locator('.profile-item:not(.add-profile)').first();
    await expect(firstProfile).toBeVisible({ timeout: 15000 });

    await firstProfile.click();

    // Wait for navigation away from select-profile
    await expect(page).not.toHaveURL(/\/select-profile/, { timeout: 15000 });
    
    // Wait for page to stabilize after navigation
    await page.waitForLoadState('load', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const profileId = await page.evaluate(() => localStorage.getItem('profileId'));
    expect(profileId).toBeTruthy();
  });

  test('Manage Profiles button switches to manage mode', async ({ page }) => {
    await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

    await page.locator('button:has-text("MANAGE PROFILES")').click();

    await expect(page.locator('h1')).toContainText('Manage Profiles', { timeout: 15000 });
    await expect(page.locator('button:has-text("DONE")')).toBeVisible();
  });

  test('Manage mode - click on profile redirects to management page', async ({ page }) => {
    await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

    await page.locator('button:has-text("MANAGE PROFILES")').click();
    await expect(page.locator('h1')).toContainText('Manage Profiles', { timeout: 15000 });

    const firstProfile = page.locator('.profile-item:not(.add-profile)').first();
    await expect(firstProfile).toBeVisible({ timeout: 15000 });
    await firstProfile.click();

    await expect(page).toHaveURL(/\/account-settings\/manage-profile-preferences\//, { timeout: 15000 });
  });

  test('DONE button returns to normal selection mode', async ({ page }) => {
    await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

    await page.locator('button:has-text("MANAGE PROFILES")').click();
    await expect(page.locator('h1')).toContainText('Manage Profiles', { timeout: 15000 });

    await page.locator('button:has-text("DONE")').click();

    await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });
  });

  test('Add Profile button navigates to create profile page', async ({ page }) => {
    await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

    const addProfileButton = page.locator('.profile-item.add-profile');
    
    if (await addProfileButton.isVisible()) {
      await addProfileButton.click();
      await expect(page).toHaveURL(/\/account-settings\/create-profile/, { timeout: 15000 });
    } else {
      test.skip('Max profiles reached');
    }
  });

});
