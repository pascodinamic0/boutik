'use client';
import clsx from 'clsx';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { MessageCircle, Minus, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Logo } from '@/components/Logo';
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

  useCatalogueOffline(shop);

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

  const add = (p: PublicProduct) => {
    if (p.availability === 'out') return;
    setCart((c) => ({ ...c, [p.id]: (c[p.id] ?? 0) + 1 }));
  };
  const setQty = (id: string, qty: number) => {
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
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

  const enter = reduce ? undefined : { opacity: 0, y: 16 };
  const show = reduce ? undefined : { opacity: 1, y: 0 };

  return (
    <div className="sf-root min-h-dvh text-[#1c120c]">
      <InstallShopPrompt shop={shop} />

      <header className="sticky top-0 z-40 border-b border-[#e5d8c8]/bg-[#fffaf3]/pt-safe backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="opacity-90 transition hover:opacity-100" aria-label="Boutik">
            <Logo size={30} />
          </Link>
          {shop.whatsapp && (
            <a
              href={storefrontContactUrl(shop)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#128C7E] px-4 text-sm font-semibold text-white active:scale-95"
            >
              <MessageCircle size={16} /> Contacter
            </a>
          )}
        </div>
      </header>

      {/* Visual-first hero: product imagery leads before copy */}
      <motion.div
        initial={enter}
        animate={show}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden"
        aria-hidden={false}
      >
        <div className="grid h-[44vw] min-h-[190px] max-h-[360px] grid-cols-3 grid-rows-2 gap-px bg-[#e5d8c8] sm:h-[26vw] sm:max-h-[400px] lg:grid-cols-4">
          {shop.products
            .filter((p) => p.availability !== 'out')
            .slice(0, 4)
            .map((p, i) => (
              <div
                key={p.id}
                className={clsx(
                  'relative overflow-hidden bg-[#1c120c]',
                  i === 0 && 'col-span-2 row-span-2',
                  i === 3 && 'col-span-2 hidden lg:block',
                )}
              >
                <ProductArt
                  src={p.photo}
                  name={p.name}
                  category={p.category}
                  rounded="rounded-none"
                  className="h-full w-full scale-105 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1c120c]/40 via-transparent to-transparent" />
              </div>
            ))}
        </div>
      </motion.div>

      <main className="mx-auto max-w-6xl px-4 pb-36 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        {shop.demo && (
          <p className="mb-5 inline-flex rounded-full border border-[#e0c48a] bg-[#fff6df] px-3 py-1 text-[12px] font-semibold text-[#7a5a12]" data-testid="demo-banner">
            Boutique de démonstration
          </p>
        )}

        <motion.section
          initial={enter}
          animate={show}
          transition={{ duration: 0.45, delay: reduce ? 0 : 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-end"
        >
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8a7360]">
              {shop.commune || 'Catalogue'} · Boutik
            </p>
            <h1
              className="mt-2 max-w-xl font-[family-name:var(--font-fraunces)] text-[clamp(2.4rem,6vw,4.25rem)] font-bold leading-[0.95] tracking-[-0.03em] text-[#1c120c]"
              data-testid="storefront-name"
            >
              {shop.name}
            </h1>
            {shop.description && (
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#5c4636] sm:text-base">{shop.description}</p>
            )}
            {shop.whatsapp && (
              <a
                href={storefrontContactUrl(shop)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex h-12 items-center gap-2 bg-[#1c120c] px-5 text-sm font-bold text-[#fffaf3] active:scale-[0.98]"
              >
                <MessageCircle size={16} /> Commander sur WhatsApp
              </a>
            )}
          </div>
          <div className="hidden border border-[#e5d8c8] bg-[#fffaf3] p-5 lg:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7360]">En rayon</p>
            <p className="mt-2 font-[family-name:var(--font-fraunces)] text-4xl font-bold tabular leading-none text-[#c2531f]">
              {shop.products.length}
            </p>
            <p className="mt-2 text-sm text-[#5c4636]">produits · commande via WhatsApp, sans paiement en ligne.</p>
          </div>
        </motion.section>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a7b64]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un produit…"
              className="h-12 w-full border border-[#e0d0be] bg-[#fffaf3] pl-11 pr-4 text-[16px] outline-none focus:border-[#c2531f] focus:ring-4 focus:ring-[#c2531f]/15"
              data-testid="storefront-search"
            />
          </div>
          <button
            type="button"
            onClick={openFilters}
            className="inline-flex h-12 items-center justify-center gap-2 border border-[#e0d0be] bg-[#fffaf3] px-4 text-sm font-semibold text-[#1c120c] active:scale-[0.99]"
            data-testid="sf-filters"
          >
            <SlidersHorizontal size={16} />
            Filtres
            {activeFilters > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c2531f] px-1.5 text-[11px] font-bold text-white">{activeFilters}</span>
            )}
          </button>
        </div>

        <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {[{ key: 'all', label: 'Tout', n: shop.products.length }, ...cats.map(([c, n]) => ({ key: c, label: c, n }))].map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCat(c.key)}
              className={clsx(
                'inline-flex h-9 shrink-0 items-center gap-1.5 border px-3.5 text-[13px] font-semibold transition',
                cat === c.key ? 'border-[#1c120c] bg-[#1c120c] text-[#fffaf3]' : 'border-[#e0d0be] bg-transparent text-[#6b5646]',
              )}
            >
              {c.label}
              <span className={clsx('text-[11px] tabular', cat === c.key ? 'text-white/70' : 'text-[#9a7b64]')}>{c.n}</span>
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="border border-dashed border-[#e0d0be] py-20 text-center">
            <p className="font-[family-name:var(--font-fraunces)] text-2xl font-bold">Aucun produit</p>
            <p className="mt-2 text-sm text-[#7a6554]">Élargissez la recherche ou les filtres.</p>
            <button type="button" onClick={() => { setCat('all'); setAvail('all'); setQ(''); }} className="mt-5 text-sm font-bold text-[#c2531f]">
              Réinitialiser
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4" data-testid="storefront-grid">
            {list.map((p, i) => (
              <motion.li
                key={p.id}
                initial={enter}
                animate={show}
                transition={{ duration: 0.35, delay: reduce ? 0 : Math.min(i * 0.03, 0.24), ease: [0.22, 1, 0.36, 1] }}
                className="group flex flex-col border border-[#e5d8c8] bg-[#fffaf3]"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <ProductArt src={p.photo} name={p.name} category={p.category} rounded="rounded-none" className="h-full w-full transition duration-500 group-hover:scale-[1.03]" />
                  <span
                    className={clsx(
                      'absolute left-2.5 top-2.5 border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                      p.availability === 'in' && 'border-emerald-700/30 bg-emerald-700 text-white',
                      p.availability === 'low' && 'border-amber-700/30 bg-[#d4a017] text-[#1c120c]',
                      p.availability === 'out' && 'border-stone-500/40 bg-stone-600 text-white',
                    )}
                  >
                    {availabilityLabel(p.availability)}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3 sm:p-3.5">
                  <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-[#1c120c] sm:text-sm">{p.name}</p>
                  <p className="font-[family-name:var(--font-fraunces)] text-[clamp(1.15rem,3vw,1.45rem)] font-bold tabular leading-none text-[#c2531f]">
                    {formatMoney(p.sell_price, shop.currency)}
                  </p>
                  <button
                    type="button"
                    disabled={p.availability === 'out'}
                    onClick={() => add(p)}
                    className="mt-auto inline-flex h-11 items-center justify-center gap-1.5 bg-[#1c120c] text-[13px] font-bold text-[#fffaf3] transition enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <Plus size={15} /> Ajouter
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </main>

      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={reduce ? false : { y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e5d8c8] bg-[#fffaf3]/p-3 pb-safe"
          >
            <div className="mx-auto flex max-w-6xl items-center gap-3">
              <button
                type="button"
                onClick={() => setOpenCart(true)}
                className="flex min-w-0 flex-1 items-center gap-3 bg-[#1c120c] px-4 py-3 text-left text-white active:scale-[0.99]"
                data-testid="open-cart"
              >
                <span className="flex h-8 w-8 items-center justify-center bg-[#c2531f] text-sm font-bold">{cartCount}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">Voir la commande</span>
                  <span className="block text-xs text-white/65 tabular">{formatMoney(cartTotal, shop.currency)}</span>
                </span>
              </button>
              {shop.whatsapp && (
                <a
                  href={storefrontWhatsAppUrl(shop, lines)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 shrink-0 items-center gap-2 bg-[#128C7E] px-4 text-sm font-bold text-white"
                  data-testid="whatsapp-order"
                >
                  <MessageCircle size={18} /> WhatsApp
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {filtersOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6" onClick={() => setFiltersOpen(false)}>
            <motion.div
              initial={reduce ? false : { y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              className="w-full max-w-lg border border-[#e5d8c8] bg-[#fffaf3] p-5 pb-safe sm:rounded-none"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-label="Filtres"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-bold">Filtres</h2>
                <button type="button" onClick={() => setFiltersOpen(false)} className="p-2" aria-label="Fermer">
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
                        'inline-flex h-9 items-center gap-1.5 border px-3 text-[13px] font-semibold',
                        draftCat === c.key ? 'border-[#1c120c] bg-[#1c120c] text-white' : 'border-[#e0d0be]',
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
                        'inline-flex h-9 items-center gap-1.5 border px-3 text-[13px] font-semibold',
                        draftAvail === k ? 'border-[#c2531f] bg-[#c2531f] text-white' : 'border-[#e0d0be]',
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
                className="flex h-12 w-full items-center justify-center bg-[#c2531f] text-[15px] font-bold text-white disabled:opacity-40"
                data-testid="sf-apply-filters"
              >
                Voir {draftCount} produit{draftCount === 1 ? '' : 's'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openCart && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6" onClick={() => setOpenCart(false)}>
            <motion.div
              initial={reduce ? false : { y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              className="max-h-[85dvh] w-full max-w-lg overflow-auto border border-[#e5d8c8] bg-[#fffaf3] p-5 pb-safe"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-label="Commande"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-bold">Votre commande</h2>
                <button type="button" onClick={() => setOpenCart(false)} className="p-2" aria-label="Fermer">
                  <X size={20} />
                </button>
              </div>
              <ul className="divide-y divide-[#eadfce]">
                {lines.map((l) => (
                  <li key={l.product.id} className="flex items-center gap-3 py-3">
                    <ProductArt src={l.product.photo} name={l.product.name} category={l.product.category} className="h-14 w-14 shrink-0" rounded="rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{l.product.name}</p>
                      <p className="text-xs text-[#7a6554] tabular">{formatMoney(l.product.sell_price, shop.currency)}</p>
                    </div>
                    <div className="flex items-center gap-1 border border-[#e0d0be] p-0.5">
                      <button type="button" className="p-1.5" onClick={() => setQty(l.product.id, l.qty - 1)} aria-label="Moins">
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold tabular">{l.qty}</span>
                      <button type="button" className="p-1.5" onClick={() => setQty(l.product.id, l.qty + 1)} aria-label="Plus">
                        <Plus size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-end justify-between border-t border-[#eadfce] pt-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7360]">Total estimé</span>
                <span className="font-[family-name:var(--font-fraunces)] text-3xl font-bold tabular text-[#c2531f]">{formatMoney(cartTotal, shop.currency)}</span>
              </div>
              {shop.whatsapp ? (
                <a
                  href={storefrontWhatsAppUrl(shop, lines)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex h-12 w-full items-center justify-center gap-2 bg-[#128C7E] text-[15px] font-bold text-white"
                >
                  <MessageCircle size={18} /> Commander sur WhatsApp
                </a>
              ) : (
                <p className="mt-4 border border-[#e0c48a] bg-[#fff6df] px-4 py-3 text-sm text-[#7a5a12]">
                  Cette boutique n&apos;a pas encore indiqué de numéro WhatsApp.
                </p>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="border-t border-[#e5d8c8] bg-[#f3ebe0]/py-8 text-center text-xs text-[#8a7360]">
        Propulsé par{' '}
        <Link href="/" className="font-semibold text-[#c2531f]">
          Boutik
        </Link>
        {' · '}commande via WhatsApp
      </footer>
    </div>
  );
}
