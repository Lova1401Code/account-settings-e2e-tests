import { test, expect } from '@playwright/test';

test.describe('Device Management - Real Tests', () => {
  // Ce fichier utilise le storageState global pour l'authentification

  // ============================================
  // DEVICES PAGE TESTS
  // ============================================
  test.describe('Devices Page', () => {

    test('Display Devices page with title', async ({ page }) => {
      await page.goto('/account-settings/devices', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Devices', { timeout: 15000 });
    });

    test('Display Account Access section', async ({ page }) => {
      await page.goto('/account-settings/devices', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Devices', { timeout: 15000 });
      await expect(page.locator('h2:has-text("Account Access")')).toBeVisible({ timeout: 15000 });
    });

    test('Display Access and devices link', async ({ page }) => {
      await page.goto('/account-settings/devices', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Devices', { timeout: 15000 });
      await expect(page.locator('text=Access and devices')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('text=Manage signed-in devices')).toBeVisible();
    });

    test('Display Mobile Downloads section', async ({ page }) => {
      await page.goto('/account-settings/devices', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Devices', { timeout: 15000 });
      await expect(page.locator('h2:has-text("Mobile Downloads")')).toBeVisible({ timeout: 15000 });
    });

    test('Click Access and devices navigates to manage-access', async ({ page }) => {
      await page.goto('/account-settings/devices', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Devices', { timeout: 15000 });
      await page.click('text=Access and devices');

      await expect(page).toHaveURL(/\/account-settings\/manage-access\/?/, { timeout: 15000 });
    });

  });

  // ============================================
  // MANAGE ACCESS PAGE TESTS
  // ============================================
  test.describe('Manage Access Page', () => {

    test('Display Manage Access and Devices page', async ({ page }) => {
      await page.goto('/account-settings/manage-access', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });
    });

    test('Display intro text', async ({ page }) => {
      await page.goto('/account-settings/manage-access', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });
      await expect(page.locator('.manage-access-intro')).toContainText('signed-in devices', { timeout: 15000 });
    });

    test('Display Back button', async ({ page }) => {
      await page.goto('/account-settings/manage-access', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });
      await expect(page.locator('.back-button')).toBeVisible();
    });

    test('Display device cards', async ({ page }) => {
      await page.goto('/account-settings/manage-access', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });
      
      // Au moins un device doit être affiché (le device courant)
      await expect(page.locator('.device-card').first()).toBeVisible({ timeout: 15000 });
    });

    test('Display current device label', async ({ page }) => {
      await page.goto('/account-settings/manage-access', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });
      
      // Le device courant doit avoir le label "CURRENT DEVICE"
      await expect(page.locator('.device-label:has-text("CURRENT DEVICE")')).toBeVisible({ timeout: 15000 });
    });

    test('Current device does not have Sign Out button', async ({ page }) => {
      await page.goto('/account-settings/manage-access', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });
      
      // Trouver le device courant
      const currentDeviceCard = page.locator('.device-card:has(.device-label:has-text("CURRENT DEVICE"))');
      await expect(currentDeviceCard).toBeVisible({ timeout: 15000 });
      
      // Le device courant ne doit pas avoir de bouton Sign Out
      await expect(currentDeviceCard.locator('button.secondary')).toHaveCount(0);
    });

    test('Display device name', async ({ page }) => {
      await page.goto('/account-settings/manage-access', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });
      
      // Au moins un nom de device doit être affiché
      const deviceName = page.locator('.device-name').first();
      await expect(deviceName).toBeVisible({ timeout: 15000 });
      
      const name = await deviceName.textContent();
      expect(name.length).toBeGreaterThan(0);
    });

    test('Display device profile info', async ({ page }) => {
      await page.goto('/account-settings/manage-access', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });
      
      // L'info du profil doit être affichée
      await expect(page.locator('.device-info').first()).toBeVisible({ timeout: 15000 });
    });

    test('Display pagination', async ({ page }) => {
      await page.goto('/account-settings/manage-access', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });
      
      // La pagination doit être visible
      await expect(page.locator('.pagination')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('.pagination')).toContainText('Page');
    });

    test('Display Sign Out of All Devices button', async ({ page }) => {
      await page.goto('/account-settings/manage-access', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });
      
      // Le bouton Sign Out of All Devices doit être visible
      await expect(page.locator('.sign-out-all button')).toContainText('Sign Out of All Devices', { timeout: 15000 });
    });

    test('Back button navigates back', async ({ page }) => {
      // D'abord aller sur devices puis manage-access
      await page.goto('/account-settings/devices', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Devices', { timeout: 15000 });

      await page.click('text=Access and devices');
      await expect(page).toHaveURL(/\/account-settings\/manage-access\/?/, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

      // Cliquer sur Back
      await page.click('.back-button');

      // Devrait revenir à la page devices
      await expect(page).toHaveURL(/\/account-settings\/devices\/?/, { timeout: 15000 });
    });

  });

  // ============================================
  // NAVIGATION FLOW TESTS
  // ============================================
  test.describe('Navigation Flow', () => {

    test('Full flow: Account → Devices → Manage Access → Back', async ({ page }) => {
      // Aller sur account-settings
      await page.goto('/account-settings', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      // Chercher et cliquer sur Devices
      await page.click('text=Devices');
      await expect(page).toHaveURL(/\/account-settings\/devices\/?/, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText('Devices', { timeout: 15000 });

      // Cliquer sur Access and devices
      await page.click('text=Access and devices');
      await expect(page).toHaveURL(/\/account-settings\/manage-access\/?/, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });

      // Retourner
      await page.click('.back-button');
      await expect(page).toHaveURL(/\/account-settings\/devices\/?/, { timeout: 15000 });
    });

  });

  // ============================================
  // OTHER DEVICES TESTS
  // ============================================
  test.describe('Other Devices', () => {

    test('Other devices have Sign Out button', async ({ page }) => {
      await page.goto('/account-settings/manage-access', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });
      
      // Compter le nombre de devices
      const deviceCount = await page.locator('.device-card').count();
      
      if (deviceCount > 1) {
        // Les devices non-courants doivent avoir un bouton Sign Out
        const nonCurrentDevices = page.locator('.device-card:not(:has(.device-label:has-text("CURRENT DEVICE")))');
        const nonCurrentCount = await nonCurrentDevices.count();
        
        if (nonCurrentCount > 0) {
          await expect(nonCurrentDevices.first().locator('button.secondary')).toContainText('Sign Out');
        }
      }
    });

    test('Other devices display last login', async ({ page }) => {
      await page.goto('/account-settings/manage-access', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });
      
      const deviceCount = await page.locator('.device-card').count();
      
      if (deviceCount > 1) {
        // Les devices non-courants doivent afficher la date de dernière connexion
        const nonCurrentDevices = page.locator('.device-card:not(:has(.device-label:has-text("CURRENT DEVICE")))');
        const nonCurrentCount = await nonCurrentDevices.count();
        
        if (nonCurrentCount > 0) {
          await expect(nonCurrentDevices.first().locator('.device-timestamp')).toContainText('Last login');
        }
      }
    });

  });

  // ============================================
  // PAGINATION TESTS
  // ============================================
  test.describe('Pagination', () => {

    test('Previous button is disabled on first page', async ({ page }) => {
      await page.goto('/account-settings/manage-access', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });
      
      // Le bouton Previous doit être désactivé sur la première page
      await expect(page.locator('.pagination button:has-text("Previous")')).toBeDisabled();
    });

    test('Pagination displays current page', async ({ page }) => {
      await page.goto('/account-settings/manage-access', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });
      
      // La pagination doit afficher "Page X / Y"
      await expect(page.locator('.pagination')).toContainText(/Page \d+ \/ \d+/);
    });

  });

});
