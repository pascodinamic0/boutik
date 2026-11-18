import { formatMoney } from './money';
import { waLink } from './phone';
import type { Currency } from './types';

export type Availability = 'in' | 'low' | 'out';

/** Champs sûrs exposés à la vitrine publique — jamais buy_price, crédit, dépenses, etc. */
export interface PublicProduct {
  id: string;
  name: string;
  category: string;
  sell_price: number;
  photo: string | null;
  unit: string;
  availability: Availability;
}

export interface PublicStorefront {
  slug: string;
  name: string;
  commune: string;
  description: string | null;
  whatsapp: string | null;
  currency: Currency;
  products: PublicProduct[];
  /** Marqué true pour la boutique de démonstration intégrée. */
  demo?: boolean;
}

export const PUBLIC_STOREFRONT_KEYS = [
  'slug',
  'name',
  'commune',
  'description',
  'whatsapp',
  'currency',
  'products',
  'demo',
] as const;

export const PUBLIC_PRODUCT_KEYS = ['id', 'name', 'category', 'sell_price', 'photo', 'unit', 'availability'] as const;

/** Champs privés qui ne doivent jamais apparaître dans une réponse publique. */
export const FORBIDDEN_PUBLIC_FIELDS = [
  'buy_price',
  'unit_cost',
  'quantity',
  'low_stock',
  'barcode',
  'archived',
  'storefront_hidden',
  'customer_id',
  'customers',
  'credit',
  'expenses',
  'exchange_rate',
  'plan',
  'trial_ends_at',
  'created_by',
  'seller_id',
  'shop_id',
  'synced_at',
] as const;

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function normalizeStorefrontSlug(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function isValidStorefrontSlug(slug: string): boolean {
  return SLUG_RE.test(slug) && slug.length >= 3 && slug.length <= 48;
}

export function availabilityFromStock(quantity: number, lowStock: number): Availability {
  if (quantity <= 0) return 'out';
  if (quantity <= lowStock) return 'low';
  return 'in';
}

export function availabilityLabel(a: Availability): string {
  if (a === 'in') return 'En stock';
  if (a === 'low') return 'Bientôt épuisé';
  return 'Épuisé';
}

/** Retire toute clé interdite d'un payload (défense en profondeur côté serveur). */
export function sanitizePublicStorefront(raw: unknown): PublicStorefront | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const slug = String(o.slug ?? '');
  const name = String(o.name ?? '').trim();
  if (!isValidStorefrontSlug(slug) || !name) return null;
  const currency = o.currency === 'USD' ? 'USD' : 'CDF';
  const productsIn = Array.isArray(o.products) ? o.products : [];
  const products: PublicProduct[] = [];
  for (const p of productsIn) {
    if (!p || typeof p !== 'object') continue;
    const row = p as Record<string, unknown>;
    const id = String(row.id ?? '');
    const pname = String(row.name ?? '').trim();
    if (!id || !pname) continue;
    const avail = row.availability;
    const availability: Availability = avail === 'low' || avail === 'out' || avail === 'in' ? avail : 'in';
    const sell = Number(row.sell_price);
    products.push({
      id,
      name: pname,
      category: String(row.category ?? 'Divers') || 'Divers',
      sell_price: Number.isFinite(sell) && sell >= 0 ? sell : 0,
      photo: typeof row.photo === 'string' && !row.photo.startsWith('data:') ? row.photo : null,
      unit: String(row.unit ?? 'pièce') || 'pièce',
      availability,
    });
  }
  return {
    slug,
    name,
    commune: String(o.commune ?? ''),
    description: o.description == null || o.description === '' ? null : String(o.description).slice(0, 280),
    whatsapp: o.whatsapp == null || o.whatsapp === '' ? null : String(o.whatsapp),
    currency,
    products,
    demo: o.demo === true ? true : undefined,
  };
}

/** Vérifie qu'aucune clé privée n'est présente (tests + garde-fou runtime). */
export function assertNoPrivateFields(payload: unknown, path = 'root'): string[] {
  const leaks: string[] = [];
  if (Array.isArray(payload)) {
    payload.forEach((v, i) => leaks.push(...assertNoPrivateFields(v, `${path}[${i}]`)));
    return leaks;
  }
  if (!payload || typeof payload !== 'object') return leaks;
  for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
    if ((FORBIDDEN_PUBLIC_FIELDS as readonly string[]).includes(k)) leaks.push(`${path}.${k}`);
    leaks.push(...assertNoPrivateFields(v, `${path}.${k}`));
  }
  return leaks;
}

