'use client';
import clsx from 'clsx';
import { AlertTriangle, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useApp } from '@/app-shell/AppContext';
import { AppLink, useRouter } from '@/app-shell/router';
import { isLow, useProducts } from '@/app-shell/data';
import { EmptyState, PageHeader, ProductThumb, useMoney } from '@/components/common';
import { Card } from '@/components/ui';
import { useI18n } from '@/i18n';

export function StockList() {
  const { t, tx } = useI18n();
  const { isOwner } = useApp();
  const { route } = useRouter();
  const products = useProducts();
  const m = useMoney();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<string>(route.search.get('filtre') === 'bas' ? 'low' : 'all');

  const cats = useMemo(() => [...new Set((products ?? []).map((p) => p.category))].sort(), [products]);
  const lowCount = (products ?? []).filter(isLow).length;
  const value = (products ?? []).reduce((s, p) => s + Math.max(0, p.quantity) * p.buy_price, 0);
  const list = (products ?? []).filter((p) => {
    if (filter === 'low' && !isLow(p)) return false;
    if (filter !== 'all' && filter !== 'low' && p.category !== filter) return false;
    if (q && !p.name.toLowerCase().includes(q.toLowerCase()) && !(p.barcode ?? '').includes(q.trim())) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title={t('stock.title')}
        subtitle={
          <>
            {t('stock.products', { n: products?.length ?? 0 })}
            {isOwner && (
              <>
                {' · '}
                {t('stock.value')} <b className="text-ink tabular">{m.fmt(value)}</b>
              </>
            )}
          </>
        }
        actions={
          isOwner && (
            <AppLink href="/app/stock/nouveau" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand px-4 text-[15px] font-semibold text-white shadow-[0_8px_20px_-10px_var(--brand)] active:scale-95" data-testid="add-product">
              <Plus size={18} /> <span className="hidden sm:inline">{t('stock.add')}</span>
            </AppLink>
          )
        }
      />
      {!isOwner && <p className="mb-4 rounded-2xl bg-info-soft px-4 py-2.5 text-sm font-medium text-info">{t('stock.readOnly')}</p>}
      <div className="relative mb-3">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('pos.search')}
          className="h-12 w-full rounded-2xl border border-line bg-surface pl-11 pr-4 text-[16px] outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
          data-testid="stock-search"
        />
      </div>
      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {['all', 'low', ...cats].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={clsx(
              'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition',
              filter === c ? 'bg-cocoa text-cream dark:bg-cream dark:text-cocoa' : 'border border-line bg-surface text-muted',
            )}
          >
            {c === 'low' && <AlertTriangle size={14} />}
            {c === 'all' ? t('common.all') : c === 'low' ? `${t('stock.lowOnly')} (${lowCount})` : tx('cat', c)}
          </button>
        ))}
      </div>

      {products && products.length === 0 ? (
        <EmptyState
          image="/img/boutique.webp"
          title={t('stock.empty')}
          hint={t('stock.emptyHint')}
          action={
            isOwner && (
              <AppLink href="/app/stock/nouveau" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand px-5 font-semibold text-white">
                <Plus size={18} /> {t('stock.add')}
              </AppLink>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line md:grid md:grid-cols-2 md:divide-y-0 md:[&>li]:border-b md:[&>li]:border-line md:[&>li:nth-child(odd)]:border-r xl:grid-cols-3 xl:[&>li:nth-child(odd)]:border-r-0 xl:[&>li:not(:nth-child(3n))]:border-r">
            {list.map((p) => {
              const low = isLow(p);
              return (
                <li key={p.id}>
                  <AppLink href={`/app/stock/${p.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2" data-testid="stock-row" data-name={p.name}>
                    <ProductThumb src={p.photo} name={p.name} size={52} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-semibold">{p.name}</span>
                      <span className="block truncate text-xs text-muted">
                        {tx('cat', p.category)} · <span className="font-semibold text-brand tabular">{m.fmt(p.sell_price)}</span>
                      </span>
                    </span>
                    <span
                      className={clsx(
                        'shrink-0 rounded-xl px-2.5 py-1 text-right text-[13px] font-bold tabular',
                        p.quantity <= 0 ? 'bg-danger text-white' : low ? 'bg-danger-soft text-danger' : 'bg-surface-2 text-ink',
                      )}
                      data-testid="stock-qty"
                    >
                      {p.quantity}
                      <span className="ml-1 text-[11px] font-medium opacity-75">{p.unit}</span>
                    </span>
                  </AppLink>
                </li>
              );
            })}
          </ul>
          {list.length === 0 && <p className="py-10 text-center text-sm text-muted">{t('pos.noProducts')}</p>}
        </Card>
      )}
    </div>
  );
}
