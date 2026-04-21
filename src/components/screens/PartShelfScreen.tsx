'use client';

import Image from 'next/image';

import { motion } from 'framer-motion';

import PartCard from '@/components/ui/PartCard';

import type { Category, Part } from '@/lib/parts-data';
import {
  LAB_BASE_H,
  LAB_BASE_W,
  LAB_CAT_NAMES_LONG,
  PARTS_SHELF_ASSET,
  V2_TO_V1_CATEGORY,
  type LabCategory,
} from '@/lib/lab-scene-data';

type Props = {
  category: LabCategory;
  partsMap: Record<Category, Part[]>;
  onBack: () => void;
};

export default function PartShelfScreen({ category, partsMap, onBack }: Props) {
  const v1Cat = V2_TO_V1_CATEGORY[category];
  const parts = partsMap[v1Cat] ?? [];

  return (
    <motion.section
      key="s3v2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#FFD1DC]"
    >
      <div
        className="relative"
        style={{
          width: `min(100vw, calc(100vh * ${LAB_BASE_W / LAB_BASE_H}))`,
          aspectRatio: `${LAB_BASE_W} / ${LAB_BASE_H}`,
        }}
      >
        <Image
          src={PARTS_SHELF_ASSET}
          alt={LAB_CAT_NAMES_LONG[category]}
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-contain"
          style={{ imageRendering: 'pixelated' }}
        />

        <div className="pointer-events-none absolute top-4 right-4 z-[3] rounded-md border-2 border-[#c96190]/50 bg-white/75 px-3 py-1.5 font-[family-name:var(--font-mono-hud)] text-[11px] tracking-[0.22em] text-[#c96190]">
          {LAB_CAT_NAMES_LONG[category]}
        </div>

        <button
          type="button"
          onClick={onBack}
          className="absolute top-4 left-4 z-[3] rounded-md border-2 border-[#c96190]/45 bg-white/75 px-4 py-1.5 font-[family-name:var(--font-mono-hud)] text-[11px] tracking-[0.22em] text-[#c96190] shadow-[2px_2px_0_rgba(201,97,144,0.35)] transition hover:bg-white active:scale-[0.97]"
          aria-label="실험실로 돌아가기"
        >
          ← BACK
        </button>

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="absolute right-0 bottom-0 left-0 z-[2] border-t-[3px] border-[#c96190]/40 bg-[rgba(255,230,240,0.92)] px-4 py-4 backdrop-blur-sm"
          style={{ maxHeight: '48%' }}
        >
          <div className="lab-scroll flex max-h-[calc(48vh-2rem)] gap-3 overflow-x-auto overflow-y-hidden pb-2">
            {parts.length === 0 ? (
              <div className="flex min-h-[120px] w-full items-center justify-center font-[family-name:var(--font-mono-hud)] text-[11px] tracking-[0.2em] text-[#c96190]/70">
                등록된 부품이 없습니다 ({v1Cat})
              </div>
            ) : (
              parts.map((p) => (
                <div key={p.id} className="w-[110px] shrink-0">
                  <PartCard part={p} />
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
