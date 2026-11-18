'use client';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useT } from '@/i18n';
import { Button } from './ui';

const CONSENT_KEY = 'boutik.consent';

export function ConsentBanner() {
  const t = useT();
  const [show, setShow] = useState(false);
  const [inApp, setInApp] = useState(false);
  const [onStorefront, setOnStorefront] = useState(false);
  /** cinema | marche | atelier — drives strip color only */
  const [sfTheme, setSfTheme] = useState('cinema');

  useEffect(() => {
    const visible = !localStorage.getItem(CONSENT_KEY);
    setShow(visible);
    setInApp(location.pathname.startsWith('/app'));
    setOnStorefront(location.pathname.startsWith('/b/'));
  }, []);

  useEffect(() => {
    const readTheme = () => {
      const el = document.querySelector('[data-theme]');
      const v = el?.getAttribute('data-theme');
      setSfTheme(v === 'marche' || v === 'atelier' || v === 'cinema' ? v : 'cinema');
    };
    readTheme();
    const mo = new MutationObserver(readTheme);
    mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-theme'] });
    // Theme can land after first paint (client theme router)
    const t = window.setInterval(readTheme, 400);
    const stop = window.setTimeout(() => window.clearInterval(t), 4000);
    return () => {
      mo.disconnect();
      window.clearInterval(t);
      window.clearTimeout(stop);
    };
  }, [onStorefront]);

  useEffect(() => {
    if (!onStorefront) {
      document.documentElement.removeAttribute('data-sf-consent');
      return;
    }
    if (show) document.documentElement.setAttribute('data-sf-consent', '1');
    else document.documentElement.removeAttribute('data-sf-consent');
    return () => document.documentElement.removeAttribute('data-sf-consent');
  }, [show, onStorefront]);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, new Date().toISOString());
    setShow(false);
    window.dispatchEvent(new Event('boutik:consent'));
  };

  const dark = onStorefront && sfTheme === 'cinema';

  return (
    <AnimatePresence>
      {show && onStorefront && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 12, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 34, delay: 0.2 }}
          className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-[70]"
          data-testid="consent-banner"
          data-consent-variant={dark ? 'cinema-dark' : 'light'}
        >
          {/* Always a slim full-width strip — never a floating bottom-left card */}
          <div
            className={
              dark
                ? 'pointer-events-auto border-t border-white/12 bg-[#14110f] pb-safe'
                : 'pointer-events-auto border-t border-black/10 bg-white pb-safe'
            }
          >
            <div className="mx-auto flex h-11 w-full max-w-none items-center gap-2 px-3 sm:px-6 lg:px-8">
              <p
                className={
                  dark
                    ? 'min-w-0 flex-1 truncate text-[11px] leading-none text-white/70 sm:text-[12px]'
                    : 'min-w-0 flex-1 truncate text-[11px] leading-none text-[#4a382c] sm:text-[12px]'
                }
              >
                Stockage local hors ligne.{' '}
                <Link
                  href="/confidentialite"
                  className={
                    dark
                      ? 'font-semibold text-[#e8c98a] underline-offset-2 hover:underline'
                      : 'font-semibold text-[#c2531f] underline-offset-2 hover:underline'
                  }
                >
                  {t('consent.more')}
                </Link>
              </p>
              <button
                type="button"
                onClick={accept}
                className={
                  dark
                    ? 'inline-flex h-8 shrink-0 items-center rounded-full bg-white px-3.5 text-[11px] font-bold text-[#0c0b0a]'
                    : 'inline-flex h-8 shrink-0 items-center rounded-full bg-[#0a0a0a] px-3.5 text-[11px] font-bold text-white'
                }
                data-testid="consent-accept"
              >
                {t('consent.accept')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
      {show && !onStorefront && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 34, delay: 0.4 }}
          className={
            'no-print fixed inset-x-3 z-[60] mx-auto max-w-xl sm:inset-x-6 ' +
            (inApp ? 'bottom-[calc(76px+env(safe-area-inset-bottom))] lg:bottom-6' : 'bottom-[max(0.75rem,env(safe-area-inset-bottom))]')
          }
          data-testid="consent-banner"
        >
          <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
            <p className="text-[13.5px] leading-snug text-ink">
              {t('consent.text')}{' '}
              <Link href="/confidentialite" className="font-semibold text-brand underline-offset-2 hover:underline">
                {t('consent.more')}
              </Link>
            </p>
            <Button size="sm" onClick={accept} className="shrink-0 self-end sm:self-auto" data-testid="consent-accept">
              {t('consent.accept')}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
