'use client';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { useRef } from 'react';
import { ProductArt } from '@/components/storefront/ProductArt';
import type { PublicProduct } from '@/lib/storefront';

/** Scroll-scrubbed product stage — CSS 3D (no Three.js) for cheap Android / 3G. */
export function StorefrontStage({ products }: { products: PublicProduct[] }) {
  const reduce = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: track,
    offset: ['start start', 'end start'],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 28, mass: 0.4 });

  const rotateY = useTransform(smooth, [0, 1], [22, -32]);
  const rotateX = useTransform(smooth, [0, 1], [12, -6]);
  const scale = useTransform(smooth, [0, 0.45, 1], [0.88, 1.06, 0.78]);
  const floatY = useTransform(smooth, [0, 1], [0, -48]);
  const calloutOp = useTransform(smooth, [0, 0.35, 0.75, 1], [0.85, 1, 0.7, 0.25]);

  const featured = products.filter((p) => p.availability !== 'out').slice(0, 5);
  if (featured.length === 0) return null;

  if (reduce) {
    return (
      <div className="relative mx-auto grid h-[280px] w-full max-w-md grid-cols-2 gap-2 sm:h-[340px]">
        {featured.slice(0, 4).map((p, i) => (
          <div key={p.id} className={`overflow-hidden rounded-[1.75rem] bg-[#efe6da] ${i === 0 ? 'row-span-2' : ''}`}>
            <ProductArt src={p.photo} name={p.name} category={p.category} rounded="rounded-none" className="h-full w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={track} className="relative h-[72vh] min-h-[360px] max-h-[640px] w-full" aria-hidden>
      <div className="sticky top-[18vh] flex h-[54vh] min-h-[300px] items-center justify-center perspective-[1200px]">
        <motion.div
          style={{ rotateY, rotateX, scale, y: floatY, transformStyle: 'preserve-3d' }}
          className="relative h-[min(52vw,320px)] w-[min(52vw,320px)] sm:h-[360px] sm:w-[360px]"
        >
          {/* Central stack */}
          <div
            className="absolute inset-[8%] overflow-hidden rounded-[2rem] bg-[#1c120c]"
            style={{ transform: 'translateZ(40px)', boxShadow: '0 40px 80px rgb(28 18 12 / 0.18)' }}
          >
            <ProductArt
              src={featured[0].photo}
              name={featured[0].name}
              category={featured[0].category}
              rounded="rounded-none"
              className="h-full w-full"
            />
          </div>

          {featured.slice(1, 5).map((p, i) => {
            const poses = [
              { x: '-58%', y: '-18%', z: 80, rot: -14, w: '42%' },
              { x: '62%', y: '-8%', z: 60, rot: 12, w: '38%' },
              { x: '-48%', y: '52%', z: 50, rot: 8, w: '36%' },
              { x: '55%', y: '48%', z: 70, rot: -10, w: '40%' },
            ][i]!;
            return (
              <div
                key={p.id}
                className="absolute overflow-hidden rounded-[1.35rem] border border-white/40 bg-[#efe6da]"
                style={{
                  left: poses.x,
                  top: poses.y,
                  width: poses.w,
                  aspectRatio: '1',
                  transform: `translateZ(${poses.z}px) rotate(${poses.rot}deg)`,
                }}
              >
                <ProductArt src={p.photo} name={p.name} category={p.category} rounded="rounded-none" className="h-full w-full" />
              </div>
            );
          })}

          {/* Technical callouts — portfolio-style */}
          <motion.svg
            style={{ opacity: calloutOp }}
            className="pointer-events-none absolute inset-[-12%] h-[124%] w-[124%] overflow-visible"
            viewBox="0 0 100 100"
            fill="none"
          >
            <path d="M18 28 L38 38" stroke="#1c120c" strokeWidth="0.35" strokeOpacity="0.45" />
            <circle cx="18" cy="28" r="0.7" fill="#1c120c" fillOpacity="0.55" />
            <path d="M82 22 L64 36" stroke="#1c120c" strokeWidth="0.35" strokeOpacity="0.45" />
            <circle cx="82" cy="22" r="0.7" fill="#1c120c" fillOpacity="0.55" />
            <path d="M16 72 L40 62" stroke="#c2531f" strokeWidth="0.4" strokeOpacity="0.7" />
            <circle cx="16" cy="72" r="0.8" fill="#c2531f" />
          </motion.svg>

          <motion.div style={{ opacity: calloutOp }} className="pointer-events-none absolute -left-2 top-[18%] -translate-x-full text-right sm:-left-4">
            <p className="font-mono text-[10px] tracking-wide text-[#1c120c]/70">roughness · 0.28</p>
            <p className="font-mono text-[9px] text-[#8a7360]">MeshPhysical · produit</p>
          </motion.div>
          <motion.div style={{ opacity: calloutOp }} className="pointer-events-none absolute -right-2 top-[12%] translate-x-full sm:-right-4">
            <p className="font-mono text-[10px] tracking-wide text-[#1c120c]/70">rotation.y</p>
            <p className="font-mono text-[9px] text-[#8a7360]">scroll · scrub</p>
          </motion.div>
          <motion.div style={{ opacity: calloutOp }} className="pointer-events-none absolute -left-1 bottom-[22%] -translate-x-full text-right sm:-left-3">
            <p className="font-mono text-[10px] font-semibold tracking-wide text-[#c2531f]">{featured[0].name.split(' ')[0]}</p>
            <p className="font-mono text-[9px] text-[#8a7360]">hero · LCP</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
