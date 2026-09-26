import clsx from 'clsx';

/** Boutik app mark: storefront with a striped awning, on a terracotta tile. */
export function LogoMark({ size = 40, className, flat = false }: { size?: number; className?: string; flat?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bk-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E0713A" />
          <stop offset="0.55" stopColor="#C2531F" />
          <stop offset="1" stopColor="#8E3413" />
        </linearGradient>
        <linearGradient id="bk-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".18" />
          <stop offset=".55" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill={flat ? '#C2531F' : 'url(#bk-bg)'} />
      {!flat && <rect width="512" height="512" rx="116" fill="url(#bk-shine)" />}
      <path d="M146 236 H366 V372 a20 20 0 0 1 -20 20 H166 a20 20 0 0 1 -20 -20 Z" fill="#FFF6EA" />
      <path d="M226 392 V318 a30 30 0 0 1 60 0 V392 Z" fill="#9A3A12" />
      <circle cx="275" cy="356" r="5" fill="#F2B441" />
      <rect x="172" y="276" width="36" height="40" rx="9" fill="#F2B441" />
      <rect x="304" y="276" width="36" height="40" rx="9" fill="#F2B441" />
      <path d="M146 236 H366 V252 H146 Z" fill="#000" opacity=".10" />
      <rect x="120" y="118" width="272" height="34" rx="17" fill="#FFF6EA" />
      <path d="M128 152 H196 V206 a34 34 0 0 1 -68 0 Z" fill="#FFF6EA" />
      <path d="M196 152 H256 V206 a30 34 0 0 1 -60 0 Z" fill="#F2B441" />
      <path d="M256 152 H316 V206 a30 34 0 0 1 -60 0 Z" fill="#FFF6EA" />
      <path d="M316 152 H384 V206 a34 34 0 0 1 -68 0 Z" fill="#F2B441" />
    </svg>
  );
}

export function Logo({ size = 34, className, light = false }: { size?: number; className?: string; light?: boolean }) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      <span
        className={clsx('font-display font-bold tracking-tight', light ? 'text-cream' : 'text-ink')}
        style={{ fontSize: size * 0.72, lineHeight: 1 }}
      >
        Boutik
      </span>
    </span>
  );
}
