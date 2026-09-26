import Dexie, { type Table } from 'dexie';
import type {
  CreditPayment,
  Customer,
  Expense,
  Member,
  Meta,
  Movement,
  OutboxItem,
  Product,
  Sale,
  SaleItem,
  Shop,
} from './types';

export class BoutikDB extends Dexie {
  shops!: Table<Shop, string>;
  shop_members!: Table<Member, [string, string]>;
  products!: Table<Product, string>;
  stock_movements!: Table<Movement, string>;
  customers!: Table<Customer, string>;
  sales!: Table<Sale, string>;
  sale_items!: Table<SaleItem, string>;
  credit_payments!: Table<CreditPayment, string>;
  expenses!: Table<Expense, string>;
  outbox!: Table<OutboxItem, number>;
  meta!: Table<Meta, string>;

  constructor(name = 'boutik') {
    super(name);
    this.version(1).stores({
      shops: 'id',
      shop_members: '[shop_id+user_id], shop_id, user_id',
      products: 'id, shop_id',
      stock_movements: 'id, shop_id, product_id, [shop_id+created_at]',
      customers: 'id, shop_id',
      sales: 'id, shop_id, customer_id, [shop_id+created_at]',
      sale_items: 'id, shop_id, sale_id, [shop_id+created_at]',
      credit_payments: 'id, shop_id, customer_id',
      expenses: 'id, shop_id, [shop_id+spent_on]',
      outbox: '++seq, id, shop_id',
      meta: 'key',
    });
  }
}

let _db: BoutikDB | null = null;
export function getDb(): BoutikDB {
  if (!_db) _db = new BoutikDB();
  return _db;
}

/** For tests: swap the singleton (e.g. with a fake-indexeddb backed instance). */
export function setDb(db: BoutikDB | null) {
  _db = db;
}

// Pull order matters for the first sync: items before their sales (so totals and
// profit are right as soon as a sale appears), stock history last.
export const DATA_TABLES = [
  'products',
  'customers',
  'sale_items',
  'sales',
  'credit_payments',
  'expenses',
  'stock_movements',
] as const;
export type DataTable = (typeof DATA_TABLES)[number];

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const m = await getDb().meta.get(key);
  return m ? (m.value as T) : fallback;
}
export async function setMeta(key: string, value: unknown) {
  await getDb().meta.put({ key, value });
}

export async function wipeLocalData() {
  const db = getDb();
  await db.transaction('rw', db.tables, async () => {
    for (const t of db.tables) await t.clear();
  });
}
