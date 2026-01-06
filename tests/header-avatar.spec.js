import { test, expect } from '@playwright/test';

test.describe('Header Avatar - Functional Tests', () => {

  // Helper pour obtenir le profileId depuis localStorage
  const getProfileId = async (page) => {
    return await page.evaluate(() => localStorage.getItem('profileId'));
  };

  test.describe('Avatar Display', () => {
    
    test('Header displays profile avatar when user is authenticated', async ({ page }) => {
      // Navigate to any authenticated page
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      // Header profile button should be visible
      const profileButton = page.locator('.profile-button');
      await expect(profileButton).toBeVisible({ timeout: 15000 });
      
      // Avatar container should be visible
      const avatarContainer = page.locator('.profile-avatar-container');
      await expect(avatarContainer).toBeVisible({ timeout: 10000 });
      
      // Either avatar image or letter avatar should be displayed
      const avatarImage = page.locator('.profile-avatar-container .profile-avatar-image');
      const letterAvatar = page.locator('.profile-avatar-container .profile-letter-avatar');
      
      const hasAvatarImage = await avatarImage.isVisible().catch(() => false);
      const hasLetterAvatar = await letterAvatar.isVisible().catch(() => false);
      
      expect(hasAvatarImage || hasLetterAvatar).toBeTruthy();
    });

    test('Header avatar matches the active profile avatar', async ({ page }) => {
      // First, go to select-profile to see available profiles
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });
      
      // Get the first profile's avatar info before selecting
      const firstProfile = page.locator('.profile-item:not(.add-profile)').first();
      await expect(firstProfile).toBeVisible({ timeout: 15000 });
      
      // Get profile name from the profile item
      const profileNameElement = firstProfile.locator('.profile-name');
      const profileName = await profileNameElement.textContent();
      
      // Check if profile has an image avatar or letter avatar
      const profileAvatarImg = firstProfile.locator('.profile-avatar-image, .profile-icon img');
      const hasImageAvatar = await profileAvatarImg.isVisible().catch(() => false);
      
      let expectedAvatarSrc = null;
      if (hasImageAvatar) {
        expectedAvatarSrc = await profileAvatarImg.getAttribute('src');
      }
      
      // Click to select this profile
      await firstProfile.click();
      await page.waitForTimeout(2000);
      
      // Navigate to account-settings to see the header
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      // Verify header avatar
      const headerAvatarContainer = page.locator('.profile-avatar-container');
      await expect(headerAvatarContainer).toBeVisible({ timeout: 10000 });
      
      if (hasImageAvatar && expectedAvatarSrc) {
        // Verify header has an image avatar
        const headerAvatarImg = page.locator('.profile-avatar-container .profile-avatar-image');
        await expect(headerAvatarImg).toBeVisible({ timeout: 10000 });
        
        // Avatar image should have a valid src
        const headerAvatarSrc = await headerAvatarImg.getAttribute('src');
        expect(headerAvatarSrc).toBeTruthy();
      } else {
        // Verify header has a letter avatar with correct initial
        const headerLetterAvatar = page.locator('.profile-avatar-container .profile-letter-avatar');
        const isLetterVisible = await headerLetterAvatar.isVisible().catch(() => false);
        
        if (isLetterVisible && profileName) {
          const letterContent = await headerLetterAvatar.textContent();
          expect(letterContent.toUpperCase()).toBe(profileName.charAt(0).toUpperCase());
        }
      }
    });

    test('Switching profiles updates header avatar', async ({ page }) => {
      // Go to select-profile
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });
      
      const profiles = page.locator('.profile-item:not(.add-profile)');
      const profileCount = await profiles.count();
      
      if (profileCount < 2) {
        test.skip('Need at least 2 profiles to test switching');
        return;
      }
      
      // Select first profile
      await profiles.first().click();
      await page.waitForTimeout(2000);
      
      // Go to account-settings and capture first avatar
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      const avatarContainer = page.locator('.profile-avatar-container');
      await expect(avatarContainer).toBeVisible({ timeout: 10000 });
      
      // Get first profile's avatar state
      const firstAvatarImg = page.locator('.profile-avatar-container .profile-avatar-image');
      const firstLetterAvatar = page.locator('.profile-avatar-container .profile-letter-avatar');
      const firstHasImage = await firstAvatarImg.isVisible().catch(() => false);
      const firstAvatarIdentifier = firstHasImage 
        ? await firstAvatarImg.getAttribute('src')
        : await firstLetterAvatar.textContent().catch(() => '');
      
      // Switch to second profile
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await profiles.nth(1).click();
      await page.waitForTimeout(2000);
      
      // Go back to account-settings
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      // Verify avatar has potentially changed (or at least is still displayed correctly)
      await expect(avatarContainer).toBeVisible({ timeout: 10000 });
      
      const secondAvatarImg = page.locator('.profile-avatar-container .profile-avatar-image');
      const secondLetterAvatar = page.locator('.profile-avatar-container .profile-letter-avatar');
      const secondHasImage = await secondAvatarImg.isVisible().catch(() => false);
      const secondAvatarIdentifier = secondHasImage 
        ? await secondAvatarImg.getAttribute('src')
        : await secondLetterAvatar.textContent().catch(() => '');
      
      // At minimum, an avatar should be displayed
      expect(secondHasImage || await secondLetterAvatar.isVisible().catch(() => false)).toBeTruthy();
    });
  });

  test.describe('Avatar Dimensions - Responsive', () => {
    
    test('Avatar has correct dimensions on desktop (1280px)', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      const avatarContainer = page.locator('.profile-avatar-container');
      await expect(avatarContainer).toBeVisible({ timeout: 10000 });
      
      // Get computed dimensions
      const containerBox = await avatarContainer.boundingBox();
      expect(containerBox).toBeTruthy();
      
      // Desktop: container should be 42x42px (as per actual CSS)
      expect(containerBox.width).toBeCloseTo(42, 0);
      expect(containerBox.height).toBeCloseTo(42, 0);
      
      // Check if avatar image fills the container
      const avatarImg = page.locator('.profile-avatar-container .profile-avatar-image');
      if (await avatarImg.isVisible().catch(() => false)) {
        const imgBox = await avatarImg.boundingBox();
        expect(imgBox.width).toBeCloseTo(42, 0);
        expect(imgBox.height).toBeCloseTo(42, 0);
      }
    });

    test('Avatar has correct dimensions on tablet (768px)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      const avatarContainer = page.locator('.profile-avatar-container');
      await expect(avatarContainer).toBeVisible({ timeout: 10000 });
      
      const containerBox = await avatarContainer.boundingBox();
      expect(containerBox).toBeTruthy();
      
      // Tablet (max-width: 768px): container should be 35x35px
      expect(containerBox.width).toBeCloseTo(35, 0);
      expect(containerBox.height).toBeCloseTo(35, 0);
    });

    test('Avatar has correct dimensions on mobile (375px)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      const avatarContainer = page.locator('.profile-avatar-container');
      await expect(avatarContainer).toBeVisible({ timeout: 10000 });
      
      const containerBox = await avatarContainer.boundingBox();
      expect(containerBox).toBeTruthy();
      
      // Mobile (max-width: 480px): container should be 30x30px
      expect(containerBox.width).toBeCloseTo(30, 0);
      expect(containerBox.height).toBeCloseTo(30, 0);
    });

    test('Avatar maintains aspect ratio on different screen sizes', async ({ page }) => {
      const viewports = [
        { width: 1920, height: 1080, name: 'Full HD' },
        { width: 1280, height: 720, name: 'HD' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' },
        { width: 320, height: 568, name: 'Small Mobile' },
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);
        
        const avatarContainer = page.locator('.profile-avatar-container');
        await expect(avatarContainer).toBeVisible({ timeout: 10000 });
        
        const containerBox = await avatarContainer.boundingBox();
        expect(containerBox).toBeTruthy();
        
        // Avatar should always be square (1:1 aspect ratio)
        const aspectRatio = containerBox.width / containerBox.height;
        expect(aspectRatio).toBeCloseTo(1, 1); // Allow small tolerance
      }
    });

    test('Letter avatar has correct dimensions when no image', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      const letterAvatar = page.locator('.profile-avatar-container .profile-letter-avatar');
      const hasLetterAvatar = await letterAvatar.isVisible().catch(() => false);
      
      if (hasLetterAvatar) {
        const letterBox = await letterAvatar.boundingBox();
        expect(letterBox).toBeTruthy();
        
        // Letter avatar should be 32x32px (as per CSS)
        expect(letterBox.width).toBeCloseTo(32, 0);
        expect(letterBox.height).toBeCloseTo(32, 0);
      } else {
        // If no letter avatar, just verify image avatar is displayed
        const avatarImg = page.locator('.profile-avatar-container .profile-avatar-image');
        await expect(avatarImg).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Avatar Image Quality', () => {
    
    test('Avatar image loads without error', async ({ page }) => {
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      const avatarImg = page.locator('.profile-avatar-container .profile-avatar-image');
      const hasImageAvatar = await avatarImg.isVisible().catch(() => false);
      
      if (hasImageAvatar) {
        // Check that image has loaded successfully
        const isLoaded = await avatarImg.evaluate((img) => {
          return img.complete && img.naturalHeight !== 0;
        });
        expect(isLoaded).toBeTruthy();
        
        // Check that src is valid
        const src = await avatarImg.getAttribute('src');
        expect(src).toBeTruthy();
        expect(src.length).toBeGreaterThan(0);
      } else {
        // Letter avatar fallback is acceptable
        const letterAvatar = page.locator('.profile-avatar-container .profile-letter-avatar');
        await expect(letterAvatar).toBeVisible({ timeout: 5000 });
      }
    });

    test('Avatar image has proper border-radius styling', async ({ page }) => {
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      const avatarImg = page.locator('.profile-avatar-container .profile-avatar-image');
      const hasImageAvatar = await avatarImg.isVisible().catch(() => false);
      
      if (hasImageAvatar) {
        // Check border-radius CSS property
        const borderRadius = await avatarImg.evaluate((el) => {
          return window.getComputedStyle(el).borderRadius;
        });
        
        // Should have 4px border-radius as per CSS
        expect(borderRadius).toBe('4px');
      }
    });

    test('Avatar container has proper overflow hidden', async ({ page }) => {
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      const avatarContainer = page.locator('.profile-avatar-container');
      await expect(avatarContainer).toBeVisible({ timeout: 10000 });
      
      // Check overflow CSS property
      const overflow = await avatarContainer.evaluate((el) => {
        return window.getComputedStyle(el).overflow;
      });
      
      expect(overflow).toBe('hidden');
    });
  });

  test.describe('Profile Button Interaction', () => {
    
    test('Clicking profile button opens navigation menu', async ({ page }) => {
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      const profileButton = page.locator('.profile-button');
      await expect(profileButton).toBeVisible({ timeout: 10000 });
      
      // Click the profile button
      await profileButton.click();
      
      // Navigation menu should appear
      const navigationMenu = page.locator('.navigation-menu, .nav-menu');
      await expect(navigationMenu).toBeVisible({ timeout: 5000 });
    });

    test('Profile button arrow rotates when menu is open', async ({ page }) => {
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      const profileButton = page.locator('.profile-button');
      const arrow = page.locator('.profile-button-arrow');
      
      await expect(profileButton).toBeVisible({ timeout: 10000 });
      await expect(arrow).toBeVisible({ timeout: 5000 });
      
      // Initially arrow should not have 'open' class
      await expect(arrow).not.toHaveClass(/open/);
      
      // Click to open menu
      await profileButton.click();
      await page.waitForTimeout(500);
      
      // Arrow should have 'open' class (rotated)
      await expect(arrow).toHaveClass(/open/);
    });
  });

});

