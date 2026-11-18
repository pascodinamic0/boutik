import { describe, expect, it } from 'vitest';
import { DeterministicForecastProvider, buildDeterministicAdvice, computeForecast } from '@/lib/forecasts';
import { reorderSuggestions } from '@/lib/reorder';
import type { Product, Sale, SaleItem } from '@/lib/types';

const now = new Date('2026-11-18T12:00:00.000Z');

function product(partial: Partial<Product> & Pick<Product, 'id' | 'name' | 'quantity'>): Product {
  return {
    shop_id: 's1',
    category: 'Alimentation',
    buy_price: 1000,
    sell_price: 1500,
    unit: 'pièce',
    barcode: null,
    low_stock: 5,
    photo: null,
    archived: false,
    storefront_hidden: false,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

function sale(id: string, daysAgo: number, total = 3000): Sale {
  const d = new Date(now.getTime() - daysAgo * 86_400_000);
  return {
    id,
    shop_id: 's1',
    customer_id: null,
    subtotal: total,
    discount: 0,
    total,
    paid: total,
    method: 'cash',
    reference: null,
    is_credit: false,
    due_date: null,
    currency: 'CDF',
    rate: 2800,
    seller_id: null,
    seller_name: 'Test',
    note: null,
    created_at: d.toISOString(),
  };
}

function item(saleId: string, productId: string, name: string, qty: number, unit_price = 1500): SaleItem {
  return {
    id: `${saleId}-${productId}`,
    sale_id: saleId,
    shop_id: 's1',
    product_id: productId,
    name,
    qty,
    unit_price,
    unit_cost: 1000,
    created_at: now.toISOString(),
  };
}

describe('DeterministicForecastProvider', () => {
  it('computes revenue and velocity from lookback window', () => {
    const products = [
      product({ id: 'p1', name: 'Riz', quantity: 10, low_stock: 5 }),
      product({ id: 'p2', name: 'Huile', quantity: 2, low_stock: 5 }),
    ];
    // 30 units of Riz over 30 days => 1/day; Huile 15 over 30 => 0.5/day
    const sales = Array.from({ length: 30 }, (_, i) => sale(`s${i}`, i + 1, 4500));
    const items = sales.flatMap((s, i) => [
      item(s.id, 'p1', 'Riz', 1, 1500),
      ...(i % 2 === 0 ? [item(s.id, 'p2', 'Huile', 1, 3000)] : []),
    ]);

    const f = new DeterministicForecastProvider().compute({ sales, items, products, now, lookbackDays: 30 });
    expect(f.source).toBe('deterministic');
    expect(f.lookbackDays).toBe(30);
    expect(f.expectedRevenue7d).toBeGreaterThan(0);
    expect(f.expectedRevenue30d).toBeGreaterThan(f.expectedRevenue7d);

    const riz = f.products.find((p) => p.product_id === 'p1')!;
    expect(riz.dailyVelocity).toBeCloseTo(1, 1);
    expect(riz.daysOfStock).toBeCloseTo(10, 0);
    expect(riz.suggestedReorderQty).toBeGreaterThan(0);

    const huile = f.products.find((p) => p.product_id === 'p2')!;
    expect(huile.isLow).toBe(true);
    expect(huile.daysOfStock).toBeLessThan(riz.daysOfStock!);

    // Urgency order: lower days of stock first
    expect(f.products[0].product_id).toBe('p2');
  });

  it('handles zero velocity without crashing', () => {
    const products = [product({ id: 'p1', name: 'Sel', quantity: 40 })];
    const f = computeForecast({ sales: [], items: [], products, now });
    expect(f.products[0].daysOfStock).toBeNull();
    expect(f.products[0].stockOutDate).toBeNull();
    expect(f.expectedRevenue7d).toBe(0);
  });

  it('builds French advice text', () => {
    const f = computeForecast({
      sales: [sale('s1', 1)],
      items: [item('s1', 'p1', 'Riz', 2)],
      products: [product({ id: 'p1', name: 'Riz', quantity: 1, low_stock: 5 })],
      now,
    });
    const advice = buildDeterministicAdvice(f);
    expect(advice).toMatch(/chiffre d'affaires|7 jours/i);
    expect(advice).toContain('Riz');
  });
});

describe('reorderSuggestions', () => {
  it('orders by urgency using sales velocity', () => {
    const products = [
      product({ id: 'slow', name: 'Slow', quantity: 4, low_stock: 5 }),
      product({ id: 'fast', name: 'Fast', quantity: 4, low_stock: 5 }),
      product({ id: 'ok', name: 'Ok', quantity: 50, low_stock: 5 }),
    ];
    const sales = [sale('a', 1), sale('b', 2), sale('c', 3)];
    const items = [
      item('a', 'fast', 'Fast', 3),
      item('b', 'fast', 'Fast', 3),
      item('c', 'fast', 'Fast', 3),
      item('a', 'slow', 'Slow', 0.2),
    ];
    const list = reorderSuggestions(products, sales, items, { now, lookbackDays: 14 });
    expect(list.map((x) => x.product.id)).toContain('fast');
    expect(list.map((x) => x.product.id)).toContain('slow');
    expect(list.map((x) => x.product.id)).not.toContain('ok');
    // Fast sells out sooner → more urgent
    expect(list[0].product.id).toBe('fast');
  });
});
