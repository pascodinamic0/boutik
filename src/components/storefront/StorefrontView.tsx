'use client';
import clsx from 'clsx';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import { MessageCircle, Minus, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InstallShopPrompt } from '@/components/storefront/InstallShopPrompt';
import { ProductArt } from '@/components/storefront/ProductArt';
import { formatMoney } from '@/lib/money';
import {
  availabilityLabel,
  storefrontContactUrl,
  storefrontWhatsAppUrl,
  type CartLine,
  type PublicProduct,
  type PublicStorefront,
} from '@/lib/storefront';

const StorefrontStage = dynamic(
  () => import('@/components/storefront/StorefrontStage').then((m) => m.StorefrontStage),
  { ssr: false, loading: () => <div className="mx-auto h-[280px] w-full max-w-md animate-pulse rounded-[2rem] bg-[#efe6da]/40 sm:h-[360px]" /> },
);

const CACHE_KEY = (slug: string) => `boutik.sf.catalogue:${slug}`;

function useCatalogueOffline(shop: PublicStorefront) {
  useEffect(() => {
    try {
      localStorage.setItem(CACHE_KEY(shop.slug), JSON.stringify(shop));
    } catch {
      /* quota */
    }
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const urls = [
        `/b/${shop.slug}`,
        `/api/storefront/${shop.slug}`,
        ...shop.products.map((p) => p.photo).filter((u): u is string => !!u && u.startsWith('/')),
      ];
      navigator.serviceWorker.controller.postMessage({ type: 'CACHE_STOREFRONT', slug: shop.slug, urls });
    }
  }, [shop]);
}

