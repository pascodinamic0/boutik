'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { getDb, wipeLocalData } from '@/lib/db';
import { supabase, supabaseRemote } from '@/lib/supabase';
import { syncNow, syncStore, setOnline, refreshCounts } from '@/lib/sync';
import { onMutation, type Actor } from '@/lib/actions';
import type { Member, Role, Shop } from '@/lib/types';

export interface AppUser {
  id: string;
  email: string;
  name: string;
}

interface AppCtx {
  status: 'loading' | 'ready';
  user: AppUser | null;
  shops: Shop[];
  shop: Shop | null;
  member: Member | null;
  role: Role;
  isOwner: boolean;
  actor: Actor | null;
  bootstrapped: boolean;
  selectShop: (id: string) => void;
  sync: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AppCtx | null>(null);
const LAST_USER = 'boutik.lastUser';
const CURRENT_SHOP = 'boutik.shop';

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [shopId, setShopId] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const db = getDb();

  // --- auth (works offline thanks to the cached session / last user) --------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setShopId(localStorage.getItem(CURRENT_SHOP));
      let u: AppUser | null = null;
      try {
        const { data } = await supabase().auth.getSession();
        const su = data.session?.user;
        if (su) {
          u = {
            id: su.id,
            email: su.email ?? '',
            name: (su.user_metadata?.name as string) || (su.email ?? '').split('@')[0],
          };
          localStorage.setItem(LAST_USER, JSON.stringify(u));
        }
      } catch {
        /* offline */
      }
      if (!u) {
        const raw = localStorage.getItem(LAST_USER);
        const hasLocal = raw && (await db.shops.count()) > 0;
        if (raw && (hasLocal || !navigator.onLine)) u = JSON.parse(raw) as AppUser;
      }
      if (cancelled) return;
      if (!u) {
        location.replace('/connexion');
        return;
      }
      setUser(u);
      setStatus('ready');
    })();
    const { data: sub } = supabase().auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && navigator.onLine) {
        // Session revoked elsewhere: keep local data only if there are unsynced changes.
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [db]);

  // --- local data ----------------------------------------------------------
  const shopsRaw = useLiveQuery(() => db.shops.toArray(), [], undefined);
  const members = useLiveQuery(() => (user ? db.shop_members.where('user_id').equals(user.id).toArray() : []), [user?.id], []);
  const shops = useMemo(() => {
    const mine = new Set((members ?? []).map((m) => m.shop_id));
    return (shopsRaw ?? []).filter((s) => mine.has(s.id)).sort((a, b) => a.created_at.localeCompare(b.created_at));
  }, [shopsRaw, members]);

  const shop = useMemo(() => shops.find((s) => s.id === shopId) ?? shops[0] ?? null, [shops, shopId]);
  const member = useMemo(() => (members ?? []).find((m) => m.shop_id === shop?.id) ?? null, [members, shop?.id]);
  const role: Role = member?.role ?? 'seller';
  const actor = useMemo<Actor | null>(
    () => (shop && user ? { shop, userId: user.id, userName: member?.display_name || user.name } : null),
    [shop, user, member?.display_name],
  );

  useEffect(() => {
    if (shop && shop.id !== shopId) {
      setShopId(shop.id);
      localStorage.setItem(CURRENT_SHOP, shop.id);
    }
  }, [shop, shopId]);

  // --- sync engine ----------------------------------------------------------
  const shopRef = useRef<string | null>(null);
  shopRef.current = shop?.id ?? shopId;
  const sync = useCallback(async () => {
    await syncNow(supabaseRemote, shopRef.current);
  }, []);

  useEffect(() => {
    if (status !== 'ready') return;
    let t: ReturnType<typeof setTimeout> | null = null;
    onMutation(() => {
      if (t) clearTimeout(t);
      t = setTimeout(() => void sync(), 250);
    });
    const onOnline = () => {
      setOnline(true);
      void sync();
    };
    const onOffline = () => setOnline(false);
    const onVis = () => document.visibilityState === 'visible' && void sync();
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVis);
    // Every 20 s normally; every 5 s while the server looked unreachable, to recover fast.
    let tick = 0;
    const iv = setInterval(() => {
      tick++;
      if (!navigator.onLine) return;
      if (!syncStore.get().online || tick % 4 === 0) void sync();
    }, 5_000);
    void refreshCounts();
    (async () => {
      await sync();
      setBootstrapped(true);
    })();
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVis);
      clearInterval(iv);
      if (t) clearTimeout(t);
    };
  }, [status, sync]);

  // When the shop changes, pull its data.
  useEffect(() => {
    if (status === 'ready' && shop?.id) void sync();
  }, [shop?.id, status, sync]);

  const selectShop = useCallback((id: string) => {
    localStorage.setItem(CURRENT_SHOP, id);
    setShopId(id);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase().auth.signOut({ scope: 'local' });
    } catch {
      /* ignore */
    }
    await wipeLocalData();
    localStorage.removeItem(LAST_USER);
    localStorage.removeItem(CURRENT_SHOP);
    localStorage.removeItem('boutik.lastSync');
    location.replace('/connexion');
  }, []);

  const value: AppCtx = {
    status,
    user,
    shops,
    shop,
    member,
    role,
    isOwner: role === 'owner',
    actor,
    bootstrapped: bootstrapped || shops.length > 0,
    selectShop,
    sync,
    signOut,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error('AppProvider missing');
  return c;
}

export function useActor(): Actor {
  const { actor } = useApp();
  if (!actor) throw new Error('no actor');
  return actor;
}

export { syncStore };
