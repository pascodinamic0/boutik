import type { Expense, Sale, SaleItem, SaleMethod } from './types';

export type RangeKey = 'today' | 'week' | 'month' | '30d';

export function dayKey(d: Date | string): string {
  const x = typeof d === 'string' ? new Date(d) : d;
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${x.getFullYear()}-${m}-${day}`;
}

export function startOfDay(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function rangeBounds(key: RangeKey, now = new Date()): { from: Date; to: Date; days: number } {
  const today = startOfDay(now);
  const to = new Date(today.getTime() + 86_400_000);
  if (key === 'today') return { from: today, to, days: 1 };
  if (key === 'week') return { from: new Date(today.getTime() - 6 * 86_400_000), to, days: 7 };
  if (key === '30d') return { from: new Date(today.getTime() - 29 * 86_400_000), to, days: 30 };
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from, to, days: Math.round((to.getTime() - from.getTime()) / 86_400_000) };
}

export interface Summary {
  revenue: number;
  count: number;
  profit: number;
  cost: number;
  discounts: number;
  expenses: number;
  net: number;
  avgBasket: number;
  creditGiven: number;
  byMethod: { method: SaleMethod; amount: number; count: number }[];
  topProducts: { name: string; product_id: string | null; qty: number; revenue: number; profit: number }[];
  series: { day: string; revenue: number; profit: number }[];
}

const METHODS: SaleMethod[] = ['cash', 'mpesa', 'orange', 'airtel', 'afrimoney', 'credit'];

export function summarize(
  sales: Sale[],
  items: SaleItem[],
  expenses: Expense[],
  from: Date,
  to: Date,
): Summary {
  const f = from.toISOString();
  const t = to.toISOString();
  const inRange = sales.filter((s) => s.created_at >= f && s.created_at < t);
  const ids = new Set(inRange.map((s) => s.id));
  const its = items.filter((i) => ids.has(i.sale_id));
  const saleDay = new Map(inRange.map((s) => [s.id, dayKey(s.created_at)]));

  const revenue = inRange.reduce((s, x) => s + x.total, 0);
  const discounts = inRange.reduce((s, x) => s + x.discount, 0);
  const cost = its.reduce((s, i) => s + i.qty * i.unit_cost, 0);
  const profit = revenue - cost;
  const fromKey = dayKey(from);
  const toKey = dayKey(new Date(to.getTime() - 1));
  const exp = expenses
    .filter((e) => !e.deleted && e.spent_on >= fromKey && e.spent_on <= toKey)
    .reduce((s, e) => s + e.amount, 0);

  const byMethodMap = new Map<SaleMethod, { amount: number; count: number }>();
  for (const s of inRange) {
    const cur = byMethodMap.get(s.method) ?? { amount: 0, count: 0 };
    cur.amount += s.total;
    cur.count += 1;
    byMethodMap.set(s.method, cur);
  }
  const byMethod = METHODS.map((m) => ({ method: m, ...(byMethodMap.get(m) ?? { amount: 0, count: 0 }) })).filter(
    (m) => m.count > 0,
  );

  const prod = new Map<string, { name: string; product_id: string | null; qty: number; revenue: number; profit: number }>();
  for (const i of its) {
    const k = i.product_id ?? i.name;
    const cur = prod.get(k) ?? { name: i.name, product_id: i.product_id, qty: 0, revenue: 0, profit: 0 };
    cur.qty += i.qty;
    cur.revenue += i.qty * i.unit_price;
    cur.profit += i.qty * (i.unit_price - i.unit_cost);
    prod.set(k, cur);
  }
  const topProducts = [...prod.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  const days: string[] = [];
  for (let d = new Date(from); d < to; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) days.push(dayKey(d));
  const rev = new Map<string, number>();
  const cst = new Map<string, number>();
  for (const s of inRange) rev.set(dayKey(s.created_at), (rev.get(dayKey(s.created_at)) ?? 0) + s.total);
  for (const i of its) {
    const k = saleDay.get(i.sale_id)!;
    cst.set(k, (cst.get(k) ?? 0) + i.qty * i.unit_cost);
  }
  const series = days.map((day) => ({ day, revenue: rev.get(day) ?? 0, profit: (rev.get(day) ?? 0) - (cst.get(day) ?? 0) }));

  return {
    revenue,
    count: inRange.length,
    profit,
    cost,
    discounts,
    expenses: exp,
    net: profit - exp,
    avgBasket: inRange.length ? revenue / inRange.length : 0,
    creditGiven: inRange.filter((s) => s.is_credit).reduce((s, x) => s + (x.total - x.paid), 0),
    byMethod,
    topProducts,
    series,
  };
}
