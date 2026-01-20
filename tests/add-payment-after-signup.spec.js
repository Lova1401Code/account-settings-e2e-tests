import { test, expect } from '@playwright/test';
import { getVerificationToken, cleanupTestUser } from './api-config.js';

const stripeTestCards = {
  visa: {
    number: '4242424242424242',
    expMonth: '12',
    expYear: '30',
    cvc: '123',
    zip: '12345',
  },
};

const generateTestEmail = () => `test-e2e-${Date.now()}@testmail.com`;

let currentTestEmail = null;

const fillStripeCardElement = async (page, card) => {
  await page.waitForSelector('.stripe-card-element iframe', { timeout: 15000 });
  const stripeFrame = page.frameLocator('.stripe-card-element iframe').first();
  await page.waitForTimeout(1000);

  const cardInput = stripeFrame.locator('input[name="cardnumber"]');
  const isCardNumberVisible = await cardInput.isVisible().catch(() => false);

  if (isCardNumberVisible) {
    await cardInput.click();
    await page.waitForTimeout(300);
    for (const digit of card.number) {
      await cardInput.press(digit);
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(500);

    const expiryInput = stripeFrame.locator('input[name="exp-date"]');
    await expiryInput.click();
    await page.waitForTimeout(300);
    const expiry = card.expMonth + card.expYear;
    for (const digit of expiry) {
      await expiryInput.press(digit);
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(500);

    const cvcInput = stripeFrame.locator('input[name="cvc"]');
    await cvcInput.click();
    await page.waitForTimeout(300);
    for (const digit of card.cvc) {
      await cvcInput.press(digit);
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(500);

    const postalInput = stripeFrame.locator('input[name="postal"]');
    const hasPostal = await postalInput.isVisible().catch(() => false);
    if (hasPostal) {
      await postalInput.click();
      await page.waitForTimeout(300);
      for (const digit of card.zip) {
        await postalInput.press(digit);
        await page.waitForTimeout(30);
      }
    }
  } else {
    const combinedInput = stripeFrame.locator('input').first();
    await combinedInput.waitFor({ state: 'visible', timeout: 10000 });
    await combinedInput.click();
    await page.waitForTimeout(300);

    const fullCardData = card.number + card.expMonth + card.expYear + card.cvc + card.zip;
    for (const char of fullCardData) {
      await combinedInput.press(char);
      await page.waitForTimeout(50);
    }
  }
  await page.waitForTimeout(500);
};

test.describe('Add Payment Method after Signup', () => {

  test.afterEach(async () => {
    if (currentTestEmail) {
      await cleanupTestUser(currentTestEmail);
      currentTestEmail = null;
    }
  });

  test('Signup then add payment method in account-settings', async ({ page }) => {
    test.setTimeout(180000);
    
    const testEmail = generateTestEmail();
    currentTestEmail = testEmail;
    const testPassword = 'TestPassword123!';

    await page.goto('/account-settings/signup');
    await expect(page.locator('h1')).toContainText('Unlimited movies', { timeout: 15000 });

    await page.fill('input#email', testEmail);
    await page.click('button[type="submit"]');

    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 15000 });
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/signup/request-email-verification', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('Email verification', { timeout: 10000 });

    const customerId = await page.evaluate(() => localStorage.getItem('customer'));
    expect(customerId).toBeTruthy();

    const verificationData = await getVerificationToken(customerId);
    expect(verificationData.token).toBeTruthy();

    await page.goto(`/account-settings/verify-email?token=${verificationData.token}`);
    await expect(page.locator('.success-icon')).toBeVisible({ timeout: 15000 });

    await page.waitForURL('**/signup/signup-welcome', { timeout: 20000 });
    await expect(page.locator('h1')).toContainText('Welcome', { timeout: 10000 });

    await page.locator('button.choose-plan-button').click();

    await page.waitForURL('**/signup/plan', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Choose your plan', { timeout: 10000 });

    const planCards = page.locator('.plan-card');
    await expect(planCards.first()).toBeVisible({ timeout: 15000 });
    await planCards.last().click();
    await page.waitForTimeout(500);

    await page.locator('button.next-button').click();

    await page.waitForURL('**/signup/payment', { timeout: 20000 });

    await page.goto('/account-settings/payment-method');
    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    await page.click('.add-payment-section button');

    const modal = page.locator('.add-payment-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });

    const nameInput = modal.locator('input[type="text"]');
    await nameInput.fill('Test User E2E');

    await page.waitForTimeout(2000);
    await fillStripeCardElement(page, stripeTestCards.visa);

    const submitButton = modal.locator('button.submit-button, button:has-text("Add Payment Method")');
    await expect(submitButton).toBeEnabled({ timeout: 10000 });
    await submitButton.click();

    await page.waitForTimeout(10000);

    const modalClosed = await modal.isHidden().catch(() => true);
    
    if (modalClosed) {
      const hasDefaultCard = await page.locator('.default-card').isVisible().catch(() => false);
      const hasPaymentCard = await page.locator('.payment-method-card').isVisible().catch(() => false);
      const hasEmptyCard = await page.locator('.empty-method-card').isVisible().catch(() => false);
      
      expect(hasDefaultCard || hasPaymentCard || !hasEmptyCard).toBeTruthy();
    } else {
      const errorMessage = await modal.locator('.error-message').textContent().catch(() => null);
      if (errorMessage) {
        console.log('Payment error:', errorMessage);
      }
      expect(modalClosed).toBeTruthy();
    }
  });

});
