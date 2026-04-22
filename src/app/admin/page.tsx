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

      <header className="relative z-[3] mx-auto mb-6 flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-[family-name:var(--font-mono-hud)] text-[10px] tracking-[0.3em] text-[#FFB0D4]">
            <span className="pass-hud-dot" />
            KEYMASTER · ADMIN CONSOLE
          </span>
          <h1
            className="font-[family-name:var(--font-cormorant)] italic font-semibold text-2xl text-[#FFE0F0]"
            style={{ textShadow: '0 0 12px rgba(255,100,180,0.6)' }}
          >
            Bearstein&rsquo;s Laboratory
          </h1>
        </div>
        <div className="flex gap-2">
          <a href="/" className="pass-chip">← View Lab</a>
          <button type="button" onClick={handleLogout} className="pass-chip">
            Logout
          </button>
        </div>
      </header>

      {loading ? (
        <p className="relative z-[3] text-center font-[family-name:var(--font-mono-hud)] text-xs tracking-[0.2em] text-[rgba(255,200,220,0.6)]">
          Loading…
        </p>
      ) : (
        <div className="relative z-[3] mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          <PhonePanel phones={phones} reload={loadPhones} pushToast={pushToast} />
          <PartsPanel parts={parts} reload={loadParts} pushToast={pushToast} />
        </div>
      )}

      {toast && (
        <div role="status" className="pass-chip fixed bottom-6 left-1/2 z-[50] -translate-x-1/2">
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
    <section className="pass-panel">
      <h2 className="pass-panel-title">
        Allowed phones <span className="text-[#A0446C]">({phones.length})</span>
      </h2>

      <form onSubmit={handleAdd} className="mb-4 space-y-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            type="tel"
            inputMode="numeric"
            placeholder="010-0000-0000"
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            className="pass-input"
            required
          />
          <input
            type="text"
            placeholder="라벨 (옵션)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="pass-input"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[88px_112px_1fr]">
          <input
            type="number"
            min={1}
            value={durationValue}
            onChange={(e) => setDurationValue(Math.max(1, Number(e.target.value) || 1))}
            className="pass-input text-center"
            aria-label="Duration value"
          />
          <select
            value={durationUnit}
            onChange={(e) => setDurationUnit(e.target.value as Unit)}
            className="pass-select"
            aria-label="Duration unit"
          >
            <option value="min">분</option>
            <option value="hour">시간</option>
            <option value="day">일</option>
          </select>
          <button type="submit" disabled={submitting || !phone} className="pass-button">
            + Add
          </button>
        </div>
      </form>

      <ul className="lab-scroll max-h-[360px] space-y-1.5 overflow-y-auto pr-1">
        {phones.length === 0 ? (
          <li className="py-8 text-center font-[family-name:var(--font-mono-hud)] text-[11px] tracking-[0.22em] text-[#A0446C]/60">
            등록된 번호가 없습니다.
          </li>
        ) : (
          phones.map((p) => (
            <li key={p.phone} className="pass-row">
              <div>
                <div className="font-[family-name:var(--font-mono-hud)] text-sm tracking-[0.12em] text-[#5C1E3D]">
                  {formatPhone(p.phone)}
                </div>
                <div className="mt-0.5 font-[family-name:var(--font-mono-hud)] text-[10px] tracking-[0.16em] text-[#A0446C]">
                  {p.label ?? '—'}
                  <span className="ml-2">· {formatDuration(p.session_minutes)}</span>
                  {p.last_seen_at && (
                    <span className="ml-2 text-[#3F8B5A]">
                      · last: {new Date(p.last_seen_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(p.phone)}
                aria-label={`Remove ${p.phone}`}
                className="pass-chip pass-chip--danger !px-2.5 !py-1 !text-[10px]"
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

  const total =
    (parts.head?.length ?? 0) +
    (parts.body?.length ?? 0) +
    (parts.arm?.length ?? 0) +
    (parts.leg?.length ?? 0);

  return (
    <section className="pass-panel">
      <h2 className="pass-panel-title">
        Parts catalog <span className="text-[#A0446C]">({total})</span>
      </h2>

      <form onSubmit={handleUpload} className="mb-4 space-y-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            type="text"
            placeholder="파츠 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pass-input"
            required
          />
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value as typeof cat)}
            className="pass-select"
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
          className="block w-full font-[family-name:var(--font-mono-hud)] text-[11px] tracking-[0.12em] text-[#5C1E3D] file:mr-3 file:rounded-[1px] file:border-0 file:bg-[#FFE4EF] file:px-3 file:py-1.5 file:font-[family-name:var(--font-mono-hud)] file:text-[10px] file:tracking-[0.22em] file:text-[#7D2A52] file:shadow-[inset_0_0_0_1px_#FFFFFF,inset_0_-2px_0_#F2A9C8,0_0_0_1px_#D98FB4] active:file:translate-y-[2px]"
          required
        />
        <p className="font-[family-name:var(--font-mono-hud)] text-[10px] tracking-[0.18em] text-[#A0446C]/70">
          PNG / SVG · max 5MB · 투명 배경 권장
        </p>

        <button
          type="submit"
          disabled={uploading || !file || !name}
          className="pass-button"
        >
          {uploading ? 'Uploading…' : '⬆ Upload Part'}
        </button>
      </form>

      <div className="lab-scroll max-h-[360px] overflow-y-auto pr-1">
        {(['head', 'body', 'arm', 'leg'] as const).map((c) => {
          const items = parts[c] ?? [];
          return (
            <div key={c} className="mb-3">
              <div className="mb-1.5 font-[family-name:var(--font-mono-hud)] text-[10px] tracking-[0.26em] text-[#A0446C]">
                {c.toUpperCase()} <span className="text-[#A0446C]/60">({items.length})</span>
              </div>
              {items.length === 0 ? (
                <div className="rounded-[1px] border border-dashed border-[#F4BBD1] bg-[#FFF0F7]/60 py-3 text-center font-[family-name:var(--font-mono-hud)] text-[10px] tracking-[0.2em] text-[#A0446C]/55">
                  empty
                </div>
              ) : (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {items.map((p) => (
                    <li
                      key={p.id}
                      className="group relative flex flex-col items-center rounded-[1px] bg-[#FFF6FA] p-1.5 shadow-[inset_0_0_0_1px_#FFE4EF,0_0_0_1px_#F4BBD1]"
                    >
                      <div className="relative h-14 w-14">
                        <Image
                          src={p.url}
                          alt={p.name}
                          fill
                          unoptimized
                          className="object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                      <div className="mt-1 w-full truncate text-center font-[family-name:var(--font-mono-hud)] text-[10px] tracking-[0.1em] text-[#7D2A52]">
                        {p.name}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.name)}
                        aria-label={`Delete ${p.name}`}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF5C93] text-[10px] font-bold text-white shadow-[0_0_0_1px_#B8385C,0_2px_0_rgba(120,40,80,0.35)] active:translate-y-[1px]"
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
