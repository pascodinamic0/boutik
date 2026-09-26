import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BoutikDB, setDb, getDb } from '@/lib/db';
import { addExpense, createSale } from '@/lib/actions';
import { MAX_TRIES, isNetworkMessage, pullShop, pushOutbox, retryFailed, syncNow, syncStore, type ApplyResult, type Remote } from '@/lib/sync';
import type { Op, Product, Row, Shop } from '@/lib/types';

const shop: Shop = {
  id: 'shop-1', name: 'Test', commune: 'Matete', shop_type: 'alimentation', currency: 'CDF', exchange_rate: 2800,
  phone: null, plan: 'trial', trial_ends_at: '2026-10-26T00:00:00Z', owner_id: 'u1', created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z',
} as unknown as Shop;
const actor = { shop, userId: 'u1', userName: 'Maman' };
const product = {
  id: 'p1', shop_id: shop.id, name: 'Sucre', category: 'Alimentation', buy_price: 3800, sell_price: 4500, quantity: 10, unit: 'kg',
  low_stock: 3, barcode: null, photo: null, archived: false, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z',
} as unknown as Product;

/** In-memory server: idempotent inserts by id, like ON CONFLICT DO NOTHING. */
class FakeRemote implements Remote {
  tables = new Map<string, Map<string, Row>>();
  applied: Op[] = [];
  mode: 'ok' | 'offline' | 'reject' = 'ok';
  clock = 0;
  async isAuthenticated() {
    return true;
  }
  async apply(op: Op): Promise<ApplyResult> {
    if (this.mode === 'offline') return { ok: false, retryable: true, message: 'TypeError: Failed to fetch' };
    if (this.mode === 'reject') return { ok: false, retryable: false, message: '403 42501 new row violates row-level security policy' };
    this.applied.push(op);
    const t = this.tables.get(op.table) ?? new Map();
    this.tables.set(op.table, t);
    for (const r of op.rows) {
      const synced_at = new Date(Date.UTC(2026, 8, 26, 12, 0, this.clock++)).toISOString();
      if (op.kind === 'insert') {
        if (!t.has(r.id as string)) t.set(r.id as string, { ...r, synced_at });
      } else t.set(r.id as string, { ...t.get(r.id as string), ...r, synced_at });
    }
    return { ok: true };
  }
  async pull(table: string, shopId: string, since: string | null, from: number, to: number) {
    const rows = [...(this.tables.get(table)?.values() ?? [])]
      .filter((r) => r.shop_id === shopId && (!since || (r.synced_at as string) > since))
      .sort((a, b) => (a.synced_at as string).localeCompare(b.synced_at as string));
    return rows.slice(from, to + 1);
  }
  async pullShops() {
    return { shops: [shop as unknown as Row], members: [{ shop_id: shop.id, user_id: 'u1', role: 'owner', display_name: 'Maman' } as Row] };
  }
  count(table: string) {
    return this.tables.get(table)?.size ?? 0;
  }
}

let n = 0;
beforeEach(async () => {
  setDb(new BoutikDB(`test-${n++}`));
  await getDb().products.put(product);
});
afterEach(async () => {
  await getDb().delete();
  setDb(null);
});

const sell = (qty = 2) =>
  createSale(actor, { lines: [{ product, qty, unit_price: 4500 }], discount: null, method: 'mpesa', reference: 'MP123' });

