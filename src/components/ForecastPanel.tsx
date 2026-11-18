'use client';
import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Sparkles, TrendingUp } from 'lucide-react';
import { AppLink } from '@/app-shell/router';
import { useProducts, useSaleItems, useSales } from '@/app-shell/data';
import { ProductArt } from '@/components/storefront/ProductArt';
import { useMoney } from '@/components/common';
import { useI18n } from '@/i18n';
import { computeForecast, type ForecastResult } from '@/lib/forecasts';

export function ForecastPanel({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const m = useMoney();
  const sales = useSales();
  const items = useSaleItems();
  const products = useProducts();
  const reduce = useReducedMotion();
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceSource, setAdviceSource] = useState<'deterministic' | 'openai' | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const forecast = useMemo<ForecastResult | null>(() => {
    if (!sales || !items || !products) return null;
    return computeForecast({ sales, items, products });
  }, [sales, items, products]);

  useEffect(() => {
    if (!forecast || compact) return;
    let cancelled = false;
    const run = async () => {
      setLoadingAdvice(true);
      try {
        const r = await fetch('/api/forecasts/advice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ forecast, currencyLabel: m.cur === 'USD' ? '$' : 'FC' }),
        });
        if (!r.ok) throw new Error('advice');
        const j = (await r.json()) as { advice: string; source: 'deterministic' | 'openai' };
        if (cancelled) return;
        setAdvice(j.advice);
        setAdviceSource(j.source);
      } catch {
        if (!cancelled) {
          setAdvice(null);
          setAdviceSource(null);
        }
      } finally {
        if (!cancelled) setLoadingAdvice(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [forecast, compact, m.cur]);

  if (!forecast) return <div className="skeleton h-40 border border-line" />;

  if (compact) {
    return (
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-line bg-surface p-5"
        data-testid="forecast-glance"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t('dash.forecast')}</p>
            <p className="mt-2 font-[family-name:var(--font-fraunces)] text-[clamp(2rem,8vw,2.75rem)] font-bold leading-none tabular text-ink">
              {m.fmt(forecast.expectedRevenue7d)}
            </p>
            <p className="mt-2 text-xs font-medium text-muted">{t('dash.forecast7')} · {t('dash.forecastHint')}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center border border-brand/20 bg-brand-soft text-brand">
            <TrendingUp size={18} />
          </span>
        </div>
        {forecast.topProducts[0] && (
          <p className="mt-4 border-t border-line pt-3 text-sm text-muted">
            {t('rep.forecastTop')} : <span className="font-semibold text-ink">{forecast.topProducts[0].name}</span>
          </p>
        )}
        <AppLink href="/app/rapports" className="mt-3 inline-flex text-sm font-bold text-brand">
          {t('nav.reports')} →
        </AppLink>
      </motion.section>
    );
  }

  const reorder = forecast.products.filter((p) => p.isLow || (p.daysOfStock !== null && p.daysOfStock <= 14)).slice(0, 8);
  const prodMap = new Map((products ?? []).map((p) => [p.id, p]));

  return (
    <div className="space-y-4" data-testid="forecast-panel">
      <div>
        <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-bold tracking-tight">{t('rep.forecast')}</h2>
        <p className="mt-1 text-sm text-muted">{t('rep.forecastIntro')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border border-line bg-surface p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t('rep.forecast7')}</p>
          <p className="mt-2 font-[family-name:var(--font-fraunces)] text-[clamp(1.6rem,5vw,2.35rem)] font-bold leading-none tabular text-ink">
            {m.fmt(forecast.expectedRevenue7d)}
          </p>
          <p className="mt-2 text-xs text-muted">≈ {m.fmtAlt(forecast.expectedRevenue7d)}</p>
        </div>
        <div className="border border-line bg-surface p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t('rep.forecast30')}</p>
          <p className="mt-2 font-[family-name:var(--font-fraunces)] text-[clamp(1.6rem,5vw,2.35rem)] font-bold leading-none tabular text-brand">
            {m.fmt(forecast.expectedRevenue30d)}
          </p>
          <p className="mt-2 text-xs text-muted">≈ {m.fmtAlt(forecast.expectedRevenue30d)}</p>
        </div>
      </div>

      <section className="border border-line bg-surface p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t('rep.forecastTop')}</p>
        {forecast.topProducts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{t('rep.forecastEmpty')}</p>
        ) : (
          <ol className="mt-4 space-y-4">
            {forecast.topProducts.map((p, i) => {
              const full = p.product_id ? prodMap.get(p.product_id) : undefined;
              return (
                <li key={p.product_id ?? p.name} className="flex items-center gap-3">
                  <span className="w-5 text-sm font-bold text-muted">{i + 1}</span>
                  <ProductArt
                    src={full?.photo ?? null}
                    name={p.name}
                    category={full?.category}
                    className="h-12 w-12 shrink-0"
                    rounded="rounded-xl"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
                  <span className="text-right">
                    <span className="block font-[family-name:var(--font-fraunces)] text-lg font-bold tabular leading-none">{m.fmt(p.expectedRevenue7d)}</span>
                    <span className="text-[11px] text-muted">~{p.expectedQty7d} / 7j</span>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="border border-line bg-surface p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t('rep.forecastReorder')}</p>
        {reorder.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{t('dash.reorderEmpty')}</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {reorder.map((p) => {
              const full = prodMap.get(p.product_id);
              return (
                <li key={p.product_id} className="flex items-center gap-3 py-3">
                  <ProductArt src={full?.photo ?? null} name={p.name} category={full?.category} className="h-11 w-11 shrink-0" rounded="rounded-xl" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{p.name}</span>
                    <span className="text-xs text-muted">
                      {p.stockOutDate ? `${t('rep.forecastStockOut')} ${p.stockOutDate}` : p.daysOfStock != null ? `~${p.daysOfStock} j` : '—'}
                    </span>
                  </span>
                  <span className="border border-brand/25 bg-brand-soft px-2.5 py-1 text-xs font-bold tabular text-brand">
                    +{p.suggestedReorderQty} {p.unit}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="border border-line bg-surface p-5">
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          <Sparkles size={14} className="text-gold" /> {t('rep.forecastAdvice')}
        </p>
        {loadingAdvice && !advice ? (
          <p className="mt-3 text-sm text-muted">{t('rep.forecastAdviceLoading')}</p>
        ) : (
          <>
            <p className="mt-3 text-[15px] leading-relaxed text-ink">{advice ?? t('rep.forecastEmpty')}</p>
            {adviceSource && (
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                {adviceSource === 'openai' ? t('rep.forecastSourceAi') : t('rep.forecastSourceDet')}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
