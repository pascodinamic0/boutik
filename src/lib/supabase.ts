'use client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Remote, ApplyResult } from './sync';
import type { Op, Row } from './types';
import type { DataTable } from './db';

let client: SupabaseClient | null = null;

/** fetch with a hard timeout so a dead connection can't hang a sync forever. */
const timedFetch: typeof fetch = (input, init) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new DOMException('Request timed out', 'TimeoutError')), 20_000);
  init?.signal?.addEventListener('abort', () => ctrl.abort(init.signal!.reason));
  return fetch(input, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(timer));
};

export function supabase(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'boutik.auth' },
      // The sync engine has its own retry loop; fail fast so offline is detected quickly.
      db: { retry: false },
      global: { fetch: timedFetch },
    });
  }
  return client;
}

function classify(status: number, message: string, code?: string): ApplyResult {
  const retryable =
    status === 0 ||
    status >= 500 ||
    status === 401 ||
    status === 408 ||
    status === 429 ||
    /fetch|network|Load failed|JWT/i.test(message) ||
    code === 'PGRST301';
  return { ok: false, retryable, message: `${status} ${code ?? ''} ${message}`.trim() };
}

export const supabaseRemote: Remote = {
  async isAuthenticated() {
    const { data } = await supabase().auth.getSession();
    return !!data.session;
  },
  async apply(op: Op): Promise<ApplyResult> {
    try {
      const sb = supabase();
      if (op.kind === 'insert') {
        const { error, status } = await sb.from(op.table).upsert(op.rows, { onConflict: 'id', ignoreDuplicates: true });
        if (error) return classify(status, error.message, error.code);
        return { ok: true };
      }
      for (const row of op.rows) {
        const { id, ...patch } = row as Row & { id: string };
        const { error, status } = await sb.from(op.table).update(patch).eq('id', id);
        if (error) return classify(status, error.message, error.code);
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, retryable: true, message: e instanceof Error ? e.message : String(e) };
    }
  },
  async pull(table: DataTable, shopId: string, since: string | null, from: number, to: number) {
    let q = supabase().from(table).select('*').eq('shop_id', shopId);
    if (since) q = q.gt('synced_at', since);
    const { data, error } = await q.order('synced_at', { ascending: true }).order('id').range(from, to);
    if (error) throw new Error(error.message);
    return (data ?? []) as Row[];
  },
  async pullShops() {
    const sb = supabase();
    const { data: u } = await sb.auth.getSession();
    const uid = u.session?.user.id;
    if (!uid) return { shops: [], members: [] };
    const { data: mine, error } = await sb.from('shop_members').select('shop_id').eq('user_id', uid);
    if (error) throw new Error(error.message);
    const ids = (mine ?? []).map((m) => m.shop_id as string);
    if (!ids.length) return { shops: [], members: [] };
    const [s, m] = await Promise.all([
      sb.from('shops').select('*').in('id', ids),
      sb.from('shop_members').select('*').in('shop_id', ids),
    ]);
    if (s.error) throw new Error(s.error.message);
    if (m.error) throw new Error(m.error.message);
    return { shops: (s.data ?? []) as Row[], members: (m.data ?? []) as Row[] };
  },
};
