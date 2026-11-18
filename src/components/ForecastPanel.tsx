'use client';
import { useEffect, useMemo, useState } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';
import { useProducts, useSaleItems, useSales } from '@/app-shell/data';
import { SectionTitle, StatCard, useMoney } from '@/components/common';
import { Card } from '@/components/ui';
import { useI18n } from '@/i18n';
import { computeForecast, type ForecastResult } from '@/lib/forecasts';

export function ForecastPanel({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const m = useMoney();
  const sales = useSales();
  const items = useSaleItems();
  const products = useProducts();
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

  if (!forecast) return <div className="skeleton h-40 rounded-3xl" />;

  if (compact) {
    return (
      <Card className="p-5" data-testid="forecast-glance">
        <SectionTitle>
          <span className="inline-flex items-center gap-2">
            <TrendingUp size={16} className="text-brand" /> {t('dash.forecast')}
          </span>
        </SectionTitle>
        <p className="text-2xl font-extrabold tabular text-ink">{m.fmt(forecast.expectedRevenue7d)}</p>
        <p className="mt-1 text-xs font-medium text-muted">{t('dash.forecast7')} · {t('dash.forecastHint')}</p>
        {forecast.topProducts[0] && (
          <p className="mt-3 text-sm text-muted">
            {t('rep.forecastTop')} : <span className="font-semibold text-ink">{forecast.topProducts[0].name}</span>
          </p>
        )}
      </Card>
    );
  }

  const reorder = forecast.products.filter((p) => p.isLow || (p.daysOfStock !== null && p.daysOfStock <= 14)).slice(0, 8);

  return (
    <div className="space-y-4" data-testid="forecast-panel">
      <div>
        <h2 className="text-lg font-bold">{t('rep.forecast')}</h2>
        <p className="mt-1 text-sm text-muted">{t('rep.forecastIntro')}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label={t('rep.forecast7')} value={m.fmt(forecast.expectedRevenue7d)} sub={`≈ ${m.fmtAlt(forecast.expectedRevenue7d)}`} icon={<TrendingUp size={17} />} tone="ok" />
        <StatCard label={t('rep.forecast30')} value={m.fmt(forecast.expectedRevenue30d)} sub={`≈ ${m.fmtAlt(forecast.expectedRevenue30d)}`} icon={<TrendingUp size={17} />} tone="info" />
      </div>

      <Card className="p-5">
        <SectionTitle>{t('rep.forecastTop')}</SectionTitle>
        {forecast.topProducts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{t('rep.forecastEmpty')}</p>
        ) : (
          <ol className="space-y-3">
            {forecast.topProducts.map((p, i) => (
              <li key={p.product_id ?? p.name} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-semibold">
                  <span className="mr-2 text-muted">{i + 1}.</span>
                  {p.name}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  ~{p.expectedQty7d} / 7j · <b className="text-ink tabular">{m.fmt(p.expectedRevenue7d)}</b>
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle>{t('rep.forecastReorder')}</SectionTitle>
        {reorder.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{t('dash.reorderEmpty')}</p>
        ) : (
          <ul className="divide-y divide-line">
            {reorder.map((p) => (
              <li key={p.product_id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                <span className="text-xs text-muted">
                  {p.stockOutDate ? `${t('rep.forecastStockOut')} ${p.stockOutDate}` : p.daysOfStock != null ? `~${p.daysOfStock} j` : '—'}
                </span>
                <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand tabular">
                  +{p.suggestedReorderQty} {p.unit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle>
          <span className="inline-flex items-center gap-2">
            <Sparkles size={16} className="text-gold" /> {t('rep.forecastAdvice')}
          </span>
        </SectionTitle>
        {loadingAdvice && !advice ? (
          <p className="text-sm text-muted">{t('rep.forecastAdviceLoading')}</p>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-ink">{advice ?? t('rep.forecastEmpty')}</p>
            {adviceSource && (
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                {adviceSource === 'openai' ? t('rep.forecastSourceAi') : t('rep.forecastSourceDet')}
              </p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
