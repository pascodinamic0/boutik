import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Adds a seller to a shop. Only the shop owner may call this (checked with the caller's JWT
 * against RLS-protected data); the account itself is created with the service role key,
 * which never leaves the server.
 */
export async function POST(req: Request) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: { shopId?: string; name?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }
  const shopId = String(body.shopId ?? '');
  const name = String(body.name ?? '').trim().slice(0, 80);
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  if (!shopId || !name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: 'Champs invalides' }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: 'Mot de passe trop court (6 caractères minimum)' }, { status: 400 });

  const asUser = createClient(URL_, ANON, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: u, error: ue } = await asUser.auth.getUser(token);
  if (ue || !u.user) return NextResponse.json({ error: 'Session expirée' }, { status: 401 });
  const { data: me } = await asUser.from('shop_members').select('role').eq('shop_id', shopId).eq('user_id', u.user.id).maybeSingle();
  if (me?.role !== 'owner') return NextResponse.json({ error: 'Réservé au propriétaire' }, { status: 403 });

  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!service) return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 });
  const admin = createClient(URL_, service, { auth: { persistSession: false, autoRefreshToken: false } });

  let userId: string | null = null;
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
  if (created.data.user) userId = created.data.user.id;
  else {
    // Existing account: find it and simply add the membership.
    for (let page = 1; page <= 20 && !userId; page++) {
      const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      const hit = data?.users.find((x) => x.email?.toLowerCase() === email);
      if (hit) userId = hit.id;
      if (!data || data.users.length < 200) break;
    }
    if (!userId) return NextResponse.json({ error: created.error?.message ?? 'Impossible de créer le compte' }, { status: 400 });
  }
  if (userId === u.user.id) return NextResponse.json({ error: 'Vous êtes déjà propriétaire' }, { status: 400 });

  const { error: me2 } = await admin
    .from('shop_members')
    .upsert({ shop_id: shopId, user_id: userId, role: 'seller', display_name: name, email }, { onConflict: 'shop_id,user_id', ignoreDuplicates: true });
  if (me2) return NextResponse.json({ error: me2.message }, { status: 400 });
  return NextResponse.json({ ok: true, userId });
}
