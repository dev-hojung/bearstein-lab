'use client';

// Shared lighting preset for all 3D screens (M1 — common r3f library).
// Kept intentionally simple while parts are unlit sprites; matters once
// lit meshes (Phase 3) land. Tune here once, reuse everywhere.

export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 4, 5]} intensity={0.6} />
    </>
  );
}
