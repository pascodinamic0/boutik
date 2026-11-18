'use client';
import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';
import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { ProductArt } from '@/components/storefront/ProductArt';
import { formatMoney } from '@/lib/money';
import { availabilityLabel, type PublicProduct, type PublicStorefront } from '@/lib/storefront';
import { mapsUrl, type TrustSignal } from '@/lib/storefront-present';
import type { Currency } from '@/lib/types';

/** 8pt grid section shell */
export function SfSection({
  id,
  className,
  children,
  pad = true,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
  pad?: boolean;
}) {
  return (
    <section id={id} className={clsx(pad && 'px-4 sm:px-6 lg:px-8', className)}>
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

export function TrustStrip({ signals, className, chipClassName }: { signals: TrustSignal[]; className?: string; chipClassName?: string }) {
  if (!signals.length) return null;
  return (
    <ul className={clsx('flex flex-wrap gap-2', className)} data-testid="sf-trust">
      {signals.map((s) => (
        <li key={s.id} className={clsx('inline-flex h-8 items-center rounded-full border px-3 text-[11px] font-semibold tracking-wide', chipClassName)}>
          {s.label}
        </li>
      ))}
    </ul>
  );
}

export function CategoryRail({
  cats,
  total,
  cat,
  setCat,
  sticky,
  className,
  activeClass,
  idleClass,
}: {
  cats: [string, number][];
  total: number;
  cat: string;
  setCat: (c: string) => void;
  sticky?: boolean;
  className?: string;
  activeClass: string;
  idleClass: string;
}) {
  const items = [{ key: 'all', label: 'Tout', n: total }, ...cats.map(([c, n]) => ({ key: c, label: c, n }))];
  return (
    <div
      className={clsx(
        sticky && 'sticky top-[var(--sf-header-h,56px)] z-30',
        'no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-3 sm:mx-0 sm:px-0',
        className,
      )}
      data-testid="sf-category-rail"
      role="tablist"
      aria-label="Catégories"
    >
      {items.map((c) => (
        <button
          key={c.key}
          type="button"
          role="tab"
          aria-selected={cat === c.key}
          onClick={() => setCat(c.key)}
          className={clsx(
            'inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition-colors active:scale-[0.98]',
            cat === c.key ? activeClass : idleClass,
          )}
        >
          {c.label}
          <span className="tabular opacity-70">{c.n}</span>
        </button>
      ))}
    </div>
  );
}

export function ProductRail({
  title,
  subtitle,
  products,
  currency,
  onOpen,
  onAdd,
  tone = 'light',
}: {
  title: string;
  subtitle?: string;
  products: PublicProduct[];
  currency: Currency;
  onOpen: (p: PublicProduct) => void;
  onAdd: (p: PublicProduct) => void;
  tone?: 'light' | 'dark' | 'market';
}) {
  const reduce = useReducedMotion();
  if (!products.length) return null;
  const titleCls =
    tone === 'dark'
      ? 'text-white'
      : tone === 'market'
        ? 'text-[#1a1208]'
        : 'text-[#111]';
  const subCls = tone === 'dark' ? 'text-white/55' : 'text-[#6b5a4a]';
  const cardCls =
    tone === 'dark'
      ? 'border-white/10 bg-white/[0.04]'
      : tone === 'market'
        ? 'border-[#1a1208]/10 bg-white'
        : 'border-black/8 bg-white';
  const priceCls = tone === 'dark' ? 'text-[#f0c7a0]' : tone === 'market' ? 'text-[#c2410c]' : 'text-[#111]';

  return (
    <div className="py-2" data-testid={`sf-rail-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className={clsx('font-[family-name:var(--font-fraunces)] text-[clamp(1.35rem,3vw,1.85rem)] font-semibold leading-none tracking-tight', titleCls)}>
            {title}
          </h2>
          {subtitle && <p className={clsx('mt-2 text-[13px] leading-snug', subCls)}>{subtitle}</p>}
        </div>
      </div>
      <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:gap-4 sm:px-0">
        {products.map((p, i) => (
          <motion.li
            key={p.id}
            initial={reduce || i < 3 ? false : { opacity: 0, x: 16 }}
            whileInView={reduce || i < 3 ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '40px' }}
            className={clsx('w-[148px] shrink-0 overflow-hidden rounded-2xl border sm:w-[168px]', cardCls)}
          >
            <button type="button" onClick={() => onOpen(p)} className="block w-full text-left" data-testid={`sf-rail-product-${p.id}`}>
              <div className="relative aspect-[4/5] overflow-hidden">
                <ProductArt src={p.photo} name={p.name} category={p.category} rounded="rounded-none" className="h-full w-full" priority={i < 2} />
                <span
                  className={clsx(
                    'absolute left-2 top-2 rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-wide',
                    p.availability === 'in' && 'bg-emerald-700 text-white',
                    p.availability === 'low' && 'bg-amber-400 text-[#111]',
                    p.availability === 'out' && 'bg-stone-600 text-white',
                  )}
                >
                  {availabilityLabel(p.availability)}
                </span>
              </div>
              <div className="space-y-1.5 p-3">
                <p className={clsx('line-clamp-2 text-[12px] font-medium leading-snug', tone === 'dark' ? 'text-white/85' : 'text-[#3d2f24]')}>{p.name}</p>
                <p className={clsx('font-[family-name:var(--font-fraunces)] text-[1.35rem] font-bold tabular leading-none', priceCls)}>
                  {formatMoney(p.sell_price, currency)}
                </p>
              </div>
            </button>
            <div className="px-3 pb-3">
              <button
                type="button"
                disabled={p.availability === 'out'}
                onClick={() => onAdd(p)}
                className={clsx(
                  'inline-flex h-10 w-full items-center justify-center gap-1 rounded-full text-[12px] font-bold disabled:opacity-35',
                  tone === 'dark' ? 'bg-white text-black' : tone === 'market' ? 'bg-[#1a1208] text-white' : 'bg-[#111] text-white',
                )}
              >
                <Plus size={14} /> Ajouter
              </button>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

export function PromoStrip({
  products,
  currency,
  className,
  onOpen,
}: {
  products: PublicProduct[];
  currency: Currency;
  className?: string;
  onOpen: (p: PublicProduct) => void;
}) {
  if (!products.length) return null;
  return (
    <div className={clsx('rounded-2xl border px-4 py-4 sm:px-5 sm:py-5', className)} data-testid="sf-promo">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em]">Dernières pièces</p>
      <p className="mt-1 text-[14px] leading-snug opacity-80">Stock bas — réservez via WhatsApp avant rupture.</p>
      <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {products.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onOpen(p)}
              className="inline-flex h-11 w-full items-center justify-between gap-3 rounded-full border border-current/15 bg-black/5 px-4 text-left text-[13px] font-semibold sm:w-auto"
            >
              <span className="truncate">{p.name}</span>
              <span className="shrink-0 font-[family-name:var(--font-fraunces)] text-[15px] font-bold tabular">{formatMoney(p.sell_price, currency)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StorefrontFooter({
  shop,
  className,
  mutedClassName,
}: {
  shop: PublicStorefront;
  className?: string;
  mutedClassName?: string;
}) {
  return (
    <footer className={clsx('border-t px-4 py-12 sm:px-6 lg:px-8', className)} data-testid="sf-footer">
      <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3">
        <div>
          <p className="font-[family-name:var(--font-fraunces)] text-xl font-semibold tracking-tight">{shop.name}</p>
          <p className={clsx('mt-2 text-[13px] leading-relaxed', mutedClassName)}>
            Catalogue Boutik · commande WhatsApp, sans paiement en ligne.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em]">Lieu</p>
          {shop.commune ? (
            <a
              href={mapsUrl(shop.commune)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex min-h-11 items-center text-[14px] font-semibold underline-offset-4 hover:underline"
            >
              {shop.commune}, Kinshasa →
            </a>
          ) : (
            <p className={clsx('mt-2 text-[14px]', mutedClassName)}>Adresse à confirmer sur WhatsApp</p>
          )}
          {shop.demo && <p className={clsx('mt-1 text-[13px]', mutedClassName)}>Horaires démo · lun–sam</p>}
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em]">Contact</p>
          {shop.whatsapp ? (
            <a
              href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex min-h-11 items-center text-[14px] font-semibold underline-offset-4 hover:underline"
            >
              WhatsApp {shop.whatsapp}
            </a>
          ) : (
            <p className={clsx('mt-2 text-[14px]', mutedClassName)}>WhatsApp bientôt disponible</p>
          )}
        </div>
      </div>
    </footer>
  );
}

export function CatalogueSkeleton({ tone = 'light' }: { tone?: 'light' | 'dark' | 'market' }) {
  const base = tone === 'dark' ? 'bg-white/10' : tone === 'market' ? 'bg-[#f3e6d4]' : 'bg-[#ebe7e1]';
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4" data-testid="sf-skeleton" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className={clsx('aspect-[4/5] animate-pulse rounded-2xl', base)} />
          <div className={clsx('h-3 w-[75%] animate-pulse rounded', base)} />
          <div className={clsx('h-6 w-[50%] animate-pulse rounded', base)} />
        </div>
      ))}
    </div>
  );
}

export function StockBadge({ availability, className }: { availability: PublicProduct['availability']; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-wide',
        availability === 'in' && 'bg-emerald-700 text-white',
        availability === 'low' && 'bg-amber-400 text-[#111]',
        availability === 'out' && 'bg-stone-600 text-white',
        className,
      )}
    >
      {availabilityLabel(availability)}
    </span>
  );
}
