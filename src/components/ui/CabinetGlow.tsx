'use client';

import { useEffect, useRef } from 'react';

const SPARK_COLORS = ['#FFB8D8', '#FF88BB', '#FFCCE8', '#FF66AA'];
const PIXEL_SIZE = 4;
const SPARK_COUNT = 40;

export default function CabinetGlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    let raf = 0;

    const tick = (t: number) => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      const time = t / 1000;
      const pulse = 0.55 + 0.45 * Math.sin(time * 3.5);
      const glow = pulse;

      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const grad = ctx.createRadialGradient(cx, cy, W * 0.1, cx, cy, W * 0.7);

      grad.addColorStop(0, `rgba(255, 140, 200, ${glow * 0.35})`);
      grad.addColorStop(0.6, `rgba(255, 100, 160, ${glow * 0.15})`);
      grad.addColorStop(1, 'rgba(255, 100, 160, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.globalAlpha = glow * 0.55;

      for (let i = 0; i < SPARK_COUNT; i++) {
        const sx = Math.floor((Math.random() * W) / PIXEL_SIZE) * PIXEL_SIZE;
        const sy = Math.floor((Math.random() * H) / PIXEL_SIZE) * PIXEL_SIZE;

        ctx.fillStyle = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
        ctx.fillRect(sx, sy, PIXEL_SIZE, PIXEL_SIZE);
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ imageRendering: 'pixelated' }}
      aria-hidden
    />
  );
}
