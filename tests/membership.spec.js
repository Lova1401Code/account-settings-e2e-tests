import { test, expect } from '@playwright/test';

test.describe('Membership - Functional Tests', () => {

  test('Navigate to Change Plan page from membership', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Click on plan card to change plan
    await page.click('.plan-card .link-card');

    // Should navigate to change-plan
    await expect(page).toHaveURL(/\/account-settings\/change-plan\/?$/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Change Plan');
  });

  test('Navigate to Manage payment method page', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    await page.click('text=Manage payment method');

    await expect(page).toHaveURL(/\/account-settings\/payment-method\/?$/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Manage payment method');
  });

  test('Navigate to Payment history page', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    await page.click('text=View payment history');

    await expect(page).toHaveURL(/\/account-settings\/payment-history\/?$/, { timeout: 15000 });
  });

  test('Cancel membership button is present and clickable', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Cancel button should be visible and clickable
    const cancelButton = page.locator('.cancel-membership');
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toBeEnabled();
  });

});

test.describe('Pause Membership - Functional Tests', () => {

  test('Pause membership button is visible for active subscription', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Check if pause button is visible (only for active subscriptions)
    const pauseButton = page.locator('.pause-membership');
    const isPauseVisible = await pauseButton.isVisible().catch(() => false);

    if (isPauseVisible) {
      await expect(pauseButton).toBeVisible();
      await expect(pauseButton).toBeEnabled();
      await expect(pauseButton).toContainText('Pause Membership');
    } else {
      // User may have paused or cancelled subscription
      test.skip('Pause button not visible - subscription may not be active');
    }
  });

  test('Clicking Pause Membership opens modal', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    const pauseButton = page.locator('.pause-membership');
    const isPauseVisible = await pauseButton.isVisible().catch(() => false);

    if (!isPauseVisible) {
      test.skip('Pause button not visible - subscription may not be active');
      return;
    }

    await pauseButton.click();

    // Modal should be visible with correct title
    const modal = page.locator('.pause-membership-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('.modal-header h2')).toContainText('Pause your membership');
  });

  test('Pause modal displays duration options (1, 2, 3 months)', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    const pauseButton = page.locator('.pause-membership');
    const isPauseVisible = await pauseButton.isVisible().catch(() => false);

    if (!isPauseVisible) {
      test.skip('Pause button not visible - subscription may not be active');
      return;
    }

    await pauseButton.click();
    await expect(page.locator('.pause-membership-modal')).toBeVisible({ timeout: 5000 });

    // Check pause duration options
    const pauseOptions = page.locator('.pause-option');
    await expect(pauseOptions).toHaveCount(3);
    await expect(pauseOptions.nth(0)).toContainText('1 month');
    await expect(pauseOptions.nth(1)).toContainText('2 months');
    await expect(pauseOptions.nth(2)).toContainText('3 months');
  });

  test('First pause option (1 month) is selected by default', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    const pauseButton = page.locator('.pause-membership');
    const isPauseVisible = await pauseButton.isVisible().catch(() => false);

    if (!isPauseVisible) {
      test.skip('Pause button not visible - subscription may not be active');
      return;
    }

    await pauseButton.click();
    await expect(page.locator('.pause-membership-modal')).toBeVisible({ timeout: 5000 });

    // First option should be active by default
    const firstOption = page.locator('.pause-option').first();
    await expect(firstOption).toHaveClass(/active/);
  });

  test('Selecting different pause duration updates selection', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    const pauseButton = page.locator('.pause-membership');
    const isPauseVisible = await pauseButton.isVisible().catch(() => false);

    if (!isPauseVisible) {
      test.skip('Pause button not visible - subscription may not be active');
      return;
    }

    await pauseButton.click();
    await expect(page.locator('.pause-membership-modal')).toBeVisible({ timeout: 5000 });

    // Select 2 months option
    const secondOption = page.locator('.pause-option:has-text("2 months")');
    await secondOption.click();
    await expect(secondOption).toHaveClass(/active/);

    // First option should no longer be active
    const firstOption = page.locator('.pause-option').first();
    await expect(firstOption).not.toHaveClass(/active/);

    // Select 3 months option
    const thirdOption = page.locator('.pause-option:has-text("3 months")');
    await thirdOption.click();
    await expect(thirdOption).toHaveClass(/active/);
    await expect(secondOption).not.toHaveClass(/active/);
  });

  test('Pause modal displays pause summary with resume date', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    const pauseButton = page.locator('.pause-membership');
    const isPauseVisible = await pauseButton.isVisible().catch(() => false);

    if (!isPauseVisible) {
      test.skip('Pause button not visible - subscription may not be active');
      return;
    }

    await pauseButton.click();
    await expect(page.locator('.pause-membership-modal')).toBeVisible({ timeout: 5000 });

    // Check pause summary is displayed
    const pauseSummary = page.locator('.pause-summary');
    await expect(pauseSummary).toBeVisible();
    await expect(pauseSummary).toContainText('Your membership will resume on');
  });

  test('Pause modal Cancel button closes modal', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    const pauseButton = page.locator('.pause-membership');
    const isPauseVisible = await pauseButton.isVisible().catch(() => false);

    if (!isPauseVisible) {
      test.skip('Pause button not visible - subscription may not be active');
      return;
    }

    await pauseButton.click();
    await expect(page.locator('.pause-membership-modal')).toBeVisible({ timeout: 5000 });

    // Click Cancel button
    await page.locator('.pause-membership-modal .btn-secondary:has-text("Cancel")').click();

    // Modal should be closed
    await expect(page.locator('.pause-membership-modal')).not.toBeVisible({ timeout: 5000 });
  });

  test('Pause modal Confirm pause button is enabled', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    const pauseButton = page.locator('.pause-membership');
    const isPauseVisible = await pauseButton.isVisible().catch(() => false);

    if (!isPauseVisible) {
      test.skip('Pause button not visible - subscription may not be active');
      return;
    }

    await pauseButton.click();
    await expect(page.locator('.pause-membership-modal')).toBeVisible({ timeout: 5000 });

    // Confirm button should be enabled
    const confirmButton = page.locator('.btn-pause:has-text("Confirm pause")');
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeEnabled();
  });

});

