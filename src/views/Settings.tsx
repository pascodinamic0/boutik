'use client';
import clsx from 'clsx';
import { Check, Crown, Download, LogOut, Plus, RefreshCw, Store, Trash2, UserPlus, Sparkles, FileText, Shield } from 'lucide-react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useActor, useApp } from '@/app-shell/AppContext';
import { useRouter } from '@/app-shell/router';
import { SyncDetails, useSyncState } from '@/app-shell/SyncStatus';
import { PageHeader } from '@/components/common';
import { LangSwitcher, ThemeSegment } from '@/components/Switchers';
import { Badge, Button, Card, Field, Input, Select, Sheet, useToast } from '@/components/ui';
import { LANGS, useI18n, type TKey } from '@/i18n';
import { updateShop } from '@/lib/actions';
import { getDb } from '@/lib/db';
import { installStore, isIos, isStandalone } from '@/lib/install';
import { parseAmount } from '@/lib/money';
import { supabase } from '@/lib/supabase';
import { discardFailed, retryFailed } from '@/lib/sync';

export const SHOP_TYPES = ['boutique', 'depot', 'pharmacie', 'kiosque', 'quincaillerie', 'cosmetique', 'autre'];
export const COMMUNES = [
  'Bandalungwa', 'Barumbu', 'Bumbu', 'Gombe', 'Kalamu', 'Kasa-Vubu', 'Kimbanseke', 'Kinshasa', 'Kintambo', 'Kisenso', 'Lemba', 'Limete', 'Lingwala',
  'Makala', 'Maluku', 'Masina', 'Matete', 'Mont-Ngafula', 'Ndjili', 'Ngaba', 'Ngaliema', 'Ngiri-Ngiri', 'Nsele', 'Selembao',
];

function Section({ title, children, id, icon }: { title: string; children: React.ReactNode; id?: string; icon?: React.ReactNode }) {
  return (
    <Card className="p-5 sm:p-6" id={id}>
      <h2 className="mb-4 flex items-center gap-2 text-[16px] font-bold">
        {icon}
        {title}
      </h2>
      {children}
    </Card>
  );
}

