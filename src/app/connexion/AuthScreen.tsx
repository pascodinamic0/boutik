'use client';
import { motion } from 'motion/react';
import { ArrowRight, Store, UserRound, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/Logo';
import { LangSwitcher, ThemeToggle } from '@/components/Switchers';
import { Button, Field, Input, Segmented } from '@/components/ui';
import { useI18n } from '@/i18n';
import { wipeLocalData } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export const DEMO = {
  owner: { email: 'demo@boutik.cd', password: 'demo1234' },
  seller: { email: 'vendeur@boutik.cd', password: 'demo1234' },
};

async function afterLogin(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  const raw = localStorage.getItem('boutik.lastUser');
  const prev = raw ? (JSON.parse(raw) as { id: string }) : null;
  if (prev && prev.id !== user.id) {
    await wipeLocalData();
    localStorage.removeItem('boutik.shop');
  }
  localStorage.setItem(
    'boutik.lastUser',
    JSON.stringify({ id: user.id, email: user.email ?? '', name: (user.user_metadata?.name as string) || (user.email ?? '').split('@')[0] }),
  );
  location.assign('/app');
}

export function AuthScreen() {
  const { t } = useI18n();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    if (new URLSearchParams(location.search).get('mode') === 'inscription') setMode('signup');
    supabase()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session) location.replace('/app');
      });
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const login = async (e: string, p: string, key: string) => {
    setErr(null);
    if (!navigator.onLine) return setErr(t('auth.needOnline'));
    setBusy(key);
    const { data, error } = await supabase().auth.signInWithPassword({ email: e.trim().toLowerCase(), password: p });
    if (error || !data.user) {
      setBusy(null);
      return setErr(t('auth.invalid'));
    }
    await afterLogin(data.user);
  };

  const signup = async () => {
    setErr(null);
    if (!navigator.onLine) return setErr(t('auth.needOnline'));
    if (password.length < 6) return setErr(t('auth.weak'));
    setBusy('signup');
    const { data, error } = await supabase().auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name: name.trim() || email.split('@')[0] } },
    });
    if (error) {
      setBusy(null);
      return setErr(/registered|exists/i.test(error.message) ? t('auth.exists') : error.message);
    }
    if (data.session && data.user) return afterLogin(data.user);
    // Fallback if email confirmation were enabled
    await login(email, password, 'signup');
  };

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/hero.webp" alt="Commerçante souriante dans son alimentation" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2a1a10] via-[#2a1a10]/35 to-[#2a1a10]/10" />
        <Link href="/" className="absolute left-10 top-10">
          <Logo size={36} light />
        </Link>
        <div className="absolute inset-x-10 bottom-10 text-cream">
          <p className="max-w-lg font-display text-[42px] font-bold leading-[1.05] tracking-tight">{t('land.hero.title')}</p>
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            {[t('land.stat.offline'), t('land.stat.currencies'), t('land.stat.langs')].map((s) => (
              <span key={s} className="rounded-full bg-white/15 px-3 py-1.5 font-semibold backdrop-blur">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-safe flex min-h-dvh flex-col px-5 pb-8 sm:px-10">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="lg:invisible">
            <Logo size={30} />
          </Link>
          <div className="flex items-center">
            <LangSwitcher />
            <ThemeToggle />
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6">
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight">{t('auth.title')}</h1>
          <p className="mt-1.5 text-muted">{t('auth.subtitle')}</p>

          {offline && (
            <p className="mt-4 flex items-center gap-2 rounded-2xl bg-gold-soft px-4 py-3 text-sm font-medium">
              <WifiOff size={16} /> {t('auth.needOnline')}
            </p>
          )}

          <div className="mt-6 rounded-3xl border border-gold/40 bg-gradient-to-br from-gold-soft to-brand-soft p-4">
            <p className="text-sm font-bold">{t('auth.demoTitle')}</p>
            <p className="mt-0.5 text-xs text-muted">{t('auth.demoHint')}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button onClick={() => login(DEMO.owner.email, DEMO.owner.password, 'owner')} loading={busy === 'owner'} data-testid="demo-owner">
                <Store size={17} /> {t('auth.demoOwner')}
              </Button>
              <Button variant="secondary" onClick={() => login(DEMO.seller.email, DEMO.seller.password, 'seller')} loading={busy === 'seller'} data-testid="demo-seller">
                <UserRound size={17} /> {t('auth.demoSeller')}
              </Button>
            </div>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted">
            <span className="h-px flex-1 bg-line" /> {t('common.or')} <span className="h-px flex-1 bg-line" />
          </div>

          <Segmented
            value={mode}
            onChange={(m) => {
              setMode(m);
              setErr(null);
            }}
            className="w-full"
            options={[
              { value: 'login', label: t('auth.login') },
              { value: 'signup', label: t('auth.signup') },
            ]}
          />
          <form
            className="mt-5 grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (mode === 'login') login(email, password, 'login');
              else signup();
            }}
          >
            {mode === 'signup' && (
              <Field label={t('auth.name')}>
                <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Ex. Maman Pauline" data-testid="signup-name" />
              </Field>
            )}
            <Field label={t('auth.email')}>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoCapitalize="none" required data-testid="email" />
            </Field>
            <Field label={t('auth.password')} error={err}>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                data-testid="password"
              />
            </Field>
            <Button type="submit" size="lg" loading={busy === 'login' || busy === 'signup'} data-testid="auth-submit">
              {mode === 'login' ? t('auth.login') : t('auth.signup')} <ArrowRight size={18} />
            </Button>
            {mode === 'signup' && <p className="text-center text-sm font-semibold text-ok">{t('auth.trial')}</p>}
          </form>
          <p className="mt-6 text-center text-xs leading-relaxed text-muted">
            {t('auth.terms')}{' '}
            <Link href="/conditions" className="font-semibold text-ink underline underline-offset-2">
              {t('auth.termsLink')}
            </Link>{' '}
            {t('auth.and')}{' '}
            <Link href="/confidentialite" className="font-semibold text-ink underline underline-offset-2">
              {t('auth.privacyLink')}
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </div>
  );
}
