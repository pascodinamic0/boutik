'use client';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { useRef } from 'react';
import { ProductArt } from '@/components/storefront/ProductArt';
import { formatMoney } from '@/lib/money';
import { availabilityLabel, type PublicProduct } from '@/lib/storefront';
import type { Currency } from '@/lib/types';

/** Scroll-scrubbed product stage — 3D tiles stay inside the stage column (no left bleed). */
export function StorefrontStage({ products, currency }: { products: PublicProduct[]; currency: Currency }) {
  const reduce = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: track,
    offset: ['start start', 'end start'],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 28, mass: 0.4 });

  const rotateY = useTransform(smooth, [0, 1], [10, -14]);
  const rotateX = useTransform(smooth, [0, 1], [6, -3]);
  const scale = useTransform(smooth, [0, 0.45, 1], [0.97, 1.02, 0.92]);
  const floatY = useTransform(smooth, [0, 1], [0, -20]);

  const featured = products.filter((p) => p.availability !== 'out').slice(0, 5);
  if (featured.length === 0) return null;

  const hero = featured[0]!;
  const satellites = featured.slice(1, 4); // 3 satellites — all to the right / bottom, never left of center

  if (reduce) {
    return (
      <div className="relative mx-auto grid h-[220px] w-full max-w-lg grid-cols-2 gap-2 sm:h-[320px]" data-testid="sf-stage">
        {featured.slice(0, 4).map((p, i) => (
          <div key={p.id} className={`overflow-hidden rounded-[1.75rem] bg-[#efe6da] ${i === 0 ? 'row-span-2' : ''}`}>
            <ProductArt src={p.photo} name={p.name} category={p.category} rounded="rounded-none" className="h-full w-full" priority />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={track}
      className="relative isolate h-[220px] w-full overflow-hidden sm:h-[300px] lg:h-[480px]"
      aria-hidden
      data-testid="sf-stage"
      style={{ perspective: '1000px' }}
    >
      <div className="flex h-full items-center justify-center lg:justify-end lg:pr-4">
        <motion.div
          style={{ rotateY, rotateX, scale, y: floatY, transformStyle: 'preserve-3d' }}
          className="relative h-[190px] w-[190px] sm:h-[260px] sm:w-[260px] lg:h-[380px] lg:w-[380px]"
        >
          <div
            className="absolute inset-[8%] overflow-hidden rounded-[1.75rem] bg-[#1c120c] lg:rounded-[2rem]"
            style={{ transform: 'translateZ(36px)', boxShadow: '0 24px 48px rgb(28 18 12 / 0.14)' }}
          >
            <ProductArt src={hero.photo} name={hero.name} category={hero.category} rounded="rounded-none" className="h-full w-full" priority />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 pt-10">
              <p className="truncate text-[11px] font-bold text-white">{hero.name}</p>
              <p className="text-[13px] font-bold tabular text-[#f0b27a]">{formatMoney(hero.sell_price, currency)}</p>
              <p className="text-[10px] font-medium text-emerald-300">{availabilityLabel(hero.availability)}</p>
            </div>
          </div>

          {satellites.map((p, i) => {
            /* Only right / bottom-right / top-right — never extend into the headline column */
            const poses = [
              { x: '58%', y: '-4%', z: 56, rot: 8, w: '32%' },
              { x: '62%', y: '48%', z: 48, rot: -7, w: '30%' },
              { x: '12%', y: '58%', z: 40, rot: 5, w: '28%' },
            ][i]!;
            return (
              <div
                key={p.id}
                className="absolute overflow-hidden rounded-[1.1rem] border border-white/60 bg-[#efe6da] lg:rounded-[1.25rem]"
                style={{
                  left: poses.x,
                  top: poses.y,
                  width: poses.w,
                  aspectRatio: '1',
                  transform: `translateZ(${poses.z}px) rotate(${poses.rot}deg)`,
                }}
              >
                <ProductArt src={p.photo} name={p.name} category={p.category} rounded="rounded-none" className="h-full w-full" priority />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1.5 pt-4">
                  {/* Price-only — long names clip on small tiles */}
                  <p className="text-[10px] font-bold tabular leading-none text-[#f0b27a]">{formatMoney(p.sell_price, currency)}</p>
                  <p className="mt-0.5 text-[8px] font-medium text-emerald-300">{availabilityLabel(p.availability)}</p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
