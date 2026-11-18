/* Boutik service worker — offline app shell + static asset cache.
 * Generated from scripts/sw-template.js at build time (VERSION is injected). */
const VERSION = '__VERSION__';
const SHELL = `boutik-shell-${VERSION}`;
const STATIC = 'boutik-static-v1'; // content-hashed / immutable assets, kept across versions
const RUNTIME = `boutik-runtime-${VERSION}`;
const STOREFRONT = 'boutik-storefront-v1'; // last-viewed public catalogues (isolated from app shell)
const PAGES = ['/app', '/', '/connexion', '/confidentialite', '/conditions', '/b/demo'];
const PRECACHE = __PRECACHE__;

const ASSET_RE = /\/_next\/static\/[^"'\s\\)<>]+/g;

async function collectFromHtml(html) {
  const out = new Set();
  for (const m of html.matchAll(ASSET_RE)) out.add(m[0].replace(/&amp;/g, '&'));
  return out;
}

async function cacheAll(cache, urls) {
  await Promise.all(
    [...urls].map(async (u) => {
      try {
        if (await cache.match(u)) return;
        const res = await fetch(u, { credentials: 'same-origin' });
        if (res.ok) {
          await cache.put(u, res.clone());
          if (u.endsWith('.css')) {
            const css = await res.text();
            const fonts = new Set();
            for (const m of css.matchAll(ASSET_RE)) fonts.add(m[0]);
            await cacheAll(cache, fonts);
          }
        }
      } catch (e) {}
    }),
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL);
      const assets = new Set();
      for (const page of PAGES) {
        try {
          const res = await fetch(page, { cache: 'reload', credentials: 'same-origin' });
          if (!res.ok) continue;
          await shell.put(page, res.clone());
          (await collectFromHtml(await res.text())).forEach((a) => assets.add(a));
        } catch (e) {}
      }
      const st = await caches.open(STATIC);
      await cacheAll(st, assets);
      await cacheAll(st, PRECACHE);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = [SHELL, STATIC, RUNTIME, STOREFRONT];
      for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(() => {});
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  const d = event.data || {};
  if (d.type === 'CACHE_URLS' && Array.isArray(d.urls)) {
    event.waitUntil(caches.open(STATIC).then((c) => cacheAll(c, d.urls.filter((u) => typeof u === 'string' && u.startsWith('/')))));
  }
  if (d.type === 'CACHE_STOREFRONT' && Array.isArray(d.urls)) {
    event.waitUntil(
      (async () => {
        const sf = await caches.open(STOREFRONT);
        await cacheAll(sf, d.urls.filter((u) => typeof u === 'string' && u.startsWith('/')));
        const st = await caches.open(STATIC);
        await cacheAll(
          st,
          d.urls.filter((u) => typeof u === 'string' && /^\/(products|img|icons)\//.test(u)),
        );
      })(),
    );
  }
  if (d.type === 'SKIP_WAITING') self.skipWaiting();
});

function timeout(ms) {
  return new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
}

async function handleNavigation(event, url) {
  const isStorefront = url.pathname.startsWith('/b/');
  const shell = await caches.open(isStorefront ? STOREFRONT : SHELL);
  const key = url.pathname.replace(/\/+$/, '') || '/';
  try {
    const preload = event.preloadResponse ? await event.preloadResponse : null;
    const res = preload || (await Promise.race([fetch(event.request), timeout(6000)]));
    if (res && res.ok && res.type === 'basic') {
      const copy = res.clone();
      event.waitUntil(shell.put(key, copy));
      if (key.startsWith('/app')) event.waitUntil(caches.open(SHELL).then((c) => c.put('/app', res.clone())));
    }
    return res;
  } catch (e) {
    const hit =
      (await shell.match(key)) ||
      (key.startsWith('/app') ? await caches.open(SHELL).then((c) => c.match('/app')) : null) ||
      (isStorefront ? await shell.match('/b/demo') : null) ||
      (await caches.open(SHELL).then((c) => c.match('/')));
    if (hit) return hit;
    return new Response(
      '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Boutik</title><body style="font-family:system-ui;background:#faf6f0;color:#24170f;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center"><div><h1>Hors ligne</h1><p>Connectez-vous une première fois à internet pour installer Boutik.</p></div>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 },
    );
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req, { ignoreSearch: false });
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok && (res.type === 'basic' || res.type === 'default')) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const loose = await cache.match(req, { ignoreSearch: true });
    if (loose) return loose;
    return Response.error();
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok && res.type === 'basic') cache.put(req, res.clone());
    return res;
  } catch (e) {
    return (await cache.match(req)) || (await caches.match(req)) || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/sw.js') return;

  // Public storefront API: network-first, cached for offline catalogue
  if (url.pathname.startsWith('/api/storefront/')) {
    event.respondWith(networkFirst(req, STOREFRONT));
    return;
  }
  if (url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    event.respondWith(handleNavigation(event, url));
    return;
  }
  // RSC payloads: network only (Next falls back to a full navigation when offline)
  if (req.headers.get('RSC') || url.searchParams.has('_rsc')) return;

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(req, STATIC));
    return;
  }
  if (
    url.pathname.includes('/manifest.webmanifest') ||
    /^\/(products|img|icons|splash)\//.test(url.pathname) ||
    /\.(png|svg|webp|jpg|jpeg|ico|woff2?)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(req, STATIC));
    return;
  }
  event.respondWith(networkFirst(req, RUNTIME));
});
