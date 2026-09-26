import { getDb } from './db';
import { uuid, nowIso } from './ids';
import { cartTotals, roundMoney } from './money';
import { makeOutboxItem, refreshCounts } from './sync';
import type {
  CreditPayment,
  Customer,
  Expense,
  Movement,
  Op,
  PayMethod,
  Product,
  Sale,
  SaleItem,
  SaleMethod,
  Shop,
} from './types';

export interface Actor {
  shop: Shop;
  userId: string;
  userName: string;
}

let kick: () => void = () => {};
/** Registered by the sync engine: called after each local mutation. */
export function onMutation(fn: () => void) {
  kick = fn;
}

async function commit(shopId: string, label: string, ops: Op[], local: () => Promise<void>) {
  const db = getDb();
  await db.transaction('rw', db.tables, async () => {
    await local();
    await db.outbox.add(makeOutboxItem(uuid(), shopId, label, ops));
  });
  await refreshCounts();
  kick();
}

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------
export interface SaleInput {
  lines: { product: Product; qty: number; unit_price: number }[];
  discount: { type: 'amount' | 'percent'; value: number } | null;
  method: SaleMethod;
  reference?: string | null;
  customerId?: string | null;
  paidNow?: number; // for credit sales (deposit)
  dueDate?: string | null;
  note?: string | null;
}

export async function createSale(a: Actor, input: SaleInput): Promise<Sale> {
  if (!input.lines.length) throw new Error('empty_cart');
  const cur = a.shop.currency;
  const totals = cartTotals(
    input.lines.map((l) => ({ qty: l.qty, unit_price: l.unit_price, unit_cost: l.product.buy_price })),
    input.discount,
    cur,
  );
  const isCredit = input.method === 'credit';
  if (isCredit && !input.customerId) throw new Error('customer_required');
  const created = nowIso();
  const sale: Sale = {
    id: uuid(),
    shop_id: a.shop.id,
    customer_id: input.customerId ?? null,
    subtotal: totals.subtotal,
    discount: totals.discount,
    total: totals.total,
    paid: isCredit ? roundMoney(Math.min(Math.max(input.paidNow ?? 0, 0), totals.total), cur) : totals.total,
    method: input.method,
    reference: input.reference?.trim() || null,
    is_credit: isCredit,
    due_date: isCredit ? input.dueDate ?? null : null,
    currency: cur,
    rate: a.shop.exchange_rate,
    seller_id: a.userId,
    seller_name: a.userName,
    note: input.note ?? null,
    created_at: created,
  };
  const items: SaleItem[] = input.lines.map((l) => ({
    id: uuid(),
    sale_id: sale.id,
    shop_id: a.shop.id,
    product_id: l.product.id,
    name: l.product.name,
    qty: l.qty,
    unit_price: l.unit_price,
    unit_cost: l.product.buy_price,
    created_at: created,
  }));
  const moves: Movement[] = input.lines.map((l) => ({
    id: uuid(),
    shop_id: a.shop.id,
    product_id: l.product.id,
    delta: -l.qty,
    kind: 'sale',
    unit_cost: l.product.buy_price,
    note: null,
    sale_id: sale.id,
    created_by: a.userId,
    created_at: created,
  }));
  const db = getDb();
  await commit(
    a.shop.id,
    'sale',
    [
      { table: 'sales', kind: 'insert', rows: [sale as never] },
      { table: 'sale_items', kind: 'insert', rows: items as never[] },
      { table: 'stock_movements', kind: 'insert', rows: moves as never[] },
    ],
    async () => {
      await db.sales.add(sale);
      await db.sale_items.bulkAdd(items);
      await db.stock_movements.bulkAdd(moves);
      for (const l of input.lines) {
        const p = await db.products.get(l.product.id);
        if (p) await db.products.put({ ...p, quantity: p.quantity - l.qty, updated_at: created });
      }
    },
  );
  return sale;
}

// ---------------------------------------------------------------------------
// Products & stock
// ---------------------------------------------------------------------------
export interface ProductInput {
  name: string;
  category: string;
  buy_price: number;
  sell_price: number;
  unit: string;
  barcode: string | null;
  low_stock: number;
  photo: string | null;
}

export async function addProduct(a: Actor, input: ProductInput, initialQty: number): Promise<Product> {
  const now = nowIso();
  const p: Product = { id: uuid(), shop_id: a.shop.id, quantity: 0, archived: false, created_at: now, updated_at: now, ...input };
  const ops: Op[] = [{ table: 'products', kind: 'insert', rows: [p as never] }];
  let mv: Movement | null = null;
  if (initialQty > 0) {
    mv = {
      id: uuid(),
      shop_id: a.shop.id,
      product_id: p.id,
      delta: initialQty,
      kind: 'initial',
      unit_cost: input.buy_price,
      note: null,
      sale_id: null,
      created_by: a.userId,
      created_at: now,
    };
    ops.push({ table: 'stock_movements', kind: 'insert', rows: [mv as never] });
  }
  const db = getDb();
  await commit(a.shop.id, 'product', ops, async () => {
    await db.products.add({ ...p, quantity: initialQty });
    if (mv) await db.stock_movements.add(mv);
  });
  return { ...p, quantity: initialQty };
}

