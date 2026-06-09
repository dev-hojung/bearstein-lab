'use client';

// Bridges the live three.js renderer out to non-canvas UI (e.g. a Save
// button rendered in HTML). Mounts inside <Canvas>; writes a capture
// callback into the provided ref. Reusable across 3D screens.

import { useEffect, type RefObject } from 'react';

import { useThree } from '@react-three/fiber';

import { captureScenePng, type CaptureContext } from '@/lib/capture-3d';

type Props = {
  apiRef: RefObject<(() => string) | null>;
  /** Supersampling factor for the exported PNG. */
  pixelRatio?: number;
};

export function CaptureBridge({ apiRef, pixelRatio = 3 }: Props) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    const ctx: CaptureContext = { gl, scene, camera };

    apiRef.current = () => captureScenePng(ctx, pixelRatio);

    return () => {
      apiRef.current = null;
    };
  }, [gl, scene, camera, apiRef, pixelRatio]);

  return null;
}
