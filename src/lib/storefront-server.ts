import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import {
  DEMO_STOREFRONT,
  assertNoPrivateFields,
  sanitizePublicStorefront,
  type PublicStorefront,
} from './storefront';

function supabaseAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function fetchStorefrontUncached(slug: string): Promise<PublicStorefront | null> {
  const normalized = slug.trim().toLowerCase();
  if (normalized === 'demo') return DEMO_STOREFRONT;

  const sb = supabaseAnon();
  if (!sb) {
    return normalized === 'demo' ? DEMO_STOREFRONT : null;
  }

  try {
    const { data, error } = await sb.rpc('get_public_storefront', { p_slug: normalized });
    if (error || data == null) return null;
    const sanitized = sanitizePublicStorefront(data);
    if (!sanitized) return null;
    const leaks = assertNoPrivateFields(sanitized);
    if (leaks.length) {
      console.error('[storefront] private field leak blocked', leaks);
      return null;
    }
    return sanitized;
  } catch (e) {
    console.error('[storefront] fetch failed', e);
    return null;
  }
}

/** ISR-friendly cached lookup (60s). Demo slug never hits the network. */
export function getPublicStorefront(slug: string): Promise<PublicStorefront | null> {
  const key = slug.trim().toLowerCase();
  if (key === 'demo') return Promise.resolve(DEMO_STOREFRONT);
  const cached = unstable_cache(() => fetchStorefrontUncached(key), ['public-storefront', key], {
    revalidate: 60,
    tags: [`storefront:${key}`],
  });
  return cached();
}
