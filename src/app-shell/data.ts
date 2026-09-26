'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { getDb } from '@/lib/db';
import { customerCredit, type CustomerCredit } from '@/lib/credit';
import type { Customer, Product } from '@/lib/types';
import { useApp } from './AppContext';

export function useShopId() {
  return useApp().shop?.id ?? '';
}

export function useProducts(includeArchived = false) {
  const sid = useShopId();
  return useLiveQuery(
    async () => {
      const all = await getDb().products.where('shop_id').equals(sid).toArray();
      return all.filter((p) => includeArchived || !p.archived).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    },
    [sid, includeArchived],
  );
}

export function isLow(p: Product) {
  return p.quantity <= p.low_stock;
}

export function useSales() {
  const sid = useShopId();
  return useLiveQuery(async () => {
    const s = await getDb().sales.where('shop_id').equals(sid).toArray();
    return s.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [sid]);
}

export function useSaleItems() {
  const sid = useShopId();
  return useLiveQuery(() => getDb().sale_items.where('shop_id').equals(sid).toArray(), [sid]);
}

export function useExpenses() {
  const sid = useShopId();
  return useLiveQuery(async () => {
    const e = await getDb().expenses.where('shop_id').equals(sid).toArray();
    return e.filter((x) => !x.deleted).sort((a, b) => b.spent_on.localeCompare(a.spent_on) || b.created_at.localeCompare(a.created_at));
  }, [sid]);
}

export interface CustomerRow {
  customer: Customer;
  credit: CustomerCredit;
}

export function useCustomers(): CustomerRow[] | undefined {
  const sid = useShopId();
  const data = useLiveQuery(async () => {
    const db = getDb();
    const [customers, sales, payments] = await Promise.all([
      db.customers.where('shop_id').equals(sid).toArray(),
      db.sales.where('shop_id').equals(sid).filter((s) => s.is_credit).toArray(),
      db.credit_payments.where('shop_id').equals(sid).toArray(),
    ]);
    return { customers, sales, payments };
  }, [sid]);
  return useMemo(() => {
    if (!data) return undefined;
    const now = new Date();
    return data.customers
      .map((c) => ({
        customer: c,
        credit: customerCredit(
          data.sales.filter((s) => s.customer_id === c.id),
          data.payments.filter((p) => p.customer_id === c.id),
          now,
        ),
      }))
      .sort((a, b) => b.credit.balance - a.credit.balance || a.customer.name.localeCompare(b.customer.name, 'fr'));
  }, [data]);
}
