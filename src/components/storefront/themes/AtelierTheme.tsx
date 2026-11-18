'use client';
import clsx from 'clsx';
import { motion } from 'motion/react';
import { MessageCircle, Plus, Search, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { ProductArt } from '@/components/storefront/ProductArt';
import { StorefrontChrome, useStorefrontState } from '@/components/storefront/StorefrontShell';
import { formatMoney } from '@/lib/money';
import { availabilityLabel, storefrontContactUrl, type PublicStorefront } from '@/lib/storefront';

/** Atelier — minimal monochrome luxury. Huge photography, slow elegant motion. */
export function AtelierTheme({ shop }: { shop: PublicStorefront }) {
  const state = useStorefrontState(shop);
  const { reduce, q, setQ, cat, setCat, list, cats, activeFilters, openFilters, openProduct, add } = state;
  const hero = shop.products.find((p) => p.availability !== 'out' && p.photo) ?? shop.products[0];

  return (
    <StorefrontChrome shop={shop} state={state}>
      <div className="sf-root min-h-dvh bg-[#f7f6f4] text-[#111]" data-theme="atelier">
        <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-[#f7f6f4]/85 pt-safe backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div className="min-w-0">
              <p
                className="truncate font-[family-name:var(--font-fraunces)] text-[17px] font-medium tracking-[-0.02em]"
                data-testid="sf-header-shop"
              >
                {shop.name}
              </p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.22em] text-[#888]">
                {shop.commune || 'Atelier'}
              </p>
            </div>
            {shop.whatsapp && (
              <a
                href={storefrontContactUrl(shop)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-2 border border-[#111] px-4 text-[11px] font-medium uppercase tracking-[0.14em] text-[#111] transition-colors hover:bg-[#111] hover:text-white"
              >
                <MessageCircle size={13} /> Contacter
              </a>
            )}
          </div>
        </header>

        {/* Full-bleed photography hero — layout via .sf-atelier-hero (plain CSS) */}
        <section className="relative">
          <div className="sf-atelier-hero">
            <div className="sf-atelier-hero-media">
              {hero && (
                <ProductArt
                  src={hero.photo}
                  name={hero.name}
                  category={hero.category}
                  rounded="rounded-none"
                  className="h-full w-full"
                  priority
                />
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#f7f6f4]/50" />
            </div>
            <div className="flex flex-col justify-center px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
              {shop.demo && (
                <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#888]" data-testid="demo-banner">
                  Démonstration
                </p>
              )}
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#888]">
                {shop.commune || 'Kinshasa'}
              </p>
              <h1
                className="mt-4 max-w-[11ch] font-display text-[clamp(2.6rem,7vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.035em]"
                data-testid="storefront-name"
              >
                {shop.name}
              </h1>
              {shop.description && (
                <p className="mt-6 max-w-sm text-[15px] font-light leading-relaxed text-[#555]">{shop.description}</p>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                {shop.whatsapp && (
                  <a
                    href={storefrontContactUrl(shop)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center bg-[#111] px-7 text-[12px] font-medium uppercase tracking-[0.16em] !text-white"
                  >
                    Commander
                  </a>
                )}
                <a
                  href="#catalogue"
                  className="inline-flex h-12 items-center border border-[#111]/25 px-6 text-[12px] font-medium uppercase tracking-[0.16em]"
                >
                  Collection
                </a>
              </div>
              <div className="mt-12 border-t border-black/[0.08] pt-6" data-testid="sf-en-rayon">
                <p className="font-display text-[3.25rem] font-semibold tabular leading-none tracking-tight">
                  {shop.products.length}
                </p>
                <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[#888]">Pièces en collection</p>
                <p className="mt-1 text-sm font-light text-[#666]">Sélection · commande WhatsApp</p>
              </div>
            </div>
          </div>
        </section>

        <main id="catalogue" className="mx-auto max-w-5xl scroll-mt-24 px-5 pb-44 pt-12 sm:px-8">
          <div className="mb-8 flex flex-col gap-4 border-b border-black/[0.06] pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#888]">Collection</p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Sélection du jour
              </h2>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher…"
                  className="h-11 w-full border border-black/[0.1] bg-transparent pl-9 pr-3 text-[15px] outline-none focus:border-[#111]"
                  data-testid="storefront-search"
                />
              </div>
              <button
                type="button"
                onClick={openFilters}
                className="inline-flex h-11 items-center gap-2 border border-black/[0.1] px-4 text-[11px] font-medium uppercase tracking-[0.12em]"
                data-testid="sf-filters"
              >
                <SlidersHorizontal size={14} /> Filtres
                {activeFilters > 0 && <span className="text-[#111]">{activeFilters}</span>}
              </button>
            </div>
          </div>

          <div className="no-scrollbar mb-10 flex gap-6 overflow-x-auto border-b border-black/[0.06] pb-3">
            {[{ key: 'all', label: 'Tout', n: shop.products.length }, ...cats.map(([c, n]) => ({ key: c, label: c, n }))].map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCat(c.key)}
                className={clsx(
                  'shrink-0 pb-3 text-[12px] font-medium uppercase tracking-[0.14em] transition-colors',
                  cat === c.key ? 'border-b-2 border-[#111] text-[#111]' : 'text-[#999]',
                )}
              >
                {c.label} <span className="tabular opacity-60">{c.n}</span>
              </button>
            ))}
          </div>

          {/* Editorial vertical stack / wide photography cards */}
          <ul className="flex flex-col gap-16 sm:gap-20" data-testid="storefront-grid">
            {list.map((p, i) => (
              <motion.li
                key={p.id}
                initial={reduce ? false : { opacity: 0, y: 40 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : 0.05 }}
                className={clsx(
                  'grid items-center gap-6 sm:gap-10',
                  i % 2 === 0 ? 'lg:grid-cols-[1.15fr_0.85fr]' : 'lg:grid-cols-[0.85fr_1.15fr]',
                )}
              >
                <button
                  type="button"
                  onClick={() => openProduct(p)}
                  className={clsx('relative overflow-hidden bg-[#e8e6e2]', i % 2 === 1 && 'lg:order-2')}
                  data-testid={`sf-product-${p.id}`}
                >
                  <div className="aspect-[4/5] sm:aspect-[5/6]">
                    <ProductArt src={p.photo} name={p.name} category={p.category} rounded="rounded-none" className="h-full w-full" />
                  </div>
                  <span
                    className={clsx(
                      'absolute left-4 top-4 text-[10px] font-medium uppercase tracking-[0.16em]',
                      p.availability === 'out' ? 'text-white/70' : 'text-white',
                    )}
                  >
                    {availabilityLabel(p.availability)}
                  </span>
                </button>
                <div className={clsx('px-1 sm:px-2', i % 2 === 1 && 'lg:order-1 lg:text-right')}>
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#999]">{p.category || 'Pièce'}</p>
                  <button type="button" onClick={() => openProduct(p)} className="mt-2 text-left lg:text-inherit">
                    <h3 className="font-display text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em]">
                      {p.name}
                    </h3>
                  </button>
                  <p className="mt-4 font-display text-2xl font-semibold tabular tracking-tight">
                    {formatMoney(p.sell_price, shop.currency)}
                  </p>
                  <button
                    type="button"
                    disabled={p.availability === 'out'}
                    onClick={(e) => {
                      const card = e.currentTarget.closest('li')?.querySelector('[class*="aspect"]') as HTMLElement | null;
                      add(p, 1, card);
                    }}
                    className="mt-6 inline-flex h-11 items-center gap-2 border border-[#111] px-5 text-[11px] font-medium uppercase tracking-[0.14em] disabled:opacity-30"
                  >
                    <Plus size={13} /> Ajouter
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        </main>

        <footer className="border-t border-black/[0.06] py-12 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-[#999]">
          Propulsé par <Link href="/" className="text-[#111]">Boutik</Link> · thème Atelier
        </footer>
      </div>
    </StorefrontChrome>
  );
}
