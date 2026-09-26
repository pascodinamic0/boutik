'use client';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/app-shell/AppContext';
import { useRouter } from '@/app-shell/router';
import { Logo } from '@/components/Logo';
import { LangSwitcher, ThemeToggle } from '@/components/Switchers';
import { Button, Field, Input, Select, Segmented } from '@/components/ui';
import { useI18n, type TKey } from '@/i18n';
import { parseAmount } from '@/lib/money';
import { supabase } from '@/lib/supabase';
import { getDb } from '@/lib/db';
import { normalizeRow } from '@/lib/sync';
import type { Currency, Shop } from '@/lib/types';
import { COMMUNES, SHOP_TYPES } from './Settings';

export function Onboarding() {
  const { t } = useI18n();
  const { user, shops, selectShop, sync, signOut } = useApp();
  const { navigate } = useRouter();
  const [name, setName] = useState('');
  const [commune, setCommune] = useState('Gombe');
  const [type, setType] = useState('boutique');
  const [currency, setCurrency] = useState<Currency>('CDF');
  const [rate, setRate] = useState('2800');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setErr(null);
    if (!name.trim()) return setErr(t('common.required'));
    if (!navigator.onLine) return setErr(t('onb.needOnline'));
    const r = parseAmount(rate);
    setBusy(true);
    const { data, error } = await supabase().rpc('create_shop', {
      p_name: name.trim(),
      p_commune: commune,
      p_type: type,
      p_currency: currency,
      p_rate: Number.isNaN(r) || r <= 0 ? 2800 : r,
      p_display_name: user?.name ?? null,
    });
    if (error || !data) {
      setBusy(false);
      return setErr(t('common.error'));
    }
    const shop = normalizeRow('shops', data as Record<string, unknown>) as unknown as Shop;
    const db = getDb();
    await db.shops.put(shop);
    await db.shop_members.put({ shop_id: shop.id, user_id: user!.id, role: 'owner', display_name: user!.name, email: user!.email, created_at: shop.created_at });
    selectShop(shop.id);
    await sync();
    navigate('/app', { replace: true });
  };

  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/boutique.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2a1a10] via-[#2a1a10]/40 to-transparent" />
        <div className="absolute bottom-0 p-12 text-cream">
          <p className="font-display text-4xl font-bold leading-tight">{t('land.story.title')}</p>
          <p className="mt-3 max-w-md text-cream/80">{t('onb.trial')}</p>
        </div>
      </div>
      <div className="pt-safe flex flex-col px-5 pb-10 sm:px-10">
        <div className="flex h-16 items-center justify-between">
          {shops.length > 0 ? (
            <button onClick={() => navigate('/app')} className="inline-flex items-center gap-2 text-sm font-semibold text-muted">
              <ArrowLeft size={18} /> {t('common.back')}
            </button>
          ) : (
            <Logo size={30} />
          )}
          <div className="flex items-center">
            <LangSwitcher />
            <ThemeToggle />
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-lg flex-1 pt-6 lg:pt-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-gold-soft px-3 py-1 text-xs font-bold text-gold">
            <Sparkles size={14} /> {t('onb.trial')}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{t('onb.title')}</h1>
          <p className="mt-2 text-muted">{t('onb.subtitle')}</p>
          <div className="mt-8 grid gap-4">
            <Field label={t('onb.shopName')} error={err}>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('onb.shopNamePh')} data-testid="onb-name" autoFocus />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('onb.commune')}>
                <Select value={commune} onChange={(e) => setCommune(e.target.value)} data-testid="onb-commune">
                  {COMMUNES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label={t('onb.type')}>
                <Select value={type} onChange={(e) => setType(e.target.value)} data-testid="onb-type">
                  {SHOP_TYPES.map((c) => (
                    <option key={c} value={c}>
                      {t(`type.${c}` as TKey)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label={t('onb.currency')}>
              <Segmented
                value={currency}
                onChange={setCurrency}
                className="w-full"
                options={[
                  { value: 'CDF', label: t('currency.CDF') },
                  { value: 'USD', label: t('currency.USD') },
                ]}
              />
            </Field>
            <Field label={t('onb.rate')}>
              <Input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} suffix="FC" />
            </Field>
            <Button size="lg" onClick={create} loading={busy} className="mt-2" data-testid="onb-create">
              {t('onb.create')}
            </Button>
            {shops.length === 0 && (
              <button onClick={() => signOut()} className="text-sm font-semibold text-muted hover:text-ink">
                {t('nav.logout')}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
