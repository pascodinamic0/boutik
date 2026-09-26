'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fr, type TKey, type Dict } from './fr';
import { ln } from './ln';

export type Lang = 'fr' | 'ln';
export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'ln', label: 'Lingala', short: 'LN' },
];
const DICTS: Record<Lang, Dict> = { fr, ln };
const KEY = 'boutik.lang';

export function translate(lang: Lang, key: TKey, vars?: Record<string, string | number>): string {
  let s: string = DICTS[lang][key] ?? fr[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
  /** translate a key that may not exist (e.g. user categories); falls back to raw text */
  tx: (prefix: string, raw: string) => string;
}
const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr');
  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved === 'ln' || saved === 'fr') setLangState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang === 'ln' ? 'ln' : 'fr';
  }, [lang]);
  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(KEY, l);
    setLangState(l);
  }, []);
  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      t: (k, v) => translate(lang, k, v),
      tx: (prefix, raw) => {
        const k = `${prefix}.${raw}` as TKey;
        return k in fr ? translate(lang, k) : raw;
      },
    }),
    [lang, setLang],
  );
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error('I18nProvider missing');
  return c;
}
export function useT() {
  return useI18n().t;
}
export type { TKey };
