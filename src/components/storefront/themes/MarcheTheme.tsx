'use client';
import clsx from 'clsx';
import { motion } from 'motion/react';
import { MapPin, MessageCircle, Plus, Search, SlidersHorizontal } from 'lucide-react';
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

/** Marché — bright, energetic, dense, African market colour, Android-first. */
export function MarcheTheme({ shop }: { shop: PublicStorefront }) {
  const state = useStorefrontState(shop);
  const { reduce, q, setQ, cat, setCat, list, cats, activeFilters, openFilters, openProduct, add } = state;
  const shortName = shop.name.length > 26 ? `${shop.name.slice(0, 24)}…` : shop.name;
  const trust = storefrontTrust(shop);
  const hero = featuredProduct(shop);
  const mosaic = bestsellers(shop, 4);
  const hits = bestsellers(shop, 6);
  const news = nouveautes(shop, 6);
  const promo = promoProducts(shop, 3);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 100);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <StorefrontChrome
      shop={shop}
      state={state}
      cartClassName="!border-[#1a1208]/15 !bg-[#1a1208]"
      whatsappClassName="bg-[#16a34a] text-white"
      sheetClassName="bg-[#fff8ec] text-[#1a1208]"
    >
      <div
        className="sf-root min-h-dvh bg-[#fff8ec] text-[#1a1208]"
        data-theme="marche"
        style={{ ['--sf-header-h' as string]: '56px' }}
      >
        <header className="sticky top-0 z-40 border-b border-[#1a1208]/10 bg-[#fff8ec]/92 pt-safe backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-extrabold tracking-tight" data-testid="sf-header-shop">
                {shortName}
              </p>
              <p className="flex items-center gap-1 truncate text-[11px] font-bold uppercase tracking-[0.08em] text-[#9a3412]">
                <MapPin size={11} /> {shop.commune || 'Marché'} · prix du jour
              </p>
            </div>
            {shop.whatsapp && (
              <a
                href={storefrontContactUrl(shop)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#16a34a] px-3.5 text-[13px] font-extrabold text-white active:scale-95"
              >
                <MessageCircle size={15} /> WhatsApp
              </a>
            )}
          </div>
        </header>

        {/* First screen: loud identity + mosaic */}
        <section className="border-b border-[#1a1208]/10">
          <div className="mx-auto max-w-6xl px-4 pb-5 pt-5 sm:px-6 sm:pt-8 lg:grid lg:grid-cols-2 lg:gap-8 lg:px-8 lg:pb-8 lg:pt-10">
            <div>
              {shop.demo && (
                <p className="mb-3 inline-flex rounded-lg border border-[#ea580c]/30 bg-[#ffedd5] px-2.5 py-1 text-[11px] font-extrabold text-[#9a3412]" data-testid="demo-banner">
                  Boutique de démonstration
                </p>
              )}
              <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#c2410c]">
                {shop.commune || 'Kinshasa'} · ouvert
              </p>
              <h1
                className="mt-2 max-w-[14ch] font-sans text-[clamp(2rem,7vw,3.75rem)] font-black leading-[0.95] tracking-[-0.035em]"
                data-testid="storefront-name"
              >
                {shop.name}
              </h1>
              {shop.description && (
                <p className="mt-3 max-w-md text-[14px] font-medium leading-snug text-[#5c4030] sm:text-[15px]">{shop.description}</p>
              )}
              <TrustStrip
                signals={trust}
                className="mt-4"
                chipClassName="border-[#1a1208]/12 bg-white text-[#1a1208]"
              />
              <div className="mt-5 flex flex-wrap gap-2.5">
                {shop.whatsapp && (
                  <a
                    href={storefrontContactUrl(shop)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center rounded-xl bg-[#1a1208] px-5 text-sm font-extrabold text-white"
                  >
                    Commander →
                  </a>
                )}
                <a href="#catalogue" className="inline-flex h-12 items-center rounded-xl border-2 border-[#1a1208] px-4 text-sm font-extrabold">
                  Rayon
                </a>
              </div>
              <div className="mt-6 inline-flex items-end gap-2 rounded-2xl bg-[#ea580c] px-4 py-3 text-white" data-testid="sf-en-rayon">
                <p className="text-[clamp(2rem,5vw,2.75rem)] font-black tabular leading-none">{shop.products.length}</p>
                <div className="pb-0.5">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide">En rayon</p>
                  <p className="text-[12px] font-semibold opacity-90">WhatsApp · pas de paiement en ligne</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-3 lg:mt-0" data-testid="sf-stage">
              {(mosaic.length ? mosaic : hero ? [hero] : []).slice(0, 4).map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => openProduct(p)}
                  className={clsx(
                    'relative overflow-hidden rounded-2xl border border-[#1a1208]/10 bg-white text-left',
                    i === 0 && 'col-span-2 aspect-[16/9] sm:aspect-[2/1] lg:col-span-1 lg:row-span-2 lg:aspect-auto lg:min-h-[280px]',
                    i > 0 && 'aspect-square',
                  )}
                >
                  <ProductArt src={p.photo} name={p.name} category={p.category} rounded="rounded-none" className="h-full w-full" priority={i < 2} />
                  <div className="absolute inset-x-0 bottom-0 bg-[#1a1208]/80 p-2.5 text-white">
                    <StockBadge availability={p.availability} />
                    <p className="mt-1 truncate text-[12px] font-bold">{p.name}</p>
                    <p className="text-[1.15rem] font-black tabular leading-none text-[#fdba74]">{formatMoney(p.sell_price, shop.currency)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <SfSection className="border-b border-[#1a1208]/10 bg-[#fff1d6] py-1" pad>
          <CategoryRail
            cats={cats}
            total={shop.products.length}
            cat={cat}
            setCat={setCat}
            sticky
            className="bg-[#fff1d6]/95 backdrop-blur-md"
            activeClass="bg-[#1a1208] text-white"
            idleClass="border border-[#1a1208]/12 bg-white text-[#1a1208]"
          />
        </SfSection>

        {promo.length > 0 && (
          <SfSection className="py-5" pad>
            <PromoStrip
              products={promo}
              currency={shop.currency}
              onOpen={openProduct}
              className="border-[#ea580c]/30 bg-[#ffedd5] text-[#9a3412]"
            />
          </SfSection>
        )}

        <SfSection className="py-6" pad>
          <ProductRail
            title="Les plus demandés"
            subtitle="Essentiels du marché"
            products={hits}
            currency={shop.currency}
            onOpen={openProduct}
            onAdd={(p) => add(p, 1)}
            tone="market"
          />
        </SfSection>

        <SfSection className="py-4" pad>
          <ProductRail
            title="Nouveautés"
            subtitle="Fraîchement ajoutés"
            products={news}
            currency={shop.currency}
            onOpen={openProduct}
            onAdd={(p) => add(p, 1)}
            tone="market"
          />
        </SfSection>

        <main id="catalogue" className="scroll-mt-28 pb-40 pt-2">
          <SfSection pad>
            <div className="mb-4 flex flex-col gap-2.5 sm:flex-row">
              <div className="relative flex-1">
                <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9a3412]/70" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher…"
                  className="h-12 w-full rounded-xl border-2 border-[#1a1208]/12 bg-white pl-11 pr-3 text-[16px] font-medium outline-none focus:border-[#ea580c]"
                  data-testid="storefront-search"
                />
              </div>
              <button
                type="button"
                onClick={openFilters}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#1a1208]/12 bg-white px-4 text-sm font-extrabold"
                data-testid="sf-filters"
              >
                <SlidersHorizontal size={16} /> Filtres
                {activeFilters > 0 && <span className="rounded-md bg-[#ea580c] px-1.5 text-[11px] text-white">{activeFilters}</span>}
              </button>
            </div>

            {!ready ? (
              <CatalogueSkeleton tone="market" />
            ) : (
              <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4" data-testid="storefront-grid">
                {list.map((p, i) => (
                  <motion.li
                    key={p.id}
                    initial={reduce || i < 4 ? false : { opacity: 0, y: 12 }}
                    whileInView={reduce || i < 4 ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col overflow-hidden rounded-2xl border border-[#1a1208]/10 bg-white"
                  >
                    <button type="button" onClick={() => openProduct(p)} className="text-left" data-testid={`sf-product-${p.id}`}>
                      <div className="relative aspect-[4/5] overflow-hidden bg-[#ffe8cc]">
                        <ProductArt src={p.photo} name={p.name} category={p.category} rounded="rounded-none" className="h-full w-full" />
                        <StockBadge availability={p.availability} className="absolute left-2 top-2" />
                      </div>
                      <div className="space-y-1 p-2.5 sm:p-3">
                        <p className="line-clamp-2 text-[12.5px] font-bold leading-snug">{p.name}</p>
                        <p className="text-[clamp(1.35rem,3.5vw,1.65rem)] font-black tabular leading-none text-[#c2410c]">
                          {formatMoney(p.sell_price, shop.currency)}
                        </p>
                      </div>
                    </button>
                    <div className="px-2.5 pb-2.5 sm:px-3 sm:pb-3">
                      <button
                        type="button"
                        disabled={p.availability === 'out'}
                        onClick={() => add(p, 1)}
                        className="inline-flex h-11 w-full items-center justify-center gap-1 rounded-xl bg-[#1a1208] text-[13px] font-extrabold text-white disabled:opacity-35"
                      >
                        <Plus size={15} /> Ajouter
                      </button>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
            {ready && list.length === 0 && <p className="py-14 text-center text-sm font-semibold text-[#9a3412]">Rien pour ces filtres.</p>}
          </SfSection>
        </main>

        <StorefrontFooter shop={shop} className="border-[#1a1208]/10 bg-[#ffe8cc]" mutedClassName="text-[#5c4030]" />
      </div>
    </StorefrontChrome>
  );
}
