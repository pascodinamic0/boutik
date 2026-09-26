'use client';
import clsx from 'clsx';
import { Archive, ArrowDownLeft, ArrowUpRight, PackagePlus, Pencil, SlidersHorizontal } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useActor, useApp } from '@/app-shell/AppContext';
import { useRouter } from '@/app-shell/router';
import { EmptyState, PageHeader, ProductThumb, useMoney } from '@/components/common';
import { Badge, Button, Card, Field, Input, Sheet, useToast } from '@/components/ui';
import { useI18n } from '@/i18n';
import { moveStock, updateProduct } from '@/lib/actions';
import { getDb } from '@/lib/db';
import { fmtDateTime } from '@/lib/dates';
import { parseAmount } from '@/lib/money';
import { ProductFormBody } from './ProductForm';

export function ProductDetail({ id }: { id: string }) {
  const { t, tx } = useI18n();
  const { isOwner } = useApp();
  const actor = useActor();
  const m = useMoney();
  const toast = useToast();
  const { navigate } = useRouter();
  const [sheet, setSheet] = useState<'edit' | 'restock' | 'adjust' | null>(null);
  const data = useLiveQuery(async () => {
    const db = getDb();
    const p = await db.products.get(id);
    if (!p) return null;
    const moves = (await db.stock_movements.where('product_id').equals(id).toArray()).sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { p, moves };
  }, [id]);

  if (data === undefined) return <div className="skeleton h-80 rounded-3xl" />;
  if (!data) return <EmptyState image="/img/boutique.webp" title={t('stock.notFound')} />;
  const { p, moves } = data;
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const sold30 = moves.filter((mv) => mv.kind === 'sale' && mv.created_at >= since).reduce((s, mv) => s - mv.delta, 0);
  const low = p.quantity <= p.low_stock;
  const margin = p.sell_price - p.buy_price;

  return (
    <div>
      <PageHeader title={p.name} back="/app/stock" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="relative aspect-[4/3] bg-surface-2">
              <ProductThumb src={p.photo} name={p.name} size={600} className="!h-full !w-full rounded-none" />
              <div className="absolute left-3 top-3 flex gap-2">
                <Badge tone="neutral" className="bg-black/50 text-white backdrop-blur">{tx('cat', p.category)}</Badge>
                {p.archived && <Badge tone="danger">{t('stock.archived')}</Badge>}
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-line border-t border-line">
              <div className="p-4">
                <p className="text-xs font-semibold text-muted">{t('stock.sellPrice')}</p>
                <p className="mt-1 text-xl font-extrabold text-brand tabular">{m.fmt(p.sell_price)}</p>
                <p className="text-xs text-muted tabular">≈ {m.fmtAlt(p.sell_price)}</p>
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-muted">{t('stock.qty')}</p>
                <p className={clsx('mt-1 text-xl font-extrabold tabular', low ? 'text-danger' : 'text-ink')} data-testid="product-qty-value">
                  {p.quantity} <span className="text-sm font-semibold text-muted">{p.unit}</span>
                </p>
                {low && <Badge tone="danger">{p.quantity <= 0 ? t('stock.out') : t('stock.low')}</Badge>}
              </div>
            </div>
            {isOwner && (
              <div className="grid grid-cols-3 divide-x divide-line border-t border-line text-center">
                <div className="p-3">
                  <p className="text-[11px] font-semibold text-muted">{t('stock.buyPrice')}</p>
                  <p className="text-sm font-bold tabular">{m.fmt(p.buy_price)}</p>
                </div>
                <div className="p-3">
                  <p className="text-[11px] font-semibold text-muted">{t('stock.margin')}</p>
                  <p className="text-sm font-bold text-ok tabular">{m.fmt(margin)}</p>
                </div>
                <div className="p-3">
                  <p className="text-[11px] font-semibold text-muted">{t('stock.sold30')}</p>
                  <p className="text-sm font-bold tabular">{sold30}</p>
                </div>
              </div>
            )}
          </Card>
          {isOwner ? (
            <div className="grid grid-cols-2 gap-3">
              <Button size="lg" onClick={() => setSheet('restock')} data-testid="restock" className="col-span-2">
                <PackagePlus size={19} /> {t('stock.restock')}
              </Button>
              <Button variant="secondary" onClick={() => setSheet('adjust')} data-testid="adjust">
                <SlidersHorizontal size={17} /> {t('stock.adjust')}
              </Button>
              <Button variant="secondary" onClick={() => setSheet('edit')} data-testid="edit-product">
                <Pencil size={17} /> {t('common.edit')}
              </Button>
              {!p.archived && (
                <Button
                  variant="ghost"
                  className="col-span-2 text-danger"
                  onClick={async () => {
                    if (!confirm(`${t('stock.archive')} ?`)) return;
                    await updateProduct(actor, p.id, { archived: true });
                    toast(t('stock.archived'));
                    navigate('/app/stock', { replace: true });
                  }}
                >
                  <Archive size={17} /> {t('stock.archive')}
                </Button>
              )}
            </div>
          ) : (
            <p className="rounded-2xl bg-info-soft px-4 py-3 text-sm font-medium text-info">{t('stock.readOnly')}</p>
          )}
          {p.barcode && (
            <p className="text-center font-mono text-xs text-muted">
              {t('stock.barcode')} · {p.barcode}
            </p>
          )}
        </div>

        <Card className="p-5">
          <h2 className="mb-3 text-[15px] font-bold">{t('stock.history')}</h2>
          {moves.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">{t('stock.historyEmpty')}</p>
          ) : (
            <ul className="divide-y divide-line" data-testid="stock-history">
              {moves.slice(0, 60).map((mv) => (
                <li key={mv.id} className="flex items-center gap-3 py-3">
                  <span
                    className={clsx(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                      mv.delta > 0 ? 'bg-ok-soft text-ok' : mv.kind === 'sale' ? 'bg-brand-soft text-brand' : 'bg-danger-soft text-danger',
                    )}
                  >
                    {mv.delta > 0 ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{t(`mv.${mv.kind}`)}</span>
                    <span className="block truncate text-xs text-muted">
                      {fmtDateTime(mv.created_at)}
                      {mv.note ? ` · ${mv.note}` : ''}
                    </span>
                  </span>
                  <span className={clsx('text-sm font-bold tabular', mv.delta > 0 ? 'text-ok' : 'text-ink')}>
                    {mv.delta > 0 ? '+' : ''}
                    {mv.delta}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Sheet open={sheet === 'edit'} onClose={() => setSheet(null)} title={t('stock.edit')} wide>
        <ProductFormBody product={p} onSaved={() => setSheet(null)} />
      </Sheet>
      <RestockSheet open={sheet === 'restock'} onClose={() => setSheet(null)} kind="restock" product={p} />
      <RestockSheet open={sheet === 'adjust'} onClose={() => setSheet(null)} kind="adjust" product={p} />
    </div>
  );
}

function RestockSheet({ open, onClose, kind, product }: { open: boolean; onClose: () => void; kind: 'restock' | 'adjust'; product: import('@/lib/types').Product }) {
  const { t } = useI18n();
  const actor = useActor();
  const m = useMoney();
  const toast = useToast();
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState(String(product.buy_price));
  const [updateBuy, setUpdateBuy] = useState(false);
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const q = parseAmount(qty);
    if (Number.isNaN(q) || (kind === 'restock' && q <= 0) || (kind === 'adjust' && q < 0)) {
      setErr(t('common.invalidAmount'));
      return;
    }
    setBusy(true);
    const c = parseAmount(cost);
    const delta = kind === 'restock' ? q : q - product.quantity;
    await moveStock(actor, product, kind, delta, { unitCost: Number.isNaN(c) ? null : c, note, updateBuyPrice: kind === 'restock' && updateBuy });
    toast(t('common.saved'));
    setQty('');
    setNote('');
    setBusy(false);
    setErr(null);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={kind === 'restock' ? t('stock.restock') : t('stock.adjust')}
      footer={
        <Button block size="lg" onClick={save} loading={busy} data-testid="save-movement">
          {t('common.save')}
        </Button>
      }
    >
      <div className="space-y-4 pt-1">
        <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
          <ProductThumb src={product.photo} name={product.name} size={44} />
          <div>
            <p className="text-sm font-semibold">{product.name}</p>
            <p className="text-xs text-muted">
              {t('stock.qty')} : <b className="text-ink">{product.quantity}</b> {product.unit}
            </p>
          </div>
        </div>
        <Field label={kind === 'restock' ? t('stock.restockQty') : t('stock.newQty')} error={err}>
          <Input inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus data-testid="movement-qty" suffix={product.unit} />
        </Field>
        {kind === 'restock' ? (
          <>
            <Field label={t('stock.unitCost')}>
              <Input inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} suffix={m.cur === 'CDF' ? 'FC' : '$'} />
            </Field>
            <label className="flex items-center gap-3 text-sm font-medium">
              <input type="checkbox" checked={updateBuy} onChange={(e) => setUpdateBuy(e.target.checked)} className="h-5 w-5 accent-[var(--brand)]" />
              {t('stock.updateBuy')}
            </label>
          </>
        ) : null}
        <Field label={`${kind === 'adjust' ? t('stock.reason') : t('common.note')} (${t('common.optional')})`}>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={kind === 'adjust' ? t('stock.reasonPh') : 'Ex. Grossiste Gambela'} />
        </Field>
      </div>
    </Sheet>
  );
}
