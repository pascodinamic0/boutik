'use client';
import { createContext, useCallback, useContext, useEffect, useState, type MouseEvent, type ReactNode } from 'react';

export type RouteName =
  | 'home'
  | 'sell'
  | 'sales'
  | 'receipt'
  | 'stock'
  | 'productNew'
  | 'product'
  | 'credit'
  | 'customer'
  | 'expenses'
  | 'reports'
  | 'settings'
  | 'onboarding'
  | 'notFound';

export interface Route {
  name: RouteName;
  id?: string;
  path: string;
  search: URLSearchParams;
}

export function parseRoute(pathname: string, search = ''): Route {
  const p = pathname.replace(/\/+$/, '') || '/app';
  const s = new URLSearchParams(search);
  const seg = p.split('/').filter(Boolean).slice(1); // drop "app"
  const r = (name: RouteName, id?: string): Route => ({ name, id, path: p, search: s });
  if (seg.length === 0) return r('home');
  const [a, b] = seg;
  switch (a) {
    case 'vendre':
      return r('sell');
    case 'ventes':
      return b ? r('receipt', b) : r('sales');
    case 'stock':
      if (b === 'nouveau') return r('productNew');
      return b ? r('product', b) : r('stock');
    case 'credit':
      return b ? r('customer', b) : r('credit');
    case 'depenses':
      return r('expenses');
    case 'rapports':
      return r('reports');
    case 'reglages':
      return r('settings');
    case 'bienvenue':
      return r('onboarding');
    default:
      return r('notFound');
  }
}

interface RouterCtx {
  route: Route;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
  back: (fallback: string) => void;
}
const Ctx = createContext<RouterCtx | null>(null);
let depth = 0;

/**
 * Tiny client-side router for the offline app shell: every /app/* URL is served by the
 * same cached HTML document, and navigation never needs the network.
 */
export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() =>
    typeof window === 'undefined' ? parseRoute('/app') : parseRoute(location.pathname, location.search),
  );
  useEffect(() => {
    const onPop = () => {
      depth = Math.max(0, depth - 1);
      setRoute(parseRoute(location.pathname, location.search));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const navigate = useCallback((to: string, opts?: { replace?: boolean }) => {
    const url = new URL(to, location.origin);
    if (!url.pathname.startsWith('/app')) {
      location.href = to;
      return;
    }
    if (opts?.replace) history.replaceState(null, '', url.pathname + url.search);
    else {
      depth++;
      history.pushState(null, '', url.pathname + url.search);
    }
    setRoute(parseRoute(url.pathname, url.search));
    window.scrollTo({ top: 0 });
  }, []);
  const back = useCallback(
    (fallback: string) => {
      if (depth > 0) history.back(); else navigate(fallback, { replace: true });
    },
    [navigate],
  );
  return <Ctx.Provider value={{ route, navigate, back }}>{children}</Ctx.Provider>;
}

export function useRouter() {
  const c = useContext(Ctx);
  if (!c) throw new Error('RouterProvider missing');
  return c;
}

export function AppLink({
  href,
  children,
  className,
  replace,
  ...rest
}: { href: string; children: ReactNode; className?: string; replace?: boolean } & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
>) {
  const { navigate } = useRouter();
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    rest.onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(href, { replace });
  };
  return (
    <a href={href} className={className} {...rest} onClick={onClick}>
      {children}
    </a>
  );
}
