import type { PublicProduct, PublicStorefront } from '@/lib/storefront';

export interface TrustSignal {
  id: string;
  label: string;
}

/** Honest trust chips from public fields only — no invented hours/reviews for live shops. */
export function storefrontTrust(shop: PublicStorefront): TrustSignal[] {
  const inStock = shop.products.filter((p) => p.availability !== 'out').length;
  const signals: TrustSignal[] = [];
  if (shop.commune) {
    signals.push({ id: 'area', label: `Zone · ${shop.commune}` });
  }
  if (shop.whatsapp) {
    signals.push({ id: 'wa', label: 'Commande WhatsApp' });
  }
  signals.push({ id: 'stock', label: `${inStock} en rayon` });
  // Demo-only curated signals (labelled demo boutique) — never invent for live shops
  if (shop.demo) {
    signals.push({ id: 'hours', label: 'Ouvert · lun–sam' });
    signals.push({ id: 'eta', label: 'Réponse WhatsApp rapide' });
  }
  return signals.slice(0, 4);
}

export function featuredProduct(shop: PublicStorefront): PublicProduct | null {
  return shop.products.find((p) => p.availability === 'in' && p.photo) ?? shop.products.find((p) => p.availability !== 'out') ?? shop.products[0] ?? null;
}

/** Bestsellers proxy: in-stock with photos first, then low-stock urgency. */
export function bestsellers(shop: PublicStorefront, n = 6): PublicProduct[] {
  const scored = [...shop.products].sort((a, b) => {
    const score = (p: PublicProduct) => (p.availability === 'in' ? 2 : p.availability === 'low' ? 1 : 0) + (p.photo ? 1 : 0);
    return score(b) - score(a);
  });
  return scored.filter((p) => p.availability !== 'out').slice(0, n);
}

/** Nouveautés proxy: reverse catalogue order (newest listings tend to append). */
export function nouveautes(shop: PublicStorefront, n = 6): PublicProduct[] {
  return [...shop.products].reverse().filter((p) => p.availability !== 'out').slice(0, n);
}

export function promoProducts(shop: PublicStorefront, n = 3): PublicProduct[] {
  return shop.products.filter((p) => p.availability === 'low').slice(0, n);
}

export function mapsUrl(commune: string): string {
  const q = encodeURIComponent(`${commune}, Kinshasa, RD Congo`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
