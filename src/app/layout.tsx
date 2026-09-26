import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Fraunces } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap', weight: ['600', '700'] });

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://boutik.vercel.app';

const splash = [
  [375, 667, 2], [390, 844, 3], [393, 852, 3], [430, 932, 3], [440, 956, 3], [402, 874, 3], [360, 780, 3], [1024, 1366, 2], [820, 1180, 2],
].map(([w, h, d]) => ({
  url: `/splash/splash-${w * d}x${h * d}.png`,
  media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${d}) and (orientation: portrait)`,
}));

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'Boutik — Gestion de boutique hors ligne pour Kinshasa', template: '%s · Boutik' },
  description:
    'Ventes, stock, carnet de crédit, M-Pesa, Orange Money et Airtel Money, en francs et en dollars. Boutik fonctionne même sans internet. 1 mois gratuit.',
  applicationName: 'Boutik',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Boutik', statusBarStyle: 'default', startupImage: splash },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    title: 'Boutik — Votre boutique dans la poche',
    description: 'Le gestionnaire de boutique qui marche même sans internet. Fait pour Kinshasa.',
    images: [{ url: '/img/hero.webp', width: 1400, height: 933 }],
    locale: 'fr_CD',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf6f0' },
    { media: '(prefers-color-scheme: dark)', color: '#130d09' },
  ],
};

const themeScript = `(function(){try{var t=localStorage.getItem('boutik.theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');var l=localStorage.getItem('boutik.lang');if(l==='ln')document.documentElement.lang='ln';}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${jakarta.variable} ${fraunces.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
