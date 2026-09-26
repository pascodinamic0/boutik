import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/app',
    name: 'Boutik — Gestion de boutique',
    short_name: 'Boutik',
    description: 'Ventes, stock, carnet de crédit et mobile money. Fonctionne sans internet.',
    lang: 'fr',
    dir: 'ltr',
    start_url: '/app?source=pwa',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait',
    background_color: '#faf6f0',
    theme_color: '#c2531f',
    categories: ['business', 'finance', 'productivity'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/mark.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
    shortcuts: [
      { name: 'Nouvelle vente', short_name: 'Vendre', url: '/app/vendre', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Carnet de crédit', short_name: 'Crédit', url: '/app/credit', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Stock', short_name: 'Stock', url: '/app/stock', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
