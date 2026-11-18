'use client';
import { motion, useScroll, useTransform } from 'motion/react';
import { MessageCircle, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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

/** Cinéma — dark, editorial, immersive scroll. */
export function CinemaTheme({ shop }: { shop: PublicStorefront }) {
  const state = useStorefrontState(shop);
  const { reduce, q, setQ, cat, setCat, list, cats, activeFilters, openFilters, openProduct, add } = state;
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 80]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.08]);
  const shortName = shop.name.length > 28 ? `${shop.name.slice(0, 26)}…` : shop.name;
  const hero = featuredProduct(shop);
  const trust = storefrontTrust(shop);
  const hits = bestsellers(shop, 6);
  const news = nouveautes(shop, 6);
  const promo = promoProducts(shop, 3);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 120);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <StorefrontChrome
      shop={shop}
      state={state}
      cartClassName="!border-white/15 !bg-[#14110f]"
      whatsappClassName="bg-[#25D366] text-[#0a0a0a]"
      sheetClassName="bg-[#161311] text-[#f4efe8]"
    >
      <div
        className="sf-root sf-cinematic min-h-dvh bg-[#0c0b0a] text-[#f4efe8]"
        data-theme="cinema"
        style={{ ['--sf-header-h' as string]: '56px' }}
      >
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0c0b0a]/85 pt-safe backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight" data-testid="sf-header-shop">
                {shortName}
              </p>
              <p className="truncate text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
                {shop.commune || 'Catalogue'} · cinéma
              </p>
            </div>
            {shop.whatsapp && (
              <a
                href={storefrontContactUrl(shop)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-[13px] font-semibold text-white active:scale-95"
              >
                <MessageCircle size={15} /> Contacter
              </a>
            )}
          </div>
        </header>

        {/* First screen: identity + trust + hero product */}
        <section ref={heroRef} className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-stretch gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="relative z-10 flex flex-col justify-center px-4 pb-8 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pb-16 lg:pt-16">
              {shop.demo && (
                <p className="mb-4 inline-flex w-fit rounded-full border border-[#c9a46a]/35 bg-[#c9a46a]/10 px-3 py-1 text-[11px] font-semibold text-[#e8c98a]" data-testid="demo-banner">
                  Boutique de démonstration
                </p>
              )}
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                {shop.commune || 'Kinshasa'} · collection
              </p>
              <h1
                className="mt-3 max-w-[11ch] font-[family-name:var(--font-fraunces)] text-[clamp(2.4rem,8vw,4.75rem)] font-semibold leading-[0.92] tracking-[-0.03em] text-white"
                data-testid="storefront-name"
              >
                {shop.name}
              </h1>
              {shop.description && (
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/65 sm:text-[16px]">{shop.description}</p>
              )}
              <TrustStrip
                signals={trust}
                className="mt-5"
                chipClassName="border-white/15 bg-white/[0.04] text-white/80"
              />
              <div className="mt-7 flex flex-wrap gap-3">
                {shop.whatsapp && (
                  <a
                    href={storefrontContactUrl(shop)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-bold text-[#0c0b0a]"
                  >
                    Commander →
                  </a>
                )}
                <a href="#catalogue" className="inline-flex h-12 items-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white">
                  Voir le rayon
                </a>
              </div>
              <div className="mt-8 flex items-end gap-3 border-t border-white/10 pt-5" data-testid="sf-en-rayon">
                <p className="font-[family-name:var(--font-fraunces)] text-[clamp(2.5rem,5vw,3.5rem)] font-semibold tabular leading-none text-[#e8c98a]">
                  {shop.products.length}
                </p>
                <div className="pb-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">En rayon</p>
                  <p className="mt-0.5 text-sm text-white/60">Produits · WhatsApp seulement</p>
                </div>
              </div>
            </div>

            <div className="relative min-h-[280px] sm:min-h-[360px] lg:min-h-[640px]" data-testid="sf-stage">
              {hero && (
                <motion.div style={reduce ? undefined : { y: heroY, scale: heroScale }} className="absolute inset-0">
                  <ProductArt
                    src={hero.photo}
                    name={hero.name}
                    category={hero.category}
                    rounded="rounded-none"
                    className="h-full w-full"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b0a] via-transparent to-transparent lg:bg-gradient-to-l" />
                  <button
                    type="button"
                    onClick={() => openProduct(hero)}
                    className="absolute bottom-5 left-4 right-4 flex items-end justify-between gap-3 rounded-2xl border border-white/15 bg-[#0c0b0a]/75 p-4 text-left backdrop-blur-md sm:left-6 sm:right-auto sm:min-w-[280px]"
                  >
                    <div className="min-w-0">
                      <StockBadge availability={hero.availability} />
                      <p className="mt-2 truncate text-[13px] font-medium text-white/80">{hero.name}</p>
                      <p className="mt-1 font-[family-name:var(--font-fraunces)] text-[1.75rem] font-semibold tabular leading-none text-[#e8c98a]">
                        {formatMoney(hero.sell_price, shop.currency)}
                      </p>
                    </div>
                    <span className="inline-flex h-11 shrink-0 items-center rounded-full bg-white px-4 text-[12px] font-bold text-black">Voir</span>
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </section>

        <SfSection className="border-t border-white/10 bg-[#10100e] py-2" pad>
          <CategoryRail
            cats={cats}
            total={shop.products.length}
            cat={cat}
            setCat={setCat}
            sticky
            className="bg-[#10100e]/95 backdrop-blur-md"
            activeClass="bg-white text-[#0c0b0a]"
            idleClass="border border-white/12 bg-transparent text-white/75"
          />
        </SfSection>

        <SfSection className="bg-[#10100e] py-8" pad>
          <ProductRail
            title="À la une"
            subtitle="Les essentiels du rayon"
            products={hits}
            currency={shop.currency}
            onOpen={openProduct}
            onAdd={(p) => add(p, 1)}
            tone="dark"
          />
        </SfSection>

        {promo.length > 0 && (
          <SfSection className="bg-[#10100e] pb-6" pad>
            <PromoStrip
              products={promo}
              currency={shop.currency}
              onOpen={openProduct}
              className="border-[#e8c98a]/25 bg-[#e8c98a]/8 text-[#f4efe8]"
            />
          </SfSection>
        )}

        <SfSection className="bg-[#10100e] py-6" pad>
          <ProductRail
            title="Nouveautés"
            subtitle="Arrivages récents du catalogue"
            products={news}
            currency={shop.currency}
            onOpen={openProduct}
            onAdd={(p) => add(p, 1)}
            tone="dark"
          />
        </SfSection>

        <main id="catalogue" className="scroll-mt-28 bg-[#0c0b0a] pb-40 pt-4">
          <SfSection pad>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher un produit…"
                  className="h-12 w-full rounded-full border border-white/12 bg-white/[0.04] pl-11 pr-4 text-[16px] text-white outline-none placeholder:text-white/35 focus:border-[#e8c98a]/50"
                  data-testid="storefront-search"
                />
              </div>
              <button
                type="button"
                onClick={openFilters}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/12 px-5 text-sm font-semibold"
                data-testid="sf-filters"
              >
                <SlidersHorizontal size={16} /> Filtres
                {activeFilters > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e8c98a] px-1.5 text-[11px] font-bold text-black">{activeFilters}</span>
                )}
              </button>
            </div>

            {!ready ? (
              <CatalogueSkeleton tone="dark" />
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4" data-testid="storefront-grid">
                {list.map((p, i) => (
                  <motion.li
                    key={p.id}
                    initial={reduce || i < 4 ? false : { opacity: 0, y: 20 }}
                    whileInView={reduce || i < 4 ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '0px' }}
                    transition={{ duration: 0.35, delay: Math.min(Math.max(0, i - 4) * 0.03, 0.2) }}
                    className="flex flex-col"
                  >
                    <button type="button" onClick={() => openProduct(p)} className="text-left" data-testid={`sf-product-${p.id}`}>
                      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-[#1a1714]">
                        <ProductArt src={p.photo} name={p.name} category={p.category} rounded="rounded-none" className="h-full w-full" />
                        <StockBadge availability={p.availability} className="absolute left-2.5 top-2.5" />
                      </div>
                      <p className="mt-3 line-clamp-2 text-[13px] font-medium leading-snug text-white/75">{p.name}</p>
                      <p className="mt-2 font-[family-name:var(--font-fraunces)] text-[clamp(1.35rem,3.2vw,1.75rem)] font-semibold tabular leading-none text-[#e8c98a]">
                        {formatMoney(p.sell_price, shop.currency)}
                      </p>
                    </button>
                    <button
                      type="button"
                      disabled={p.availability === 'out'}
                      onClick={() => add(p, 1)}
                      className="mt-3 inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-bold text-black disabled:opacity-35"
                    >
                      <Plus size={15} /> Ajouter
                    </button>
                  </motion.li>
                ))}
              </ul>
            )}
            {ready && list.length === 0 && (
              <p className="py-16 text-center text-sm text-white/50">Aucun produit pour ces filtres.</p>
            )}
          </SfSection>
        </main>

        <StorefrontFooter shop={shop} className="border-white/10 bg-[#0c0b0a]" mutedClassName="text-white/45" />
      </div>
    </StorefrontChrome>
  );
}
