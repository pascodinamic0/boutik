'use client';
import clsx from 'clsx';
import { motion } from 'motion/react';
import { MessageCircle, Plus, Search, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { ProductArt } from '@/components/storefront/ProductArt';
import { StorefrontChrome, useStorefrontState } from '@/components/storefront/StorefrontShell';
import { formatMoney } from '@/lib/money';
import { availabilityLabel, storefrontContactUrl, type PublicStorefront } from '@/lib/storefront';

/** Marché — warm, tactile African-market grid. Fast on cheap Android. */
export function MarcheTheme({ shop }: { shop: PublicStorefront }) {
  const state = useStorefrontState(shop);
  const { reduce, q, setQ, cat, setCat, list, cats, activeFilters, openFilters, openProduct, add } = state;
  const featured = shop.products.filter((p) => p.availability !== 'out').slice(0, 3);

  return (
    <StorefrontChrome shop={shop} state={state}>
      <div
        className="sf-root min-h-dvh text-[#1a1208]"
        data-theme="marche"
        style={{
          background:
            'linear-gradient(180deg, #fff8ec 0%, #ffe8c4 28%, #ffd6a0 55%, #f5c478 100%)',
        }}
      >
        {/* Bold market strip */}
        <div className="bg-[#e85d04] pt-safe text-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-black tracking-tight" data-testid="sf-header-shop">
                {shop.name}
              </p>
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">
                {shop.commune || 'Marché'} · prix du jour
              </p>
            </div>
            {shop.whatsapp && (
              <a
                href={storefrontContactUrl(shop)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#1a1208] px-3 text-[12px] font-bold text-[#ffe8c4] active:scale-95"
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Dense hero — color blocks + product strip */}
        <section className="mx-auto max-w-5xl px-3 pb-4 pt-5 sm:px-5 sm:pt-7">
          {shop.demo && (
            <p className="mb-3 inline-flex rounded-md bg-[#1a1208] px-2.5 py-1 text-[11px] font-bold text-[#ffe8c4]" data-testid="demo-banner">
              Boutique de démonstration
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr] sm:gap-4">
            <div className="rounded-2xl bg-[#1a1208] p-5 text-[#ffe8c4] sm:p-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#f4a261]">
                {shop.commune || 'Kinshasa'} · ouvert
              </p>
              <h1
                className="mt-2 font-[family-name:var(--font-fraunces)] text-[clamp(2.1rem,7vw,3.6rem)] font-bold leading-[0.95] tracking-[-0.03em] text-white"
                data-testid="storefront-name"
              >
                {shop.name}
              </h1>
              {shop.description && (
                <p className="mt-3 max-w-sm text-[14px] leading-snug text-[#ffe8c4]/85">{shop.description}</p>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                {shop.whatsapp && (
                  <a
                    href={storefrontContactUrl(shop)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center rounded-lg bg-[#e85d04] px-5 text-sm font-black text-white"
                  >
                    Commander
                  </a>
                )}
                <a href="#catalogue" className="inline-flex h-11 items-center rounded-lg border-2 border-[#ffe8c4]/40 px-4 text-sm font-bold text-[#ffe8c4]">
                  Rayon →
                </a>
              </div>
              <div className="mt-6 flex items-end gap-3 border-t border-white/15 pt-4" data-testid="sf-en-rayon">
                <p className="font-[family-name:var(--font-fraunces)] text-[3rem] font-bold tabular leading-none text-[#f4a261]">
                  {shop.products.length}
                </p>
                <div className="pb-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#f4a261]">En rayon</p>
                  <p className="text-[13px] text-[#ffe8c4]/75">Touchez, ajoutez, WhatsApp</p>
                </div>
              </div>
            </div>

            {/* Image-dense market mosaic — stays dense at 820/1440 */}
            <div className="grid h-full min-h-[220px] grid-cols-2 grid-rows-2 gap-2 sm:min-h-[320px] sm:gap-2.5 lg:min-h-[380px]">
              {featured.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => openProduct(p)}
                  className={clsx(
                    'relative overflow-hidden rounded-xl active:scale-[0.98]',
                    i === 0 && 'row-span-2',
                    i === 2 && featured.length === 3 && 'col-span-1',
                  )}
                >
                  <ProductArt
                    src={p.photo}
                    name={p.name}
                    category={p.category}
                    rounded="rounded-none"
                    className="h-full w-full"
                    priority={i === 0}
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-2 pt-6 text-left">
                    <span className="line-clamp-1 text-[11px] font-bold text-white sm:text-[12px]">{p.name}</span>
                    <span className="block text-[12px] font-black tabular text-[#f4a261]">
                      {formatMoney(p.sell_price, shop.currency)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <main id="catalogue" className="mx-auto max-w-5xl scroll-mt-20 px-3 pb-40 pt-2 sm:px-5">
          <div className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9a6b3c]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Chercher au marché…"
                className="h-11 w-full rounded-xl border-2 border-[#1a1208]/10 bg-white pl-10 pr-3 text-[16px] font-medium outline-none focus:border-[#e85d04]"
                data-testid="storefront-search"
              />
            </div>
            <button
              type="button"
              onClick={openFilters}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border-2 border-[#1a1208]/10 bg-white px-3.5 text-sm font-bold"
              data-testid="sf-filters"
            >
              <SlidersHorizontal size={15} />
              {activeFilters > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-[#e85d04] px-1 text-[11px] font-black text-white">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          <div className="no-scrollbar -mx-3 mb-4 flex gap-1.5 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
            {[{ key: 'all', label: 'Tout', n: shop.products.length }, ...cats.map(([c, n]) => ({ key: c, label: c, n }))].map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCat(c.key)}
                className={clsx(
                  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[12px] font-bold active:scale-95',
                  cat === c.key ? 'bg-[#e85d04] text-white' : 'bg-[#1a1208]/8 text-[#1a1208]',
                )}
              >
                {c.label}
                <span className={clsx('rounded px-1 text-[10px] tabular', cat === c.key ? 'bg-white/20' : 'bg-black/10')}>{c.n}</span>
              </button>
            ))}
          </div>

          {/* Dense 2-col market grid — tactile, no 3D */}
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4" data-testid="storefront-grid">
            {list.map((p, i) => (
              <motion.li
                key={p.id}
                initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.22, delay: Math.min(i * 0.025, 0.15) }}
                className="overflow-hidden rounded-xl bg-white"
              >
                <button type="button" onClick={() => openProduct(p)} className="w-full text-left" data-testid={`sf-product-${p.id}`}>
                  <div className="relative aspect-square overflow-hidden bg-[#ffe8c4]">
                    <ProductArt src={p.photo} name={p.name} category={p.category} rounded="rounded-none" className="h-full w-full" />
                    <span
                      className={clsx(
                        'absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase',
                        p.availability === 'in' && 'bg-emerald-600 text-white',
                        p.availability === 'low' && 'bg-[#f4a261] text-[#1a1208]',
                        p.availability === 'out' && 'bg-stone-500 text-white',
                      )}
                    >
                      {availabilityLabel(p.availability)}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <p className="line-clamp-2 min-h-[2.4em] text-[12.5px] font-bold leading-snug">{p.name}</p>
                    <p className="mt-1 text-[15px] font-black tabular text-[#e85d04]">
                      {formatMoney(p.sell_price, shop.currency)}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  disabled={p.availability === 'out'}
                  onClick={(e) => {
                    const card = e.currentTarget.parentElement?.querySelector('[class*="aspect"]') as HTMLElement | null;
                    add(p, 1, card);
                  }}
                  className="mx-2.5 mb-2.5 flex h-10 w-[calc(100%-1.25rem)] items-center justify-center gap-1 rounded-lg bg-[#1a1208] text-[12px] font-black text-[#ffe8c4] disabled:opacity-35"
                >
                  <Plus size={14} /> Ajouter
                </button>
              </motion.li>
            ))}
          </ul>
        </main>

        <footer className="border-t border-[#1a1208]/10 py-8 text-center text-xs font-semibold text-[#9a6b3c]">
          Propulsé par <Link href="/" className="font-black text-[#e85d04]">Boutik</Link> · thème Marché
        </footer>
      </div>
    </StorefrontChrome>
  );
}
