'use client';

import type { MouseEvent as ReactMouseEvent } from 'react';
import { useRef } from 'react';

import Image from 'next/image';

import { motion } from 'framer-motion';

import VhsHud from '@/components/ui/VhsHud';

import { useLabStore } from '@/lib/store';

const INTRO_BG = '/images/bg/intro.webp';
const INTRO_W = 1342;
const INTRO_H = 768;

const GLITCH_LAYER_STYLE = {
  backgroundImage: `url(${INTRO_BG})`,
  backgroundSize: 'contain',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  imageRendering: 'pixelated' as const,
};

export default function LandingScreen() {
  const goToCategories = useLabStore((s) => s.goToCategories);
  const sectionRef = useRef<HTMLElement>(null);

  const handleEnter = (e: ReactMouseEvent) => {
    const section = sectionRef.current;

    if (section) {
      const rect = section.getBoundingClientRect();
      const ripple = document.createElement('div');

      ripple.className = 'ripple';
      ripple.style.left = `${e.clientX - rect.left}px`;
      ripple.style.top = `${e.clientY - rect.top}px`;
      section.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 500);
    }

    window.setTimeout(() => goToCategories(), 220);
  };

  return (
    <motion.section
      ref={sectionRef}
      key="s1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#f6d7e3]"
      onClick={handleEnter}
    >
      <div
        className="relative"
        style={{
          width: `min(100vw, calc(100vh * ${INTRO_W / INTRO_H}))`,
          aspectRatio: `${INTRO_W} / ${INTRO_H}`,
        }}
      >
        <Image
          src={INTRO_BG}
          alt="Bearstein's Laboratory"
          fill
          priority
          unoptimized
          sizes="100vw"
          className="z-0 animate-(--animate-crt-flicker) object-contain"
          style={{ imageRendering: 'pixelated' }}
        />

        <div
          className="pointer-events-none absolute inset-0 z-[1] mix-blend-screen animate-(--animate-glitch-r)"
          style={GLITCH_LAYER_STYLE}
        />
        <div
          className="pointer-events-none absolute inset-0 z-[1] mix-blend-screen animate-(--animate-glitch-b)"
          style={GLITCH_LAYER_STYLE}
        />

        <div className="vignette-ov pointer-events-none absolute inset-0 z-[2]" />
        <div className="scan-ov animate-(--animate-scan-drift) pointer-events-none absolute inset-0 z-[3] opacity-40" />
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleEnter(e);
        }}
        className="absolute inset-0 z-[4]"
        aria-label="Enter the laboratory"
      />

      <VhsHud />
    </motion.section>
  );
}
