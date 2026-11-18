import type { ReactNode } from 'react';

/** Storefront shell: light paper theme, safe areas. Main app PWA unchanged. */
export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return <div className="sf-shell min-h-dvh">{children}</div>;
}
