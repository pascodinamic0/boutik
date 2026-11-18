'use client';
import clsx from 'clsx';
import { motion, useScroll, useTransform } from 'motion/react';
import { MessageCircle, Plus, Search, SlidersHorizontal } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRef } from 'react';
import { ProductArt } from '@/components/storefront/ProductArt';
import { StorefrontChrome, useStorefrontState } from '@/components/storefront/StorefrontShell';
import { formatMoney } from '@/lib/money';
import { availabilityLabel, storefrontContactUrl, type PublicStorefront } from '@/lib/storefront';

const StorefrontStage = dynamic(
  () => import('@/components/storefront/StorefrontStage').then((m) => m.StorefrontStage),
  { ssr: false, loading: () => <div className="mx-auto h-[280px] w-full max-w-md animate-pulse rounded-[2rem] bg-[#efe6da]/40 sm:h-[360px]" /> },
);

/** Cinéma — scroll-driven editorial with 3D product stage. */
export function CinemaTheme({ shop }: { shop: PublicStorefront }) {
  const state = useStorefrontState(shop);
  const { reduce, q, setQ, cat, setCat, list, cats, activeFilters, openFilters, openProduct, add } = state;
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroFade = useTransform(scrollYProgress, [0, 0.55, 0.9], [1, 1, 0]);
  const titleY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);
  const shortName = shop.name.length > 28 ? `${shop.name.slice(0, 26)}…` : shop.name;

  return (
    <StorefrontChrome shop={shop} state={state}>
      <div className="sf-root sf-cinematic min-h-dvh text-[#0a0a0a]" data-theme="cinema">
        <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-[#faf8f4]/72 pt-safe backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold tracking-tight" data-testid="sf-header-shop">
                {shortName}
              </p>
              <p className="truncate text-[11px] font-medium uppercase tracking-[0.14em] text-[#8a7360]">
                {shop.commune || 'Catalogue'} · en ligne
              </p>
            </div>
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
        </header>

        <section ref={heroRef} className="relative">
          <motion.div style={reduce ? undefined : { opacity: heroFade }} className="relative overflow-hidden">
            {/* Mobile: copy first (name+CTA in first viewport). Desktop: copy | contained stage */}
            <div className="mx-auto grid max-w-6xl items-center gap-4 px-4 pb-6 pt-6 sm:gap-6 sm:px-6 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8 lg:overflow-hidden lg:px-8 lg:pb-8 lg:pt-10">
              <motion.div style={reduce ? undefined : { y: titleY }} className="relative z-10 order-1 min-w-0 lg:pr-2">
                {shop.demo && (
                  <p className="mb-3 inline-flex rounded-full border border-[#e0c48a] bg-[#fff6df] px-3 py-1 text-[11px] font-semibold text-[#7a5a12]" data-testid="demo-banner">
                    Boutique de démonstration
                  </p>
                )}
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a7360]">{shop.commune || 'Kinshasa'} · catalogue</p>
                <h1
                  className="mt-2 max-w-[12ch] font-display text-[clamp(2.15rem,7.5vw,4.75rem)] font-bold leading-[0.92] tracking-[-0.04em]"
                  data-testid="storefront-name"
                >
                  {shop.name}
                </h1>
                {shop.description && (
                  <p className="mt-3 line-clamp-3 max-w-md text-[14px] leading-relaxed text-[#4a382c] sm:mt-5 sm:line-clamp-none sm:text-[16px]">
                    {shop.description}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-7">
                  {shop.whatsapp && (
                    <a href={storefrontContactUrl(shop)} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-full bg-[#0a0a0a] px-5 text-sm font-bold !text-white sm:h-12 sm:px-6">
                      Commander →
                    </a>
                  )}
                  <a href="#catalogue" className="inline-flex h-11 items-center rounded-full border border-[#0a0a0a]/15 px-4 text-sm font-semibold sm:h-12 sm:px-5">
                    Voir le rayon
                  </a>
                </div>
                <div className="mt-6 flex items-end gap-3 border-t border-black/[0.06] pt-4 sm:mt-8 sm:gap-4 sm:pt-5" data-testid="sf-en-rayon">
                  <p className="shrink-0 font-display text-[clamp(2.25rem,5vw,3.75rem)] font-bold tabular leading-none text-[#c2531f]">
                    {shop.products.length}
                  </p>
                  <div className="min-w-0 flex-1 pb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7360]">En rayon</p>
                    <p className="mt-0.5 text-sm leading-snug text-[#4a382c]">Produits · commande WhatsApp, sans paiement en ligne</p>
                  </div>
                </div>
              </motion.div>
              <div className="order-2 min-w-0 overflow-hidden">
                <StorefrontStage products={shop.products} currency={shop.currency} />
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
            <button type="button" onClick={openFilters} className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-black/[0.08] bg-white/80 px-5 text-sm font-semibold" data-testid="sf-filters">
              <SlidersHorizontal size={16} /> Filtres
              {activeFilters > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c2531f] px-1.5 text-[11px] font-bold text-white">{activeFilters}</span>}
            </button>
          </div>

          <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {[{ key: 'all', label: 'Tout', n: shop.products.length }, ...cats.map(([c, n]) => ({ key: c, label: c, n }))].map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCat(c.key)}
                className={clsx(
                  'inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-semibold active:scale-95',
                  cat === c.key ? 'bg-[#0a0a0a] text-white' : 'border border-black/[0.08] bg-white/70 text-[#4a382c]',
                )}
              >
                {c.label}
                <span className={clsx('rounded-full px-1.5 py-0.5 text-[11px] tabular', cat === c.key ? 'bg-white/15' : 'bg-black/[0.04]')}>{c.n}</span>
              </button>
            ))}
          </div>

          <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4" data-testid="storefront-grid">
            {list.map((p, i) => (
              <motion.li
                key={p.id}
                initial={reduce ? false : { opacity: 0, y: 28 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.24) }}
                className="flex flex-col"
              >
                <button type="button" onClick={() => openProduct(p)} className="text-left" data-testid={`sf-product-${p.id}`}>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[#efe6da]">
                    <ProductArt src={p.photo} name={p.name} category={p.category} rounded="rounded-none" className="h-full w-full" />
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
                  </div>
                  <p className="mt-3 line-clamp-2 text-[13.5px] font-semibold leading-snug">{p.name}</p>
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
                  className="mt-3 inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-[#0a0a0a] text-[13px] font-bold text-white disabled:opacity-35"
                >
                  <Plus size={15} /> Ajouter
                </button>
              </motion.li>
            ))}
          </ul>
        </main>

        <footer className="border-t border-black/[0.06] py-10 text-center text-xs text-[#8a7360]">
          Propulsé par <Link href="/" className="font-semibold text-[#c2531f]">Boutik</Link> · thème Cinéma
        </footer>
      </div>
    </StorefrontChrome>
  );
}
