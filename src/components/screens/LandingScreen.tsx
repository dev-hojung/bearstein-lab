'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { BACKGROUNDS } from '@/lib/parts-data';
import { useLabStore } from '@/lib/store';
import VhsHud from '@/components/ui/VhsHud';

export default function LandingScreen() {
  const goToCategories = useLabStore((s) => s.goToCategories);

  return (
    <motion.section
      key="s1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 overflow-hidden"
      onClick={goToCategories}
    >
      <Image
        src={BACKGROUNDS.s1}
        alt=""
        fill
        priority
        sizes="100vw"
        className="z-0 object-cover object-center"
      />
      <div className="scan-ov pointer-events-none absolute inset-0 z-[1]" />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          goToCategories();
        }}
        className="absolute inset-0 z-[2] flex cursor-pointer flex-col items-center justify-center bg-[rgba(10,0,20,0.35)] text-center"
        aria-label="Enter the laboratory"
      >
        <span
          className="inline-block animate-(--animate-glow-pulse) cursor-pointer rounded px-8 py-2 font-[family-name:var(--font-vibes)] text-[#FF9FD4] transition-transform hover:scale-[1.04]"
          style={{
            fontSize: 'clamp(3.2rem,7.5vw,6rem)',
            letterSpacing: '0.02em',
            lineHeight: 1.3,
            transform: 'rotate(-6deg)',
            transformOrigin: 'center center',
            textShadow:
              '0 0 20px rgba(255,100,180,0.7), 0 0 50px rgba(255,80,160,0.3)',
          }}
        >
          Bearstein&apos;s<br />Virtual Laboratory
        </span>
        <span
          className="mt-4 inline-block animate-(--animate-blink-fade) font-[family-name:var(--font-josefin)] text-[0.72rem] font-extralight tracking-[0.35em] text-[rgba(255,200,230,0.6)]"
          style={{ transform: 'rotate(-6deg)' }}
        >
          Click to Enter ▼
        </span>
      </button>

      <VhsHud />
    </motion.section>
  );
}
