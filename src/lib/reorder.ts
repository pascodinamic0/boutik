import type { Product, SaleItem, Sale } from './types';

export interface ReorderItem {
  product: Product;
  dailyVelocity: number;
  daysOfStock: number | null;
  urgency: number; // plus bas = plus urgent
  reason: 'out' | 'low' | 'velocity';
}

/**
 * Produits à réapprovisionner, triés par urgence.
 * Urgence ≈ jours de stock restants (vélocité 14 j si dispo), sinon quantité / seuil.
 */
export function reorderSuggestions(
  products: Product[],
  sales: Sale[],
  items: SaleItem[],
  opts: { now?: Date; lookbackDays?: number } = {},
): ReorderItem[] {
  const now = opts.now ?? new Date();
  const lookbackDays = opts.lookbackDays ?? 14;
  const from = new Date(now.getTime() - lookbackDays * 86_400_000).toISOString();
  const saleIds = new Set(sales.filter((s) => s.created_at >= from).map((s) => s.id));
  const sold = new Map<string, number>();
  for (const i of items) {
    if (!saleIds.has(i.sale_id) || !i.product_id) continue;
    sold.set(i.product_id, (sold.get(i.product_id) ?? 0) + i.qty);
  }

  const out: ReorderItem[] = [];
  for (const p of products) {
    if (p.archived) continue;
    const qtySold = sold.get(p.id) ?? 0;
    const dailyVelocity = qtySold / lookbackDays;
    const daysOfStock = dailyVelocity > 0 ? p.quantity / dailyVelocity : null;
    const isOut = p.quantity <= 0;
    const isLow = p.quantity <= p.low_stock;
    const velocityRisk = daysOfStock !== null && daysOfStock <= 7 && p.quantity > 0;
    if (!isOut && !isLow && !velocityRisk) continue;
    const urgency =
      daysOfStock !== null
        ? Math.max(0, daysOfStock)
        : isOut
          ? 0
          : (p.low_stock > 0 ? p.quantity / p.low_stock : p.quantity) * 10;
    out.push({
      product: p,
      dailyVelocity: Math.round(dailyVelocity * 1000) / 1000,
      daysOfStock: daysOfStock === null ? null : Math.round(daysOfStock * 10) / 10,
      urgency,
      reason: isOut ? 'out' : isLow ? 'low' : 'velocity',
    });
  }
  return out.sort((a, b) => a.urgency - b.urgency || a.product.quantity - b.product.quantity);
}
