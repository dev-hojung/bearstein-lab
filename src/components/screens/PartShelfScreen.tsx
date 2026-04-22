'use client';

import Image from 'next/image';

import { motion } from 'framer-motion';

import type { Category, Part } from '@/lib/parts-data';
import {
  LAB_BASE_H,
  LAB_BASE_W,
  LAB_CAT_NAMES_LONG,
  PART_SHELF_BG,
  V2_TO_V1_CATEGORY,
  type LabCategory,
} from '@/lib/lab-scene-data';
import { useLabStore } from '@/lib/store';

type Props = {
  category: LabCategory;
  partsMap: Record<Category, Part[]>;
  onBack: () => void;
};

const TILE_COLS = 5;
const TILE_ROWS = 3;
const TILE_COUNT = TILE_COLS * TILE_ROWS;

// Grid position — right side of the aspect-locked stage, past the cabinet.
// Matches the "오른쪽 흰색칸 분리" bg layout: cabinet occupies x 0.05–0.48,
// so the grid lives in the clear workbench area x 0.50–0.95.
const GRID_POSE = { left: 0.5, top: 0.2, width: 0.45, height: 0.62 };

export default function PartShelfScreen({ category, partsMap, onBack }: Props) {
  const v1Cat = V2_TO_V1_CATEGORY[category];
  const parts = partsMap[v1Cat] ?? [];
  const longName = LAB_CAT_NAMES_LONG[category];

  const slots: Array<Part | null> = Array.from(
    { length: TILE_COUNT },
    (_, i) => parts[i] ?? null,
  );

  return (
    <motion.section
      key="s3v2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#0d0510]"
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="실험실로 돌아가기"
        className="absolute bottom-4 left-4 z-[20] rounded-md border-2 border-[#FF88BB]/60 bg-[rgba(20,5,16,0.75)] px-3 py-1.5 font-[family-name:var(--font-mono-hud)] text-[11px] tracking-[0.22em] text-[#FFB0D4] shadow-[0_0_10px_rgba(255,100,180,0.25)] backdrop-blur-sm transition hover:bg-[rgba(40,10,30,0.85)] hover:text-[#FFE0F0] active:scale-[0.97]"
      >
        ← BACK
      </button>

      <div
        className="relative"
        style={{
          width: `min(100vw, calc(100vh * ${LAB_BASE_W / LAB_BASE_H}))`,
          aspectRatio: `${LAB_BASE_W} / ${LAB_BASE_H}`,
        }}
      >
        {/* Pre-rendered bg — cabinet + title baked in, empty right workbench. */}
        <Image
          src={PART_SHELF_BG}
          alt="Bearstein's Laboratory"
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-contain"
          style={{ imageRendering: 'pixelated' }}
        />

{/* Tile grid — code-rendered frames via `tile-sprite` SVG (option B). */}
        <div
          className="absolute z-[10] grid grid-cols-5 grid-rows-3 gap-[1.3%]"
          style={{
            left: `${GRID_POSE.left * 100}%`,
            top: `${GRID_POSE.top * 100}%`,
            width: `${GRID_POSE.width * 100}%`,
            height: `${GRID_POSE.height * 100}%`,
          }}
        >
          {slots.map((part, i) => (
            <ShelfTile key={part ? part.id : `empty-${i}`} part={part} index={i} />
          ))}
        </div>

        {/* Category HUD — right edge, top. Clear of the cabinet on the left
            and below the pink decorative border. Small pill that reads as a
            room tag, not a competing title. */}
        <motion.div
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="absolute z-[12] flex items-center gap-2 rounded-md border border-[#FF88BB]/50 bg-[rgba(20,5,16,0.7)] px-3 py-1 backdrop-blur-sm"
          style={{ right: '5%', top: '7%' }}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF4E9A] shadow-[0_0_6px_rgba(255,78,154,0.85)]" />
          <span className="font-[family-name:var(--font-mono-hud)] text-[11px] tracking-[0.28em] text-[#FFD5E8]">
            {category.toUpperCase()}
          </span>
          <span className="font-[family-name:var(--font-mono-hud)] text-[10px] tracking-[0.18em] text-[#FFB0D4]/70">
            {longName}
          </span>
        </motion.div>
      </div>

      <div className="scan-ov pointer-events-none absolute inset-0 z-[13] opacity-35" />
    </motion.section>
  );
}

// ── Individual tile — pixel-art pink frame (SVG sprite) + part image overlay.
function ShelfTile({ part, index }: { part: Part | null; index: number }) {
  const cart = useLabStore((s) => s.cart);
  const addOrReplace = useLabStore((s) => s.addOrReplace);
  const setToast = useLabStore((s) => s.setToast);
  const inCart = part ? cart.some((c) => c.id === part.id) : false;

  const handleClick = () => {
    if (!part) return;
    const wasInCart = inCart;
    const { replaced } = addOrReplace(part);
    if (wasInCart) {
      setToast(`✕ ${part.name} 제거`);
      return;
    }
    setToast(replaced ? `↻ ${replaced.name} → ${part.name}` : `+ ${part.name} 추가`);
  };

  const col = index % TILE_COLS;
  const row = Math.floor(index / TILE_COLS);
  const delay = 0.3 + (col + row) * 0.05;

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={!part}
      aria-label={part ? part.name : 'empty shelf slot'}
      aria-pressed={inCart}
      initial={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={part ? { scale: 1.07 } : undefined}
      whileTap={part ? { scale: 0.95 } : undefined}
      className={[
        'tile-sprite-glow group relative flex aspect-square items-center justify-center disabled:cursor-default',
        inCart ? 'tile-sprite-glow--active' : '',
      ].join(' ')}
    >
      {/* Pixel-art frame as an inline <img> so `image-rendering: pixelated`
          applies reliably across browsers (SVG-as-background sometimes
          rasterizes smooth regardless of the hint). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={inCart ? '/images/ui/tile-frame-active.svg' : '/images/ui/tile-frame.svg'}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ imageRendering: 'pixelated' }}
      />

      {part ? (
        <Image
          src={part.url}
          alt={part.name}
          width={96}
          height={96}
          className="relative z-[1] h-[68%] w-[68%] object-contain drop-shadow-[0_2px_4px_rgba(255,120,170,0.3)]"
          style={{ imageRendering: 'pixelated' }}
          unoptimized
        />
      ) : (
        // Empty-slot placeholder: tiny 4-dot pixel sparkle so the frame
        // doesn't read as pure empty space.
        <span
          aria-hidden
          className="relative z-[1] block h-[22%] w-[22%] opacity-70"
          style={{
            background:
              'radial-gradient(circle at 35% 35%, #ffbbd8 0%, #f29bc2 45%, #e67ead 80%, transparent 85%)',
            clipPath:
              'polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)',
            filter: 'drop-shadow(0 0 3px rgba(255,150,200,0.55))',
          }}
        />
      )}

      {inCart && (
        <span
          className="absolute -right-1 -top-1 z-[2] flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#FF2288] text-[0.6rem] font-bold text-white shadow-[0_0_10px_rgba(255,40,140,0.6)]"
          aria-hidden
        >
          ✓
        </span>
      )}
    </motion.button>
  );
}
