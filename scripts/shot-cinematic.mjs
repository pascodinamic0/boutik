import { chromium, devices } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = '/opt/cursor/artifacts';
mkdirSync(out, { recursive: true });
const base = process.env.BASE_URL || 'http://127.0.0.1:3000';

async function shot(width, height, name) {
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
  await page.goto(`${base}/b/demo`, { waitUntil: 'networkidle' });
  await page.getByTestId('storefront-name').waitFor({ timeout: 20000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${name}`, fullPage: false });
  await browser.close();
}

await shot(390, 844, 'storefront-cinematic-390.png');
await shot(820, 1180, 'storefront-cinematic-820.png');
await shot(1440, 900, 'storefront-cinematic-1440.png');

// Screen recording: scroll + add-to-cart
{
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['Pixel 7'],
    locale: 'fr-FR',
    recordVideo: { dir: out, size: { width: 412, height: 915 } },
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem('boutik.consent', '1');
      localStorage.setItem('boutik.sf-install-dismiss:demo', '1');
    } catch {}
  });
  const page = await context.newPage();
  await page.goto(`${base}/b/demo`, { waitUntil: 'networkidle' });
  await page.getByTestId('storefront-name').waitFor();
  await page.waitForTimeout(600);
  // scroll through hero
  for (const y of [200, 400, 700, 1100, 1600]) {
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'smooth' }), y);
    await page.waitForTimeout(450);
  }
  await page.getByTestId('storefront-grid').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  // open product sheet
  await page.getByTestId('storefront-grid').locator('button').first().click();
  await page.getByTestId('sf-product-sheet').waitFor({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(700);
  const addBtn = page.getByTestId('sf-product-sheet').getByRole('button', { name: /Ajouter/i });
  if (await addBtn.count()) {
    await addBtn.click();
    await page.waitForTimeout(900);
  } else {
    await page.keyboard.press('Escape');
    await page.getByTestId('storefront-grid').locator('button', { hasText: 'Ajouter' }).first().click();
    await page.waitForTimeout(900);
  }
  await page.getByTestId('open-cart').waitFor({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(800);
  const video = page.video();
  await context.close();
  await browser.close();
  if (video) {
    const path = await video.path();
    const { renameSync } = await import('node:fs');
    renameSync(path, `${out}/storefront-cinematic-scroll.webm`);
    console.log('video saved');
  }
}

console.log('cinematic shots done');
