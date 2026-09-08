'use client';
import { useEffect, useRef, useState } from 'react';
import { BAR_METRICS, MATERIALS, type BarMetric } from '../_data';

/** Horizontal comparison bars from real @printgrid/pricing material data.
 *  Toggle between strength / heat / cost. Bars animate (width) on first view
 *  via IntersectionObserver; reduced-motion users get the final widths
 *  instantly because the CSS transition collapses to ~0ms. */
export function MaterialBars() {
  const [metric, setMetric] = useState<BarMetric>('tensile');
  const [shown, setShown] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setShown(true); return; }
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e && e.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const active = BAR_METRICS.find((m) => m.key === metric)!;
  const values = MATERIALS.map((m) => active.get(m));
  const max = Math.max(...values);

  return (
    <div ref={ref}>
      <div className="v2-bars__metrics" role="group" aria-label="Compare materials by">
        {BAR_METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            className="v2-metric-toggle"
            aria-pressed={metric === m.key}
            onClick={() => setMetric(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="v2-bars">
        {MATERIALS.map((mat) => {
          const v = active.get(mat);
          const pct = max ? Math.round((v / max) * 100) : 0;
          return (
            <div className="v2-barrow" key={mat.key}>
              <div className="v2-barrow__name">{mat.name}</div>
              <div className="v2-barrow__track" role="img" aria-label={`${mat.name}: ${v} ${active.unit}`}>
                <div className="v2-barrow__fill" style={{ ['--v2-w' as string]: shown ? `${pct}%` : '0%' }} />
                <span className="v2-barrow__val">{v} {active.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
