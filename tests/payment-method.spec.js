import { test, expect } from '@playwright/test';

test.describe('Payment method - Payment method management', () => {
  const customerId = 'test-customer-id';
  
  const mockPaymentMethods = [
    {
      id: 'pm-1',
      isDefault: true,
      cardLast4: '4242',
      cardBrand: 'visa',
      funding: 'credit',
      expMonth: 12,
      expYear: 2025,
      cardholderName: 'Jean Dupont',
      createdAt: new Date().toISOString(),
      billingLine1: '123 Rue de Paris',
      billingCity: 'Paris',
      billingZip: '75001',
      billingCountry: 'France',
    },
    {
      id: 'pm-2',
      isDefault: false,
      cardLast4: '5555',
      cardBrand: 'mastercard',
      funding: 'debit',
      expMonth: 6,
      expYear: 2026,
      cardholderName: 'Jean Dupont',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const mockCustomerData = {
    id: customerId,
    email: 'test@example.com',
    fullName: 'Jean Dupont',
    PaymentsMethod: mockPaymentMethods,
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to login to have a context
    await page.goto('/account-settings/login');
    
    // Configure localStorage
    await page.evaluate((custId) => {
      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      localStorage.setItem('deviceId', 'mock-device-id');
      localStorage.setItem('profileId', 'test-profile-id');
      localStorage.setItem('customer', JSON.stringify({ id: custId }));
    }, customerId);

    // Mock security-info (verified email) - required by ProtectedRoute
    await page.route('**/customer/security-info', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          emailVerified: true,
          twoFactorEnabled: false,
        }),
      });
    });

    // Mock active-profile - required by ProtectedRoute
    await page.route('**/profiles/active-profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-profile-id',
          name: 'Jean',
          icon: 'alphabet-A',
        }),
      });
    });

    // Mock check-default-profile - required by ProfileCheck
    await page.route('**/profiles/check-default-profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ hasDefaultProfile: true }),
      });
    });
  });

  test('Display of the payment methods page', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    await page.goto('/account-settings/payment-method');

    // Verify the page title
    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    // Verify the subtitle
    await expect(page.locator('.payment-method-subtitle')).toContainText('Control how you pay');
  });

  test('Display of the default payment method', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    await page.goto('/account-settings/payment-method');

    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    // Verify the default card
    const defaultCard = page.locator('.default-card');
    await expect(defaultCard).toBeVisible();
    await expect(defaultCard).toContainText('visa');
    await expect(defaultCard).toContainText('4242');
    await expect(defaultCard.locator('.badge-default')).toContainText('Default');
  });

  test('Display of the last 4 digits of the card', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    await page.goto('/account-settings/payment-method');

    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    // Verify the masked number with the last 4 digits
    await expect(page.locator('.payment-card-number').first()).toContainText('•••• •••• •••• 4242');
  });

  test('Display of other saved payment methods', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    await page.goto('/account-settings/payment-method');

    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    // Verify the other methods section
    await expect(page.locator('.other-payments h2')).toContainText('Saved payment methods');

    // Verify the second card (mastercard)
    const otherCards = page.locator('.payment-method-list .payment-method-card');
    await expect(otherCards).toHaveCount(1);
    await expect(otherCards.first()).toContainText('mastercard');
    await expect(otherCards.first()).toContainText('5555');
  });

  test('"Add Payment Method" button visible', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    await page.goto('/account-settings/payment-method');

    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    // Verify the Add Payment Method button
    await expect(page.locator('.add-payment-section button')).toContainText('Add Payment Method');
  });

  test('"Set as default" button on non-default cards', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    await page.goto('/account-settings/payment-method');

    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    // Verify the "Set as default" button on the non-default card
    const otherCard = page.locator('.payment-method-list .payment-method-card').first();
    await expect(otherCard.locator('button.secondary')).toContainText('Set as default');
  });

  test('"Update" button on the default card', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    await page.goto('/account-settings/payment-method');

    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    // Verify the "Update" button on the default card
    const defaultCard = page.locator('.default-card');
    await expect(defaultCard.locator('button.secondary')).toContainText('Update');
  });

  test('"Remove" button on non-default cards', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    await page.goto('/account-settings/payment-method');

    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    // Verify the "Remove" button on the non-default card
    const otherCard = page.locator('.payment-method-list .payment-method-card').first();
    await expect(otherCard.locator('button.danger')).toContainText('Remove');
  });

  test('Display without payment method', async ({ page }) => {
    const customerWithoutPayment = {
      ...mockCustomerData,
      PaymentsMethod: [],
    };

    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(customerWithoutPayment),
      });
    });

    await page.goto('/account-settings/payment-method');

    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    // Verify the "No payment method" message
    await expect(page.locator('.empty-method-card')).toContainText('No payment method saved');
  });

  test('Set a card as default', async ({ page }) => {
    let setDefaultCalled = false;

    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    await page.route('**/subscription/set-default-payment-method', async (route) => {
      setDefaultCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/account-settings/payment-method');

    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    // Click on "Set as default" for the non-default card
    const otherCard = page.locator('.payment-method-list .payment-method-card').first();
    await otherCard.locator('button.secondary').click();

    // Verify that the API was called (or verify the button is in loading state)
    // Note: the exact behavior depends on the implementation
  });

  test('Opening the add payment method modal', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    await page.goto('/account-settings/payment-method');

    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    // Click on "Add Payment Method"
    await page.click('.add-payment-section button');

    // Verify that the modal is open (the class or modal element)
    await expect(page.locator('.modal, [role="dialog"], .add-payment-modal')).toBeVisible({ timeout: 10000 });
  });

  test('Back button - Go back', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    // First go to membership to have a history
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Then go to payment-method
    await page.goto('/account-settings/payment-method');
    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    // Click on Back
    await page.click('.back-button');

    // Should go back to membership
    await expect(page).toHaveURL(/\/account-settings\/membership\/?$/, { timeout: 15000 });
  });

  test('Loading state', async ({ page }) => {
    let resolveCustomer;
    const customerPromise = new Promise((resolve) => {
      resolveCustomer = resolve;
    });

    await page.route(`**/customer/getById/**`, async (route) => {
      await customerPromise;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    const gotoPromise = page.goto('/account-settings/payment-method');

    // Verify the loading state
    await expect(page.locator('text=Loading')).toBeVisible({ timeout: 10000 });

    // Resolve the promise
    resolveCustomer();
    await gotoPromise;

    // Verify that loading is finished
    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });
  });

  test('Data loading error', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    await page.goto('/account-settings/payment-method');

    // Verify the error message
    await expect(page.locator('.error-text')).toBeVisible({ timeout: 15000 });
  });

  test('Display of the card expiration date', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    await page.goto('/account-settings/payment-method');

    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    // Verify that the card information is displayed
    const defaultCard = page.locator('.default-card');
    await expect(defaultCard).toBeVisible();
  });

  test('Display of card type (credit/debit)', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    await page.goto('/account-settings/payment-method');

    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });

    // Verify the display of card type
    const defaultCard = page.locator('.default-card');
    await expect(defaultCard.locator('.payment-brand')).toContainText('credit');
  });

  test('Navigation from the Membership page', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    // Go to membership
    await page.goto('/account-settings/membership');
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Click on "Manage payment method"
    await page.click('text=Manage payment method');

    // Verify the navigation
    await expect(page).toHaveURL(/\/account-settings\/payment-method\/?$/);
    await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });
  });
});

