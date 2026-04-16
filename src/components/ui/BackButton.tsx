'use client';

import { useLabStore } from '@/lib/store';

export default function BackButton() {
  const goBack = useLabStore((s) => s.goBack);
  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex items-center gap-1.5 rounded border border-[rgba(255,100,170,0.4)] bg-[rgba(255,30,130,0.15)] px-3.5 py-1.5 font-[family-name:var(--font-josefin)] text-xs font-light tracking-[0.15em] text-[#FFB0D4] transition hover:bg-[rgba(255,30,130,0.3)] hover:border-[#FF80C0] hover:text-[#FFE0F0] active:bg-[rgba(255,30,130,0.3)]"
    >
      ← Back
    </button>
  );
}
