'use client';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Database } from 'lucide-react';
import { useT } from '@/i18n';
import { Button } from './ui';

export function ConsentBanner() {
  const t = useT();
  const [show, setShow] = useState(false);
  const [inApp, setInApp] = useState(false);
  useEffect(() => {
    setShow(!localStorage.getItem('boutik.consent'));
    setInApp(location.pathname.startsWith('/app'));
  }, []);
  const accept = () => {
    localStorage.setItem('boutik.consent', new Date().toISOString());
    setShow(false);
  };
  return (
    <AnimatePresence>
      {show && (
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
          <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface/95 p-4 shadow-pop backdrop-blur-xl sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                <Database size={18} />
              </span>
              <p className="text-[13.5px] leading-snug text-ink">
                {t('consent.text')}{' '}
                <Link href="/confidentialite" className="font-semibold text-brand underline-offset-2 hover:underline">
                  {t('consent.more')}
                </Link>
              </p>
            </div>
            <Button size="sm" onClick={accept} className="shrink-0 self-end sm:self-auto" data-testid="consent-accept">
              {t('consent.accept')}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
