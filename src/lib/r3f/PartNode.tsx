'use client';

// The additive part renderer. A part is placed at its socket (shared 2D/3D
// source of truth) and rendered by one of three strategies:
//   sprite      — flat SVG texture plane               (Phase 1, implemented)
//   billboard3d — depth + shading + extruded SVG       (Phase 2, TODO)
//   mesh        — real GLTF mesh                        (Phase 3, TODO)
// Upgrading a part to true 3D is: add part.model + a `mesh` branch here.
// The scene graph around it never changes.

import { Outlines, useTexture } from '@react-three/drei';
import * as THREE from 'three';

import { type Part } from '@/lib/parts-data';
import { offsetToWorld, socketForPart } from '@/lib/scene-3d';
import { useLabStore } from '@/lib/store';

type Props = {
  part: Part;
  selected: boolean;
  onSelect: () => void;
};

export function PartNode({ part, selected, onSelect }: Props) {
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
      {/* sprite branch — Phase 1. billboard3d / mesh branches slot in here. */}
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
