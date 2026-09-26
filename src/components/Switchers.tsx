'use client';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Globe, Moon, Sun, SunMoon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LANGS, useI18n } from '@/i18n';
import { useTheme, type ThemePref } from './Providers';

export function LangSwitcher({ className, compact }: { className?: string; compact?: boolean }) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} className={clsx('relative', className)}>
      <motion.button
        whileTap={{ scale: 0.94 }}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('common.language')}
        aria-expanded={open}
        data-testid="lang-switcher"
        className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
      >
        <Globe size={18} />
        {!compact && <span>{LANGS.find((l) => l.code === lang)?.short}</span>}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-pop"
            role="menu"
          >
            {LANGS.map((l) => (
              <button
                key={l.code}
                role="menuitemradio"
                aria-checked={lang === l.code}
                data-testid={`lang-${l.code}`}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-surface-2"
              >
                <span>
                  <span className="mr-2 inline-block w-6 text-xs font-bold text-muted">{l.short}</span>
                  {l.label}
                </span>
                {lang === l.code && <Check size={16} className="text-brand" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { dark, setTheme } = useTheme();
  const { t } = useI18n();
  return (
    <motion.button
      whileTap={{ scale: 0.9, rotate: -15 }}
      type="button"
      data-testid="theme-toggle"
      aria-label={dark ? t('common.light') : t('common.dark')}
      title={dark ? t('common.light') : t('common.dark')}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className={clsx('inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-surface-2', className)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={dark ? 'd' : 'l'} initial={{ opacity: 0, rotate: -40 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 40 }} transition={{ duration: 0.15 }}>
          {dark ? <Sun size={19} /> : <Moon size={19} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

export function ThemeSegment() {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const opts: { v: ThemePref; icon: React.ReactNode; label: string }[] = [
    { v: 'light', icon: <Sun size={16} />, label: t('common.light') },
    { v: 'dark', icon: <Moon size={16} />, label: t('common.dark') },
    { v: 'system', icon: <SunMoon size={16} />, label: t('common.system') },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          data-testid={`theme-${o.v}`}
          onClick={() => setTheme(o.v)}
          className={clsx(
            'flex h-11 items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition',
            theme === o.v ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:text-ink',
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
