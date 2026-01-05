import { test, expect } from '@playwright/test';

test.describe('Change Email & Backup Contact', () => {
  const customerId = 'test-customer-id';

  const mockSecurityInfo = {
    email: 'current@example.com',
    emailVerified: true,
    phone: '+33612345678',
    phoneVerified: false,
    backupContacts: [
      { id: 'bc-1', type: 'email', value: 'backup@example.com' },
    ],
  };

  const mockSecurityInfoNoBackup = {
    email: 'current@example.com',
    emailVerified: true,
    phone: null,
    phoneVerified: false,
    backupContacts: [],
  };

  const setupAuthMocks = async (page, securityData = mockSecurityInfo) => {
    // Navigate to login first to have context for localStorage
    await page.goto('/account-settings/login');

    // Configure localStorage
    await page.evaluate((custId) => {
      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      localStorage.setItem('deviceId', 'mock-device-id');
      localStorage.setItem('profileId', 'test-profile-id');
      localStorage.setItem('customer', JSON.stringify({ id: custId }));
    }, customerId);

    // Mock security-info
    await page.route('**/customer/security-info', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(securityData),
      });
    });

    // Mock active-profile
    await page.route('**/profiles/active-profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-profile-id',
          name: 'Test User',
          icon: 'alphabet-A',
        }),
      });
    });

    // Mock check-default-profile
    await page.route('**/profiles/check-default-profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ hasDefaultProfile: true }),
      });
    });

    // Mock verify password
    await page.route('**/customer/verify-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Mock update email
    await page.route('**/customer/update-email', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Email updated successfully' }),
      });
    });

    // Mock add/update backup contact
    await page.route('**/customer/backup-contacts', async (route) => {
      if (route.request().method() === 'POST' || route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            message: 'Backup contact updated successfully',
            backupContact: { id: 'bc-new', type: 'whatsapp', value: '+33699887766' }
          }),
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(securityData.backupContacts || []),
        });
      } else {
        await route.continue();
      }
    });

    // Mock update backup contact by ID
    await page.route('**/customer/backup-contacts/*', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            message: 'Backup contact updated successfully',
            backupContact: { id: 'bc-1', type: 'email', value: 'updated@example.com' }
          }),
        });
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Backup contact deleted successfully' }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock send verification email
    await page.route('**/auth/send-verification-email', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Verification email sent' }),
      });
    });

    // Mock request code
    await page.route('**/customer/request-customer-code', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Code sent' }),
      });
    });

    // Mock verify code
    await page.route('**/customer/verify-customer-code', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
  };

  test.describe('Security Page - Display', () => {
    test('Display Security page with email and backup contact sections', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto('/account-settings/security');

      // Verify page title
      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Verify Account Details section
      await expect(page.locator('h2:has-text("Account Details")')).toBeVisible();

      // Verify Email title is displayed (use specific selector)
      await expect(page.locator('.link-title:has-text("Email")')).toBeVisible();
      await expect(page.getByText('current@example.com')).toBeVisible();

      // Verify Backup contact section
      await expect(page.locator('.link-title:has-text("Backup contact")')).toBeVisible();
    });

    test('Display email verification status - Verified', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto('/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Verify email is shown as verified
      await expect(page.locator('.verification-status.verified')).toBeVisible();
    });

    test('Unverified email redirects to email verification page', async ({ page }) => {
      await setupAuthMocks(page, {
        ...mockSecurityInfo,
        emailVerified: false,
      });
      await page.goto('/account-settings/security');

      // When email is not verified, user is redirected to email verification page
      await expect(page).toHaveURL(/\/account-settings\/signup\/request-email-verification\/?/, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText('Email verification', { timeout: 10000 });
    });

    test('Display existing backup contacts', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto('/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Verify backup contact is displayed
      await expect(page.getByText('backup@example.com')).toBeVisible();
    });

    test('Display "No backup contacts" when none exist', async ({ page }) => {
      await setupAuthMocks(page, mockSecurityInfoNoBackup);
      await page.goto('/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Verify no backup contacts message
      await expect(page.getByText('No backup contacts provided')).toBeVisible();
    });
  });

  test.describe('Change Email Flow', () => {
    test('Click on Email opens verification modal', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto('/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click on Email section (LinkCard with title "Email")
      await page.locator('.link-card:has(.link-title:text-is("Email"))').click();

      // Verify modal is opened (modal uses .modal-overlay when open)
      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.modal-content h2')).toContainText('Email');
    });

    test('Click "Change Email" navigates to identity confirmation', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto('/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click on Email section to open modal
      await page.locator('.link-card:has(.link-title:text-is("Email"))').click();

      // Wait for modal
      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });

      // Click on Change Email button
      await page.locator('.modal-content button:has-text("Change Email")').click();

      // Verify navigation to identity confirmation
      await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });
    });

    test('Identity confirmation page - Enter password to continue', async ({ page }) => {
      await setupAuthMocks(page);

      // Navigate to security page first
      await page.goto('/account-settings/security');
      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click on Email to open modal
      await page.locator('.link-card:has(.link-title:text-is("Email"))').click();
      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });

      // Click Change Email
      await page.locator('.modal-content button:has-text("Change Email")').click();
      await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });

      // Verify identity confirmation page
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });

      // Enter password
      await page.fill('input[type="password"]', 'testpassword123');

      // Click Continue
      await page.locator('button.submit-button:has-text("Continue")').click();

      // Verify Update Email modal opens
      await expect(page.locator('.modal-content h2:has-text("Update Email")')).toBeVisible({ timeout: 10000 });
    });

    test('Update Email modal - Enter new email and submit', async ({ page }) => {
      await setupAuthMocks(page);

      // Navigate to security page
      await page.goto('/account-settings/security');
      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Open email modal
      await page.locator('.link-card:has(.link-title:text-is("Email"))').click();
      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });

      // Click Change Email
      await page.locator('.modal-content button:has-text("Change Email")').click();
      await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });

      // Enter password on identity confirmation
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });
      await page.fill('input[type="password"]', 'testpassword123');
      await page.locator('button.submit-button:has-text("Continue")').click();

      // Wait for Update Email modal
      await expect(page.locator('.modal-content h2:has-text("Update Email")')).toBeVisible({ timeout: 10000 });

      // Enter new email
      await page.fill('input[placeholder="Enter new email address"]', 'newemail@example.com');

      // Submit
      await page.locator('.modal-content button[type="submit"]:has-text("Update Email")').click();

      // Verify navigation back to security page
      await expect(page).toHaveURL(/\/account-settings\/security\/?/, { timeout: 15000 });
    });
  });

  test.describe('Backup Contact Flow', () => {
    test('Click on "Add backup contact" navigates to identity confirmation', async ({ page }) => {
      await setupAuthMocks(page, mockSecurityInfoNoBackup);
      await page.goto('/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click on Add backup contact
      await page.locator('button.add-backup-button').click();

      // Verify navigation to identity confirmation
      await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });
    });

    test('Add new backup contact - WhatsApp', async ({ page }) => {
      await setupAuthMocks(page, mockSecurityInfoNoBackup);
      await page.goto('/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click Add backup contact
      await page.locator('button.add-backup-button').click();
      await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });

      // Enter password
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });
      await page.fill('input[type="password"]', 'testpassword123');
      await page.locator('button.submit-button').click();

      // Wait for Add Backup Contact modal
      await expect(page.locator('h2:has-text("Add Backup Contact")')).toBeVisible({ timeout: 10000 });

      // Select WhatsApp type
      await page.selectOption('select', 'WhatsApp');

      // Enter WhatsApp number
      await page.locator('input[type="text"]').fill('+33699887766');

      // Submit
      await page.locator('button[type="submit"]:has-text("Add Backup Contact")').click();

      // Verify navigation back to security page
      await expect(page).toHaveURL(/\/account-settings\/security\/?/, { timeout: 15000 });
    });

    test('Add new backup contact - Telegram', async ({ page }) => {
      await setupAuthMocks(page, mockSecurityInfoNoBackup);
      await page.goto('/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click Add backup contact
      await page.locator('button.add-backup-button').click();
      await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });

      // Enter password
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });
      await page.fill('input[type="password"]', 'testpassword123');
      await page.locator('button.submit-button').click();

      // Wait for Add Backup Contact modal
      await expect(page.locator('h2:has-text("Add Backup Contact")')).toBeVisible({ timeout: 10000 });

      // Select Telegram type
      await page.selectOption('select', 'Telegram');

      // Enter Telegram username
      await page.locator('input[type="text"]').fill('@testuser123');

      // Submit
      await page.locator('button[type="submit"]:has-text("Add Backup Contact")').click();

      // Verify navigation back to security page
      await expect(page).toHaveURL(/\/account-settings\/security\/?/, { timeout: 15000 });
    });

    test('Edit existing backup contact', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto('/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click Edit Backup Contact
      await page.locator('button.edit-backup-button').click();
      await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });

      // Enter password
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });
      await page.fill('input[type="password"]', 'testpassword123');
      await page.locator('button.submit-button').click();

      // Wait for Backup Contact List modal (uses different class)
      await expect(page.locator('.backup-contact-list-modal h2:has-text("Backup Contacts")')).toBeVisible({ timeout: 15000 });

      // Wait for data to load in the input field (need extra time for React state to propagate)
      await expect(page.locator('.backup-contact-input').first()).toHaveValue('backup@example.com', { timeout: 15000 });
    });

    test('Validation - Invalid WhatsApp format shows error', async ({ page }) => {
      await setupAuthMocks(page, mockSecurityInfoNoBackup);
      await page.goto('/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click Add backup contact
      await page.locator('button.add-backup-button').click();
      await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });

      // Enter password
      await page.fill('input[type="password"]', 'testpassword123');
      await page.locator('button.submit-button').click();

      // Wait for modal
      await expect(page.locator('h2:has-text("Add Backup Contact")')).toBeVisible({ timeout: 10000 });

      // Select WhatsApp
      await page.selectOption('select', 'WhatsApp');

      // Enter invalid number (without +)
      await page.locator('input[type="text"]').fill('0612345678');

      // Submit
      await page.locator('button[type="submit"]:has-text("Add Backup Contact")').click();

      // Verify error message
      await expect(page.locator('.error-message')).toContainText('valid WhatsApp number', { timeout: 5000 });
    });

    test('Validation - Invalid Telegram format shows error', async ({ page }) => {
      await setupAuthMocks(page, mockSecurityInfoNoBackup);
      await page.goto('/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click Add backup contact
      await page.locator('button.add-backup-button').click();
      await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });

      // Enter password
      await page.fill('input[type="password"]', 'testpassword123');
      await page.locator('button.submit-button').click();

      // Wait for modal
      await expect(page.locator('h2:has-text("Add Backup Contact")')).toBeVisible({ timeout: 10000 });

      // Select Telegram
      await page.selectOption('select', 'Telegram');

      // Enter invalid username (without @)
      await page.locator('input[type="text"]').fill('testuser');

      // Submit
      await page.locator('button[type="submit"]:has-text("Add Backup Contact")').click();

      // Verify error message
      await expect(page.locator('.error-message')).toContainText('valid Telegram username', { timeout: 5000 });
    });
  });

  test.describe('Mobile Phone Flow', () => {
    test('Display mobile phone section on Security page', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto('/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Verify Mobile phone section is displayed
      await expect(page.locator('.link-title:has-text("Mobile phone")')).toBeVisible();
      await expect(page.getByText('+33612345678')).toBeVisible();
    });

    test('Display phone verification status - Unverified', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto('/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Verify phone needs verification (mockSecurityInfo has phoneVerified: false)
      await expect(page.locator('.link-card:has(.link-title:text-is("Mobile phone")) .verification-status.unverified')).toBeVisible();
    });

    test('Display "No phone number provided" when none exists', async ({ page }) => {
      await setupAuthMocks(page, mockSecurityInfoNoBackup);
      await page.goto('/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Verify no phone message (mockSecurityInfoNoBackup has phone: null)
      await expect(page.getByText('No phone number provided')).toBeVisible();
    });

    test('Click on Mobile phone navigates to identity confirmation', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto('/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click on Mobile phone section
      await page.locator('.link-card:has(.link-title:text-is("Mobile phone"))').click();

      // Verify navigation to identity confirmation
      await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });
    });

    test('Update phone number after identity confirmation', async ({ page }) => {
      // Add mock for add-phone-number API
      await setupAuthMocks(page);
      
      // Mock add phone number API
      await page.route('**/customer/add-phone-number', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Phone number added successfully' }),
        });
      });

      await page.goto('/account-settings/security');
      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click on Mobile phone section
      await page.locator('.link-card:has(.link-title:text-is("Mobile phone"))').click();
      await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });

      // Enter password
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });
      await page.fill('input[type="password"]', 'testpassword123');
      await page.locator('button.submit-button').click();

      // Wait for Update Phone modal (uses .modal.open class)
      await expect(page.locator('.modal.open h2')).toContainText('Phone', { timeout: 15000 });

      // Verify current phone is displayed
      await expect(page.locator('.modal.open input[value="+33612345678"]')).toBeVisible();

      // Enter new phone number
      await page.locator('.modal.open input[placeholder="Enter phone number"]').fill('+33698765432');

      // Submit
      await page.locator('.modal.open button[type="submit"]').click();

      // Verify navigation back to security page
      await expect(page).toHaveURL(/\/account-settings\/security\/?/, { timeout: 15000 });
    });

    test('Add phone number when none exists', async ({ page }) => {
      await setupAuthMocks(page, mockSecurityInfoNoBackup);
      
      // Mock add phone number API
      await page.route('**/customer/add-phone-number', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Phone number added successfully' }),
        });
      });

      await page.goto('/account-settings/security');
      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click on Mobile phone section
      await page.locator('.link-card:has(.link-title:text-is("Mobile phone"))').click();
      await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });

      // Enter password
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });
      await page.fill('input[type="password"]', 'testpassword123');
      await page.locator('button.submit-button').click();

      // Wait for Add Phone modal
      await expect(page.locator('.modal.open h2')).toContainText('Add Phone', { timeout: 15000 });

      // Enter phone number
      await page.locator('.modal.open input[placeholder="Enter phone number"]').fill('+33612345678');

      // Submit
      await page.locator('.modal.open button[type="submit"]').click();

      // Verify navigation back to security page
      await expect(page).toHaveURL(/\/account-settings\/security\/?/, { timeout: 15000 });
    });

    test('Empty phone number shows error', async ({ page }) => {
      await setupAuthMocks(page, mockSecurityInfoNoBackup);
      await page.goto('/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click on Mobile phone section
      await page.locator('.link-card:has(.link-title:text-is("Mobile phone"))').click();
      await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });

      // Enter password
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });
      await page.fill('input[type="password"]', 'testpassword123');
      await page.locator('button.submit-button').click();

      // Wait for Add Phone modal
      await expect(page.locator('.modal.open h2')).toContainText('Add Phone', { timeout: 15000 });

      // Try to submit without entering phone number
      await page.locator('.modal.open button[type="submit"]').click();

      // Verify error message
      await expect(page.locator('.modal.open .error-message')).toContainText('enter a new phone number', { timeout: 5000 });
    });
  });

  test.describe('Identity Confirmation - Alternative Methods', () => {
    test('Request verification code via email', async ({ page }) => {
      await setupAuthMocks(page, mockSecurityInfoNoBackup);
      await page.goto('/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click Add backup contact
      await page.locator('button.add-backup-button').click();
      await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });

      // Verify identity confirmation page
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });

      // Verify "Email a code" button is visible
      await expect(page.locator('button.code-button')).toBeVisible();

      // Click Email a code
      await page.locator('button.code-button').click();

      // Verify code input modal opens
      await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
    });

    test('Wrong password shows error message', async ({ page }) => {
      // Override verify password to return error
      await page.goto('/account-settings/login');
      await page.evaluate((custId) => {
        localStorage.setItem('accessToken', 'mock-access-token');
        localStorage.setItem('refreshToken', 'mock-refresh-token');
        localStorage.setItem('deviceId', 'mock-device-id');
        localStorage.setItem('profileId', 'test-profile-id');
        localStorage.setItem('customer', JSON.stringify({ id: custId }));
      }, customerId);

      await page.route('**/customer/security-info', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSecurityInfoNoBackup),
        });
      });

      await page.route('**/profiles/active-profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'test-profile-id', name: 'Test', icon: 'alphabet-A' }),
        });
      });

      await page.route('**/profiles/check-default-profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ hasDefaultProfile: true }),
        });
      });

      // Mock verify password with error (use 400 instead of 401 to avoid redirect)
      await page.route('**/customer/verify-password', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Incorrect password. Please try again.' }),
        });
      });

      await page.goto('/account-settings/security');
      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click Add backup contact
      await page.locator('button.add-backup-button').click();
      await expect(page).toHaveURL(/\/account-settings\/identity-confirmation\/?/, { timeout: 15000 });

      // Verify identity confirmation page loaded
      await expect(page.locator('h1')).toContainText("Confirm it's you", { timeout: 15000 });

      // Enter wrong password
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.locator('button.submit-button').click();

      // Verify error message
      await expect(page.locator('.error-message')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Access and Privacy Section', () => {
    test('Display Access and Privacy section', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto('/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Verify Access and Privacy section
      await expect(page.locator('h2:has-text("Access and Privacy")')).toBeVisible();

      // Verify links
      await expect(page.locator('text=Access and devices')).toBeVisible();
      await expect(page.locator('text=Personal info access')).toBeVisible();
    });

    test('Click on Access and devices navigates to manage-access', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto('/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Click on Access and devices
      await page.click('text=Access and devices');

      // Verify navigation
      await expect(page).toHaveURL(/\/account-settings\/manage-access\/?/, { timeout: 15000 });
    });

    test('Delete Account button is visible', async ({ page }) => {
      await setupAuthMocks(page);
      await page.goto('/account-settings/security');

      await expect(page.locator('h1')).toContainText('Security', { timeout: 15000 });

      // Verify Delete Account button
      await expect(page.locator('button:has-text("Delete Account")')).toBeVisible();
    });
  });
});

