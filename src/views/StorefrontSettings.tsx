'use client';
import clsx from 'clsx';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Copy, Eye, EyeOff, ExternalLink, Link2, QrCode, Share2, Store } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useActor, useApp } from '@/app-shell/AppContext';
import { useProducts } from '@/app-shell/data';
import { ProductArt } from '@/components/storefront/ProductArt';
import { PageHeader, SectionTitle } from '@/components/common';
import { Button, Field, Input, Textarea, useToast } from '@/components/ui';
import { useI18n } from '@/i18n';
import { updateProduct, updateShop } from '@/lib/actions';
import { isValidStorefrontSlug, normalizeStorefrontSlug } from '@/lib/storefront';
import {
  DEFAULT_STOREFRONT_THEME,
  isStorefrontThemeId,
  resolveStorefrontTheme,
  storefrontThemeList,
  type StorefrontThemeId,
} from '@/lib/storefront-themes';
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
  const reduce = useReducedMotion();

  const [enabled, setEnabled] = useState(!!shop?.storefront_enabled);
  const [slug, setSlug] = useState(shop?.storefront_slug ?? normalizeStorefrontSlug(shop?.name ?? 'boutique'));
  const [whatsapp, setWhatsapp] = useState(shop?.storefront_whatsapp || shop?.phone || '');
  const [description, setDescription] = useState(shop?.storefront_description ?? '');
  const [theme, setTheme] = useState<StorefrontThemeId>(resolveStorefrontTheme(shop?.storefront_theme));
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const themes = storefrontThemeList();

  const publicUrl = useMemo(() => {
    const s = normalizeStorefrontSlug(slug);
    return s ? `${siteOrigin()}/b/${s}` : '';
  }, [slug]);

  const previewUrl = (id: StorefrontThemeId) => {
    const s = normalizeStorefrontSlug(slug);
    if (!s) return `/b/demo?theme=${id}`;
    return `/b/${s}?theme=${id}`;
  };

  const qrSrc = publicUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&color=1c120c&bgcolor=fffaf3&data=${encodeURIComponent(publicUrl)}`
    : '';

  if (!isOwner) {
    return (
      <div>
        <PageHeader title={t('sf.title')} back="/app" />
        <p className="border border-line bg-info-soft px-4 py-3 text-sm text-info">{t('sf.ownerOnly')}</p>
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
    const themeSafe = isStorefrontThemeId(theme) ? theme : DEFAULT_STOREFRONT_THEME;
    setBusy(true);
    try {
      await updateShop(actor, {
        storefront_enabled: enabled,
        storefront_slug: enabled ? normalized : shop?.storefront_slug ?? normalized,
        storefront_whatsapp: whatsapp.trim() ? formatDrcPhone(whatsapp) || whatsapp.trim() : null,
        storefront_description: description.trim().slice(0, 280) || null,
        storefront_theme: themeSafe,
      });
      setSlug(normalized);
      setTheme(themeSafe);
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

  const enter = reduce ? undefined : { opacity: 0, y: 12 };

  return (
    <div className="space-y-6">
      <PageHeader title={t('sf.title')} subtitle={t('sf.subtitle')} back="/app" />

      <motion.section
        initial={enter}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden border border-line bg-gradient-to-br from-[#d8622b] via-[#b8491a] to-[#7e2d10] text-white"
      >
        <div className="kente pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative flex items-start gap-4 p-5 sm:p-7">
          <span className="flex h-14 w-14 items-center justify-center border border-white/25 bg-white/10">
            <Store size={24} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">{t('sf.heroLabel')}</p>
            <p className="mt-1 font-[family-name:var(--font-fraunces)] text-2xl font-bold leading-tight sm:text-3xl">{shop?.name}</p>
            <p className="mt-2 text-sm text-white/80">{enabled ? t('sf.statusOn') : t('sf.statusOff')}</p>
          </div>
        </div>
      </motion.section>

      <section className="space-y-5 border border-line bg-surface p-5">
        <label className="flex cursor-pointer items-center justify-between gap-3 border border-line px-4 py-3">
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

        <div data-testid="sf-theme-picker">
          <p className="mb-1 text-sm font-semibold text-ink">{t('sf.theme')}</p>
          <p className="mb-4 text-xs text-muted">{t('sf.themeHint')}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {themes.map((th) => {
              const selected = theme === th.id;
              return (
                <div
                  key={th.id}
                  className={clsx(
                    'overflow-hidden border transition-colors',
                    selected ? 'border-[#c2531f] ring-2 ring-[#c2531f]/25' : 'border-line',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setTheme(th.id)}
                    className="w-full text-left"
                    data-testid={`sf-theme-${th.id}`}
                    aria-pressed={selected}
                  >
                    <div
                      className="relative h-24"
                      style={{
                        background:
                          th.id === 'cinema'
                            ? 'linear-gradient(135deg,#faf8f4 0%,#efe6da 40%,#c2531f 100%)'
                            : th.id === 'marche'
                              ? 'linear-gradient(135deg,#fff8ec 0%,#f4a261 45%,#e85d04 100%)'
                              : 'linear-gradient(135deg,#f7f6f4 0%,#e8e6e2 50%,#111 100%)',
                      }}
                    >
                      <span
                        className={clsx(
                          'absolute bottom-2 left-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                          th.id === 'atelier' ? 'bg-white text-[#111]' : 'bg-black/70 text-white',
                        )}
                      >
                        {th.name}
                      </span>
                      {selected && (
                        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#c2531f] text-white">
                          <Check size={14} />
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 p-3">
                      <p className="text-sm font-bold">{th.name}</p>
                      <p className="text-[11px] leading-snug text-muted">{th.tagline}</p>
                      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#8a7360]">{th.vibe}</p>
                    </div>
                  </button>
                  <a
                    href={previewUrl(th.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 border-t border-line px-3 py-2.5 text-[12px] font-semibold text-brand"
                    data-testid={`sf-theme-preview-${th.id}`}
                  >
                    <ExternalLink size={13} /> {t('sf.themePreview')}
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        <Button onClick={save} loading={busy} className="w-full" data-testid="sf-save">
          {t('common.save')}
        </Button>
      </section>

      <section className="overflow-hidden border border-[#e5d8c8] bg-[#fffaf3]">
        <div className="border-b border-[#e5d8c8] bg-[radial-gradient(ellipse_at_top_left,rgb(194_83_31/0.08),transparent_55%)] px-5 py-6 sm:px-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7360]">{t('sf.link')}</p>
          <h2 className="mt-2 max-w-md font-[family-name:var(--font-fraunces)] text-[clamp(1.6rem,5vw,2.15rem)] font-bold leading-[1.05] tracking-tight text-[#1c120c]">
            {t('sf.qrHint')}
          </h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2 border border-[#e5d8c8] bg-white px-3 py-3">
              <Link2 size={16} className="shrink-0 text-[#8a7360]" />
              <a href={publicUrl || '#'} className="truncate text-sm font-semibold text-[#c2531f]" data-testid="sf-url">
                {publicUrl || '—'}
              </a>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={copyLink} className="flex-1 sm:flex-none" data-testid="sf-copy">
                {copied ? <Check size={16} /> : <Copy size={16} />} {t('sf.copy')}
              </Button>
              <Button onClick={share} className="flex-1 sm:flex-none" data-testid="sf-share">
                <Share2 size={16} /> {t('sf.share')}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[240px_1fr] md:items-stretch">
          <div className="flex flex-col items-center justify-center gap-3 border-b border-[#e5d8c8] bg-[#f6efe6] p-6 md:border-b-0 md:border-r">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7360]">
              <QrCode size={14} /> {t('sf.qr')}
            </div>
            {qrSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrSrc} alt={t('sf.qr')} width={200} height={200} className="border border-[#eadfce] bg-white p-3" data-testid="sf-qr" />
            ) : (
              <div className="flex h-[200px] w-[200px] items-center justify-center border border-dashed border-line text-xs text-muted">QR</div>
            )}
          </div>
          <div className="flex flex-col justify-center gap-3 p-6 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7360]">Au comptoir</p>
            <p className="font-[family-name:var(--font-fraunces)] text-xl font-bold leading-snug text-ink sm:text-2xl">
              Imprimez le QR ou montrez-le sur votre téléphone.
            </p>
            <p className="text-sm text-muted">Le client ouvre le catalogue, ajoute des articles, et vous envoie la commande sur WhatsApp.</p>
            {enabled && isValidStorefrontSlug(normalizeStorefrontSlug(slug)) && (
              <a
                href={`/b/${normalizeStorefrontSlug(slug)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex text-sm font-bold text-brand"
              >
                {t('sf.openPreview')} →
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="border border-line bg-surface p-5">
        <SectionTitle>{t('sf.products')}</SectionTitle>
        <p className="mb-4 text-sm text-muted">{t('sf.productsHint')}</p>
        <ul className="divide-y divide-line" data-testid="sf-products">
          <AnimatePresence initial={false}>
            {(products ?? []).map((p) => {
              const hidden = !!p.storefront_hidden;
              return (
                <motion.li layout key={p.id} className="flex items-center gap-3 py-3">
                  <ProductArt src={p.photo} name={p.name} category={p.category} className="h-12 w-12 shrink-0" rounded="rounded-xl" />
                  <span className="min-w-0 flex-1">
                    <span className={clsx('block truncate text-sm font-semibold', hidden && 'text-muted')}>{p.name}</span>
                    <span className="text-xs text-muted">{hidden ? t('sf.hidden') : t('sf.visible')}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleHidden(p.id, !hidden)}
                    className="inline-flex h-10 items-center gap-1.5 border border-line px-3 text-xs font-semibold"
                    data-testid={`sf-hide-${p.id}`}
                  >
                    {hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                    {hidden ? t('sf.show') : t('sf.hide')}
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </section>

      <p className="text-center text-xs text-muted">
        <a href="/b/demo" className="font-semibold text-brand" target="_blank" rel="noopener noreferrer">
          {t('sf.seeDemo')}
        </a>
      </p>
    </div>
  );
}
