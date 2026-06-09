// ── Phase 0 foundation: 3D socket coordinate system ──
// Derives a 3D anchor for each part from the SAME source of truth as the 2D
// AssemblyScreen (assemblyPosFor / assemblyZFor), so the 3D scene mirrors the
// familiar 2D arrangement and correctly handles v2 slots (ears/eyes/ghost/
// hands/shoes) as well as legacy v1 categories (head/body/arm/leg).
//
// This socket resolver is INVARIANT across Phase 1 (2.5D), Phase 2 (hybrid),
// and Phase 3 (true meshes): parts always attach here regardless of how they
// are rendered (sprite | billboard3d | mesh).

import { assemblyPosFor, assemblyZFor, type Part } from './parts-data';

/** 1 screen pixel = this many world units. Keeps 3D layout in sync with the 2D stage. */
export const PX_TO_UNIT = 0.01;

/** Matches the 2D AssemblyScreen stage box. */
export const STAGE_W_PX = 300;
export const STAGE_H_PX = 440;

/** Spacing between depth layers (world units). Higher z = closer to camera. */
const DEPTH_GAP = 0.14;

export type Socket3D = {
  /** World-Y of the plane's TOP edge (top-anchored like the 2D `top` value). */
  topUnit: number;
  /** Plane width in world units (height is derived from each texture's aspect). */
  widthUnit: number;
  /** World-Z depth (parallax layer). */
  depth: number;
};

/** Resolve a 3D socket for a part using the shared 2D layout (v2 slot first, else v1 cat). */
export function socketForPart(part: Part): Socket3D {
  const { top, w } = assemblyPosFor(part);
  const z = assemblyZFor(part);

  return {
    topUnit: (STAGE_H_PX / 2 - top) * PX_TO_UNIT,
    widthUnit: w * PX_TO_UNIT,
    depth: (z - 2.5) * DEPTH_GAP,
  };
}

/** Convert a stored 2D pixel offset {x,y} into a world-space translation.
 *  Screen +x = world +x; screen +y (down) = world −y. Shared with the 2D screen. */
export function offsetToWorld(offset: { x: number; y: number }): [number, number] {
  return [offset.x * PX_TO_UNIT, -offset.y * PX_TO_UNIT];
}
