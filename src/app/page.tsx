'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { AnimatePresence } from 'framer-motion';

import AssemblyScreen from '@/components/screens/AssemblyScreen';
import LabSceneScreen from '@/components/screens/LabSceneScreen';
import LandingScreen from '@/components/screens/LandingScreen';
import PartShelfScreen from '@/components/screens/PartShelfScreen';
import PixelHeartCursor from '@/components/ui/PixelHeartCursor';
import RotateOverlay from '@/components/ui/RotateOverlay';
import SessionGuard from '@/components/ui/SessionGuard';
import Toast from '@/components/ui/Toast';

import type { LabCategory } from '@/lib/lab-scene-data';
import type { Category, Part } from '@/lib/parts-data';
import { runPixelGlitch } from '@/lib/pixel-glitch';
import { useLabStore } from '@/lib/store';
import {
  buildSectionQuery,
  readSectionFromLocation,
  screenFromSection,
  sectionFromScreen,
} from '@/lib/url-section';

const EMPTY: Record<Category, Part[]> = { head: [], body: [], arm: [], leg: [] };

export default function Page() {
  const screen = useLabStore((s) => s.screen);
  const hydrated = useLabStore((s) => s.hydrated);
  const show = useLabStore((s) => s.show);
  const [partsMap, setPartsMap] = useState<Record<Category, Part[]>>(EMPTY);
  const [partsLoading, setPartsLoading] = useState(true);
  const [cat, setCat] = useState<LabCategory | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  // Flag: suppresses URL writes during the initial URL → state hydration so
  // we don't race the read and clobber the incoming section.
  const hydratedFromUrlRef = useRef(false);

  useEffect(() => {
    fetch('/api/parts')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.parts) {
          setPartsMap(data.parts);
        }
      })
      .catch(() => {})
      .finally(() => setPartsLoading(false));
  }, []);

  // URL → state: once the store has hydrated, read ?s= and ?cat= and drive
  // the initial screen from there. Also hooks popstate for browser back/forward.
  useEffect(() => {
    if (!hydrated) return;

    const applyFromLocation = () => {
      const { section, cat: urlCat } = readSectionFromLocation(window.location.search);
      const targetScreen = screenFromSection(section);
      // Guard: shelf without a valid cat collapses back to lab.
      if (targetScreen === 's3' && !urlCat) {
        show('s2');
        setCat(null);
        return;
      }
      setCat(urlCat);
      show(targetScreen);
    };

    applyFromLocation();
    hydratedFromUrlRef.current = true;

    window.addEventListener('popstate', applyFromLocation);
    return () => window.removeEventListener('popstate', applyFromLocation);
  }, [hydrated, show]);

  // state → URL: whenever screen or cat change after initial hydration, mirror
  // the state into the URL with pushState so back/forward traverses sections.
  useEffect(() => {
    if (!hydrated || !hydratedFromUrlRef.current) return;

    const section = sectionFromScreen(screen);
    const next = buildSectionQuery(section, cat);
    const current = window.location.search;
    if (next === current) return;
    window.history.pushState(null, '', next + window.location.hash);
  }, [screen, cat, hydrated]);

  // Safety net: s3 needs a LabCategory. If we land there without one, fall
  // back to lab instead of rendering nothing.
  useEffect(() => {
    if (hydrated && screen === 's3' && !cat) {
      show('s2');
    }
  }, [hydrated, screen, cat, show]);

  const handlePickLabCat = useCallback(
    (next: LabCategory) => {
      setCat(next);
      const target = mainRef.current;
      if (target) {
        runPixelGlitch(target, { duration: 520 });
      }
      show('s3');
    },
    [show],
  );

  const handleBackFromShelf = useCallback(() => {
    const target = mainRef.current;

    if (!target) {
      setCat(null);
      show('s2');
      return;
    }

    runPixelGlitch(target, {
      onMid: () => {
        setCat(null);
        show('s2');
      },
    });
  }, [show]);

  const handleGoToAssembly = useCallback(() => {
    const target = mainRef.current;
    if (target) {
      runPixelGlitch(target, { duration: 520 });
    }
    show('s4');
  }, [show]);

  const handleSwitchCategory = useCallback(
    (next: LabCategory) => {
      if (next === cat) return;
      const target = mainRef.current;
      // Short glitch flash for the feedback bite without stalling the switch.
      if (target) {
        runPixelGlitch(target, { duration: 300 });
      }
      setCat(next);
    },
    [cat],
  );

  return (
    <main
      ref={mainRef}
      className="cursor-game fixed inset-0 overflow-hidden bg-[#FFD1DC]"
    >
      {hydrated && (
        <AnimatePresence mode="wait">
          {screen === 's1' && <LandingScreen />}
          {screen === 's2' && <LabSceneScreen onPick={handlePickLabCat} />}
          {screen === 's3' && cat && (
            <PartShelfScreen
              category={cat}
              partsMap={partsMap}
              partsLoading={partsLoading}
              onBack={handleBackFromShelf}
              onCombine={handleGoToAssembly}
              onSwitchCategory={handleSwitchCategory}
            />
          )}
          {screen === 's4' && <AssemblyScreen />}
        </AnimatePresence>
      )}

      <Toast />
      <SessionGuard />
      <RotateOverlay />
      <PixelHeartCursor />
    </main>
  );
}
