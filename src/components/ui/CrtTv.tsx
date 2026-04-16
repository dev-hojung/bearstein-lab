'use client';

import Image from 'next/image';
import type { Category } from '@/lib/parts-data';
import { CAT_EMOJI, CAT_TAG, CRT_THUMBS } from '@/lib/parts-data';
import { useLabStore } from '@/lib/store';

type Props = { cat: Category };

export default function CrtTv({ cat }: Props) {
  const goToSub = useLabStore((s) => s.goToSub);

  return (
    <button
      type="button"
      onClick={() => goToSub(cat)}
      className="group flex cursor-pointer flex-col items-center transition-all duration-200 hover:-translate-y-1 hover:scale-[1.03] hover:drop-shadow-[0_8px_20px_rgba(255,80,160,0.45)]"
      aria-label={CAT_TAG[cat]}
    >
      <div
        className="relative rounded-t-[10px] rounded-b-md bg-gradient-to-br from-[#3a2424] to-[#1c1010] px-[9px] pt-[9px] pb-[6px]"
        style={{
          boxShadow:
            '0 0 0 2px #5a3030, 0 0 0 4px #1c0808, 6px 8px 22px rgba(0,0,0,0.8), 0 0 20px rgba(255,60,160,0.1)',
        }}
      >
        <div
          className="relative overflow-hidden rounded-md bg-[#080010]"
          style={{
            width: 'clamp(120px,22vw,230px)',
            height: 'clamp(90px,17vw,176px)',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9)',
          }}
        >
          <Image
            src={CRT_THUMBS[cat]}
            alt=""
            fill
            sizes="(max-width: 640px) 45vw, 230px"
            className="object-cover"
          />
          <div className="crt-scan pointer-events-none absolute inset-0" />
          <div
            className="pointer-events-none absolute left-2 top-[7px] h-[34px] w-[52px] rounded-[50%]"
            style={{
              background: 'radial-gradient(ellipse, rgba(255,255,255,0.22) 0%, transparent 70%)',
            }}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[rgba(15,0,25,0.45)] transition group-hover:bg-[rgba(200,30,130,0.2)]">
            <span
              className="animate-(--animate-float-em) drop-shadow-[0_2px_8px_rgba(255,80,180,0.6)]"
              style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}
              aria-hidden
            >
              {CAT_EMOJI[cat]}
            </span>
          </div>
        </div>

        <div className="flex h-[18px] items-center justify-end gap-1.5 pt-1">
          <div
            className="h-3 w-3 rounded-full border border-[#3a3a3a]"
            style={{ background: 'radial-gradient(circle at 35% 35%, #5a5a5a, #1a1a1a)' }}
          />
          <div className="flex flex-col gap-[2px]">
            <i className="block h-[1.5px] w-3.5 rounded-sm bg-[#3a3a3a]" />
            <i className="block h-[1.5px] w-3.5 rounded-sm bg-[#3a3a3a]" />
            <i className="block h-[1.5px] w-3.5 rounded-sm bg-[#3a3a3a]" />
          </div>
          <div
            className="h-1.5 w-1.5 animate-(--animate-led-blink) rounded-full bg-[#FF2288]"
            style={{ boxShadow: '0 0 4px #FF2288' }}
          />
        </div>
      </div>
      <div className="mx-auto h-2 w-[22px] bg-[#1c1010]" />
      <div
        className="mx-auto h-2.5 rounded-b-md bg-gradient-to-b from-[#2a1818] to-[#0e0808]"
        style={{ width: 'clamp(60px,14vw,100px)', boxShadow: '4px 4px 12px rgba(0,0,0,0.6)' }}
      />
      <div
        className="mt-2 text-center font-[family-name:var(--font-cormorant)] italic text-[#FFB0D4]"
        style={{
          fontSize: 'clamp(0.85rem,1.8vw,1.1rem)',
          letterSpacing: '0.03em',
          textShadow: '0 0 10px rgba(255,100,180,0.5)',
        }}
      >
        {CAT_TAG[cat]}
      </div>
    </button>
  );
}
