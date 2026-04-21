'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatPhoneInput } from '@/lib/session';

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
    <main className="fixed inset-0 flex items-center justify-center bg-[#FFD1DC] px-6">
      <div className="scan-ov pointer-events-none absolute inset-0 z-[1]" />
      <form
        onSubmit={handleSubmit}
        className="relative z-[2] w-full max-w-sm rounded-lg border border-[rgba(255,100,180,0.25)] bg-[rgba(20,0,25,0.85)] p-6 backdrop-blur-sm"
      >
        <h1
          className="mb-1 text-center font-[family-name:var(--font-cormorant)] italic font-medium text-2xl text-[#C06080]"
          style={{ textShadow: '0 0 15px rgba(255,100,180,0.7)' }}
        >
          Bearstein&apos;s Lab
        </h1>
        <p className="mb-6 text-center font-[family-name:var(--font-josefin)] text-[0.7rem] font-extralight tracking-[0.2em] text-[rgba(255,200,230,0.55)]">
          Enter your phone to access
        </p>

        <label
          htmlFor="phone"
          className="mb-1 block font-[family-name:var(--font-josefin)] text-[0.65rem] font-light tracking-[0.15em] text-[#FFB0D4]"
        >
          PHONE
        </label>
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="010-0000-0000"
          value={phone}
          onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
          className="mb-4 w-full rounded border border-[rgba(255,100,170,0.3)] bg-[rgba(255,100,180,0.06)] px-3 py-2 font-[family-name:var(--font-josefin)] text-sm tracking-[0.08em] text-[#FFE0F0] outline-none transition focus:border-[#FF80C0] focus:bg-[rgba(255,100,180,0.1)]"
          required
        />

        {error && (
          <div
            role="alert"
            className="mb-3 rounded border border-[rgba(255,100,100,0.4)] bg-[rgba(200,30,60,0.15)] px-3 py-2 font-[family-name:var(--font-josefin)] text-[0.7rem] tracking-[0.05em] text-[#FFB8B8]"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !phone}
          className="w-full cursor-pointer rounded border border-[#FF80C0] bg-gradient-to-br from-[#CC1166] to-[#880044] px-4 py-2 font-[family-name:var(--font-josefin)] text-sm tracking-[0.2em] text-[#FFE0F0] shadow-[0_0_14px_rgba(204,17,102,0.4)] transition hover:from-[#EE2288] hover:to-[#CC1166] disabled:opacity-50"
        >
          {submitting ? '…' : 'Enter →'}
        </button>

        <p className="mt-4 text-center font-[family-name:var(--font-josefin)] text-[0.58rem] font-extralight tracking-[0.15em] text-[rgba(255,150,200,0.4)]">
          Admins: <a href="/admin" className="underline hover:text-[#FFB0D4]">/admin</a>
        </p>
      </form>
    </main>
  );
}
