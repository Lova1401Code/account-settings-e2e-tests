import { test, expect } from '@playwright/test';
import { getVerificationToken } from './api-config.js';

const stripeTestCards = {
  visa: {
    number: '4242424242424242',
    expMonth: '12',
    expYear: '30',
    cvc: '123',
    zip: '12345',
  },
  declined: {
    number: '4000000000000002',
    expMonth: '12',
    expYear: '30',
    cvc: '123',
    zip: '12345',
  },
};

const generateTestEmail = () => `test-e2e-${Date.now()}@testmail.com`;

const fillStripeCardElement = async (page, card) => {
  await page.waitForSelector('.stripe-card-element iframe', { timeout: 15000 });
  const stripeFrame = page.frameLocator('.stripe-card-element iframe').first();
  await page.waitForTimeout(1000);

  const cardNumberInput = stripeFrame.locator('input[name="cardnumber"]');
  await cardNumberInput.waitFor({ state: 'visible', timeout: 10000 });
  await cardNumberInput.click();
  await page.waitForTimeout(300);
  await cardNumberInput.fill('');
  await page.waitForTimeout(200);
  for (const digit of card.number) {
    await cardNumberInput.press(digit);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(500);

  const expiryInput = stripeFrame.locator('input[name="exp-date"]');
  await expiryInput.waitFor({ state: 'visible', timeout: 5000 });
  await expiryInput.click();
  await page.waitForTimeout(300);
  const expiry = card.expMonth + card.expYear;
  for (const digit of expiry) {
    await expiryInput.press(digit);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(500);

  const cvcInput = stripeFrame.locator('input[name="cvc"]');
  await cvcInput.waitFor({ state: 'visible', timeout: 5000 });
  await cvcInput.click();
  await page.waitForTimeout(300);
  for (const digit of card.cvc) {
    await cvcInput.press(digit);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(500);

  const postalInput = stripeFrame.locator('input[name="postal"]');
  await postalInput.waitFor({ state: 'visible', timeout: 5000 });
  await postalInput.click();
  await page.waitForTimeout(300);
  for (const digit of card.zip) {
    await postalInput.press(digit);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(500);
};


test.describe('Signup - Form Validation', () => {

  test('submit disabled with empty email', async ({ page }) => {
    await page.goto('/account-settings/signup');
    await expect(page.locator('h1')).toContainText('Unlimited movies', { timeout: 15000 });
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('submit disabled with invalid email', async ({ page }) => {
    await page.goto('/account-settings/signup');
    await expect(page.locator('h1')).toContainText('Unlimited movies', { timeout: 15000 });
    await page.fill('input#email', 'invalidemail');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('submit enabled with valid email', async ({ page }) => {
    await page.goto('/account-settings/signup');
    await expect(page.locator('h1')).toContainText('Unlimited movies', { timeout: 15000 });
    await page.fill('input#email', 'test@example.com');
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

});


test.describe('Signup - Complete E2E Flow', () => {

  test('Full signup flow: email → password → verify → plan → payment → subscription', async ({ page }) => {
    test.setTimeout(180000);
    
    const testEmail = generateTestEmail();
    const testPassword = 'TestPassword123!';

    // STEP 1: Enter email
    await page.goto('/account-settings/signup');
    await expect(page.locator('h1')).toContainText('Unlimited movies', { timeout: 15000 });

    const emailInput = page.locator('input#email');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill(testEmail);

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();

    // STEP 2: Enter password
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 15000 });
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // STEP 3: Email verification page
    await page.waitForURL('**/signup/request-email-verification', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('Email verification', { timeout: 10000 });

    const customerId = await page.evaluate(() => localStorage.getItem('customer'));
    expect(customerId).toBeTruthy();

    // STEP 4: Get verification token and verify email
    const verificationData = await getVerificationToken(customerId);
    expect(verificationData.token).toBeTruthy();

    await page.goto(`/account-settings/verify-email?token=${verificationData.token}`);
    await expect(page.locator('.success-icon')).toBeVisible({ timeout: 15000 });

    // STEP 5: Welcome page → Choose plan
    await page.waitForURL('**/signup/signup-welcome', { timeout: 20000 });
    await expect(page.locator('h1')).toContainText('Welcome', { timeout: 10000 });

    const choosePlanButton = page.locator('button.choose-plan-button');
    await expect(choosePlanButton).toBeVisible({ timeout: 15000 });
    await choosePlanButton.click();

    // STEP 6: Plan selection
    await page.waitForURL('**/signup/plan', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Choose your plan', { timeout: 10000 });

    const planCards = page.locator('.plan-card');
    await expect(planCards.first()).toBeVisible({ timeout: 15000 });

    const planCount = await planCards.count();
    expect(planCount).toBeGreaterThan(0);
    await planCards.nth(planCount - 1).click();
    await page.waitForTimeout(500);

    const nextButton = page.locator('button.next-button');
    await expect(nextButton).toBeVisible({ timeout: 5000 });
    await nextButton.click();

    // STEP 7: Payment method selection
    await page.waitForURL('**/signup/payment', { timeout: 20000 });
    await expect(page.locator('h1')).toContainText('Choose how to pay', { timeout: 10000 });

    const cardButton = page.locator('.payment-method-button');
    await expect(cardButton).toBeVisible({ timeout: 10000 });
    await cardButton.click();

    // STEP 8: Card payment form
    await page.waitForURL('**/signup/card-payment', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Set up your credit or debit card', { timeout: 10000 });

    const nameInput = page.locator('input[type="text"]');
    await nameInput.fill('Test User E2E');

    await page.waitForTimeout(2000);
    await fillStripeCardElement(page, stripeTestCards.visa);

    const termsCheckbox = page.locator('.terms-agreement input[type="checkbox"]');
    await termsCheckbox.check();
    await expect(termsCheckbox).toBeChecked();

    // STEP 9: Submit and complete subscription
    const startButton = page.locator('button#start-membership-button');
    await expect(startButton).toBeEnabled({ timeout: 5000 });
    await startButton.click();

    await Promise.race([
      page.waitForFunction(() => !window.location.pathname.includes('/card-payment'), { timeout: 60000 }),
      page.locator('.error-message').waitFor({ state: 'visible', timeout: 60000 }).catch(() => null),
    ]);

    const currentUrl = page.url();
    const hasError = await page.locator('.error-message').isVisible().catch(() => false);

    if (hasError) {
      const errorText = await page.locator('.error-message').textContent();
      throw new Error(`Payment failed: ${errorText}`);
    }

    expect(currentUrl).not.toContain('/card-payment');
  });

  test('Declined card shows error message', async ({ page }) => {
    test.setTimeout(180000);

    const testEmail = generateTestEmail();
    const testPassword = 'TestPassword123!';

    await page.goto('/account-settings/signup');
    await page.fill('input#email', testEmail);
    await page.click('button[type="submit"]');

    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 15000 });
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/signup/request-email-verification', { timeout: 30000 });

    const customerId = await page.evaluate(() => localStorage.getItem('customer'));
    const verificationData = await getVerificationToken(customerId);

    await page.goto(`/account-settings/verify-email?token=${verificationData.token}`);
    await expect(page.locator('.success-icon')).toBeVisible({ timeout: 15000 });

    await page.waitForURL('**/signup/signup-welcome', { timeout: 20000 });
    await page.locator('button.choose-plan-button').click();

    await page.waitForURL('**/signup/plan', { timeout: 15000 });
    const planCards = page.locator('.plan-card');
    await planCards.last().click();
    await page.waitForTimeout(500);
    await page.locator('button.next-button').click();

    await page.waitForURL('**/signup/payment', { timeout: 20000 });
    await page.locator('.payment-method-button').click();

    await page.waitForURL('**/signup/card-payment', { timeout: 15000 });

    await page.locator('input[type="text"]').fill('Test User Declined');
    await page.waitForTimeout(2000);
    await fillStripeCardElement(page, stripeTestCards.declined);
    await page.locator('.terms-agreement input[type="checkbox"]').check();

    await page.locator('button#start-membership-button').click();

    await expect(page.locator('.error-message')).toBeVisible({ timeout: 30000 });
    expect(page.url()).toContain('/card-payment');
  });

});
