'use client';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { useRef } from 'react';
import { ProductArt } from '@/components/storefront/ProductArt';
import { formatMoney } from '@/lib/money';
import { availabilityLabel, type PublicProduct } from '@/lib/storefront';
import type { Currency } from '@/lib/types';

/** Scroll-scrubbed product stage — CSS 3D (no Three.js). Eager images; shopper callouts. */
export function StorefrontStage({ products, currency }: { products: PublicProduct[]; currency: Currency }) {
  const reduce = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: track,
    offset: ['start start', 'end start'],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 28, mass: 0.4 });

  const rotateY = useTransform(smooth, [0, 1], [16, -26]);
  const rotateX = useTransform(smooth, [0, 1], [10, -5]);
  const scale = useTransform(smooth, [0, 0.45, 1], [0.94, 1.04, 0.86]);
  const floatY = useTransform(smooth, [0, 1], [0, -36]);
  const calloutOp = useTransform(smooth, [0, 0.4, 0.85], [1, 1, 0.35]);

  const featured = products.filter((p) => p.availability !== 'out').slice(0, 5);
  if (featured.length === 0) return null;

  const hero = featured[0]!;
  const sideA = featured[1];
  const sideB = featured[2];

  if (reduce) {
    return (
      <div className="relative mx-auto grid h-[300px] w-full max-w-lg grid-cols-2 gap-2 sm:h-[380px]" data-testid="sf-stage">
        {featured.slice(0, 4).map((p, i) => (
          <div key={p.id} className={`overflow-hidden rounded-[1.75rem] bg-[#efe6da] ${i === 0 ? 'row-span-2' : ''}`}>
            <ProductArt src={p.photo} name={p.name} category={p.category} rounded="rounded-none" className="h-full w-full" priority />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={track} className="relative h-[min(68vh,560px)] min-h-[340px] w-full lg:h-[560px]" aria-hidden data-testid="sf-stage">
      <div className="sticky top-[12vh] flex h-[min(56vh,480px)] min-h-[300px] items-center justify-center [perspective:1400px] lg:top-[10vh] lg:h-[480px]">
        <motion.div
          style={{ rotateY, rotateX, scale, y: floatY, transformStyle: 'preserve-3d' }}
          className="relative h-[min(62vw,380px)] w-[min(62vw,380px)] sm:h-[400px] sm:w-[400px] lg:h-[440px] lg:w-[440px]"
        >
          {/* Central product */}
          <div
            className="absolute inset-[10%] overflow-hidden rounded-[2rem] bg-[#1c120c]"
            style={{ transform: 'translateZ(48px)', boxShadow: '0 36px 70px rgb(28 18 12 / 0.16)' }}
          >
            <ProductArt src={hero.photo} name={hero.name} category={hero.category} rounded="rounded-none" className="h-full w-full" priority />
          </div>

          {featured.slice(1, 5).map((p, i) => {
            const poses = [
              { x: '-52%', y: '-12%', z: 88, rot: -12, w: '40%' },
              { x: '58%', y: '-4%', z: 72, rot: 11, w: '36%' },
              { x: '-44%', y: '54%', z: 56, rot: 7, w: '34%' },
              { x: '52%', y: '50%', z: 78, rot: -9, w: '38%' },
            ][i]!;
            return (
              <div
                key={p.id}
                className="absolute overflow-hidden rounded-[1.35rem] border border-white/50 bg-[#efe6da]"
                style={{
                  left: poses.x,
                  top: poses.y,
                  width: poses.w,
                  aspectRatio: '1',
                  transform: `translateZ(${poses.z}px) rotate(${poses.rot}deg)`,
                }}
              >
                <ProductArt src={p.photo} name={p.name} category={p.category} rounded="rounded-none" className="h-full w-full" priority />
              </div>
            );
          })}

          {/* Shopper callouts — same thin-line language, product facts */}
          <motion.svg
            style={{ opacity: calloutOp }}
            className="pointer-events-none absolute inset-[-14%] h-[128%] w-[128%] overflow-visible"
            viewBox="0 0 100 100"
            fill="none"
          >
            <path d="M14 30 L36 40" stroke="#0a0a0a" strokeWidth="0.35" strokeOpacity="0.4" />
            <circle cx="14" cy="30" r="0.7" fill="#0a0a0a" fillOpacity="0.5" />
            <path d="M86 24 L66 38" stroke="#0a0a0a" strokeWidth="0.35" strokeOpacity="0.4" />
            <circle cx="86" cy="24" r="0.7" fill="#0a0a0a" fillOpacity="0.5" />
            <path d="M18 74 L40 64" stroke="#c2531f" strokeWidth="0.4" strokeOpacity="0.75" />
            <circle cx="18" cy="74" r="0.85" fill="#c2531f" />
          </motion.svg>

          {sideA && (
            <motion.div style={{ opacity: calloutOp }} className="pointer-events-none absolute -left-1 top-[16%] -translate-x-full text-right sm:-left-3">
              <p className="max-w-[9rem] truncate text-[11px] font-bold text-[#0a0a0a]">{sideA.name}</p>
              <p className="text-[12px] font-semibold tabular text-[#c2531f]">{formatMoney(sideA.sell_price, currency)}</p>
              <p className="text-[10px] font-medium text-[#5c8f5a]">{availabilityLabel(sideA.availability)}</p>
            </motion.div>
          )}
          {sideB && (
            <motion.div style={{ opacity: calloutOp }} className="pointer-events-none absolute -right-1 top-[10%] translate-x-full sm:-right-3">
              <p className="max-w-[9rem] truncate text-[11px] font-bold text-[#0a0a0a]">{sideB.name}</p>
              <p className="text-[12px] font-semibold tabular text-[#c2531f]">{formatMoney(sideB.sell_price, currency)}</p>
              <p className="text-[10px] font-medium text-[#5c8f5a]">{availabilityLabel(sideB.availability)}</p>
            </motion.div>
          )}
          <motion.div style={{ opacity: calloutOp }} className="pointer-events-none absolute -left-1 bottom-[18%] -translate-x-full text-right sm:-left-2">
            <p className="max-w-[10rem] truncate text-[11px] font-bold text-[#0a0a0a]">{hero.name}</p>
            <p className="text-[13px] font-bold tabular text-[#c2531f]">{formatMoney(hero.sell_price, currency)}</p>
            <p className="text-[10px] font-medium text-[#5c8f5a]">{availabilityLabel(hero.availability)}</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
