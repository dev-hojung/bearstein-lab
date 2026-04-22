'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { LAB_SCENE_ASSETS } from '@/lib/lab-scene-data';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || '인증 실패');
        return;
      }
      router.replace('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="fixed inset-0 flex h-[100dvh] w-[100dvw] items-center justify-center overflow-hidden bg-[#0d0510] px-5">
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
        <div className="mb-4 flex items-center justify-between">
          <span className="font-[family-name:var(--font-mono-hud)] text-[10px] tracking-[0.3em] text-[#A0446C]">
            <span className="pass-hud-dot" />
            KEYMASTER
          </span>
          <span className="font-[family-name:var(--font-mono-hud)] text-[9px] tracking-[0.22em] text-[#C06C96]">
            ADMIN
          </span>
        </div>

        <h1
          className="mb-1 font-[family-name:var(--font-cormorant)] italic font-medium leading-[1.1] text-[1.7rem] text-[#7D2A52]"
          style={{ textShadow: '0 0 8px rgba(255, 150, 200, 0.35)' }}
        >
          Admin<br />Console
        </h1>
        <p className="mb-5 font-[family-name:var(--font-mono-hud)] text-[10px] tracking-[0.24em] text-[#A0446C]">
          실험실 암호를 입력하세요
        </p>

        <label htmlFor="password" className="pass-label">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          disabled={submitting || !password}
          className="pass-button"
        >
          {submitting ? 'Unlocking…' : 'Unlock Lab →'}
        </button>
      </form>
    </main>
  );
}
