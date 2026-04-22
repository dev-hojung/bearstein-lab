'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Category, Part } from './parts-data';

export type Screen = 's1' | 's2' | 's3' | 's4';

export type Offset = { x: number; y: number };

type LabState = {
  screen: Screen;
  cat: Category;
  cart: Part[];
  cartOpen: boolean;
  toast: string | null;
  hydrated: boolean;
  /** Per-part nudge offsets in pixels relative to default ASM_POS, keyed by part id */
  partOffsets: Record<string, Offset>;
  /** Per-part scale multipliers (1.0 = default), keyed by part id */
  partScales: Record<string, number>;

  show: (s: Screen) => void;
  goToCategories: () => void;
  goToSub: (cat: Category) => void;
  goToAssembly: () => void;
  goBack: () => void;

  addOrReplace: (part: Part) => { replaced: Part | null };
  removeFromCart: (id: string) => void;

  toggleCart: () => void;
  closeCart: () => void;

  setPartOffset: (id: string, offset: Offset) => void;
  setPartScale: (id: string, scale: number) => void;
  resetPartTransforms: () => void;

  setToast: (msg: string | null) => void;
  _setHydrated: () => void;
};

export const useLabStore = create<LabState>()(
  persist(
    (set, get) => ({
      screen: 's1',
      cat: 'head',
      cart: [],
      cartOpen: false,
      toast: null,
      hydrated: false,
      partOffsets: {},
      partScales: {},

      show: (s) => set({ screen: s }),

      goToCategories: () => set({ screen: 's2' }),

      goToSub: (cat) => set({ cat, screen: 's3' }),

      goToAssembly: () => {
        if (get().cart.length === 0) {
          set({ toast: 'Your cart is empty' });
          return;
        }
        set({ screen: 's4', cartOpen: false });
      },

      goBack: () => {
        const s = get().screen;
        if (s === 's3') set({ screen: 's2' });
        else if (s === 's4') set({ screen: 's3' });
      },

      addOrReplace: (part) => {
        const cart = get().cart;
        const already = cart.some((c) => c.id === part.id);
        if (already) {
          set({ cart: cart.filter((c) => c.id !== part.id) });
          return { replaced: null };
        }
        const replaced = cart.find((c) => c.cat === part.cat) ?? null;
        set({ cart: [...cart.filter((c) => c.cat !== part.cat), part] });
        return { replaced };
      },

      removeFromCart: (id) =>
        set((s) => ({ cart: s.cart.filter((c) => c.id !== id) })),

      toggleCart: () => set((s) => ({ cartOpen: !s.cartOpen })),
      closeCart: () => set({ cartOpen: false }),

      setPartOffset: (id, offset) =>
        set((s) => ({ partOffsets: { ...s.partOffsets, [id]: offset } })),
      setPartScale: (id, scale) =>
        set((s) => ({
          partScales: {
            ...s.partScales,
            [id]: Math.max(0.3, Math.min(3, scale)),
          },
        })),
      resetPartTransforms: () => set({ partOffsets: {}, partScales: {} }),

      setToast: (msg) => set({ toast: msg }),
      _setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'bearstein-lab-cart',
      // Bumped when the persisted shape changes so stale v1 data (which
      // persisted `screen`/`cat`) doesn't get merged back in.
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // Deliberately do NOT persist `screen` or `cat`: v2 tracks the selected
      // shelf in page-local state, and persisting the screen stage causes a
      // blank render when a rehydrated screen expects state that was only held
      // in memory (e.g. s3 needs a selected LabCategory).
      partialize: (state) => ({
        cart: state.cart,
        partOffsets: state.partOffsets,
        partScales: state.partScales,
      }),
      onRehydrateStorage: () => (state) => {
        state?._setHydrated();
      },
    }
  )
);
