'use client';

import Image from 'next/image';

import { motion } from 'framer-motion';

import CabinetGlow from '@/components/ui/CabinetGlow';

import {
  LAB_BASE_H,
  LAB_BASE_W,
  LAB_CAT_NAMES_LONG,
  LAB_SCENE_ASSETS,
  SHELF_ZONES,
  type LabAssetVariant,
  type LabCategory,
} from '@/lib/lab-scene-data';

type Props = {
  asset: LabAssetVariant;
  onPick: (cat: LabCategory) => void;
  onToggleAsset?: () => void;
};

export default function LabSceneScreen({ asset, onPick, onToggleAsset }: Props) {
  const bg = LAB_SCENE_ASSETS[asset].bright;
  const showDebug = process.env.NODE_ENV === 'development';

  return (
    <motion.section
      key="s2v2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
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
          src={bg}
          alt="Bearstein's Laboratory"
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-contain"
          style={{ imageRendering: 'pixelated' }}
        />

        <div
          className="pointer-events-none absolute"
          style={{
            left: `${SHELF_ZONES[0].x1 * 100}%`,
            top: `${SHELF_ZONES[0].y1 * 100}%`,
            width: `${(SHELF_ZONES[0].x2 - SHELF_ZONES[0].x1) * 100}%`,
            height: `${(SHELF_ZONES[SHELF_ZONES.length - 1].y2 - SHELF_ZONES[0].y1) * 100}%`,
          }}
        >
          <CabinetGlow />
        </div>

        {SHELF_ZONES.map((z) => (
          <button
            key={z.id}
            type="button"
            aria-label={LAB_CAT_NAMES_LONG[z.id]}
            onClick={() => onPick(z.id)}
            className="absolute rounded-sm transition-[filter,transform] hover:brightness-110 hover:drop-shadow-[0_0_8px_rgba(255,100,160,0.6)] active:scale-[0.97]"
            style={{
              left: `${z.x1 * 100}%`,
              top: `${z.y1 * 100}%`,
              width: `${(z.x2 - z.x1) * 100}%`,
              height: `${(z.y2 - z.y1) * 100}%`,
            }}
          />
        ))}

        {showDebug && (
          <div className="pointer-events-none absolute inset-0">
            {SHELF_ZONES.map((z) => (
              <div
                key={z.id}
                className="absolute border-2 border-dashed border-[#c96190]/50"
                style={{
                  left: `${z.x1 * 100}%`,
                  top: `${z.y1 * 100}%`,
                  width: `${(z.x2 - z.x1) * 100}%`,
                  height: `${(z.y2 - z.y1) * 100}%`,
                }}
              >
                <span className="absolute top-1 left-1 rounded bg-[#c96190] px-1.5 py-0.5 text-[9px] tracking-[0.18em] text-white">
                  {LAB_CAT_NAMES_LONG[z.id]}
                </span>
              </div>
            ))}
          </div>
        )}

        {onToggleAsset && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleAsset();
            }}
            className="absolute top-4 right-4 z-[5] rounded-full border-2 border-[#c96190] bg-white/70 px-3 py-1.5 font-[family-name:var(--font-mono-hud)] text-[11px] tracking-[0.18em] text-[#c96190] shadow-[2px_2px_0_rgba(201,97,144,0.35)] hover:bg-white"
            aria-label="Toggle asset variant"
          >
            ASSET: {asset.toUpperCase()}
          </button>
        )}

        {asset === 'new' && (
          <div className="pointer-events-none absolute top-4 left-1/2 z-[4] -translate-x-1/2 rounded-md border-2 border-dashed border-[#c96190]/60 bg-white/80 px-3 py-2 text-center font-[family-name:var(--font-mono-hud)] text-[11px] tracking-[0.14em] text-[#c96190] shadow-[3px_3px_0_rgba(201,97,144,0.3)]">
            <div className="text-[10px] opacity-80">NEW ASSET SLOT</div>
            <div className="mt-0.5 text-[9px] opacity-70">
              replace public/images/bg/lab-new.jpg
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
