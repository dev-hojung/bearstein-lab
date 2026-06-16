'use client';

// Loads a GLB and auto-frames it (centered + camera-fit). Used for the
// whole-bear 3D preview (M3 PoC) and reusable for any single-model view.
// Geometry is light; textures are WebP-compressed at build of the asset,
// so no Draco/meshopt decoder is required by useGLTF.

import { Suspense } from 'react';

import { Bounds, Center, useGLTF } from '@react-three/drei';

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  return <primitive object={scene} />;
}

export function GltfModel({ url, margin = 1.2 }: { url: string; margin?: number }) {
  return (
    <Suspense fallback={null}>
      <Bounds fit clip observe margin={margin}>
        <Center>
          <Model url={url} />
        </Center>
      </Bounds>
    </Suspense>
  );
}

export const preloadGltf = (url: string) => useGLTF.preload(url);
