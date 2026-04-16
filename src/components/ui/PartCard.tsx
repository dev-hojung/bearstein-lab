'use client';

import Image from 'next/image';
import { useRef } from 'react';
import type { Part } from '@/lib/parts-data';
import { useLabStore } from '@/lib/store';

type Props = { part: Part };

export default function PartCard({ part }: Props) {
  const thumbRef = useRef<HTMLImageElement | null>(null);
  const cart = useLabStore((s) => s.cart);
  const addOrReplace = useLabStore((s) => s.addOrReplace);
  const setToast = useLabStore((s) => s.setToast);

  const inCart = cart.some((c) => c.id === part.id);

  const handleClick = () => {
    const wasInCart = inCart;
    const { replaced } = addOrReplace(part);
    if (wasInCart) {
      setToast(`${part.name} removed`);
      return;
    }
    // Fly animation to cart widget
    flyToCart(thumbRef.current);
    if (replaced) {
      setToast(`${replaced.name} → ${part.name} (replaced)`);
    } else {
      setToast(`${part.name} added`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      data-id={part.id}
      className={[
        'relative flex w-full flex-col items-center rounded-lg border p-2 backdrop-blur-[6px] transition-all duration-200',
        inCart
          ? 'border-[#FF80C0] bg-[rgba(80,0,60,0.8)] shadow-[0_0_14px_rgba(255,80,160,0.3)]'
          : 'border-[rgba(255,100,180,0.22)] bg-[rgba(30,0,30,0.7)] hover:-translate-y-0.5 hover:border-[rgba(255,80,160,0.6)] hover:bg-[rgba(60,0,50,0.8)]',
      ].join(' ')}
      aria-pressed={inCart}
    >
      <div className="mb-1.5 flex h-[70px] w-[80px] items-center justify-center overflow-hidden">
        <Image
          ref={thumbRef}
          src={part.url}
          alt={part.name}
          width={80}
          height={70}
          className="h-full w-full object-contain"
          unoptimized
        />
      </div>
      <div className="mb-1.5 text-center font-[family-name:var(--font-josefin)] text-[0.65rem] font-light tracking-[0.08em] text-[#FFB0D4]">
        {part.name}
      </div>
      <span
        className={[
          'w-full rounded-sm border px-2.5 py-1 text-center font-[family-name:var(--font-josefin)] text-[0.62rem] tracking-[0.12em] transition',
          inCart
            ? 'border-[rgba(80,200,120,0.5)] bg-[rgba(80,200,120,0.2)] text-[#A0FFB8]'
            : 'border-[rgba(255,100,170,0.4)] bg-[rgba(255,30,130,0.2)] text-[#FFD0E8]',
        ].join(' ')}
      >
        {inCart ? '✓ Added' : '+ Add'}
      </span>
      {inCart && (
        <div className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF2288] text-[0.55rem] font-bold text-white">
          ✓
        </div>
      )}
    </button>
  );
}

// ── Fly-to-cart animation (uses DOM clone) ──
function flyToCart(imgEl: HTMLImageElement | null) {
  if (!imgEl) return;
  const cw = document.getElementById('cart-widget');
  if (!cw) return;
  const imgRect = imgEl.getBoundingClientRect();
  const cwRect = cw.getBoundingClientRect();

  const clone = document.createElement('div');
  clone.className = 'fly-clone';
  clone.style.left = imgRect.left + 'px';
  clone.style.top = imgRect.top + 'px';
  clone.style.width = imgRect.width + 'px';
  clone.style.height = imgRect.height + 'px';
  clone.style.backgroundImage = `url(${imgEl.src})`;
  clone.style.opacity = '1';
  clone.style.transform = 'scale(1) rotate(0deg)';
  document.body.appendChild(clone);

  const destX = cwRect.left + cwRect.width / 2 - 20;
  const destY = cwRect.top + cwRect.height / 2 - 20;

  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      clone.style.left = destX + 'px';
      clone.style.top = destY + 'px';
      clone.style.width = '40px';
      clone.style.height = '40px';
      clone.style.opacity = '0';
      clone.style.transform = 'scale(0.15) rotate(20deg)';
    })
  );

  setTimeout(() => {
    clone.remove();
    cw.classList.add('cart-bounce-anim');
    setTimeout(() => cw.classList.remove('cart-bounce-anim'), 500);
  }, 700);
}
