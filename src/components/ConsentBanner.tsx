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
  useEffect(() => {
    const visible = !localStorage.getItem(CONSENT_KEY);
    setShow(visible);
    setInApp(location.pathname.startsWith('/app'));
    setOnStorefront(location.pathname.startsWith('/b/'));
  }, []);

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
  return (
    <AnimatePresence>
      {show && onStorefront && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 34, delay: 0.25 }}
          className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-[70]"
          data-testid="consent-banner"
        >
          {/* Slim full-width opaque strip on every width — never a floating card */}
          <div className="pointer-events-auto border-t border-black/10 bg-white pb-safe">
            <div className="mx-auto flex h-11 max-w-6xl items-center gap-2 px-3 sm:px-6 lg:px-8">
              <p className="min-w-0 flex-1 truncate text-[11px] leading-none text-[#4a382c] sm:text-[12px]">
                Stockage local hors ligne.{' '}
                <Link href="/confidentialite" className="font-semibold text-[#c2531f] underline-offset-2 hover:underline">
                  {t('consent.more')}
                </Link>
              </p>
              <button
                type="button"
                onClick={accept}
                className="inline-flex h-8 shrink-0 items-center rounded-full bg-[#0a0a0a] px-3.5 text-[11px] font-bold text-white"
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
