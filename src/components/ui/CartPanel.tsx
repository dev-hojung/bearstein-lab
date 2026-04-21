'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useLabStore } from '@/lib/store';

export default function CartPanel() {
  const cartOpen = useLabStore((s) => s.cartOpen);
  const cart = useLabStore((s) => s.cart);
  const closeCart = useLabStore((s) => s.closeCart);
  const removeFromCart = useLabStore((s) => s.removeFromCart);
  const goToAssembly = useLabStore((s) => s.goToAssembly);

  return (
    <>
      {/* Backdrop — tap-to-close (a11y improvement) */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            className="fixed inset-0 z-[150] bg-black/30 backdrop-blur-[1px]"
            aria-hidden
          />
        )}
      </AnimatePresence>

      <motion.aside
        aria-label="Cart"
        aria-hidden={!cartOpen}
        initial={false}
        animate={{ y: cartOpen ? 0 : '100%' }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed bottom-0 right-0 z-[200] w-[min(320px,100vw)] border-t-2 border-l-2 border-[rgba(255,100,180,0.35)] bg-[rgba(20,0,22,0.96)] backdrop-blur-[16px]"
      >
        <header className="flex items-center justify-between border-b border-[rgba(255,100,180,0.2)] px-3.5 py-2.5">
          <h2
            className="font-[family-name:var(--font-cormorant)] italic font-semibold text-[1.15rem] tracking-[0.04em] text-[#C06080]"
            style={{ textShadow: '0 0 10px rgba(255,100,180,0.5)' }}
          >
            🛒 Cart
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="cursor-pointer border-none bg-transparent p-1 text-lg text-[rgba(255,150,200,0.6)] transition hover:text-[#FFE0F0]"
          >
            ✕
          </button>
        </header>

        <div className="lab-scroll flex max-h-[220px] flex-col gap-1.5 overflow-y-auto px-3.5 py-2">
          {cart.length === 0 ? (
            <div className="p-4 text-center font-[family-name:var(--font-josefin)] text-[0.72rem] font-extralight tracking-[0.14em] text-[rgba(255,150,200,0.6)]">
              Your cart is empty
            </div>
          ) : (
            cart.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded border border-[rgba(255,100,180,0.15)] bg-[rgba(255,100,180,0.06)] px-2 py-1.5"
              >
                <Image
                  src={p.url}
                  alt={p.name}
                  width={36}
                  height={30}
                  className="h-[30px] w-9 flex-shrink-0 object-contain"
                  unoptimized
                />
                <span className="flex-1 font-[family-name:var(--font-josefin)] text-[0.68rem] font-light tracking-[0.06em] text-[#FFB0D4]">
                  {p.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFromCart(p.id)}
                  aria-label={`Remove ${p.name}`}
                  className="cursor-pointer border-none bg-transparent px-1 py-0.5 text-[0.9rem] text-[rgba(255,100,100,0.5)] transition hover:text-[#FF4466]"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        <footer className="border-t border-[rgba(255,100,180,0.15)] px-3.5 py-2.5">
          <button
            type="button"
            onClick={goToAssembly}
            className="w-full cursor-pointer rounded border border-[#FF80C0] bg-gradient-to-br from-[#CC1166] to-[#880044] px-7 py-2 text-center font-[family-name:var(--font-josefin)] text-sm tracking-[0.2em] text-[#FFE0F0] shadow-[0_0_20px_rgba(204,17,102,0.4)] transition hover:from-[#EE2288] hover:to-[#CC1166] hover:shadow-[0_0_30px_rgba(255,30,140,0.6)]"
          >
            ✨ Assemble
          </button>
        </footer>
      </motion.aside>
    </>
  );
}
