'use client';
import { useEffect, useRef } from 'react';

// Dot-matrix point cloud of a real printed part (public/v2/part.stl), rendered
// on a plain 2D canvas — no three.js, no runtime STL parser. Points are
// precomputed at build time (scripts/gen-hero-points.mjs). Perf guards:
//  - DPR capped at 1.5
//  - ~30fps cap (timestamp throttle)
//  - paused when the tab is hidden OR the canvas is scrolled out of view
//  - default export so it can be code-split via next/dynamic (ssr:false)
const ACCENT = [229, 89, 52]; // #E55934
const FPS_MS = 1000 / 30;
const SPEED = 0.16; // rad/sec

export default function HeroPointCloud() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let points: number[] = [];
    let raf = 0;
    let last = 0;
    let angle = 0;
    let prev = 0;
    let visible = true;
    let running = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const size = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
    };

    const draw = () => {
      const w = canvas.width, h = canvas.height;
      const cx = w / 2, cy = h / 2;
      const scale = Math.min(w, h) * 0.44;
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, w, h);
      const ca = Math.cos(angle), sa = Math.sin(angle);
      const tilt = -0.42, ct = Math.cos(tilt), st = Math.sin(tilt);
      const dot = Math.max(1.4 * dpr, 1.6);
      // render order: far → near via simple z key (sort indices)
      const order: { i: number; z: number; px: number; py: number }[] = [];
      for (let n = 0; n < points.length; n += 3) {
        const x = points[n]!, y = points[n + 1]!, z = points[n + 2]!;
        const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;       // rotate Y
        const y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;      // tilt X
        order.push({ i: n, z: z2, px: cx + x1 * scale, py: cy - y2 * scale });
      }
      order.sort((a, b) => a.z - b.z);
      for (const p of order) {
        const t = (p.z + 0.7) / 1.4;                 // 0..1 depth
        const a = 0.32 + t * 0.62;
        const s = dot * (0.7 + t * 0.9);
        ctx.fillStyle = `rgba(${ACCENT[0]},${ACCENT[1]},${ACCENT[2]},${a.toFixed(3)})`;
        ctx.fillRect(p.px - s / 2, p.py - s / 2, s, s);          // square dots
      }
    };

    const loop = (ts: number) => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      if (ts - last < FPS_MS) return;
      const dt = prev ? (ts - prev) / 1000 : 0;
      prev = ts;
      last = ts;
      angle += SPEED * dt;
      draw();
    };

    const start = () => { if (!running && visible && points.length) { running = true; prev = 0; raf = requestAnimationFrame(loop); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    const onVisibility = () => { if (document.hidden) stop(); else start(); };
    const io = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver((entries) => { const e = entries[0]; if (!e) return; visible = e.isIntersecting; visible ? start() : stop(); }, { threshold: 0 })
      : null;

    const onResize = () => { size(); if (!running) draw(); };

    size();
    fetch('/v2/part-points.json')
      .then((r) => r.json())
      .then((d) => {
        points = d.points || [];
        draw();
        if (io) io.observe(canvas); else start();
      })
      .catch(() => { /* fallback SVG stays visible underneath */ });

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize);

    return () => {
      stop();
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={ref} className="v2-herovis__canvas" aria-hidden="true" />;
}
