'use client';

export default function RotateOverlay() {
  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[9998] hidden items-center justify-center bg-[#f6d7e3] text-center portrait:flex lg:portrait:hidden"
      role="dialog"
      aria-label="기기를 가로로 돌려주세요"
    >
      <div className="scan-ov pointer-events-none absolute inset-0 opacity-30" />

      <div className="relative mx-6 flex flex-col items-center gap-5 rounded-2xl border-[3px] border-[#e88fb2] bg-[#fdeaf3] px-8 py-10 shadow-[6px_6px_0_rgba(201,97,144,0.45)]">
        <span className="absolute -top-4 -left-4 text-2xl">✨</span>
        <span className="absolute -top-4 -right-4 text-2xl">✨</span>
        <span className="absolute -bottom-4 -left-4 text-2xl">🫧</span>
        <span className="absolute -bottom-4 -right-4 text-2xl">🫧</span>

        <div className="animate-(--animate-phone-rotate) text-6xl drop-shadow-[2px_2px_0_rgba(201,97,144,0.35)]">
          📱
        </div>

        <div className="font-[family-name:var(--font-vibes)] text-3xl text-[#c96190]">
          Bearstein&apos;s Laboratory
        </div>

        <div className="text-lg font-semibold tracking-wide text-[#7a3a5c]">
          기기를 가로로 돌려주세요
        </div>

        <div className="max-w-[240px] text-[0.72rem] leading-relaxed text-[#a35a7e]">
          실험실은 가로 모드에서만 열려요.
          <br />
          화면 자동 회전이 꺼져 있다면 설정에서 켜주세요.
        </div>
      </div>
    </div>
  );
}
