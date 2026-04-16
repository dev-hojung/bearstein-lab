'use client';

import { AnimatePresence } from 'framer-motion';
import { useLabStore } from '@/lib/store';
import LandingScreen from '@/components/screens/LandingScreen';
import CategoryScreen from '@/components/screens/CategoryScreen';
import SubcategoryScreen from '@/components/screens/SubcategoryScreen';
import AssemblyScreen from '@/components/screens/AssemblyScreen';
import CartWidget from '@/components/ui/CartWidget';
import CartPanel from '@/components/ui/CartPanel';
import Toast from '@/components/ui/Toast';

export default function Page() {
  const screen = useLabStore((s) => s.screen);
  const hydrated = useLabStore((s) => s.hydrated);

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#1a0018]">
      {/* Wait for persist rehydration to avoid flicker between SSR (s1) and persisted screen */}
      {hydrated && (
        <AnimatePresence mode="wait">
          {screen === 's1' && <LandingScreen />}
          {screen === 's2' && <CategoryScreen />}
          {screen === 's3' && <SubcategoryScreen />}
          {screen === 's4' && <AssemblyScreen />}
        </AnimatePresence>
      )}

      <CartWidget />
      <CartPanel />
      <Toast />
    </main>
  );
}
