export type LabCategory = 'ears' | 'eyes' | 'ghost' | 'hands' | 'shoes';

export const LAB_CATEGORIES: readonly LabCategory[] = [
  'ears',
  'eyes',
  'ghost',
  'hands',
  'shoes',
] as const;

export const LAB_CAT_NAMES: Record<LabCategory, string> = {
  ears: '귀 소체',
  eyes: '눈 소체',
  ghost: '몸통 소체',
  hands: '손 소체',
  shoes: '발 소체',
};

export const LAB_CAT_NAMES_LONG: Record<LabCategory, string> = {
  ears: '귀 소체 모음',
  eyes: '눈 소체 모음',
  ghost: '몸통 소체 모음',
  hands: '손 소체 모음',
  shoes: '발 소체 모음',
};

export type ShelfZone = {
  id: LabCategory;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
};

// Click zones tightened to the CENTER item of each shelf only (roughly 12% wide).
export const SHELF_ZONES: readonly ShelfZone[] = [
  { id: 'ears', x1: 0.44, x2: 0.56, y1: 0.11, y2: 0.255 },
  { id: 'eyes', x1: 0.44, x2: 0.56, y1: 0.295, y2: 0.4 },
  { id: 'ghost', x1: 0.44, x2: 0.56, y1: 0.45, y2: 0.56 },
  { id: 'hands', x1: 0.44, x2: 0.56, y1: 0.625, y2: 0.73 },
  { id: 'shoes', x1: 0.44, x2: 0.56, y1: 0.77, y2: 0.89 },
] as const;

export const LAB_SCENE_ASSETS = {
  bright: '/images/bg/lab-bright.webp',
  dark: '/images/bg/lab-dark.webp',
} as const;

// Standalone pre-rendered bg for the part-shelf screen (preview4 composition:
// cabinet on the left + empty tile slots on the right).
export const PART_SHELF_BG = '/images/bg/part-shelf-bg.webp';

// Click zones over the cabinet drawn into `part-shelf-bg.webp`. Coordinates
// are normalized percentages of the aspect-locked stage, so they scale
// with the stage on any viewport (mobile portrait, landscape, desktop).
//
// Every cell is forced to the SAME width × height (18% × 9%), so the
// `clip-path: polygon(...)` carved into `.shelf-screen` renders as an
// identical CRT silhouette on each shelf — no more "top shelf looks
// right, the others look squashed" drift.
export const CABINET_SHELF_ZONES: readonly ShelfZone[] = [
  { id: 'ears', x1: 0.11, x2: 0.29, y1: 0.24, y2: 0.33 },
  { id: 'eyes', x1: 0.11, x2: 0.29, y1: 0.36, y2: 0.45 },
  { id: 'ghost', x1: 0.11, x2: 0.29, y1: 0.46, y2: 0.55 },
  { id: 'hands', x1: 0.11, x2: 0.29, y1: 0.57, y2: 0.66 },
  { id: 'shoes', x1: 0.11, x2: 0.29, y1: 0.69, y2: 0.78 },
] as const;

export const PARTS_SHELF_ASSET = '/images/bg/parts-shelf.jpg';

export const LAB_BASE_W = 1368;
export const LAB_BASE_H = 784;

import type { Category } from './parts-data';

export const V2_TO_V1_CATEGORY: Record<LabCategory, Category> = {
  ears: 'head',
  eyes: 'head',
  ghost: 'body',
  hands: 'arm',
  shoes: 'leg',
};
