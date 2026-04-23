'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';

import {
  LAB_BASE_H,
  LAB_BASE_W,
  LAB_CAT_NAMES_LONG,
  LAB_SCENE_ASSETS,
  SHELF_ZONES,
  type LabCategory,
  type ShelfZone,
} from '@/lib/lab-scene-data';

type Props = {
  onPick: (cat: LabCategory) => void;
};

// Must stay ≥ `--animate-lights-out` duration + its 0.15s delay, so the
// shelf buttons don't accept clicks until the room is actually dark.
const LIGHTS_OUT_MS = 1900;

export default function LabSceneScreen({ onPick }: Props) {
  const [isExiting, setIsExiting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setIsReady(true), LIGHTS_OUT_MS);
    return () => window.clearTimeout(t);
  }, []);

  const handleShelfPick = (z: ShelfZone) => {
    if (!isReady || isExiting) return;
    setIsExiting(true);
    onPick(z.id);
  };

  return (
    <motion.section
      key="s2v2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="fixed inset-0 flex h-[100dvh] w-[100dvw] items-center justify-center overflow-hidden bg-[#0d0510]"
    >
      <div
        className="relative"
        style={{
          // `100dvh` tracks the *visible* viewport height on mobile so the
          // URL bar / notch no longer crops the lab scene in landscape.
          width: `min(100vw, calc(100dvh * ${LAB_BASE_W / LAB_BASE_H}))`,
          aspectRatio: `${LAB_BASE_W} / ${LAB_BASE_H}`,
        }}
      >
        {/* Bottom layer: dark composite — steady except for a faint wobble. */}
        <Image
          src={LAB_SCENE_ASSETS.dark}
          alt=""
          aria-hidden
          fill
          priority
          unoptimized
          sizes="100vw"
          className="lab-dark-layer animate-(--animate-ambient-flicker) object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
        {/* Top layer: bright composite — holds, flickers 3 times, fades out. */}
        <Image
          src={LAB_SCENE_ASSETS.bright}
          alt="Bearstein's Laboratory"
          fill
          priority
          unoptimized
          sizes="100vw"
          className="lab-bright-layer animate-(--animate-lights-out) object-contain"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Transparent click buttons over each center item. */}
        {SHELF_ZONES.map((z) => (
          <button
            key={z.id}
            type="button"
            aria-label={LAB_CAT_NAMES_LONG[z.id]}
            onClick={() => handleShelfPick(z)}
            disabled={!isReady || isExiting}
            className="absolute rounded-sm transition-[filter,transform] duration-75 active:scale-[0.92] active:brightness-125 active:drop-shadow-[0_0_10px_rgba(255,100,160,0.8)] disabled:pointer-events-none disabled:cursor-wait"
            style={{
              left: `${z.x1 * 100}%`,
              top: `${z.y1 * 100}%`,
              width: `${(z.x2 - z.x1) * 100}%`,
              height: `${(z.y2 - z.y1) * 100}%`,
              zIndex: 6,
            }}
          />
        ))}
      </div>
    </motion.section>
  );
}
