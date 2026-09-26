import { describe, expect, it } from 'vitest';
import { customerCredit, validateRepayment } from '@/lib/credit';
import type { CreditPayment, Sale } from '@/lib/types';

function sale(p: Partial<Sale>): Sale {
  return {
    id: Math.random().toString(36), shop_id: 's', customer_id: 'c', subtotal: 0, discount: 0, total: 0, paid: 0,
    method: 'credit', reference: null, is_credit: true, due_date: null, currency: 'CDF', rate: 2800,
    seller_id: null, seller_name: null, note: null, created_at: '2026-09-01T10:00:00Z', ...p,
  };
}
function pay(amount: number, created_at = '2026-09-20T10:00:00Z'): CreditPayment {
  return { id: Math.random().toString(36), shop_id: 's', customer_id: 'c', amount, method: 'cash', reference: null, created_by: null, created_at };
}
const now = new Date('2026-09-26T12:00:00');

describe('customerCredit', () => {
  it('balance = credit sales minus deposits minus repayments', () => {
    const c = customerCredit([sale({ total: 20000, paid: 5000 }), sale({ total: 10000, paid: 0, created_at: '2026-09-10T10:00:00Z' })], [pay(8000)], now);
    expect(c.totalCredit).toBe(25000);
    expect(c.totalRepaid).toBe(8000);
    expect(c.balance).toBe(17000);
  });
  it('ignores cash sales and fully paid credit sales', () => {
    const c = customerCredit([sale({ total: 5000, paid: 5000 }), sale({ total: 3000, paid: 3000, is_credit: false, method: 'cash' })], [], now);
    expect(c.balance).toBe(0);
    expect(c.lines).toHaveLength(0);
  });
  it('allocates repayments FIFO and flags overdue lines', () => {
    const old = sale({ total: 10000, created_at: '2026-08-01T10:00:00Z', due_date: '2026-08-15' });
    const recent = sale({ total: 6000, created_at: '2026-09-20T10:00:00Z', due_date: '2026-10-04' });
    const c = customerCredit([recent, old], [pay(4000)], now);
    expect(c.lines[0].sale).toBe(old);
    expect(c.lines[0].remaining).toBe(6000);
    expect(c.lines[0].overdue).toBe(true);
    expect(c.lines[1].remaining).toBe(6000);
    expect(c.lines[1].overdue).toBe(false);
    expect(c.overdueAmount).toBe(6000);
    expect(c.oldestOverdueDays).toBe(42);
  });
  it('a fully repaid overdue sale is no longer overdue', () => {
    const c = customerCredit([sale({ total: 10000, due_date: '2026-09-05' })], [pay(10000)], now);
    expect(c.balance).toBe(0);
    expect(c.overdueAmount).toBe(0);
    expect(c.lines[0].overdue).toBe(false);
  });
  it('never goes negative and reports the last payment date', () => {
    const c = customerCredit([sale({ total: 1000 })], [pay(600, '2026-09-02T10:00:00Z'), pay(900, '2026-09-21T10:00:00Z')], now);
    expect(c.balance).toBe(0);
    expect(c.lastPaymentAt).toBe('2026-09-21T10:00:00Z');
  });
  it('handles USD cents without float drift', () => {
    const c = customerCredit([sale({ total: 10.1, paid: 0.3, currency: 'USD' })], [pay(0.2)], now);
    expect(c.balance).toBe(9.6);
  });
});

describe('validateRepayment', () => {
  it('accepts partial and full, rejects invalid or too much', () => {
    expect(validateRepayment(2000, 5000)).toBe('ok');
    expect(validateRepayment(5000, 5000)).toBe('ok');
    expect(validateRepayment(0, 5000)).toBe('invalid');
    expect(validateRepayment(NaN, 5000)).toBe('invalid');
    expect(validateRepayment(6000, 5000)).toBe('too_much');
  });
});
