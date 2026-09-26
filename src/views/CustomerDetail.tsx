'use client';
import clsx from 'clsx';
import { ArrowDownLeft, MessageCircle, Pencil, Phone, Receipt, Wallet } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { useActor, useApp } from '@/app-shell/AppContext';
import { AppLink } from '@/app-shell/router';
import { EmptyState, MethodIcon, PageHeader, useMoney } from '@/components/common';
import { Button, Card, Field, Input, Sheet, useToast } from '@/components/ui';
import { useI18n } from '@/i18n';
import { addRepayment, updateCustomer } from '@/lib/actions';
import { customerCredit, validateRepayment } from '@/lib/credit';
import { getDb } from '@/lib/db';
import { fmtDate, fmtDateTime } from '@/lib/dates';
import { shortRef } from '@/lib/ids';
import { parseAmount } from '@/lib/money';
import { formatDrcPhone, normalizeDrcPhone, waLink } from '@/lib/phone';
import { reminderText } from '@/lib/receipt';
import type { PayMethod } from '@/lib/types';
import { avatarColor, initials } from './CreditList';

export function CustomerDetail({ id }: { id: string }) {
  const { t } = useI18n();
  const { shop } = useApp();
  const m = useMoney();
  const [repay, setRepay] = useState(false);
  const [edit, setEdit] = useState(false);
  const data = useLiveQuery(async () => {
    const db = getDb();
    const c = await db.customers.get(id);
    if (!c) return null;
    const [sales, payments] = await Promise.all([db.sales.where('customer_id').equals(id).toArray(), db.credit_payments.where('customer_id').equals(id).toArray()]);
    return { c, sales, payments };
  }, [id]);
  const credit = useMemo(() => (data ? customerCredit(data.sales, data.payments) : null), [data]);

  if (data === undefined) return <div className="skeleton h-80 rounded-3xl" />;
  if (!data || !credit || !shop) return <EmptyState image="/img/carnet.webp" title={t('credit.notFound')} />;
  const { c, sales, payments } = data;
  const timeline = [
    ...sales.filter((s) => s.is_credit).map((s) => ({ kind: 'sale' as const, at: s.created_at, s })),
    ...payments.map((p) => ({ kind: 'pay' as const, at: p.created_at, p })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const canRemind = !!normalizeDrcPhone(c.phone) && credit.balance > 0;

  return (
    <div>
      <PageHeader title={c.name} back="/app/credit" actions={<Button variant="secondary" size="sm" onClick={() => setEdit(true)} aria-label={t('common.edit')}><Pencil size={15} /></Button>} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-4 p-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white" style={{ background: avatarColor(c.id) }}>
                {initials(c.name)}
              </span>
              <div className="min-w-0">
                {c.phone ? (
                  <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                    <Phone size={14} /> {formatDrcPhone(c.phone)}
                  </a>
                ) : (
                  <p className="text-sm text-muted">{t('credit.noPhone')}</p>
                )}
                {c.note && <p className="mt-0.5 truncate text-xs text-muted">{c.note}</p>}
              </div>
            </div>
            <div className={clsx('border-t border-line px-5 py-4', credit.overdueAmount > 0 ? 'bg-danger-soft/60' : 'bg-surface-2/60')}>
              <p className="text-xs font-semibold text-muted">{t('credit.balance')}</p>
              <p className={clsx('text-3xl font-extrabold tracking-tight tabular', credit.balance > 0 ? 'text-ink' : 'text-ok')} data-testid="customer-balance" data-value={credit.balance}>
                {credit.balance > 0 ? m.fmt(credit.balance) : t('credit.settled')}
              </p>
              {credit.balance > 0 && <p className="text-xs text-muted tabular">≈ {m.fmtAlt(credit.balance)}</p>}
              {credit.overdueAmount > 0 && (
                <p className="mt-2 text-sm font-semibold text-danger">
                  {t('credit.overdueDays', { n: credit.oldestOverdueDays })} · {m.fmt(credit.overdueAmount)}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 divide-x divide-line border-t border-line text-center">
              <div className="p-3">
                <p className="text-[11px] font-semibold text-muted">{t('credit.totalCredit')}</p>
                <p className="text-sm font-bold tabular">{m.fmt(credit.totalCredit)}</p>
              </div>
              <div className="p-3">
                <p className="text-[11px] font-semibold text-muted">{t('credit.totalRepaid')}</p>
                <p className="text-sm font-bold text-ok tabular">{m.fmt(credit.totalRepaid)}</p>
              </div>
            </div>
          </Card>
          <div className="grid gap-3">
            <Button size="lg" onClick={() => setRepay(true)} disabled={credit.balance <= 0} data-testid="repay">
              <Wallet size={19} /> {t('credit.repay')}
            </Button>
            <a
              href={canRemind ? waLink(reminderText(shop, c, credit.balance, credit.oldestOverdueDays), c.phone) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!canRemind}
              data-testid="remind"
              className={clsx(
                'inline-flex h-14 items-center justify-center gap-2 rounded-2xl text-base font-bold transition',
                canRemind ? 'bg-[#25D366] text-white active:scale-[0.98]' : 'pointer-events-none bg-surface-2 text-muted',
              )}
            >
              <MessageCircle size={19} /> {t('credit.remind')}
            </a>
            {!c.phone && <p className="text-center text-xs text-muted">{t('credit.noPhone')}</p>}
          </div>
        </div>

        <Card className="p-5">
          <h2 className="mb-3 text-[15px] font-bold">{t('credit.history')}</h2>
          {timeline.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">{t('common.none')}</p>
          ) : (
            <ul className="divide-y divide-line" data-testid="customer-history">
              {timeline.map((e) =>
                e.kind === 'sale' ? (
                  <li key={e.s.id}>
                    <AppLink href={`/app/ventes/${e.s.id}`} className="flex items-center gap-3 py-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-soft text-gold">
                        <Receipt size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">
                          {t('credit.creditSale')} · n° {shortRef(e.s.id)}
                        </span>
                        <span className="block text-xs text-muted">
                          {fmtDateTime(e.at)}
                          {e.s.due_date ? ` · ${t('credit.due', { d: fmtDate(e.s.due_date) })}` : ''}
                        </span>
                      </span>
                      <span className="text-right text-sm font-bold tabular">
                        +{m.fmt(e.s.total - e.s.paid)}
                        {e.s.paid > 0 && <span className="block text-[11px] font-medium text-muted">/ {m.fmt(e.s.total)}</span>}
                      </span>
                    </AppLink>
                  </li>
                ) : (
                  <li key={e.p.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ok-soft text-ok">
                      <ArrowDownLeft size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">
                        {t('credit.repayment')} · {t(`pay.${e.p.method}`)}
                      </span>
                      <span className="block text-xs text-muted">
                        {fmtDateTime(e.at)}
                        {e.p.reference ? ` · réf. ${e.p.reference}` : ''}
                      </span>
                    </span>
                    <span className="text-sm font-bold text-ok tabular">−{m.fmt(e.p.amount)}</span>
                  </li>
                ),
              )}
            </ul>
          )}
        </Card>
      </div>
      <RepaySheet open={repay} onClose={() => setRepay(false)} customerId={c.id} balance={credit.balance} />
      <EditCustomerSheet open={edit} onClose={() => setEdit(false)} customer={c} />
    </div>
  );
}

function RepaySheet({ open, onClose, customerId, balance }: { open: boolean; onClose: () => void; customerId: string; balance: number }) {
  const { t } = useI18n();
  const actor = useActor();
  const m = useMoney();
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PayMethod>('cash');
  const [ref, setRef] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    const a = parseAmount(amount);
    const v = validateRepayment(a, balance);
    if (v !== 'ok') return setErr(v === 'too_much' ? t('credit.tooMuch') : t('common.invalidAmount'));
    setBusy(true);
    await addRepayment(actor, customerId, a, method, ref || null);
    toast(t('common.saved'));
    setAmount('');
    setRef('');
    setErr(null);
    setBusy(false);
    onClose();
  };
  const methods: PayMethod[] = ['cash', 'mpesa', 'orange', 'airtel', 'afrimoney'];
  return (
    <Sheet open={open} onClose={onClose} title={t('credit.repay')} footer={<Button block size="lg" onClick={save} loading={busy} data-testid="save-repayment">{t('common.save')}</Button>}>
      <div className="space-y-4 pt-1">
        <p className="rounded-2xl bg-surface-2 px-4 py-3 text-sm">
          {t('credit.balance')} : <b className="tabular">{m.fmt(balance)}</b> <span className="text-muted">≈ {m.fmtAlt(balance)}</span>
        </p>
        <Field label={t('credit.repayAmount')} error={err}>
          <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus data-testid="repay-amount" suffix={m.cur === 'CDF' ? 'FC' : '$'} />
        </Field>
        <div className="flex flex-wrap gap-2">
          {[balance, Math.round(balance / 2)].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map((v, i) => (
            <button key={v} onClick={() => setAmount(String(v))} className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold tabular">
              {i === 0 ? `${t('credit.full')} · ` : '½ · '}
              {m.fmt(v)}
            </button>
          ))}
        </div>
        <div>
          <p className="mb-2 text-[13px] font-semibold text-muted">{t('pay.method')}</p>
          <div className="grid grid-cols-5 gap-2">
            {methods.map((mm) => (
              <button
                key={mm}
                type="button"
                onClick={() => setMethod(mm)}
                aria-pressed={method === mm}
                data-testid={`repay-method-${mm}`}
                className={clsx('flex flex-col items-center gap-1 rounded-2xl border p-2 transition', method === mm ? 'border-brand bg-brand-soft' : 'border-line')}
              >
                <MethodIcon method={mm} size={28} />
                <span className="text-[10.5px] font-bold leading-tight">{t(`pay.${mm}`).split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
        {method !== 'cash' && (
          <Field label={`${t('pay.reference')} (${t('common.optional')})`}>
            <Input value={ref} onChange={(e) => setRef(e.target.value)} />
          </Field>
        )}
      </div>
    </Sheet>
  );
}

function EditCustomerSheet({ open, onClose, customer }: { open: boolean; onClose: () => void; customer: import('@/lib/types').Customer }) {
  const { t } = useI18n();
  const actor = useActor();
  const toast = useToast();
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone ?? '');
  const [note, setNote] = useState(customer.note ?? '');
  const save = async () => {
    if (!name.trim()) return;
    await updateCustomer(actor, customer.id, { name: name.trim(), phone: phone.trim() || null, note: note.trim() || null });
    toast(t('common.saved'));
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title={t('common.edit')} footer={<Button block size="lg" onClick={save}>{t('common.save')}</Button>}>
      <div className="space-y-4 pt-1">
        <Field label={t('common.name')}>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t('common.phone')}>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
        </Field>
        <Field label={t('common.note')}>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Sheet>
  );
}
