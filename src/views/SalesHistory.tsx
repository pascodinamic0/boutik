'use client';
import clsx from 'clsx';
import { CloudOff } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { useApp } from '@/app-shell/AppContext';
import { AppLink } from '@/app-shell/router';
import { useCustomers, useSales } from '@/app-shell/data';
import { EmptyState, MethodIcon, Money, PageHeader, useMoney } from '@/components/common';
import { Card, Segmented } from '@/components/ui';
import { useI18n } from '@/i18n';
import { getDb } from '@/lib/db';
import { fmtDate, fmtTime } from '@/lib/dates';
import { shortRef } from '@/lib/ids';
import { dayKey, rangeBounds, type RangeKey } from '@/lib/reports';
import type { SaleMethod } from '@/lib/types';

export function usePendingSaleIds() {
  return useLiveQuery(async () => {
    const items = await getDb().outbox.toArray();
    const ids = new Set<string>();
    for (const it of items) for (const op of it.ops) if (op.table === 'sales') op.rows.forEach((r) => ids.add(r.id as string));
    return ids;
  }, []) ?? new Set<string>();
}

export function SalesHistory() {
  const { t } = useI18n();
  const { isOwner, user } = useApp();
  const sales = useSales();
  const customers = useCustomers();
  const m = useMoney();
  const pending = usePendingSaleIds();
  const [range, setRange] = useState<RangeKey>('week');
  const [method, setMethod] = useState<SaleMethod | 'all'>('all');
  const custMap = new Map((customers ?? []).map((c) => [c.customer.id, c.customer.name]));

  const groups = useMemo(() => {
    const { from, to } = rangeBounds(range);
    const f = from.toISOString();
    const tt = to.toISOString();
    const list = (sales ?? []).filter(
      (s) => s.created_at >= f && s.created_at < tt && (method === 'all' || s.method === method) && (isOwner || s.seller_id === user?.id),
    );
    const map = new Map<string, typeof list>();
    for (const s of list) {
      const k = dayKey(s.created_at);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(s);
    }
    return { total: list.reduce((a, s) => a + s.total, 0), count: list.length, days: [...map.entries()] };
  }, [sales, range, method, isOwner, user?.id]);

  const methods: (SaleMethod | 'all')[] = ['all', 'cash', 'mpesa', 'orange', 'airtel', 'afrimoney', 'credit'];

  return (
    <div>
      <PageHeader title={t('sales.title')} subtitle={`${groups.count} · ${m.fmt(groups.total)} · ≈ ${m.fmtAlt(groups.total)}`} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
      </div>
      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {methods.map((mm) => (
          <button
            key={mm}
            onClick={() => setMethod(mm)}
            className={clsx(
              'h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold transition',
              method === mm ? 'bg-cocoa text-cream dark:bg-cream dark:text-cocoa' : 'border border-line bg-surface text-muted',
            )}
          >
            {mm === 'all' ? t('sales.filterAll') : t(`pay.${mm}`)}
          </button>
        ))}
      </div>
      {sales && groups.days.length === 0 ? (
        <EmptyState image="/img/vendeur.webp" title={t('sales.empty')} action={<AppLink href="/app/vendre" className="font-semibold text-brand">{t('dash.newSale')} →</AppLink>} />
      ) : (
        <div className="space-y-5">
          {groups.days.map(([day, list]) => (
            <section key={day}>
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h2 className="text-sm font-bold capitalize">{new Date(day + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
                <span className="text-sm font-semibold text-muted tabular">{m.fmt(list.reduce((a, s) => a + s.total, 0))}</span>
              </div>
              <Card className="divide-y divide-line overflow-hidden">
                {list.map((s) => (
                  <AppLink key={s.id} href={`/app/ventes/${s.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2" data-testid="sale-row">
                    <MethodIcon method={s.method} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 truncate text-sm font-semibold">
                        {s.customer_id ? custMap.get(s.customer_id) : t(`pay.${s.method}`)}
                        {pending.has(s.id) && <CloudOff size={13} className="text-gold" aria-label={t('sync.pending', { n: 1 })} />}
                      </span>
                      <span className="text-xs text-muted">
                        {fmtTime(s.created_at)} · n° {shortRef(s.id)} · {s.seller_name}
                      </span>
                    </span>
                    <Money value={s.total} className="text-sm" />
                  </AppLink>
                ))}
              </Card>
            </section>
          ))}
          <p className="text-center text-xs text-muted">{fmtDate(rangeBounds(range).from.toISOString(), true)} → {t('common.today')}</p>
        </div>
      )}
    </div>
  );
}
