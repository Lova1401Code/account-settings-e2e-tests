import { test, expect } from '@playwright/test';

test.describe('Subscription & Payment - Tests complets', () => {
  const profileId = 'test-profile-id';
  const customerId = 'test-customer-id';

  // Mock d'un utilisateur SOUSCRIT avec un plan actif
  const mockSubscribedCustomer = {
    id: customerId,
    firstName: 'Jean',
    lastName: 'Dupont',
    fullName: 'Jean Dupont',
    email: 'jean@example.com',
    createdAt: '2024-01-15T10:00:00Z',
    subscription: {
      status: 'active',
      currentPeriodEnd: '2025-02-15T10:00:00Z',
      trialEndsAt: null,
      planRelation: {
        id: 'plan-premium',
        name: 'Premium',
        description: '4K + HDR, Watch on 4 devices',
        price: 15.99,
        currency: 'USD',
        features: [
          { name: '4K Ultra HD', description: 'Best video quality' },
          { name: '4 Screens', description: 'Watch on 4 devices' },
        ],
      },
    },
    PaymentsMethod: [
      {
        id: 'pm-1',
        cardBrand: 'Visa',
        cardLast4: '4242',
        expMonth: 12,
        expYear: 2026,
        isDefault: true,
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 'pm-2',
        cardBrand: 'Mastercard',
        cardLast4: '5555',
        expMonth: 6,
        expYear: 2025,
        isDefault: false,
        createdAt: '2024-03-01T10:00:00Z',
      },
    ],
  };

  // Mock d'un utilisateur NON SOUSCRIT
  const mockUnsubscribedCustomer = {
    id: customerId,
    firstName: 'Marie',
    lastName: 'Martin',
    fullName: 'Marie Martin',
    email: 'marie@example.com',
    createdAt: '2024-06-01T10:00:00Z',
    subscription: null,
    PaymentsMethod: [],
  };

  // Mock des plans disponibles
  const mockPlans = [
    {
      id: 'plan-basic',
      name: 'Basic',
      price: 8.99,
      currency: 'USD',
      description: '720p, Watch on 1 device',
    },
    {
      id: 'plan-standard',
      name: 'Standard',
      price: 12.99,
      currency: 'USD',
      description: '1080p, Watch on 2 devices',
    },
    {
      id: 'plan-premium',
      name: 'Premium',
      price: 15.99,
      currency: 'USD',
      description: '4K + HDR, Watch on 4 devices',
    },
  ];

  const setupAuthMocks = async (page, customerData) => {
  // 1. Auth AVANT chargement app
    await page.addInitScript(({ profId, custId }) => {
      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      localStorage.setItem('deviceId', 'mock-device-id');
      localStorage.setItem('profileId', profId);
      localStorage.setItem('customer', JSON.stringify({ id: custId }));
    }, { profId: profileId, custId: customerId });

    // 2. MOCKS API (AVANT navigation)
    await page.route('**/customer/security-info', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          email: customerData.email,
          emailVerified: true,
        }),
      });
    });

    await page.route('**/profiles/active-profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: profileId,
          name: 'Test',
          icon: 'alphabet-A',
        }),
      });
    });

    await page.route('**/profiles/check-default-profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ hasDefaultProfile: true }),
      });
    });

    await page.route('**/customer/getById/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(customerData),
      });
    });

    await page.route('**/subscription-plan/all', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPlans),
      });
    });

    await page.route('**/subscription/next-payment', async (route) => {
      if (customerData.subscription) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            amountDue: customerData.subscription.planRelation?.price || 0,
            currency: 'USD',
            dueDate: customerData.subscription.currentPeriodEnd,
          }),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'No subscription' }),
        });
      }
    });
  };


  test.describe('Membership Page - Utilisateur SOUSCRIT', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthMocks(page, mockSubscribedCustomer);
    });

    test('Affichage des détails du plan actif', async ({ page }) => {
      await page.goto('/account-settings/membership');

      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });
      
      // Vérifier le nom du plan
      await expect(page.locator('text=Premium plan')).toBeVisible();
      
      // Vérifier la section Plan Details
      await expect(page.getByRole('heading', { name: 'Plan Details' })).toBeVisible();
    });

    test('Affichage de la méthode de paiement par défaut', async ({ page }) => {
      await page.goto('/account-settings/membership');

      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });
      
      // Vérifier que les 4 derniers chiffres de la carte sont affichés
      await expect(page.locator('text=•••• •••• •••• 4242')).toBeVisible();
    });

    test('Affichage de la date du prochain paiement', async ({ page }) => {
      await page.goto('/account-settings/membership');

      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });
      
      // Vérifier la section Payment Info
      await expect(page.getByRole('heading', { name: 'Payment Info' })).toBeVisible();
      await expect(page.locator('text=Next payment')).toBeVisible();
    });

    test('Navigation vers Manage payment method', async ({ page }) => {
      await page.goto('/account-settings/membership');

      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });
      
      // Cliquer sur Manage payment method
      await page.click('text=Manage payment method');

      await expect(page).toHaveURL(/\/account-settings\/payment-method\/?/, { timeout: 15000 });
    });

    test('Navigation vers View payment history', async ({ page }) => {
      await page.goto('/account-settings/membership');

      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });
      
      // Cliquer sur View payment history
      await page.click('text=View payment history');

      await expect(page).toHaveURL(/\/account-settings\/payment-history\/?/, { timeout: 15000 });
    });

    test('Navigation vers Change plan', async ({ page }) => {
      await page.goto('/account-settings/membership');

      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });
      
      // Cliquer sur le plan pour changer
      await page.click('text=Premium plan');

      await expect(page).toHaveURL(/\/account-settings\/change-plan\/?/, { timeout: 15000 });
    });

    test('Bouton Cancel Membership visible', async ({ page }) => {
      await page.goto('/account-settings/membership');

      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });
      
      await expect(page.locator('button.cancel-membership')).toBeVisible();
      await expect(page.locator('button.cancel-membership')).toContainText('Cancel Membership');
    });
  });

  test.describe('Membership Page - Utilisateur NON SOUSCRIT', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthMocks(page, mockUnsubscribedCustomer);
    });

    test('Affichage "No plan" quand pas d\'abonnement', async ({ page }) => {
      await page.goto('/account-settings/membership');

      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });
      
      // Vérifier qu'il affiche "No plan"
      await expect(page.locator('text=No plan')).toBeVisible();
    });

    test('Affichage "No payment method" quand pas de méthode', async ({ page }) => {
      await page.goto('/account-settings/membership');

      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });
      
      // Vérifier qu'il affiche "No payment method"
      await expect(page.locator('text=No payment method')).toBeVisible();
    });
  });

  test.describe('Payment Method Page - Utilisateur SOUSCRIT', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthMocks(page, mockSubscribedCustomer);
    });

    test('Affichage de la méthode de paiement par défaut', async ({ page }) => {
      await page.goto('/account-settings/payment-method');

      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });
      
      // Vérifier la carte par défaut
      await expect(page.locator('.default-card')).toBeVisible();
      await expect(page.locator('text=Visa')).toBeVisible();
      await expect(page.locator('text=•••• •••• •••• 4242')).toBeVisible();
      await expect(page.locator('.badge-default')).toContainText('Default');
    });

    test('Affichage des autres méthodes de paiement', async ({ page }) => {
      await page.goto('/account-settings/payment-method');

      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });
      
      // Vérifier les autres méthodes
      await expect(page.getByRole('heading', { name: 'Saved payment methods' })).toBeVisible();
      await expect(page.locator('text=Mastercard')).toBeVisible();
      await expect(page.locator('text=•••• •••• •••• 5555')).toBeVisible();
    });

    test('Bouton Add Payment Method visible', async ({ page }) => {
      await page.goto('/account-settings/payment-method');

      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });
      
      await expect(page.locator('text=Add Payment Method')).toBeVisible();
    });

    test('Bouton Set as default pour les méthodes non-default', async ({ page }) => {
      await page.goto('/account-settings/payment-method');

      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });
      
      // Vérifier le bouton Set as default
      await expect(page.locator('text=Set as default')).toBeVisible();
    });

    test('Définir une nouvelle méthode par défaut', async ({ page }) => {
      // Mock de la mise à jour
      await page.route('**/subscription/set-default-payment-method', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Default payment method updated successfully' }),
        });
      });

      await page.goto('/account-settings/payment-method');

      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });
      
      // Cliquer sur Set as default
      await page.click('text=Set as default');

      // Vérifier le message de succès
      await expect(page.locator('.notification, text=updated successfully')).toBeVisible({ timeout: 10000 });
    });

    test('Ouvrir le modal Add Payment Method', async ({ page }) => {
      await page.goto('/account-settings/payment-method');

      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });
      
      // Cliquer sur Add Payment Method
      await page.click('text=Add Payment Method');

      // Vérifier que le modal est ouvert
      await expect(page.locator('.modal, [role="dialog"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Payment Method Page - Utilisateur NON SOUSCRIT', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthMocks(page, mockUnsubscribedCustomer);
    });

    test('Affichage "No payment method saved"', async ({ page }) => {
      await page.goto('/account-settings/payment-method');

      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });
      
      // Vérifier le message "No payment method"
      await expect(page.locator('text=No payment method saved')).toBeVisible();
    });

    test('Bouton Add Payment Method toujours visible', async ({ page }) => {
      await page.goto('/account-settings/payment-method');

      await expect(page.locator('h1')).toContainText('Manage payment method', { timeout: 15000 });
      
      await expect(page.locator('text=Add Payment Method')).toBeVisible();
    });
  });

  test.describe('Change Plan Page - Utilisateur SOUSCRIT', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthMocks(page, mockSubscribedCustomer);
    });

    test('Affichage des plans disponibles', async ({ page }) => {
      await page.goto('/account-settings/change-plan');

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });
      
      // Vérifier les plans
      await expect(page.locator('text=Basic')).toBeVisible();
      await expect(page.locator('text=Standard')).toBeVisible();
      await expect(page.locator('text=Premium')).toBeVisible();
    });

    test('Plan actuel est affiché', async ({ page }) => {
      await page.goto('/account-settings/change-plan');

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });
      
      // Le plan Premium devrait être visible
      await expect(page.locator('text=Premium')).toBeVisible();
    });

    test('Sélectionner un nouveau plan', async ({ page }) => {
      await page.goto('/account-settings/change-plan');

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });
      
      // Cliquer sur un autre plan
      await page.click('text=Basic');

      // Le bouton Continue devrait être activé
      const continueButton = page.locator('button:has-text("Continue")');
      await expect(continueButton).toBeEnabled();
    });

    test('Confirmation de changement de plan', async ({ page }) => {
      // Mock du changement de plan
      await page.route('**/subscription/change-plan', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, planId: 'plan-basic' }),
        });
      });

      await page.goto('/account-settings/change-plan');

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });
      
      // Sélectionner un nouveau plan
      await page.click('text=Basic');

      // Cliquer sur Continue
      await page.click('button:has-text("Continue")');

      // Un modal de confirmation devrait apparaître
      await expect(page.locator('.modal-overlay').or(page.locator('[role="dialog"]'))).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Change Plan Page - Utilisateur NON SOUSCRIT', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthMocks(page, mockUnsubscribedCustomer);
    });

    test('Affichage des plans pour nouvel abonnement', async ({ page }) => {
      await page.goto('/account-settings/change-plan');

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });
      
      // Tous les plans sont affichés
      await expect(page.locator('text=Basic')).toBeVisible();
      await expect(page.locator('text=Standard')).toBeVisible();
      await expect(page.locator('text=Premium')).toBeVisible();
    });

    test('Sélectionner un plan pour s\'abonner', async ({ page }) => {
      await page.goto('/account-settings/change-plan');

      await expect(page.locator('h1')).toContainText('Change Plan', { timeout: 15000 });
      
      // Sélectionner un plan
      await page.click('text=Standard');

      // Le bouton Continue devrait être activé
      const continueButton = page.locator('button:has-text("Continue")');
      await expect(continueButton).toBeEnabled();
    });

  });

  test.describe('MembershipDetails Component - Page Account', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthMocks(page, mockSubscribedCustomer);
    });

    test('Affichage de la section Membership & Billing', async ({ page }) => {
      await page.goto('/account-settings');

      // Vérifier "Membership & Billing" ou "Membership"
      await expect(page.locator('text=Membership').first()).toBeVisible({ timeout: 15000 });
    });

    test('Affichage de Member since', async ({ page }) => {
      await page.goto('/account-settings');

      // Vérifier "Member since"
      await expect(page.locator('text=Member since')).toBeVisible({ timeout: 15000 });
    });

    test('Affichage du plan dans la section membership', async ({ page }) => {
      await page.goto('/account-settings');

      // Vérifier que le plan est affiché
      await expect(page.locator('text=Plan')).toBeVisible({ timeout: 15000 });
    });

    test('Affichage de la méthode de paiement dans la section', async ({ page }) => {
      await page.goto('/account-settings');

      // Vérifier "Payment method"
      await expect(page.locator('text=Payment method')).toBeVisible({ timeout: 15000 });
    });

    test('Navigation vers Manage membership', async ({ page }) => {
      await page.goto('/account-settings');

      await expect(page.locator('text=Membership').first()).toBeVisible({ timeout: 15000 });
      
      // Cliquer sur Manage membership
      const manageMembershipLink = page.locator('text=Manage membership');
      if (await manageMembershipLink.isVisible()) {
        await manageMembershipLink.click();
        await expect(page).toHaveURL(/\/account-settings\/membership\/?/, { timeout: 15000 });
      }
    });
  });
});

