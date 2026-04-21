const GLITCH_LINES: ReadonlyArray<{ y: number; h: number }> = [
  { y: 0.18, h: 0.04 },
  { y: 0.42, h: 0.03 },
  { y: 0.65, h: 0.05 },
  { y: 0.78, h: 0.02 },
  { y: 0.3, h: 0.06 },
  { y: 0.55, h: 0.03 },
];

const DEFAULT_DURATION = 480;
const MID_PROGRESS = 0.6;

export type GlitchOptions = {
  duration?: number;
  onMid?: () => void;
  onDone?: () => void;
};

export const runPixelGlitch = (target: HTMLElement, options: GlitchOptions = {}) => {
  const duration = options.duration ?? DEFAULT_DURATION;
  const canvas = document.createElement('canvas');

  canvas.width = target.offsetWidth;
  canvas.height = target.offsetHeight;
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:9995;image-rendering:pixelated;';
  target.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    canvas.remove();
    options.onMid?.();
    options.onDone?.();

    return;
  }

  const W = canvas.width;
  const H = canvas.height;
  let start: number | null = null;
  let midFired = false;

  const frame = (ts: number) => {
    if (start === null) {
      start = ts;
    }

    const elapsed = ts - start;
    const prog = elapsed / duration;

    ctx.clearRect(0, 0, W, H);

    const numBars = 2 + Math.floor(Math.random() * 4);

    for (let i = 0; i < numBars; i++) {
      const line = GLITCH_LINES[Math.floor(Math.random() * GLITCH_LINES.length)];
      const barY = line.y * H;
      const barH = line.h * H;
      const shift = (Math.random() - 0.5) * 28;
      const alpha = 0.25 + Math.random() * 0.45;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(255,100,160,1)';
      ctx.fillRect(shift, barY, W, barH * 0.5);
      ctx.fillStyle = 'rgba(160,200,255,1)';
      ctx.fillRect(-shift * 0.6, barY + barH * 0.5, W, barH * 0.5);
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = 'rgba(0,0,0,1)';

      for (let ln = 0; ln < barH; ln += 3) {
        ctx.fillRect(0, barY + ln, W, 1);
      }
    }

    if (Math.random() > 0.55) {
      ctx.globalAlpha = 0.35 + Math.random() * 0.3;
      ctx.fillStyle = '#FFB8D8';
      ctx.fillRect(0, Math.random() * H, W, 2 + Math.floor(Math.random() * 4));
    }

    ctx.globalAlpha = 1;

    if (!midFired && prog > MID_PROGRESS) {
      midFired = true;
      options.onMid?.();
    }

    if (elapsed < duration) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
      options.onDone?.();
    }
  };

  requestAnimationFrame(frame);
}
