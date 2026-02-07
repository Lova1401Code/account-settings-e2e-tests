import { test, expect } from '@playwright/test';

const expectNoHorizontalOverflow = async (page) => {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
};

test.describe('Responsive basics (mobile/tablet)', () => {
  test('Signup page fits the viewport', async ({ page }) => {
    await page.goto('/account-settings/signup');

    await expect(page.locator('h1')).toContainText('Unlimited movies', { timeout: 15000 });
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });

  test('Login page fits the viewport', async ({ page }) => {
    await page.goto('/account-settings/login');

    await expect(page.locator('#identifier')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });

  test('Forgot password page fits the viewport', async ({ page }) => {
    await page.goto('/account-settings/forgot-password');

    await expect(page.locator('h1')).toContainText('Forgot Password', { timeout: 10000 });
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });

  test('Reset password page fits the viewport', async ({ page }) => {
    await page.goto('/account-settings/reset-password?token=mock-reset-token');

    await expect(page.locator('h1')).toContainText('Reset Your Password', { timeout: 10000 });
    await expect(page.locator('input#new-password')).toBeVisible();
    await expect(page.locator('input#confirm-password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });

  test('Home page fits the viewport', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('Verify email page fits the viewport', async ({ page }) => {
    await page.goto('/account-settings/verify-email?token=mock-token');
    await expect(page).toHaveURL(/\/account-settings\/verify-email/);
    await expect(page.locator('body')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
