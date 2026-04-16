'use client';

import Image from 'next/image';
import { CART_ICON } from '@/lib/parts-data';
import { useLabStore } from '@/lib/store';

export default function CartWidget() {
  const cart = useLabStore((s) => s.cart);
  const screen = useLabStore((s) => s.screen);
  const toggleCart = useLabStore((s) => s.toggleCart);

  // Hide on landing screen
  if (screen === 's1') return null;

  return (
    <button
      type="button"
      id="cart-widget"
      onClick={toggleCart}
      aria-label={`View cart (${cart.length} items)`}
      className="fixed bottom-3 right-3.5 z-[100] cursor-pointer transition hover:scale-[1.06] [&.cart-bounce-anim]:animate-(--animate-cart-bounce)"
    >
      <Image
        src={CART_ICON}
        alt=""
        width={60}
        height={50}
        className="block h-[50px] w-[60px] object-contain drop-shadow-[0_3px_10px_rgba(255,80,160,0.4)]"
      />
      <span
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#FFE0F0] bg-[#FF2288] font-[family-name:var(--font-josefin)] text-[0.65rem] font-semibold text-white"
        aria-hidden
      >
        {cart.length}
      </span>
    </button>
  );
}