function flyToCart(fromEl: HTMLElement | null, cartEl: HTMLElement | null, photo: string | null) {
  if (!fromEl || !cartEl || !photo) return;
  const a = fromEl.getBoundingClientRect();
  const b = cartEl.getBoundingClientRect();
  const ghost = document.createElement('img');
  ghost.src = photo;
  ghost.alt = '';
  ghost.setAttribute('aria-hidden', 'true');
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${a.left}px`,
    top: `${a.top}px`,
    width: `${a.width}px`,
    height: `${a.height}px`,
    objectFit: 'cover',
    borderRadius: '1.25rem',
    zIndex: '90',
    pointerEvents: 'none',
    transition: 'transform 0.55s cubic-bezier(0.22,1,0.36,1), opacity 0.55s ease',
    willChange: 'transform, opacity',
  } as CSSStyleDeclaration);
  document.body.appendChild(ghost);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  requestAnimationFrame(() => {
    ghost.style.transform = `translate(${dx}px, ${dy}px) scale(0.12)`;
    ghost.style.opacity = '0.15';
  });
  window.setTimeout(() => ghost.remove(), 600);
}

export function StorefrontView({ shop }: { shop: PublicStorefront }) {
  const reduce = useReducedMotion();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [avail, setAvail] = useState<'all' | 'in' | 'low'>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftCat, setDraftCat] = useState(cat);
  const [draftAvail, setDraftAvail] = useState(avail);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [openCart, setOpenCart] = useState(false);
  const [active, setActive] = useState<PublicProduct | null>(null);
  const [sheetQty, setSheetQty] = useState(1);
  const cartBarRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  useCatalogueOffline(shop);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroFade = useTransform(scrollYProgress, [0, 0.55, 0.9], [1, 1, 0]);
  const titleY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);

  const cats = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of shop.products) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr'));
  }, [shop.products]);

  const countFor = (c: string, a: typeof avail, query: string) => {
    const qq = query.trim().toLowerCase();
    return shop.products.filter((p) => {
      if (c !== 'all' && p.category !== c) return false;
      if (a === 'in' && p.availability === 'out') return false;
      if (a === 'low' && p.availability !== 'low') return false;
      if (qq && !p.name.toLowerCase().includes(qq) && !p.category.toLowerCase().includes(qq)) return false;
      return true;
    }).length;
  };

  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return shop.products.filter((p) => {
      if (cat !== 'all' && p.category !== cat) return false;
      if (avail === 'in' && p.availability === 'out') return false;
      if (avail === 'low' && p.availability !== 'low') return false;
      if (qq && !p.name.toLowerCase().includes(qq) && !p.category.toLowerCase().includes(qq)) return false;
      return true;
    });
  }, [shop.products, q, cat, avail]);

  const draftCount = countFor(draftCat, draftAvail, q);
  const activeFilters = (cat !== 'all' ? 1 : 0) + (avail !== 'all' ? 1 : 0);

  const lines: CartLine[] = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const product = shop.products.find((p) => p.id === id);
          if (!product || qty <= 0) return null;
          return { product, qty };
        })
        .filter(Boolean) as CartLine[],
    [cart, shop.products],
  );
  const cartCount = lines.reduce((s, l) => s + l.qty, 0);
  const cartTotal = lines.reduce((s, l) => s + l.product.sell_price * l.qty, 0);

  const add = useCallback(
    (p: PublicProduct, qty = 1, fromEl?: HTMLElement | null) => {
      if (p.availability === 'out') return;
      if (!reduce) flyToCart(fromEl ?? null, cartBarRef.current, p.photo);
      setCart((c) => ({ ...c, [p.id]: (c[p.id] ?? 0) + qty }));
      try {
        navigator.vibrate?.(8);
      } catch {
        /* noop */
      }
    },
    [reduce],
  );

  const setQty = (id: string, qty: number) => {
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  };

  const openProduct = (p: PublicProduct) => {
    setSheetQty(Math.max(1, cart[p.id] ?? 1));
    setActive(p);
  };

  const openFilters = () => {
    setDraftCat(cat);
    setDraftAvail(avail);
    setFiltersOpen(true);
  };
  const applyFilters = () => {
    setCat(draftCat);
    setAvail(draftAvail);
    setFiltersOpen(false);
  };

  const shortName = shop.name.length > 28 ? `${shop.name.slice(0, 26)}…` : shop.name;

  return (
    <LayoutGroup>
      <div className="sf-root sf-cinematic min-h-dvh text-[#0a0a0a]">
        <InstallShopPrompt shop={shop} />

        {/* Shop identity header — not generic Boutik */}
        <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-[#faf8f4]/72 pt-safe backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold tracking-tight text-[#0a0a0a]" data-testid="sf-header-shop">
                {shortName}
              </p>
              <p className="truncate text-[11px] font-medium uppercase tracking-[0.14em] text-[#8a7360]">
                {shop.commune || 'Catalogue'} · en ligne
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {shop.whatsapp && (
                <a
                  href={storefrontContactUrl(shop)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0a0a0a] px-4 text-[13px] font-semibold text-white active:scale-95"
                >
                  <MessageCircle size={15} /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Cinematic scroll hero */}
        <section ref={heroRef} className="relative">
          <motion.div style={reduce ? undefined : { opacity: heroFade }} className="relative overflow-hidden">
            <div className="mx-auto grid max-w-6xl gap-2 px-4 pb-4 pt-8 sm:px-6 sm:pt-12 lg:grid-cols-[1.05fr_1.1fr_0.85fr] lg:items-center lg:gap-8 lg:px-8 lg:pb-10 lg:pt-16">
              <motion.div style={reduce ? undefined : { y: titleY }} className="relative z-10 order-2 lg:order-1">
                {shop.demo && (
                  <p
                    className="mb-4 inline-flex rounded-full border border-[#e0c48a] bg-[#fff6df] px-3 py-1 text-[11px] font-semibold text-[#7a5a12]"
                    data-testid="demo-banner"
                  >
                    Boutique de démonstration
                  </p>
                )}
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a7360]">
                  {shop.commune || 'Kinshasa'} · catalogue
                </p>
                <h1
                  className="mt-3 max-w-[14ch] font-[family-name:var(--font-fraunces)] text-[clamp(2.75rem,9vw,5.5rem)] font-bold leading-[0.92] tracking-[-0.04em] text-[#0a0a0a]"
                  data-testid="storefront-name"
                >
                  {shop.name}
                </h1>
                {shop.description && (
                  <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#4a382c] sm:text-[16px]">{shop.description}</p>
                )}
                <div className="mt-7 flex flex-wrap gap-2.5">
                  {shop.whatsapp && (
                    <a
                      href={storefrontContactUrl(shop)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-12 items-center gap-2 rounded-full bg-[#0a0a0a] px-6 text-sm font-bold text-white active:scale-[0.98]"
                    >
                      Commander →
                    </a>
                  )}
                  <a
                    href="#catalogue"
                    className="inline-flex h-12 items-center gap-2 rounded-full border border-[#0a0a0a]/15 bg-transparent px-5 text-sm font-semibold text-[#0a0a0a] active:scale-[0.98]"
                  >
                    Voir le rayon
                  </a>
                </div>
              </motion.div>

              <div className="order-1 lg:order-2">
                <StorefrontStage products={shop.products} />
              </div>

              <div className="order-3 hidden lg:block">
                <div className="rounded-[1.75rem] border border-black/[0.08] bg-white/70 p-6 backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7360]">En rayon</p>
                  <p className="mt-2 font-[family-name:var(--font-fraunces)] text-5xl font-bold tabular leading-none text-[#c2531f]">
                    {shop.products.length}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[#4a382c]">
                    produits · ajoutez au panier, envoyez sur WhatsApp. Pas de paiement en ligne.
                  </p>
                  <p className="mt-6 font-mono text-[10px] tracking-wide text-[#8a7360]">display · fraunces · 700</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <main id="catalogue" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-40 pt-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a7b64]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un produit…"
                className="h-12 w-full rounded-full border border-black/[0.08] bg-white/80 pl-11 pr-4 text-[16px] outline-none focus:border-[#c2531f] focus:ring-4 focus:ring-[#c2531f]/12"
                data-testid="storefront-search"
              />
            </div>
            <button
              type="button"
              onClick={openFilters}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-black/[0.08] bg-white/80 px-5 text-sm font-semibold text-[#0a0a0a] active:scale-[0.99]"
              data-testid="sf-filters"
            >
              <SlidersHorizontal size={16} />
              Filtres
              {activeFilters > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c2531f] px-1.5 text-[11px] font-bold text-white">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          {/* Polished category rail */}
          <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {[{ key: 'all', label: 'Tout', n: shop.products.length }, ...cats.map(([c, n]) => ({ key: c, label: c, n }))].map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCat(c.key)}
                className={clsx(
                  'inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition active:scale-95',
                  cat === c.key
                    ? 'bg-[#0a0a0a] text-white'
                    : 'border border-black/[0.08] bg-white/70 text-[#4a382c] hover:border-black/20',
                )}
              >
                {c.label}
                <span className={clsx('rounded-full px-1.5 py-0.5 text-[11px] tabular', cat === c.key ? 'bg-white/15' : 'bg-black/[0.04]')}>
                  {c.n}
                </span>
              </button>
            ))}
          </div>

          {list.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-black/10 py-20 text-center">
              <p className="font-[family-name:var(--font-fraunces)] text-2xl font-bold">Aucun produit</p>
              <p className="mt-2 text-sm text-[#7a6554]">Élargissez la recherche ou les filtres.</p>
              <button
                type="button"
                onClick={() => {
                  setCat('all');
                  setAvail('all');
                  setQ('');
                }}
                className="mt-5 text-sm font-bold text-[#c2531f]"
              >
                Réinitialiser
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4" data-testid="storefront-grid">
              {list.map((p, i) => (
                <motion.li
                  key={p.id}
                  initial={reduce ? false : { opacity: 0, y: 28, scale: 0.96 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.45, delay: Math.min(i * 0.04, 0.28), ease: [0.22, 1, 0.36, 1] }}
                  className="group flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => openProduct(p)}
                    className="text-left"
                    data-testid={`sf-product-${p.id}`}
                  >
                    <motion.div
                      layoutId={reduce ? undefined : `photo-${p.id}`}
                      className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[#efe6da]"
                    >
                      <ProductArt
                        src={p.photo}
                        name={p.name}
                        category={p.category}
                        rounded="rounded-none"
                        className="h-full w-full transition duration-500 group-hover:scale-[1.04]"
                      />
                      <span
                        className={clsx(
                          'absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                          p.availability === 'in' && 'bg-emerald-700 text-white',
                          p.availability === 'low' && 'bg-[#d4a017] text-[#0a0a0a]',
                          p.availability === 'out' && 'bg-stone-600 text-white',
                        )}
                      >
                        {availabilityLabel(p.availability)}
                      </span>
                    </motion.div>
                    <p className="mt-3 line-clamp-2 text-[13.5px] font-semibold leading-snug sm:text-sm">{p.name}</p>
                    <p className="mt-1.5 font-[family-name:var(--font-fraunces)] text-[clamp(1.2rem,3vw,1.5rem)] font-bold tabular leading-none text-[#c2531f]">
                      {formatMoney(p.sell_price, shop.currency)}
                    </p>
                  </button>
                  <button
                    type="button"
                    disabled={p.availability === 'out'}
                    onClick={(e) => {
                      const card = (e.currentTarget.previousElementSibling as HTMLElement | null)?.querySelector('[class*="aspect"]') as HTMLElement | null;
                      add(p, 1, card);
                    }}
                    className="mt-3 inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-[#0a0a0a] text-[13px] font-bold text-white transition enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <Plus size={15} /> Ajouter
                  </button>
                </motion.li>
              ))}
            </ul>
          )}
        </main>

        {/* Sticky WhatsApp cart bar */}
        <div ref={cartBarRef} className="pointer-events-none fixed inset-x-0 bottom-0 z-40 pb-safe">
          <AnimatePresence>
            {cartCount > 0 && (
              <motion.div
                initial={reduce ? false : { y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className="pointer-events-auto mx-auto mb-3 max-w-lg px-3 sm:mb-4"
              >
                <div className="flex items-center gap-2 rounded-full border border-black/10 bg-[#0a0a0a] p-1.5 pl-2 shadow-[0_20px_50px_rgb(0_0_0/0.25)]">
                  <button
                    type="button"
                    onClick={() => setOpenCart(true)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-full px-3 py-2 text-left text-white active:scale-[0.99]"
                    data-testid="open-cart"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c2531f] text-sm font-bold tabular">
                      {cartCount}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold">Commande</span>
                      <span className="block text-[12px] tabular text-white/65">{formatMoney(cartTotal, shop.currency)}</span>
                    </span>
                  </button>
                  {shop.whatsapp && (
                    <a
                      href={storefrontWhatsAppUrl(shop, lines)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#25D366] px-4 text-[13px] font-bold text-[#0a0a0a] active:scale-95"
                      data-testid="whatsapp-order"
                    >
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Product detail sheet */}
        <AnimatePresence>
          {active && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-6" onClick={() => setActive(null)}>
              <motion.div
                initial={reduce ? false : { y: 48, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 32, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 360, damping: 34 }}
                className="max-h-[92dvh] w-full max-w-lg overflow-auto rounded-t-[2rem] bg-[#faf8f4] pb-safe sm:rounded-[2rem]"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-label={active.name}
                data-testid="sf-product-sheet"
              >
                <motion.div layoutId={reduce ? undefined : `photo-${active.id}`} className="relative aspect-[5/4] overflow-hidden bg-[#efe6da] sm:aspect-[16/11]">
                  <ProductArt src={active.photo} name={active.name} category={active.category} rounded="rounded-none" className="h-full w-full" />
                  <button
                    type="button"
                    onClick={() => setActive(null)}
                    className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#0a0a0a]"
                    aria-label="Fermer"
                  >
                    <X size={18} />
                  </button>
                </motion.div>
                <div className="p-5 sm:p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7360]">{active.category}</p>
                  <h2 className="mt-1 font-[family-name:var(--font-fraunces)] text-2xl font-bold leading-tight sm:text-3xl">{active.name}</h2>
                  <p className="mt-3 font-[family-name:var(--font-fraunces)] text-4xl font-bold tabular text-[#c2531f]">
                    {formatMoney(active.sell_price, shop.currency)}
                  </p>
                  <p className="mt-2 text-sm text-[#7a6554]">{availabilityLabel(active.availability)} · {active.unit}</p>

                  <div className="mt-6 flex items-center gap-4">
                    <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white p-1">
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full active:bg-black/5"
                        onClick={() => setSheetQty((n) => Math.max(1, n - 1))}
                        aria-label="Moins"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center text-base font-bold tabular">{sheetQty}</span>
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full active:bg-black/5"
                        onClick={() => setSheetQty((n) => n + 1)}
                        aria-label="Plus"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={active.availability === 'out'}
                      onClick={() => {
                        add(active, sheetQty);
                        setActive(null);
                      }}
                      className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#0a0a0a] text-sm font-bold text-white disabled:opacity-40 active:scale-[0.98]"
                    >
                      Ajouter · {formatMoney(active.sell_price * sheetQty, shop.currency)}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Filters sheet */}
        <AnimatePresence>
          {filtersOpen && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6" onClick={() => setFiltersOpen(false)}>
              <motion.div
                initial={reduce ? false : { y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 24, opacity: 0 }}
                className="w-full max-w-lg rounded-t-[2rem] border border-black/5 bg-[#faf8f4] p-5 pb-safe sm:rounded-[2rem]"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-label="Filtres"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-bold">Filtres</h2>
                  <button type="button" onClick={() => setFiltersOpen(false)} className="rounded-full p-2" aria-label="Fermer">
                    <X size={20} />
                  </button>
                </div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7360]">Catégorie</p>
                <div className="mb-5 flex flex-wrap gap-2">
                  {[{ key: 'all', label: 'Tout' }, ...cats.map(([c]) => ({ key: c, label: c }))].map((c) => {
                    const n = countFor(c.key, draftAvail, q);
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setDraftCat(c.key)}
                        className={clsx(
                          'inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold',
                          draftCat === c.key ? 'border-[#0a0a0a] bg-[#0a0a0a] text-white' : 'border-black/10',
                        )}
                      >
                        {c.label} <span className="text-[11px] opacity-70">{n}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7360]">Disponibilité</p>
                <div className="mb-6 flex flex-wrap gap-2">
                  {(
                    [
                      ['all', 'Toutes'],
                      ['in', 'En stock'],
                      ['low', 'Bientôt épuisé'],
                    ] as const
                  ).map(([k, label]) => {
                    const n = countFor(draftCat, k, q);
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setDraftAvail(k)}
                        className={clsx(
                          'inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold',
                          draftAvail === k ? 'border-[#c2531f] bg-[#c2531f] text-white' : 'border-black/10',
                        )}
                      >
                        {label} <span className="text-[11px] opacity-70">{n}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={applyFilters}
                  disabled={draftCount === 0}
                  className="flex h-12 w-full items-center justify-center rounded-full bg-[#c2531f] text-[15px] font-bold text-white disabled:opacity-40"
                  data-testid="sf-apply-filters"
                >
                  Voir {draftCount} produit{draftCount === 1 ? '' : 's'}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Cart sheet */}
        <AnimatePresence>
          {openCart && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6" onClick={() => setOpenCart(false)}>
              <motion.div
                initial={reduce ? false : { y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 24, opacity: 0 }}
                className="max-h-[85dvh] w-full max-w-lg overflow-auto rounded-t-[2rem] border border-black/5 bg-[#faf8f4] p-5 pb-safe sm:rounded-[2rem]"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-label="Commande"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-bold">Votre commande</h2>
                  <button type="button" onClick={() => setOpenCart(false)} className="rounded-full p-2" aria-label="Fermer">
                    <X size={20} />
                  </button>
                </div>
                <ul className="divide-y divide-black/[0.06]">
                  {lines.map((l) => (
                    <li key={l.product.id} className="flex items-center gap-3 py-3">
                      <ProductArt src={l.product.photo} name={l.product.name} category={l.product.category} className="h-14 w-14 shrink-0" rounded="rounded-2xl" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{l.product.name}</p>
                        <p className="text-xs text-[#7a6554] tabular">{formatMoney(l.product.sell_price, shop.currency)}</p>
                      </div>
                      <div className="flex items-center gap-1 rounded-full border border-black/10 bg-white p-0.5">
                        <button type="button" className="p-2" onClick={() => setQty(l.product.id, l.qty - 1)} aria-label="Moins">
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm font-bold tabular">{l.qty}</span>
                        <button type="button" className="p-2" onClick={() => setQty(l.product.id, l.qty + 1)} aria-label="Plus">
                          <Plus size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-end justify-between border-t border-black/[0.06] pt-4">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7360]">Total estimé</span>
                  <span className="font-[family-name:var(--font-fraunces)] text-3xl font-bold tabular text-[#c2531f]">
                    {formatMoney(cartTotal, shop.currency)}
                  </span>
                </div>
                {shop.whatsapp ? (
                  <a
                    href={storefrontWhatsAppUrl(shop, lines)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] text-[15px] font-bold text-[#0a0a0a]"
                  >
                    <MessageCircle size={18} /> Commander sur WhatsApp
                  </a>
                ) : (
                  <p className="mt-4 rounded-2xl border border-[#e0c48a] bg-[#fff6df] px-4 py-3 text-sm text-[#7a5a12]">
                    Cette boutique n&apos;a pas encore indiqué de numéro WhatsApp.
                  </p>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <footer className="border-t border-black/[0.06] py-10 text-center text-xs text-[#8a7360]">
          Propulsé par{' '}
          <Link href="/" className="font-semibold text-[#c2531f]">
            Boutik
          </Link>
          {' · '}commande via WhatsApp
        </footer>
      </div>
    </LayoutGroup>
  );
}
