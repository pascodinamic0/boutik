'use client';
import { Camera, ImagePlus } from 'lucide-react';
import { useRef, useState } from 'react';
import { useActor, useApp } from '@/app-shell/AppContext';
import { useRouter } from '@/app-shell/router';
import { PageHeader, useMoney } from '@/components/common';
import { Button, Card, Field, Input, Select, useToast } from '@/components/ui';
import { useI18n } from '@/i18n';
import { addProduct, updateProduct, type ProductInput } from '@/lib/actions';
import { fileToThumb } from '@/lib/image';
import { parseAmount } from '@/lib/money';
import type { Product } from '@/lib/types';

export const CATEGORIES = ['Alimentation', 'Boissons', 'Produits frais', 'Hygiène', 'Ménage', 'Médicaments', 'Cosmétiques', 'Divers'];
export const UNITS = ['pièce', 'kg', 'litre', 'sac', 'paquet', 'boîte', 'bouteille', 'carton', 'sachet', 'plateau', 'tube', 'tas', 'mètre'];

export function ProductFormBody({ product, onSaved }: { product?: Product; onSaved: (p: Product | null) => void }) {
  const { t, tx } = useI18n();
  const actor = useActor();
  const m = useMoney();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(product?.photo ?? null);
  const [name, setName] = useState(product?.name ?? '');
  const [category, setCategory] = useState(product?.category ?? 'Alimentation');
  const [buy, setBuy] = useState(product ? String(product.buy_price) : '');
  const [sell, setSell] = useState(product ? String(product.sell_price) : '');
  const [unit, setUnit] = useState(product?.unit ?? 'pièce');
  const [qty, setQty] = useState('');
  const [low, setLow] = useState(product ? String(product.low_stock) : '5');
  const [barcode, setBarcode] = useState(product?.barcode ?? '');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const b = parseAmount(buy);
  const s = parseAmount(sell);
  const margin = !Number.isNaN(b) && !Number.isNaN(s) && s > 0 ? s - b : null;
  const cats = CATEGORIES.includes(category) ? CATEGORIES : [...CATEGORIES, category];
  const units = UNITS.includes(unit) ? UNITS : [...UNITS, unit];

  const pick = async (f: File | undefined) => {
    if (!f) return;
    try {
      setPhoto(await fileToThumb(f));
    } catch {
      toast(t('common.error'), 'danger');
    }
  };

  const save = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t('stock.nameRequired');
    if (Number.isNaN(s) || s < 0) e.sell = t('common.invalidAmount');
    if (buy && (Number.isNaN(b) || b < 0)) e.buy = t('common.invalidAmount');
    const q = qty ? parseAmount(qty) : 0;
    if (Number.isNaN(q) || q < 0) e.qty = t('common.invalidAmount');
    const l = parseAmount(low || '0');
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const input: ProductInput = {
      name: name.trim(),
      category,
      buy_price: Number.isNaN(b) ? 0 : b,
      sell_price: s,
      unit,
      barcode: barcode.trim() || null,
      low_stock: Number.isNaN(l) ? 0 : l,
      photo,
    };
    try {
      if (product) {
        await updateProduct(actor, product.id, input);
        toast(t('common.saved'));
        onSaved(null);
      } else {
        const p = await addProduct(actor, input, q);
        toast(t('common.saved'));
        onSaved(p);
      }
    } catch (err) {
      console.error(err);
      toast(t('common.error'), 'danger');
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-5 md:grid-cols-[220px_1fr]">
      <div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative flex aspect-square w-full max-w-[220px] flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-line bg-surface-2 text-muted transition hover:border-brand"
          data-testid="photo-picker"
        >
          {photo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute inset-x-3 bottom-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-black/55 py-1.5 text-xs font-semibold text-white backdrop-blur">
                <Camera size={14} /> {t('stock.changePhoto')}
              </span>
            </>
          ) : (
            <>
              <ImagePlus size={32} />
              <span className="mt-2 text-sm font-semibold">{t('stock.addPhoto')}</span>
            </>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pick(e.target.files?.[0])} data-testid="photo-input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('common.name')} error={errors.name} className="sm:col-span-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Riz parfumé 25 kg" data-testid="product-name" />
        </Field>
        <Field label={t('stock.category')}>
          <Select value={category} onChange={(e) => setCategory(e.target.value)} data-testid="product-category">
            {cats.map((c) => (
              <option key={c} value={c}>
                {tx('cat', c)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('stock.unit')}>
          <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('stock.buyPrice')} error={errors.buy}>
          <Input inputMode="decimal" value={buy} onChange={(e) => setBuy(e.target.value)} suffix={m.cur === 'CDF' ? 'FC' : '$'} placeholder="0" data-testid="product-buy" />
        </Field>
        <Field
          label={t('stock.sellPrice')}
          error={errors.sell}
          hint={margin !== null ? `${t('stock.margin')} : ${m.fmt(margin)}${b > 0 ? ` (${Math.round((margin / b) * 100)} %)` : ''}` : undefined}
        >
          <Input inputMode="decimal" value={sell} onChange={(e) => setSell(e.target.value)} suffix={m.cur === 'CDF' ? 'FC' : '$'} placeholder="0" data-testid="product-sell" />
        </Field>
        {!product && (
          <Field label={t('stock.initialQty')} error={errors.qty}>
            <Input inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" data-testid="product-qty" />
          </Field>
        )}
        <Field label={t('stock.lowThreshold')}>
          <Input inputMode="decimal" value={low} onChange={(e) => setLow(e.target.value)} data-testid="product-low" />
        </Field>
        <Field label={`${t('stock.barcode')} (${t('common.optional')})`} className={product ? '' : 'sm:col-span-2'}>
          <Input inputMode="numeric" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="6001234567890" />
        </Field>
        <div className="flex gap-3 pt-2 sm:col-span-2">
          <Button size="lg" onClick={save} loading={busy} data-testid="save-product" className="flex-1 sm:flex-none sm:min-w-[200px]">
            {t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProductNew() {
  const { t } = useI18n();
  const { isOwner } = useApp();
  const { navigate } = useRouter();
  if (!isOwner) return <p className="rounded-2xl bg-info-soft p-4 text-info">{t('stock.readOnly')}</p>;
  return (
    <div>
      <PageHeader title={t('stock.add')} back="/app/stock" />
      <Card className="p-5 sm:p-6">
        <ProductFormBody onSaved={(p) => navigate(p ? `/app/stock/${p.id}` : '/app/stock', { replace: true })} />
      </Card>
    </div>
  );
}
