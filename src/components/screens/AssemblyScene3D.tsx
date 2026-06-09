'use client';

// ── Phase 1: 2.5D assembly scene (behind ?exp=3d) ──
// Reuses the existing flat SVG parts as textured planes on a 3D stage with
// pointer-driven tilt, parallax depth (from ASM_Z) and a ground shadow.
// Built on the Phase 0 foundation (SOCKETS / capture-3d) and the additive
// PartNode renderer switch (sprite → billboard3d → mesh) so later phases
// only swap a render branch, never rewrite the scene.

import { Suspense, useEffect, useRef, useState } from 'react';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Outlines, useTexture } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

import BackButton from '@/components/ui/BackButton';

import { captureScenePng, downloadDataUrl, type CaptureContext } from '@/lib/capture-3d';
import { BACKGROUNDS, CAT_LABEL, type Part } from '@/lib/parts-data';
import { offsetToWorld, socketForPart } from '@/lib/scene-3d';
import { useLabStore } from '@/lib/store';

// ── Capture bridge: exposes the live renderer to the outer Save button ──
function CaptureBridge({ apiRef }: { apiRef: React.RefObject<(() => string) | null> }) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    const ctx: CaptureContext = { gl, scene, camera };

    apiRef.current = () => captureScenePng(ctx, 3);

    return () => {
      apiRef.current = null;
    };
  }, [gl, scene, camera, apiRef]);

  return null;
}

// ── Pointer-driven diorama tilt (Phase 1 stand-in for full OrbitControls) ──
function TiltGroup({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    const g = ref.current;

    if (!g) return;
    const targetY = state.pointer.x * 0.35;
    const targetX = -state.pointer.y * 0.18;

    g.rotation.y += (targetY - g.rotation.y) * 0.06;
    g.rotation.x += (targetX - g.rotation.x) * 0.06;
  });

  return <group ref={ref}>{children}</group>;
}

// ── Part renderer (additive switch) ──
// Phase 1 implements 'sprite'. 'billboard3d' (Phase 2) and 'mesh' (Phase 3)
// fall back to sprite until those phases land.
function PartNode({
  part,
  selected,
  onSelect,
}: {
  part: Part;
  selected: boolean;
  onSelect: () => void;
}) {
  const offset = useLabStore((s) => s.partOffsets[part.id]) ?? { x: 0, y: 0 };
  const scale = useLabStore((s) => s.partScales[part.id]) ?? 1;
  const rotY = useLabStore((s) => s.partRotations[part.id]) ?? 0;

  const texture = useTexture(part.url, (t) => {
    const tex = Array.isArray(t) ? t[0] : t;

    tex.colorSpace = THREE.SRGBColorSpace;
  });

  const socket = socketForPart(part);
  const img = texture.image as { width: number; height: number } | undefined;
  const aspect = img && img.height ? img.width / img.height : 1;
  const w = socket.widthUnit;
  const h = w / aspect;

  const [ox, oy] = offsetToWorld(offset);
  // Top-anchor like the 2D `top` value, then apply the user's offset.
  const y = socket.topUnit - h / 2 + oy;

  return (
    <group position={[ox, y, socket.depth]} rotation={[0, rotY, 0]} scale={scale}>
      <mesh
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.5}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
        {selected && <Outlines thickness={4} color="#FF80C0" screenspace />}
      </mesh>
    </group>
  );
}

function Stage({
  cart,
  selectedId,
  onSelect,
}: {
  cart: Part[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 4, 5]} intensity={0.6} />

      <TiltGroup>
        <Suspense fallback={null}>
          {cart.map((part) => (
            <PartNode
              key={part.id}
              part={part}
              selected={selectedId === part.id}
              onSelect={() => onSelect(part.id)}
            />
          ))}
        </Suspense>

        <ContactShadows
          position={[0, -2.3, 0]}
          opacity={0.35}
          scale={6}
          blur={2.4}
          far={4}
          color="#5a0030"
        />
      </TiltGroup>
    </>
  );
}

