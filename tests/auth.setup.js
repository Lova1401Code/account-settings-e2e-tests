import { test as setup, expect } from '@playwright/test';
import { testUser } from './test-config.js';

const authFile = '.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Aller à la page de login
  await page.goto('/account-settings/login', { waitUntil: 'domcontentloaded' });
  
  // Attendre que le formulaire soit chargé
  await expect(page.locator('#identifier')).toBeVisible({ timeout: 30000 });
  
  // Remplir le formulaire de connexion
  await page.fill('#identifier', testUser.email);
  await page.fill('#password', testUser.password);
  
  // Cliquer sur le bouton Sign In
  await page.click('button[type="submit"]');
  
  // Attendre la fin de la connexion
  await page.waitForLoadState('load', { timeout: 90000 });
  await page.waitForTimeout(2000);
  
  // Si on est sur select-profile, sélectionner le premier profil
  const currentUrl = page.url();
  if (currentUrl.includes('select-profile')) {
    await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });
    await expect(page.locator('.profile-item:not(.add-profile)').first()).toBeVisible({ timeout: 15000 });
    await page.locator('.profile-item:not(.add-profile)').first().click();
    await page.waitForTimeout(3000);
  }
  
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);
  
  // Sauvegarder l'état d'authentification
  await page.context().storageState({ path: authFile });
});

