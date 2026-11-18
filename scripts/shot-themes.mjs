import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';

const out = '/opt/cursor/artifacts';
mkdirSync(out, { recursive: true });
const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
const THEMES = ['cinema', 'marche', 'atelier'];
const WIDTHS = [
  [390, 844],
  [820, 1180],
  [1440, 900],
];

async function verifyViewport(page) {
  return page.evaluate(() => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const inView = (el) => {
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw && r.width > 2 && r.height > 2;
    };
    const visible = [...document.querySelectorAll('img')].filter(inView);
    const broken = visible.filter((img) => !img.complete || img.naturalWidth === 0);
    const overlaps = [];
    const nameEl = document.querySelector('[data-testid="storefront-name"]');
    const rayon = document.querySelector('[data-testid="sf-en-rayon"]');
    if (nameEl && rayon) {
      const a = nameEl.getBoundingClientRect();
      const b = rayon.getBoundingClientRect();
      const hit = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
      if (hit && a.width > 0 && b.width > 0) overlaps.push('name-rayon');
    }
    const theme = document.querySelector('[data-theme]')?.getAttribute('data-theme') || null;
    return {
      theme,
      visibleImgs: visible.length,
      broken: broken.length,
      brokenSrcs: broken.map((i) => i.currentSrc || i.src).slice(0, 6),
      overlaps,
      hasName: !!nameEl,
      hasRayon: !!rayon,
      hasGrid: !!document.querySelector('[data-testid="storefront-grid"]'),
    };
  });
}

async function shotTheme(theme, width, height) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: width <= 430 ? 2 : 1,
    locale: 'fr-FR',
    isMobile: width <= 500,
    hasTouch: width <= 500,
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem('boutik.consent', '1');
      localStorage.setItem('boutik.sf-install-dismiss:demo', '1');
    } catch {}
  });
  const page = await context.newPage();
  const url = theme === 'cinema' ? `${base}/b/demo` : `${base}/b/demo?theme=${theme}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.getByTestId('storefront-name').waitFor({ timeout: 20000 });
  // Let eager images decode
  await page.waitForTimeout(800);
  await page.waitForFunction(() => {
    const imgs = [...document.querySelectorAll('img')].filter((img) => {
      const r = img.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight && r.width > 2;
    });
    return imgs.length === 0 || imgs.every((img) => img.complete && img.naturalWidth > 0);
  }, null, { timeout: 20000 }).catch(() => {});

  const check = await verifyViewport(page);
  const name = `storefront-theme-${theme}-${width}.png`;
  const path = `${out}/${name}`;
  await page.screenshot({ path, fullPage: false });
  await browser.close();
  return { name, theme, width, url, ...check };
}

async function shotOwnerPicker() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: 'fr-FR',
    isMobile: true,
    hasTouch: true,
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem('boutik.consent', '1');
    } catch {}
  });
  const page = await context.newPage();
  await page.goto(`${base}/connexion`, { waitUntil: 'networkidle' });
  await page.getByTestId('demo-owner').click();
  await page.waitForURL(/\/app(\/|$)/, { timeout: 45000 });
  await page.locator('[data-testid^="shop-name"]:visible').first().waitFor({ timeout: 60000 });
  await page.evaluate(() => {
    history.pushState({}, '', '/app/boutique');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.getByTestId('sf-theme-picker').waitFor({ timeout: 20000 });
  await page.getByTestId('sf-theme-picker').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const ok = (await page.getByTestId('sf-theme-picker').count()) > 0;
  const name = 'storefront-owner-theme-picker-390.png';
  await page.screenshot({ path: `${out}/${name}`, fullPage: true });
  // Focused crop of the picker
  await page.getByTestId('sf-theme-picker').screenshot({ path: `${out}/storefront-owner-theme-picker-focus-390.png` });
  await browser.close();
  return { name, ok, width: 390 };
}

const results = [];
for (const theme of THEMES) {
  for (const [w, h] of WIDTHS) {
    results.push(await shotTheme(theme, w, h));
  }
}
const owner = await shotOwnerPicker();
results.push(owner);

// Keep cinematic aliases for PR continuity
for (const w of [390, 820, 1440]) {
  try {
    copyFileSync(`${out}/storefront-theme-cinema-${w}.png`, `${out}/storefront-cinematic-${w}.png`);
  } catch {}
}

writeFileSync(`${out}/storefront-themes-verify.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));

const failures = results.filter((r) => {
  if ('broken' in r) {
    return (
      r.broken > 0 ||
      (r.overlaps && r.overlaps.length > 0) ||
      !r.hasName ||
      !r.hasGrid ||
      !THEMES.includes(r.theme)
    );
  }
  return r.ok === false;
});
if (failures.length) {
  console.error('VERIFY_FAILED', failures);
  process.exit(1);
}
console.log('VERIFY_OK', results.length);
