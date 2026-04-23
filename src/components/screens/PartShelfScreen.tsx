'use client';

import Image from 'next/image';
import { memo, useCallback, useMemo } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import type { Category, Part } from '@/lib/parts-data';
import {
  CABINET_SHELF_ZONES,
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
  onCombine: () => void;
  onSwitchCategory: (next: LabCategory) => void;
};

const TILE_COLS = 5;
const TILE_ROWS = 3;
const TILE_COUNT = TILE_COLS * TILE_ROWS;

// Grid position — right side of the aspect-locked stage, past the cabinet.
const GRID_POSE = { left: 0.5, top: 0.2, width: 0.45, height: 0.62 };

export default function PartShelfScreen({
  category,
  partsMap,
  onBack,
  onCombine,
  onSwitchCategory,
}: Props) {
  const v1Cat = V2_TO_V1_CATEGORY[category];
  const longName = LAB_CAT_NAMES_LONG[category];

  // Filter parts to those that belong to this v2 slot. Parts without a
  // catV2 fall back to their v1 bucket so legacy data still shows up.
  const parts = useMemo(() => {
    const bucket = partsMap[v1Cat] ?? [];
    return bucket.filter((p) => (p.catV2 ? p.catV2 === category : true));
  }, [partsMap, v1Cat, category]);

  // Stabilize the slot array so ShelfTile memoization is effective; identity
  // only changes when the underlying parts list does.
  const slots = useMemo<ReadonlyArray<Part | null>>(
    () => Array.from({ length: TILE_COUNT }, (_, i) => parts[i] ?? null),
    [parts],
  );

  // Scalar selector — only re-renders the CTA (not the whole screen or the
  // 15 tiles) when cart size changes.
  const cartCount = useLabStore((s) => s.cart.length);

  return (
    <motion.section
      key="s3v2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 flex h-[100dvh] w-[100dvw] items-center justify-center overflow-hidden bg-[#0d0510]"
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="실험실로 돌아가기"
        className="absolute bottom-4 left-4 z-[20] rounded-md border-2 border-[#FF88BB]/60 bg-[rgba(20,5,16,0.75)] px-3 py-1.5 font-[family-name:var(--font-mono-hud)] text-[11px] tracking-[0.22em] text-[#FFB0D4] shadow-[0_0_10px_rgba(255,100,180,0.25)] backdrop-blur-sm transition active:scale-[0.95] active:bg-[rgba(40,10,30,0.9)]"
      >
        ← BACK
      </button>

      {/* COMBINE CTA — floats bottom-right; disabled until the user has
          selected at least one part. Click triggers the page-level glitch
          + transition to the Assembly screen. */}
      <CombineCta count={cartCount} onClick={onCombine} />

      <div
        className="relative"
        style={{
          // `100dvh` excludes the browser URL bar so landscape mobile no
          // longer crops the cabinet / title.
          width: `min(100vw, calc(100dvh * ${LAB_BASE_W / LAB_BASE_H}))`,
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

        {/* Cabinet shelf click overlay — hop between shelves without going
            back to the lab scene. Current shelf gets a soft pulse so the
            user knows where they are. */}
        {CABINET_SHELF_ZONES.map((z) => {
          const isActive = z.id === category;
          return (
            <button
              key={z.id}
              type="button"
              aria-label={`${LAB_CAT_NAMES_LONG[z.id]}로 이동`}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => !isActive && onSwitchCategory(z.id)}
              disabled={isActive}
              className={[
                'absolute z-[11] rounded-sm transition-[filter,transform] duration-100 active:scale-[0.94]',
                isActive
                  ? 'pointer-events-none'
                  : 'cursor-pointer active:brightness-125 active:drop-shadow-[0_0_12px_rgba(255,120,180,0.85)]',
              ].join(' ')}
              style={{
                left: `${z.x1 * 100}%`,
                top: `${z.y1 * 100}%`,
                width: `${(z.x2 - z.x1) * 100}%`,
                height: `${(z.y2 - z.y1) * 100}%`,
              }}
            >
              {isActive && (
                <span
                  aria-hidden
                  className="absolute -right-2 top-1/2 inline-block h-2 w-2 -translate-y-1/2 rounded-[1px] bg-[#FF4E9A] shadow-[0_0_10px_rgba(255,78,154,0.9)]"
                  style={{ animation: 'led-blink 1.6s ease-in-out infinite' }}
                />
              )}
            </button>
          );
        })}

        {/* Tile grid — keyed by category so switching shelves exits the
            old grid and replays the stagger for the new one. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={category}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute z-[10] grid grid-cols-5 grid-rows-3 gap-[1.3%]"
            style={{
              left: `${GRID_POSE.left * 100}%`,
              top: `${GRID_POSE.top * 100}%`,
              width: `${GRID_POSE.width * 100}%`,
              height: `${GRID_POSE.height * 100}%`,
            }}
          >
            {slots.map((part, i) => (
              <ShelfTile
                key={part ? part.id : `empty-${category}-${i}`}
                part={part}
                index={i}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Category HUD — right edge, top. Keyed so text swaps with the
            shelf switch. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={category}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
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
        </AnimatePresence>
      </div>

      <div className="scan-ov pointer-events-none absolute inset-0 z-[13] opacity-35" />
    </motion.section>
  );
}

// ── Floating Combine CTA ────────────────────────────────────────────────
// The shelf advertises 5 slots (ears / eyes / ghost / hands / shoes), so
// the cart must hold 5 distinct items before Combine unlocks. Cart dedup
// uses `catV2 ?? cat`, so this only works once every environment has the
// `cat_v2` column populated (see supabase/RUN_ME_NOW.sql).
const REQUIRED_PARTS = 5;

const CombineCta = memo(function CombineCta({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  const allFilled = count >= REQUIRED_PARTS;
  const disabled = !allFilled;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={
        allFilled
          ? '선택한 5개 부품으로 조립 시작'
          : `${REQUIRED_PARTS}개 부품을 모두 선택해야 조립할 수 있습니다`
      }
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      className={[
        'pass-button absolute bottom-4 right-4 z-[20] !w-auto !px-5 !py-2.5',
        allFilled ? 'combine-cta-ready' : '',
      ].join(' ')}
      style={{ letterSpacing: '0.2em' }}
    >
      <span className="mr-2 inline-block rounded-[1px] bg-[#FFE4EF] px-2 py-0.5 font-[family-name:var(--font-mono-hud)] text-[10px] tracking-[0.18em] text-[#7D2A52]">
        {count} / {REQUIRED_PARTS} PARTS
      </span>
      <span>{allFilled ? 'Combine →' : '부품 전체 선택 필요'}</span>
    </motion.button>
  );
});

// ── Individual tile — pixel-art pink frame + part image overlay.
const ShelfTile = memo(function ShelfTile({
  part,
  index,
}: {
  part: Part | null;
  index: number;
}) {
  const inCart = useLabStore(
    useCallback(
      (s) => (part ? s.cart.some((c) => c.id === part.id) : false),
      [part],
    ),
  );

  const handleClick = useCallback(() => {
    if (!part) return;
    const { addOrReplace, setToast } = useLabStore.getState();
    const wasInCart = useLabStore
      .getState()
      .cart.some((c) => c.id === part.id);
    const { replaced } = addOrReplace(part);
    if (wasInCart) {
      setToast(`✕ ${part.name} 제거`);
      return;
    }
    setToast(replaced ? `↻ ${replaced.name} → ${part.name}` : `+ ${part.name} 추가`);
  }, [part]);

  const col = index % TILE_COLS;
  const row = Math.floor(index / TILE_COLS);
  const delay = 0.3 + (col + row) * 0.05;

  const spriteSrc = inCart
    ? '/images/ui/tile-frame-active.svg'
    : '/images/ui/tile-frame.svg';

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
      whileTap={part ? { scale: 0.94 } : undefined}
      className={[
        'tile-sprite-glow group relative flex aspect-square items-center justify-center disabled:cursor-default',
        inCart ? 'tile-sprite-glow--active' : '',
      ].join(' ')}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={spriteSrc}
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
});
