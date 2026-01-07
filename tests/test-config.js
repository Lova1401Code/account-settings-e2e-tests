export const testUser = {
  email: process.env.TEST_USER_EMAIL || 'lova.ramiharisoa@gmail.com',
  password: process.env.TEST_USER_PASSWORD || 'test1234',
};

export const loginWithRealCredentials = async (page) => {
  await page.goto('/account-settings/login', { waitUntil: 'domcontentloaded' });
  
  // Attendre que le formulaire soit chargé
  const { expect } = await import('@playwright/test');
  await expect(page.locator('#identifier')).toBeVisible({ timeout: 30000 });
  
  // Remplir le formulaire de connexion
  await page.fill('#identifier', testUser.email);
  await page.fill('#password', testUser.password);
  
  // Cliquer sur le bouton Sign In
  await page.click('button[type="submit"]');
  
  // Attendre la fin de la connexion - accepter aussi la page d'accueil "/"
  await page.waitForLoadState('load', { timeout: 90000 });
  await page.waitForTimeout(2000);
};

/**
 * Se connecter et sélectionner un profil si nécessaire
 * @param {import('@playwright/test').Page} page - La page Playwright
 */
export const loginAndSelectProfile = async (page) => {
  await loginWithRealCredentials(page);
  
  const currentUrl = page.url();
  
  // Si on est sur select-profile, sélectionner le premier profil (pas le bouton Add)
  if (currentUrl.includes('select-profile')) {
    const { expect } = await import('@playwright/test');
    await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });
    // Attendre que les profils soient chargés
    await expect(page.locator('.profile-item:not(.add-profile)').first()).toBeVisible({ timeout: 15000 });
    // Cliquer sur le premier profil disponible (pas le bouton Add Profile)
    await page.locator('.profile-item:not(.add-profile)').first().click();
    // Attendre que la navigation soit terminée
    await page.waitForTimeout(3000);
  }
  
  // Attendre que la page soit chargée (utiliser 'load' au lieu de 'networkidle' pour éviter les timeouts)
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);
};

