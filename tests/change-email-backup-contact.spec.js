import { test, expect } from '@playwright/test';
import { testUser } from './test-config.js';

// Helper pour naviguer vers une page protégée en attendant security-info
const gotoProtectedPage = async (page, url, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const securityInfoPromise = page.waitForResponse(
      response => response.url().includes('/customer/security-info') && response.status() === 200,
      { timeout: 30000 }
    ).catch(() => null);
    
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    await securityInfoPromise;
    await page.waitForTimeout(1000);
    
    // Vérifier si on n'est pas redirigé vers Email verification
    const h1Text = await page.locator('h1').textContent().catch(() => '');
    if (!h1Text.includes('Email verification')) {
      return; // Succès, on est sur la bonne page
    }
    
    // Si on est sur Email verification, attendre et réessayer
    await page.waitForTimeout(2000);
  }
};

test.describe('Change Email & Backup Contact - Real Tests', () => {

  test.describe('Security Page - Display', () => {
    test('Display Security page with title and sections', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      // Verify page title
      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Verify Account Details section
      await expect(page.locator('h2:has-text("Account Details")')).toBeVisible();

      // Verify Access and Privacy section
      await expect(page.locator('h2:has-text("Access and Privacy")')).toBeVisible();
    });

    test('Display Password link', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Verify Password link is displayed
      await expect(page.locator('.link-title:has-text("Password")')).toBeVisible();
    });

    test('Display Email section with email address', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Verify Email title is displayed
      await expect(page.locator('.link-title:has-text("Email")')).toBeVisible();
      
      // Verify email is displayed (should contain @)
      await expect(page.locator('.email-description:has-text("@")')).toBeVisible();
    });

    test('Display email verification status', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Verify email verification status is displayed (either verified or unverified)
      const verifiedStatus = page.locator('.verification-status.verified');
      const unverifiedStatus = page.locator('.verification-status.unverified');
      
      const isVerified = await verifiedStatus.isVisible().catch(() => false);
      const isUnverified = await unverifiedStatus.isVisible().catch(() => false);
      
      expect(isVerified || isUnverified).toBeTruthy();
    });

    test('Display Backup contact section', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Verify Backup contact section is displayed
      await expect(page.locator('.link-title:has-text("Backup contact")')).toBeVisible();
    });

    test('Display Mobile phone section', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Verify Mobile phone section is displayed
      await expect(page.locator('.link-title:has-text("Mobile phone")')).toBeVisible();
    });

    test('Display Access and devices link', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Verify Access and devices link
      await expect(page.locator('text=Access and devices')).toBeVisible();
    });

    test('Display Personal info access link', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Verify Personal info access link
      await expect(page.locator('text=Personal info access')).toBeVisible();
    });

    test('Display Delete Account button', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Verify Delete Account button
      await expect(page.locator('button:has-text("Delete Account")')).toBeVisible();
    });
  });

  test.describe('Change Email Flow', () => {
    test('Click on Email opens verification modal', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click on Email section
      await page.locator('.link-card:has(.link-title:text-is("Email"))').click();

      // Verify modal is opened
      await expect(page.locator('.modal-overlay, .modal.open')).toBeVisible({ timeout: 10000 });
    });

    test('Email modal shows current email and Change Email button', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click on Email section to open modal
      await page.locator('.link-card:has(.link-title:text-is("Email"))').click();

      // Wait for modal
      await expect(page.locator('.modal-overlay, .modal.open')).toBeVisible({ timeout: 10000 });

      // Verify modal content
      await expect(page.locator('.modal-content h2')).toContainText('Email');
      await expect(page.locator('.modal-content button:has-text("Change Email")')).toBeVisible();
    });

    test('Click "Change Email" navigates to identity confirmation', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click on Email section to open modal
      await page.locator('.link-card:has(.link-title:text-is("Email"))').click();

      // Wait for modal
      await expect(page.locator('.modal-overlay, .modal.open')).toBeVisible({ timeout: 10000 });

      // Click on Change Email button
      await page.locator('.modal-content button:has-text("Change Email")').click();

      // Verify navigation to identity confirmation
      await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });
    });
  });

  test.describe('Identity Confirmation Page', () => {
    test('Display identity confirmation page with password form', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Navigate to identity confirmation via Email modal
      await page.locator('.link-card:has(.link-title:text-is("Email"))').click();
      await expect(page.locator('.modal-overlay, .modal.open')).toBeVisible({ timeout: 10000 });
      await page.locator('.modal-content button:has-text("Change Email")').click();

      // Verify identity confirmation page
      await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });

      // Verify password input
      await expect(page.locator('input[type="password"]')).toBeVisible();

      // Verify Continue button
      await expect(page.locator('button.submit-button:has-text("Continue")')).toBeVisible();

      // Verify "Email a code" button
      await expect(page.locator('button.code-button')).toBeVisible();
    });

    test('Continue button is disabled when password is empty', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Navigate to identity confirmation
      await page.locator('.link-card:has(.link-title:text-is("Email"))').click();
      await expect(page.locator('.modal-overlay, .modal.open')).toBeVisible({ timeout: 10000 });
      await page.locator('.modal-content button:has-text("Change Email")').click();
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });

      // Verify Continue button is disabled when password is empty
      await expect(page.locator('button.submit-button:has-text("Continue")')).toBeDisabled();
    });

    test('Wrong password shows error message', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Navigate to identity confirmation
      await page.locator('.link-card:has(.link-title:text-is("Email"))').click();
      await expect(page.locator('.modal-overlay, .modal.open')).toBeVisible({ timeout: 10000 });
      await page.locator('.modal-content button:has-text("Change Email")').click();
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });

      // Enter wrong password
      await page.fill('input[type="password"]', 'WrongPassword123!');
      await page.locator('button.submit-button:has-text("Continue")').click();

      // Verify error message
      await expect(page.locator('.error-message')).toBeVisible({ timeout: 10000 });
    });

    test('Correct password opens Update Email modal', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Navigate to identity confirmation
      await page.locator('.link-card:has(.link-title:text-is("Email"))').click();
      await expect(page.locator('.modal-overlay, .modal.open')).toBeVisible({ timeout: 10000 });
      await page.locator('.modal-content button:has-text("Change Email")').click();
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });

      // Enter correct password
      await page.fill('input[type="password"]', testUser.password);
      await page.locator('button.submit-button:has-text("Continue")').click();

      // Verify Update Email modal opens
      await expect(page.locator('.modal.open h2:has-text("Update Email")')).toBeVisible({ timeout: 10000 });
    });

    test('Email a code button opens verification modal', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Navigate to identity confirmation
      await page.locator('.link-card:has(.link-title:text-is("Email"))').click();
      await expect(page.locator('.modal-overlay, .modal.open')).toBeVisible({ timeout: 10000 });
      await page.locator('.modal-content button:has-text("Change Email")').click();
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });

      // Click "Email a code"
      await page.locator('button.code-button').click();

      // Verify code verification modal opens
      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Update Email Modal', () => {
    test('Update Email modal shows current email', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Navigate to Update Email modal
      await page.locator('.link-card:has(.link-title:text-is("Email"))').click();
      await expect(page.locator('.modal-overlay, .modal.open')).toBeVisible({ timeout: 10000 });
      await page.locator('.modal-content button:has-text("Change Email")').click();
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });
      await page.fill('input[type="password"]', testUser.password);
      await page.locator('button.submit-button:has-text("Continue")').click();

      // Verify Update Email modal
      await expect(page.locator('.modal.open h2:has-text("Update Email")')).toBeVisible({ timeout: 10000 });

      // Verify current email is displayed (readonly input)
      const currentEmailInput = page.locator('.modal.open input[readonly]');
      await expect(currentEmailInput).toBeVisible();
      const currentEmailValue = await currentEmailInput.inputValue();
      expect(currentEmailValue).toContain('@');
    });

    test('Update Email modal has new email input', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Navigate to Update Email modal
      await page.locator('.link-card:has(.link-title:text-is("Email"))').click();
      await expect(page.locator('.modal-overlay, .modal.open')).toBeVisible({ timeout: 10000 });
      await page.locator('.modal-content button:has-text("Change Email")').click();
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });
      await page.fill('input[type="password"]', testUser.password);
      await page.locator('button.submit-button:has-text("Continue")').click();

      // Verify Update Email modal
      await expect(page.locator('.modal.open h2:has-text("Update Email")')).toBeVisible({ timeout: 10000 });

      // Verify new email input
      await expect(page.locator('.modal.open input[placeholder="Enter new email address"]')).toBeVisible();
    });

    test('Update Email modal has Cancel and Update buttons', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Navigate to Update Email modal
      await page.locator('.link-card:has(.link-title:text-is("Email"))').click();
      await expect(page.locator('.modal-overlay, .modal.open')).toBeVisible({ timeout: 10000 });
      await page.locator('.modal-content button:has-text("Change Email")').click();
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });
      await page.fill('input[type="password"]', testUser.password);
      await page.locator('button.submit-button:has-text("Continue")').click();

      // Verify Update Email modal
      await expect(page.locator('.modal.open h2:has-text("Update Email")')).toBeVisible({ timeout: 10000 });

      // Verify buttons
      await expect(page.locator('.modal.open button:has-text("Cancel")')).toBeVisible();
      await expect(page.locator('.modal.open button[type="submit"]:has-text("Update Email")')).toBeVisible();
    });
  });

  test.describe('Backup Contact Flow', () => {
    test('Display backup contacts if exists', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Verify Backup contact section shows either contacts or "No backup contacts" / "+ Add" button
      const backupSection = page.locator('.link-card:has(.link-title:text-is("Backup contact"))');
      await expect(backupSection).toBeVisible();

      // Either there are backup contacts displayed, or there's an add button
      const hasContacts = await page.locator('.backup-contacts-list').isVisible().catch(() => false);
      const hasAddButton = await page.locator('button.add-backup-button').isVisible().catch(() => false);
      
      expect(hasContacts || hasAddButton).toBeTruthy();
    });

    test('Click on backup contact navigates to identity confirmation', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click on Backup contact section
      await page.locator('.link-card:has(.link-title:text-is("Backup contact"))').click();

      // Verify navigation to identity confirmation
      await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });
    });

    test('Add backup contact button navigates to identity confirmation', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Check if Add backup button exists
      const addButton = page.locator('button.add-backup-button');
      const isVisible = await addButton.isVisible().catch(() => false);

      if (isVisible) {
        await addButton.click();
        await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });
      } else {
        test.skip('No Add backup contact button visible (user may already have all backup contact types)');
      }
    });

    test('After password verification, backup contact modal opens', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click on Backup contact section
      await page.locator('.link-card:has(.link-title:text-is("Backup contact"))').click();

      // Wait for identity confirmation
      await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });

      // Enter password
      await page.fill('input[type="password"]', testUser.password);
      await page.locator('button.submit-button:has-text("Continue")').click();

      // Verify backup contact modal opens (either Add or List modal)
      const addModal = page.locator('.modal.open h2:has-text("Add Backup Contact")');
      const listModal = page.locator('.backup-contact-list-modal h2:has-text("Backup Contacts")');
      
      await expect(addModal.or(listModal)).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Add Backup Contact Modal', () => {
    test('Add Backup Contact modal has type selector', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Check if Add backup button exists
      const addButton = page.locator('button.add-backup-button');
      const isVisible = await addButton.isVisible().catch(() => false);

      if (!isVisible) {
        test.skip('No Add backup contact button visible');
        return;
      }

      // Click on Add backup contact
      await addButton.click();
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });

      // Enter password
      await page.fill('input[type="password"]', testUser.password);
      await page.locator('button.submit-button:has-text("Continue")').click();

      // Verify Add Backup Contact modal
      await expect(page.locator('.modal.open h2:has-text("Add Backup Contact")')).toBeVisible({ timeout: 15000 });

      // Verify type selector (Email, WhatsApp, Telegram)
      await expect(page.locator('.modal.open select')).toBeVisible();
    });

    test('Add Backup Contact modal has value input', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      const addButton = page.locator('button.add-backup-button');
      const isVisible = await addButton.isVisible().catch(() => false);

      if (!isVisible) {
        test.skip('No Add backup contact button visible');
        return;
      }

      await addButton.click();
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });
      await page.fill('input[type="password"]', testUser.password);
      await page.locator('button.submit-button:has-text("Continue")').click();

      await expect(page.locator('.modal.open h2:has-text("Add Backup Contact")')).toBeVisible({ timeout: 15000 });

      // Verify value input
      await expect(page.locator('.modal.open input[type="email"], .modal.open input[type="text"]').first()).toBeVisible();
    });

    test('Validation - Invalid WhatsApp format shows error', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      const addButton = page.locator('button.add-backup-button');
      const isVisible = await addButton.isVisible().catch(() => false);

      if (!isVisible) {
        test.skip('No Add backup contact button visible');
        return;
      }

      await addButton.click();
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });
      await page.fill('input[type="password"]', testUser.password);
      await page.locator('button.submit-button:has-text("Continue")').click();

      await expect(page.locator('.modal.open h2:has-text("Add Backup Contact")')).toBeVisible({ timeout: 15000 });

      // Check if WhatsApp is available in the dropdown
      const select = page.locator('.modal.open select');
      const options = await select.locator('option').allTextContents();
      
      if (!options.some(opt => opt.includes('WhatsApp'))) {
        test.skip('WhatsApp option not available');
        return;
      }

      // Select WhatsApp
      await select.selectOption('WhatsApp');

      // Enter invalid number (without +)
      await page.locator('.modal.open input[type="text"]').fill('0612345678');

      // Submit
      await page.locator('.modal.open button[type="submit"]').click();

      // Verify error message
      await expect(page.locator('.error-message')).toContainText('WhatsApp', { timeout: 5000 });
    });

    test('Validation - Invalid Telegram format shows error', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      const addButton = page.locator('button.add-backup-button');
      const isVisible = await addButton.isVisible().catch(() => false);

      if (!isVisible) {
        test.skip('No Add backup contact button visible');
        return;
      }

      await addButton.click();
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });
      await page.fill('input[type="password"]', testUser.password);
      await page.locator('button.submit-button:has-text("Continue")').click();

      await expect(page.locator('.modal.open h2:has-text("Add Backup Contact")')).toBeVisible({ timeout: 15000 });

      // Check if Telegram is available in the dropdown
      const select = page.locator('.modal.open select');
      const options = await select.locator('option').allTextContents();
      
      if (!options.some(opt => opt.includes('Telegram'))) {
        test.skip('Telegram option not available');
        return;
      }

      // Select Telegram
      await select.selectOption('Telegram');

      // Enter invalid username (without @)
      await page.locator('.modal.open input[type="text"]').fill('testuser');

      // Submit
      await page.locator('.modal.open button[type="submit"]').click();

      // Verify error message
      await expect(page.locator('.error-message')).toContainText('Telegram', { timeout: 5000 });
    });
  });

  test.describe('Backup Contact List Modal', () => {
    test('Edit backup contact button opens list modal', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Check if Edit button exists
      const editButton = page.locator('button.edit-backup-button');
      const isVisible = await editButton.isVisible().catch(() => false);

      if (!isVisible) {
        test.skip('No Edit backup contact button visible (no backup contacts exist)');
        return;
      }

      await editButton.click();
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });
      await page.fill('input[type="password"]', testUser.password);
      await page.locator('button.submit-button:has-text("Continue")').click();

      // Verify Backup Contact List modal
      await expect(page.locator('.backup-contact-list-modal h2:has-text("Backup Contacts")')).toBeVisible({ timeout: 15000 });
    });

    test('Backup Contact List modal shows contacts with Save and Delete buttons', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      const editButton = page.locator('button.edit-backup-button');
      const isVisible = await editButton.isVisible().catch(() => false);

      if (!isVisible) {
        test.skip('No Edit backup contact button visible');
        return;
      }

      await editButton.click();
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });
      await page.fill('input[type="password"]', testUser.password);
      await page.locator('button.submit-button:has-text("Continue")').click();

      await expect(page.locator('.backup-contact-list-modal h2:has-text("Backup Contacts")')).toBeVisible({ timeout: 15000 });

      // Verify contacts are displayed with Save/Delete buttons
      await expect(page.locator('.backup-contact-item').first()).toBeVisible();
      await expect(page.locator('.backup-contact-save-btn').first()).toBeVisible();
      await expect(page.locator('.backup-contact-delete-btn').first()).toBeVisible();
    });

    test('Backup Contact List modal has close button', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      const editButton = page.locator('button.edit-backup-button');
      const isVisible = await editButton.isVisible().catch(() => false);

      if (!isVisible) {
        test.skip('No Edit backup contact button visible');
        return;
      }

      await editButton.click();
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });
      await page.fill('input[type="password"]', testUser.password);
      await page.locator('button.submit-button:has-text("Continue")').click();

      await expect(page.locator('.backup-contact-list-modal h2:has-text("Backup Contacts")')).toBeVisible({ timeout: 15000 });

      // Verify close button
      await expect(page.locator('.backup-contact-list-modal-close')).toBeVisible();
    });
  });

  test.describe('Mobile Phone Flow', () => {
    test('Click on Mobile phone navigates to identity confirmation', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click on Mobile phone section
      await page.locator('.link-card:has(.link-title:text-is("Mobile phone"))').click();

      // Verify navigation to identity confirmation
      await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });
    });

    test('After password verification, phone modal opens', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click on Mobile phone section
      await page.locator('.link-card:has(.link-title:text-is("Mobile phone"))').click();
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });

      // Enter password
      await page.fill('input[type="password"]', testUser.password);
      await page.locator('button.submit-button:has-text("Continue")').click();

      // Verify phone modal opens (Update or Add)
      await expect(page.locator('.modal.open h2')).toContainText('Phone', { timeout: 15000 });
    });

    test('Phone modal has input and submit button', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      await page.locator('.link-card:has(.link-title:text-is("Mobile phone"))').click();
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });
      await page.fill('input[type="password"]', testUser.password);
      await page.locator('button.submit-button:has-text("Continue")').click();

      await expect(page.locator('.modal.open h2')).toContainText('Phone', { timeout: 15000 });

      // Verify input and buttons
      await expect(page.locator('.modal.open input')).toBeVisible();
      await expect(page.locator('.modal.open button[type="submit"]')).toBeVisible();
    });
  });

  test.describe('Navigation to Password Change', () => {
    test('Click on Password navigates to change password page', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click on Password section
      await page.locator('.link-card:has(.link-title:text-is("Password"))').click();

      // Verify navigation
      await expect(page).toHaveURL(/\/account-settings\/change-password\/?/, { timeout: 15000 });
    });
  });

  test.describe('Navigation to Manage Access', () => {
    test('Click on Access and devices navigates to manage-access', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click on Access and devices
      await page.click('text=Access and devices');

      // Verify navigation
      await expect(page).toHaveURL(/\/account-settings\/manage-access\/?/, { timeout: 15000 });
    });
  });

  test.describe('Personal Info Access Modal', () => {
    test('Click on Personal info access opens modal', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click on Personal info access
      await page.click('text=Personal info access');

      // Verify modal opens
      await expect(page.locator('.modal-overlay, .modal.open')).toBeVisible({ timeout: 10000 });
    });
  });

});
