'use client';
import { motion } from 'motion/react';
import { LogoMark } from './Logo';

export function Splash({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_50%_40%,#fff8ef_0%,#f6e7d3_100%)] dark:bg-[radial-gradient(ellipse_at_50%_40%,#2a1d14_0%,#130d09_100%)]" data-testid="splash">
      <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
          <LogoMark size={96} className="drop-shadow-[0_18px_30px_rgba(194,83,31,0.35)]" />
        </motion.div>
      </motion.div>
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6 font-display text-3xl font-bold tracking-tight text-ink">
        Boutik
      </motion.p>
      {text && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mt-2 text-sm text-muted">
          {text}
        </motion.p>
      )}
      <div className="mt-8 h-1 w-28 overflow-hidden rounded-full bg-line">
        <motion.div className="h-full w-1/2 rounded-full bg-brand" animate={{ x: ['-100%', '200%'] }} transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }} />
      </div>
    </div>
  );
}
