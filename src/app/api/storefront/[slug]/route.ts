import { NextResponse } from 'next/server';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { getPublicStorefront } from '@/lib/storefront-server';

export const runtime = 'nodejs';
export const revalidate = 60;

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const ip = clientIp(req);
  const rl = rateLimit(`storefront:${ip}`, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans un instant.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          'Cache-Control': 'no-store',
        },
      },
    );
  }

  const data = await getPublicStorefront(slug);
  if (!data) {
    return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404, headers: { 'Cache-Control': 'public, s-maxage=30' } });
  }
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'X-RateLimit-Remaining': String(rl.remaining),
    },
  });
}
