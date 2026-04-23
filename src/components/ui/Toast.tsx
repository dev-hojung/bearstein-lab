'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLabStore } from '@/lib/store';

const DISMISS_MS = 2400;

/**
 * Pick an accent color by inspecting the leading marker the caller used
 * (`+` add, `↻` replace, `✕` remove, `⚠` error, anything else = neutral).
 * The base surface stays the same pink-bevel `.pass-chip`.
 */
function accentClass(msg: string): string {
  const head = msg.trim().slice(0, 1);
  if (head === '✕' || head === '⚠') return 'text-[#B8385C]';
  if (head === '↻') return 'text-[#A0446C]';
  if (head === '+' || head === '●') return 'text-[#3F8B5A]';
  return 'text-[#7D2A52]';
}

export default function Toast() {
  const toast = useLabStore((s) => s.toast);
  const setToast = useLabStore((s) => s.setToast);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [toast, setToast]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[9999] flex justify-center px-4"
      aria-live="polite"
      role="status"
    >
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={['pass-chip', accentClass(toast)].join(' ')}
            style={{ letterSpacing: '0.18em' }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
