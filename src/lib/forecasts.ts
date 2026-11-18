import { dayKey, startOfDay } from './reports';
import type { Product, Sale, SaleItem } from './types';

export interface ForecastInput {
  sales: Sale[];
  items: SaleItem[];
  products: Product[];
  now?: Date;
  /** Fenêtre d'historique pour la vélocité (jours). */
  lookbackDays?: number;
}

export interface ProductForecast {
  product_id: string;
  name: string;
  quantity: number;
  unit: string;
  low_stock: number;
  dailyVelocity: number;
  daysOfStock: number | null;
  stockOutDate: string | null;
  suggestedReorderQty: number;
  expectedSales7d: number;
  expectedSales30d: number;
  isLow: boolean;
}

export interface ForecastResult {
  expectedRevenue7d: number;
  expectedRevenue30d: number;
  topProducts: {
    name: string;
    product_id: string | null;
    expectedQty7d: number;
    expectedRevenue7d: number;
  }[];
  products: ProductForecast[];
  lookbackDays: number;
  generatedAt: string;
  source: 'deterministic';
}

export interface ForecastProvider {
  compute(input: ForecastInput): ForecastResult;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Prévisions déterministes à partir de l'historique de ventes.
 * Vélocité = quantité vendue / jours d'observation (fenêtre lookback).
 * Réassort suggéré ≈ max(0, vélocité×14 − stock, seuil_bas×2 − stock).
 */
export class DeterministicForecastProvider implements ForecastProvider {
  compute(input: ForecastInput): ForecastResult {
    const now = input.now ?? new Date();
    const lookbackDays = clamp(input.lookbackDays ?? 30, 7, 90);
    const today = startOfDay(now);
    const from = new Date(today.getTime() - lookbackDays * 86_400_000);
    const fromIso = from.toISOString();
    const toIso = new Date(today.getTime() + 86_400_000).toISOString();

    const salesIn = input.sales.filter((s) => s.created_at >= fromIso && s.created_at < toIso);
    const saleIds = new Set(salesIn.map((s) => s.id));
    const itemsIn = input.items.filter((i) => saleIds.has(i.sale_id));

    const qtyByProduct = new Map<string, { name: string; qty: number; revenue: number }>();
    let totalRevenue = 0;
    for (const i of itemsIn) {
      const key = i.product_id ?? `name:${i.name}`;
      const cur = qtyByProduct.get(key) ?? { name: i.name, qty: 0, revenue: 0 };
      cur.qty += i.qty;
      cur.revenue += i.qty * i.unit_price;
      qtyByProduct.set(key, cur);
      totalRevenue += i.qty * i.unit_price;
    }

    const dailyRevenue = totalRevenue / lookbackDays;
    const products: ProductForecast[] = [];

    for (const p of input.products.filter((x) => !x.archived)) {
      const stats = qtyByProduct.get(p.id) ?? { name: p.name, qty: 0, revenue: 0 };
      const dailyVelocity = stats.qty / lookbackDays;
      const daysOfStock = dailyVelocity > 0 ? p.quantity / dailyVelocity : null;
      let stockOutDate: string | null = null;
      if (daysOfStock !== null && Number.isFinite(daysOfStock)) {
        if (p.quantity <= 0) stockOutDate = dayKey(today);
        else {
          const d = new Date(today.getTime() + Math.floor(daysOfStock) * 86_400_000);
          stockOutDate = dayKey(d);
        }
      }
      const cover14 = dailyVelocity * 14;
      const buffer = Math.max(p.low_stock * 2, dailyVelocity * 7);
      const suggestedReorderQty = Math.max(0, Math.ceil(Math.max(cover14, buffer) - Math.max(0, p.quantity)));
      products.push({
        product_id: p.id,
        name: p.name,
        quantity: p.quantity,
        unit: p.unit,
        low_stock: p.low_stock,
        dailyVelocity: Math.round(dailyVelocity * 1000) / 1000,
        daysOfStock: daysOfStock === null ? null : Math.round(daysOfStock * 10) / 10,
        stockOutDate,
        suggestedReorderQty,
        expectedSales7d: Math.round(dailyVelocity * 7 * 100) / 100,
        expectedSales30d: Math.round(dailyVelocity * 30 * 100) / 100,
        isLow: p.quantity <= p.low_stock,
      });
    }

    products.sort((a, b) => {
      const da = a.daysOfStock ?? (a.quantity <= 0 ? 0 : Number.POSITIVE_INFINITY);
      const db = b.daysOfStock ?? (b.quantity <= 0 ? 0 : Number.POSITIVE_INFINITY);
      if (da !== db) return da - db;
      return a.quantity - b.quantity;
    });

    const topProducts = [...qtyByProduct.entries()]
      .map(([key, v]) => ({
        name: v.name,
        product_id: key.startsWith('name:') ? null : key,
        expectedQty7d: Math.round((v.qty / lookbackDays) * 7 * 100) / 100,
        expectedRevenue7d: Math.round((v.revenue / lookbackDays) * 7),
      }))
      .sort((a, b) => b.expectedRevenue7d - a.expectedRevenue7d)
      .slice(0, 8);

    return {
      expectedRevenue7d: Math.round(dailyRevenue * 7),
      expectedRevenue30d: Math.round(dailyRevenue * 30),
      topProducts,
      products,
      lookbackDays,
      generatedAt: now.toISOString(),
      source: 'deterministic',
    };
  }
}

export const defaultForecastProvider: ForecastProvider = new DeterministicForecastProvider();

export function computeForecast(input: ForecastInput): ForecastResult {
  return defaultForecastProvider.compute(input);
}

/** Texte de conseil français déterministe (sans OpenAI). */
export function buildDeterministicAdvice(f: ForecastResult, currencyLabel = 'FC'): string {
  const low = f.products.filter((p) => p.isLow || (p.daysOfStock !== null && p.daysOfStock <= 7));
  const top = f.topProducts.slice(0, 3).map((p) => p.name).join(', ');
  const parts = [
    `Sur la base des ${f.lookbackDays} derniers jours, le chiffre d'affaires attendu est d'environ ${f.expectedRevenue7d.toLocaleString('fr-FR')} ${currencyLabel} sur 7 jours et ${f.expectedRevenue30d.toLocaleString('fr-FR')} ${currencyLabel} sur 30 jours.`,
  ];
  if (top) parts.push(`Produits les plus demandés : ${top}.`);
  if (low.length) {
    parts.push(
      `${low.length} produit(s) à réapprovisionner en priorité : ${low
        .slice(0, 4)
        .map((p) => `${p.name}${p.suggestedReorderQty ? ` (~${p.suggestedReorderQty} ${p.unit})` : ''}`)
        .join(', ')}.`,
    );
  } else {
    parts.push('Le stock semble globalement suffisant pour la semaine à venir.');
  }
  return parts.join(' ');
}
