import { test, expect } from '@playwright/test';

test('go to the home page', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/allmovies/i);
  
  await expect(page.locator('body')).toBeVisible();
});

