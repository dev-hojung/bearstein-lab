'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, type PanInfo } from 'framer-motion';
import { toPng } from 'html-to-image';
import { ASM_POS, ASM_Z, BACKGROUNDS, CAT_LABEL, type Part } from '@/lib/parts-data';
import { useLabStore, type Offset } from '@/lib/store';
import BackButton from '@/components/ui/BackButton';

const STAGE_W = 300;
const STAGE_H = 440;

export default function AssemblyScreen() {
  const cart = useLabStore((s) => s.cart);
  const partOffsets = useLabStore((s) => s.partOffsets);
  const partScales = useLabStore((s) => s.partScales);
  const setPartOffset = useLabStore((s) => s.setPartOffset);
  const setPartScale = useLabStore((s) => s.setPartScale);
  const resetPartTransforms = useLabStore((s) => s.resetPartTransforms);
  const setToast = useLabStore((s) => s.setToast);

  const captureRef = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  /** Mobile-only floating pad state: which pad is currently expanded */
  const [activePad, setActivePad] = useState<'move' | 'size' | null>(null);

  // Auto-select first part when cart changes (for nudge controls)
  useEffect(() => {
    if (cart.length === 0) {
      setSelectedId(null);
    } else if (!selectedId || !cart.some((c) => c.id === selectedId)) {
      setSelectedId(cart[0].id);
    }
  }, [cart, selectedId]);

  const handleDownload = async () => {
    if (!captureRef.current || cart.length === 0) {
      setToast('Add parts before downloading');
      return;
    }
    setDownloading(true);
    // Briefly clear selection so the highlight ring doesn't appear in the PNG
    const prevSelected = selectedId;
    setSelectedId(null);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    try {
      const dataUrl = await toPng(captureRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: undefined, // transparent PNG
      });
      const link = document.createElement('a');
      link.download = `bearstein-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      setToast('PNG downloaded');
    } catch (err) {
      console.error(err);
      setToast('Download failed');
    } finally {
      setSelectedId(prevSelected);
      setDownloading(false);
    }
  };

  const handleReset = () => {
    resetPartTransforms();
    setToast('Positions & sizes reset');
  };

  const nudge = (dx: number, dy: number) => {
    if (!selectedId) return;
    const cur = partOffsets[selectedId] ?? { x: 0, y: 0 };
    setPartOffset(selectedId, { x: cur.x + dx, y: cur.y + dy });
  };

  const adjustScale = (delta: number) => {
    if (!selectedId) return;
    const cur = partScales[selectedId] ?? 1;
    setPartScale(selectedId, Math.round((cur + delta) * 100) / 100);
  };

  const selectedPart = cart.find((p) => p.id === selectedId) ?? null;
  const selectedOffset = selectedId ? partOffsets[selectedId] ?? { x: 0, y: 0 } : null;
  const selectedScale = selectedId ? partScales[selectedId] ?? 1 : 1;

  return (
    <motion.section
      key="s4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 overflow-hidden bg-[#FFD1DC]"
    >
      <Image
        src={BACKGROUNDS.s4}
        alt=""
        fill
        unoptimized
        sizes="100vw"
        className="z-0 object-cover object-center"
        style={{ filter: 'hue-rotate(300deg) saturate(1.4) brightness(0.6)' }}
      />
      <div className="scan-ov pointer-events-none absolute inset-0 z-[1]" />

      <div className="lab-scroll absolute inset-0 z-[2] flex flex-col overflow-y-auto p-3 lg:overflow-hidden">
        <header className="mb-2.5 flex flex-shrink-0 flex-wrap items-center gap-2">
          <BackButton />
          <h1
            className="font-[family-name:var(--font-cormorant)] italic font-medium text-[#C06080]"
            style={{
              fontSize: 'clamp(1.1rem,2.6vw,1.6rem)',
              letterSpacing: '0.04em',
              textShadow: '0 0 12px rgba(255,100,180,0.6)',
            }}
          >
            Assembly Result
          </h1>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPreviewMode((p) => !p);
                if (!previewMode) setSelectedId(null);
              }}
              className={[
                'cursor-pointer rounded border px-3 py-1.5 font-[family-name:var(--font-josefin)] text-[0.7rem] font-light tracking-[0.12em] transition',
                previewMode
                  ? 'border-[#A0FFB8] bg-[rgba(80,200,120,0.2)] text-[#A0FFB8]'
                  : 'border-[rgba(255,100,170,0.4)] bg-[rgba(255,30,130,0.15)] text-[#FFB0D4] hover:bg-[rgba(255,30,130,0.3)] hover:text-[#FFE0F0]',
              ].join(' ')}
              aria-label={previewMode ? 'Exit preview mode' : 'Enter preview mode'}
              aria-pressed={previewMode}
            >
              {previewMode ? '✓ Preview' : '👁 Preview'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="cursor-pointer rounded border border-[rgba(255,100,170,0.4)] bg-[rgba(255,30,130,0.15)] px-3 py-1.5 font-[family-name:var(--font-josefin)] text-[0.7rem] font-light tracking-[0.12em] text-[#FFB0D4] transition hover:bg-[rgba(255,30,130,0.3)] hover:text-[#FFE0F0] active:bg-[rgba(255,30,130,0.4)]"
              aria-label="Reset part positions"
            >
              ↺ Reset
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || cart.length === 0}
              className="cursor-pointer rounded border border-[#FF80C0] bg-gradient-to-br from-[#CC1166] to-[#880044] px-3 py-1.5 font-[family-name:var(--font-josefin)] text-[0.7rem] tracking-[0.12em] text-[#FFE0F0] shadow-[0_0_14px_rgba(204,17,102,0.4)] transition hover:from-[#EE2288] hover:to-[#CC1166] disabled:opacity-50 disabled:hover:from-[#CC1166] disabled:hover:to-[#880044]"
              aria-label="Save assembly as PNG"
            >
              {downloading ? '⏳ Saving…' : '💾 Save PNG'}
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1 lg:flex-row lg:overflow-hidden">
          {/* ── Stage ── */}
          <div className="flex flex-shrink-0 flex-col items-center gap-3">
            {/* Outer wrapper provides the visible frame; capture target (inner) is transparent */}
            <div
              className="relative flex-shrink-0 overflow-hidden rounded-lg border border-[rgba(255,100,180,0.2)] bg-[rgba(20,0,25,0.5)]"
              style={{ width: STAGE_W, height: STAGE_H, maxWidth: '92vw' }}
            >
              {/* Inner — TRANSPARENT background so PNG export has no fill */}
              <div
                ref={captureRef}
                className="relative h-full w-full touch-none"
                style={{ background: 'transparent' }}
                onPointerDown={(e) => {
                  // Tap on empty stage area → deselect (clears the selection ring)
                  if (e.target === e.currentTarget) setSelectedId(null);
                }}
              >
                {cart.map((part) => (
                  <DraggablePart
                    key={part.id}
                    part={part}
                    isSelected={!previewMode && selectedId === part.id}
                    storedOffset={partOffsets[part.id] ?? { x: 0, y: 0 }}
                    scale={partScales[part.id] ?? 1}
                    onSelect={() => !previewMode && setSelectedId(part.id)}
                    onCommit={(o) => setPartOffset(part.id, o)}
                  />
                ))}

                {cart.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center px-4 text-center font-[family-name:var(--font-josefin)] text-xs font-extralight tracking-[0.12em] text-[rgba(255,150,200,0.55)]">
                    No parts on stage
                  </div>
                )}
              </div>
            </div>

            {/* ── Nudge & scale controls (desktop only — mobile uses floating FABs below) ── */}
            {!previewMode && selectedPart && (
              <div className="hidden flex-col items-center gap-1.5 rounded-md border border-[rgba(255,100,180,0.25)] bg-[rgba(20,0,25,0.85)] p-2 backdrop-blur-sm lg:flex">
                <div className="font-[family-name:var(--font-josefin)] text-[0.62rem] font-light tracking-[0.12em] text-[#FFB0D4]">
                  Adjust: <span className="text-[#FFE0F0]">{selectedPart.name}</span>
                  {selectedOffset &&
                    (selectedOffset.x !== 0 || selectedOffset.y !== 0) && (
                      <span className="ml-1.5 text-[#A0FFB8]">
                        pos({selectedOffset.x}, {selectedOffset.y})
                      </span>
                    )}
                  {selectedScale !== 1 && (
                    <span className="ml-1.5 text-[#A0FFB8]">
                      ×{selectedScale.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Position pad */}
                <div className="grid grid-cols-3 gap-1">
                  <span />
                  <NudgeBtn label="▲" onClick={() => nudge(0, -1)} aria="Move up 1px" />
                  <span />
                  <NudgeBtn label="◀" onClick={() => nudge(-1, 0)} aria="Move left 1px" />
                  <NudgeBtn
                    label="●"
                    onClick={() => selectedId && setPartOffset(selectedId, { x: 0, y: 0 })}
                    aria="Center this part"
                  />
                  <NudgeBtn label="▶" onClick={() => nudge(1, 0)} aria="Move right 1px" />
                  <span />
                  <NudgeBtn label="▼" onClick={() => nudge(0, 1)} aria="Move down 1px" />
                  <span />
                </div>

                {/* 10px shifts */}
                <div className="flex gap-1">
                  <NudgeBtn label="◀10" onClick={() => nudge(-10, 0)} aria="Move left 10px" small />
                  <NudgeBtn label="▲10" onClick={() => nudge(0, -10)} aria="Move up 10px" small />
                  <NudgeBtn label="▼10" onClick={() => nudge(0, 10)} aria="Move down 10px" small />
                  <NudgeBtn label="10▶" onClick={() => nudge(10, 0)} aria="Move right 10px" small />
                </div>

                {/* Scale row */}
                <div className="mt-1 flex items-center gap-1.5 border-t border-[rgba(255,100,180,0.2)] pt-1.5">
                  <span className="font-[family-name:var(--font-josefin)] text-[0.55rem] tracking-[0.1em] text-[rgba(255,150,200,0.7)]">
                    SIZE
                  </span>
                  <NudgeBtn label="−" onClick={() => adjustScale(-0.05)} aria="Shrink 5%" />
                  <NudgeBtn label="−1%" onClick={() => adjustScale(-0.01)} aria="Shrink 1%" small />
                  <button
                    type="button"
                    onClick={() => selectedId && setPartScale(selectedId, 1)}
                    className="cursor-pointer rounded border border-[rgba(255,100,170,0.4)] bg-[rgba(255,30,130,0.15)] px-1.5 py-0.5 font-[family-name:var(--font-josefin)] text-[0.55rem] tracking-[0.08em] text-[#FFB0D4] transition hover:bg-[rgba(255,30,130,0.35)] hover:text-[#FFE0F0]"
                    aria-label="Reset scale to 100%"
                  >
                    {(selectedScale * 100).toFixed(0)}%
                  </button>
                  <NudgeBtn label="+1%" onClick={() => adjustScale(0.01)} aria="Grow 1%" small />
                  <NudgeBtn label="+" onClick={() => adjustScale(0.05)} aria="Grow 5%" />
                </div>
              </div>
            )}

            <p className="max-w-[300px] text-center font-[family-name:var(--font-josefin)] text-[0.62rem] font-extralight leading-relaxed tracking-[0.1em] text-[rgba(255,150,200,0.6)]">
              {previewMode
                ? 'Preview mode · Tap 👁 to edit again'
                : 'Tap part = select · Empty area = deselect · 👁 = clean view'}
            </p>
          </div>

          {/* ── Info panel ── */}
          <div className="lab-scroll flex flex-col gap-2 p-1 lg:flex-1 lg:overflow-y-auto">
            {cart.length === 0 ? (
              <div className="px-3 py-8 text-center font-[family-name:var(--font-josefin)] text-xs font-extralight leading-8 tracking-[0.12em] text-[rgba(255,150,200,0.6)]">
                No parts selected.
                <br />
                Add parts to your cart first.
              </div>
            ) : (
              cart.map((part) => {
                const offset = partOffsets[part.id];
                const sc = partScales[part.id] ?? 1;
                const moved = offset && (offset.x !== 0 || offset.y !== 0);
                const scaled = sc !== 1;
                const isSel = selectedId === part.id;
                return (
                  <button
                    type="button"
                    key={part.id}
                    onClick={() => setSelectedId(part.id)}
                    className={[
                      'flex w-full items-center gap-2 rounded border px-2.5 py-1.5 text-left transition',
                      isSel
                        ? 'border-[#FF80C0] bg-[rgba(80,0,60,0.7)]'
                        : 'border-[rgba(255,100,180,0.15)] bg-[rgba(255,100,180,0.06)] hover:border-[rgba(255,100,180,0.35)]',
                    ].join(' ')}
                  >
                    <Image
                      src={part.url}
                      alt={part.name}
                      width={44}
                      height={38}
                      className="h-[38px] w-11 flex-shrink-0 object-contain"
                      unoptimized
                    />
                    <div className="flex-1">
                      <div className="font-[family-name:var(--font-josefin)] text-[0.72rem] font-light tracking-[0.06em] text-[#FFB0D4]">
                        {part.name}
                      </div>
                      <div className="mt-0.5 font-[family-name:var(--font-josefin)] text-[0.6rem] font-extralight tracking-[0.18em] text-[rgba(255,150,200,0.55)]">
                        {CAT_LABEL[part.cat]} Part
                        {moved && (
                          <span className="ml-1.5 text-[#A0FFB8]">
                            · ({offset!.x}, {offset!.y})
                          </span>
                        )}
                        {scaled && (
                          <span className="ml-1.5 text-[#A0FFB8]">
                            · ×{sc.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile-only floating control pads ── */}
      {!previewMode && selectedPart && (
        <div className="lg:hidden">
          {/* Expanded pad (appears above FABs when active) */}
          <AnimatePresence>
            {activePad && (
              <motion.div
                key={activePad}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="fixed bottom-[72px] left-1/2 z-40 -translate-x-1/2"
              >
                <div
                  className="flex min-w-[230px] flex-col items-center gap-2 rounded-lg border border-[rgba(255,100,180,0.4)] bg-[rgba(20,0,25,0.95)] p-3 backdrop-blur-md"
                  style={{ boxShadow: '0 0 20px rgba(255,100,180,0.25), 0 8px 24px rgba(0,0,0,0.6)' }}
                >
                  <div className="flex w-full items-center justify-between border-b border-[rgba(255,100,180,0.2)] pb-1.5">
                    <span className="font-[family-name:var(--font-josefin)] text-[0.62rem] tracking-[0.15em] text-[#FFB0D4]">
                      {activePad === 'move' ? '✋ MOVE' : '⤢ SIZE'}
                      <span className="ml-2 text-[#FFE0F0]">{selectedPart.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActivePad(null)}
                      aria-label="Close pad"
                      className="text-[rgba(255,150,200,0.6)] transition hover:text-[#FFE0F0]"
                    >
                      ✕
                    </button>
                  </div>

                  {activePad === 'move' ? (
                    <>
                      {selectedOffset && (selectedOffset.x !== 0 || selectedOffset.y !== 0) && (
                        <div className="font-[family-name:var(--font-josefin)] text-[0.6rem] tracking-[0.1em] text-[#A0FFB8]">
                          pos({selectedOffset.x}, {selectedOffset.y})
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        <span />
                        <NudgeBtn label="▲" onClick={() => nudge(0, -1)} aria="Up 1px" big />
                        <span />
                        <NudgeBtn label="◀" onClick={() => nudge(-1, 0)} aria="Left 1px" big />
                        <NudgeBtn
                          label="●"
                          onClick={() => selectedId && setPartOffset(selectedId, { x: 0, y: 0 })}
                          aria="Center"
                          big
                        />
                        <NudgeBtn label="▶" onClick={() => nudge(1, 0)} aria="Right 1px" big />
                        <span />
                        <NudgeBtn label="▼" onClick={() => nudge(0, 1)} aria="Down 1px" big />
                        <span />
                      </div>
                      <div className="flex gap-1.5">
                        <NudgeBtn label="◀10" onClick={() => nudge(-10, 0)} aria="Left 10" small />
                        <NudgeBtn label="▲10" onClick={() => nudge(0, -10)} aria="Up 10" small />
                        <NudgeBtn label="▼10" onClick={() => nudge(0, 10)} aria="Down 10" small />
                        <NudgeBtn label="10▶" onClick={() => nudge(10, 0)} aria="Right 10" small />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Large value display */}
                      <div
                        className="font-[family-name:var(--font-cormorant)] italic text-3xl font-medium leading-none tabular-nums text-[#FFE0F0]"
                        style={{ textShadow: '0 0 14px rgba(255,100,180,0.65)' }}
                      >
                        {(selectedScale * 100).toFixed(0)}
                        <span className="ml-0.5 text-xl text-[#C06080]">%</span>
                      </div>

                      {/* Slider 30% ~ 300% */}
                      <div className="flex w-full items-center gap-2 px-1">
                        <span className="font-[family-name:var(--font-josefin)] text-[0.55rem] tracking-[0.08em] text-[rgba(255,150,200,0.55)]">
                          30
                        </span>
                        <input
                          type="range"
                          min={0.3}
                          max={3}
                          step={0.01}
                          value={selectedScale}
                          onChange={(e) =>
                            selectedId &&
                            setPartScale(
                              selectedId,
                              Math.round(Number(e.target.value) * 100) / 100,
                            )
                          }
                          className="lab-slider flex-1"
                          aria-label="Scale slider"
                        />
                        <span className="font-[family-name:var(--font-josefin)] text-[0.55rem] tracking-[0.08em] text-[rgba(255,150,200,0.55)]">
                          300
                        </span>
                      </div>

                      {/* Fine controls */}
                      <div className="flex items-center gap-1.5">
                        <NudgeBtn label="−5" onClick={() => adjustScale(-0.05)} aria="Shrink 5%" small />
                        <NudgeBtn label="−1" onClick={() => adjustScale(-0.01)} aria="Shrink 1%" small />
                        <button
                          type="button"
                          onClick={() => selectedId && setPartScale(selectedId, 1)}
                          className="h-7 cursor-pointer rounded border border-[rgba(255,100,170,0.5)] bg-[rgba(255,30,130,0.15)] px-2 font-[family-name:var(--font-josefin)] text-[0.6rem] tracking-[0.1em] text-[#FFB0D4] transition hover:bg-[rgba(255,30,130,0.35)] hover:text-[#FFE0F0]"
                          aria-label="Reset to 100%"
                        >
                          ↺ 100%
                        </button>
                        <NudgeBtn label="+1" onClick={() => adjustScale(0.01)} aria="Grow 1%" small />
                        <NudgeBtn label="+5" onClick={() => adjustScale(0.05)} aria="Grow 5%" small />
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FAB row (fixed at bottom-center) */}
          <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-2">
            <FabButton
              icon="✋"
              label="Move"
              active={activePad === 'move'}
              onClick={() => setActivePad((p) => (p === 'move' ? null : 'move'))}
            />
            <FabButton
              icon="⤢"
              label="Size"
              active={activePad === 'size'}
              onClick={() => setActivePad((p) => (p === 'size' ? null : 'size'))}
            />
          </div>
        </div>
      )}
    </motion.section>
  );
}

// ── FAB button (mobile floating control trigger) ──
function FabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={[
        'flex h-12 items-center gap-1.5 rounded-full border px-4 font-[family-name:var(--font-josefin)] text-[0.68rem] tracking-[0.12em] backdrop-blur-md transition',
        active
          ? 'border-[#FF80C0] bg-gradient-to-br from-[#CC1166] to-[#880044] text-[#FFE0F0] shadow-[0_0_20px_rgba(255,30,140,0.55)]'
          : 'border-[rgba(255,100,180,0.45)] bg-[rgba(20,0,25,0.85)] text-[#FFB0D4] shadow-[0_4px_12px_rgba(0,0,0,0.5),0_0_10px_rgba(255,100,180,0.15)] hover:text-[#FFE0F0]',
      ].join(' ')}
    >
      <span className="text-sm">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ── Nudge button ──
function NudgeBtn({
  label,
  onClick,
  aria,
  small,
  big,
}: {
  label: string;
  onClick: () => void;
  aria: string;
  small?: boolean;
  big?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={aria}
      className={[
        'cursor-pointer select-none rounded border border-[rgba(255,100,170,0.4)] bg-[rgba(255,30,130,0.15)] font-[family-name:var(--font-josefin)] text-[#FFB0D4] transition hover:bg-[rgba(255,30,130,0.35)] hover:text-[#FFE0F0] active:bg-[rgba(255,30,130,0.5)]',
        big
          ? 'h-11 w-11 text-base'
          : small
            ? 'px-2 py-0.5 text-[0.55rem] tracking-[0.08em]'
            : 'h-7 w-7 text-[0.7rem]',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

// ── Draggable part using motion values for direct, pixel-precise control ──
function DraggablePart({
  part,
  isSelected,
  storedOffset,
  scale,
  onSelect,
  onCommit,
}: {
  part: Part;
  isSelected: boolean;
  storedOffset: Offset;
  scale: number;
  onSelect: () => void;
  onCommit: (o: Offset) => void;
}) {
  const pos = ASM_POS[part.cat];
  const z = ASM_Z[part.cat] ?? 1;

  const x = useMotionValue(storedOffset.x);
  const y = useMotionValue(storedOffset.y);

  // Sync motion values when external state changes (reset, nudge buttons)
  useEffect(() => {
    x.set(storedOffset.x);
    y.set(storedOffset.y);
  }, [storedOffset.x, storedOffset.y, x, y]);

  if (!pos) return null;

  // Stage-relative drag bounds
  const halfW = pos.w / 2;
  const constraints = {
    left: -(STAGE_W / 2 - halfW * 0.3),
    right: STAGE_W / 2 - halfW * 0.3,
    top: -pos.top - 20,
    bottom: STAGE_H - pos.top - 60,
  };

  const handleDragEnd = (_: unknown, _info: PanInfo) => {
    onCommit({ x: Math.round(x.get()), y: Math.round(y.get()) });
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={constraints}
      style={{
        position: 'absolute',
        top: pos.top,
        left: '50%',
        marginLeft: -pos.w / 2,
        width: pos.w,
        zIndex: z,
        x,
        y,
        cursor: 'grab',
      }}
      whileDrag={{ cursor: 'grabbing' }}
      onPointerDown={onSelect}
      onDragEnd={handleDragEnd}
      className={
        isSelected
          ? 'rounded-md ring-2 ring-[#FF80C0] ring-offset-2 ring-offset-transparent'
          : ''
      }
    >
      {/* Inner wrapper handles scale so the outer drag transform isn't affected */}
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      >
        {/* Plain img for predictable html-to-image capture */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={part.url}
          alt={part.name}
          width={pos.w}
          draggable={false}
          className="block select-none"
          style={{ width: pos.w, height: 'auto', pointerEvents: 'none' }}
        />
      </div>
    </motion.div>
  );
}
