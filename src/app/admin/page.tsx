'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatPhone, formatPhoneInput } from '@/lib/session';

type Phone = {
  phone: string;
  label: string | null;
  session_days: number;
  created_at: string;
  last_seen_at: string | null;
};
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
    <main className="min-h-screen overflow-y-auto bg-[#1a0018] px-5 py-6">
      <header className="mx-auto mb-6 flex max-w-5xl items-center justify-between">
        <h1
          className="font-[family-name:var(--font-cormorant)] italic font-semibold text-2xl text-[#FF9FD4]"
          style={{ textShadow: '0 0 12px rgba(255,100,180,0.6)' }}
        >
          Admin Console
        </h1>
        <div className="flex gap-2">
          <a
            href="/"
            className="rounded border border-[rgba(255,100,170,0.4)] bg-[rgba(255,30,130,0.15)] px-3 py-1.5 font-[family-name:var(--font-josefin)] text-[0.7rem] tracking-[0.12em] text-[#FFB0D4] transition hover:text-[#FFE0F0]"
          >
            ← View app
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded border border-[rgba(255,100,170,0.4)] bg-[rgba(255,30,130,0.15)] px-3 py-1.5 font-[family-name:var(--font-josefin)] text-[0.7rem] tracking-[0.12em] text-[#FFB0D4] transition hover:text-[#FFE0F0]"
          >
            Logout
          </button>
        </div>
      </header>

      {loading ? (
        <p className="text-center text-[rgba(255,150,200,0.6)]">Loading…</p>
      ) : (
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          <PhonePanel phones={phones} reload={loadPhones} pushToast={pushToast} />
          <PartsPanel parts={parts} reload={loadParts} pushToast={pushToast} />
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded border border-[#FF80C0] bg-[#CC1166] px-4 py-2 font-[family-name:var(--font-josefin)] text-xs tracking-widest text-[#FFE0F0]"
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
  const [sessionDays, setSessionDays] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/phones', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone, label: label || null, session_days: sessionDays }),
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
      <h2 className="mb-3 font-[family-name:var(--font-cormorant)] italic text-lg font-medium text-[#FF9FD4]">
        Allowed phones ({phones.length})
      </h2>

      <form onSubmit={handleAdd} className="mb-4 space-y-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
          <input
            type="tel"
            inputMode="numeric"
            placeholder="010-0000-0000"
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            className="rounded border border-[rgba(255,100,170,0.3)] bg-[rgba(255,100,180,0.06)] px-3 py-2 font-[family-name:var(--font-josefin)] text-xs tracking-[0.08em] text-[#FFE0F0] outline-none focus:border-[#FF80C0]"
            required
          />
          <input
            type="text"
            placeholder="라벨 (옵션)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="rounded border border-[rgba(255,100,170,0.3)] bg-[rgba(255,100,180,0.06)] px-3 py-2 font-[family-name:var(--font-josefin)] text-xs tracking-[0.08em] text-[#FFE0F0] outline-none focus:border-[#FF80C0]"
          />
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={365}
              value={sessionDays}
              onChange={(e) => setSessionDays(Number(e.target.value) || 1)}
              className="w-16 rounded border border-[rgba(255,100,170,0.3)] bg-[rgba(255,100,180,0.06)] px-2 py-2 text-center font-[family-name:var(--font-josefin)] text-xs tracking-[0.08em] text-[#FFE0F0] outline-none focus:border-[#FF80C0]"
            />
            <span className="font-[family-name:var(--font-josefin)] text-[0.6rem] tracking-[0.1em] text-[rgba(255,150,200,0.6)]">일</span>
          </div>
          <button
            type="submit"
            disabled={submitting || !phone}
            className="rounded border border-[#FF80C0] bg-gradient-to-br from-[#CC1166] to-[#880044] px-4 py-2 font-[family-name:var(--font-josefin)] text-[0.7rem] tracking-[0.15em] text-[#FFE0F0] transition hover:from-[#EE2288] hover:to-[#CC1166] disabled:opacity-50"
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
                  <span className="ml-2">· {p.session_days}일</span>
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
      <h2 className="mb-3 font-[family-name:var(--font-cormorant)] italic text-lg font-medium text-[#FF9FD4]">
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
