'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { BACKGROUNDS, CATEGORIES } from '@/lib/parts-data';
import CrtTv from '@/components/ui/CrtTv';

export default function CategoryScreen() {
  return (
    <motion.section
      key="s2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 overflow-hidden bg-[#1a0018]"
    >
      <Image
        src={BACKGROUNDS.s2}
        alt=""
        fill
        sizes="100vw"
        className="z-0 object-cover object-center"
        style={{ filter: 'brightness(0.65) saturate(1.2)' }}
      />
      <div className="scan-ov pointer-events-none absolute inset-0 z-[1]" />

      <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center p-4">
        <h1
          className="mb-4 text-center font-[family-name:var(--font-cormorant)] italic font-medium text-[#FF9FD4]"
          style={{
            fontSize: 'clamp(1.2rem,2.8vw,1.8rem)',
            letterSpacing: '0.04em',
            textShadow: '0 0 15px rgba(255,100,180,0.7)',
          }}
        >
          Select a Collection
        </h1>
        <div
          className="grid w-full max-w-[660px] grid-cols-2 gap-3 sm:gap-7"
          style={{ gap: 'clamp(10px,2.5vw,28px)' }}
        >
          {CATEGORIES.map((cat) => (
            <CrtTv key={cat} cat={cat} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
