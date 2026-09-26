import type { CreditPayment, Sale } from './types';

export interface CreditLine {
  sale: Sale;
  owed: number; // amount put on credit for this sale (total - paid at sale)
  remaining: number; // after allocating repayments (FIFO)
  overdue: boolean;
}

export interface CustomerCredit {
  totalCredit: number;
  totalRepaid: number;
  balance: number;
  lines: CreditLine[];
  overdueAmount: number;
  oldestOverdueDays: number;
  lastPaymentAt: string | null;
}

const DAY = 86_400_000;

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Computes a customer's credit position. Repayments are allocated to the oldest
 * credit sales first (FIFO). A line is overdue when its due date has passed and
 * something is still owed on it.
 */
export function customerCredit(sales: Sale[], payments: CreditPayment[], now: Date = new Date()): CustomerCredit {
  const credit = sales
    .filter((s) => s.is_credit && s.total - s.paid > 0)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const totalCredit = round2(credit.reduce((s, x) => s + (x.total - x.paid), 0));
  const totalRepaid = round2(payments.reduce((s, p) => s + p.amount, 0));
  let pool = totalRepaid;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let overdueAmount = 0;
  let oldestOverdueDays = 0;
  const lines: CreditLine[] = credit.map((sale) => {
    const owed = round2(sale.total - sale.paid);
    const used = Math.min(pool, owed);
    pool = round2(pool - used);
    const remaining = round2(owed - used);
    let overdue = false;
    if (remaining > 0 && sale.due_date) {
      const due = new Date(sale.due_date + 'T00:00:00').getTime();
      if (due < today) {
        overdue = true;
        overdueAmount += remaining;
        oldestOverdueDays = Math.max(oldestOverdueDays, Math.floor((today - due) / DAY));
      }
    }
    return { sale, owed, remaining, overdue };
  });
  const last = payments.reduce<string | null>((m, p) => (!m || p.created_at > m ? p.created_at : m), null);
  return {
    totalCredit,
    totalRepaid,
    balance: round2(Math.max(0, totalCredit - totalRepaid)),
    lines,
    overdueAmount: round2(overdueAmount),
    oldestOverdueDays,
    lastPaymentAt: last,
  };
}

/** Validates a repayment amount against the current balance. */
export function validateRepayment(amount: number, balance: number): 'ok' | 'invalid' | 'too_much' {
  if (!Number.isFinite(amount) || amount <= 0) return 'invalid';
  if (amount - balance > 0.001) return 'too_much';
  return 'ok';
}
