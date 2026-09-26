export type Currency = 'CDF' | 'USD';
export type Role = 'owner' | 'seller';
export type PayMethod = 'cash' | 'mpesa' | 'orange' | 'airtel' | 'afrimoney';
export type SaleMethod = PayMethod | 'credit';
export type MovementKind = 'initial' | 'restock' | 'adjust' | 'sale' | 'return';

export interface Shop {
  id: string;
  name: string;
  commune: string;
  shop_type: string;
  currency: Currency;
  exchange_rate: number;
  phone: string | null;
  plan: 'trial' | 'active' | 'expired';
  trial_ends_at: string;
  created_by: string | null;
  created_at: string;
}

export interface Member {
  shop_id: string;
  user_id: string;
  role: Role;
  display_name: string;
  email: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  category: string;
  buy_price: number;
  sell_price: number;
  quantity: number;
  unit: string;
  barcode: string | null;
  low_stock: number;
  photo: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Movement {
  id: string;
  shop_id: string;
  product_id: string;
  delta: number;
  kind: MovementKind;
  unit_cost: number | null;
  note: string | null;
  sale_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  shop_id: string;
  name: string;
  phone: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  shop_id: string;
  customer_id: string | null;
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  method: SaleMethod;
  reference: string | null;
  is_credit: boolean;
  due_date: string | null;
  currency: Currency;
  rate: number;
  seller_id: string | null;
  seller_name: string | null;
  note: string | null;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  shop_id: string;
  product_id: string | null;
  name: string;
  qty: number;
  unit_price: number;
  unit_cost: number;
  created_at: string;
}

export interface CreditPayment {
  id: string;
  shop_id: string;
  customer_id: string;
  amount: number;
  method: PayMethod;
  reference: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  shop_id: string;
  category: string;
  amount: number;
  note: string | null;
  spent_on: string;
  deleted: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Server tables that the client can write to through the outbox. */
export type RemoteTable =
  | 'shops'
  | 'products'
  | 'stock_movements'
  | 'customers'
  | 'sales'
  | 'sale_items'
  | 'credit_payments'
  | 'expenses';

export type Row = Record<string, unknown>;

/**
 * One remote operation. `insert` is idempotent (ON CONFLICT DO NOTHING on the client UUID),
 * `update` patches the row identified by `rows[i].id`.
 */
export interface Op {
  table: RemoteTable;
  kind: 'insert' | 'update';
  rows: Row[];
}

export interface OutboxItem {
  seq?: number;
  id: string; // client UUID of the mutation
  shop_id: string;
  label: string;
  ops: Op[];
  created_at: string;
  tries: number;
  last_error: string | null;
  dead: boolean;
}

export interface Meta {
  key: string;
  value: unknown;
}
