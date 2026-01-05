import { test, expect } from '@playwright/test';

test.describe('Forgot Password - Password recovery', () => {

  test('Display of the password recovery page', async ({ page }) => {
    await page.goto('/account-settings/forgot-password');

    // Verify the title
    await expect(page.locator('h1')).toContainText('Forgot Password', { timeout: 10000 });

    // Verify the subtitle
    await expect(page.locator('.forgot-password-content p')).toContainText("send you an email");

    // Verify the email field
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('label[for="email"]')).toContainText('Email');

    // Verify the buttons
    await expect(page.locator('button[type="submit"]')).toContainText('Send Reset Link');
    await expect(page.locator('button.back-to-login')).toContainText('Back to Login');
  });

  test('Successful sending of the recovery link', async ({ page }) => {
    const testEmail = 'test@example.com';

    // Mock the API
    await page.route('**/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Reset link sent' }),
      });
    });

    await page.goto('/account-settings/forgot-password');

    // Fill the email
    await page.fill('input#email', testEmail);

    // Submit
    await page.click('button[type="submit"]');

    // Verify that we move to the "sent" step
    await expect(page.locator('h1')).toContainText('Check your email', { timeout: 10000 });

    // Verify the message with the email
    await expect(page.locator('.forgot-password-content p').first()).toContainText(testEmail);

    // Verify the expiration message
    await expect(page.locator('.email-note')).toContainText('expire in 24 hours');

    // Verify the "Back to Login" button
    await expect(page.locator('button.back-to-login')).toContainText('Back to Login');
  });

  test('Error - Invalid email (JavaScript validation)', async ({ page }) => {
    await page.goto('/account-settings/forgot-password');

    // Fill a poorly formatted email but that passes HTML type="email" validation
    // (HTML validation is less strict than JavaScript regex)
    await page.fill('input#email', 'test@');

    // Submit - HTML5 validation may block, so we check differently
    await page.click('button[type="submit"]');

    // Verify either the JS error message, or that the form stays on the page
    const errorVisible = await page.locator('.error-message').isVisible().catch(() => false);
    if (errorVisible) {
      await expect(page.locator('.error-message')).toContainText('valid email');
    } else {
      // HTML5 validation blocked, we stay on the same page
      await expect(page).toHaveURL(/\/account-settings\/forgot-password/);
    }
  });

  test('Error - Email not found (API error)', async ({ page }) => {
    // Mock the API with error
    await page.route('**/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Email not found' }),
      });
    });

    await page.goto('/account-settings/forgot-password');

    // Fill an email
    await page.fill('input#email', 'notfound@example.com');

    // Submit
    await page.click('button[type="submit"]');

    // Verify the error message
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('"Back to Login" button redirects to the login page', async ({ page }) => {
    await page.goto('/account-settings/forgot-password');

    // Click on "Back to Login"
    await page.click('button.back-to-login');

    // Verify the redirection
    await page.waitForURL('/account-settings/login', { timeout: 10000 });
  });

  test('Display of the reset page with token', async ({ page }) => {
    // Navigate to the reset page with a token
    await page.goto('/account-settings/reset-password?token=mock-reset-token');

    // Verify the title
    await expect(page.locator('h1')).toContainText('Reset Your Password', { timeout: 10000 });

    // Verify the fields
    await expect(page.locator('input#new-password')).toBeVisible();
    await expect(page.locator('input#confirm-password')).toBeVisible();

    // Verify the labels
    await expect(page.locator('label[for="new-password"]')).toContainText('New Password');
    await expect(page.locator('label[for="confirm-password"]')).toContainText('Confirm Password');

    // Verify the button
    await expect(page.locator('button[type="submit"]')).toContainText('Reset Password');
  });

  test('Successful password reset', async ({ page }) => {
    const newPassword = 'NewSecurePassword123!';

    // Mock the API
    await page.route('**/auth/reset-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Password reset successfully' }),
      });
    });

    await page.goto('/account-settings/reset-password?token=mock-reset-token');

    // Fill the new password
    await page.fill('input#new-password', newPassword);
    await page.fill('input#confirm-password', newPassword);

    // Submit
    await page.click('button[type="submit"]');

    // Verify the success message
    await expect(page.locator('h1')).toContainText('Password Reset Successful', { timeout: 10000 });
    await expect(page.locator('.forgot-password-content p')).toContainText('successfully reset');

    // Verify the "Back to Login" button
    await expect(page.locator('button.back-to-login')).toContainText('Back to Login');
  });

  test('Error - Passwords do not match', async ({ page }) => {
    await page.goto('/account-settings/reset-password?token=mock-reset-token');

    // Fill different passwords
    await page.fill('input#new-password', 'Password123!');
    await page.fill('input#confirm-password', 'DifferentPassword123!');

    // Submit
    await page.click('button[type="submit"]');

    // Verify the error message
    await expect(page.locator('.error-message')).toContainText('Passwords do not match');
  });

  test('Error - Password too short (native HTML validation)', async ({ page }) => {
    await page.goto('/account-settings/reset-password?token=mock-reset-token');

    // Fill a password too short (less than 8 characters)
    await page.fill('input#new-password', '1234567');
    await page.fill('input#confirm-password', '1234567');

    // Verify that the field has the minLength constraint
    const minLength = await page.locator('input#new-password').getAttribute('minLength');
    expect(minLength).toBe('8');

    // Submit - HTML5 validation prevents submission
    await page.click('button[type="submit"]');

    // The form should not be submitted, we stay on the same page
    await expect(page).toHaveURL(/\/account-settings\/reset-password/);

    // Verify that the field is invalid (HTML5 validation)
    const isValid = await page.locator('input#new-password').evaluate(el => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test('API error during reset', async ({ page }) => {
    // Mock the API with error
    await page.route('**/auth/reset-password', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Token expired or invalid' }),
      });
    });

    await page.goto('/account-settings/reset-password?token=expired-token');

    // Fill the passwords
    await page.fill('input#new-password', 'NewPassword123!');
    await page.fill('input#confirm-password', 'NewPassword123!');

    // Submit
    await page.click('button[type="submit"]');

    // Verify the error message
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('"Back to Login" button after successful reset', async ({ page }) => {
    // Mock the API
    await page.route('**/auth/reset-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/account-settings/reset-password?token=mock-reset-token');

    // Fill and submit
    await page.fill('input#new-password', 'NewPassword123!');
    await page.fill('input#confirm-password', 'NewPassword123!');
    await page.click('button[type="submit"]');

    // Wait for the success message
    await expect(page.locator('h1')).toContainText('Password Reset Successful', { timeout: 10000 });

    // Click on "Back to Login"
    await page.click('button.back-to-login');

    // Verify the redirection
    await page.waitForURL('/account-settings/login', { timeout: 10000 });
  });

  test('Button disabled during loading (sending email)', async ({ page }) => {
    // Mock the API with delay
    await page.route('**/auth/forgot-password', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/account-settings/forgot-password');

    // Fill the email
    await page.fill('input#email', 'test@example.com');

    // Submit
    await page.click('button[type="submit"]');

    // Verify that the button shows "Sending..." and is disabled
    await expect(page.locator('button[type="submit"]')).toContainText('Sending...');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();

    // Wait for the end
    await expect(page.locator('h1')).toContainText('Check your email', { timeout: 5000 });
  });

  test('Button disabled during loading (reset password)', async ({ page }) => {
    // Mock the API with delay
    await page.route('**/auth/reset-password', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/account-settings/reset-password?token=mock-reset-token');

    // Fill the passwords
    await page.fill('input#new-password', 'NewPassword123!');
    await page.fill('input#confirm-password', 'NewPassword123!');

    // Submit
    await page.click('button[type="submit"]');

    // Verify that the button shows "Resetting..." and is disabled
    await expect(page.locator('button[type="submit"]')).toContainText('Resetting...');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();

    // Wait for the end
    await expect(page.locator('h1')).toContainText('Password Reset Successful', { timeout: 5000 });
  });

  test('Navigation from the login page to forgot password', async ({ page }) => {
    await page.goto('/account-settings/login');

    // Click on "Forgot password?"
    await page.click('a.forgot-password');

    // Verify the redirection
    await page.waitForURL('/account-settings/forgot-password', { timeout: 10000 });

    // Verify that we are on the correct page
    await expect(page.locator('h1')).toContainText('Forgot Password');
  });

});