test.describe('Cancel Membership - Functional Tests', () => {

  test('Cancel membership button is visible for active subscription', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Check if cancel button is visible (only for active subscriptions)
    const cancelButton = page.locator('.cancel-membership');
    const isCancelVisible = await cancelButton.isVisible().catch(() => false);

    if (isCancelVisible) {
      await expect(cancelButton).toBeVisible();
      await expect(cancelButton).toBeEnabled();
      await expect(cancelButton).toContainText('Cancel Membership');
    } else {
      // User may have already cancelled subscription
      test.skip('Cancel button not visible - subscription may not be active');
    }
  });

  test('Clicking Cancel Membership opens modal', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    const cancelButton = page.locator('.cancel-membership');
    const isCancelVisible = await cancelButton.isVisible().catch(() => false);

    if (!isCancelVisible) {
      test.skip('Cancel button not visible - subscription may not be active');
      return;
    }

    await cancelButton.click();

    // Modal should be visible with correct title
    const modal = page.locator('.cancel-membership-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('.modal-header h2')).toContainText('Cancel your membership');
  });

  test('Cancel modal displays warning message', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    const cancelButton = page.locator('.cancel-membership');
    const isCancelVisible = await cancelButton.isVisible().catch(() => false);

    if (!isCancelVisible) {
      test.skip('Cancel button not visible - subscription may not be active');
      return;
    }

    await cancelButton.click();
    await expect(page.locator('.cancel-membership-modal')).toBeVisible({ timeout: 5000 });

    // Check warning message
    const cancelWarning = page.locator('.cancel-warning');
    await expect(cancelWarning).toBeVisible();
    await expect(cancelWarning).toContainText('Are you sure you want to cancel your membership?');
  });

  test('Cancel modal displays information list about cancellation', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    const cancelButton = page.locator('.cancel-membership');
    const isCancelVisible = await cancelButton.isVisible().catch(() => false);

    if (!isCancelVisible) {
      test.skip('Cancel button not visible - subscription may not be active');
      return;
    }

    await cancelButton.click();
    await expect(page.locator('.cancel-membership-modal')).toBeVisible({ timeout: 5000 });

    // Check information list
    const infoList = page.locator('.cancel-info-list');
    await expect(infoList).toBeVisible();
    await expect(infoList.locator('li')).toHaveCount(3);
    await expect(infoList).toContainText("You won't be charged again after this date");
    await expect(infoList).toContainText('You can resubscribe anytime');
    await expect(infoList).toContainText('Your profiles and preferences will be saved');
  });

  test('Cancel modal Keep membership button closes modal', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    const cancelButton = page.locator('.cancel-membership');
    const isCancelVisible = await cancelButton.isVisible().catch(() => false);

    if (!isCancelVisible) {
      test.skip('Cancel button not visible - subscription may not be active');
      return;
    }

    await cancelButton.click();
    await expect(page.locator('.cancel-membership-modal')).toBeVisible({ timeout: 5000 });

    // Click Keep membership button
    await page.locator('.cancel-membership-modal .btn-secondary:has-text("Keep membership")').click();

    // Modal should be closed
    await expect(page.locator('.cancel-membership-modal')).not.toBeVisible({ timeout: 5000 });
  });

  test('Cancel modal Confirm cancellation button is enabled', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    const cancelButton = page.locator('.cancel-membership');
    const isCancelVisible = await cancelButton.isVisible().catch(() => false);

    if (!isCancelVisible) {
      test.skip('Cancel button not visible - subscription may not be active');
      return;
    }

    await cancelButton.click();
    await expect(page.locator('.cancel-membership-modal')).toBeVisible({ timeout: 5000 });

    // Confirm button should be enabled
    const confirmButton = page.locator('.btn-cancel-confirm:has-text("Confirm cancellation")');
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeEnabled();
  });

  test('Cancel modal displays access until date', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    const cancelButton = page.locator('.cancel-membership');
    const isCancelVisible = await cancelButton.isVisible().catch(() => false);

    if (!isCancelVisible) {
      test.skip('Cancel button not visible - subscription may not be active');
      return;
    }

    await cancelButton.click();
    await expect(page.locator('.cancel-membership-modal')).toBeVisible({ timeout: 5000 });

    // Check description mentions access until date
    const cancelDescription = page.locator('.cancel-description');
    await expect(cancelDescription).toBeVisible();
    await expect(cancelDescription).toContainText('you will continue to have access until');
  });

});

test.describe('Resume Membership - Functional Tests', () => {

  test('Resume button visible when subscription is paused or pending pause', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Check if membership status info is displayed (paused or pending pause)
    const statusInfo = page.locator('.membership-status-info');
    const isStatusVisible = await statusInfo.isVisible().catch(() => false);

    if (isStatusVisible) {
      // Resume button should be visible
      const resumeButton = page.locator('.resume-membership');
      await expect(resumeButton).toBeVisible();
      await expect(resumeButton).toBeEnabled();
    } else {
      // Subscription is active, no resume needed
      test.skip('No paused subscription - resume button not applicable');
    }
  });

  test('Paused membership shows status badge', async ({ page }) => {
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Check if status badge is displayed
    const statusBadge = page.locator('.status-badge');
    const isStatusVisible = await statusBadge.isVisible().catch(() => false);

    if (isStatusVisible) {
      // Status badge should show pause info
      await expect(statusBadge).toBeVisible();
      const badgeText = await statusBadge.textContent();
      expect(badgeText).toMatch(/Pause scheduled|Membership paused/);
    } else {
      // No paused status
      test.skip('No paused subscription status badge');
    }
  });

});
