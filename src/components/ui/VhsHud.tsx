export default function VhsHud() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[3] font-[family-name:var(--font-mono-hud)] tracking-[0.1em] text-[#FFB8D8]"
      style={{
        fontSize: 'clamp(10px,1.6vw,14px)',
        textShadow: '0 0 8px #FF88AA, 0 0 18px rgba(255,60,130,0.4)',
      }}
    >
      <div className="absolute left-[3%] top-[4%]">PLAY ▶</div>
      <div className="absolute right-[3%] top-[4%] text-right">BEARSTEIN 00-00</div>
      <div className="absolute bottom-[4%] left-[3%]">03:46:39</div>
      <div className="absolute bottom-[4%] right-[3%] text-right">22.09.1986</div>
    </div>
  );
}