export async function updateProduct(a: Actor, id: string, patch: Partial<ProductInput> & { archived?: boolean }) {
  const db = getDb();
  const now = nowIso();
  await commit(a.shop.id, 'product', [{ table: 'products', kind: 'update', rows: [{ id, ...patch, updated_at: now }] }], async () => {
    const p = await db.products.get(id);
    if (p) await db.products.put({ ...p, ...patch, updated_at: now });
  });
}

export async function moveStock(
  a: Actor,
  product: Product,
  kind: 'restock' | 'adjust',
  delta: number,
  opts: { unitCost?: number | null; note?: string | null; updateBuyPrice?: boolean } = {},
) {
  if (!delta) return;
  const db = getDb();
  const now = nowIso();
  const mv: Movement = {
    id: uuid(),
    shop_id: a.shop.id,
    product_id: product.id,
    delta,
    kind,
    unit_cost: opts.unitCost ?? product.buy_price,
    note: opts.note?.trim() || null,
    sale_id: null,
    created_by: a.userId,
    created_at: now,
  };
  const ops: Op[] = [{ table: 'stock_movements', kind: 'insert', rows: [mv as never] }];
  const newBuy = opts.updateBuyPrice && opts.unitCost ? opts.unitCost : null;
  if (newBuy !== null) ops.push({ table: 'products', kind: 'update', rows: [{ id: product.id, buy_price: newBuy, updated_at: now }] });
  await commit(a.shop.id, kind, ops, async () => {
    await db.stock_movements.add(mv);
    const p = await db.products.get(product.id);
    if (p) await db.products.put({ ...p, quantity: p.quantity + delta, buy_price: newBuy ?? p.buy_price, updated_at: now });
  });
}

// ---------------------------------------------------------------------------
// Customers & credit
// ---------------------------------------------------------------------------
export async function addCustomer(a: Actor, name: string, phone: string | null, note: string | null = null): Promise<Customer> {
  const now = nowIso();
  const c: Customer = { id: uuid(), shop_id: a.shop.id, name: name.trim(), phone: phone?.trim() || null, note, created_at: now, updated_at: now };
  const db = getDb();
  await commit(a.shop.id, 'customer', [{ table: 'customers', kind: 'insert', rows: [c as never] }], async () => {
    await db.customers.add(c);
  });
  return c;
}

export async function updateCustomer(a: Actor, id: string, patch: { name?: string; phone?: string | null; note?: string | null }) {
  const db = getDb();
  const now = nowIso();
  await commit(a.shop.id, 'customer', [{ table: 'customers', kind: 'update', rows: [{ id, ...patch, updated_at: now }] }], async () => {
    const c = await db.customers.get(id);
    if (c) await db.customers.put({ ...c, ...patch, updated_at: now });
  });
}

export async function addRepayment(a: Actor, customerId: string, amount: number, method: PayMethod, reference: string | null) {
  const p: CreditPayment = {
    id: uuid(),
    shop_id: a.shop.id,
    customer_id: customerId,
    amount: roundMoney(amount, a.shop.currency),
    method,
    reference: reference?.trim() || null,
    created_by: a.userId,
    created_at: nowIso(),
  };
  const db = getDb();
  await commit(a.shop.id, 'repayment', [{ table: 'credit_payments', kind: 'insert', rows: [p as never] }], async () => {
    await db.credit_payments.add(p);
  });
  return p;
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------
export async function addExpense(a: Actor, category: string, amount: number, note: string | null, spentOn: string) {
  const now = nowIso();
  const e: Expense = {
    id: uuid(),
    shop_id: a.shop.id,
    category,
    amount: roundMoney(amount, a.shop.currency),
    note: note?.trim() || null,
    spent_on: spentOn,
    deleted: false,
    created_by: a.userId,
    created_at: now,
    updated_at: now,
  };
  const db = getDb();
  await commit(a.shop.id, 'expense', [{ table: 'expenses', kind: 'insert', rows: [e as never] }], async () => {
    await db.expenses.add(e);
  });
  return e;
}

export async function deleteExpense(a: Actor, id: string) {
  const db = getDb();
  const now = nowIso();
  await commit(a.shop.id, 'expense', [{ table: 'expenses', kind: 'update', rows: [{ id, deleted: true, updated_at: now }] }], async () => {
    const e = await db.expenses.get(id);
    if (e) await db.expenses.put({ ...e, deleted: true, updated_at: now });
  });
}

// ---------------------------------------------------------------------------
// Shop settings
// ---------------------------------------------------------------------------
export async function updateShop(a: Actor, patch: Partial<Pick<Shop, 'name' | 'commune' | 'shop_type' | 'exchange_rate' | 'phone'>>) {
  const db = getDb();
  await commit(a.shop.id, 'shop', [{ table: 'shops', kind: 'update', rows: [{ id: a.shop.id, ...patch }] }], async () => {
    const s = await db.shops.get(a.shop.id);
    if (s) await db.shops.put({ ...s, ...patch });
  });
}
