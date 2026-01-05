import { test, expect } from '@playwright/test';

test.describe('Avatar Selection - Functional Tests', () => {

  test('Click on avatar navigates with selected avatar parameter', async ({ page }) => {
    await page.goto('/account-settings/avatar-selection?returnUrl=/account-settings/edit-profile/test', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

    // Click on an avatar
    const avatarItem = page.locator('.avatar-item').nth(3);
    await expect(avatarItem).toBeVisible({ timeout: 10000 });
    await avatarItem.click({ force: true });

    // Should navigate with selectedAvatar parameter
    await expect(page).toHaveURL(/selectedAvatar=/, { timeout: 10000 });
  });

  test('Carousel right arrow scrolls to reveal more avatars', async ({ page }) => {
    await page.goto('/account-settings/avatar-selection', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

    // Find Alphabet section (has 26 items)
    const alphabetSection = page.locator('.avatar-category-section:has(.avatar-category-title:has-text("Alphabet"))');
    const rightArrow = alphabetSection.locator('.carousel-arrow.right');
    
    await expect(rightArrow).toBeVisible({ timeout: 10000 });
    
    // Click right arrow
    await rightArrow.click();
    
    // Left arrow should no longer be disabled
    await expect(alphabetSection.locator('.carousel-arrow.left')).not.toHaveClass(/disabled/, { timeout: 5000 });
  });

  test('Continue button with current avatar keeps same avatar', async ({ page }) => {
    await page.goto('/account-settings/avatar-selection?currentAvatar=1.1&returnUrl=/account-settings/edit-profile/test', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

    // Continue button should be visible
    const continueButton = page.locator('.continue-current-avatar-button');
    await expect(continueButton).toBeVisible({ timeout: 10000 });

    // Click Continue
    await continueButton.click();

    // Should navigate back
    await expect(page).not.toHaveURL(/\/avatar-selection/, { timeout: 10000 });
  });

  test('Cancel button navigates back to return URL', async ({ page }) => {
    await page.goto('/account-settings/avatar-selection?returnUrl=/account-settings/profiles', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

    // Click Cancel
    await page.locator('.secondary-button:has-text("Cancel")').click();

    // Should navigate to return URL
    await expect(page).toHaveURL(/\/profiles/, { timeout: 10000 });
  });

  test('Back button navigates back', async ({ page }) => {
    await page.goto('/account-settings/avatar-selection?returnUrl=/account-settings/profiles', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

    // Click Back
    await page.locator('.back-button').click();

    // Should navigate to return URL
    await expect(page).toHaveURL(/\/profiles/, { timeout: 10000 });
  });

  test('Avatar selection shows checkmark on selected avatar', async ({ page }) => {
    await page.goto('/account-settings/avatar-selection?currentAvatar=1.1', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

    // Checkmark should be visible on current avatar
    await expect(page.locator('.avatar-checkmark')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.avatar-item.selected')).toBeVisible();
  });

  test('All alphabet avatars (26 letters) are available', async ({ page }) => {
    await page.goto('/account-settings/avatar-selection', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

    // Find alphabet section
    const alphabetSection = page.locator('.avatar-category-section:has(.avatar-category-title:has-text("Alphabet"))');
    await expect(alphabetSection).toBeVisible({ timeout: 10000 });

    // Verify all 26 letters exist
    const alphabetAvatars = alphabetSection.locator('.avatar-item.alphabet-avatar');
    const count = await alphabetAvatars.count();
    expect(count).toBe(26);
  });

});
