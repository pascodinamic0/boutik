import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const out = '/opt/cursor/artifacts';
mkdirSync(out, { recursive: true });
const base = process.env.BASE_URL || 'http://127.0.0.1:3000';

async function verifyNoBrokenImages(page) {
  return page.evaluate(() => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const inView = (el) => {
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw && r.width > 2 && r.height > 2;
    };
    const stage = document.querySelector('[data-testid="sf-stage"]');
    const stageImgs = stage ? [...stage.querySelectorAll('img')] : [];
    const visible = [...document.querySelectorAll('img')].filter(inView);
    const check = (imgs) => imgs.filter((img) => !img.complete || img.naturalWidth === 0);
    const stageBroken = check(stageImgs);
    const visibleBroken = check(visible);
    return {
      total: visible.length,
      stageTotal: stageImgs.length,
      broken: visibleBroken.length,
      stageBroken: stageBroken.length,
      srcs: [...stageBroken, ...visibleBroken].map((i) => i.currentSrc || i.src).slice(0, 8),
    };
  });
}

async function shot(width, height, name) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: width <= 430 ? 2 : 1,
    locale: 'fr-FR',
    isMobile: width <= 500,
    hasTouch: width <= 500,
  });
  // Consent accepted so install can appear later without stacking; dismiss install for clean hero shots
  await context.addInitScript(() => {
    try {
      localStorage.setItem('boutik.consent', '1');
      localStorage.setItem('boutik.sf-install-dismiss:demo', '1');
    } catch {}
  });
  const page = await context.newPage();
  await page.goto(`${base}/b/demo`, { waitUntil: 'networkidle' });
  await page.getByTestId('storefront-name').waitFor({ timeout: 20000 });
  // Wait for hero stage images (eager) to decode
  await page.getByTestId('sf-stage').waitFor({ timeout: 10000 });
  await page.waitForFunction(() => {
    const stage = document.querySelector('[data-testid="sf-stage"]');
    if (!stage) return false;
    const imgs = [...stage.querySelectorAll('img')];
    if (imgs.length === 0) return true; // reduced-motion / fallback art only
    return imgs.every((img) => img.complete && img.naturalWidth > 0);
  }, null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);

  const check = await verifyNoBrokenImages(page);
  const bodyText = await page.locator('body').innerText();
  const hasDevJargon = /roughness|MeshPhysical|rotation\.y|fraunces · 700/i.test(bodyText);

  await page.screenshot({ path: `${out}/${name}`, fullPage: false });
  await browser.close();
  return { name, width, ...check, hasDevJargon };
}

const results = [];
results.push(await shot(390, 844, 'storefront-cinematic-390.png'));
results.push(await shot(820, 1180, 'storefront-cinematic-820.png'));
results.push(await shot(1440, 900, 'storefront-cinematic-1440.png'));

writeFileSync(`${out}/storefront-shot-verify.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));

  const bad = results.filter((r) => r.broken > 0 || r.stageBroken > 0 || r.hasDevJargon);
if (bad.length) {
  console.error('VERIFICATION FAILED', bad);
  process.exit(1);
}
console.log('all shots clean');
