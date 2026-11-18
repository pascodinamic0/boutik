'use client';
import clsx from 'clsx';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { MessageCircle, Minus, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { InstallShopPrompt } from '@/components/storefront/InstallShopPrompt';
import { ProductArt } from '@/components/storefront/ProductArt';
import { formatMoney } from '@/lib/money';
import {
  availabilityLabel,
  storefrontWhatsAppUrl,
  type CartLine,
  type PublicProduct,
  type PublicStorefront,
} from '@/lib/storefront';

const CACHE_KEY = (slug: string) => `boutik.sf.catalogue:${slug}`;

export function useCatalogueOffline(shop: PublicStorefront) {
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

export function useStorefrontState(shop: PublicStorefront) {
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

  return {
    reduce,
    q,
    setQ,
    cat,
    setCat,
    avail,
    setAvail,
    filtersOpen,
    setFiltersOpen,
    draftCat,
    setDraftCat,
    draftAvail,
    setDraftAvail,
    cart,
    openCart,
    setOpenCart,
    active,
    setActive,
    sheetQty,
    setSheetQty,
    cartBarRef,
    cats,
    countFor,
    list,
    draftCount,
    activeFilters,
    lines,
    cartCount,
    cartTotal,
    add,
    setQty,
    openProduct,
    openFilters,
    applyFilters,
  };
}

export type StorefrontState = ReturnType<typeof useStorefrontState>;

export function StorefrontChrome({
  shop,
  state,
  children,
  cartClassName,
  whatsappClassName = 'bg-[#25D366] text-[#0a0a0a]',
  sheetClassName = 'bg-[#faf8f4]',
}: {
  shop: PublicStorefront;
  state: StorefrontState;
  children: ReactNode;
  cartClassName?: string;
  whatsappClassName?: string;
  sheetClassName?: string;
}) {
  const {
    reduce,
    filtersOpen,
    setFiltersOpen,
    draftCat,
    setDraftCat,
    draftAvail,
    setDraftAvail,
    openCart,
    setOpenCart,
    active,
    setActive,
    sheetQty,
    setSheetQty,
    cartBarRef,
    cats,
    countFor,
    draftCount,
    lines,
    cartCount,
    cartTotal,
    add,
    setQty,
    applyFilters,
    q,
  } = state;

  return (
    <>
      <InstallShopPrompt shop={shop} />
      {children}

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
              <div
                className={clsx(
                  'flex items-center gap-2 rounded-full border border-black/10 bg-[#0a0a0a] p-1.5 pl-2 shadow-[0_20px_50px_rgb(0_0_0/0.25)]',
                  cartClassName,
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenCart(true)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-full px-3 py-2 text-left text-white active:scale-[0.99]"
                  data-testid="open-cart"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c2531f] text-sm font-bold tabular">{cartCount}</span>
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
                    className={clsx('inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-bold active:scale-95', whatsappClassName)}
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

      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-6" onClick={() => setActive(null)}>
            <motion.div
              initial={reduce ? false : { y: 48, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 32, opacity: 0 }}
              className={clsx('max-h-[92dvh] w-full max-w-lg overflow-auto rounded-t-[2rem] pb-safe sm:rounded-[2rem]', sheetClassName)}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-label={active.name}
              data-testid="sf-product-sheet"
            >
              <div className="relative aspect-[5/4] overflow-hidden bg-[#efe6da] sm:aspect-[16/11]">
                <ProductArt src={active.photo} name={active.name} category={active.category} rounded="rounded-none" className="h-full w-full" priority />
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90"
                  aria-label="Fermer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7360]">{active.category}</p>
                <h2 className="mt-1 font-[family-name:var(--font-fraunces)] text-2xl font-bold leading-tight sm:text-3xl">{active.name}</h2>
                <p className="mt-3 font-[family-name:var(--font-fraunces)] text-4xl font-bold tabular text-[#c2531f]">
                  {formatMoney(active.sell_price, shop.currency)}
                </p>
                <p className="mt-2 text-sm text-[#7a6554]">
                  {availabilityLabel(active.availability)} · {active.unit}
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white p-1">
                    <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full" onClick={() => setSheetQty((n) => Math.max(1, n - 1))} aria-label="Moins">
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center text-base font-bold tabular">{sheetQty}</span>
                    <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full" onClick={() => setSheetQty((n) => n + 1)} aria-label="Plus">
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
                    className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#0a0a0a] text-sm font-bold text-white disabled:opacity-40"
                  >
                    Ajouter · {formatMoney(active.sell_price * sheetQty, shop.currency)}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {filtersOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6" onClick={() => setFiltersOpen(false)}>
            <motion.div
              initial={reduce ? false : { y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              className={clsx('w-full max-w-lg rounded-t-[2rem] border border-black/5 p-5 pb-safe sm:rounded-[2rem]', sheetClassName)}
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

      <AnimatePresence>
        {openCart && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6" onClick={() => setOpenCart(false)}>
            <motion.div
              initial={reduce ? false : { y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              className={clsx('max-h-[85dvh] w-full max-w-lg overflow-auto rounded-t-[2rem] border border-black/5 p-5 pb-safe sm:rounded-[2rem]', sheetClassName)}
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
                <span className="font-[family-name:var(--font-fraunces)] text-3xl font-bold tabular text-[#c2531f]">{formatMoney(cartTotal, shop.currency)}</span>
              </div>
              {shop.whatsapp ? (
                <a
                  href={storefrontWhatsAppUrl(shop, lines)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clsx('mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold', whatsappClassName)}
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
    </>
  );
}
