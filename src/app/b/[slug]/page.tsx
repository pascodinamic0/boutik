import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StorefrontView } from '@/components/storefront/StorefrontView';
import { formatMoney } from '@/lib/money';
import { getPublicStorefront } from '@/lib/storefront-server';

export const revalidate = 60;
export const dynamicParams = true;

export function generateStaticParams() {
  return [{ slug: 'demo' }];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getPublicStorefront(slug);
  if (!shop) return { title: 'Boutique introuvable', robots: { index: false } };
  const top = shop.products.slice(0, 6).map((p) => p.name).join(', ');
  const description =
    shop.description?.trim() ||
    `${shop.name}${shop.commune ? ` · ${shop.commune}` : ''}. Catalogue : ${top || 'produits locaux'}. Commandez via WhatsApp.`;
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://boutik.vercel.app';
  return {
    title: shop.name,
    description,
    applicationName: shop.name,
    manifest: `/b/${shop.slug}/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      title: shop.name,
      statusBarStyle: 'default',
    },
    icons: {
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
      icon: [
        { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    other: {
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-title': shop.name,
    },
    openGraph: {
      title: `${shop.name} — Boutique en ligne`,
      description,
      url: `${site}/b/${shop.slug}`,
      locale: 'fr_CD',
      type: 'website',
      images: [{ url: shop.products.find((p) => p.photo)?.photo || '/img/boutique.webp', width: 1200, height: 800, alt: shop.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: shop.name,
      description,
    },
    alternates: { canonical: `/b/${shop.slug}` },
  };
}

export default async function PublicStorefrontPage({ params }: Props) {
  const { slug } = await params;
  const shop = await getPublicStorefront(slug);
  if (!shop) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: shop.name,
    description: shop.description,
    address: shop.commune ? { '@type': 'PostalAddress', addressLocality: shop.commune, addressCountry: 'CD' } : undefined,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://boutik.vercel.app'}/b/${shop.slug}`,
    makesOffer: shop.products.slice(0, 24).map((p) => ({
      '@type': 'Offer',
      name: p.name,
      price: p.sell_price,
      priceCurrency: shop.currency === 'USD' ? 'USD' : 'CDF',
      availability:
        p.availability === 'out'
          ? 'https://schema.org/OutOfStock'
          : p.availability === 'low'
            ? 'https://schema.org/LimitedAvailability'
            : 'https://schema.org/InStock',
    })),
  };

  return (
    <>
      <meta name="theme-color" content="#c2531f" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <StorefrontView shop={shop} />
      <noscript>
        <ul>
          {shop.products.map((p) => (
            <li key={p.id}>
              {p.name} — {formatMoney(p.sell_price, shop.currency)}
            </li>
          ))}
        </ul>
      </noscript>
    </>
  );
}
