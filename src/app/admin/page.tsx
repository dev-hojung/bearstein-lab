'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatPhone, formatPhoneInput } from '@/lib/session';
import { LAB_SCENE_ASSETS } from '@/lib/lab-scene-data';

type Phone = {
  phone: string;
  label: string | null;
  session_minutes: number;
  created_at: string;
  last_seen_at: string | null;
};

const UNIT_TO_MINUTES = { min: 1, hour: 60, day: 60 * 24 } as const;
type Unit = keyof typeof UNIT_TO_MINUTES;
const UNIT_LABEL: Record<Unit, string> = { min: '분', hour: '시간', day: '일' };

function formatDuration(minutes: number): string {
  if (minutes % (60 * 24) === 0) return `${minutes / (60 * 24)}일`;
  if (minutes % 60 === 0) return `${minutes / 60}시간`;
  return `${minutes}분`;
}
type Part = { id: string; name: string; cat: string; url: string };

export default function AdminPage() {
  const router = useRouter();
  const [phones, setPhones] = useState<Phone[]>([]);
  const [parts, setParts] = useState<Record<string, Part[]>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const loadPhones = async () => {
    const res = await fetch('/api/admin/phones');
    if (res.status === 401) {
      router.replace('/admin/login');
      return;
    }
    const data = await res.json();
    setPhones(data.phones || []);
  };

  const loadParts = async () => {
    const res = await fetch('/api/parts');
    if (!res.ok) return;
    const data = await res.json();
    setParts(data.parts || {});
  };

  useEffect(() => {
    Promise.all([loadPhones(), loadParts()]).finally(() => setLoading(false));
  }, []);

  const pushToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.replace('/admin/login');
    router.refresh();
  };

  return (
    <main className="relative min-h-screen overflow-y-auto bg-[#0d0510] px-5 py-6">
      {/* World-continuity backdrop — dimmed lab scene + scanlines. */}
      <Image
        src={LAB_SCENE_ASSETS.dark}
        alt=""
        aria-hidden
        fill
        priority
        unoptimized
        sizes="100vw"
        className="pointer-events-none object-cover opacity-25"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="vignette-ov pointer-events-none fixed inset-0 z-[1]" />
      <div className="scan-ov pointer-events-none fixed inset-0 z-[2] opacity-30" />

      <header className="relative z-[3] mx-auto mb-6 flex max-w-5xl items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="font-[family-name:var(--font-mono-hud)] text-[10px] tracking-[0.3em] text-[#FFB0D4]">
            <span className="pass-hud-dot" />
            KEYMASTER · ADMIN CONSOLE
          </span>
          <h1
            className="font-[family-name:var(--font-cormorant)] italic font-semibold text-2xl text-[#FFE0F0]"
            style={{ textShadow: '0 0 12px rgba(255,100,180,0.6)' }}
          >
            Bearstein&rsquo;s Vault
          </h1>
        </div>
        <div className="flex gap-2">
          <a
            href="/"
            className="rounded border border-[rgba(255,100,170,0.4)] bg-[rgba(255,30,130,0.15)] px-3 py-1.5 font-[family-name:var(--font-mono-hud)] text-[10px] tracking-[0.22em] text-[#FFB0D4] transition active:scale-[0.97] active:bg-[rgba(255,30,130,0.35)]"
          >
            ← View Lab
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded border border-[rgba(255,100,170,0.4)] bg-[rgba(255,30,130,0.15)] px-3 py-1.5 font-[family-name:var(--font-mono-hud)] text-[10px] tracking-[0.22em] text-[#FFB0D4] transition active:scale-[0.97] active:bg-[rgba(255,30,130,0.35)]"
          >
            Logout
          </button>
        </div>
      </header>

      {loading ? (
        <p className="relative z-[3] text-center font-[family-name:var(--font-mono-hud)] text-xs tracking-[0.2em] text-[rgba(255,150,200,0.6)]">
          Loading…
        </p>
      ) : (
        <div className="relative z-[3] mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          <PhonePanel phones={phones} reload={loadPhones} pushToast={pushToast} />
          <PartsPanel parts={parts} reload={loadParts} pushToast={pushToast} />
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[50] -translate-x-1/2 rounded border border-[#FF80C0] bg-[#CC1166] px-4 py-2 font-[family-name:var(--font-mono-hud)] text-xs tracking-widest text-[#FFE0F0]"
        >
          {toast}
        </div>
      )}
    </main>
  );
}

// ─── Phone whitelist panel ───
function PhonePanel({
  phones,
  reload,
  pushToast,
}: {
  phones: Phone[];
  reload: () => Promise<void>;
  pushToast: (msg: string) => void;
}) {
  const [phone, setPhone] = useState('');
  const [label, setLabel] = useState('');
  const [durationValue, setDurationValue] = useState(1);
  const [durationUnit, setDurationUnit] = useState<Unit>('day');
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const sessionMinutes = durationValue * UNIT_TO_MINUTES[durationUnit];
    try {
      const res = await fetch('/api/admin/phones', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone, label: label || null, session_minutes: sessionMinutes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        pushToast(data.error || '등록 실패');
        return;
      }
      pushToast('등록됨');
      setPhone('');
      setLabel('');
      await reload();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (p: string) => {
    if (!confirm(`${formatPhone(p)} 을(를) 삭제할까요?`)) return;
    const res = await fetch(`/api/admin/phones?phone=${encodeURIComponent(p)}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      pushToast(data.error || '삭제 실패');
      return;
    }
    pushToast('삭제됨');
    await reload();
  };

  return (
    <section className="rounded-lg border border-[rgba(255,100,180,0.2)] bg-[rgba(20,0,25,0.7)] p-4">
      <h2 className="mb-3 font-[family-name:var(--font-cormorant)] italic text-lg font-medium text-[#C06080]">
        Allowed phones ({phones.length})
      </h2>

      <form onSubmit={handleAdd} className="mb-4 space-y-2">
        {/* Row 1: phone + label */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            type="tel"
            inputMode="numeric"
            placeholder="010-0000-0000"
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            className="h-9 rounded border border-[rgba(255,100,170,0.3)] bg-[rgba(255,100,180,0.06)] px-3 font-[family-name:var(--font-josefin)] text-xs tracking-[0.08em] text-[#FFE0F0] outline-none focus:border-[#FF80C0]"
            required
          />
          <input
            type="text"
            placeholder="라벨 (옵션)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="h-9 rounded border border-[rgba(255,100,170,0.3)] bg-[rgba(255,100,180,0.06)] px-3 font-[family-name:var(--font-josefin)] text-xs tracking-[0.08em] text-[#FFE0F0] outline-none focus:border-[#FF80C0]"
          />
        </div>

        {/* Row 2: duration + unit + add button */}
        <div className="flex items-stretch gap-2">
          <input
            type="number"
            min={1}
            value={durationValue}
            onChange={(e) => setDurationValue(Math.max(1, Number(e.target.value) || 1))}
            className="h-9 w-16 rounded border border-[rgba(255,100,170,0.3)] bg-[rgba(255,100,180,0.06)] px-2 text-center font-[family-name:var(--font-josefin)] text-xs tracking-[0.08em] text-[#FFE0F0] outline-none focus:border-[#FF80C0]"
            aria-label="Duration value"
          />
          <select
            value={durationUnit}
            onChange={(e) => setDurationUnit(e.target.value as Unit)}
            className="h-9 appearance-none rounded border border-[rgba(255,100,170,0.3)] bg-[rgba(255,100,180,0.06)] bg-[right_0.5rem_center] bg-no-repeat pl-3 pr-7 font-[family-name:var(--font-josefin)] text-xs tracking-[0.08em] text-[#FFE0F0] outline-none focus:border-[#FF80C0]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23FFB0D4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
            }}
            aria-label="Duration unit"
          >
            <option value="min">분</option>
            <option value="hour">시간</option>
            <option value="day">일</option>
          </select>
          <button
            type="submit"
            disabled={submitting || !phone}
            className="h-9 flex-1 rounded border border-[#FF80C0] bg-gradient-to-br from-[#CC1166] to-[#880044] px-4 font-[family-name:var(--font-josefin)] text-[0.7rem] tracking-[0.15em] text-[#FFE0F0] transition hover:from-[#EE2288] hover:to-[#CC1166] disabled:opacity-50"
          >
            + Add
          </button>
        </div>
      </form>

      <ul className="lab-scroll max-h-[360px] space-y-1 overflow-y-auto">
        {phones.length === 0 ? (
          <li className="py-8 text-center font-[family-name:var(--font-josefin)] text-xs tracking-[0.1em] text-[rgba(255,150,200,0.5)]">
            등록된 번호가 없습니다.
          </li>
        ) : (
          phones.map((p) => (
            <li
              key={p.phone}
              className="flex items-center justify-between rounded border border-[rgba(255,100,180,0.15)] bg-[rgba(255,100,180,0.06)] px-3 py-2"
            >
              <div>
                <div className="font-[family-name:var(--font-josefin)] text-sm tracking-[0.08em] text-[#FFB0D4]">
                  {formatPhone(p.phone)}
                </div>
                <div className="font-[family-name:var(--font-josefin)] text-[0.62rem] tracking-[0.1em] text-[rgba(255,150,200,0.55)]">
                  {p.label ?? '—'}
                  <span className="ml-2">· {formatDuration(p.session_minutes)}</span>
                  {p.last_seen_at && (
                    <span className="ml-2 text-[#A0FFB8]">
                      · last: {new Date(p.last_seen_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(p.phone)}
                aria-label={`Remove ${p.phone}`}
                className="rounded px-2 py-0.5 font-[family-name:var(--font-josefin)] text-xs text-[rgba(255,100,100,0.6)] transition hover:text-[#FF4466]"
              >
                ✕
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

// ─── Parts uploader / catalog ───
function PartsPanel({
  parts,
  reload,
  pushToast,
}: {
  parts: Record<string, Part[]>;
  reload: () => Promise<void>;
  pushToast: (msg: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [cat, setCat] = useState<'head' | 'body' | 'arm' | 'leg'>('head');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    if (file.type !== 'image/png' && file.type !== 'image/svg+xml') {
      pushToast('PNG 또는 SVG 파일만 허용됩니다');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', name);
      fd.append('cat', cat);
      const res = await fetch('/api/admin/parts', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        pushToast(data.error || '업로드 실패');
        return;
      }
      pushToast('업로드됨');
      setFile(null);
      setName('');
      (document.getElementById('upload-file-input') as HTMLInputElement | null)!.value = '';
      await reload();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 삭제할까요?`)) return;
    const res = await fetch(`/api/admin/parts?id=${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      pushToast(data.error || '삭제 실패');
      return;
    }
    pushToast('삭제됨');
    await reload();
  };

  const total = (parts.head?.length ?? 0) + (parts.body?.length ?? 0) + (parts.arm?.length ?? 0) + (parts.leg?.length ?? 0);

  return (
    <section className="rounded-lg border border-[rgba(255,100,180,0.2)] bg-[rgba(20,0,25,0.7)] p-4">
      <h2 className="mb-3 font-[family-name:var(--font-cormorant)] italic text-lg font-medium text-[#C06080]">
        Parts catalog ({total})
      </h2>

      <form onSubmit={handleUpload} className="mb-4 space-y-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            type="text"
            placeholder="파츠 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-[rgba(255,100,170,0.3)] bg-[rgba(255,100,180,0.06)] px-3 py-2 font-[family-name:var(--font-josefin)] text-xs tracking-[0.08em] text-[#FFE0F0] outline-none focus:border-[#FF80C0]"
            required
          />
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value as typeof cat)}
            className="rounded border border-[rgba(255,100,170,0.3)] bg-[rgba(255,100,180,0.06)] px-3 py-2 font-[family-name:var(--font-josefin)] text-xs tracking-[0.08em] text-[#FFE0F0] outline-none focus:border-[#FF80C0]"
          >
            <option value="head">Head</option>
            <option value="body">Body</option>
            <option value="arm">Arm</option>
            <option value="leg">Leg</option>
          </select>
        </div>

        <input
          id="upload-file-input"
          type="file"
          accept="image/png,image/svg+xml,.svg"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-xs font-[family-name:var(--font-josefin)] text-[#FFB0D4] file:mr-3 file:rounded file:border file:border-[rgba(255,100,170,0.4)] file:bg-[rgba(255,30,130,0.15)] file:px-3 file:py-1.5 file:text-xs file:tracking-[0.1em] file:text-[#FFB0D4] file:transition hover:file:bg-[rgba(255,30,130,0.3)]"
          required
        />
        <p className="font-[family-name:var(--font-josefin)] text-[0.6rem] font-extralight tracking-[0.1em] text-[rgba(255,150,200,0.5)]">
          PNG / SVG · max 5MB · 투명 배경 권장
        </p>

        <button
          type="submit"
          disabled={uploading || !file || !name}
          className="w-full rounded border border-[#FF80C0] bg-gradient-to-br from-[#CC1166] to-[#880044] px-4 py-2 font-[family-name:var(--font-josefin)] text-[0.75rem] tracking-[0.15em] text-[#FFE0F0] transition hover:from-[#EE2288] hover:to-[#CC1166] disabled:opacity-50"
        >
          {uploading ? '⏳ Uploading…' : '⬆ Upload'}
        </button>
      </form>

      <div className="lab-scroll max-h-[360px] overflow-y-auto">
        {(['head', 'body', 'arm', 'leg'] as const).map((c) => {
          const items = parts[c] ?? [];
          return (
            <div key={c} className="mb-3">
              <div className="mb-1.5 font-[family-name:var(--font-josefin)] text-[0.6rem] font-light tracking-[0.2em] text-[rgba(255,150,200,0.6)]">
                {c.toUpperCase()} ({items.length})
              </div>
              {items.length === 0 ? (
                <div className="rounded border border-dashed border-[rgba(255,100,180,0.15)] py-3 text-center font-[family-name:var(--font-josefin)] text-[0.62rem] tracking-[0.1em] text-[rgba(255,150,200,0.35)]">
                  empty
                </div>
              ) : (
                <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                  {items.map((p) => (
                    <li
                      key={p.id}
                      className="group relative flex flex-col items-center rounded border border-[rgba(255,100,180,0.15)] bg-[rgba(255,100,180,0.06)] p-1.5"
                    >
                      <div className="relative h-14 w-14">
                        <Image src={p.url} alt={p.name} fill unoptimized className="object-contain" />
                      </div>
                      <div className="mt-1 w-full truncate text-center font-[family-name:var(--font-josefin)] text-[0.55rem] tracking-[0.05em] text-[#FFB0D4]">
                        {p.name}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.name)}
                        aria-label={`Delete ${p.name}`}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#FF80C0] bg-[#CC1166] text-[0.6rem] text-white transition hover:scale-110"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