export interface CartLine {
  product: PublicProduct;
  qty: number;
}

export function buildWhatsAppOrderMessage(shop: PublicStorefront, lines: CartLine[]): string {
  const body = lines
    .map((l) => `• ${l.qty}× ${l.product.name} (${formatMoney(l.product.sell_price * l.qty, shop.currency)})`)
    .join('\n');
  const total = lines.reduce((s, l) => s + l.product.sell_price * l.qty, 0);
  return [
    `Bonjour ${shop.name} !`,
    `Je souhaite commander via Boutik :`,
    body || '• (aucun article)',
    '',
    `Total estimé : ${formatMoney(total, shop.currency)}`,
    `Merci !`,
  ].join('\n');
}

export function storefrontWhatsAppUrl(shop: PublicStorefront, lines: CartLine[]): string {
  return waLink(buildWhatsAppOrderMessage(shop, lines), shop.whatsapp);
}

export function storefrontContactUrl(shop: PublicStorefront): string {
  return waLink(`Bonjour ${shop.name} ! Je vous contacte via votre boutique Boutik.`, shop.whatsapp);
}

/** Boutique de démonstration (preview / sans migration). Clairement marquée. */
export const DEMO_STOREFRONT: PublicStorefront = {
  slug: 'demo',
  name: 'Alimentation Maman Nzuzi',
  commune: 'Matete',
  description: 'Boutique de démonstration Boutik — alimentation et boissons à Matete. Commandez via WhatsApp.',
  whatsapp: '+243812345678',
  currency: 'CDF',
  demo: true,
  products: [
    { id: 'demo-riz', name: 'Riz parfumé 25 kg', category: 'Alimentation', sell_price: 85000, photo: '/products/riz.webp', unit: 'sac', availability: 'in' },
    { id: 'demo-huile', name: 'Huile végétale 1 L', category: 'Alimentation', sell_price: 6500, photo: '/products/huile.webp', unit: 'bouteille', availability: 'in' },
    { id: 'demo-sucre', name: 'Sucre en poudre 1 kg', category: 'Alimentation', sell_price: 4500, photo: '/products/sucre.webp', unit: 'kg', availability: 'low' },
    { id: 'demo-tomate', name: 'Concentré de tomate 70 g', category: 'Alimentation', sell_price: 600, photo: '/products/tomate.webp', unit: 'boîte', availability: 'in' },
    { id: 'demo-lait', name: 'Lait en poudre 400 g', category: 'Alimentation', sell_price: 13000, photo: '/products/lait-poudre.webp', unit: 'boîte', availability: 'out' },
    { id: 'demo-soda', name: 'Coca-Cola 33 cl', category: 'Boissons', sell_price: 1800, photo: '/products/soda.webp', unit: 'canette', availability: 'in' },
    { id: 'demo-biere', name: 'Bière Primus 72 cl', category: 'Boissons', sell_price: 3000, photo: '/products/biere.webp', unit: 'bouteille', availability: 'in' },
    { id: 'demo-eau', name: 'Eau minérale 1,5 L', category: 'Boissons', sell_price: 1500, photo: '/products/eau.webp', unit: 'bouteille', availability: 'low' },
    { id: 'demo-savon', name: 'Savon de toilette', category: 'Hygiène', sell_price: 1500, photo: '/products/savon.webp', unit: 'pièce', availability: 'in' },
    { id: 'demo-lessive', name: 'Lessive liquide 1 L', category: 'Ménage', sell_price: 7000, photo: '/products/lessive.webp', unit: 'bouteille', availability: 'in' },
    { id: 'demo-pain', name: 'Pain (miche)', category: 'Alimentation', sell_price: 600, photo: '/products/pain.webp', unit: 'pièce', availability: 'low' },
    { id: 'demo-oeufs', name: 'Œufs (plateau de 30)', category: 'Alimentation', sell_price: 19500, photo: '/products/oeufs.webp', unit: 'plateau', availability: 'out' },
  ],
};
