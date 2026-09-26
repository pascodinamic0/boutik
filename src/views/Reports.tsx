'use client';
import { useMemo, useState } from 'react';
import { useCustomers, useExpenses, useSaleItems, useSales } from '@/app-shell/data';
import { BarChart, Donut, HBar } from '@/components/charts';
import { METHOD_STYLE, PageHeader, SectionTitle, StatCard, useMoney } from '@/components/common';
import { Card, Segmented } from '@/components/ui';
import { useI18n } from '@/i18n';
import { rangeBounds, summarize, type RangeKey } from '@/lib/reports';
import { BookOpen, Receipt, TrendingUp, Wallet, Coins, ShoppingBasket } from 'lucide-react';

export function Reports() {
  const { t } = useI18n();
  const m = useMoney();
  const sales = useSales();
  const items = useSaleItems();
  const expenses = useExpenses();
  const customers = useCustomers();
  const [range, setRange] = useState<RangeKey>('week');

  const s = useMemo(() => {
    if (!sales || !items) return null;
    const { from, to } = rangeBounds(range);
    return summarize(sales, items, expenses ?? [], from, to);
  }, [sales, items, expenses, range]);
  const chartSeries = useMemo(() => {
    if (!sales || !items) return [];
    const r = range === 'today' ? rangeBounds('week') : rangeBounds(range);
    return summarize(sales, items, expenses ?? [], r.from, r.to).series;
  }, [sales, items, expenses, range]);
  const creditOut = (customers ?? []).reduce((a, c) => a + c.credit.balance, 0);

  return (
    <div className="space-y-6">
      <PageHeader title={t('rep.title')} className="!mb-0" />
      <Segmented
        value={range}
        onChange={setRange}
        className="w-full sm:w-auto"
        options={[
          { value: 'today', label: t('rep.today') },
          { value: 'week', label: t('rep.week') },
          { value: 'month', label: t('rep.month') },
          { value: '30d', label: t('rep.30d') },
        ]}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t('rep.revenue')} value={s ? m.fmt(s.revenue) : '—'} sub={s ? `≈ ${m.fmtAlt(s.revenue)}` : ''} icon={<Coins size={17} />} testId="rep-revenue" />
        <StatCard label={t('rep.profit')} value={s ? m.fmt(s.profit) : '—'} sub={s && s.revenue ? `${Math.round((s.profit / s.revenue) * 100)} %` : ''} icon={<TrendingUp size={17} />} tone="ok" />
        <StatCard label={t('rep.expenses')} value={s ? m.fmt(s.expenses) : '—'} sub={s ? `≈ ${m.fmtAlt(s.expenses)}` : ''} icon={<Wallet size={17} />} tone="danger" />
        <StatCard label={t('rep.net')} value={s ? m.fmt(s.net) : '—'} sub={s ? `≈ ${m.fmtAlt(s.net)}` : ''} icon={<Receipt size={17} />} tone={s && s.net < 0 ? 'danger' : 'gold'} testId="rep-net" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t('rep.count')} value={s?.count ?? '—'} icon={<ShoppingBasket size={17} />} tone="info" />
        <StatCard label={t('rep.avgBasket')} value={s ? m.fmt(s.avgBasket) : '—'} tone="info" />
        <StatCard label={t('rep.creditGiven')} value={s ? m.fmt(s.creditGiven) : '—'} icon={<BookOpen size={17} />} tone="gold" />
        <StatCard label={t('dash.creditOut')} value={m.fmt(creditOut)} tone="gold" />
      </div>

      <Card className="p-5">
        <SectionTitle>{t('rep.chart')}</SectionTitle>
        {chartSeries.length ? <BarChart series={chartSeries} currency={m.cur} height={220} labels={{ revenue: t('rep.revenue'), profit: t('rep.profit') }} /> : <div className="skeleton h-[240px] rounded-2xl" />}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle>{t('rep.byMethod')}</SectionTitle>
          {s && s.byMethod.length ? (
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <Donut
                data={s.byMethod.map((b) => ({ label: b.method, value: b.amount, color: METHOD_STYLE[b.method].color }))}
                center={
                  <>
                    <span className="text-[11px] font-semibold text-muted">{t('common.total')}</span>
                    <span className="text-sm font-extrabold tabular">{m.fmt(s.revenue).replace(/\u00a0FC/, '')}</span>
                  </>
                }
              />
              <ul className="w-full space-y-2.5" data-testid="method-breakdown">
                {s.byMethod.map((b) => (
                  <li key={b.method} className="flex items-center gap-3 text-sm">
                    <span className="h-3 w-3 shrink-0 rounded-[4px]" style={{ background: METHOD_STYLE[b.method].color }} />
                    <span className="flex-1 font-semibold">{t(`pay.${b.method}`)}</span>
                    <span className="text-xs text-muted">{b.count}×</span>
                    <span className="w-28 text-right font-bold tabular">{m.fmt(b.amount)}</span>
                    <span className="w-10 text-right text-xs text-muted">{Math.round((b.amount / (s.revenue || 1)) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted">{t('rep.noData')}</p>
          )}
        </Card>
        <Card className="p-5">
          <SectionTitle>{t('rep.top')}</SectionTitle>
          {s && s.topProducts.length ? (
            <ol className="space-y-3.5">
              {s.topProducts.map((p, i) => (
                <li key={p.name}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-semibold">
                      <span className="mr-2 text-muted">{i + 1}.</span>
                      {p.name}
                    </span>
                    <span className="shrink-0 font-bold tabular">{m.fmt(p.revenue)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <HBar value={p.revenue} max={s.topProducts[0].revenue} />
                    <span className="w-20 shrink-0 text-right text-[11px] text-muted">{t('rep.sold', { n: p.qty })}</span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="py-8 text-center text-sm text-muted">{t('rep.noData')}</p>
          )}
        </Card>
      </div>
      {s && s.discounts > 0 && (
        <p className="text-center text-xs text-muted">
          {t('rep.discounts')} : {m.fmt(s.discounts)}
        </p>
      )}
    </div>
  );
}
