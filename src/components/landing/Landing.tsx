'use client';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  CloudOff,
  Coins,
  Package,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Users,
  Wifi,
  Star,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Logo, LogoMark } from '@/components/Logo';
import { LangSwitcher, ThemeToggle } from '@/components/Switchers';
import { useI18n, type TKey } from '@/i18n';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

export function Landing() {
  const { t } = useI18n();
  return (
    <div className="overflow-x-clip">
      <Nav />
      <Hero />
      <Stats />
      <Features />
      <Story />
      <How />
      <Pricing />
      <Faq />
      <Cta />
      <Footer />
      <span className="sr-only">{t('app.tagline')}</span>
    </div>
  );
}

function Nav() {
  const { t } = useI18n();
  return (
    <header className="pt-safe sticky top-0 z-50 border-b border-line/60 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Link href="/" className="mr-auto" aria-label="Boutik">
          <Logo size={32} />
        </Link>
        <nav className="mr-3 hidden items-center gap-1 md:flex">
          {[
            ['#fonctionnalites', 'land.nav.features'],
            ['#tarifs', 'land.nav.pricing'],
            ['#faq', 'land.nav.faq'],
          ].map(([h, k]) => (
            <a key={h} href={h} className="rounded-full px-3.5 py-2 text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-ink">
              {t(k as TKey)}
            </a>
          ))}
        </nav>
        <LangSwitcher />
        <ThemeToggle className="hidden sm:inline-flex" />
        <Link href="/connexion" className="hidden h-10 items-center rounded-full px-4 text-sm font-semibold hover:bg-surface-2 sm:inline-flex" data-testid="nav-login">
          {t('land.nav.login')}
        </Link>
        <Link
          href="/connexion?mode=inscription"
          className="inline-flex h-10 items-center rounded-full bg-brand px-4 text-sm font-bold text-white shadow-[0_8px_20px_-10px_var(--brand)] transition hover:bg-brand-strong"
          data-testid="nav-start"
        >
          <span className="sm:hidden">{t('land.nav.login')}</span>
          <span className="hidden sm:inline">{t('land.nav.start')}</span>
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(ellipse_at_70%_0%,color-mix(in_srgb,var(--brand)_16%,transparent),transparent_60%)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3.5 py-1.5 text-[13px] font-bold text-brand">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            {t('land.hero.badge')}
          </span>
          <h1 className="mt-6 font-display text-[44px] font-bold leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-[68px]">
            {t('land.hero.title')}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{t('land.hero.subtitle')}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/connexion?mode=inscription"
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand px-7 text-base font-bold text-white shadow-[0_14px_30px_-12px_var(--brand)] transition hover:bg-brand-strong"
              data-testid="hero-cta"
            >
              {t('land.hero.cta')} <ArrowRight size={19} className="transition group-hover:translate-x-1" />
            </Link>
            <Link href="/connexion" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-7 text-base font-bold transition hover:bg-surface-2" data-testid="hero-demo">
              <ShoppingBag size={19} className="text-brand" /> {t('land.hero.demo')}
            </Link>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm font-medium text-muted">
            <Check size={16} className="text-ok" /> {t('land.hero.proof')}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} className="relative mx-auto w-full max-w-[560px]">
          <div className="relative aspect-[4/4.3] overflow-hidden rounded-[36px] shadow-pop sm:aspect-[4/4]">
            <Image src="/img/hero.webp" alt="Commerçante souriante dans son alimentation" fill priority sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="absolute -bottom-6 left-3 w-[230px] rounded-3xl border border-line bg-surface/95 p-4 shadow-pop backdrop-blur-xl sm:-left-8 sm:w-[260px]"
          >
            <div className="flex items-center gap-2">
              <LogoMark size={26} />
              <span className="text-xs font-bold text-muted">{t('land.mock.today')}</span>
            </div>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{t('land.mock.sold')}</p>
            <p className="text-2xl font-extrabold tabular">185 400 FC</p>
            <p className="text-xs text-muted tabular">≈ 66,21 $</p>
            <div className="mt-3 flex items-end gap-1">
              {[40, 62, 48, 75, 58, 88, 70].map((h, i) => (
                <motion.span key={i} initial={{ height: 0 }} animate={{ height: h * 0.5 }} transition={{ delay: 0.7 + i * 0.06 }} className={clsx('flex-1 rounded-t-md', i === 5 ? 'bg-brand' : 'bg-brand/30')} />
              ))}
            </div>
            <p className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted">{t('land.mock.profit')}</span>
              <span className="font-bold text-ok">+ 32 800 FC</span>
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.75, duration: 0.6 }}
            className="absolute right-3 top-5 flex items-center gap-2 rounded-2xl border border-line bg-surface/95 px-3 py-2 shadow-pop backdrop-blur-xl sm:-right-6"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e60000] text-[11px] font-extrabold text-white">M</span>
            <span>
              <span className="block text-xs font-bold">M-Pesa · 25 000 FC</span>
              <span className="block text-[11px] text-muted">réf. MP4A7K2Q</span>
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.95, duration: 0.6 }}
            className="absolute -right-1 bottom-24 hidden items-center gap-2 rounded-2xl bg-cocoa px-3 py-2 text-cream shadow-pop sm:flex dark:bg-cream dark:text-cocoa"
          >
            <CloudOff size={16} />
            <span className="text-xs font-bold">{t('land.stat.offline')}</span>
            <Check size={14} className="text-gold" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Stats() {
  const { t } = useI18n();
  const items = [
    { icon: CloudOff, k: 'land.stat.offline' as TKey },
    { icon: Coins, k: 'land.stat.currencies' as TKey },
    { icon: Smartphone, k: 'land.stat.langs' as TKey },
  ];
  return (
    <section className="border-y border-line bg-surface/60">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-8 sm:grid-cols-3 sm:px-6">
        {items.map((it) => (
          <div key={it.k} className="flex items-center justify-center gap-3 text-center sm:justify-start sm:text-left">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <it.icon size={21} />
            </span>
            <span className="text-[15px] font-bold">{t(it.k)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const FEATURES: { icon: typeof Wifi; k: string; tone: string }[] = [
  { icon: CloudOff, k: 'offline', tone: 'bg-brand-soft text-brand' },
  { icon: ShoppingBag, k: 'pos', tone: 'bg-gold-soft text-gold' },
  { icon: Smartphone, k: 'momo', tone: 'bg-danger-soft text-danger' },
  { icon: BookOpen, k: 'credit', tone: 'bg-ok-soft text-ok' },
  { icon: Package, k: 'stock', tone: 'bg-info-soft text-info' },
  { icon: BarChart3, k: 'reports', tone: 'bg-brand-soft text-brand' },
  { icon: Users, k: 'team', tone: 'bg-gold-soft text-gold' },
  { icon: Coins, k: 'fx', tone: 'bg-ok-soft text-ok' },
];

function Features() {
  const { t } = useI18n();
  return (
    <section id="fonctionnalites" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
      <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{t('land.feat.title')}</h2>
        <p className="mt-4 text-lg text-muted">{t('land.feat.subtitle')}</p>
      </motion.div>
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.k}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: (i % 4) * 0.06 }}
            className="card group p-6 transition hover:-translate-y-1 hover:shadow-soft"
          >
            <span className={clsx('flex h-12 w-12 items-center justify-center rounded-2xl transition group-hover:scale-110', f.tone)}>
              <f.icon size={23} />
            </span>
            <h3 className="mt-5 text-lg font-bold">{t(`land.feat.${f.k}.t` as TKey)}</h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{t(`land.feat.${f.k}.d` as TKey)}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Story() {
  const { t } = useI18n();
  return (
    <section className="bg-cocoa text-cream">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-24">
        <motion.div {...fadeUp} className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[32px]">
            <Image src="/img/carnet.webp" alt="Commerçante notant ses comptes avec son téléphone" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
          </div>
          <div className="absolute -bottom-5 right-4 rounded-2xl bg-gold px-4 py-3 text-cocoa shadow-pop">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
            </div>
            <p className="mt-1 text-xs font-bold">Maman Nzuzi · Matete</p>
          </div>
        </motion.div>
        <motion.div {...fadeUp}>
          <Sparkles className="text-gold" />
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">{t('land.story.title')}</h2>
          <p className="mt-6 text-lg leading-relaxed text-cream/80">{t('land.story.text')}</p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              ['6', 'sem.'],
              ['33', 'produits'],
              ['8', 'clients'],
            ].map(([n, l]) => (
              <div key={l} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <p className="text-3xl font-extrabold text-gold">{n}</p>
                <p className="text-xs text-cream/70">{l}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function How() {
  const { t } = useI18n();
  const steps = [
    { n: 1, img: '/img/telephone.webp', alt: 'Femme utilisant son téléphone' },
    { n: 2, img: '/img/kiosque.webp', alt: 'Kiosque de quartier' },
    { n: 3, img: '/img/vendeur.webp', alt: 'Vendeur dans sa boutique' },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <motion.h2 {...fadeUp} className="text-center font-display text-4xl font-bold tracking-tight sm:text-5xl">
        {t('land.how.title')}
      </motion.h2>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div key={s.n} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }} className="card overflow-hidden">
            <div className="relative aspect-[4/3]">
              <Image src={s.img} alt={s.alt} fill sizes="(min-width: 768px) 360px, 100vw" className="object-cover" />
              <span className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand text-lg font-extrabold text-white shadow-lg">{s.n}</span>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-bold">{t(`land.how.${s.n}t` as TKey)}</h3>
              <p className="mt-1.5 text-muted">{t(`land.how.${s.n}d` as TKey)}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  const { t } = useI18n();
  return (
    <section id="tarifs" className="scroll-mt-20 bg-surface-2/60 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{t('land.pricing.title')}</h2>
          <p className="mt-4 text-lg text-muted">{t('land.pricing.subtitle')}</p>
        </motion.div>
        <motion.div {...fadeUp} className="relative mx-auto mt-12 max-w-md">
          <div className="absolute -inset-3 rounded-[40px] bg-gradient-to-br from-brand/30 via-gold/20 to-transparent blur-2xl" />
          <div className="relative overflow-hidden rounded-[32px] border border-line bg-surface shadow-pop" data-testid="plan-card">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#d8622b] to-[#8e3413] p-7 text-white">
              <div className="kente pointer-events-none absolute inset-0 opacity-50" />
              <span className="relative inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-extrabold text-cocoa">
                <Sparkles size={13} /> {t('land.pricing.trial')}
              </span>
              <p className="relative mt-4 text-lg font-bold">{t('land.pricing.plan')}</p>
              <p className="relative mt-1 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold tracking-tight">{t('land.pricing.price')}</span>
                <span className="text-white/80">{t('land.pricing.per')}</span>
              </p>
              <p className="relative mt-1 text-sm text-white/85">{t('land.pricing.alt')}</p>
            </div>
            <div className="p-7">
              <ul className="space-y-3.5">
                {(['f1', 'f2', 'f3', 'f4', 'f5', 'f6'] as const).map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[15px]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    {t(`land.pricing.${f}` as TKey)}
                  </li>
                ))}
              </ul>
              <Link
                href="/connexion?mode=inscription"
                className="mt-7 flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand text-base font-bold text-white shadow-[0_14px_30px_-12px_var(--brand)] transition hover:bg-brand-strong"
                data-testid="pricing-cta"
              >
                {t('land.pricing.cta')} <ArrowRight size={18} />
              </Link>
              <p className="mt-3 text-center text-xs text-muted">{t('land.pricing.note')}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Faq() {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
      <motion.h2 {...fadeUp} className="text-center font-display text-4xl font-bold tracking-tight sm:text-5xl">
        {t('land.faq.title')}
      </motion.h2>
      <div className="mt-12 space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15.5px] font-bold"
            >
              {t(`land.faq.q${i}` as TKey)}
              <ChevronDown size={20} className={clsx('shrink-0 text-muted transition', open === i && 'rotate-180 text-brand')} />
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                  <p className="px-5 pb-5 leading-relaxed text-muted">{t(`land.faq.a${i}` as TKey)}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}

function Cta() {
  const { t } = useI18n();
  return (
    <section className="px-4 pb-20 sm:px-6">
      <motion.div {...fadeUp} className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px]">
        <Image src="/img/marche2.webp" alt="Marché de Kinshasa" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2a1a10]/95 via-[#2a1a10]/80 to-[#2a1a10]/40" />
        <div className="relative px-6 py-16 text-cream sm:px-12 sm:py-20">
          <h2 className="max-w-xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{t('land.cta.title')}</h2>
          <p className="mt-4 max-w-lg text-lg text-cream/80">{t('land.cta.subtitle')}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/connexion?mode=inscription" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand px-7 font-bold text-white transition hover:bg-brand-strong">
              {t('land.hero.cta')} <ArrowRight size={18} />
            </Link>
            <Link href="/connexion" className="inline-flex h-14 items-center justify-center rounded-2xl bg-white/10 px-7 font-bold text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/20">
              {t('land.hero.demo')}
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-line bg-surface/60">
      <div className="pb-safe mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo size={32} />
          <p className="mt-3 max-w-xs text-sm text-muted">{t('land.footer.made')}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <a href="/#fonctionnalites" className="font-semibold text-muted hover:text-ink">{t('land.nav.features')}</a>
          <a href="/#tarifs" className="font-semibold text-muted hover:text-ink">{t('land.nav.pricing')}</a>
          <a href="/#faq" className="font-semibold text-muted hover:text-ink">{t('land.nav.faq')}</a>
          <Link href="/connexion" className="font-semibold text-muted hover:text-ink">{t('land.nav.login')}</Link>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Link href="/confidentialite" className="font-semibold text-muted hover:text-ink">{t('set.privacy')}</Link>
          <Link href="/conditions" className="font-semibold text-muted hover:text-ink">{t('set.terms')}</Link>
          <Link href="/credits" className="font-semibold text-muted hover:text-ink">{t('land.footer.credits')}</Link>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted">
        © 2026 Boutik · Kinshasa, RDC · {t('land.footer.rights')}
      </div>
    </footer>
  );
}
