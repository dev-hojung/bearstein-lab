'use client';

import { useEffect, useRef } from 'react';

const HEART_PIXELS: ReadonlyArray<readonly [number, number]> = [
  [2, 4], [3, 4], [6, 4], [7, 4],
  [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5],
  [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6],
  [0, 7], [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 8], [7, 8], [8, 8],
  [2, 9], [3, 9], [4, 9], [5, 9], [6, 9], [7, 9],
  [3, 10], [4, 10], [5, 10], [6, 10],
  [4, 11], [5, 11],
];

const OUTLINE_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
];

export default function PixelHeartCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    const el = containerRef.current;

    if (!canvas || !el) {
      return;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, 20, 20);
    HEART_PIXELS.forEach(([x, y]) => {
      OUTLINE_OFFSETS.forEach(([dx, dy]) => {
        ctx.fillStyle = 'white';
        ctx.fillRect(x + dx + 1, y + dy, 2, 2);
      });
    });
    HEART_PIXELS.forEach(([x, y]) => {
      ctx.fillStyle = '#FF6EA0';
      ctx.fillRect(x + 1, y, 2, 2);
    });

    const onMove = (e: MouseEvent) => {
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
      el.style.display = 'block';
    };

    const onLeave = () => {
      el.style.display = 'none';
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed z-[9999]"
      style={{
        transform: 'translate(-2px, -2px)',
        imageRendering: 'pixelated',
        display: 'none',
      }}
      aria-hidden
    >
      <canvas
        ref={canvasRef}
        width={20}
        height={20}
        style={{ width: 20, height: 20, display: 'block' }}
      />
    </div>
  );
}
