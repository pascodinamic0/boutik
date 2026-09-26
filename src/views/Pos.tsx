'use client';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import { Minus, Plus, ScanBarcode, Search, ShoppingBag, Trash2, UserPlus, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useActor, useApp } from '@/app-shell/AppContext';
import { AppLink, useRouter } from '@/app-shell/router';
import { useCustomers, useProducts } from '@/app-shell/data';
import { EmptyState, MethodIcon, ProductThumb, useMoney } from '@/components/common';
import { Button, Field, Input, Segmented, Select, Sheet, useToast } from '@/components/ui';
import { useI18n } from '@/i18n';
import { addCustomer, createSale } from '@/lib/actions';
import { addDaysKey } from '@/lib/dates';
import { cartTotals, changeDue, parseAmount } from '@/lib/money';
import type { Product, SaleMethod } from '@/lib/types';

interface Line {
  product: Product;
  qty: number;
}

const CART_KEY = 'boutik.cart';
const METHODS: SaleMethod[] = ['cash', 'mpesa', 'orange', 'airtel', 'afrimoney', 'credit'];

export function Pos() {
  const { t, tx } = useI18n();
  const { shop } = useApp();
  const products = useProducts();
  const m = useMoney();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Keep the cart across navigation (per shop)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`${CART_KEY}:${shop?.id}`);
      if (raw) setCart(JSON.parse(raw));
    } catch {}
  }, [shop?.id]);
  useEffect(() => {
    sessionStorage.setItem(`${CART_KEY}:${shop?.id}`, JSON.stringify(cart));
  }, [cart, shop?.id]);

  const byId = useMemo(() => new Map((products ?? []).map((p) => [p.id, p])), [products]);
  const lines: Line[] = Object.entries(cart)
    .map(([id, qty]) => ({ product: byId.get(id)!, qty }))
    .filter((l) => l.product && l.qty > 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.qty * l.product.sell_price, 0);

  const cats = useMemo(() => [...new Set((products ?? []).map((p) => p.category))].sort(), [products]);
  const filtered = (products ?? []).filter((p) => {
    if (cat !== 'all' && p.category !== cat) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return p.name.toLowerCase().includes(s) || (p.barcode ?? '').includes(q.trim());
  });

  const add = (p: Product, d = 1) => {
    setCart((c) => {
      const next = Math.max(0, +((c[p.id] ?? 0) + d).toFixed(3));
      if (d > 0 && next > p.quantity) toast(t('pos.stockWarn', { name: p.name }), 'info');
      const copy = { ...c };
      if (next <= 0) delete copy[p.id];
      else copy[p.id] = next;
      return copy;
    });
  };
  const setQty = (p: Product, qty: number) => setCart((c) => ({ ...c, [p.id]: Math.max(0, qty) }));

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const code = q.trim();
    const hit = (products ?? []).find((p) => p.barcode && p.barcode === code) ?? (filtered.length === 1 ? filtered[0] : null);
    if (hit) {
      add(hit);
      setQ('');
    }
  };

  if (products && products.length === 0)
    return (
      <EmptyState
        image="/img/epicerie.webp"
        title={t('pos.noProducts')}
        hint={t('pos.addFirst')}
        action={
          <AppLink href="/app/stock/nouveau" className="inline-flex h-11 items-center rounded-2xl bg-brand px-5 font-semibold text-white">
            {t('stock.add')}
          </AppLink>
        }
      />
    );

  const cartPanel = (
    <CartPanel
      lines={lines}
      onAdd={add}
      onSet={setQty}
      onClear={() => setCart({})}
      onCheckout={() => {
        setCartOpen(false);
        setCheckout(true);
      }}
    />
  );

  return (
    <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8">
      <div className="min-w-0">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">{t('pos.title')}</h1>
        </div>
        <div className="sticky top-[calc(56px+env(safe-area-inset-top))] z-30 -mx-4 bg-bg/90 px-4 pb-3 pt-1 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:top-0 lg:mx-0 lg:px-0">
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onSearchKey}
              placeholder={t('pos.search')}
              data-testid="pos-search"
              enterKeyHint="search"
              className="h-12 w-full rounded-2xl border border-line bg-surface pl-11 pr-11 text-[16px] outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
            />
            {q ? (
              <button onClick={() => setQ('')} aria-label={t('common.close')} className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-surface-2 text-muted">
                <X size={15} />
              </button>
            ) : (
              <ScanBarcode size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
            )}
          </div>
          <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            {['all', ...cats].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={clsx(
                  'h-9 shrink-0 rounded-full px-4 text-[13.5px] font-semibold transition',
                  cat === c ? 'bg-cocoa text-cream dark:bg-cream dark:text-cocoa' : 'border border-line bg-surface text-muted hover:text-ink',
                )}
              >
                {c === 'all' ? t('common.all') : tx('cat', c)}
              </button>
            ))}
          </div>
        </div>

        {products === undefined ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[4/5] rounded-3xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-muted">{t('pos.noProducts')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 min-[560px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => {
              const inCart = cart[p.id] ?? 0;
              const out = p.quantity <= 0;
              return (
                <motion.button
                  key={p.id}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => add(p)}
                  data-testid="product-card"
                  data-name={p.name}
                  className={clsx(
                    'group relative flex flex-col overflow-hidden rounded-3xl border bg-surface text-left transition-shadow hover:shadow-soft',
                    inCart ? 'border-brand ring-2 ring-brand/25' : 'border-line',
                  )}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
                    {p.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo} alt="" loading="lazy" className={clsx('h-full w-full object-cover transition duration-300 group-hover:scale-105', out && 'grayscale')} />
                    ) : (
                      <ProductThumb src={null} name={p.name} size={400} className="!h-full !w-full rounded-none" />
                    )}
                    <span
                      className={clsx(
                        'absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold backdrop-blur',
                        out ? 'bg-danger text-white' : p.quantity <= p.low_stock ? 'bg-gold text-white' : 'bg-black/45 text-white',
                      )}
                    >
                      {out ? t('pos.outOfStock') : t('pos.left', { n: p.quantity })}
                    </span>
                    <AnimatePresence>
                      {inCart > 0 && (
                        <motion.span
                          key={inCart}
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.4, opacity: 0 }}
                          className="absolute right-2 top-2 flex h-8 min-w-8 items-center justify-center rounded-full bg-brand px-2 text-sm font-extrabold text-white shadow-lg"
                        >
                          {inCart}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <span className="line-clamp-2 text-[13.5px] font-semibold leading-snug">{p.name}</span>
                    <span className="mt-auto text-[15px] font-extrabold text-brand tabular">{m.fmt(p.sell_price)}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop cart */}
      <aside className="hidden lg:block">
        <div className="card sticky top-8 flex max-h-[calc(100dvh-4rem)] flex-col overflow-hidden">{cartPanel}</div>
      </aside>

      {/* Mobile cart bar */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 mx-auto max-w-xl lg:hidden"
          >
            <div className="flex items-center gap-2 rounded-[22px] bg-cocoa p-2 pl-4 text-cream shadow-pop dark:bg-cream dark:text-cocoa">
              <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setCartOpen(true)} data-testid="open-cart">
                <span className="relative">
                  <ShoppingBag size={22} />
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">{count}</span>
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-extrabold tabular">{m.fmt(subtotal)}</span>
                  <span className="block text-[11.5px] opacity-70 tabular">≈ {m.fmtAlt(subtotal)} · {t('pos.viewCart')}</span>
                </span>
              </button>
              <Button onClick={() => setCheckout(true)} data-testid="checkout" className="h-12 px-5">
                {t('pos.checkout')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={cartOpen} onClose={() => setCartOpen(false)} title={t('pos.cart')}>
        <div className="-mx-5 -mb-5 flex flex-col">{cartPanel}</div>
      </Sheet>

      <Checkout open={checkout} onClose={() => setCheckout(false)} lines={lines} onDone={() => setCart({})} />
    </div>
  );
}

