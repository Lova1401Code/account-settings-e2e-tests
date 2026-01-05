import { test, expect } from '@playwright/test';

test.describe('Profile Check & Redirect - E2E Tests', () => {
  // ============================================
  // TESTS E2E RÉELS (authentifié via storageState)
  // ============================================

  test.describe('Create Profile Alert - Default Profile Only', () => {
    test('Display create profile alert when customer has only default profile', async ({ page }) => {
      // Aller sur account-settings (déjà authentifié via storageState)
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });

      // Attendre que la page soit chargée
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

      // Vérifier que l'alerte est affichée
      await expect(page.getByText('You only have a default profile')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Create a personalized profile')).toBeVisible();
    });

    test('Display Create profile button in alert', async ({ page }) => {
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

      // Vérifier que le bouton Create profile est visible
      await expect(page.locator('button:has-text("Create profile")')).toBeVisible({ timeout: 10000 });
    });

    test('Create profile button navigates to create profile page', async ({ page }) => {
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

      // Cliquer sur Create profile
      await page.locator('button:has-text("Create profile")').click();

      // Devrait naviguer vers create-profile
      await expect(page).toHaveURL(/\/create-profile/, { timeout: 10000 });
    });

    test('Close button dismisses the alert', async ({ page }) => {
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

      // Vérifier que l'alerte est visible
      await expect(page.getByText('You only have a default profile')).toBeVisible({ timeout: 10000 });

      // Cliquer sur le bouton fermer (×)
      await page.locator('button:has-text("×")').click();

      // L'alerte devrait disparaître
      await expect(page.getByText('You only have a default profile')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Redirect to Profile Selection - No Active Profile', () => {
    test('Account settings page loads successfully', async ({ page }) => {
      // Aller sur account-settings (déjà authentifié via storageState)
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      // Vérifier que la page s'affiche correctement
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    });

    test('Profile selection page displays profiles', async ({ page }) => {
      // Aller sur select-profile (déjà authentifié via storageState)
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });

      // Vérifier que le titre est affiché
      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });
      
      // Vérifier qu'au moins un profil est affiché (pas Add Profile)
      await expect(page.locator('.profile-item:not(.add-profile)').first()).toBeVisible({ timeout: 10000 });
    });

    test('Selecting a profile navigates away from selection page', async ({ page }) => {
      // Aller sur select-profile
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });

      // Attendre que les profils soient chargés
      await expect(page.locator('.profile-item:not(.add-profile)').first()).toBeVisible({ timeout: 15000 });

      // Cliquer sur le premier profil (pas Add Profile)
      await page.locator('.profile-item:not(.add-profile)').first().click();

      // Devrait naviguer ailleurs (vers la page d'accueil)
      await page.waitForTimeout(3000);
      await expect(page).not.toHaveURL(/\/select-profile$/, { timeout: 10000 });
    });
  });

  test.describe('Profile Selection Page Features', () => {
    test('Display Who is watching title', async ({ page }) => {
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });

      // Vérifier le titre
      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });
    });

    test('Display Add Profile button if less than max profiles', async ({ page }) => {
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

      // Vérifier que le bouton Add Profile est affiché (utilise .profile-item.add-profile)
      await expect(page.locator('.profile-item.add-profile, .profile-item:has-text("Add Profile")')).toBeVisible({ timeout: 10000 });
    });

    test('Display Manage Profiles button', async ({ page }) => {
      await page.goto('/account-settings/select-profile', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });

      // Vérifier que le bouton Manage Profiles est affiché
      await expect(page.locator('button:has-text("Manage Profiles"), button:has-text("MANAGE PROFILES")')).toBeVisible({ timeout: 10000 });
    });
  });
});

