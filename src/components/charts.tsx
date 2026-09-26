'use client';
import { motion } from 'motion/react';
import { useState } from 'react';
import { formatCompact } from '@/lib/money';
import { fmtWeekday, fmtDate } from '@/lib/dates';
import type { Currency } from '@/lib/types';

export function BarChart({
  series,
  currency,
  height = 180,
  labels,
}: {
  series: { day: string; revenue: number; profit: number }[];
  currency: Currency;
  height?: number;
  labels: { revenue: string; profit: string };
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...series.map((s) => s.revenue));
  const dense = series.length > 14;
  const sel = hover ?? series.length - 1;
  const cur = series[sel];
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-muted">{cur ? fmtDate(cur.day) : ''}</p>
          <p className="text-lg font-extrabold tabular">{cur ? formatCompact(cur.revenue, currency) : '—'}</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[4px] bg-brand" /> {labels.revenue}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[4px] bg-gold" /> {labels.profit}
          </span>
        </div>
      </div>
      <div className="relative flex items-end gap-[3px] sm:gap-1.5" style={{ height }} onMouseLeave={() => setHover(null)}>
        {[0.25, 0.5, 0.75].map((g) => (
          <div key={g} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: `${g * 100}%` }} />
        ))}
        {series.map((s, i) => {
          const h = (s.revenue / max) * 100;
          const hp = (Math.max(0, s.profit) / max) * 100;
          return (
            <button
              key={s.day}
              type="button"
              className="group relative flex h-full flex-1 items-end justify-center"
              onMouseEnter={() => setHover(i)}
              onClick={() => setHover(i)}
              aria-label={`${fmtDate(s.day)} ${formatCompact(s.revenue, currency)}`}
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(h, s.revenue > 0 ? 2 : 0.5)}%` }}
                transition={{ duration: 0.6, delay: i * 0.015, ease: [0.22, 1, 0.36, 1] }}
                className={`relative w-full max-w-[34px] overflow-hidden rounded-t-[8px] ${sel === i ? 'bg-brand' : 'bg-brand/35 group-hover:bg-brand/60'}`}
              >
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: h > 0 ? `${(hp / h) * 100}%` : 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.015 }}
                  className={`absolute inset-x-0 bottom-0 ${sel === i ? 'bg-gold' : 'bg-gold/50'}`}
                />
              </motion.div>
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-[3px] sm:gap-1.5">
        {series.map((s, i) => (
          <span key={s.day} className={`flex-1 text-center text-[10.5px] font-semibold capitalize ${sel === i ? 'text-ink' : 'text-muted'}`}>
            {dense ? (i % 5 === 0 || i === series.length - 1 ? s.day.slice(8) : '') : fmtWeekday(s.day)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Donut({
  data,
  size = 150,
  center,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  center?: React.ReactNode;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 42;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="-rotate-90" width={size} height={size}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="12" />
        {data.map((d) => {
          const len = (d.value / total) * c;
          const el = (
            <motion.circle
              key={d.label}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth="12"
              strokeDasharray={`${len} ${c - len}`}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: -acc }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          );
          acc += len;
          return el;
        })}
      </svg>
      {center && <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{center}</div>}
    </div>
  );
}

export function HBar({ value, max, color = 'var(--brand)' }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${max > 0 ? Math.max(2, (value / max) * 100) : 0}%` }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
