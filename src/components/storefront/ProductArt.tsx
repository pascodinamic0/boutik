'use client';
import clsx from 'clsx';
import { categoryArt, productInitials } from '@/lib/product-art';

export function ProductArt({
  src,
  name,
  category,
  className,
  rounded = 'rounded-[1.35rem]',
}: {
  src: string | null;
  name: string;
  category?: string;
  className?: string;
  rounded?: string;
}) {
  const art = categoryArt(category || 'Divers');
  const initials = productInitials(name);
  return (
    <div className={clsx('relative overflow-hidden bg-[#efe6da]', rounded, className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-1"
          style={{ background: `linear-gradient(145deg, ${art.from} 0%, ${art.to} 100%)` }}
          aria-hidden
        >
          <span className="font-[family-name:var(--font-fraunces)] text-[clamp(1.75rem,8vw,3rem)] font-bold tracking-tight" style={{ color: art.ink }}>
            {initials}
          </span>
          {category && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-80" style={{ color: art.ink }}>
              {category}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
