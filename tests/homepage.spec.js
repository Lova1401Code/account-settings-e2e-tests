import { test, expect } from '@playwright/test';

test('go to the home page', async ({ page }) => {
  await page.goto('/');

  if (process.env.TEST_ENV === 'local') {
    await expect(page).toHaveURL(/localhost/i);
  } else {
    await expect(page).toHaveURL(/allmovies/i);
  }
  
  await expect(page.locator('body')).toBeVisible();
});

