'use client';
import clsx from 'clsx';
import { Check, Copy, Eye, EyeOff, Link2, QrCode, Share2, Store } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useActor, useApp } from '@/app-shell/AppContext';
import { useProducts } from '@/app-shell/data';
import { PageHeader, ProductThumb, SectionTitle } from '@/components/common';
import { Button, Card, Field, Input, Textarea, useToast } from '@/components/ui';
import { useI18n } from '@/i18n';
import { updateProduct, updateShop } from '@/lib/actions';
import { isValidStorefrontSlug, normalizeStorefrontSlug } from '@/lib/storefront';
import { formatDrcPhone, normalizeDrcPhone, waLink } from '@/lib/phone';

function siteOrigin() {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://boutik.vercel.app';
}

export function StorefrontSettings() {
  const { t } = useI18n();
  const { shop, isOwner } = useApp();
  const actor = useActor();
  const toast = useToast();
  const products = useProducts();

  const [enabled, setEnabled] = useState(!!shop?.storefront_enabled);
  const [slug, setSlug] = useState(shop?.storefront_slug ?? normalizeStorefrontSlug(shop?.name ?? 'boutique'));
  const [whatsapp, setWhatsapp] = useState(shop?.storefront_whatsapp || shop?.phone || '');
  const [description, setDescription] = useState(shop?.storefront_description ?? '');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = useMemo(() => {
    const s = normalizeStorefrontSlug(slug);
    return s ? `${siteOrigin()}/b/${s}` : '';
  }, [slug]);

  const qrSrc = publicUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(publicUrl)}`
    : '';

  if (!isOwner) {
    return (
      <div>
        <PageHeader title={t('sf.title')} back="/app" />
        <p className="rounded-2xl bg-info-soft px-4 py-3 text-sm text-info">{t('sf.ownerOnly')}</p>
      </div>
    );
  }

  const save = async () => {
    const normalized = normalizeStorefrontSlug(slug);
    if (enabled && !isValidStorefrontSlug(normalized)) {
      toast(t('sf.slugInvalid'), 'danger');
      return;
    }
    if (enabled && whatsapp.trim() && !normalizeDrcPhone(whatsapp)) {
      toast(t('sf.whatsappInvalid'), 'danger');
      return;
    }
    setBusy(true);
    try {
      await updateShop(actor, {
        storefront_enabled: enabled,
        storefront_slug: enabled ? normalized : shop?.storefront_slug ?? normalized,
        storefront_whatsapp: whatsapp.trim() ? formatDrcPhone(whatsapp) || whatsapp.trim() : null,
        storefront_description: description.trim().slice(0, 280) || null,
      });
      setSlug(normalized);
      toast(t('common.saved'));
    } catch (e) {
      console.error(e);
      toast(t('common.error'), 'danger');
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast(t('sf.copied'));
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast(t('common.error'), 'danger');
    }
  };

  const share = async () => {
    const title = shop?.name ?? 'Boutik';
    const text = t('sf.shareText', { name: title });
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: publicUrl });
        return;
      }
    } catch {
      /* fall through */
    }
    window.open(waLink(`${text}\n${publicUrl}`, null), '_blank', 'noopener,noreferrer');
  };

  const toggleHidden = async (id: string, hidden: boolean) => {
    try {
      await updateProduct(actor, id, { storefront_hidden: hidden });
    } catch {
      toast(t('common.error'), 'danger');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('sf.title')} subtitle={t('sf.subtitle')} back="/app" />

      <Card className="overflow-hidden p-0">
        <div className="relative bg-gradient-to-br from-[#d8622b] via-[#b8491a] to-[#7e2d10] p-5 text-white">
          <div className="kente pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative flex items-start gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <Store size={22} />
            </span>
            <div>
              <p className="text-sm font-medium text-white/80">{t('sf.heroLabel')}</p>
              <p className="mt-1 text-lg font-bold leading-snug">{shop?.name}</p>
              <p className="mt-1 text-sm text-white/75">{enabled ? t('sf.statusOn') : t('sf.statusOff')}</p>
            </div>
          </div>
        </div>
        <div className="space-y-5 p-5">
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3">
            <span>
              <span className="block text-sm font-semibold">{t('sf.enable')}</span>
              <span className="text-xs text-muted">{t('sf.enableHint')}</span>
            </span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-5 w-5 accent-[var(--brand)]"
              data-testid="sf-enabled"
            />
          </label>

          <Field label={t('sf.slug')}>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-sm text-muted">/b/</span>
              <Input
                value={slug}
                onChange={(e) => setSlug(normalizeStorefrontSlug(e.target.value) || e.target.value.toLowerCase())}
                placeholder="ma-boutique"
                data-testid="sf-slug"
              />
            </div>
          </Field>

          <Field label={t('sf.whatsapp')}>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+243 81 234 5678" data-testid="sf-whatsapp" />
          </Field>

          <Field label={t('sf.description')}>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 280))}
              rows={3}
              placeholder={t('sf.descriptionPh')}
              data-testid="sf-description"
            />
            <p className="mt-1 text-right text-[11px] text-muted">{description.length}/280</p>
          </Field>

          <Button onClick={save} loading={busy} className="w-full" data-testid="sf-save">
            {t('common.save')}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle>{t('sf.link')}</SectionTitle>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-line bg-surface-2 px-3 py-2.5">
            <Link2 size={16} className="shrink-0 text-muted" />
            <a href={publicUrl || '#'} className="truncate text-sm font-semibold text-brand" data-testid="sf-url">
              {publicUrl || '—'}
            </a>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={copyLink} className="flex-1 sm:flex-none" data-testid="sf-copy">
              {copied ? <Check size={16} /> : <Copy size={16} />} {t('sf.copy')}
            </Button>
            <Button variant="secondary" onClick={share} className="flex-1 sm:flex-none" data-testid="sf-share">
              <Share2 size={16} /> {t('sf.share')}
            </Button>
          </div>
        </div>
        <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-surface-2/60 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted">
            <QrCode size={16} /> {t('sf.qr')}
          </div>
          {qrSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrSrc} alt={t('sf.qr')} width={180} height={180} className="rounded-xl bg-white p-2 shadow-sm" data-testid="sf-qr" />
          ) : (
            <div className="flex h-[180px] w-[180px] items-center justify-center rounded-xl bg-white text-xs text-muted">QR</div>
          )}
          <p className="text-center text-xs text-muted">{t('sf.qrHint')}</p>
        </div>
        {enabled && isValidStorefrontSlug(normalizeStorefrontSlug(slug)) && (
          <a
            href={`/b/${normalizeStorefrontSlug(slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex text-sm font-semibold text-brand"
          >
            {t('sf.openPreview')} →
          </a>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle>{t('sf.products')}</SectionTitle>
        <p className="mb-3 text-sm text-muted">{t('sf.productsHint')}</p>
        <ul className="divide-y divide-line" data-testid="sf-products">
          {(products ?? []).map((p) => {
            const hidden = !!p.storefront_hidden;
            return (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <ProductThumb src={p.photo} name={p.name} size={42} />
                <span className="min-w-0 flex-1">
                  <span className={clsx('block truncate text-sm font-semibold', hidden && 'text-muted')}>{p.name}</span>
                  <span className="text-xs text-muted">{hidden ? t('sf.hidden') : t('sf.visible')}</span>
                </span>
                <button
                  type="button"
                  onClick={() => toggleHidden(p.id, !hidden)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line px-3 text-xs font-semibold"
                  data-testid={`sf-hide-${p.id}`}
                >
                  {hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                  {hidden ? t('sf.show') : t('sf.hide')}
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <p className="text-center text-xs text-muted">
        <a href="/b/demo" className="font-semibold text-brand" target="_blank" rel="noopener noreferrer">
          {t('sf.seeDemo')}
        </a>
      </p>
    </div>
  );
}