export default function AssemblyScene3D() {
  const cart = useLabStore((s) => s.cart);
  const partOffsets = useLabStore((s) => s.partOffsets);
  const partScales = useLabStore((s) => s.partScales);
  const partRotations = useLabStore((s) => s.partRotations);
  const setPartOffset = useLabStore((s) => s.setPartOffset);
  const setPartScale = useLabStore((s) => s.setPartScale);
  const setPartRotation = useLabStore((s) => s.setPartRotation);
  const resetPartTransforms = useLabStore((s) => s.resetPartTransforms);
  const setToast = useLabStore((s) => s.setToast);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const captureRef = useRef<(() => string) | null>(null);

  useEffect(() => {
    if (cart.length === 0) setSelectedId(null);
    else if (!selectedId || !cart.some((c) => c.id === selectedId)) {
      setSelectedId(cart[0].id);
    }
  }, [cart, selectedId]);

  const selectedPart = cart.find((p) => p.id === selectedId) ?? null;
  const offset = selectedId ? partOffsets[selectedId] ?? { x: 0, y: 0 } : { x: 0, y: 0 };
  const scale = selectedId ? partScales[selectedId] ?? 1 : 1;
  const rotY = selectedId ? partRotations[selectedId] ?? 0 : 0;

  const nudge = (dx: number, dy: number) => {
    if (!selectedId) return;
    setPartOffset(selectedId, { x: offset.x + dx, y: offset.y + dy });
  };

  const handleDownload = () => {
    if (!captureRef.current || cart.length === 0) {
      setToast('Add parts before downloading');

      return;
    }

    try {
      const url = captureRef.current();

      downloadDataUrl(url, `bearstein-3d-${cart.map((c) => c.id).join('')}.png`);
      setToast('PNG downloaded');
    } catch (err) {
      console.error(err);
      setToast('Download failed');
    }
  };

  return (
    <motion.section
      key="s4-3d"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 overflow-hidden bg-[#FFD1DC]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BACKGROUNDS.s4}
        alt=""
        className="absolute inset-0 z-0 h-full w-full object-cover object-center"
        style={{ filter: 'hue-rotate(300deg) saturate(1.4) brightness(0.6)' }}
      />
      <div className="scan-ov pointer-events-none absolute inset-0 z-[1]" />

      <header className="absolute left-0 right-0 top-0 z-[3] flex flex-wrap items-center gap-2 p-3">
        <BackButton />
        <h1
          className="font-[family-name:var(--font-cormorant)] font-medium italic text-[#C06080]"
          style={{
            fontSize: 'clamp(1.1rem,2.6vw,1.6rem)',
            letterSpacing: '0.04em',
            textShadow: '0 0 12px rgba(255,100,180,0.6)',
          }}
        >
          Assembly 3D <span className="text-[0.6em] not-italic text-[#A0FFB8]">· 2.5D</span>
        </h1>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => {
              resetPartTransforms();
              setToast('Positions, sizes & angles reset');
            }}
            className="cursor-pointer rounded border border-[rgba(255,100,170,0.4)] bg-[rgba(255,30,130,0.15)] px-3 py-1.5 font-[family-name:var(--font-josefin)] text-[0.7rem] font-light tracking-[0.12em] text-[#FFB0D4] transition hover:bg-[rgba(255,30,130,0.3)] hover:text-[#FFE0F0]"
          >
            ↺ Reset
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={cart.length === 0}
            className="cursor-pointer rounded border border-[#FF80C0] bg-gradient-to-br from-[#CC1166] to-[#880044] px-3 py-1.5 font-[family-name:var(--font-josefin)] text-[0.7rem] tracking-[0.12em] text-[#FFE0F0] shadow-[0_0_14px_rgba(204,17,102,0.4)] transition hover:from-[#EE2288] hover:to-[#CC1166] disabled:opacity-50"
          >
            💾 Save PNG
          </button>
        </div>
      </header>

      <div className="absolute inset-0 z-[2]">
        <Canvas
          dpr={[1, 2.5]}
          gl={{ preserveDrawingBuffer: true, alpha: true, antialias: true }}
          camera={{ position: [0, 0, 6], fov: 38 }}
          onPointerMissed={() => setSelectedId(null)}
        >
          <CaptureBridge apiRef={captureRef} />
          <Stage cart={cart} selectedId={selectedId} onSelect={setSelectedId} />
        </Canvas>
      </div>

      {cart.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center font-[family-name:var(--font-josefin)] text-xs font-extralight tracking-[0.12em] text-[rgba(255,150,200,0.6)]">
          No parts selected — add parts to your cart first.
        </div>
      )}

      {/* ── Transform controls for the selected part ── */}
      {selectedPart && (
        <div className="absolute bottom-4 left-1/2 z-[4] flex w-[min(92vw,340px)] -translate-x-1/2 flex-col gap-2 rounded-lg border border-[rgba(255,100,180,0.35)] bg-[rgba(20,0,25,0.92)] p-3 backdrop-blur-md">
          <div className="font-[family-name:var(--font-josefin)] text-[0.62rem] font-light tracking-[0.12em] text-[#FFB0D4]">
            {selectedPart.catV2 ?? CAT_LABEL[selectedPart.cat]} · <span className="text-[#FFE0F0]">{selectedPart.name}</span>
          </div>

          {/* Move + scale row */}
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-3 gap-1">
              <span />
              <Btn label="▲" onClick={() => nudge(0, -2)} />
              <span />
              <Btn label="◀" onClick={() => nudge(-2, 0)} />
              <Btn label="●" onClick={() => selectedId && setPartOffset(selectedId, { x: 0, y: 0 })} />
              <Btn label="▶" onClick={() => nudge(2, 0)} />
              <span />
              <Btn label="▼" onClick={() => nudge(0, 2)} />
              <span />
            </div>

            <div className="flex flex-1 flex-col gap-1.5">
              <label className="flex items-center gap-2">
                <span className="w-9 font-[family-name:var(--font-josefin)] text-[0.55rem] tracking-[0.1em] text-[rgba(255,150,200,0.7)]">
                  SIZE
                </span>
                <input
                  type="range"
                  min={0.3}
                  max={3}
                  step={0.01}
                  value={scale}
                  onChange={(e) =>
                    selectedId && setPartScale(selectedId, Math.round(Number(e.target.value) * 100) / 100)
                  }
                  className="lab-slider flex-1"
                  aria-label="Scale"
                />
                <span className="w-9 text-right font-[family-name:var(--font-josefin)] text-[0.6rem] tabular-nums text-[#A0FFB8]">
                  {(scale * 100).toFixed(0)}%
                </span>
              </label>
              <label className="flex items-center gap-2">
                <span className="w-9 font-[family-name:var(--font-josefin)] text-[0.55rem] tracking-[0.1em] text-[rgba(255,150,200,0.7)]">
                  TURN
                </span>
                <input
                  type="range"
                  min={-Math.PI}
                  max={Math.PI}
                  step={0.01}
                  value={rotY}
                  onChange={(e) => selectedId && setPartRotation(selectedId, Number(e.target.value))}
                  className="lab-slider flex-1"
                  aria-label="Y rotation"
                />
                <span className="w-9 text-right font-[family-name:var(--font-josefin)] text-[0.6rem] tabular-nums text-[#A0FFB8]">
                  {Math.round((rotY * 180) / Math.PI)}°
                </span>
              </label>
            </div>
          </div>

          {/* Part picker */}
          <div className="flex flex-wrap gap-1 border-t border-[rgba(255,100,180,0.2)] pt-2">
            {cart.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={[
                  'rounded border px-2 py-1 font-[family-name:var(--font-josefin)] text-[0.55rem] tracking-[0.08em] transition',
                  selectedId === p.id
                    ? 'border-[#FF80C0] bg-[rgba(80,0,60,0.7)] text-[#FFE0F0]'
                    : 'border-[rgba(255,100,180,0.2)] text-[#FFB0D4] hover:border-[rgba(255,100,180,0.4)]',
                ].join(' ')}
              >
                {p.catV2 ?? CAT_LABEL[p.cat]}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.section>
  );
}

function Btn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-7 w-7 cursor-pointer select-none rounded border border-[rgba(255,100,170,0.4)] bg-[rgba(255,30,130,0.15)] font-[family-name:var(--font-josefin)] text-[0.7rem] text-[#FFB0D4] transition hover:bg-[rgba(255,30,130,0.35)] hover:text-[#FFE0F0]"
    >
      {label}
    </button>
  );
}
