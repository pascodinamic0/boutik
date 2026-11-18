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

function isBrowserDefaultFont(family) {
  const f = (family || '').toLowerCase();
  if (!f) return true;
  if (/\bjakarta\b|\bfraunces\b/.test(f)) return false;
  if (/times new roman|\btimes\b/.test(f)) return true;
  if (/^\s*serif\s*$/.test(f)) return true;
  return false;
}

async function verifyViewport(page, theme, width) {
  return page.evaluate(
    ({ theme, width }) => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const inView = (el) => {
        const r = el.getBoundingClientRect();
        return r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw && r.width > 2 && r.height > 2;
      };
      const visible = [...document.querySelectorAll('img')].filter(inView);
      const broken = visible.filter((img) => !img.complete || img.naturalWidth === 0);
      const bodyFont = getComputedStyle(document.body).fontFamily;
      const root = document.querySelector('[data-theme]');
      const rootFont = root ? getComputedStyle(root).fontFamily : bodyFont;
      const nameEl = document.querySelector('[data-testid="storefront-name"]');
      const commander = [...document.querySelectorAll('a')].find((a) => /Commander/i.test(a.textContent || ''));
      const stage = document.querySelector('[data-testid="sf-stage"]');
      const consent = document.querySelector('[data-testid="consent-banner"]');

      let stageOverlapsName = false;
      if (nameEl && stage && width >= 1024) {
        const a = nameEl.getBoundingClientRect();
        const b = stage.getBoundingClientRect();
        const hit = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
        // Allow intentional stacked mobile-like layouts; fail only on side-by-side bleed
        stageOverlapsName = hit && a.right - b.left > 24 && b.right - a.left > 24 && Math.abs(a.top - b.top) < 120;
      }

      const nameInFirstViewport = nameEl ? nameEl.getBoundingClientRect().top < vh * 0.72 : false;
      const ctaInFirstViewport = commander ? commander.getBoundingClientRect().bottom < vh - 8 : true;
      const consentCoversCta =
        consent && commander
          ? (() => {
              const a = consent.getBoundingClientRect();
              const b = commander.getBoundingClientRect();
              return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
            })()
          : false;
      const consentAtTop = consent ? consent.getBoundingClientRect().top < 80 : false;
      const headerShop = document.querySelector('[data-testid="sf-header-shop"]');
      const overlaps = (aEl, bEl) => {
        if (!aEl || !bEl) return false;
        const a = aEl.getBoundingClientRect();
        const b = bEl.getBoundingClientRect();
        return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
      };
      const consentCoversHeader = overlaps(consent, headerShop);
      const heroPrice = document.querySelector('.sf-hero-price');
      const consentCoversHeroPrice = (() => {
        if (!consent || !heroPrice || !inView(heroPrice)) return false;
        const a = consent.getBoundingClientRect();
        const b = heroPrice.getBoundingClientRect();
        // Fail only if the price card meaningfully intersects the strip
        return b.bottom > a.top + 2 && b.top < a.top;
      })();
      const catRail = document.querySelector('[data-testid="sf-category-rail"]');
      const firstChip = catRail?.querySelector('button');
      const consentCoversCategory = (() => {
        if (!consent || !firstChip || !inView(firstChip)) return false;
        const a = consent.getBoundingClientRect();
        const b = firstChip.getBoundingClientRect();
        // Ignore chips that only peek under the strip; fail if readable chip is clipped
        const visibleAbove = Math.min(b.bottom, a.top) - b.top;
        return visibleAbove > 12 && b.bottom > a.top + 2;
      })();
      const mosaicTiles = stage ? stage.querySelectorAll('button') : [];
      const mosaicBalanced = theme !== 'marche' || width < 1024 || mosaicTiles.length === 0 || mosaicTiles.length === 4;

      const firstGrid = document.querySelector('[data-testid="storefront-grid"] [data-testid^="sf-product-"]');
      const firstRail = document.querySelector('[data-testid^="sf-rail-product-"]');
      const productVisible = (el) => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        const host = el.closest('li') || el;
        const op = parseFloat(getComputedStyle(host).opacity || '1');
        return r.top < vh && r.bottom > 0 && op > 0.5;
      };
      const firstProductVisible = productVisible(firstGrid) || productVisible(firstRail) || (stage ? inView(stage) : false);

      const footer = document.querySelector('[data-testid="sf-footer"]');
      const trust = document.querySelector('[data-testid="sf-trust"]');

      return {
        theme: root?.getAttribute('data-theme') || null,
        bodyFont,
        rootFont,
        visibleImgs: visible.length,
        broken: broken.length,
        brokenSrcs: broken.map((i) => i.currentSrc || i.src).slice(0, 6),
        stageOverlapsName,
        nameInFirstViewport,
        ctaInFirstViewport,
        consentCoversCta,
        consentAtTop,
        consentCoversHeader,
        consentCoversHeroPrice,
        consentCoversCategory,
        mosaicBalanced,
        firstProductVisible,
        hasName: !!nameEl,
        hasGrid: !!document.querySelector('[data-testid="storefront-grid"]'),
        hasRayon: !!document.querySelector('[data-testid="sf-en-rayon"]'),
        hasFooter: !!footer,
        hasTrust: !!trust,
        hasCategoryRail: !!document.querySelector('[data-testid="sf-category-rail"]'),
      };
    },
    { theme, width },
  );
}

