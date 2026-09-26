import { test, expect } from '@playwright/test';
import { addToCart, demoLogin, go, openCheckout, prime, sql, uid, waitSynced } from './helpers';

test.describe('Boutik', () => {
  test('landing, legal pages and PWA manifest', async ({ page, request }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('boutique');
    await expect(page.getByTestId('consent-banner')).toBeVisible();
    await page.getByTestId('consent-accept').click();
    await expect(page.getByTestId('consent-banner')).toBeHidden();
    await expect(page.locator('#tarifs')).toContainText('5 000');
    for (const p of ['/confidentialite', '/conditions', '/credits']) {
      const r = await request.get(p);
      expect(r.status(), p).toBe(200);
    }
    const man = await (await request.get('/manifest.webmanifest')).json();
    expect(man.display).toBe('standalone');
    expect(man.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBeTruthy();
    expect((await request.get('/sw.js')).status()).toBe(200);
    expect((await request.get('/apple-touch-icon.png')).status()).toBe(200);
  });

  test('demo login, add product, mobile-money sale with receipt', async ({ page }) => {
    await demoLogin(page);
    const name = `Test E2E ${uid()}`;
    await go(page, '/app/stock/nouveau');
    await page.getByTestId('product-name').fill(name);
    await page.getByTestId('product-buy').fill('1500');
    await page.getByTestId('product-sell').fill('2000');
    await page.getByTestId('product-qty').fill('24');
    await page.getByTestId('save-product').click();
    await expect(page).not.toHaveURL(/nouveau/);

    await go(page, '/app/vendre');
    await addToCart(page, name, 3);
    await openCheckout(page);
    await expect(page.getByTestId('checkout-total')).toContainText('6 000');
    await page.getByTestId('method-mpesa').click();
    const ref = `MP${uid()}`;
    await page.getByTestId('pay-ref').fill(ref);
    await page.getByTestId('confirm-sale').click();
    await expect(page.getByTestId('sale-success')).toBeVisible();
    await expect(page.getByTestId('receipt')).toContainText(name);
    await expect(page.getByTestId('receipt')).toContainText('M-Pesa');
    const wa = await page.getByTestId('share-whatsapp').getAttribute('href');
    expect(wa).toMatch(/^https:\/\/wa\.me\/.*text=/);
    expect(decodeURIComponent(wa!)).toMatch(/6\s000/u);
    const saleId = await page.getByTestId('receipt').getAttribute('data-sale-id');

    await waitSynced(page);
    const rows = sql<{ method: string; reference: string; total: number; qty: number }>(
      `select s.method, s.reference, s.total::float as total, p.quantity::float as qty from sales s join sale_items i on i.sale_id=s.id join products p on p.id=i.product_id where s.id='${saleId}'`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ method: 'mpesa', reference: ref, total: 6000, qty: 21 });
  });

  test('credit sale then partial repayment', async ({ page }) => {
    await demoLogin(page);
    await go(page, '/app/vendre');
    await addToCart(page, 'Sucre en poudre 1 kg', 2);
    await openCheckout(page);
    await page.getByTestId('method-credit').click();
    await page.getByTestId('new-customer-inline').click();
    const cust = `Client E2E ${uid()}`;
    await page.getByTestId('new-customer-name').fill(cust);
    await page.getByTestId('new-customer-phone').fill('0812345678');
    await page.getByTestId('credit-deposit').fill('1000');
    const totalText = (await page.getByTestId('checkout-total').textContent())!;
    const total = Number(totalText.replace(/[^\d]/g, ''));
    await page.getByTestId('confirm-sale').click();
    await expect(page.getByTestId('sale-success')).toBeVisible();

    await go(page, '/app/credit');
    await page.locator(`[data-testid="customer-row"][data-name="${cust}"]`).click();
    const bal = page.getByTestId('customer-balance');
    await expect(bal).toHaveAttribute('data-value', String(total - 1000));
    const remind = await page.getByTestId('remind').getAttribute('href');
    expect(remind).toMatch(/^https:\/\/wa\.me\/243812345678\?text=/);
    expect(decodeURIComponent(remind!)).toMatch(/Bonjour|Mbote/);

    await page.getByTestId('repay').click();
    await page.getByTestId('repay-amount').fill('2000');
    await page.getByTestId('save-repayment').click();
    await expect(bal).toHaveAttribute('data-value', String(total - 3000));

    await waitSynced(page);
    const rows = sql<{ paid: number }>(
      `select coalesce(sum(cp.amount),0)::float as paid from credit_payments cp join customers c on c.id=cp.customer_id where c.name='${cust}'`,
    );
    expect(rows[0].paid).toBe(2000);
  });

  test('expense is recorded', async ({ page }) => {
    await demoLogin(page);
    await go(page, '/app/depenses');
    const before = await page.getByTestId('expense-row').count();
    await page.getByTestId('add-expense').click();
    await page.getByTestId('expcat-transport').click();
    await page.getByTestId('expense-amount').fill('3500');
    const note = `Taxi E2E ${uid()}`;
    await page.getByTestId('expense-note').fill(note);
    await page.getByTestId('save-expense').click();
    await expect(page.getByTestId('expense-row').first()).toContainText(note);
    expect(await page.getByTestId('expense-row').count()).toBeGreaterThan(before);
    await waitSynced(page);
    expect(sql(`select 1 from expenses where note='${note}' and amount=3500`)).toHaveLength(1);
  });

  test('Lingala language and dark mode', async ({ page }) => {
    await demoLogin(page);
    await page.locator('[data-testid="lang-switcher"]:visible').first().click();
    await page.getByTestId('lang-ln').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ln');
    await expect(page.getByText('Koteka').first()).toBeVisible();
    await page.locator('[data-testid="theme-toggle"]:visible').first().click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.getByText('Koteka').first()).toBeVisible({ timeout: 30_000 });
  });

  test('seller role cannot see owner pages', async ({ page }) => {
    await demoLogin(page, 'seller');
    await expect(page.locator('[data-testid="nav-depenses"]:visible')).toHaveCount(0);
    await expect(page.locator('[data-testid="nav-rapports"]:visible')).toHaveCount(0);
    await go(page, '/app/depenses');
    await expect(page.getByText('Mes ventes du jour').first()).toBeVisible();
    await expect(page.getByTestId('add-expense')).toHaveCount(0);
    await go(page, '/app/stock/nouveau');
    await expect(page.getByTestId('save-product')).toHaveCount(0);
  });

  test('offline sale is queued and syncs to Supabase when back online', async ({ page, context }, info) => {
    await demoLogin(page);
    await waitSynced(page);
    // Wait for the service worker to take control and finish precaching.
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 20_000 }).toBe(true);
    await page.waitForTimeout(3000);

    await context.setOffline(true);
    // Cold reload with no network: the shell must come from the service worker cache.
    await page.goto('/app/vendre');
    await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-testid="sync-pill"]:visible').first()).toHaveAttribute('data-state', 'offline');

    await addToCart(page, 'Coca-Cola 33 cl', 2);
    await openCheckout(page);
    await page.getByTestId('method-orange').click();
    await page.getByTestId('confirm-sale').click();
    await expect(page.getByTestId('sale-success')).toBeVisible();
    const saleId = await page.getByTestId('receipt').getAttribute('data-sale-id');
    await expect(page.locator('[data-testid="sync-pill"]:visible').first()).toHaveAttribute('data-pending', /[1-9]/);
    await page.screenshot({ path: `/workspace/boutik/qa/offline-sale-${info.project.name}.png` });
    expect(sql(`select 1 from sales where id='${saleId}'`)).toHaveLength(0);

    await context.setOffline(false);
    await waitSynced(page, 60_000);
    const rows = sql<{ method: string; n: number }>(
      `select s.method, (select count(*) from sale_items i where i.sale_id=s.id)::int as n from sales s where s.id='${saleId}'`,
    );
    expect(rows).toEqual([{ method: 'orange', n: 1 }]);
    await page.screenshot({ path: `/workspace/boutik/qa/offline-sale-synced-${info.project.name}.png` });
  });
});

test('unauthenticated /app redirects to sign-in', async ({ page }) => {
  await prime(page);
  await page.goto('/app');
  await page.waitForURL(/connexion/, { timeout: 30_000 });
});
