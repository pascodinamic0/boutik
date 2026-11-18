'use client';
import clsx from 'clsx';
import { useState } from 'react';
import { categoryArt, productInitials } from '@/lib/product-art';

export function ProductArt({
  src,
  name,
  category,
  className,
  rounded = 'rounded-[1.35rem]',
  /** Eager-load for hero/LCP — never rely on IntersectionObserver (breaks inside CSS 3D). */
  priority = false,
}: {
  src: string | null;
  name: string;
  category?: string;
  className?: string;
  rounded?: string;
  priority?: boolean;
}) {
  const art = categoryArt(category || 'Divers');
  const initials = productInitials(name);
  const [failed, setFailed] = useState(false);
  const showImg = !!src && !failed;

  return (
    <div className={clsx('relative overflow-hidden bg-[#efe6da]', rounded, className)}>
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
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
