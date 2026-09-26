import { getDb, DATA_TABLES, type DataTable, getMeta, setMeta } from './db';
import type { Op, OutboxItem, Row, Product } from './types';
import { nowIso } from './ids';

// ---------------------------------------------------------------------------
// Remote abstraction (Supabase in the app, a fake in unit tests)
// ---------------------------------------------------------------------------
export type ApplyResult = { ok: true } | { ok: false; retryable: boolean; message: string };

export interface Remote {
  isAuthenticated(): Promise<boolean>;
  apply(op: Op): Promise<ApplyResult>;
  /** Rows of `table` for a shop changed after `since` (server clock), ordered by synced_at. */
  pull(table: DataTable, shopId: string, since: string | null, from: number, to: number): Promise<Row[]>;
  pullShops(): Promise<{ shops: Row[]; members: Row[] }>;
}

// ---------------------------------------------------------------------------
// Status store
// ---------------------------------------------------------------------------
export interface SyncState {
  online: boolean;
  syncing: boolean;
  pending: number;
  failed: number;
  lastSyncAt: string | null;
  lastError: string | null;
}

let state: SyncState = {
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  syncing: false,
  pending: 0,
  failed: 0,
  lastSyncAt: typeof localStorage === 'undefined' ? null : localStorage.getItem('boutik.lastSync'),
  lastError: null,
};
const listeners = new Set<() => void>();
function setState(p: Partial<SyncState>) {
  state = { ...state, ...p };
  listeners.forEach((l) => l());
}
export const syncStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export async function refreshCounts() {
  const db = getDb();
  const all = await db.outbox.toArray();
  setState({ pending: all.filter((i) => !i.dead).length, failed: all.filter((i) => i.dead).length });
}

// ---------------------------------------------------------------------------
// Outbox
// ---------------------------------------------------------------------------
export const MAX_TRIES = 5;

export function makeOutboxItem(id: string, shopId: string, label: string, ops: Op[]): OutboxItem {
  return { id, shop_id: shopId, label, ops, created_at: nowIso(), tries: 0, last_error: null, dead: false };
}

export interface PushResult {
  pushed: number;
  failed: number;
  stoppedOffline: boolean;
  /** Message of the retryable error that stopped the push, if any. */
  stopReason?: string;
}

/** True when an error message means the server could not be reached at all. */
export function isNetworkMessage(msg: string | null | undefined) {
  return !!msg && /failed to fetch|networkerror|load failed|network request failed|fetch failed|timed? ?out|abort|internet|^0\b/i.test(msg);
}

/**
 * Pushes queued mutations in order. Each op is idempotent on the server (client UUIDs +
 * ON CONFLICT DO NOTHING), so an item interrupted half-way can safely be replayed.
 * - retryable error (network, 5xx, auth refresh): stop, keep the item for later.
 * - permanent error (RLS, validation): count a try; after MAX_TRIES mark it dead.
 */
export async function pushOutbox(remote: Remote): Promise<PushResult> {
  const db = getDb();
  const items = await db.outbox.orderBy('seq').toArray();
  let pushed = 0;
  let failed = 0;
  for (const item of items) {
    if (item.dead) continue;
    let error: { retryable: boolean; message: string } | null = null;
    for (const op of item.ops) {
      const r = await remote.apply(op);
      if (!r.ok) {
        error = r;
        break;
      }
    }
    if (!error) {
      await db.outbox.delete(item.seq!);
      pushed++;
      continue;
    }
    if (error.retryable) {
      await db.outbox.update(item.seq!, { last_error: error.message });
      return { pushed, failed, stoppedOffline: true, stopReason: error.message };
    }
    const tries = item.tries + 1;
    await db.outbox.update(item.seq!, { tries, last_error: error.message, dead: tries >= MAX_TRIES });
    failed++;
  }
  return { pushed, failed, stoppedOffline: false };
}

/** Put failed (dead) items back in the queue. */
export async function retryFailed() {
  const db = getDb();
  await db.outbox.filter((i) => i.dead).modify({ dead: false, tries: 0 });
  await refreshCounts();
}

export async function discardFailed() {
  const db = getDb();
  await db.outbox.filter((i) => i.dead).delete();
  await refreshCounts();
}

// ---------------------------------------------------------------------------
// Pull
// ---------------------------------------------------------------------------
const NUMERIC: Record<string, string[]> = {
  shops: ['exchange_rate'],
  products: ['buy_price', 'sell_price', 'quantity', 'low_stock'],
  stock_movements: ['delta', 'unit_cost'],
  sales: ['subtotal', 'discount', 'total', 'paid', 'rate'],
  sale_items: ['qty', 'unit_price', 'unit_cost'],
  credit_payments: ['amount'],
  expenses: ['amount'],
};

