import { describe, expect, it } from 'vitest';
import { cartTotals, changeDue, convert, formatCompact, formatMoney, otherCurrency, parseAmount, roundMoney } from '@/lib/money';

const clean = (s: string) => s.replace(/\u00a0/g, ' ');

describe('convert', () => {
  it('converts USD to CDF and back with the shop rate', () => {
    expect(convert(2, 'USD', 'CDF', 2800)).toBe(5600);
    expect(convert(5600, 'CDF', 'USD', 2800)).toBe(2);
    expect(convert(1000, 'CDF', 'CDF', 2800)).toBe(1000);
  });
  it('rejects an invalid rate and ignores non-numbers', () => {
    expect(() => convert(10, 'USD', 'CDF', 0)).toThrow();
    expect(convert(NaN, 'USD', 'CDF', 2800)).toBe(0);
  });
  it('knows the other currency', () => {
    expect(otherCurrency('CDF')).toBe('USD');
    expect(otherCurrency('USD')).toBe('CDF');
  });
});

describe('rounding and formatting', () => {
  it('rounds FC to units and USD to cents', () => {
    expect(roundMoney(1234.6, 'CDF')).toBe(1235);
    expect(roundMoney(1.005, 'USD')).toBe(1.01);
    expect(roundMoney(12500 / 2800, 'USD')).toBe(4.46);
  });
  it('formats French style', () => {
    expect(clean(formatMoney(12500, 'CDF'))).toBe('12 500 FC');
    expect(clean(formatMoney(4.4642, 'USD'))).toBe('4,46 $');
    expect(clean(formatMoney(1250000, 'CDF'))).toBe('1 250 000 FC');
    expect(clean(formatMoney(-500, 'CDF'))).toBe('−500 FC');
    expect(clean(formatMoney(500, 'CDF', { sign: true }))).toBe('+500 FC');
    expect(clean(formatCompact(1_200_000, 'CDF'))).toBe('1,2 M FC');
    expect(clean(formatCompact(85_000, 'CDF'))).toBe('85 k FC');
  });
  it('parses user input', () => {
    expect(parseAmount('12 500')).toBe(12500);
    expect(parseAmount('12.500')).toBe(12500);
    expect(parseAmount('4,5')).toBe(4.5);
    expect(parseAmount('2.75')).toBe(2.75);
    expect(parseAmount('5 000 FC')).toBe(5000);
    expect(parseAmount('abc')).toBeNaN();
    expect(parseAmount('')).toBeNaN();
  });
});

describe('cart totals', () => {
  const lines = [
    { qty: 2, unit_price: 4500, unit_cost: 3800 },
    { qty: 3, unit_price: 1800, unit_cost: 1300 },
  ];
  it('sums lines, cost and profit', () => {
    expect(cartTotals(lines, null, 'CDF')).toEqual({ subtotal: 14400, discount: 0, total: 14400, cost: 11500, profit: 2900 });
  });
  it('applies amount and percent discounts, capped at the subtotal', () => {
    expect(cartTotals(lines, { type: 'amount', value: 400 }, 'CDF').total).toBe(14000);
    expect(cartTotals(lines, { type: 'percent', value: 10 }, 'CDF')).toMatchObject({ discount: 1440, total: 12960 });
    expect(cartTotals(lines, { type: 'amount', value: 99999 }, 'CDF').total).toBe(0);
    expect(cartTotals(lines, { type: 'percent', value: 150 }, 'CDF').total).toBe(0);
  });
  it('handles USD cents', () => {
    const t = cartTotals([{ qty: 3, unit_price: 0.35 }], null, 'USD');
    expect(t.total).toBe(1.05);
  });
  it('computes change due', () => {
    expect(changeDue(14400, 20000, 'CDF')).toBe(5600);
    expect(changeDue(14400, 10000, 'CDF')).toBe(0);
  });
});
