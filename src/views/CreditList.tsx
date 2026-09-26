'use client';
import clsx from 'clsx';
import { AlertCircle, Search, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useActor } from '@/app-shell/AppContext';
import { AppLink, useRouter } from '@/app-shell/router';
import { useCustomers } from '@/app-shell/data';
import { EmptyState, PageHeader, useMoney } from '@/components/common';
import { Button, Card, Field, Input, Segmented, Sheet, useToast } from '@/components/ui';
import { useI18n } from '@/i18n';
import { addCustomer } from '@/lib/actions';
import { formatDrcPhone } from '@/lib/phone';

export function initials(name: string) {
  return name
    .replace(/^(Maman|Papa|Sœur|Frère|Mama)\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const AVATAR = ['#c2531f', '#23804e', '#2c6aa8', '#b07a12', '#6d3fa0', '#b3122e', '#0f766e'];
export function avatarColor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR[h % AVATAR.length];
}

export function CreditList() {
  const { t } = useI18n();
  const rows = useCustomers();
  const m = useMoney();
  const [filter, setFilter] = useState<'balance' | 'overdue' | 'all'>('balance');
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);

  const total = (rows ?? []).reduce((s, r) => s + r.credit.balance, 0);
  const overdueRows = (rows ?? []).filter((r) => r.credit.overdueAmount > 0);
  const list = (rows ?? []).filter((r) => {
    if (filter === 'balance' && r.credit.balance <= 0) return false;
    if (filter === 'overdue' && r.credit.overdueAmount <= 0) return false;
    if (q && !r.customer.name.toLowerCase().includes(q.toLowerCase()) && !(r.customer.phone ?? '').includes(q)) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title={t('credit.title')}
        actions={
          <Button onClick={() => setAdding(true)} data-testid="add-customer">
            <UserPlus size={18} /> <span className="hidden sm:inline">{t('credit.addCustomer')}</span>
          </Button>
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#e8a93a] to-[#b07a12] p-5 text-white shadow-soft sm:col-span-2">
          <div className="kente pointer-events-none absolute inset-0 opacity-50" />
          <p className="relative text-sm font-semibold text-white/85">{t('credit.outstanding')}</p>
          <p className="relative mt-1 text-4xl font-extrabold tracking-tight tabular" data-testid="credit-total">{m.fmt(total)}</p>
          <p className="relative mt-1 text-sm text-white/85 tabular">≈ {m.fmtAlt(total)}</p>
        </div>
        <div className="card flex flex-col justify-center gap-1 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-danger">
            <AlertCircle size={16} /> {t('credit.overdue')}
          </p>
          <p className="text-3xl font-extrabold tabular">{overdueRows.length}</p>
          <p className="text-xs text-muted tabular">{m.fmt(overdueRows.reduce((s, r) => s + r.credit.overdueAmount, 0))}</p>
        </div>
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Segmented
          value={filter}
          onChange={setFilter}
          className="w-full sm:w-auto"
          options={[
            { value: 'balance', label: t('credit.withBalance') },
            { value: 'overdue', label: `${t('credit.overdue')} (${overdueRows.length})` },
            { value: 'all', label: t('credit.all') },
          ]}
        />
        <div className="relative flex-1">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('credit.searchPh')}
            className="h-11 w-full rounded-2xl border border-line bg-surface pl-11 pr-4 text-[16px] outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
          />
        </div>
      </div>

      {rows && rows.length === 0 ? (
        <EmptyState image="/img/carnet.webp" title={t('credit.empty')} hint={t('credit.emptyHint')} action={<Button onClick={() => setAdding(true)}>{t('credit.addCustomer')}</Button>} />
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {list.map(({ customer: c, credit }) => (
            <AppLink key={c.id} href={`/app/credit/${c.id}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface-2" data-testid="customer-row" data-name={c.name}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: avatarColor(c.id) }}>
                {initials(c.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] font-semibold">{c.name}</span>
                <span className="block truncate text-xs text-muted">
                  {c.phone ? formatDrcPhone(c.phone) : '—'}
                  {credit.overdueAmount > 0 && <span className="ml-2 font-semibold text-danger">{t('credit.overdueDays', { n: credit.oldestOverdueDays })}</span>}
                </span>
              </span>
              <span className="text-right">
                <span className={clsx('block text-[15px] font-extrabold tabular', credit.balance > 0 ? (credit.overdueAmount > 0 ? 'text-danger' : 'text-ink') : 'text-ok')}>
                  {credit.balance > 0 ? m.fmt(credit.balance) : t('credit.settled')}
                </span>
                {credit.balance > 0 && <span className="text-[11px] text-muted tabular">≈ {m.fmtAlt(credit.balance)}</span>}
              </span>
            </AppLink>
          ))}
          {list.length === 0 && <p className="py-10 text-center text-sm text-muted">{t('common.none')}</p>}
        </Card>
      )}
      <CustomerSheet open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}

export function CustomerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const actor = useActor();
  const toast = useToast();
  const { navigate } = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const save = async () => {
    if (!name.trim()) return setErr(t('common.required'));
    const c = await addCustomer(actor, name, phone || null, note.trim() || null);
    toast(t('common.saved'));
    setName('');
    setPhone('');
    setNote('');
    setErr(null);
    onClose();
    navigate(`/app/credit/${c.id}`);
  };
  return (
    <Sheet open={open} onClose={onClose} title={t('credit.addCustomer')} footer={<Button block size="lg" onClick={save} data-testid="save-customer">{t('common.save')}</Button>}>
      <div className="space-y-4 pt-1">
        <Field label={t('common.name')} error={err}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ex. Maman Chantal" data-testid="customer-name" />
        </Field>
        <Field label={t('common.phone')} hint="WhatsApp">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="081 234 5678" data-testid="customer-phone" />
        </Field>
        <Field label={`${t('common.note')} (${t('common.optional')})`}>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Sheet>
  );
}