export function normalizeRow(table: string, row: Row): Row {
  const out: Row = { ...row };
  for (const k of NUMERIC[table] ?? []) {
    if (out[k] !== null && out[k] !== undefined) out[k] = Number(out[k]);
  }
  delete out.synced_at;
  return out;
}

const PAGE = 1000;
const SLACK_MS = 15_000;

export async function pullShop(remote: Remote, shopId: string) {
  const db = getDb();
  for (const table of DATA_TABLES) {
    const key = `cursor:${shopId}:${table}`;
    const cursor = await getMeta<string | null>(key, null);
    const since = cursor ? new Date(new Date(cursor).getTime() - SLACK_MS).toISOString() : null;
    let from = 0;
    let maxSeen = cursor;
    for (;;) {
      const rows = await remote.pull(table, shopId, since, from, from + PAGE - 1);
      if (rows.length) {
        for (const r of rows) {
          const s = r.synced_at as string | undefined;
          if (s && (!maxSeen || s > maxSeen)) maxSeen = s;
        }
        const normalized = rows.map((r) => normalizeRow(table, r));
        await db.transaction('rw', [db.table(table), db.outbox], async () => {
          await db.table(table).bulkPut(normalized);
          if (table === 'products') await reapplyPendingStock(normalized.map((r) => r.id as string));
        });
      }
      if (rows.length < PAGE) break;
      from += PAGE;
    }
    if (maxSeen && maxSeen !== cursor) await setMeta(key, maxSeen);
  }
}

/**
 * Server quantities do not include stock movements still waiting in the outbox:
 * re-apply them locally after a pull so the on-device stock stays correct.
 */
async function reapplyPendingStock(productIds: string[]) {
  const db = getDb();
  const ids = new Set(productIds);
  const items = await db.outbox.toArray();
  const deltas = new Map<string, number>();
  for (const it of items) {
    for (const op of it.ops) {
      if (op.table !== 'stock_movements' || op.kind !== 'insert') continue;
      for (const r of op.rows) {
        const pid = r.product_id as string;
        if (ids.has(pid)) deltas.set(pid, (deltas.get(pid) ?? 0) + Number(r.delta));
      }
    }
  }
  for (const [pid, d] of deltas) {
    const p = (await db.products.get(pid)) as Product | undefined;
    if (p) await db.products.put({ ...p, quantity: p.quantity + d });
  }
}

export async function pullMemberships(remote: Remote) {
  const db = getDb();
  const { shops, members } = await remote.pullShops();
  await db.transaction('rw', db.shops, db.shop_members, async () => {
    await db.shops.clear();
    await db.shop_members.clear();
    await db.shops.bulkPut(shops.map((r) => normalizeRow('shops', r)) as never[]);
    await db.shop_members.bulkPut(members.map((r) => normalizeRow('shop_members', r)) as never[]);
  });
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------
let running: Promise<void> | null = null;
let again = false;

export async function syncNow(remote: Remote, shopId: string | null): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    do {
      again = false;
      await syncOnce(remote, shopId);
    } while (again);
  })().finally(() => {
    running = null;
  });
  return running;
}

async function syncOnce(remote: Remote, shopId: string | null) {
  // navigator.onLine can claim "online" on captive / dead networks, so an actual
  // network failure also flips the status to offline until a sync succeeds again.
  const online = typeof navigator === 'undefined' ? true : navigator.onLine;
  if (!online) setState({ online: false });
  await refreshCounts();
  if (!online) return;
  if (!(await remote.isAuthenticated())) return;
  setState({ syncing: true });
  try {
    const res = await pushOutbox(remote);
    await refreshCounts();
    if (res.stoppedOffline) {
      setState({ lastError: res.stopReason ?? 'offline', ...(isNetworkMessage(res.stopReason) ? { online: false } : {}) });
      return;
    }
    await pullMemberships(remote);
    if (shopId) await pullShop(remote, shopId);
    const at = nowIso();
    setState({ lastSyncAt: at, lastError: null, online: true });
    try {
      localStorage.setItem('boutik.lastSync', at);
    } catch {}
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    setState({ lastError: msg, ...(isNetworkMessage(msg) ? { online: false } : {}) });
  } finally {
    setState({ syncing: false });
    await refreshCounts();
  }
}

export function setOnline(online: boolean) {
  setState({ online });
}
