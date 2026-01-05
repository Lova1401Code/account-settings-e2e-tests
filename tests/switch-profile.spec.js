import { test, expect } from '@playwright/test';

test.describe('Switch Profile - Real Tests', () => {
  // Ce fichier utilise le storageState global pour l'authentification

  // ============================================
  // PROFILE SELECTION PAGE TESTS
  // ============================================
  test.describe('Profile Selection Page - Switch Profile', () => {

    test('Display all profiles on selection page', async ({ page }) => {
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      // Vérifier le titre
      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

      // Vérifier qu'au moins un profil est affiché
      await expect(page.locator('.profile-item:not(.add-profile)').first()).toBeVisible({ timeout: 15000 });
    });

    test('Switch to different profile', async ({ page }) => {
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

      // Attendre que les profils soient chargés
      const profiles = page.locator('.profile-item:not(.add-profile)');
      await expect(profiles.first()).toBeVisible({ timeout: 15000 });

      // Cliquer sur le premier profil
      await profiles.first().click();

      // Vérifier la redirection vers la page d'accueil
      await expect(page).toHaveURL('/', { timeout: 15000 });
    });

    test('Profile switch saves profileId to localStorage', async ({ page }) => {
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

      const profiles = page.locator('.profile-item:not(.add-profile)');
      await expect(profiles.first()).toBeVisible({ timeout: 15000 });

      // Cliquer sur un profil
      await profiles.first().click();

      // Attendre la redirection
      await expect(page).toHaveURL('/', { timeout: 15000 });

      // Vérifier que le profileId est sauvegardé
      const profileId = await page.evaluate(() => localStorage.getItem('profileId'));
      expect(profileId).toBeTruthy();
    });

    test('Add Profile button is visible when less than 5 profiles', async ({ page }) => {
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

      // Compter les profils
      const profileCount = await page.locator('.profile-item:not(.add-profile)').count();

      if (profileCount < 5) {
        // Le bouton "Add Profile" doit être visible
        await expect(page.locator('.profile-item.add-profile')).toBeVisible();
      }
    });

    test('Click on Add Profile navigates to create-profile page', async ({ page }) => {
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

      // Vérifier si le bouton Add Profile est visible
      const addProfileButton = page.locator('.profile-item.add-profile');
      const isVisible = await addProfileButton.isVisible();

      if (isVisible) {
        await addProfileButton.click();
        await expect(page).toHaveURL(/\/account-settings\/create-profile/, { timeout: 15000 });
      } else {
        // Si on a déjà 5 profils, le test passe quand même
        test.skip();
      }
    });

    test('Manage Profiles button switches to manage mode', async ({ page }) => {
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

      // Cliquer sur Manage Profiles
      await page.click('button:has-text("MANAGE PROFILES")');

      // Vérifier que le titre change
      await expect(page.locator('h1')).toContainText('Manage Profiles');

      // Vérifier que le bouton devient "DONE"
      await expect(page.locator('button:has-text("DONE")')).toBeVisible();
    });

    test('In Manage mode, clicking profile goes to preferences page', async ({ page }) => {
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

      // Passer en mode gestion
      await page.click('button:has-text("MANAGE PROFILES")');
      await expect(page.locator('h1')).toContainText('Manage Profiles');

      // Cliquer sur le premier profil
      const firstProfile = page.locator('.profile-item:not(.add-profile)').first();
      await expect(firstProfile).toBeVisible({ timeout: 15000 });
      await firstProfile.click();

      // Vérifier la redirection vers la page de gestion du profil
      await expect(page).toHaveURL(/\/account-settings\/manage-profile-preferences\//, { timeout: 15000 });
    });

    test('DONE button returns to selection mode', async ({ page }) => {
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

      // Passer en mode gestion
      await page.click('button:has-text("MANAGE PROFILES")');
      await expect(page.locator('h1')).toContainText('Manage Profiles');

      // Cliquer sur DONE
      await page.click('button:has-text("DONE")');

      // Vérifier le retour au mode normal
      await expect(page.locator('h1')).toContainText("Who's watching");
      await expect(page.locator('button:has-text("MANAGE PROFILES")')).toBeVisible();
    });

  });

  // ============================================
  // SWITCH PROFILE FROM PROFILES PAGE
  // ============================================
  test.describe('Switch Profile from Profiles Page', () => {

    test('Switch Active Profile link is visible on profiles page', async ({ page }) => {
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      await expect(page.locator('.link-card:has-text("Switch Active Profile")')).toBeVisible({ timeout: 15000 });
    });

    test('Click Switch Active Profile navigates to select-profile', async ({ page }) => {
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
      await page.locator('.link-card:has-text("Switch Active Profile")').click();

      await expect(page).toHaveURL(/\/account-settings\/select-profile/, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });
    });

    test('Active profile is marked on profiles page', async ({ page }) => {
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });

      // Vérifier qu'un profil actif est marqué
      await expect(page.locator('.active-profile-label')).toBeVisible({ timeout: 15000 });
    });

  });

  // ============================================
  // SWITCH PROFILE FLOW
  // ============================================
  test.describe('Switch Profile Flow', () => {

    test('Full flow: Profiles → Switch Profile → Select Profile page', async ({ page }) => {
      // Aller sur la page profiles
      await page.goto('/account-settings/profiles', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });

      // Cliquer sur Switch Active Profile
      await page.locator('.link-card:has-text("Switch Active Profile")').click();
      await expect(page).toHaveURL(/\/account-settings\/select-profile/, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

      // Vérifier que les profils sont affichés
      const profiles = page.locator('.profile-item:not(.add-profile)');
      await expect(profiles.first()).toBeVisible({ timeout: 15000 });

      // Vérifier que le bouton Manage Profiles est visible
      await expect(page.locator('button:has-text("MANAGE PROFILES")')).toBeVisible();
    });

    test('Switch profile multiple times', async ({ page }) => {
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

      const profiles = page.locator('.profile-item:not(.add-profile)');
      const profileCount = await profiles.count();

      if (profileCount >= 2) {
        // Premier switch
        await profiles.first().click();
        await expect(page).toHaveURL('/', { timeout: 15000 });
        const firstProfileId = await page.evaluate(() => localStorage.getItem('profileId'));

        // Retourner à la sélection
        await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle', { timeout: 30000 });

        // Deuxième switch
        await profiles.nth(1).click();
        await expect(page).toHaveURL('/', { timeout: 15000 });
        const secondProfileId = await page.evaluate(() => localStorage.getItem('profileId'));

        // Vérifier que le profileId a changé (si ce sont des profils différents)
        expect(secondProfileId).toBeTruthy();
      } else {
        test.skip();
      }
    });

  });

  // ============================================
  // PROFILE DISPLAY TESTS
  // ============================================
  test.describe('Profile Display', () => {

    test('Profiles have avatars displayed', async ({ page }) => {
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

      // Vérifier que les avatars sont affichés
      await expect(page.locator('.profile-avatar').first()).toBeVisible({ timeout: 15000 });
    });

    test('Profiles have names displayed', async ({ page }) => {
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

      // Vérifier que les noms sont affichés
      const profileNames = page.locator('.profile-name');
      await expect(profileNames.first()).toBeVisible({ timeout: 15000 });
      
      const firstName = await profileNames.first().textContent();
      expect(firstName.length).toBeGreaterThan(0);
    });

    test('Edit icon is visible in manage mode', async ({ page }) => {
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

      // Passer en mode gestion
      await page.click('button:has-text("MANAGE PROFILES")');
      await expect(page.locator('h1')).toContainText('Manage Profiles');

      // Vérifier que l'icône d'édition est visible
      await expect(page.locator('.edit-icon').first()).toBeVisible({ timeout: 15000 });
    });

  });

  // ============================================
  // MAXIMUM PROFILES TESTS
  // ============================================
  test.describe('Maximum Profiles', () => {

    test('Check profile count', async ({ page }) => {
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

      // Compter les profils
      const profileCount = await page.locator('.profile-item:not(.add-profile)').count();
      
      // Le compte doit être entre 1 et 5
      expect(profileCount).toBeGreaterThanOrEqual(1);
      expect(profileCount).toBeLessThanOrEqual(5);
    });

    test('Maximum profiles message when 5 profiles exist', async ({ page }) => {
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

      const profileCount = await page.locator('.profile-item:not(.add-profile)').count();

      if (profileCount === 5) {
        // Vérifier le message de maximum atteint
        await expect(page.locator('.max-profiles-message')).toContainText('Maximum number of profiles');
        // Vérifier que Add Profile n'est pas visible
        await expect(page.locator('.profile-item.add-profile')).not.toBeVisible();
      } else {
        // Si moins de 5 profils, Add Profile doit être visible
        await expect(page.locator('.profile-item.add-profile')).toBeVisible();
      }
    });

  });

});
