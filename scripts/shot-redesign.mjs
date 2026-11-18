import { chromium, devices } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = '/opt/cursor/artifacts';
mkdirSync(out, { recursive: true });
const base = process.env.BASE_URL || 'http://127.0.0.1:3000';

async function acceptConsent(page) {
  const btn = page.getByRole('button', { name: /J'accepte|Accepter/i });
  if (await btn.count()) {
    try {
      await btn.first().click({ timeout: 1500 });
      await page.waitForTimeout(200);
    } catch {
      /* ignore */
    }
  }
}

async function shotStorefront(width, height, name) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: width <= 400 ? 2 : 1,
    locale: 'fr-FR',
    isMobile: width <= 500,
    hasTouch: width <= 500,
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem('boutik.consent', '1');
      localStorage.removeItem('boutik.sf-install-dismiss:demo');
    } catch {}
  });
  const page = await context.newPage();
  await page.goto(`${base}/b/demo`, { waitUntil: 'networkidle' });
  await page.getByTestId('storefront-name').waitFor({ timeout: 20000 });
  await acceptConsent(page);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${name}`, fullPage: false });
  await browser.close();
}

// --- Mobile storefront + cart + owner screens ---
{
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['Pixel 7'],
    locale: 'fr-FR',
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem('boutik.consent', '1');
      localStorage.removeItem('boutik.sf-install-dismiss:demo');
    } catch {}
  });
  const page = await context.newPage();

  await page.goto(`${base}/b/demo`, { waitUntil: 'networkidle' });
  await page.getByTestId('storefront-name').waitFor();
  await acceptConsent(page);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/storefront-375.png`, fullPage: false });

  await page.getByTestId('storefront-grid').locator('button', { hasText: 'Ajouter' }).first().click();
  await page.getByTestId('open-cart').waitFor();
  await page.screenshot({ path: `${out}/storefront-cart-375.png`, fullPage: false });

  await page.goto(`${base}/connexion`, { waitUntil: 'networkidle' });
  await page.getByTestId('demo-owner').click();
  await page.waitForURL(/\/app(\/|$)/, { timeout: 45000 });
  await page.waitForFunction(
    () => {
      const el = document.querySelector('[data-testid^="shop-name"]');
      return el && /Maman Nzuzi|Aliment/i.test(el.textContent || '');
    },
    null,
    { timeout: 60000 },
  );
  await page.getByTestId('today-revenue').waitFor({ timeout: 30000 });
  await page.getByTestId('reorder-card').waitFor({ timeout: 20000 });
  await page.waitForTimeout(1500);

  const reorder = page.getByTestId('reorder-card');
  await reorder.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/accueil-reorder-375.png`, fullPage: false });

  const glance = page.getByTestId('forecast-glance');
  if (await glance.count()) {
    await glance.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/accueil-forecast-375.png`, fullPage: false });
  }

  await page.evaluate(() => {
    history.pushState({}, '', '/app/boutique');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.getByTestId('sf-enabled').waitFor({ timeout: 15000 });
  await page.waitForTimeout(600);
  const qr = page.getByTestId('sf-qr');
  if (await qr.count()) {
    await qr.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: `${out}/owner-share-375.png`, fullPage: false });

  await page.evaluate(() => {
    history.pushState({}, '', '/app/rapports');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.getByTestId('rep-revenue').waitFor({ timeout: 15000 });
  await page.waitForTimeout(1500);
  const panel = page.getByTestId('forecast-panel');
  if (await panel.count()) {
    await panel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: `${out}/rapports-forecast-375.png`, fullPage: false });

  await browser.close();
}

// --- Install prompt (iOS UA → banner + sheet) ---
{
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    locale: 'fr-FR',
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem('boutik.consent', '1');
      localStorage.removeItem('boutik.sf-install-dismiss:demo');
    } catch {}
  });
  const page = await context.newPage();
  await page.goto(`${base}/b/demo`, { waitUntil: 'networkidle' });
  await page.getByTestId('storefront-name').waitFor();
  await acceptConsent(page);
  await page.getByTestId('sf-install').waitFor({ timeout: 10000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/storefront-install-prompt.png`, fullPage: false });
  await page.getByTestId('sf-install').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/storefront-install-sheet.png`, fullPage: false });
  await browser.close();
}

await shotStorefront(768, 1024, 'storefront-768.png');
await shotStorefront(1440, 900, 'storefront-1440.png');

console.log('redesign screenshots done');
