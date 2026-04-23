'use client';

import { useLabStore } from '@/lib/store';

export default function BackButton() {
  const goBack = useLabStore((s) => s.goBack);
  return (
    <button type="button" onClick={goBack} className="pass-chip">
      ← Back
    </button>
  );
}