export function SettingsView() {
  const { t, lang } = useI18n();
  const { shop, shops, isOwner, user, member, selectShop, signOut, sync } = useApp();
  const actor = useActor();
  const toast = useToast();
  const { navigate } = useRouter();
  const s = useSyncState();
  const [name, setName] = useState(shop!.name);
  const [commune, setCommune] = useState(shop!.commune);
  const [type, setType] = useState(shop!.shop_type);
  const [phone, setPhone] = useState(shop!.phone ?? '');
  const [rate, setRate] = useState(String(shop!.exchange_rate));
  const [planChosen, setPlanChosen] = useState(false);
  const canInstall = useSyncExternalStore(installStore.subscribe, installStore.canPrompt, () => false);
  const [standalone, setStandalone] = useState(true);

  useEffect(() => {
    setName(shop!.name);
    setCommune(shop!.commune);
    setType(shop!.shop_type);
    setPhone(shop!.phone ?? '');
    setRate(String(shop!.exchange_rate));
    setPlanChosen(!!localStorage.getItem(`boutik.plan:${shop!.id}`));
    setStandalone(isStandalone());
  }, [shop]);

  const days = Math.max(0, Math.ceil((new Date(shop!.trial_ends_at).getTime() - Date.now()) / 86_400_000));

  const saveShop = async () => {
    const r = parseAmount(rate);
    if (Number.isNaN(r) || r <= 0) return toast(t('common.invalidAmount'), 'danger');
    await updateShop(actor, { name: name.trim() || shop!.name, commune, shop_type: type, phone: phone.trim() || null, exchange_rate: r });
    toast(t('common.saved'));
  };

  const logout = async () => {
    if (s.pending > 0 && !confirm(t('set.pendingLogout', { n: s.pending }))) return;
    await signOut();
  };

  return (
    <div>
      <PageHeader title={t('set.title')} />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Section title={t('set.shop')} icon={<Store size={18} className="text-brand" />}>
            {!isOwner && <p className="mb-4 rounded-2xl bg-info-soft px-4 py-2.5 text-sm text-info">{t('set.ownerOnly')}</p>}
            <fieldset disabled={!isOwner} className="grid gap-4 sm:grid-cols-2">
              <Field label={t('onb.shopName')} className="sm:col-span-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label={t('onb.commune')}>
                <Select value={commune} onChange={(e) => setCommune(e.target.value)}>
                  {(COMMUNES.includes(commune) ? COMMUNES : [commune, ...COMMUNES]).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label={t('onb.type')}>
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  {SHOP_TYPES.map((c) => (
                    <option key={c} value={c}>
                      {t(`type.${c}` as TKey)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={`${t('common.phone')} (${t('common.optional')})`}>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="+243 81 234 5678" />
              </Field>
              <Field label={t('set.rateLabel')} hint={t('set.rateHint')}>
                <Input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} suffix="FC" data-testid="rate-input" />
              </Field>
              <p className="text-xs text-muted sm:col-span-2">
                {t('onb.currency')} : <b>{t(`currency.${shop!.currency}`)}</b>
              </p>
              {isOwner && (
                <Button onClick={saveShop} className="sm:col-span-2 sm:justify-self-start" data-testid="save-shop">
                  {t('common.save')}
                </Button>
              )}
            </fieldset>
          </Section>

          {isOwner && (
            <Section title={t('set.plan')} id="plan" icon={<Crown size={18} className="text-gold" />}>
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cocoa to-[#4a2a17] p-5 text-cream">
                <div className="kente pointer-events-none absolute inset-0 opacity-40" />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <Badge tone="gold" className="!bg-gold !text-cocoa">
                      <Sparkles size={12} /> {days > 0 ? t('set.planTrial') : t('set.planEnded')}
                    </Badge>
                    <p className="mt-3 text-2xl font-extrabold">Boutik Mensuel</p>
                    <p className="text-sm text-cream/80">{t('set.planPrice')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-extrabold tabular">{days}</p>
                    <p className="text-xs text-cream/70">{t('set.planDays', { n: days }).replace(/^\d+\s*/, '')}</p>
                  </div>
                </div>
                <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, ((30 - days) / 30) * 100)}%` }} />
                </div>
                <p className="relative mt-3 text-xs text-cream/75">{t('set.planFeatures')}</p>
              </div>
              {planChosen ? (
                <p className="mt-4 flex gap-2 rounded-2xl bg-ok-soft p-3 text-sm text-ok" data-testid="plan-chosen">
                  <Check size={18} className="shrink-0" /> {t('set.planChosen')}
                </p>
              ) : (
                <Button
                  block
                  className="mt-4"
                  onClick={() => {
                    localStorage.setItem(`boutik.plan:${shop!.id}`, new Date().toISOString());
                    setPlanChosen(true);
                  }}
                  data-testid="choose-plan"
                >
                  {t('set.planChoose')}
                </Button>
              )}
            </Section>
          )}

          {isOwner && <TeamSection />}
        </div>

        <div className="space-y-5">
          <Section title={t('set.prefs')}>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{t('common.language')}</p>
                  <p className="text-xs text-muted">{LANGS.find((l) => l.code === lang)?.label}</p>
                </div>
                <LangSwitcher />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">{t('common.theme')}</p>
                <ThemeSegment />
              </div>
            </div>
          </Section>

          <Section title={t('set.shops')}>
            <ul className="space-y-2">
              {shops.map((sh) => (
                <li key={sh.id} className={clsx('flex items-center gap-3 rounded-2xl border p-3', sh.id === shop!.id ? 'border-brand bg-brand-soft/50' : 'border-line')}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-brand">
                    <Store size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{sh.name}</span>
                    <span className="text-xs text-muted">{sh.commune}</span>
                  </span>
                  {sh.id === shop!.id ? (
                    <Badge tone="brand">{t('set.current')}</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        selectShop(sh.id);
                        navigate('/app');
                      }}
                    >
                      {t('set.switch')}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            <Button variant="soft" block className="mt-3" onClick={() => navigate('/app/bienvenue')} data-testid="new-shop">
              <Plus size={17} /> {t('set.newShop')}
            </Button>
          </Section>

          <Section title={t('set.account')}>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cocoa font-bold text-cream dark:bg-cream dark:text-cocoa">
                  {(member?.display_name || user?.name || '?').slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{member?.display_name || user?.name}</p>
                  <p className="truncate text-xs text-muted">
                    {user?.email} · {t(isOwner ? 'role.owner' : 'role.seller')}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-surface-2 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <SyncDetails />
                  <Button size="sm" variant="secondary" onClick={() => sync()} disabled={!s.online} data-testid="sync-now">
                    <RefreshCw size={14} className={s.syncing ? 'animate-spin' : ''} /> {t('sync.now')}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {s.pending > 0 ? t('sync.pending', { n: s.pending }) : t('sync.synced')}
                </p>
                {s.failed > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-danger">{t('sync.failed', { n: s.failed })}</span>
                    <Button size="sm" variant="secondary" onClick={async () => { await retryFailed(); sync(); }}>{t('sync.retry')}</Button>
                    <Button size="sm" variant="ghost" onClick={() => discardFailed()}>{t('sync.discard')}</Button>
                  </div>
                )}
              </div>
              {!standalone && (
                <div className="rounded-2xl border border-line p-3">
                  <p className="text-sm font-semibold">{t('set.install')}</p>
                  <p className="mt-0.5 text-xs text-muted">{isIos() ? t('set.installIos') : t('set.installHint')}</p>
                  {canInstall && (
                    <Button size="sm" className="mt-2" onClick={() => installStore.prompt()}>
                      <Download size={15} /> {t('set.install')}
                    </Button>
                  )}
                </div>
              )}
              <Button variant="secondary" block onClick={logout} className="text-danger" data-testid="logout">
                <LogOut size={17} /> {t('nav.logout')}
              </Button>
            </div>
          </Section>

          <Section title={t('set.legal')}>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/confidentialite" className="flex items-center gap-2 rounded-2xl border border-line p-3 text-sm font-semibold hover:bg-surface-2">
                <Shield size={16} className="text-brand" /> {t('set.privacy')}
              </Link>
              <Link href="/conditions" className="flex items-center gap-2 rounded-2xl border border-line p-3 text-sm font-semibold hover:bg-surface-2">
                <FileText size={16} className="text-brand" /> {t('set.terms')}
              </Link>
            </div>
            <p className="mt-3 text-center text-xs text-muted">Boutik · {t('set.version')} 1.0.0</p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function TeamSection() {
  const { t } = useI18n();
  const { shop, user, sync } = useApp();
  const toast = useToast();
  const s = useSyncState();
  const members = useLiveQuery(() => getDb().shop_members.where('shop_id').equals(shop!.id).toArray(), [shop!.id]) ?? [];
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const add = async () => {
    setErr(null);
    if (!name.trim() || !email.trim()) return setErr(t('common.required'));
    if (pw.length < 6) return setErr(t('auth.weak'));
    setBusy(true);
    try {
      const { data } = await supabase().auth.getSession();
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token}` },
        body: JSON.stringify({ shopId: shop!.id, name: name.trim(), email: email.trim().toLowerCase(), password: pw }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'error');
      toast(t('set.sellerAdded'));
      setOpen(false);
      setName('');
      setEmail('');
      setPw('');
      await sync();
    } catch (e) {
      setErr(e instanceof Error && e.message !== 'error' ? e.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (uid: string, n: string) => {
    if (!confirm(t('set.removeConfirm', { name: n }))) return;
    const { error } = await supabase().from('shop_members').delete().eq('shop_id', shop!.id).eq('user_id', uid);
    if (error) return toast(t('common.error'), 'danger');
    await getDb().shop_members.delete([shop!.id, uid]);
    toast(t('common.saved'));
    await sync();
  };

  return (
    <Section title={t('set.team')} icon={<UserPlus size={18} className="text-info" />}>
      <p className="mb-4 text-sm text-muted">{t('set.teamHint')}</p>
      <ul className="space-y-2" data-testid="team-list">
        {members
          .sort((a, b) => (a.role === 'owner' ? -1 : 1) - (b.role === 'owner' ? -1 : 1))
          .map((mb) => (
            <li key={mb.user_id} className="flex items-center gap-3 rounded-2xl border border-line p-3">
              <span className={clsx('flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white', mb.role === 'owner' ? 'bg-brand' : 'bg-info')}>
                {(mb.display_name || mb.email || '?').slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {mb.display_name} {mb.user_id === user?.id && <span className="text-muted">({t('set.you')})</span>}
                </span>
                <span className="block truncate text-xs text-muted">{mb.email}</span>
              </span>
              <Badge tone={mb.role === 'owner' ? 'brand' : 'info'}>{t(mb.role === 'owner' ? 'role.owner' : 'role.seller')}</Badge>
              {mb.role === 'seller' && (
                <button onClick={() => remove(mb.user_id, mb.display_name)} disabled={!s.online} className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-40" aria-label={t('set.remove')}>
                  <Trash2 size={16} />
                </button>
              )}
            </li>
          ))}
      </ul>
      <Button variant="soft" block className="mt-3" onClick={() => setOpen(true)} disabled={!s.online} data-testid="add-seller">
        <UserPlus size={17} /> {t('set.addSeller')}
      </Button>
      {!s.online && <p className="mt-2 text-center text-xs text-muted">{t('set.onlineOnly')}</p>}
      <Sheet open={open} onClose={() => setOpen(false)} title={t('set.addSeller')} footer={<Button block size="lg" onClick={add} loading={busy}>{t('common.add')}</Button>}>
        <div className="space-y-4 pt-1">
          <Field label={t('set.sellerName')}>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field label={t('set.sellerEmail')}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoCapitalize="none" />
          </Field>
          <Field label={t('set.sellerPassword')} error={err}>
            <Input value={pw} onChange={(e) => setPw(e.target.value)} autoCapitalize="none" />
          </Field>
        </div>
      </Sheet>
    </Section>
  );
}