function CartPanel({
  lines,
  onAdd,
  onSet,
  onClear,
  onCheckout,
}: {
  lines: Line[];
  onAdd: (p: Product, d: number) => void;
  onSet: (p: Product, q: number) => void;
  onClear: () => void;
  onCheckout: () => void;
}) {
  const { t } = useI18n();
  const m = useMoney();
  const subtotal = lines.reduce((s, l) => s + l.qty * l.product.sell_price, 0);
  return (
    <>
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <p className="text-base font-bold">
          {t('pos.cart')} <span className="text-muted">· {t('common.items', { n: lines.reduce((s, l) => s + l.qty, 0) })}</span>
        </p>
        {lines.length > 0 && (
          <button onClick={onClear} className="text-sm font-semibold text-danger">
            {t('pos.clear')}
          </button>
        )}
      </div>
      <div className="min-h-[120px] flex-1 overflow-y-auto px-5">
        {lines.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center text-sm text-muted">
            <ShoppingBag size={32} className="mb-3 text-line" />
            {t('pos.cartEmpty')}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {lines.map((l) => (
                <motion.li key={l.product.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-3 py-3" data-testid="cart-line">
                  <ProductThumb src={l.product.photo} name={l.product.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{l.product.name}</p>
                    <p className="text-xs text-muted tabular">
                      {m.fmt(l.product.sell_price)} × {l.qty} = <span className="font-semibold text-ink">{m.fmt(l.product.sell_price * l.qty)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-surface-2 p-1">
                    <button onClick={() => onAdd(l.product, -1)} aria-label="-1" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink shadow-sm">
                      {l.qty <= 1 ? <Trash2 size={14} className="text-danger" /> : <Minus size={15} />}
                    </button>
                    <input
                      inputMode="decimal"
                      value={l.qty}
                      onChange={(e) => {
                        const v = parseAmount(e.target.value);
                        if (!Number.isNaN(v)) onSet(l.product, v);
                      }}
                      className="w-9 bg-transparent text-center text-sm font-bold outline-none tabular"
                      aria-label={t('common.quantity')}
                    />
                    <button onClick={() => onAdd(l.product, 1)} aria-label="+1" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink shadow-sm">
                      <Plus size={15} />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
      <div className="border-t border-line bg-surface-2/50 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mb-3 flex items-end justify-between">
          <span className="text-sm font-semibold text-muted">{t('pos.subtotal')}</span>
          <span className="text-right">
            <span className="block text-2xl font-extrabold tabular" data-testid="cart-total">{m.fmt(subtotal)}</span>
            <span className="text-xs text-muted tabular">≈ {m.fmtAlt(subtotal)}</span>
          </span>
        </div>
        <Button block size="lg" disabled={!lines.length} onClick={onCheckout} data-testid="checkout-panel">
          {t('pos.checkout')}
        </Button>
      </div>
    </>
  );
}

function Checkout({ open, onClose, lines, onDone }: { open: boolean; onClose: () => void; lines: Line[]; onDone: () => void }) {
  const { t } = useI18n();
  const actor = useActor();
  const m = useMoney();
  const toast = useToast();
  const { navigate } = useRouter();
  const customers = useCustomers();
  const [method, setMethod] = useState<SaleMethod>('cash');
  const [discType, setDiscType] = useState<'amount' | 'percent'>('amount');
  const [disc, setDisc] = useState('');
  const [ref, setRef] = useState('');
  const [received, setReceived] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [newCust, setNewCust] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [deposit, setDeposit] = useState('');
  const [due, setDue] = useState(addDaysKey(14));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setErr(null);
      setBusy(false);
    }
  }, [open]);

  const dv = parseAmount(disc);
  const totals = cartTotals(
    lines.map((l) => ({ qty: l.qty, unit_price: l.product.sell_price, unit_cost: l.product.buy_price })),
    Number.isNaN(dv) ? null : { type: discType, value: dv },
    m.cur,
  );
  const rec = parseAmount(received);
  const change = Number.isNaN(rec) ? 0 : changeDue(totals.total, rec, m.cur);
  const quick = [totals.total, ...[1000, 5000, 10000, 20000].map((s) => Math.ceil(totals.total / s) * s)].filter((v, i, a) => v > 0 && a.indexOf(v) === i).slice(0, 4);

  const confirm = async () => {
    setErr(null);
    if (method === 'credit' && !customerId && !(newCust && custName.trim())) {
      setErr(t('pos.customerRequired'));
      return;
    }
    setBusy(true);
    try {
      let cid: string | null = method === 'credit' ? customerId || null : null;
      if (method === 'credit' && newCust && custName.trim()) {
        const c = await addCustomer(actor, custName, custPhone || null);
        cid = c.id;
      }
      const dep = parseAmount(deposit);
      const sale = await createSale(actor, {
        lines: lines.map((l) => ({ product: l.product, qty: l.qty, unit_price: l.product.sell_price })),
        discount: Number.isNaN(dv) || dv <= 0 ? null : { type: discType, value: dv },
        method,
        reference: ['mpesa', 'orange', 'airtel', 'afrimoney'].includes(method) ? ref : null,
        customerId: cid,
        paidNow: Number.isNaN(dep) ? 0 : dep,
        dueDate: method === 'credit' ? due : null,
      });
      onDone();
      onClose();
      if (!navigator.onLine) toast(t('sync.savedOffline'), 'info');
      setDisc('');
      setRef('');
      setReceived('');
      setDeposit('');
      setCustomerId('');
      setNewCust(false);
      setCustName('');
      setCustPhone('');
      setMethod('cash');
      navigate(`/app/ventes/${sale.id}?nouveau=1`);
    } catch (e) {
      setErr(t('common.error'));
      console.error(e);
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('pos.checkout')}
      wide
      footer={
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted">{t('common.total')}</p>
            <p className="truncate text-xl font-extrabold tabular" data-testid="checkout-total">{m.fmt(totals.total)}</p>
            <p className="text-xs text-muted tabular">≈ {m.fmtAlt(totals.total)}</p>
          </div>
          <Button size="lg" onClick={confirm} loading={busy} disabled={!lines.length} data-testid="confirm-sale" className="min-w-[170px]">
            {t('pos.confirm')}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pt-1">
        <div>
          <p className="mb-2 text-[13px] font-semibold text-muted">{t('pay.method')}</p>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((mm) => (
              <motion.button
                key={mm}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setMethod(mm)}
                data-testid={`method-${mm}`}
                aria-pressed={method === mm}
                className={clsx(
                  'flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 text-center transition',
                  method === mm ? 'border-brand bg-brand-soft ring-2 ring-brand/20' : 'border-line bg-surface hover:bg-surface-2',
                )}
              >
                <MethodIcon method={mm} size={32} />
                <span className="text-[12px] font-bold leading-tight">{t(`pay.${mm}`)}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {['mpesa', 'orange', 'airtel', 'afrimoney'].includes(method) && (
          <Field label={`${t('pay.reference')} (${t('common.optional')})`} hint={t('pay.referenceHint')}>
            <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Ex. MP240926.1432.A12345" data-testid="pay-ref" autoCapitalize="characters" />
          </Field>
        )}

        {method === 'cash' && (
          <div className="rounded-2xl bg-surface-2 p-4">
            <Field label={t('pos.received')}>
              <Input inputMode="decimal" value={received} onChange={(e) => setReceived(e.target.value)} suffix={m.cur === 'CDF' ? 'FC' : '$'} placeholder="0" />
            </Field>
            <div className="mt-2 flex flex-wrap gap-2">
              {quick.map((v) => (
                <button key={v} onClick={() => setReceived(String(v))} className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold tabular">
                  {m.fmt(v)}
                </button>
              ))}
            </div>
            {change > 0 && (
              <p className="mt-3 flex items-center justify-between text-sm font-semibold">
                <span className="text-muted">{t('pos.change')}</span>
                <span className="text-lg font-extrabold text-ok tabular">{m.fmt(change)}</span>
              </p>
            )}
          </div>
        )}

        {method === 'credit' && (
          <div className="space-y-3 rounded-2xl bg-gold-soft/60 p-4">
            {!newCust ? (
              <Field label={t('pos.customer')}>
                <div className="flex gap-2">
                  <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} data-testid="credit-customer" className="flex-1">
                    <option value="">{t('pos.chooseCustomer')}</option>
                    {(customers ?? []).map((c) => (
                      <option key={c.customer.id} value={c.customer.id}>
                        {c.customer.name}
                        {c.credit.balance > 0 ? ` — ${m.fmt(c.credit.balance)}` : ''}
                      </option>
                    ))}
                  </Select>
                  <Button variant="secondary" onClick={() => setNewCust(true)} aria-label={t('pos.newCustomer')} className="h-12 w-12 shrink-0 !px-0" data-testid="new-customer-inline">
                    <UserPlus size={18} />
                  </Button>
                </div>
              </Field>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t('common.name')}>
                  <Input value={custName} onChange={(e) => setCustName(e.target.value)} data-testid="new-customer-name" autoFocus />
                </Field>
                <Field label={`${t('common.phone')} (${t('common.optional')})`}>
                  <Input value={custPhone} onChange={(e) => setCustPhone(e.target.value)} inputMode="tel" placeholder="081 234 5678" data-testid="new-customer-phone" />
                </Field>
                <button onClick={() => setNewCust(false)} className="text-left text-sm font-semibold text-brand sm:col-span-2">
                  ← {t('pos.chooseCustomer')}
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('pos.deposit')}>
                <Input inputMode="decimal" value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="0" data-testid="credit-deposit" />
              </Field>
              <Field label={t('pos.dueDate')}>
                <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
              </Field>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-line p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold">{t('pos.discount')}</span>
            <Segmented
              size="sm"
              value={discType}
              onChange={setDiscType}
              options={[
                { value: 'amount', label: m.cur === 'CDF' ? 'FC' : '$' },
                { value: 'percent', label: '%' },
              ]}
            />
          </div>
          <Input className="mt-3" inputMode="decimal" value={disc} onChange={(e) => setDisc(e.target.value)} placeholder="0" data-testid="discount" />
          <dl className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{t('pos.subtotal')}</dt>
              <dd className="font-semibold tabular">{m.fmt(totals.subtotal)}</dd>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-ok">
                <dt>{t('pos.discount')}</dt>
                <dd className="font-semibold tabular">−{m.fmt(totals.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-2 text-base">
              <dt className="font-bold">{t('common.total')}</dt>
              <dd className="text-right font-extrabold tabular">
                {m.fmt(totals.total)} <span className="block text-xs font-medium text-muted">≈ {m.fmtAlt(totals.total)}</span>
              </dd>
            </div>
          </dl>
        </div>
        {err && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">{err}</p>}
      </div>
    </Sheet>
  );
}
