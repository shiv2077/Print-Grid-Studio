'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// The point-cloud canvas is code-split (ssr:false) and only mounted when motion
// is allowed and after first paint, so it never blocks LCP. Under
// prefers-reduced-motion it is never loaded — the static SVG poster stands in.
const HeroPointCloud = dynamic(() => import('./HeroPointCloud'), { ssr: false });

export function HeroVisual() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;
    // defer mount one tick past first paint
    const id = window.requestAnimationFrame(() => setAnimate(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div className="v2-herovis">
      {/* static poster: shows instantly, covers no-JS / reduced-motion / load gap */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="v2-herovis__fallback"
        src="/v2/hero-fallback.svg"
        alt=""
        aria-hidden="true"
        width={640}
        height={640}
      />
      {animate && <HeroPointCloud />}
      <div className="v2-herovis__frame" aria-hidden="true" />
      <span className="v2-herovis__label">part.stl · 1,620 pts</span>
    </div>
  );
}
