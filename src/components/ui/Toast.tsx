'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLabStore } from '@/lib/store';

export default function Toast() {
  const toast = useLabStore((s) => s.toast);
  const setToast = useLabStore((s) => s.setToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast, setToast]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[9999] flex justify-center px-4"
      aria-live="polite"
    >
      {/* mode="wait" ensures old toast fully exits before new one enters,
          preventing the "small→large" overlap artifact */}
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="rounded border border-[#FF80C0] bg-[#CC1166] px-4 py-1.5 font-[family-name:var(--font-josefin)] text-xs tracking-widest text-[#FFE0F0] shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
