import { test, expect } from '@playwright/test';

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

const setupSignupAuthMocks = async (page, testEmail) => {
  const mockCustomerId = `mock-customer-${Date.now()}`;
  const mockAccessToken = 'mock-access-token-for-signup';
  const mockRefreshToken = 'mock-refresh-token-for-signup';

  await page.route('**/auth/check-email', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ exists: false, hasPlan: false, hasSubscription: false }),
    });
  });

  await page.route('**/auth/step1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToke: { accessToken: mockAccessToken, refreshToken: mockRefreshToken },
        customerId: mockCustomerId,
      }),
    });
  });

  await page.route('**/auth/step2', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/auth/step3', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, subscriptionId: 'mock-subscription-id' }),
    });
  });

  await page.route('**/mailer/verify-email**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/customer/security-info', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ email: testEmail, emailVerified: true }),
    });
  });

  await page.route('**/profiles/active-profile', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ 
        status: 404, 
        contentType: 'application/json', 
        body: JSON.stringify({ message: 'No active profile' }) 
      });
    } else {
      await route.continue();
    }
  });

  return { mockCustomerId, mockAccessToken };
};

const goThroughSignupToPlan = async (page, testEmail, testPassword) => {
  await setupSignupAuthMocks(page, testEmail);

  await page.goto('/account-settings/signup');
  await expect(page.locator('h1')).toContainText('Unlimited movies', { timeout: 15000 });

  const emailInput = page.locator('input#email');
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await emailInput.fill(testEmail);

  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeEnabled({ timeout: 5000 });
  await submitButton.click();

  await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 15000 });
  await page.fill('input[type="password"]', testPassword);
  await page.click('button[type="submit"]');

  await page.waitForURL('**/signup/request-email-verification', { timeout: 20000 });
  await expect(page.locator('h1')).toContainText('Email verification', { timeout: 10000 });

  await page.goto('/account-settings/verify-email?token=mock-verification-token');
  await expect(page.locator('.success-icon')).toBeVisible({ timeout: 15000 });
  await page.waitForURL('**/signup/signup-welcome', { timeout: 20000 });

  await expect(page.locator('h1')).toContainText('Welcome', { timeout: 10000 });
  const choosePlanButton = page.locator('button.choose-plan-button');
  await expect(choosePlanButton).toBeVisible({ timeout: 15000 });
  await choosePlanButton.click();

  await page.waitForURL('**/signup/plan', { timeout: 15000 });
  await expect(page.locator('h1')).toContainText('Choose your plan', { timeout: 10000 });
};

const goThroughSignupToPayment = async (page, testEmail, testPassword) => {
  await goThroughSignupToPlan(page, testEmail, testPassword);

  const planCards = page.locator('.plan-card');
  await expect(planCards.first()).toBeVisible({ timeout: 15000 });

  const planCount = await planCards.count();
  expect(planCount).toBeGreaterThan(0);
  await planCards.nth(planCount - 1).click();
  await page.waitForTimeout(500);

  const nextButton = page.locator('button.next-button');
  await expect(nextButton).toBeVisible({ timeout: 5000 });
  await nextButton.click();

  await page.waitForURL('**/signup/payment', { timeout: 20000 });
  await expect(page.locator('h1')).toContainText('Choose how to pay', { timeout: 10000 });
};

const goThroughSignupToCardPayment = async (page, testEmail, testPassword) => {
  await goThroughSignupToPayment(page, testEmail, testPassword);

  const cardButton = page.locator('.payment-method-button');
  await expect(cardButton).toBeVisible({ timeout: 10000 });
  await cardButton.click();

  await page.waitForURL('**/signup/card-payment', { timeout: 15000 });
  await expect(page.locator('h1')).toContainText('Set up your credit or debit card', { timeout: 10000 });
};


