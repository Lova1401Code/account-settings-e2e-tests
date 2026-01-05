import { test, expect } from '@playwright/test';

test.describe('Avatar Selection Page - E2E Tests', () => {
  // Avatar categories expected
  const expectedCategories = ['Faces', 'Buildings', 'Transportation', 'Sports', 'Shapes', 'Animals', 'Alphabet'];

  test.describe('Page Display', () => {
    test('Display Avatar Selection page with title', async ({ page }) => {
      await page.goto('/account-settings/avatar-selection', { waitUntil: 'domcontentloaded' });

      // Verify page title
      await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

      // Verify subtitle
      await expect(page.getByText('Select an avatar for your profile')).toBeVisible();
    });

    test('Display Back button', async ({ page }) => {
      await page.goto('/account-settings/avatar-selection', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

      // Verify Back button
      await expect(page.locator('.back-button')).toBeVisible();
      await expect(page.locator('.back-button')).toContainText('Back');
    });

    test('Display Cancel button', async ({ page }) => {
      await page.goto('/account-settings/avatar-selection', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

      // Verify Cancel button
      await expect(page.locator('.secondary-button:has-text("Cancel")')).toBeVisible();
    });

    test('Display avatar categories', async ({ page }) => {
      await page.goto('/account-settings/avatar-selection', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

      // Verify categories are displayed
      await expect(page.locator('.avatar-category-section')).toHaveCount(7, { timeout: 10000 });
    });

    test('Display category titles', async ({ page }) => {
      await page.goto('/account-settings/avatar-selection', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

      // Verify some category titles are displayed
      await expect(page.locator('.avatar-category-title:has-text("Faces")')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.avatar-category-title:has-text("Animals")')).toBeVisible();
      await expect(page.locator('.avatar-category-title:has-text("Alphabet")')).toBeVisible();
    });
  });

  test.describe('Avatar Display', () => {
    test('Display avatar items in each category', async ({ page }) => {
      await page.goto('/account-settings/avatar-selection', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

      // Verify avatars are displayed
      const avatarItems = page.locator('.avatar-item');
      const count = await avatarItems.count();
      expect(count).toBeGreaterThan(50); // There are many avatars total
    });

    test('Display avatar images', async ({ page }) => {
      await page.goto('/account-settings/avatar-selection', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

      // Verify avatar images are displayed
      await expect(page.locator('.avatar-image').first()).toBeVisible({ timeout: 10000 });
    });

    test('Avatar items are clickable', async ({ page }) => {
      await page.goto('/account-settings/avatar-selection', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

      // Click on an avatar that's not blocked by carousel arrows (use nth to get one in the middle)
      const avatarItem = page.locator('.avatar-item').nth(3);
      await expect(avatarItem).toBeVisible({ timeout: 10000 });
      
      // Use force click to bypass any overlay issues
      await avatarItem.click({ force: true });
      
      // Should navigate away after clicking
      await expect(page).not.toHaveURL(/\/avatar-selection$/, { timeout: 5000 });
    });
  });

  test.describe('Carousel Navigation', () => {
    test('Display carousel navigation arrows', async ({ page }) => {
      await page.goto('/account-settings/avatar-selection', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

      // Verify left and right arrows exist
      await expect(page.locator('.carousel-arrow.left').first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.carousel-arrow.right').first()).toBeVisible();
    });

    test('Left arrow is visible at start', async ({ page }) => {
      await page.goto('/account-settings/avatar-selection', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

      // Left arrow should be visible
      await expect(page.locator('.carousel-arrow.left').first()).toBeVisible({ timeout: 10000 });
    });

    test('Right arrow is enabled when more items exist', async ({ page }) => {
      await page.goto('/account-settings/avatar-selection', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

      // For categories with many avatars, right arrow should be enabled
      // Alphabet category has 26 avatars, so it should have a scrollable carousel
      const alphabetSection = page.locator('.avatar-category-section:has(.avatar-category-title:has-text("Alphabet"))');
      await expect(alphabetSection.locator('.carousel-arrow.right')).toBeVisible({ timeout: 10000 });
    });

    test('Right arrow click scrolls carousel', async ({ page }) => {
      await page.goto('/account-settings/avatar-selection', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

      // Find a carousel with scrollable content (Alphabet has 26 items)
      const alphabetSection = page.locator('.avatar-category-section:has(.avatar-category-title:has-text("Alphabet"))');
      const rightArrow = alphabetSection.locator('.carousel-arrow.right');
      
      await expect(rightArrow).toBeVisible({ timeout: 10000 });
      
      // Click right arrow
      await rightArrow.click();
      
      // After clicking, left arrow should become enabled
      await expect(alphabetSection.locator('.carousel-arrow.left')).not.toHaveClass(/disabled/, { timeout: 5000 });
    });
  });

  test.describe('Current Avatar Mode', () => {
    test('Display current avatar section when editing', async ({ page }) => {
      // Navigate with currentAvatar parameter
      await page.goto('/account-settings/avatar-selection?currentAvatar=1.1', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

      // Verify "Current" section is displayed
      await expect(page.locator('.avatar-category-title:has-text("Current")')).toBeVisible({ timeout: 10000 });
    });

    test('Display Continue button with current avatar', async ({ page }) => {
      await page.goto('/account-settings/avatar-selection?currentAvatar=1.1', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

      // Verify Continue button is displayed
      await expect(page.locator('.continue-current-avatar-button')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.continue-current-avatar-button')).toContainText('Continue');
    });

    test('Current avatar has checkmark overlay', async ({ page }) => {
      await page.goto('/account-settings/avatar-selection?currentAvatar=1.1', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

      // Verify checkmark is displayed on selected avatar
      await expect(page.locator('.avatar-checkmark')).toBeVisible({ timeout: 10000 });
    });

    test('Current avatar item has selected class', async ({ page }) => {
      await page.goto('/account-settings/avatar-selection?currentAvatar=1.1', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

      // Verify avatar item has selected class
      await expect(page.locator('.avatar-item.selected')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Avatar Selection', () => {
    test('Clicking avatar navigates with selected avatar parameter', async ({ page }) => {
      await page.goto('/account-settings/avatar-selection?returnUrl=/account-settings/edit-profile/test', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

      // Click on an avatar that's not blocked by carousel arrows
      const avatarItem = page.locator('.avatar-item').nth(3);
      await expect(avatarItem).toBeVisible({ timeout: 10000 });
      await avatarItem.click({ force: true });

      // Should navigate with selectedAvatar parameter
      await expect(page).toHaveURL(/selectedAvatar=/, { timeout: 10000 });
    });
  });

  test.describe('Cancel Action', () => {
    test('Cancel button navigates back', async ({ page }) => {
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
  });

  test.describe('Alphabet Avatars', () => {
    test('Display all alphabet letters', async ({ page }) => {
      await page.goto('/account-settings/avatar-selection', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

      // Find alphabet section
      const alphabetSection = page.locator('.avatar-category-section:has(.avatar-category-title:has-text("Alphabet"))');
      await expect(alphabetSection).toBeVisible({ timeout: 10000 });

      // Verify alphabet avatars exist (26 letters)
      const alphabetAvatars = alphabetSection.locator('.avatar-item.alphabet-avatar');
      const count = await alphabetAvatars.count();
      expect(count).toBe(26);
    });
  });

  test.describe('Responsive Behavior', () => {
    test('Carousel wrapper is visible', async ({ page }) => {
      await page.goto('/account-settings/avatar-selection', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

      // Verify carousel wrappers are visible
      await expect(page.locator('.avatars-carousel-wrapper').first()).toBeVisible({ timeout: 10000 });
    });

    test('Avatar content section is visible', async ({ page }) => {
      await page.goto('/account-settings/avatar-selection', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });

      // Verify content section is visible
      await expect(page.locator('.avatar-selection-content')).toBeVisible({ timeout: 10000 });
    });
  });
});

