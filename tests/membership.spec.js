import { test, expect } from '@playwright/test';

test.describe('Membership/Subscription - View subscription details', () => {
  const customerId = 'test-customer-id';
  
  const mockCustomerData = {
    id: customerId,
    email: 'test@example.com',
    subscription: {
      id: 'sub-123',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // In 30 days
      trialEndsAt: null,
      planRelation: {
        id: 'plan-premium',
        name: 'Premium',
        description: '4K + HDR, 4 screens, Downloads',
        features: [
          { name: '4K Resolution', description: '4K + HDR' },
          { name: 'Screens', description: '4 screens' },
        ],
      },
    },
    PaymentsMethod: [
      {
        id: 'pm-1',
        isDefault: true,
        cardLast4: '4242',
        cardBrand: 'visa',
      },
    ],
  };

  const mockNextPayment = {
    amountDue: 1599,
    total: 1599,
    currency: 'USD',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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

  test('Display of the Membership page with plan details', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    await page.goto('/account-settings/membership');

    // Verify the page title
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Verify the sections
    await expect(page.locator('h2').first()).toContainText('Plan Details');
    await expect(page.locator('h2').nth(1)).toContainText('Payment Info');

    // Verify that the plan is displayed
    await expect(page.locator('.plan-card')).toContainText('Premium plan');
  });

  test('Display of plan name and description', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    await page.goto('/account-settings/membership');

    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Verify the Premium plan
    await expect(page.locator('.plan-card')).toContainText('Premium plan');
    await expect(page.locator('.plan-card')).toContainText('4K + HDR');
  });

  test('Display of the next payment date', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    await page.goto('/account-settings/membership');

    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Verify that the Payment Info section contains "Next payment"
    await expect(page.locator('.payment-info')).toContainText('Next payment');
  });

  test('Display of the payment method', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    await page.goto('/account-settings/membership');

    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Verify the display of the card (last 4 digits)
    await expect(page.locator('.payment-actions')).toContainText('4242');
    await expect(page.locator('.payment-actions')).toContainText('Manage payment method');
  });

  test('Link to View payment history', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    await page.goto('/account-settings/membership');

    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Verify the View payment history link
    await expect(page.locator('.payment-actions')).toContainText('View payment history');
  });

  test('Cancel Membership button visible', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    await page.goto('/account-settings/membership');

    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Verify the Cancel Membership button
    await expect(page.locator('.cancel-membership')).toContainText('Cancel Membership');
  });

  test('Navigation to the Change Plan page', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    await page.goto('/account-settings/membership');

    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Click on the plan
    await page.click('.plan-card .link-card');

    // Verify the navigation
    await expect(page).toHaveURL(/\/account-settings\/change-plan\/?$/, { timeout: 15000 });
  });

  test('Display without active plan (No plan)', async ({ page }) => {
    const customerWithoutPlan = {
      ...mockCustomerData,
      subscription: null,
    };

    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(customerWithoutPlan),
      });
    });

    await page.goto('/account-settings/membership');

    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Verify the "No plan" display
    await expect(page.locator('.plan-card')).toContainText('No plan');
    await expect(page.locator('.plan-card')).toContainText('No active subscription');
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

    await page.goto('/account-settings/membership');

    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Verify the "No payment method" display
    await expect(page.locator('.payment-actions')).toContainText('No payment method');
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

    const gotoPromise = page.goto('/account-settings/membership');

    // Verify the loading state
    await expect(page.locator('text=Loading')).toBeVisible({ timeout: 10000 });

    // Resolve the promise
    resolveCustomer();
    await gotoPromise;

    // Verify that loading is finished
    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });
  });

  test('Data loading error', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    await page.goto('/account-settings/membership');

    // Verify the error message
    await expect(page.locator('text=Error')).toBeVisible({ timeout: 15000 });
  });

  test('Display with trial period', async ({ page }) => {
    const customerWithTrial = {
      ...mockCustomerData,
      subscription: {
        ...mockCustomerData.subscription,
        currentPeriodEnd: null,
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // In 7 days
      },
    };

    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(customerWithTrial),
      });
    });

    await page.goto('/account-settings/membership');

    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // The next payment date should be based on trialEndsAt
    await expect(page.locator('.payment-info')).toContainText('Next payment');
  });

  test('Navigation to Manage payment method', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    await page.goto('/account-settings/membership');

    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Click on Manage payment method
    await page.click('text=Manage payment method');

    // Vérifier la navigation
    await expect(page).toHaveURL(/\/account-settings\/payment-method\/?$/, { timeout: 15000 });
  });

  test('Navigation to View payment history', async ({ page }) => {
    await page.route(`**/customer/getById/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCustomerData),
      });
    });

    // Mock for the payment history page
    await page.route('**/subscription/payment-history**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ payments: [], totalPages: 1 }),
      });
    });

    await page.goto('/account-settings/membership');

    await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

    // Cliquer sur View payment history
    await page.click('text=View payment history');

    // Vérifier la navigation
    await expect(page).toHaveURL(/\/account-settings\/payment-history\/?$/, { timeout: 15000 });
  });
});