describe('sync queue', () => {
  it('a sale is applied locally and queued as one outbox item with client UUIDs', async () => {
    const sale = await sell(2);
    const db = getDb();
    expect(await db.sales.get(sale.id)).toBeTruthy();
    expect((await db.products.get('p1'))!.quantity).toBe(8);
    const items = await db.outbox.toArray();
    expect(items).toHaveLength(1);
    expect(items[0].ops.map((o) => o.table)).toEqual(['sales', 'sale_items', 'stock_movements']);
    expect(items[0].ops[0].rows[0].id).toBe(sale.id);
    expect(sale.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('pushes queued mutations in order and empties the queue', async () => {
    await sell(1);
    await addExpense(actor, 'transport', 3500, 'Taxi', '2026-09-26');
    const remote = new FakeRemote();
    const res = await pushOutbox(remote);
    expect(res).toMatchObject({ pushed: 2, failed: 0, stoppedOffline: false });
    expect(remote.applied.map((o) => o.table)).toEqual(['sales', 'sale_items', 'stock_movements', 'expenses']);
    expect(await getDb().outbox.count()).toBe(0);
  });

  it('keeps everything queued while offline, then syncs when back online', async () => {
    await sell(1);
    await sell(1);
    const remote = new FakeRemote();
    remote.mode = 'offline';
    const r1 = await pushOutbox(remote);
    expect(r1.stoppedOffline).toBe(true);
    expect(isNetworkMessage(r1.stopReason)).toBe(true);
    expect(await getDb().outbox.count()).toBe(2);
    remote.mode = 'ok';
    await syncNow(remote, shop.id);
    expect(await getDb().outbox.count()).toBe(0);
    expect(remote.count('sales')).toBe(2);
    expect(syncStore.get()).toMatchObject({ pending: 0, failed: 0, online: true });
  });

  it('replaying an item is idempotent (no duplicate rows on the server)', async () => {
    await sell(1);
    const item = (await getDb().outbox.toArray())[0];
    const remote = new FakeRemote();
    await pushOutbox(remote);
    for (const op of item.ops) await remote.apply(op); // e.g. a retry after a lost response
    expect(remote.count('sales')).toBe(1);
    expect(remote.count('stock_movements')).toBe(1);
  });

  it('permanent errors are retried a few times, then parked as failed without blocking', async () => {
    await sell(1);
    const remote = new FakeRemote();
    remote.mode = 'reject';
    for (let i = 0; i < MAX_TRIES; i++) await pushOutbox(remote);
    const [item] = await getDb().outbox.toArray();
    expect(item.dead).toBe(true);
    expect(item.tries).toBe(MAX_TRIES);
    // a later mutation still goes through
    remote.mode = 'ok';
    await addExpense(actor, 'loyer', 100000, null, '2026-09-26');
    const res = await pushOutbox(remote);
    expect(res.pushed).toBe(1);
    expect(remote.count('expenses')).toBe(1);
    // the user can put the failed item back in the queue
    await retryFailed();
    expect((await getDb().outbox.toArray())[0].dead).toBe(false);
  });

  it('pull keeps local stock correct while sales are still pending', async () => {
    const remote = new FakeRemote();
    await remote.apply({ table: 'products', kind: 'insert', rows: [{ ...product, quantity: 10 } as unknown as Row] });
    remote.mode = 'offline';
    await sell(3); // local quantity 7, not yet on the server
    remote.mode = 'ok';
    await pullShop(remote, shop.id); // server still says 10
    expect((await getDb().products.get('p1'))!.quantity).toBe(7);
    await pushOutbox(remote);
    expect(await getDb().outbox.count()).toBe(0);
  });

  it('pull is incremental via the synced_at cursor (with a small safety overlap)', async () => {
    const remote = new FakeRemote();
    const sinces: (string | null)[] = [];
    const orig = remote.pull.bind(remote);
    remote.pull = async (t, sid, since, f, to) => {
      if (t === 'products') sinces.push(since);
      return orig(t, sid, since, f, to);
    };
    await remote.apply({ table: 'products', kind: 'insert', rows: [product as unknown as Row] });
    await pullShop(remote, shop.id);
    expect(sinces[0]).toBeNull();
    const cursor = (await getDb().meta.get(`cursor:${shop.id}:products`))!.value as string;
    expect(cursor).toBe(remote.tables.get('products')!.get('p1')!.synced_at);
    await pullShop(remote, shop.id);
    expect(new Date(cursor).getTime() - new Date(sinces[1]!).getTime()).toBe(15_000);
  });
});
