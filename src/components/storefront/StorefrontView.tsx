'use client';
import clsx from 'clsx';
import { MessageCircle, Minus, Plus, Search, ShoppingBag, Store, X } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Logo } from '@/components/Logo';
import { formatMoney } from '@/lib/money';
import {
  availabilityLabel,
  storefrontContactUrl,
  storefrontWhatsAppUrl,
  type CartLine,
  type PublicProduct,
  type PublicStorefront,
} from '@/lib/storefront';

export function StorefrontView({ shop }: { shop: PublicStorefront }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [openCart, setOpenCart] = useState(false);

  const cats = useMemo(
    () => [...new Set(shop.products.map((p) => p.category))].sort((a, b) => a.localeCompare(b, 'fr')),
    [shop.products],
  );

  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return shop.products.filter((p) => {
      if (cat !== 'all' && p.category !== cat) return false;
      if (qq && !p.name.toLowerCase().includes(qq) && !p.category.toLowerCase().includes(qq)) return false;
      return true;
    });
  }, [shop.products, q, cat]);

  const lines: CartLine[] = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const product = shop.products.find((p) => p.id === id);
        if (!product || qty <= 0) return null;
        return { product, qty };
      })
      .filter(Boolean) as CartLine[];
  }, [cart, shop.products]);

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

  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,#faf6f0_0%,#f3ebe0_40%,#efe4d6_100%)] text-ink">
      <div className="pointer-events-none fixed inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_20%_10%,rgba(194,83,31,0.12),transparent_40%),radial-gradient(circle_at_90%_0%,rgba(126,45,16,0.08),transparent_35%)]" />

      <header className="relative border-b border-[#e6d8c8]/bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="opacity-80 transition hover:opacity-100" aria-label="Boutik">
            <Logo className="h-8 w-auto" />
          </Link>
          {shop.whatsapp && (
            <a
              href={storefrontContactUrl(shop)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#128C7E] px-4 text-sm font-semibold text-white shadow-sm active:scale-95"
            >
              <MessageCircle size={16} /> Contacter
            </a>
          )}
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10">
        {shop.demo && (
          <p className="mb-4 rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900" data-testid="demo-banner">
            Boutique de démonstration — données d&apos;exemple Boutik
          </p>
        )}

        <section className="mb-8">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d8622b] to-[#7e2d10] text-white shadow-lg">
              <Store size={26} />
            </span>
            <div className="min-w-0">
              <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-bold tracking-tight text-[#3a2418] sm:text-4xl" data-testid="storefront-name">
                {shop.name}
              </h1>
              <p className="mt-1 text-sm font-medium text-[#7a5a45]">
                {shop.commune ? `${shop.commune} · ` : ''}
                Catalogue en ligne
              </p>
              {shop.description && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#5c4030]">{shop.description}</p>}
            </div>
          </div>
        </section>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a7b64]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un produit…"
              className="h-12 w-full rounded-2xl border border-[#e0d0be] bg-white/90 pl-11 pr-4 text-[16px] outline-none focus:border-[#c2531f] focus:ring-4 focus:ring-[#c2531f]/20"
              data-testid="storefront-search"
            />
          </div>
        </div>

        <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {['all', ...cats].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={clsx(
                'inline-flex h-9 shrink-0 items-center rounded-full px-4 text-[13px] font-semibold transition',
                cat === c ? 'bg-[#3a2418] text-[#faf6f0]' : 'border border-[#e0d0be] bg-white/80 text-[#7a5a45]',
              )}
            >
              {c === 'all' ? 'Tout' : c}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-[#e0d0be] bg-white/50 py-16 text-center text-sm text-[#7a5a45]">
            Aucun produit trouvé.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" data-testid="storefront-grid">
            {list.map((p) => (
              <li key={p.id} className="flex flex-col overflow-hidden rounded-3xl border border-[#eadccb] bg-white/90 shadow-[0_10px_30px_-18px_rgba(80,40,10,0.35)]">
                <div className="relative aspect-square bg-[#f3ebe0]">
                  {p.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[#c4a88e]">
                      <ShoppingBag size={28} />
                    </div>
                  )}
                  <span
                    className={clsx(
                      'absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold',
                      p.availability === 'in' && 'bg-emerald-600 text-white',
                      p.availability === 'low' && 'bg-amber-500 text-white',
                      p.availability === 'out' && 'bg-stone-500 text-white',
                    )}
                  >
                    {availabilityLabel(p.availability)}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-[#3a2418]">{p.name}</p>
                  <p className="text-sm font-extrabold tabular text-[#c2531f]">{formatMoney(p.sell_price, shop.currency)}</p>
                  <button
                    type="button"
                    disabled={p.availability === 'out'}
                    onClick={() => add(p)}
                    className="mt-auto inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#3a2418] text-[13px] font-bold text-[#faf6f0] transition enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={15} /> Ajouter
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e6d8c8] bg-white/95 p-3 backdrop-blur-xl safe-bottom">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <button
              type="button"
              onClick={() => setOpenCart(true)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-[#3a2418] px-4 py-3 text-left text-white active:scale-[0.99]"
              data-testid="open-cart"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-bold">{cartCount}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">Voir la commande</span>
                <span className="block text-xs text-white/70 tabular">{formatMoney(cartTotal, shop.currency)}</span>
              </span>
            </button>
            {shop.whatsapp ? (
              <a
                href={storefrontWhatsAppUrl(shop, lines)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-[#128C7E] px-4 text-sm font-bold text-white"
                data-testid="whatsapp-order"
              >
                <MessageCircle size={18} /> WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      )}

      {openCart && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6" onClick={() => setOpenCart(false)}>
          <div
            className="max-h-[85dvh] w-full max-w-lg overflow-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Commande"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Votre commande</h2>
              <button type="button" onClick={() => setOpenCart(false)} className="rounded-full p-2 hover:bg-stone-100" aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
            <ul className="divide-y divide-stone-100">
              {lines.map((l) => (
                <li key={l.product.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{l.product.name}</p>
                    <p className="text-xs text-stone-500 tabular">{formatMoney(l.product.sell_price, shop.currency)}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-stone-200 p-0.5">
                    <button type="button" className="rounded-full p-1.5" onClick={() => setQty(l.product.id, l.qty - 1)} aria-label="Moins">
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold tabular">{l.qty}</span>
                    <button type="button" className="rounded-full p-1.5" onClick={() => setQty(l.product.id, l.qty + 1)} aria-label="Plus">
                      <Plus size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
              <span className="text-sm font-semibold text-stone-500">Total estimé</span>
              <span className="text-lg font-extrabold tabular text-[#c2531f]">{formatMoney(cartTotal, shop.currency)}</span>
            </div>
            {shop.whatsapp ? (
              <a
                href={storefrontWhatsAppUrl(shop, lines)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#128C7E] text-[15px] font-bold text-white"
              >
                <MessageCircle size={18} /> Commander sur WhatsApp
              </a>
            ) : (
              <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Cette boutique n&apos;a pas encore indiqué de numéro WhatsApp.
              </p>
            )}
          </div>
        </div>
      )}

      <footer className="relative border-t border-[#e6d8c8]/bg-white/50 py-6 text-center text-xs text-[#9a7b64]">
        Propulsé par <Link href="/" className="font-semibold text-[#c2531f]">Boutik</Link> — pas de paiement en ligne, commande via WhatsApp
      </footer>
    </div>
  );
}
