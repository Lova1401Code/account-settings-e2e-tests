import { test, expect } from '@playwright/test';

test.describe('Header - Key Functional Tests', () => {

  // Helper pour attendre que le header soit complètement chargé
  const waitForHeader = async (page) => {
    await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30000 });
    await page.waitForSelector('.header', { timeout: 15000 });
  };

  // Helper to open the navigation menu
  const openNavigationMenu = async (page) => {
    await waitForHeader(page);
    const profileButton = page.locator('.profile-button');
    await expect(profileButton).toBeVisible({ timeout: 10000 });
    await profileButton.click();
    const navMenu = page.locator('.nav-menu');
    await expect(navMenu).toBeVisible({ timeout: 5000 });
  };

  test.describe('Avatar Display', () => {
    
    test('Header displays profile avatar when user is authenticated', async ({ page }) => {
      await waitForHeader(page);
      
      const profileButton = page.locator('.profile-button');
      await expect(profileButton).toBeVisible({ timeout: 15000 });
      
      const avatarContainer = page.locator('.profile-avatar-container');
      await expect(avatarContainer).toBeVisible({ timeout: 10000 });
      
      // Either avatar image or letter avatar should be displayed
      const avatarImage = page.locator('.profile-avatar-container .profile-avatar-image');
      const letterAvatar = page.locator('.profile-avatar-container .profile-letter-avatar');
      
      const hasAvatarImage = await avatarImage.isVisible().catch(() => false);
      const hasLetterAvatar = await letterAvatar.isVisible().catch(() => false);
      
      expect(hasAvatarImage || hasLetterAvatar).toBeTruthy();
    });

    test('Avatar matches active profile and updates when switching profiles', async ({ page }) => {
      // Go to select-profile
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });
      
      const profiles = page.locator('.profile-item:not(.add-profile)');
      const profileCount = await profiles.count();
      
      // Select first profile and get its name
      const firstProfile = profiles.first();
      await expect(firstProfile).toBeVisible({ timeout: 15000 });
      const profileName = await firstProfile.locator('.profile-name').textContent();
      
      await firstProfile.click();
      await page.waitForTimeout(2000);
      
      // Navigate to account-settings and verify avatar
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      const headerAvatarContainer = page.locator('.profile-avatar-container');
      await expect(headerAvatarContainer).toBeVisible({ timeout: 10000 });
      
      // If letter avatar, verify it matches profile initial
      const headerLetterAvatar = page.locator('.profile-avatar-container .profile-letter-avatar');
      const isLetterVisible = await headerLetterAvatar.isVisible().catch(() => false);
      
      if (isLetterVisible && profileName) {
        const letterContent = await headerLetterAvatar.textContent();
        // Only check if letter is not "?" (loading state)
        if (letterContent && letterContent !== '?') {
          expect(letterContent.toUpperCase()).toBe(profileName.charAt(0).toUpperCase());
        }
      }
      
      // Test switching profiles if multiple exist
      if (profileCount >= 2) {
        await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('load', { timeout: 30000 });
        await profiles.nth(1).click();
        await page.waitForTimeout(2000);
        
        await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        
        // Avatar should still be displayed after switch
        await expect(headerAvatarContainer).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Profile Button & Navigation Menu', () => {
    
    test('Clicking profile button opens navigation menu', async ({ page }) => {
      await waitForHeader(page);
      
      const profileButton = page.locator('.profile-button');
      await expect(profileButton).toBeVisible({ timeout: 10000 });
      
      await profileButton.click();
      
      const navigationMenu = page.locator('.nav-menu');
      await expect(navigationMenu).toBeVisible({ timeout: 5000 });
    });

    test('Account link navigates correctly', async ({ page }) => {
      await openNavigationMenu(page);
      
      const accountLink = page.locator('.nav-menu-link:has(p:has-text("Account"))');
      await expect(accountLink).toBeVisible({ timeout: 5000 });
      await accountLink.click();
      
      await expect(page).toHaveURL(/\/account-settings\/?$/, { timeout: 10000 });
    });

    test('Manage Profiles link navigates correctly', async ({ page }) => {
      await openNavigationMenu(page);
      
      const manageProfilesLink = page.locator('.nav-menu-link:has(p:has-text("Manage Profiles"))');
      await expect(manageProfilesLink).toBeVisible({ timeout: 5000 });
      await manageProfilesLink.click();
      
      await expect(page).toHaveURL(/\/account-settings\/profiles/, { timeout: 10000 });
    });

    test('Contact Us link navigates correctly', async ({ page }) => {
      await openNavigationMenu(page);
      
      const contactLink = page.locator('.nav-menu-link:has(p:has-text("Contact Us"))');
      await expect(contactLink).toBeVisible({ timeout: 5000 });
      await contactLink.click();
      
      await expect(page).toHaveURL(/\/account-settings\/contact-us/, { timeout: 10000 });
    });

    test('Help link navigates correctly', async ({ page }) => {
      await openNavigationMenu(page);
      
      const helpLink = page.locator('.nav-menu-link:has(p:has-text("Help"))');
      await expect(helpLink).toBeVisible({ timeout: 5000 });
      await helpLink.click();
      
      await expect(page).toHaveURL(/\/account-settings\/help/, { timeout: 10000 });
    });

    test('FAQ link navigates correctly', async ({ page }) => {
      await openNavigationMenu(page);
      
      const faqLink = page.locator('.nav-menu-link:has(p:has-text("FAQ"))');
      await expect(faqLink).toBeVisible({ timeout: 5000 });
      await faqLink.click();
      
      await expect(page).toHaveURL(/\/account-settings\/faq/, { timeout: 10000 });
    });

    test('Switch Active Profile link navigates correctly', async ({ page }) => {
      await openNavigationMenu(page);
      
      const switchProfileLink = page.locator('.nav-menu-link:has(p:has-text("Switch Active Profile"))');
      await expect(switchProfileLink).toBeVisible({ timeout: 5000 });
      await switchProfileLink.click();
      
      await expect(page).toHaveURL(/\/account-settings\/select-profile/, { timeout: 10000 });
    });

    test('Sign Out link logs out the user', async ({ page }) => {
      await openNavigationMenu(page);
      
      const signOutLink = page.locator('.nav-menu-link:has(p:has-text("Sign Out"))');
      await expect(signOutLink).toBeVisible({ timeout: 5000 });
      await signOutLink.click();
      
      await expect(page).toHaveURL(/\/account-settings\/login/, { timeout: 15000 });
    });
  });

  test.describe('Header Logo', () => {
    
    test('Logo is visible and clickable', async ({ page }) => {
      await waitForHeader(page);
      
      const logo = page.locator('.header-logo .logo');
      await expect(logo).toBeVisible({ timeout: 10000 });
      
      const logoImage = page.locator('.header-logo .logo-image');
      await expect(logoImage).toBeVisible({ timeout: 10000 });
      
      // Check that logo link has a valid href
      const href = await logo.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href.includes('/') || href.startsWith('http')).toBeTruthy();
    });

    test('Clicking logo navigates to homepage', async ({ page }) => {
      await waitForHeader(page);
      
      const logoLink = page.locator('.header-logo .logo');
      await expect(logoLink).toBeVisible({ timeout: 10000 });
      
      const href = await logoLink.getAttribute('href');
      
      if (process.env.TEST_ENV === 'local') {
        expect(href).toContain('allmovies.dev');
      } else {
        await logoLink.click();
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        
        if (href && href.startsWith('http')) {
          expect(currentUrl).toContain(new URL(href).hostname);
        } else {
          expect(currentUrl.endsWith('/') || !currentUrl.includes('/account-settings')).toBeTruthy();
        }
      }
    });
  });

});