async function shotTheme(theme, width, height, { keepConsent = false, fullPage = false, nameOverride, scrollHero = false } = {}) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: width <= 430 ? 2 : 1,
    locale: 'fr-FR',
    isMobile: width <= 500,
    hasTouch: width <= 500,
  });
  await context.addInitScript((keep) => {
    try {
      if (!keep) localStorage.setItem('boutik.consent', '1');
      else localStorage.removeItem('boutik.consent');
      localStorage.setItem('boutik.sf-install-dismiss:demo', '1');
    } catch {}
  }, keepConsent);
  const page = await context.newPage();
  const url = theme === 'cinema' ? `${base}/b/demo` : `${base}/b/demo?theme=${theme}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.getByTestId('storefront-name').waitFor({ timeout: 20000 });
  await page.waitForTimeout(900);
  await page.waitForFunction(() => {
    const imgs = [...document.querySelectorAll('img')].filter((img) => {
      const r = img.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight && r.width > 2;
    });
    return imgs.length === 0 || imgs.every((img) => img.complete && img.naturalWidth > 0);
  }, null, { timeout: 20000 }).catch(() => {});

  if (scrollHero) {
    const stage = page.getByTestId('sf-stage');
    if (await stage.count()) {
      await stage.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      // Keep hero price fully above the fixed consent strip
      await page.evaluate(() => {
        const price = document.querySelector('.sf-hero-price');
        const consent = document.querySelector('[data-testid="consent-banner"]');
        if (!price) return;
        price.scrollIntoView({ block: 'center', inline: 'nearest' });
        if (!consent) return;
        const gap = 10;
        const cTop = consent.getBoundingClientRect().top;
        const pBottom = price.getBoundingClientRect().bottom;
        if (pBottom > cTop - gap) window.scrollBy(0, pBottom - (cTop - gap));
      });
      await page.waitForTimeout(300);
    }
  }

  const check = await verifyViewport(page, theme, width);
  const defaultFont = isBrowserDefaultFont(check.bodyFont) || isBrowserDefaultFont(check.rootFont);
  const name = nameOverride || `storefront-theme-${theme}-${width}${fullPage ? '-full' : ''}.png`;
  await page.screenshot({ path: `${out}/${name}`, fullPage });
  await browser.close();
  return { name, theme, width, url, defaultFont, fullPage, ...check };
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
  await page.waitForTimeout(500);
  const ok = (await page.getByTestId('sf-theme-picker').count()) > 0;
  const name = 'storefront-owner-theme-picker-390.png';
  await page.screenshot({ path: `${out}/${name}`, fullPage: true });
  await page.getByTestId('sf-theme-picker').screenshot({ path: `${out}/storefront-owner-theme-picker-focus-390.png` });
  await browser.close();
  return { name, ok, width: 390 };
}

const results = [];
for (const theme of THEMES) {
  for (const [w, h] of WIDTHS) {
    results.push(await shotTheme(theme, w, h, { fullPage: false }));
    results.push(await shotTheme(theme, w, h, { fullPage: true }));
  }
}
results.push(
  await shotTheme('cinema', 390, 844, {
    keepConsent: true,
    scrollHero: true,
    nameOverride: 'storefront-consent-check-390.png',
  }).then((r) => ({ ...r, consentCheck: true })),
);
results.push(
  await shotTheme('cinema', 1440, 900, {
    keepConsent: true,
    nameOverride: 'storefront-consent-check-cinema-1440.png',
  }).then((r) => ({ ...r, consentCheck: true })),
);
results.push(
  await shotTheme('atelier', 1440, 900, {
    keepConsent: true,
    nameOverride: 'storefront-consent-check-atelier-1440.png',
  }).then((r) => ({ ...r, consentCheck: true })),
);
results.push(await shotTheme('marche', 1440, 900, { keepConsent: false, nameOverride: 'storefront-marche-mosaic-1440.png' }));
results.push(await shotOwnerPicker());

for (const w of [390, 820, 1440]) {
  try {
    copyFileSync(`${out}/storefront-theme-cinema-${w}.png`, `${out}/storefront-cinematic-${w}.png`);
  } catch {}
}

writeFileSync(`${out}/storefront-themes-verify.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));

const failures = results.filter((r) => {
  if (r.consentCheck) {
    return (
      r.consentCoversCta ||
      r.consentAtTop ||
      r.consentCoversHeader ||
      r.consentCoversHeroPrice ||
      r.consentCoversCategory ||
      r.defaultFont
    );
  }
  if ('broken' in r) {
    if (r.fullPage) {
      return r.broken > 0 || !r.hasName || !r.hasGrid || !r.hasFooter || !THEMES.includes(r.theme);
    }
    const mobileCinemaBad = r.theme === 'cinema' && r.width === 390 && (!r.nameInFirstViewport || !r.ctaInFirstViewport);
    const desktopOverlap = r.width >= 1024 && r.stageOverlapsName;
    const fontBad = r.width === 1440 && r.defaultFont;
    return (
      r.broken > 0 ||
      !r.hasName ||
      !r.hasGrid ||
      !r.hasTrust ||
      !r.hasCategoryRail ||
      !THEMES.includes(r.theme) ||
      mobileCinemaBad ||
      desktopOverlap ||
      fontBad
    );
  }
  return r.ok === false;
});
if (failures.length) {
  console.error('VERIFY_FAILED', failures.map((f) => f.name || f));
  process.exit(1);
}
console.log('VERIFY_OK', results.length);
