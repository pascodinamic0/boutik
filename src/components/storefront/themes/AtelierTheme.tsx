'use client';
import { motion } from 'motion/react';
import { MessageCircle, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  CatalogueSkeleton,
  CategoryRail,
  ProductRail,
  PromoStrip,
  SfSection,
  StockBadge,
  StorefrontFooter,
  TrustStrip,
} from '@/components/storefront/StorefrontBlocks';
import { ProductArt } from '@/components/storefront/ProductArt';
import { StorefrontChrome, useStorefrontState } from '@/components/storefront/StorefrontShell';
import { formatMoney } from '@/lib/money';
import { bestsellers, featuredProduct, nouveautes, promoProducts, storefrontTrust } from '@/lib/storefront-present';
import { storefrontContactUrl, type PublicStorefront } from '@/lib/storefront';

/** Atelier — quiet luxury, monochrome, big photography, serif. */
export function AtelierTheme({ shop }: { shop: PublicStorefront }) {
  const state = useStorefrontState(shop);
  const { reduce, q, setQ, cat, setCat, list, cats, activeFilters, openFilters, openProduct, add } = state;
  const shortName = shop.name.length > 30 ? `${shop.name.slice(0, 28)}…` : shop.name;
  const trust = storefrontTrust(shop);
  const hero = featuredProduct(shop);
  const hits = bestsellers(shop, 5);
  const news = nouveautes(shop, 5);
  const promo = promoProducts(shop, 2);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 140);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <StorefrontChrome
      shop={shop}
      state={state}
      cartClassName="!border-black/10 !bg-[#111] !shadow-none"
      whatsappClassName="bg-white text-[#111]"
      sheetClassName="bg-[#f7f6f4] text-[#111]"
    >
      <div
        className="sf-root min-h-dvh bg-[#f7f6f4] text-[#111]"
        data-theme="atelier"
        style={{ ['--sf-header-h' as string]: '52px' }}
      >
        <header className="sticky top-0 z-40 border-b border-black/8 bg-[#f7f6f4]/88 pt-safe backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="truncate font-[family-name:var(--font-fraunces)] text-[16px] font-semibold tracking-tight" data-testid="sf-header-shop">
                {shortName}
              </p>
              <p className="truncate text-[10px] font-medium uppercase tracking-[0.2em] text-[#777]">
                {shop.commune || 'Atelier'}
              </p>
            </div>
            {shop.whatsapp && (
              <a
                href={storefrontContactUrl(shop)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 border border-black/15 bg-transparent px-4 text-[12px] font-semibold uppercase tracking-[0.08em] active:scale-95"
              >
                <MessageCircle size={14} /> Contacter
              </a>
            )}
          </div>
        </header>

        {/* First screen: XXL photo + quiet copy */}
        <section className="sf-atelier-hero sf-first-screen border-b border-black/8">
          <div className="sf-atelier-hero-media sf-stage-consent relative" data-testid="sf-stage">
            {hero && (
              <>
                <ProductArt
                  src={hero.photo}
                  name={hero.name}
                  category={hero.category}
                  rounded="rounded-none"
                  className="absolute inset-0 h-full w-full"
                  priority
                />
                <button
                  type="button"
                  onClick={() => openProduct(hero)}
                  className="sf-hero-price absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 border border-white/40 bg-white px-4 py-3 text-left sm:left-6 sm:right-auto sm:min-w-[260px]"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777]">{hero.category}</p>
                    <p className="mt-1 truncate font-[family-name:var(--font-fraunces)] text-[15px] font-semibold">{hero.name}</p>
                  </div>
                  <p className="shrink-0 font-[family-name:var(--font-fraunces)] text-[1.35rem] font-semibold tabular">{formatMoney(hero.sell_price, shop.currency)}</p>
                </button>
              </>
            )}
          </div>

          <div className="flex flex-col justify-center px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
            {shop.demo && (
              <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.18em] text-[#888]" data-testid="demo-banner">
                Démonstration
              </p>
            )}
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#888]">
              {shop.commune || 'Kinshasa'}
            </p>
            <h1
              className="mt-4 max-w-[12ch] font-[family-name:var(--font-fraunces)] text-[clamp(2.5rem,7vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.03em]"
              data-testid="storefront-name"
            >
              {shop.name}
            </h1>
            {shop.description && (
              <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[#555]">{shop.description}</p>
            )}
            <TrustStrip
              signals={trust}
              className="mt-6"
              chipClassName="rounded-none border-black/12 bg-transparent text-[#444]"
            />
            <div className="mt-8 flex flex-wrap gap-3">
              {shop.whatsapp && (
                <a
                  href={storefrontContactUrl(shop)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center bg-[#111] px-6 text-[12px] font-semibold uppercase tracking-[0.12em] text-white"
                >
                  Commander
                </a>
              )}
              <a
                href="#catalogue"
                className="inline-flex h-12 items-center border border-black/20 px-5 text-[12px] font-semibold uppercase tracking-[0.12em]"
              >
                Collection
              </a>
            </div>
            <div className="mt-10 flex items-baseline gap-3 border-t border-black/8 pt-6" data-testid="sf-en-rayon">
              <p className="font-[family-name:var(--font-fraunces)] text-[clamp(2.25rem,4vw,3.25rem)] font-semibold tabular leading-none">
                {shop.products.length}
              </p>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#888]">Pièces en collection</p>
                <p className="mt-1 text-[13px] text-[#666]">Sélection · commande WhatsApp</p>
              </div>
            </div>
          </div>
        </section>

        <SfSection className="border-b border-black/8 py-2" pad>
          <CategoryRail
            cats={cats}
            total={shop.products.length}
            cat={cat}
            setCat={setCat}
            sticky
            className="bg-[#f7f6f4]/95 backdrop-blur-md"
            activeClass="rounded-none bg-[#111] text-white"
            idleClass="rounded-none border border-black/10 bg-transparent text-[#333]"
          />
        </SfSection>

        <SfSection className="py-12" pad>
          <ProductRail
            title="Sélection"
            subtitle="Pièces mises en avant"
            products={hits}
            currency={shop.currency}
            onOpen={openProduct}
            onAdd={(p) => add(p, 1)}
            tone="light"
          />
        </SfSection>

        {promo.length > 0 && (
          <SfSection className="pb-8" pad>
            <PromoStrip
              products={promo}
              currency={shop.currency}
              onOpen={openProduct}
              className="rounded-none border-black/10 bg-[#ebe8e2] text-[#111]"
            />
          </SfSection>
        )}

        <SfSection className="py-8" pad>
          <ProductRail
            title="Nouveautés"
            subtitle="Ajouts récents"
            products={news}
            currency={shop.currency}
            onOpen={openProduct}
            onAdd={(p) => add(p, 1)}
            tone="light"
          />
        </SfSection>

        <main id="catalogue" className="scroll-mt-24 border-t border-black/8 bg-white pb-40 pt-10">
          <SfSection pad>
            <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-fraunces)] text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight">
                  Collection
                </h2>
                <p className="mt-2 text-[13px] text-[#666]">Toute la sélection, filtrable</p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[320px] sm:flex-row">
                <div className="relative flex-1">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Rechercher"
                    className="h-12 w-full border border-black/12 bg-transparent pl-10 pr-3 text-[15px] outline-none focus:border-black/40"
                    data-testid="storefront-search"
                  />
                </div>
                <button
                  type="button"
                  onClick={openFilters}
                  className="inline-flex h-12 items-center justify-center gap-2 border border-black/12 px-4 text-[11px] font-semibold uppercase tracking-[0.12em]"
                  data-testid="sf-filters"
                >
                  <SlidersHorizontal size={14} /> Filtres
                  {activeFilters > 0 && <span className="bg-[#111] px-1.5 text-white">{activeFilters}</span>}
                </button>
              </div>
            </div>

            {!ready ? (
              <CatalogueSkeleton tone="light" />
            ) : (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-3" data-testid="storefront-grid">
                {list.map((p, i) => (
                  <motion.li
                    key={p.id}
                    initial={reduce || i < 3 ? false : { opacity: 0, y: 24 }}
                    whileInView={reduce || i < 3 ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45 }}
                    className="flex flex-col"
                  >
                    <button type="button" onClick={() => openProduct(p)} className="group text-left" data-testid={`sf-product-${p.id}`}>
                      <div className="relative aspect-[4/5] overflow-hidden bg-[#e8e6e2]">
                        <ProductArt src={p.photo} name={p.name} category={p.category} rounded="rounded-none" className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]" />
                        <StockBadge availability={p.availability} className="absolute left-3 top-3 rounded-none" />
                      </div>
                      <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-[#888]">{p.category}</p>
                      <p className="mt-1.5 font-[family-name:var(--font-fraunces)] text-[clamp(1.05rem,2vw,1.2rem)] font-semibold leading-snug">{p.name}</p>
                      <p className="mt-3 font-[family-name:var(--font-fraunces)] text-[clamp(1.5rem,3vw,1.85rem)] font-semibold tabular leading-none">
                        {formatMoney(p.sell_price, shop.currency)}
                      </p>
                    </button>
                    <button
                      type="button"
                      disabled={p.availability === 'out'}
                      onClick={() => add(p, 1)}
                      className="mt-4 inline-flex h-11 items-center justify-center gap-1.5 border border-black/15 text-[11px] font-semibold uppercase tracking-[0.12em] disabled:opacity-35"
                    >
                      <Plus size={14} /> Ajouter
                    </button>
                  </motion.li>
                ))}
              </ul>
            )}
            {ready && list.length === 0 && <p className="py-16 text-center text-sm text-[#777]">Aucun article pour ces filtres.</p>}
          </SfSection>
        </main>

        <StorefrontFooter shop={shop} className="border-black/8 bg-[#f7f6f4]" mutedClassName="text-[#777]" />
      </div>
    </StorefrontChrome>
  );
}
