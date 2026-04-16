'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { BACKGROUNDS, CAT_NAMES, PARTS_DATA } from '@/lib/parts-data';
import { useLabStore } from '@/lib/store';
import BackButton from '@/components/ui/BackButton';
import PartCard from '@/components/ui/PartCard';

export default function SubcategoryScreen() {
  const cat = useLabStore((s) => s.cat);
  const cart = useLabStore((s) => s.cart);
  const toggleCart = useLabStore((s) => s.toggleCart);

  const parts = PARTS_DATA[cat] ?? [];

  return (
    <motion.section
      key="s3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 overflow-hidden bg-[#1a0018]"
    >
      <Image
        src={BACKGROUNDS.s3}
        alt=""
        fill
        sizes="100vw"
        className="z-0 object-cover object-center"
        style={{ filter: 'brightness(0.55) saturate(1.3)' }}
      />
      <div className="scan-ov pointer-events-none absolute inset-0 z-[1]" />

      <div className="absolute inset-0 z-[2] flex flex-col p-3">
        <header className="mb-3 flex flex-shrink-0 items-center gap-3">
          <BackButton />
          <h1
            className="font-[family-name:var(--font-cormorant)] italic font-medium text-[#FF9FD4]"
            style={{
              fontSize: 'clamp(1.1rem,2.6vw,1.6rem)',
              letterSpacing: '0.04em',
              textShadow: '0 0 12px rgba(255,100,180,0.6)',
            }}
          >
            {CAT_NAMES[cat]}
          </h1>
        </header>

        <div
          className="lab-scroll grid flex-1 gap-2.5 overflow-y-auto pb-[70px]"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}
        >
          {parts.map((part) => (
            <PartCard key={part.id} part={part} />
          ))}
        </div>
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-[72px] left-1/2 z-50 -translate-x-1/2">
          <button
            type="button"
            onClick={toggleCart}
            className="cursor-pointer rounded border border-[#FF80C0] bg-gradient-to-br from-[#CC1166] to-[#880044] px-7 py-2.5 font-[family-name:var(--font-josefin)] text-sm tracking-[0.2em] text-[#FFE0F0] shadow-[0_0_20px_rgba(204,17,102,0.4)] transition hover:from-[#EE2288] hover:to-[#CC1166] hover:shadow-[0_0_30px_rgba(255,30,140,0.6)]"
          >
            🛒 View Cart →
          </button>
        </div>
      )}
    </motion.section>
  );
}
