'use client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Logo } from './Logo';
import { LangSwitcher, ThemeToggle } from './Switchers';
import { Footer } from './landing/Landing';
import { useI18n } from '@/i18n';

export interface LegalDoc {
  title: string;
  intro: string;
  sections: { h: string; p: string[] }[];
}

export function LegalPage({ fr, ln }: { fr: LegalDoc; ln: LegalDoc }) {
  const { lang, t } = useI18n();
  const doc = lang === 'ln' ? ln : fr;
  return (
    <div>
      <header className="pt-safe sticky top-0 z-40 border-b border-line/60 bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-4 sm:px-6">
          <Link href="/" className="mr-auto">
            <Logo size={30} />
          </Link>
          <LangSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft size={16} /> {t('legal.backHome')}
        </Link>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl">{doc.title}</h1>
        <p className="mt-2 text-sm text-muted">{t('legal.updated')}</p>
        <p className="mt-6 text-lg leading-relaxed">{doc.intro}</p>
        <div className="mt-10 space-y-8">
          {doc.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl font-bold">{s.h}</h2>
              {s.p.map((p, i) => (
                <p key={i} className="mt-3 leading-relaxed text-muted">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
