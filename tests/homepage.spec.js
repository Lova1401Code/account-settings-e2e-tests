import { test, expect } from '@playwright/test';

test('go to the home page', async ({ page }) => {
  // Aller à la page d'accueil
  await page.goto('/');

  // Vérifier que la page se charge (titre ou logo selon le site)
  // Sur le site de production, on vérifie simplement que la page se charge
  await expect(page).toHaveURL(/allmovies/i);
  
  // Vérifier qu'un élément principal est visible (header, nav, ou body)
  await expect(page.locator('body')).toBeVisible();
});

