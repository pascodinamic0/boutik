import type { Metadata } from 'next';
import AppRoot from '@/app-shell/AppRoot';

export const metadata: Metadata = { title: 'Ma boutique', robots: { index: false } };

// Every /app/* URL renders the same offline-capable shell; routing happens on the device.
export const dynamic = 'force-static';
export const dynamicParams = true;
export function generateStaticParams() {
  return [
    { slug: [] },
    { slug: ['vendre'] },
    { slug: ['ventes'] },
    { slug: ['stock'] },
    { slug: ['stock', 'nouveau'] },
    { slug: ['credit'] },
    { slug: ['depenses'] },
    { slug: ['rapports'] },
    { slug: ['reglages'] },
    { slug: ['bienvenue'] },
  ];
}

export default function AppPage() {
  return <AppRoot />;
}
