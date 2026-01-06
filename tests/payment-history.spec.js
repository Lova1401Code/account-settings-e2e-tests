import { test, expect } from '@playwright/test';

// Helper pour naviguer vers une page protégée (gère la redirection Email verification)
const gotoProtectedPage = async (page, url, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const securityInfoPromise = page.waitForResponse(
      response => response.url().includes('/customer/security-info') && response.status() === 200,
      { timeout: 30000 }
    ).catch(() => null);
    
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await securityInfoPromise;
    await page.waitForTimeout(1000);
    
    const h1Text = await page.locator('h1').textContent().catch(() => '');
    if (!h1Text.includes('Email verification')) {
      return;
    }
    await page.waitForTimeout(2000);
  }
};

test.describe('Payment History - Functional Tests', () => {

  // Helper pour naviguer et attendre le chargement
  const gotoPaymentHistory = async (page) => {
    await gotoProtectedPage(page, '/account-settings/payment-history');
    await expect(page.locator('h1')).toContainText('Payment history', { timeout: 15000 });
  };

  test.describe('Overview Section', () => {

    test('Overview displays total payments, total paid, and invoices count', async ({ page }) => {
      await gotoPaymentHistory(page);
      
      const overview = page.locator('#payment-overview');
      await expect(overview).toBeVisible({ timeout: 10000 });
      
      // Total payments should be displayed
      const totalPayments = page.locator('#payment-overview-total-payments');
      await expect(totalPayments).toBeVisible();
      await expect(totalPayments.locator('span')).toContainText('Total payments');
      
      // Total paid should be displayed
      const totalPaid = page.locator('#payment-overview-total-paid');
      await expect(totalPaid).toBeVisible();
      await expect(totalPaid.locator('span')).toContainText('Total paid');
      
      // Invoices count should be displayed
      const invoicesCount = page.locator('#payment-overview-total-invoices');
      await expect(invoicesCount).toBeVisible();
      await expect(invoicesCount.locator('span')).toContainText('Invoices');
    });

    test('Next payment is displayed if subscription active', async ({ page }) => {
      await gotoPaymentHistory(page);
      
      const nextPayment = page.locator('#payment-overview-next-payment');
      const hasNextPayment = await nextPayment.isVisible().catch(() => false);
      
      if (hasNextPayment) {
        await expect(nextPayment.locator('span').first()).toContainText('Next payment');
        // Should show amount and date
        await expect(nextPayment.locator('strong')).toBeVisible();
        await expect(nextPayment.locator('time')).toBeVisible();
      }
    });
  });

  test.describe('Payments Section', () => {

    test('Payments section is displayed', async ({ page }) => {
      await gotoPaymentHistory(page);
      
      const paymentsSection = page.locator('#payments-section');
      await expect(paymentsSection).toBeVisible();
      
      // Header with title
      await expect(paymentsSection.locator('h2')).toContainText('Payments');
    });

    test('Payment items show amount, date and status', async ({ page }) => {
      await gotoPaymentHistory(page);
      
      const paymentsList = page.locator('#payments-list');
      const hasPayments = await paymentsList.isVisible().catch(() => false);
      
      if (hasPayments) {
        const firstPayment = page.locator('.payment-accordion').first();
        await expect(firstPayment).toBeVisible();
        
        // Amount should be visible
        await expect(firstPayment.locator('.payment-item-amount')).toBeVisible();
        
        // Date should be visible
        await expect(firstPayment.locator('.payment-item-date')).toBeVisible();
        
        // Status should be visible
        await expect(firstPayment.locator('.payment-item-status')).toBeVisible();
      } else {
        // Empty state
        const emptyState = page.locator('#payments-empty');
        await expect(emptyState).toBeVisible();
        await expect(emptyState).toContainText('No payments recorded');
      }
    });

    test('Payment accordion expands on click', async ({ page }) => {
      await gotoPaymentHistory(page);
      
      const paymentAccordion = page.locator('.payment-accordion').first();
      const hasPayments = await paymentAccordion.isVisible().catch(() => false);
      
      if (hasPayments) {
        // Initially content should not be visible
        const content = paymentAccordion.locator('.payment-accordion-content');
        await expect(content).not.toBeVisible();
        
        // Click toggle button to expand
        await paymentAccordion.locator('.payment-accordion-toggle').click();
        
        // Content should now be visible
        await expect(content).toBeVisible({ timeout: 5000 });
        
        // Payment details should be displayed
        await expect(content.locator('.payment-details-list')).toBeVisible();
      }
    });
  });

  test.describe('Invoices Section', () => {

    test('Invoices section is displayed', async ({ page }) => {
      await gotoPaymentHistory(page);
      
      const invoicesSection = page.locator('#invoices-section');
      await expect(invoicesSection).toBeVisible();
      
      // Header with title
      await expect(invoicesSection.locator('h2')).toContainText('Invoices');
    });

    test('Invoice items show plan, amount, date and status', async ({ page }) => {
      await gotoPaymentHistory(page);
      
      const invoicesList = page.locator('#invoices-list');
      const hasInvoices = await invoicesList.isVisible().catch(() => false);
      
      if (hasInvoices) {
        const firstInvoice = page.locator('.invoice-accordion').first();
        await expect(firstInvoice).toBeVisible();
        
        // Plan name should be visible
        await expect(firstInvoice.locator('.invoice-item-plan')).toBeVisible();
        
        // Amount should be visible
        await expect(firstInvoice.locator('.invoice-item-amount')).toBeVisible();
        
        // Date should be visible
        await expect(firstInvoice.locator('.invoice-item-date')).toBeVisible();
        
        // Status should be visible
        await expect(firstInvoice.locator('.invoice-item-status')).toBeVisible();
      } else {
        // Empty state
        const emptyState = page.locator('#invoices-empty');
        await expect(emptyState).toBeVisible();
        await expect(emptyState).toContainText('No invoices generated');
      }
    });

    test('Invoice accordion expands and shows Download PDF button', async ({ page }) => {
      await gotoPaymentHistory(page);
      
      const invoiceAccordion = page.locator('.invoice-accordion').first();
      const hasInvoices = await invoiceAccordion.isVisible().catch(() => false);
      
      if (hasInvoices) {
        // Initially content should not be visible
        const content = invoiceAccordion.locator('.invoice-accordion-content');
        await expect(content).not.toBeVisible();
        
        // Click toggle button to expand
        await invoiceAccordion.locator('.invoice-accordion-toggle').click();
        
        // Content should now be visible
        await expect(content).toBeVisible({ timeout: 5000 });
        
        // Download PDF button should be visible
        const downloadBtn = content.locator('.invoice-download-btn');
        await expect(downloadBtn).toBeVisible();
        await expect(downloadBtn).toContainText('Download PDF');
      }
    });
  });

  test.describe('Navigation', () => {

    test('Navigate from Membership to Payment History', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/membership');
      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

      await page.click('text=View payment history');

      await expect(page).toHaveURL(/\/account-settings\/payment-history\/?$/);
      await expect(page.locator('h1')).toContainText('Payment history');
    });

    test('Back button navigates back', async ({ page }) => {
      await gotoProtectedPage(page, '/account-settings/membership');
      await expect(page.locator('h1')).toContainText('Membership', { timeout: 15000 });

      await gotoProtectedPage(page, '/account-settings/payment-history');
      await expect(page.locator('h1')).toContainText('Payment history', { timeout: 15000 });

      await page.click('#payment-history-back');

      await expect(page).toHaveURL(/\/account-settings\/membership\/?$/, { timeout: 15000 });
    });
  });

});

