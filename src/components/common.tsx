'use client';
import clsx from 'clsx';
import { ChevronLeft, Package } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useApp } from '@/app-shell/AppContext';
import { useRouter } from '@/app-shell/router';
import { useI18n } from '@/i18n';
import { convert, formatMoney, otherCurrency } from '@/lib/money';
import type { Currency, SaleMethod } from '@/lib/types';

export function useMoney() {
  const { shop } = useApp();
  const cur: Currency = shop?.currency ?? 'CDF';
  const rate = shop?.exchange_rate ?? 2800;
  const alt = otherCurrency(cur);
  return {
    cur,
    alt,
    rate,
    fmt: (v: number, o?: { sign?: boolean }) => formatMoney(v, cur, o),
    fmtAlt: (v: number) => formatMoney(convert(v, cur, alt, rate), alt),
    toAlt: (v: number) => convert(v, cur, alt, rate),
  };
}

export function Money({
  value,
  className,
  altClassName,
  showAlt = true,
  inline = false,
  sign,
  testId,
}: {
  value: number;
  className?: string;
  altClassName?: string;
  showAlt?: boolean;
  inline?: boolean;
  sign?: boolean;
  testId?: string;
}) {
  const m = useMoney();
  return (
    <span className={clsx(inline ? 'inline-flex items-baseline gap-1.5' : 'inline-flex flex-col', 'tabular')}>
      <span className={clsx('font-bold', className)} data-testid={testId}>
        {m.fmt(value, { sign })}
      </span>
      {showAlt && <span className={clsx('text-[12px] font-medium text-muted', altClassName)}>≈ {m.fmtAlt(value)}</span>}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  back,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: string;
  actions?: ReactNode;
  className?: string;
}) {
  const r = useRouter();
  const { t } = useI18n();
  return (
    <div className={clsx('mb-5 flex items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-start gap-2">
        {back && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => r.back(back)}
            aria-label={t('common.back')}
            className="-ml-2 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-surface-2"
          >
            <ChevronLeft size={24} />
          </motion.button>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-[26px] font-extrabold leading-tight tracking-tight sm:text-[30px]">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  image,
  icon,
  title,
  hint,
  action,
  className,
}: {
  image?: string;
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('flex flex-col items-center px-6 py-10 text-center', className)}>
      {image ? (
        <div className="relative mb-5 h-36 w-36 overflow-hidden rounded-[36px] shadow-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        </div>
      ) : (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-soft text-brand">{icon}</div>
      )}
      <p className="text-lg font-bold">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ProductThumb({ src, name, size = 56, className }: { src: string | null; name: string; size?: number; className?: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div
      className={clsx('relative shrink-0 overflow-hidden rounded-2xl bg-surface-2', className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-soft to-gold-soft font-bold text-brand">
          {initials || <Package size={18} />}
        </div>
      )}
    </div>
  );
}

export const METHOD_STYLE: Record<SaleMethod, { color: string; short: string }> = {
  cash: { color: '#23804e', short: 'FC' },
  mpesa: { color: '#e60000', short: 'M' },
  orange: { color: '#ff7900', short: 'OM' },
  airtel: { color: '#b3122e', short: 'AM' },
  afrimoney: { color: '#6d3fa0', short: 'AF' },
  credit: { color: '#b07a12', short: 'CR' },
};

export function MethodIcon({ method, size = 36 }: { method: SaleMethod; size?: number }) {
  const s = METHOD_STYLE[method];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold text-white"
      style={{ background: s.color, width: size, height: size }}
      aria-hidden
    >
      {s.short}
    </span>
  );
}

export function MethodBadge({ method }: { method: SaleMethod }) {
  const { t } = useI18n();
  const s = METHOD_STYLE[method];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold"
      style={{ background: `color-mix(in srgb, ${s.color} 14%, transparent)`, color: s.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
      {t(`pay.${method}`)}
    </span>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-[15px] font-bold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = 'brand',
  testId,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: 'brand' | 'ok' | 'gold' | 'info' | 'danger';
  testId?: string;
}) {
  const tones = {
    brand: 'bg-brand-soft text-brand',
    ok: 'bg-ok-soft text-ok',
    gold: 'bg-gold-soft text-gold',
    info: 'bg-info-soft text-info',
    danger: 'bg-danger-soft text-danger',
  };
  return (
    <div className="card flex flex-col gap-2 p-4" data-testid={testId}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-muted">{label}</span>
        {icon && <span className={clsx('flex h-8 w-8 items-center justify-center rounded-xl', tones[tone])}>{icon}</span>}
      </div>
      <div className="text-[22px] font-extrabold leading-none tracking-tight tabular">{value}</div>
      {sub && <div className="text-[12px] font-medium text-muted">{sub}</div>}
    </div>
  );
}
