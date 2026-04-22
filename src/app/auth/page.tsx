'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { formatPhoneInput } from '@/lib/session';
import { LAB_SCENE_ASSETS } from '@/lib/lab-scene-data';

export default function AuthPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || '인증 실패');
        return;
      }
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="fixed inset-0 flex h-[100dvh] w-[100dvw] items-center justify-center overflow-hidden bg-[#0d0510] px-5">
      {/* Dim the lab scene so the pass card pops. */}
      <Image
        src={LAB_SCENE_ASSETS.dark}
        alt=""
        aria-hidden
        fill
        priority
        unoptimized
        sizes="100vw"
        className="object-cover opacity-40"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="vignette-ov pointer-events-none absolute inset-0 z-[1]" />
      <div className="scan-ov pointer-events-none absolute inset-0 z-[2] opacity-50" />

      <form onSubmit={handleSubmit} className="pass-card relative z-[3] w-full max-w-[380px]">
        {/* Top HUD row */}
        <div className="mb-4 flex items-center justify-between">
          <span className="font-[family-name:var(--font-mono-hud)] text-[10px] tracking-[0.3em] text-[#A0446C]">
            <span className="pass-hud-dot" />
            OPERATOR PASS
          </span>
          <span className="font-[family-name:var(--font-mono-hud)] text-[9px] tracking-[0.22em] text-[#C06C96]">
            V1.37
          </span>
        </div>

        <h1
          className="mb-1 font-[family-name:var(--font-cormorant)] italic font-medium leading-[1.1] text-[1.7rem] text-[#7D2A52]"
          style={{ textShadow: '0 0 8px rgba(255, 150, 200, 0.35)' }}
        >
          Bearstein&rsquo;s<br />Laboratory
        </h1>
        <p className="mb-5 font-[family-name:var(--font-mono-hud)] text-[10px] tracking-[0.24em] text-[#A0446C]">
          등록된 번호로 출입하세요
        </p>

        <label htmlFor="phone" className="pass-label">
          Phone Number
        </label>
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="010-0000-0000"
          value={phone}
          onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
          className="pass-input mb-4"
          required
        />

        {error && (
          <div role="alert" className="pass-error">
            ⚠ SIGNAL ERROR · {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !phone}
          className="pass-button"
          aria-label="Enter the laboratory"
        >
          {submitting ? 'Unlocking…' : 'Enter the Lab →'}
        </button>

        <p className="mt-5 text-center font-[family-name:var(--font-mono-hud)] text-[9px] tracking-[0.22em] text-[#A0446C]/70">
          Admins ·{' '}
          <a href="/admin" className="underline decoration-dotted underline-offset-2">
            /admin
          </a>
        </p>
      </form>
    </main>
  );
}
