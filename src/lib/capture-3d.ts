// ── Phase 0 foundation: WebGL → PNG capture ──
// The 2D screen uses `html-to-image` (DOM snapshot), which CANNOT read WebGL
// pixels. This util renders the live three.js scene to a transparent PNG.
// Shared across all 3D phases.
//
// Requires the R3F <Canvas> to be created with `gl={{ preserveDrawingBuffer: true }}`
// so the drawing buffer is still readable when we grab the data URL.

import type { Camera, Scene, WebGLRenderer } from 'three';

export type CaptureContext = {
  gl: WebGLRenderer;
  scene: Scene;
  camera: Camera;
};

/**
 * Render the scene at an upscaled resolution and return a transparent PNG data URL.
 * Restores the original renderer size afterwards.
 */
export function captureScenePng(ctx: CaptureContext, pixelRatio = 3): string {
  const { gl, scene, camera } = ctx;

  const prevPixelRatio = gl.getPixelRatio();

  try {
    gl.setPixelRatio(pixelRatio);
    gl.render(scene, camera);

    return gl.domElement.toDataURL('image/png');
  } finally {
    gl.setPixelRatio(prevPixelRatio);
    gl.render(scene, camera);
  }
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');

  link.download = filename;
  link.href = dataUrl;
  link.click();
}
