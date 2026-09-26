'use client';
import { Bolt, Car, Fuel, Home, MoreHorizontal, Plus, ShoppingCart, Smartphone, Trash2, Users, Landmark } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useActor } from '@/app-shell/AppContext';
import { useRouter } from '@/app-shell/router';
import { useExpenses } from '@/app-shell/data';
import { HBar } from '@/components/charts';
import { EmptyState, PageHeader, useMoney } from '@/components/common';
import { Button, Card, Field, Input, Segmented, Sheet, useToast } from '@/components/ui';
import { useI18n, type TKey } from '@/i18n';
import { addExpense, deleteExpense } from '@/lib/actions';
import { fmtDate, todayKey } from '@/lib/dates';
import { parseAmount } from '@/lib/money';
import { dayKey, rangeBounds, type RangeKey } from '@/lib/reports';

export const EXP_CATS: { key: string; icon: typeof Home; color: string }[] = [
  { key: 'loyer', icon: Home, color: '#c2531f' },
  { key: 'transport', icon: Car, color: '#2c6aa8' },
  { key: 'electricite', icon: Bolt, color: '#e3a21f' },
  { key: 'carburant', icon: Fuel, color: '#b3122e' },
  { key: 'salaire', icon: Users, color: '#23804e' },
  { key: 'taxes', icon: Landmark, color: '#6d3fa0' },
  { key: 'communication', icon: Smartphone, color: '#0f766e' },
  { key: 'achats', icon: ShoppingCart, color: '#9e3f15' },
  { key: 'divers', icon: MoreHorizontal, color: '#7b6a5c' },
];
const catOf = (k: string) => EXP_CATS.find((c) => c.key === k) ?? EXP_CATS[EXP_CATS.length - 1];

export function Expenses() {
  const { t } = useI18n();
  const actor = useActor();
  const { route } = useRouter();
  const m = useMoney();
  const toast = useToast();
  const expenses = useExpenses();
  const [range, setRange] = useState<RangeKey>('month');
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (route.search.get('ajouter') === '1') setOpen(true);
  }, [route.search]);

  const { list, total, byCat } = useMemo(() => {
    const { from, to } = rangeBounds(range);
    const f = dayKey(from);
    const tt = dayKey(new Date(to.getTime() - 1));
    const list = (expenses ?? []).filter((e) => e.spent_on >= f && e.spent_on <= tt);
    const map = new Map<string, number>();
    for (const e of list) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return { list, total: list.reduce((s, e) => s + e.amount, 0), byCat: [...map.entries()].sort((a, b) => b[1] - a[1]) };
  }, [expenses, range]);

  return (
    <div>
      <PageHeader
        title={t('exp.title')}
        subtitle={`${m.fmt(total)} · ≈ ${m.fmtAlt(total)}`}
        actions={
          <Button onClick={() => setOpen(true)} data-testid="add-expense">
            <Plus size={18} /> <span className="hidden sm:inline">{t('exp.add')}</span>
          </Button>
        }
      />
      <Segmented
        value={range}
        onChange={setRange}
        className="mb-5 w-full sm:w-auto"
        options={[
          { value: 'today', label: t('rep.today') },
          { value: 'week', label: t('rep.week') },
          { value: 'month', label: t('rep.month') },
          { value: '30d', label: t('rep.30d') },
        ]}
      />
      {expenses && list.length === 0 ? (
        <EmptyState image="/img/marche2.webp" title={t('exp.empty')} action={<Button onClick={() => setOpen(true)}>{t('exp.add')}</Button>} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Card className="divide-y divide-line overflow-hidden lg:order-1">
            {list.map((e) => {
              const c = catOf(e.category);
              return (
                <div key={e.id} className="group flex items-center gap-3 px-4 py-3" data-testid="expense-row">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: c.color }}>
                    <c.icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{t(`expcat.${c.key}` as TKey)}</span>
                    <span className="block truncate text-xs text-muted">
                      {fmtDate(e.spent_on)}
                      {e.note ? ` · ${e.note}` : ''}
                    </span>
                  </span>
                  <span className="text-right text-sm font-bold tabular">
                    −{m.fmt(e.amount)}
                    <span className="block text-[11px] font-medium text-muted">≈ {m.fmtAlt(e.amount)}</span>
                  </span>
                  <button
                    onClick={async () => {
                      if (!confirm(t('exp.deleteConfirm'))) return;
                      await deleteExpense(actor, e.id);
                      toast(t('common.saved'));
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-danger-soft hover:text-danger"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </Card>
          <Card className="h-fit p-5 lg:order-2">
            <h2 className="mb-4 text-[15px] font-bold">{t('exp.byCategory')}</h2>
            <ul className="space-y-3.5">
              {byCat.map(([k, v]) => {
                const c = catOf(k);
                return (
                  <li key={k}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="font-semibold">{t(`expcat.${c.key}` as TKey)}</span>
                      <span className="font-bold tabular">{m.fmt(v)}</span>
                    </div>
                    <HBar value={v} max={byCat[0]?.[1] ?? 1} color={c.color} />
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      )}
      <ExpenseSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function ExpenseSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const actor = useActor();
  const m = useMoney();
  const toast = useToast();
  const [cat, setCat] = useState('transport');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayKey());
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    const a = parseAmount(amount);
    if (Number.isNaN(a) || a <= 0) return setErr(t('common.invalidAmount'));
    setBusy(true);
    await addExpense(actor, cat, a, note, date);
    toast(t('common.saved'));
    setAmount('');
    setNote('');
    setErr(null);
    setBusy(false);
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title={t('exp.add')} footer={<Button block size="lg" onClick={save} loading={busy} data-testid="save-expense">{t('common.save')}</Button>}>
      <div className="space-y-4 pt-1">
        <div>
          <p className="mb-2 text-[13px] font-semibold text-muted">{t('exp.category')}</p>
          <div className="grid grid-cols-3 gap-2">
            {EXP_CATS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCat(c.key)}
                data-testid={`expcat-${c.key}`}
                aria-pressed={cat === c.key}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 text-center transition ${cat === c.key ? 'border-brand bg-brand-soft' : 'border-line'}`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: c.color }}>
                  <c.icon size={16} />
                </span>
                <span className="text-[11.5px] font-semibold leading-tight">{t(`expcat.${c.key}` as TKey)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('common.amount')} error={err}>
            <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="expense-amount" suffix={m.cur === 'CDF' ? 'FC' : '$'} />
          </Field>
          <Field label={t('common.date')}>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label={`${t('common.note')} (${t('common.optional')})`}>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. Taxi-bus Gambela" data-testid="expense-note" />
        </Field>
      </div>
    </Sheet>
  );
}

