export type Category = 'head' | 'body' | 'arm' | 'leg';

export type Part = {
  id: string;
  name: string;
  cat: Category;
  url: string;
};

export const BACKGROUNDS: Record<'s1' | 's2' | 's3' | 's4', string> = {
  s1: '/images/bg/bg-d493b4cb.jpg',
  s2: '/images/bg/bg-a9839c69.jpg',
  s3: '/images/bg/bg-a9839c69.jpg',
  s4: '/images/bg/bg-ecb30fd9.jpg',
};

export const CRT_THUMBS: Record<Category, string> = {
  head: '/images/bg/crt-head-d561dc7c.jpg',
  body: '/images/bg/crt-body-d561dc7c.jpg',
  arm: '/images/bg/crt-arm-d561dc7c.jpg',
  leg: '/images/bg/crt-leg-d561dc7c.jpg',
};

export const CART_ICON = '/images/bg/cart-65fa6f70.jpg';

export const CAT_NAMES: Record<Category, string> = {
  head: 'Head Collection',
  body: 'Body Collection',
  arm: 'Arm Collection',
  leg: 'Leg Collection',
};

export const CAT_EMOJI: Record<Category, string> = {
  head: '🐻',
  body: '🫀',
  arm: '🦾',
  leg: '🦿',
};

export const CAT_LABEL: Record<Category, string> = {
  head: 'Head',
  body: 'Body',
  arm: 'Arm',
  leg: 'Leg',
};

export const CAT_TAG: Record<Category, string> = {
  head: 'Head Parts',
  body: 'Body Parts',
  arm: 'Arm Parts',
  leg: 'Leg Parts',
};

// Assembly stage layout: position + z-index + width
export const ASM_POS: Record<Category, { top: number; w: number }> = {
  head: { top: 8, w: 145 },
  body: { top: 145, w: 135 },
  arm: { top: 148, w: 200 },
  leg: { top: 292, w: 170 },
};

export const ASM_Z: Record<Category, number> = {
  head: 4,
  body: 2,
  arm: 3,
  leg: 1,
};

export const CATEGORIES: Category[] = ['head', 'body', 'arm', 'leg'];

export const PARTS_DATA: Record<Category, Part[]> = {
  head: [
    { id: 'h0', name: 'Head Part α', cat: 'head', url: '/images/parts/h0.svg' },
    { id: 'h1', name: 'Head Part β', cat: 'head', url: '/images/parts/h1.svg' },
    { id: 'h2', name: 'Head Part γ', cat: 'head', url: '/images/parts/h2.svg' },
    { id: 'h3', name: 'Head Part δ', cat: 'head', url: '/images/parts/h3.svg' },
  ],
  body: [
    { id: 'b0', name: 'Body Part α', cat: 'body', url: '/images/parts/b0.svg' },
    { id: 'b1', name: 'Body Part β', cat: 'body', url: '/images/parts/b1.svg' },
    { id: 'b2', name: 'Body Part γ', cat: 'body', url: '/images/parts/b2.svg' },
    { id: 'b3', name: 'Body Part δ', cat: 'body', url: '/images/parts/b3.svg' },
  ],
  arm: [
    { id: 'a0', name: 'Arm Part α', cat: 'arm', url: '/images/parts/a0.svg' },
    { id: 'a1', name: 'Arm Part β', cat: 'arm', url: '/images/parts/a1.svg' },
    { id: 'a2', name: 'Arm Part γ', cat: 'arm', url: '/images/parts/a2.svg' },
    { id: 'a3', name: 'Arm Part δ', cat: 'arm', url: '/images/parts/a3.svg' },
  ],
  leg: [
    { id: 'l0', name: 'Leg Part α', cat: 'leg', url: '/images/parts/l0.svg' },
    { id: 'l1', name: 'Leg Part β', cat: 'leg', url: '/images/parts/l1.svg' },
    { id: 'l2', name: 'Leg Part γ', cat: 'leg', url: '/images/parts/l2.svg' },
    { id: 'l3', name: 'Leg Part δ', cat: 'leg', url: '/images/parts/l3.svg' },
  ],
};
