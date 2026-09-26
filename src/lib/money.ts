import type { Currency } from './types';

/** Amounts are stored in the shop's main currency. The exchange rate is CDF per 1 USD. */
export function convert(amount: number, from: Currency, to: Currency, rate: number): number {
  if (!Number.isFinite(amount)) return 0;
  if (from === to) return amount;
  if (!(rate > 0)) throw new Error('Invalid exchange rate');
  return from === 'USD' ? amount * rate : amount / rate;
}

export function otherCurrency(c: Currency): Currency {
  return c === 'CDF' ? 'USD' : 'CDF';
}

/** Round to the currency's natural precision (FC have no cents; USD has 2 decimals). */
export function roundMoney(amount: number, currency: Currency): number {
  if (currency === 'CDF') return Math.round(amount);
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

const nbsp = '\u00a0';

function group(intStr: string): string {
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, nbsp);
}

/** French-style formatting: "12 500 FC", "4,46 $". Deterministic across runtimes. */
export function formatMoney(amount: number, currency: Currency, opts: { sign?: boolean } = {}): string {
  const v = roundMoney(Number(amount) || 0, currency);
  const neg = v < 0;
  const abs = Math.abs(v);
  let body: string;
  if (currency === 'CDF') {
    body = `${group(Math.round(abs).toString())}${nbsp}FC`;
  } else {
    const [i, d] = abs.toFixed(2).split('.');
    body = `${group(i)},${d}${nbsp}$`;
  }
  const s = neg ? '−' : opts.sign && v > 0 ? '+' : '';
  return s + body;
}

/** Compact form for charts: 1,2 M FC / 85 k FC */
export function formatCompact(amount: number, currency: Currency): string {
  const abs = Math.abs(amount);
  const unit = currency === 'CDF' ? 'FC' : '$';
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '')}${nbsp}M${nbsp}${unit}`;
  if (abs >= 10_000) return `${Math.round(amount / 1000)}${nbsp}k${nbsp}${unit}`;
  return formatMoney(amount, currency);
}

/** Parse user input like "12 500", "12.500", "4,5" into a number (NaN if invalid). */
export function parseAmount(input: string): number {
  const s = String(input ?? '').trim().replace(/[\s\u00a0\u202f]/g, '').replace(/(FC|CDF|USD|\$)/gi, '');
  if (!s) return NaN;
  // "12.500" (thousand separator) vs "4.5" (decimal)
  let norm = s;
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) norm = s.replace(/\./g, '');
  else norm = s.replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(norm)) return NaN;
  return Number(norm);
}

export interface CartLine {
  qty: number;
  unit_price: number;
  unit_cost?: number;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  total: number;
  cost: number;
  profit: number;
}

/**
 * Totals for a cart. `discount` is either an absolute amount or a percentage.
 * The discount can never exceed the subtotal.
 */
export function cartTotals(
  lines: CartLine[],
  discount: { type: 'amount' | 'percent'; value: number } | null,
  currency: Currency,
): CartTotals {
  const subtotal = roundMoney(lines.reduce((s, l) => s + l.qty * l.unit_price, 0), currency);
  const cost = roundMoney(lines.reduce((s, l) => s + l.qty * (l.unit_cost ?? 0), 0), currency);
  let d = 0;
  if (discount && discount.value > 0) {
    d = discount.type === 'percent' ? (subtotal * Math.min(discount.value, 100)) / 100 : discount.value;
  }
  d = roundMoney(Math.min(Math.max(d, 0), subtotal), currency);
  const total = roundMoney(subtotal - d, currency);
  return { subtotal, discount: d, total, cost, profit: roundMoney(total - cost, currency) };
}

/** Change to give back for cash payments. */
export function changeDue(total: number, received: number, currency: Currency): number {
  return roundMoney(Math.max(0, received - total), currency);
}
