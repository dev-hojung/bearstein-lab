'use client';

import type { MouseEvent as ReactMouseEvent } from 'react';
import { useRef } from 'react';

import Image from 'next/image';

import { motion } from 'framer-motion';

import VhsHud from '@/components/ui/VhsHud';

import { useLabStore } from '@/lib/store';

const INTRO_BG = '/images/bg/intro.webp';

const GLITCH_LAYER_STYLE = {
  backgroundImage: `url(${INTRO_BG})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center 70%',
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
      className="fixed inset-0 overflow-hidden bg-[#f6d7e3]"
      onClick={handleEnter}
    >
      <Image
        src={INTRO_BG}
        alt="Bearstein's Laboratory"
        fill
        priority
        unoptimized
        sizes="100vw"
        className="z-0 animate-(--animate-crt-flicker) object-cover object-[center_70%]"
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
