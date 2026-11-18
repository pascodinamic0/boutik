import { NextResponse } from 'next/server';
import { getPublicStorefront } from '@/lib/storefront-server';

export const revalidate = 60;

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const shop = await getPublicStorefront(slug);
  const name = shop?.name ?? 'Boutique Boutik';
  const short = name.length > 12 ? `${name.slice(0, 11)}…` : name;
  const start = `/b/${slug}?source=pwa`;

  const manifest = {
    id: `/b/${slug}`,
    name,
    short_name: short,
    description: shop?.description || `${name} — catalogue Boutik. Commandez via WhatsApp.`,
    lang: 'fr',
    dir: 'ltr',
    start_url: start,
    scope: '/b/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'any',
    background_color: '#f6efe6',
    theme_color: '#c2531f',
    categories: ['shopping', 'business'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/mark.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
