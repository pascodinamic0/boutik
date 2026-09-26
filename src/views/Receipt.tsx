'use client';
import { motion } from 'motion/react';
import { Check, MessageCircle, Printer, ShoppingBag } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '@/app-shell/AppContext';
import { AppLink, useRouter } from '@/app-shell/router';
import { EmptyState, MethodBadge, PageHeader } from '@/components/common';
import { LogoMark } from '@/components/Logo';
import { Button } from '@/components/ui';
import { useI18n } from '@/i18n';
import { getDb } from '@/lib/db';
import { fmtDate, fmtDateTime } from '@/lib/dates';
import { shortRef } from '@/lib/ids';
import { convert, formatMoney, otherCurrency } from '@/lib/money';
import { waLink } from '@/lib/phone';
import { receiptText } from '@/lib/receipt';

export function ReceiptView({ id }: { id: string }) {
  const { t } = useI18n();
  const { shop } = useApp();
  const { route } = useRouter();
  const fresh = route.search.get('nouveau') === '1';
  const data = useLiveQuery(async () => {
    const db = getDb();
    const sale = await db.sales.get(id);
    if (!sale) return null;
    const items = await db.sale_items.where('sale_id').equals(id).toArray();
    const customer = sale.customer_id ? await db.customers.get(sale.customer_id) : null;
    return { sale, items, customer };
  }, [id]);

  if (data === undefined) return <div className="skeleton mx-auto h-[520px] max-w-md rounded-3xl" />;
  if (!data || !shop)
    return <EmptyState image="/img/kiosque.webp" title={t('rcpt.notFound')} action={<AppLink href="/app/ventes" className="font-semibold text-brand">{t('nav.sales')} →</AppLink>} />;

  const { sale, items, customer } = data;
  const f = (v: number) => formatMoney(v, sale.currency);
  const alt = otherCurrency(sale.currency);
  const text = receiptText(shop, sale, items, customer);

  return (
    <div className="mx-auto max-w-md">
      {fresh ? (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="no-print mb-5 flex flex-col items-center text-center">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-ok text-white shadow-[0_12px_30px_-10px_var(--ok)]"
          >
            <Check size={34} strokeWidth={3} />
          </motion.span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight" data-testid="sale-success">{t('rcpt.success')}</h1>
        </motion.div>
      ) : (
        <div className="no-print">
          <PageHeader title={t('rcpt.title')} back="/app/ventes" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: fresh ? 0.2 : 0 }}
        className="print-area relative overflow-hidden rounded-[28px] border border-line bg-surface shadow-soft"
        data-testid="receipt"
        data-sale-id={sale.id}
      >
        <div className="flex flex-col items-center border-b border-dashed border-line px-6 pb-5 pt-6 text-center">
          <LogoMark size={44} />
          <p className="mt-3 text-lg font-extrabold">{shop.name}</p>
          <p className="text-xs text-muted">
            {shop.commune}
            {shop.phone ? ` · ${shop.phone}` : ''}
          </p>
          <p className="mt-3 text-[13px] font-semibold">
            {t('rcpt.number')} <span data-testid="receipt-number">{shortRef(sale.id)}</span>
          </p>
          <p className="text-xs text-muted">{fmtDateTime(sale.created_at)}</p>
        </div>
        <div className="px-6 py-4">
          {customer && (
            <p className="mb-3 text-sm">
              <span className="text-muted">{t('pos.customer')} :</span> <span className="font-semibold">{customer.name}</span>
            </p>
          )}
          <ul className="space-y-2.5">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block font-semibold">{i.name}</span>
                  <span className="text-xs text-muted tabular">
                    {i.qty} × {f(i.unit_price)}
                  </span>
                </span>
                <span className="shrink-0 font-semibold tabular">{f(i.qty * i.unit_price)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-dashed border-line pt-4 text-sm">
            {sale.discount > 0 && (
              <>
                <div className="flex justify-between">
                  <dt className="text-muted">{t('pos.subtotal')}</dt>
                  <dd className="tabular">{f(sale.subtotal)}</dd>
                </div>
                <div className="flex justify-between text-ok">
                  <dt>{t('pos.discount')}</dt>
                  <dd className="tabular">−{f(sale.discount)}</dd>
                </div>
              </>
            )}
            <div className="flex items-end justify-between pt-1">
              <dt className="text-base font-bold">{t('common.total')}</dt>
              <dd className="text-right">
                <span className="block text-2xl font-extrabold tabular" data-testid="receipt-total">{f(sale.total)}</span>
                <span className="text-xs text-muted tabular">
                  {t('rcpt.equiv')} {formatMoney(convert(sale.total, sale.currency, alt, sale.rate), alt)} · 1 $ = {sale.rate.toLocaleString('fr-FR')} FC
                </span>
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-sm">
            <MethodBadge method={sale.method} />
            {sale.reference && <span className="font-mono text-xs text-muted">réf. {sale.reference}</span>}
            {sale.is_credit && (
              <span className="w-full text-[13px]">
                {t('rcpt.paid')} <b className="tabular">{f(sale.paid)}</b> · {t('rcpt.remaining')} <b className="tabular text-danger">{f(sale.total - sale.paid)}</b>
                {sale.due_date ? ` · ${t('credit.due', { d: fmtDate(sale.due_date) })}` : ''}
              </span>
            )}
          </div>
          <p className="mt-4 text-center text-xs text-muted">
            {t('rcpt.seller')} : {sale.seller_name} · {t('rcpt.thanks')}
          </p>
        </div>
        <div className="h-3 w-full bg-[radial-gradient(circle_at_8px_12px,var(--bg)_6px,transparent_6.5px)] bg-[length:16px_12px]" />
      </motion.div>

      <div className="no-print mt-5 grid grid-cols-2 gap-3">
        <a
          href={waLink(text, customer?.phone)}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="share-whatsapp"
          className="col-span-2 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-base font-bold text-white shadow-[0_10px_24px_-12px_#25D366] transition active:scale-[0.98]"
        >
          <MessageCircle size={20} /> {t('rcpt.whatsapp')}
        </a>
        <Button variant="secondary" size="lg" onClick={() => window.print()} data-testid="print-receipt">
          <Printer size={18} /> {t('rcpt.print')}
        </Button>
        <AppLink href="/app/vendre" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand text-base font-semibold text-white transition active:scale-[0.98]" data-testid="receipt-new-sale">
          <ShoppingBag size={18} /> {t('rcpt.newSale')}
        </AppLink>
      </div>
    </div>
  );
}
