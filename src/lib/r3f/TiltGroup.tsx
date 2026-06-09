'use client';

// Pointer-driven diorama tilt — a gentle parallax that follows the cursor.
// Phase 1 stand-in for full OrbitControls; reusable across 3D screens.

import { useRef, type ReactNode } from 'react';

import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

type Props = {
  children: ReactNode;
  /** Max yaw (radians) at the pointer's horizontal extremes. */
  maxYaw?: number;
  /** Max pitch (radians) at the pointer's vertical extremes. */
  maxPitch?: number;
  /** Lerp factor toward the target each frame (0–1). */
  ease?: number;
};

export function TiltGroup({ children, maxYaw = 0.35, maxPitch = 0.18, ease = 0.06 }: Props) {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    const g = ref.current;

    if (!g) return;
    const targetY = state.pointer.x * maxYaw;
    const targetX = -state.pointer.y * maxPitch;

    g.rotation.y += (targetY - g.rotation.y) * ease;
    g.rotation.x += (targetX - g.rotation.x) * ease;
  });

  return <group ref={ref}>{children}</group>;
}
