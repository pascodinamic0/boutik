'use client';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, BookOpen, ChevronRight, Package, Plus, Receipt, ShoppingBag, TrendingUp, Wallet, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import { useApp } from '@/app-shell/AppContext';
import { AppLink } from '@/app-shell/router';
import { isLow, useCustomers, useExpenses, useProducts, useSaleItems, useSales } from '@/app-shell/data';
import { BarChart } from '@/components/charts';
import { EmptyState, MethodIcon, Money, ProductThumb, SectionTitle, StatCard, useMoney } from '@/components/common';
import { Card } from '@/components/ui';
import { useI18n } from '@/i18n';
import { fmtTime } from '@/lib/dates';
import { rangeBounds, summarize, startOfDay } from '@/lib/reports';

export function Dashboard() {
  const { t } = useI18n();
  const { shop, isOwner, member, user } = useApp();
  const m = useMoney();
  const sales = useSales();
  const items = useSaleItems();
  const expenses = useExpenses();
  const products = useProducts();
  const customers = useCustomers();

  const data = useMemo(() => {
    if (!sales || !items) return null;
    const mine = isOwner ? sales : sales.filter((s) => s.seller_id === user?.id);
    const today = rangeBounds('today');
    const y0 = new Date(today.from.getTime() - 86_400_000);
    const week = rangeBounds('week');
    return {
      today: summarize(mine, items, expenses ?? [], today.from, today.to),
      yesterday: summarize(mine, items, expenses ?? [], y0, today.from),
      week: summarize(mine, items, expenses ?? [], week.from, week.to),
      recent: mine.slice(0, 6),
    };
  }, [sales, items, expenses, isOwner, user?.id]);

  const low = (products ?? []).filter(isLow).sort((a, b) => a.quantity - b.quantity);
  const creditOut = (customers ?? []).reduce((s, c) => s + c.credit.balance, 0);
  const overdue = (customers ?? []).filter((c) => c.credit.overdueAmount > 0).length;
  const trialDays = shop ? Math.max(0, Math.ceil((new Date(shop.trial_ends_at).getTime() - Date.now()) / 86_400_000)) : 0;
  const name = (member?.display_name || user?.name || '').split(' ')[0];
  const delta = data && data.yesterday.revenue > 0 ? ((data.today.revenue - data.yesterday.revenue) / data.yesterday.revenue) * 100 : null;
  const custMap = new Map((customers ?? []).map((c) => [c.customer.id, c.customer.name]));

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#d8622b] via-[#b8491a] to-[#7e2d10] p-5 text-white shadow-soft sm:p-7"
      >
        <div className="kente pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{t('dash.hello', { name })}</p>
            <p className="mt-3 text-[13px] font-semibold uppercase tracking-wider text-white/70">{isOwner ? t('dash.salesToday') : t('dash.mySales')}</p>
            <p className="mt-1 text-[38px] font-extrabold leading-none tracking-tight tabular sm:text-5xl" data-testid="today-revenue">
              {data ? m.fmt(data.today.revenue) : '—'}
            </p>
            <p className="mt-2 text-sm font-medium text-white/80 tabular">≈ {data ? m.fmtAlt(data.today.revenue) : '—'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {delta !== null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold backdrop-blur">
                {delta >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {Math.abs(delta).toFixed(0)} % {t('dash.vsYesterday')}
              </span>
            )}
            <AppLink
              href="/app/vendre"
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-[15px] font-bold text-[#9e3f15] shadow-lg transition active:scale-95"
              data-testid="dash-new-sale"
            >
              <ShoppingBag size={19} /> {t('dash.newSale')}
            </AppLink>
          </div>
        </div>
      </motion.div>

      {isOwner && shop?.plan === 'trial' && trialDays <= 30 && (
        <AppLink href="/app/reglages#plan" className="flex items-center gap-3 rounded-2xl border border-gold/40 bg-gold-soft px-4 py-3 text-sm font-semibold">
          <Sparkles size={18} className="text-gold" />
          <span className="flex-1">{t('dash.trialLeft', { n: trialDays })}</span>
          <ChevronRight size={16} className="text-muted" />
        </AppLink>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isOwner ? (
          <StatCard label={t('dash.profitToday')} value={data ? m.fmt(data.today.profit) : '—'} sub={data ? `≈ ${m.fmtAlt(data.today.profit)}` : ''} icon={<TrendingUp size={17} />} tone="ok" testId="kpi-profit" />
        ) : null}
        <StatCard label={t('dash.countToday')} value={data?.today.count ?? '—'} sub={data ? `${t('rep.avgBasket')} ${m.fmt(data.today.avgBasket)}` : ''} icon={<Receipt size={17} />} tone="info" />
        <StatCard label={t('dash.creditOut')} value={m.fmt(creditOut)} sub={overdue ? t('dash.overdue', { n: overdue }) : `≈ ${m.fmtAlt(creditOut)}`} icon={<BookOpen size={17} />} tone="gold" testId="kpi-credit" />
        <StatCard label={t('dash.lowStock')} value={low.length} sub={t('stock.products', { n: products?.length ?? 0 })} icon={<Package size={17} />} tone={low.length ? 'danger' : 'ok'} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="p-5">
          <SectionTitle action={isOwner ? <AppLink href="/app/rapports" className="text-sm font-semibold text-brand">{t('nav.reports')}</AppLink> : undefined}>
            {t('dash.last7')}
          </SectionTitle>
          {data ? (
            <BarChart series={data.week.series} currency={m.cur} labels={{ revenue: t('rep.revenue'), profit: t('rep.profit') }} />
          ) : (
            <div className="skeleton h-[200px] rounded-2xl" />
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle action={<AppLink href="/app/stock?filtre=bas" className="text-sm font-semibold text-brand">{t('common.seeAll')}</AppLink>}>
            <span className="inline-flex items-center gap-2">
              <AlertTriangle size={16} className="text-danger" /> {t('dash.lowStock')}
            </span>
          </SectionTitle>
          {low.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">{t('dash.lowStockEmpty')}</p>
          ) : (
            <ul className="divide-y divide-line" data-testid="low-stock-list">
              {low.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <AppLink href={`/app/stock/${p.id}`} className="flex items-center gap-3 py-2.5">
                    <ProductThumb src={p.photo} name={p.name} size={42} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{p.name}</span>
                      <span className="text-xs text-muted">{t('stock.lowThreshold')} {p.low_stock}</span>
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.quantity <= 0 ? 'bg-danger text-white' : 'bg-danger-soft text-danger'}`}>
                      {p.quantity} {p.unit}
                    </span>
                  </AppLink>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="p-5">
          <SectionTitle action={<AppLink href="/app/ventes" className="text-sm font-semibold text-brand">{t('common.seeAll')}</AppLink>}>{t('dash.recent')}</SectionTitle>
          {data && data.recent.length === 0 ? (
            <EmptyState image="/img/kiosque.webp" title={t('dash.recentEmpty')} action={<AppLink href="/app/vendre" className="font-semibold text-brand">{t('dash.newSale')} →</AppLink>} className="py-4" />
          ) : (
            <ul className="divide-y divide-line">
              {(data?.recent ?? []).map((s) => (
                <li key={s.id}>
                  <AppLink href={`/app/ventes/${s.id}`} className="flex items-center gap-3 py-3">
                    <MethodIcon method={s.method} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {s.customer_id ? custMap.get(s.customer_id) ?? t(`pay.${s.method}`) : t(`pay.${s.method}`)}
                      </span>
                      <span className="text-xs text-muted">
                        {fmtTime(s.created_at)} · {s.seller_name}
                      </span>
                    </span>
                    <Money value={s.total} className="text-sm" altClassName="text-right" />
                  </AppLink>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle>{t('dash.quick')}</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Quick href="/app/vendre" icon={<ShoppingBag size={20} />} label={t('dash.newSale')} tone="bg-brand-soft text-brand" />
            <Quick href="/app/credit" icon={<BookOpen size={20} />} label={t('dash.recordPayment')} tone="bg-gold-soft text-gold" />
            {isOwner && <Quick href="/app/stock/nouveau" icon={<Plus size={20} />} label={t('dash.addProduct')} tone="bg-ok-soft text-ok" />}
            {isOwner && <Quick href="/app/depenses?ajouter=1" icon={<Wallet size={20} />} label={t('dash.addExpense')} tone="bg-info-soft text-info" />}
          </div>
        </Card>
      </div>
      <p className="text-center text-xs text-muted">
        {startOfDay().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · 1 $ = {shop?.exchange_rate.toLocaleString('fr-FR')} FC
      </p>
    </div>
  );
}

function Quick({ href, icon, label, tone }: { href: string; icon: React.ReactNode; label: string; tone: string }) {
  return (
    <AppLink href={href} className="flex flex-col gap-3 rounded-2xl border border-line p-3.5 transition hover:bg-surface-2 active:scale-[0.98]">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
      <span className="text-[13.5px] font-semibold leading-tight">{label}</span>
    </AppLink>
  );
}
