// Device QA: screenshots of every main page on each device, link crawl, console errors, overflow.
// usage: BASE_URL=https://boutik.vercel.app node e2e/device-qa.mjs [deviceFilter]
import { chromium, devices } from '@playwright/test';
import fs from 'node:fs';

const BASE = process.env.BASE_URL || 'https://boutik.vercel.app';
const OUT = process.env.QA_OUT || '/workspace/boutik/qa';
fs.mkdirSync(OUT, { recursive: true });
const strip = ({ defaultBrowserType, ...d }) => d;
const DEVICES = {
  'iphone-se': strip(devices['iPhone SE']),
  'iphone-14': strip(devices['iPhone 14']),
  'iphone-15-pro-max': strip(devices['iPhone 15 Pro Max']),
  'pixel-5': strip(devices['Pixel 5']),
  'pixel-7': strip(devices['Pixel 7']),
  'android-360': { ...strip(devices['Galaxy S9+']), viewport: { width: 360, height: 780 }, screen: { width: 360, height: 780 }, deviceScaleFactor: 3 },
  'ipad-pro': strip(devices['iPad Pro 11']),
  'desktop-1440': { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
};
const only = process.argv[2];
const results = [];
const problems = [];

async function check(page, dev, name, errs) {
  const m = await page.evaluate(() => {
    const de = document.documentElement;
    const wide = [...document.querySelectorAll('body *')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' || r.width === 0) return false;
        // ignore content inside horizontal scrollers
        let p = el.parentElement;
        while (p && p !== document.body) {
          const o = getComputedStyle(p).overflowX;
          if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') return false;
          p = p.parentElement;
        }
        return r.right > de.clientWidth + 1;
      })
      .slice(0, 3)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`);
    return { overflow: de.scrollWidth > de.clientWidth + 1, sw: de.scrollWidth, cw: de.clientWidth, wide };
  });
  const r = { dev, page: name, overflow: m.overflow, errors: [...errs] };
  if (m.overflow) problems.push(`${dev} ${name}: horizontal overflow ${m.sw}>${m.cw} ${m.wide.join(', ')}`);
  for (const e of errs) problems.push(`${dev} ${name}: console ${e}`);
  errs.length = 0;
  results.push(r);
}

async function shot(page, dev, name, errs, opts = {}) {
  await page.waitForTimeout(opts.wait ?? 900);
  await page.screenshot({ path: `${OUT}/${dev}__${name}.png`, fullPage: false });
  await check(page, dev, name, errs);
}

/** Wait until the first sync finished (pill back to "online" and stable). */
async function waitIdle(page) {
  let stable = 0;
  for (let i = 0; i < 60 && stable < 3; i++) {
    const st = await page.locator('[data-testid="sync-pill"]:visible').first().getAttribute('data-state').catch(() => null);
    stable = st === 'online' ? stable + 1 : 0;
    await page.waitForTimeout(500);
  }
}

async function appGo(page, path) {
  await page.evaluate((p) => {
    history.pushState({}, '', p);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo(0, 0);
  }, path);
  await page.waitForTimeout(700);
}

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const links = new Set();
async function runDevice(dev, desc) {
  const ctx = await browser.newContext({ ...desc, locale: 'fr-FR', timezoneId: 'Africa/Kinshasa' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message.slice(0, 200)));
  page.on('response', (r) => {
    if (r.url().startsWith(BASE) && r.status() >= 400) errs.push(`HTTP ${r.status()} ${r.url()}`);
  });

  // ---- public pages
  await page.goto(BASE + '/');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${dev}__landing-consent.png` });
  await page.getByTestId('consent-accept').click();
  await shot(page, dev, 'landing', errs);
  for (const id of ['fonctionnalites', 'tarifs', 'faq']) {
    const el = page.locator(`#${id}`);
    if (await el.count()) {
      await el.scrollIntoViewIfNeeded();
      await page.evaluate((i) => document.getElementById(i)?.scrollIntoView({ block: 'start' }), id);
      await shot(page, dev, `landing-${id}`, errs, { wait: 1300 });
    }
  }
  for (const h of await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')))) links.add(h);
  for (const p of ['connexion', 'confidentialite', 'conditions', 'credits']) {
    await page.goto(`${BASE}/${p}`);
    for (const h of await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')))) links.add(h);
    await shot(page, dev, p, errs);
  }
  await page.goto(`${BASE}/cette-page-nexiste-pas`);
  errs.length = 0; // the 404 itself is expected
  await shot(page, dev, '404', errs);

  // ---- app (owner)
  await page.goto(`${BASE}/connexion`);
  await page.getByTestId('demo-owner').click();
  await page.waitForURL(/\/app/);
  await page.locator('[data-testid^="shop-name"]').first().waitFor({ state: 'visible', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await waitIdle(page);
  await shot(page, dev, 'dashboard', errs);
  const pages = ['vendre', 'ventes', 'stock', 'stock/nouveau', 'credit', 'depenses', 'rapports', 'reglages'];
  for (const p of pages) {
    await appGo(page, `/app/${p}`);
    await shot(page, dev, p.replace('/', '-'), errs);
    for (const h of await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')))) links.add(h);
  }
  // detail pages
  await appGo(page, '/app/stock');
  await page.getByTestId('stock-row').first().click();
  await shot(page, dev, 'stock-detail', errs);
  await appGo(page, '/app/credit');
  await page.getByTestId('customer-row').first().click();
  await shot(page, dev, 'credit-detail', errs);
  await appGo(page, '/app/ventes');
  await page.getByTestId('sale-row').first().click();
  await shot(page, dev, 'sale-detail', errs);

  // POS flow: cart + checkout sheet + receipt
  await appGo(page, '/app/vendre');
  const cards = page.getByTestId('product-card');
  await cards.nth(3).click();
  await cards.nth(3).click();
  await cards.nth(7).click();
  await cards.nth(10).click();
  await shot(page, dev, 'pos-cart', errs);
  if (await page.getByTestId('open-cart').isVisible()) {
    await page.getByTestId('open-cart').click();
    await shot(page, dev, 'pos-cart-sheet', errs);
    await page.keyboard.press('Escape');
    await page.locator('[role=dialog]').waitFor({ state: 'detached' });
  }
  const panel = page.locator('[data-testid="checkout-panel"]:visible');
  if (await panel.count()) await panel.first().click();
  else await page.getByTestId('checkout').click();
  await page.getByTestId('method-mpesa').click();
  await page.getByTestId('pay-ref').fill('MP260926.QA' + dev.length);
  await shot(page, dev, 'pos-checkout', errs);
  await page.getByTestId('confirm-sale').click();
  await page.getByTestId('sale-success').waitFor();
  await shot(page, dev, 'receipt', errs, { wait: 1500 });

  // More sheet on mobile
  if (await page.getByTestId('tab-more').isVisible()) {
    await page.getByTestId('tab-more').click();
    await shot(page, dev, 'more-sheet', errs);
    await page.keyboard.press('Escape');
    await page.locator('[role=dialog]').waitFor({ state: 'detached' }).catch(() => {});
  }

  // dark mode + Lingala
  await appGo(page, '/app');
  await page.locator('[data-testid="theme-toggle"]:visible').first().click();
  await shot(page, dev, 'dashboard-dark', errs);
  await appGo(page, '/app/vendre');
  await shot(page, dev, 'vendre-dark', errs);
  await appGo(page, '/app/credit');
  await shot(page, dev, 'credit-dark', errs);
  await page.locator('[data-testid="theme-toggle"]:visible').first().click();
  await page.locator('[data-testid="lang-switcher"]:visible').first().click();
  await page.getByTestId('lang-ln').click();
  await appGo(page, '/app');
  await shot(page, dev, 'dashboard-lingala', errs);
  await appGo(page, '/app/stock');
  await shot(page, dev, 'stock-lingala', errs);
  await page.goto(BASE + '/');
  await shot(page, dev, 'landing-lingala', errs);
  await page.locator('[data-testid="lang-switcher"]:visible').first().click();
  await page.getByTestId('lang-fr').click();

  // seller view
  await page.goto(`${BASE}/app/reglages`);
  await page.waitForTimeout(1500);
  const logout = page.locator('[data-testid="logout"]:visible').first();
  await logout.click();
  await page.waitForURL(/connexion/);
  await page.getByTestId('demo-seller').click();
  await page.waitForURL(/\/app/);
  await page.waitForTimeout(2000);
  await waitIdle(page);
  await shot(page, dev, 'seller-dashboard', errs);
  await ctx.close();
  console.log('done', dev);
}

for (const [dev, desc] of Object.entries(DEVICES)) {
  if (only && !dev.includes(only)) continue;
  const mark = results.length, pmark = problems.length;
  try {
    await runDevice(dev, desc);
  } catch (e) {
    console.log('retry', dev, String(e).slice(0, 200));
    results.length = mark;
    problems.length = pmark;
    await runDevice(dev, desc);
  }
}

// ---- crawl every internal link found (full page loads)
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.addInitScript(() => localStorage.setItem('boutik.consent', '1'));
const page = await ctx.newPage();
await page.goto(`${BASE}/connexion`);
await page.getByTestId('demo-owner').click();
await page.waitForURL(/\/app/);
await page.waitForTimeout(4000);
const crawl = [];
const internal = [...links].filter((h) => h && !h.startsWith('http') && !h.startsWith('mailto') && !h.startsWith('tel') && !h.startsWith('#'));
// Detail pages share one view: keep at most 3 ids per pattern.
const perPattern = new Map();
const toCrawl = [...new Set(internal.map((h) => h.split('#')[0] || '/'))].sort().filter((h) => {
  const key = h.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/g, ':id');
  const n = perPattern.get(key) ?? 0;
  perPattern.set(key, n + 1);
  return n < 3;
});
for (const h of toCrawl) {
  const errs = [];
  const onC = (m) => m.type() === 'error' && errs.push(m.text().slice(0, 160));
  page.on('console', onC);
  const res = await page.goto(BASE + h);
  await page.waitForTimeout(1200);
  const nf = await page.getByTestId('not-found').count();
  page.off('console', onC);
  crawl.push({ href: h, status: res?.status(), appNotFound: nf > 0, errors: errs });
  if (!res || res.status() >= 400 || nf || errs.length) problems.push(`crawl ${h}: status ${res?.status()} notFound=${nf} ${errs.join(' | ')}`);
}
await browser.close();
fs.writeFileSync(`${OUT}/qa-results.json`, JSON.stringify({ base: BASE, at: new Date().toISOString(), results, crawl, problems }, null, 2));
console.log('screens:', results.length, 'crawled:', crawl.length);
console.log('problems:', problems.length);
for (const p of problems) console.log(' -', p);
