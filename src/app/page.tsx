'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLabStore } from '@/lib/store';
import type { Category, Part } from '@/lib/parts-data';
import LandingScreen from '@/components/screens/LandingScreen';
import CategoryScreen from '@/components/screens/CategoryScreen';
import SubcategoryScreen from '@/components/screens/SubcategoryScreen';
import AssemblyScreen from '@/components/screens/AssemblyScreen';
import CartWidget from '@/components/ui/CartWidget';
import CartPanel from '@/components/ui/CartPanel';
import Toast from '@/components/ui/Toast';
import SessionGuard from '@/components/ui/SessionGuard';

const EMPTY: Record<Category, Part[]> = { head: [], body: [], arm: [], leg: [] };

export default function Page() {
  const screen = useLabStore((s) => s.screen);
  const hydrated = useLabStore((s) => s.hydrated);
  const [partsMap, setPartsMap] = useState<Record<Category, Part[]>>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/parts')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.parts) setPartsMap(data.parts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#1a0018]">
      {hydrated && (
        <AnimatePresence mode="wait">
          {screen === 's1' && <LandingScreen />}
          {screen === 's2' && <CategoryScreen />}
          {screen === 's3' && <SubcategoryScreen partsMap={partsMap} />}
          {screen === 's4' && <AssemblyScreen />}
        </AnimatePresence>
      )}

      <CartWidget />
      <CartPanel />
      <Toast />
      <SessionGuard />
    </main>
  );
}
