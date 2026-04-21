'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { AnimatePresence } from 'framer-motion';

import AssemblyScreen from '@/components/screens/AssemblyScreen';
import CategoryScreen from '@/components/screens/CategoryScreen';
import LabSceneScreen from '@/components/screens/LabSceneScreen';
import LandingScreen from '@/components/screens/LandingScreen';
import PartShelfScreen from '@/components/screens/PartShelfScreen';
import SubcategoryScreen from '@/components/screens/SubcategoryScreen';
import CartPanel from '@/components/ui/CartPanel';
import CartWidget from '@/components/ui/CartWidget';
import PixelHeartCursor from '@/components/ui/PixelHeartCursor';
import RotateOverlay from '@/components/ui/RotateOverlay';
import SessionGuard from '@/components/ui/SessionGuard';
import Toast from '@/components/ui/Toast';

import type { LabAssetVariant, LabCategory } from '@/lib/lab-scene-data';
import type { Category, Part } from '@/lib/parts-data';
import { runPixelGlitch } from '@/lib/pixel-glitch';
import { useLabStore } from '@/lib/store';

const EMPTY: Record<Category, Part[]> = { head: [], body: [], arm: [], leg: [] };

const subscribeUrl = (cb: () => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener('popstate', cb);

  return () => window.removeEventListener('popstate', cb);
};

const useSearchParam = (name: string): string | null =>
  useSyncExternalStore(
    subscribeUrl,
    () => (typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get(name)),
    () => null,
  );

export default function Page() {
  const screen = useLabStore((s) => s.screen);
  const hydrated = useLabStore((s) => s.hydrated);
  const show = useLabStore((s) => s.show);
  const [partsMap, setPartsMap] = useState<Record<Category, Part[]>>(EMPTY);
  const [labAsset, setLabAsset] = useState<LabAssetVariant>('ref');
  const [v2Cat, setV2Cat] = useState<LabCategory | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  const expV2 = useSearchParam('exp') === 'v2';

  useEffect(() => {
    fetch('/api/parts')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.parts) {
          setPartsMap(data.parts);
        }
      })
      .catch(() => {});
  }, []);

  const handlePickLabCat = (cat: LabCategory) => {
    const target = mainRef.current;

    if (!target) {
      setV2Cat(cat);
      show('s3');

      return;
    }

    runPixelGlitch(target, {
      onMid: () => {
        setV2Cat(cat);
        show('s3');
      },
    });
  };

  const handleBackFromShelf = () => {
    const target = mainRef.current;

    if (!target) {
      setV2Cat(null);
      show('s2');

      return;
    }

    runPixelGlitch(target, {
      onMid: () => {
        setV2Cat(null);
        show('s2');
      },
    });
  };

  const toggleAsset = () => setLabAsset((a) => (a === 'ref' ? 'new' : 'ref'));

  return (
    <main
      ref={mainRef}
      className="cursor-game fixed inset-0 overflow-hidden bg-[#FFD1DC]"
    >
      {hydrated && (
        <AnimatePresence mode="wait">
          {screen === 's1' && <LandingScreen />}
          {screen === 's2' &&
            (expV2 ? (
              <LabSceneScreen
                asset={labAsset}
                onPick={handlePickLabCat}
                onToggleAsset={toggleAsset}
              />
            ) : (
              <CategoryScreen />
            ))}
          {screen === 's3' &&
            (expV2 && v2Cat ? (
              <PartShelfScreen
                category={v2Cat}
                partsMap={partsMap}
                onBack={handleBackFromShelf}
              />
            ) : (
              <SubcategoryScreen partsMap={partsMap} />
            ))}
          {screen === 's4' && <AssemblyScreen />}
        </AnimatePresence>
      )}

      <CartWidget />
      <CartPanel />
      <Toast />
      <SessionGuard />
      <RotateOverlay />
      <PixelHeartCursor />
    </main>
  );
}