test.describe('Signup - Functional Tests', () => {

  test('Form validation - submit disabled with empty email', async ({ page }) => {
    await page.goto('/account-settings/signup');
    await expect(page.locator('h1')).toContainText('Unlimited movies', { timeout: 15000 });
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('Form validation - submit disabled with invalid email', async ({ page }) => {
    await page.goto('/account-settings/signup');
    await expect(page.locator('h1')).toContainText('Unlimited movies', { timeout: 15000 });
    await page.fill('input#email', 'invalidemail');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('Form validation - submit enabled with valid email', async ({ page }) => {
    await page.goto('/account-settings/signup');
    await expect(page.locator('h1')).toContainText('Unlimited movies', { timeout: 15000 });
    await page.fill('input#email', 'test@example.com');
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('Valid email proceeds to password step', async ({ page }) => {
    const testEmail = generateTestEmail();

    await page.route('**/auth/check-email', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ exists: false, hasPlan: false, hasSubscription: false }),
      });
    });

    await page.goto('/account-settings/signup');
    await expect(page.locator('h1')).toContainText('Unlimited movies', { timeout: 15000 });
    await page.fill('input#email', testEmail);
    await page.click('button[type="submit"]');
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 15000 });
  });

  test('Complete signup flow with mocks - email to welcome', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'Test1234!';

    await page.route('**/auth/check-email', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ exists: false, hasPlan: false, hasSubscription: false }),
      });
    });

    await page.route('**/auth/step1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToke: { accessToken: 'mock-token', refreshToken: 'mock-refresh' },
          customerId: 'mock-customer-id',
        }),
      });
    });

    await page.route('**/customer/security-info', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ email: testEmail, emailVerified: true }),
      });
    });

    await page.route('**/customer/send-verification-email', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    await page.route('**/profiles/active-profile', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'No active profile' }) });
      } else {
        await route.continue();
      }
    });

    await page.route('**/mailer/verify-email**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    await page.goto('/account-settings/signup');
    await page.fill('#email', testEmail);
    await page.click('button[type="submit"]');

    await expect(page.locator('input[type="password"]')).toBeVisible();
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    await page.waitForURL('/account-settings/signup/request-email-verification');
    await expect(page.locator('h1')).toContainText('Email verification');

    await page.goto('/account-settings/verify-email?token=mock-token');
    await expect(page.locator('.success-icon')).toBeVisible({ timeout: 15000 });

    await page.waitForURL('/account-settings/signup/signup-welcome', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Welcome to AllMovies!');
  });

  test('Plan selection page displays real plans from API', async ({ page }) => {
    test.setTimeout(120000);
    const testEmail = generateTestEmail();
    const testPassword = 'TestPassword123!';

    await goThroughSignupToPlan(page, testEmail, testPassword);

    const planCards = page.locator('.plan-card');
    await expect(planCards.first()).toBeVisible({ timeout: 15000 });

    const count = await planCards.count();
    expect(count).toBeGreaterThan(0);

    const firstPlan = planCards.first();
    await expect(firstPlan.locator('.plan-name')).toBeVisible();
    await expect(firstPlan.locator('.plan-price')).toBeVisible();
  });

  test('Payment method page shows card option', async ({ page }) => {
    test.setTimeout(120000);
    const testEmail = generateTestEmail();
    const testPassword = 'TestPassword123!';

    await goThroughSignupToPayment(page, testEmail, testPassword);

    const cardButton = page.locator('.payment-method-button');
    await expect(cardButton).toBeVisible({ timeout: 10000 });
    await expect(cardButton).toContainText('Credit or Debit Card');
  });

  test('Card payment - terms must be accepted before submit', async ({ page }) => {
    test.setTimeout(120000);
    const testEmail = generateTestEmail();
    const testPassword = 'TestPassword123!';

    await goThroughSignupToCardPayment(page, testEmail, testPassword);

    const submitButton = page.locator('button#start-membership-button');
    await expect(submitButton).toBeDisabled();

    const termsCheckbox = page.locator('.terms-agreement input[type="checkbox"]');
    await termsCheckbox.check();
    await expect(termsCheckbox).toBeChecked();
  });

});


test.describe.serial('Signup - Complete E2E Flow', () => {

  test.setTimeout(180000);

  test('Complete signup flow with Stripe test card', async ({ page }) => {
    const testEmail = generateTestEmail();
    const testPassword = 'TestPassword123!';
    const card = stripeTestCards.visa;

    await goThroughSignupToCardPayment(page, testEmail, testPassword);

    const nameInput = page.locator('input[type="text"]');
    await nameInput.fill('Test User E2E');

    await page.waitForTimeout(2000);
    await fillStripeCardElement(page, card);

    const termsCheckbox = page.locator('.terms-agreement input[type="checkbox"]');
    await termsCheckbox.check();
    await expect(termsCheckbox).toBeChecked();

    const submitButton = page.locator('button#start-membership-button');
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();

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
    const testEmail = generateTestEmail();
    const testPassword = 'TestPassword123!';
    const card = stripeTestCards.declined;

    await goThroughSignupToCardPayment(page, testEmail, testPassword);

    await page.locator('input[type="text"]').fill('Test User Declined');
    await page.waitForTimeout(2000);
    await fillStripeCardElement(page, card);
    await page.locator('.terms-agreement input[type="checkbox"]').check();

    // Override step3 mock AFTER flow setup, BEFORE submit
    await page.unroute('**/auth/step3');
    await page.route('**/auth/step3', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Your card was declined.' }),
      });
    });

    await page.locator('button#start-membership-button').click();

    await expect(page.locator('.error-message')).toBeVisible({ timeout: 30000 });
    expect(page.url()).toContain('/card-payment');
  });

  test('Card payment - Empty name prevents submission', async ({ page }) => {
    const testEmail = generateTestEmail();
    const testPassword = 'TestPassword123!';

    await goThroughSignupToCardPayment(page, testEmail, testPassword);

    await page.waitForTimeout(2000);
    await fillStripeCardElement(page, stripeTestCards.visa);

    await page.locator('.terms-agreement input[type="checkbox"]').check();
    await page.locator('button#start-membership-button').click();

    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/card-payment');
  });

});
