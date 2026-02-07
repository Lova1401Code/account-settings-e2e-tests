import { test, expect } from '@playwright/test';

const expectNoHorizontalOverflow = async (page) => {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
};

const gotoProtectedPage = async (page, url, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const securityInfoPromise = page.waitForResponse(
      (response) => response.url().includes('/customer/security-info') && response.status() === 200,
      { timeout: 30000 }
    ).catch(() => null);

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await securityInfoPromise;
    await page.waitForTimeout(1000);

    const h1Text = await page.locator('h1').textContent().catch(() => '');
    if (!h1Text.includes('Email verification')) {
      return;
    }
    await page.waitForTimeout(2000);
  }
};

test.describe('Responsive - Account pages (mobile/tablet)', () => {

  test('Membership page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/membership');
    await expect(page).toHaveURL(/\/account-settings\/membership/, { timeout: 15000 });
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Security page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/security');
    await expect(page).toHaveURL(/\/account-settings\/security/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Devices page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/devices');
    await expect(page).toHaveURL(/\/account-settings\/devices/, { timeout: 15000 });
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Change plan page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-plan');
    await expect(page).toHaveURL(/\/account-settings\/change-plan/, { timeout: 15000 });
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Payment method page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/payment-method');
    await expect(page).toHaveURL(/\/account-settings\/payment-method/, { timeout: 15000 });
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Payment history page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/payment-history');
    await expect(page).toHaveURL(/\/account-settings\/payment-history/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Payment history', { timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Manage access page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/manage-access');
    await expect(page).toHaveURL(/\/account-settings\/manage-access/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Manage Access and Devices', { timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Change password page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/change-password');
    await expect(page).toHaveURL(/\/account-settings\/change-password/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Change password', { timeout: 15000 });
    await expect(page.locator('input#currentPassword')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('Overview page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/');
    await expect(page).toHaveURL(/\/account-settings\/?$/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Overview', { timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Select profile page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/select-profile');
    await expect(page).toHaveURL(/\/account-settings\/select-profile/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText("Who's watching", { timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Create profile page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/create-profile');
    await expect(page).toHaveURL(/\/account-settings\/create-profile/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Create Profile', { timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Avatar selection page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/avatar-selection');
    await expect(page).toHaveURL(/\/account-settings\/avatar-selection/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Choose an Avatar', { timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Profiles page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/profiles');
    await expect(page).toHaveURL(/\/account-settings\/profiles/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Profiles', { timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Profile transfer page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/profile-transfer');
    await expect(page).toHaveURL(/\/account-settings\/profile-transfer/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Start your profile transfer', { timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Transfer destination page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/transfer-destination');
    await expect(page).toHaveURL(/\/account-settings\/transfer-destination/, { timeout: 15000 });
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Viewing restrictions page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/viewing-restrictions');
    await expect(page).toHaveURL(/\/account-settings\/viewing-restrictions/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Viewing Restrictions', { timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Identity confirmation page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/identity-confirmation');
    await expect(page).toHaveURL(/\/account-settings\/identity-confirmation/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Verification code page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/verification-code');
    await expect(page).toHaveURL(/\/account-settings\/verification-code/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Enter verification code', { timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Download devices page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/download-devices');
    await expect(page).toHaveURL(/\/account-settings\/download-devices/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Download Devices', { timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Contact us page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/contact-us');
    await expect(page).toHaveURL(/\/account-settings\/contact-us/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Contact Us', { timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Help page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/help');
    await expect(page).toHaveURL(/\/account-settings\/help/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Help Center', { timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Settings page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/settings');
    await expect(page).toHaveURL(/\/account-settings\/settings/, { timeout: 15000 });
    await expect(page.locator('h2')).toContainText('Settings', { timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Preferences page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/preferences');
    await expect(page).toHaveURL(/\/account-settings\/preferences/, { timeout: 15000 });
    await expect(page.getByText('Languages').first()).toBeVisible({ timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('FAQ page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/faq');
    await expect(page).toHaveURL(/\/account-settings\/faq/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Frequently Asked Questions', { timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('Logout page fits the viewport', async ({ page }) => {
    await gotoProtectedPage(page, '/account-settings/logout');
    await expect(page).toHaveURL(/\/account-settings\/logout/, { timeout: 15000 });
    await expect(page.locator('body')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
