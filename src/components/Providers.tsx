'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { I18nProvider } from '@/i18n';
import { ToastProvider } from './ui';
import { ConsentBanner } from './ConsentBanner';

export type ThemePref = 'light' | 'dark' | 'system';
const ThemeCtx = createContext<{ theme: ThemePref; setTheme: (t: ThemePref) => void; dark: boolean }>({
  theme: 'system',
  setTheme: () => {},
  dark: false,
});

function applyTheme(t: ThemePref) {
  const dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  const meta = document.querySelectorAll('meta[name="theme-color"]');
  meta.forEach((m) => m.setAttribute('content', dark ? '#130d09' : '#faf6f0'));
  return dark;
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePref>('system');
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = (localStorage.getItem('boutik.theme') as ThemePref) || 'system';
    setThemeState(saved);
    setDark(applyTheme(saved));
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const cur = (localStorage.getItem('boutik.theme') as ThemePref) || 'system';
      if (cur === 'system') setDark(applyTheme('system'));
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const setTheme = useCallback((t: ThemePref) => {
    localStorage.setItem('boutik.theme', t);
    setThemeState(t);
    setDark(applyTheme(t));
  }, []);
  return <ThemeCtx.Provider value={{ theme, setTheme, dark }}>{children}</ThemeCtx.Provider>;
}
export const useTheme = () => useContext(ThemeCtx);

function ServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production' && !localStorage.getItem('boutik.sw-dev')) return;
    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        const reg = await navigator.serviceWorker.ready;
        // Resources fetched before the worker took control: ask it to cache them too.
        const urls = performance
          .getEntriesByType('resource')
          .map((e) => new URL(e.name))
          .filter((u) => u.origin === location.origin && /^\/(_next\/static|products|img|icons)\//.test(u.pathname))
          .map((u) => u.pathname + u.search);
        reg.active?.postMessage({ type: 'CACHE_URLS', urls });
      } catch {
        /* unsupported */
      }
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          {children}
          <ConsentBanner />
          <ServiceWorker />
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
