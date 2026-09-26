import { expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';

export const OWNER = { email: 'demo@boutik.cd', password: 'demo1234' };
export const SELLER = { email: 'vendeur@boutik.cd', password: 'demo1234' };

/** Accept the local-storage notice up-front so it never covers controls. */
export async function prime(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('boutik.consent', '1');
    } catch {}
  });
}

export async function demoLogin(page: Page, who: 'owner' | 'seller' = 'owner') {
  await prime(page);
  await page.goto('/connexion');
  await page.getByTestId(who === 'owner' ? 'demo-owner' : 'demo-seller').click();
  await page.waitForURL(/\/app(\/|$)/, { timeout: 30_000 });
  // First sync pulls the demo shop into IndexedDB.
  await expect(page.locator('[data-testid^="shop-name"]:visible').first()).toContainText('Maman Nzuzi', { timeout: 45_000 });
}

export async function waitSynced(page: Page, timeout = 60_000) {
  await expect
    .poll(async () => page.locator('[data-testid="sync-pill"]:visible').first().getAttribute('data-state'), { timeout })
    .toBe('online');
  await expect
    .poll(async () => page.locator('[data-testid="sync-pill"]:visible').first().getAttribute('data-pending'), { timeout })
    .toBe('0');
}

export async function addToCart(page: Page, name: string, times = 1) {
  await page.getByTestId('pos-search').fill(name);
  const card = page.locator(`[data-testid="product-card"][data-name="${name}"]`);
  for (let i = 0; i < times; i++) await card.click();
  await page.getByTestId('pos-search').fill('');
}

export async function openCheckout(page: Page) {
  const panel = page.getByTestId('checkout-panel');
  if (await panel.isVisible()) await panel.click();
  else await page.getByTestId('checkout').click();
  await expect(page.getByTestId('confirm-sale')).toBeVisible();
}

export async function go(page: Page, path: string) {
  // In-app navigation (keeps the SPA state, works offline).
  await page.evaluate((p) => {
    history.pushState({}, '', p);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}

/** Run SQL against Supabase via the Management API helper (needs SUPABASE_ACCESS_TOKEN). */
export function sql<T = Record<string, unknown>>(query: string): T[] {
  const out = execFileSync('/workspace/boutik/tools/sql.sh', ['-c', query], { encoding: 'utf8' });
  return JSON.parse(out) as T[];
}

export const uid = () => Math.random().toString(36).slice(2, 7).toUpperCase();
