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

export const SHELF_ZONES: readonly ShelfZone[] = [
  { id: 'ears', x1: 0.3, x2: 0.68, y1: 0.095, y2: 0.27 },
  { id: 'eyes', x1: 0.3, x2: 0.68, y1: 0.28, y2: 0.42 },
  { id: 'ghost', x1: 0.3, x2: 0.68, y1: 0.445, y2: 0.57 },
  { id: 'hands', x1: 0.3, x2: 0.68, y1: 0.615, y2: 0.74 },
  { id: 'shoes', x1: 0.3, x2: 0.68, y1: 0.755, y2: 0.91 },
] as const;

export type LabAssetVariant = 'ref' | 'new';

export const LAB_SCENE_ASSETS: Record<LabAssetVariant, { bright: string; dark: string }> = {
  ref: {
    bright: '/images/bg/lab-bright.jpg',
    dark: '/images/bg/lab-dark.jpg',
  },
  new: {
    bright: '/images/bg/lab-new.jpg',
    dark: '/images/bg/lab-new.jpg',
  },
};

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
