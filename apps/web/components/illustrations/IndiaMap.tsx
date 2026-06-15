/* Simplified outline of India as a single SVG path. Not a precise
   cartographic boundary — a recognisable silhouette for the shipping
   section. Path was traced by hand to ~30 control points for a clean,
   industrial-diagram read.

   One filled circle marks Chennai, plus dotted radial reach lines to
   four corners of the country to evoke "ships pan-India". */

import clsx from 'clsx';
import illuStyles from './illustration.module.css';

export interface IndiaMapProps {
  className?: string;
  ariaLabel?: string;
}

const INDIA_PATH =
  'M170 30 L182 28 L196 32 L208 28 L220 32 L228 40 L240 50 L246 64 L252 80 ' +
  'L258 92 L262 108 L268 120 L274 138 L286 152 L292 168 L298 178 L308 188 ' +
  'L304 200 L298 210 L290 222 L282 234 L270 246 L258 258 L242 270 L226 282 ' +
  'L208 290 L192 296 L180 300 L168 304 L156 298 L150 286 L144 270 L138 256 ' +
  'L130 240 L122 226 L116 210 L110 196 L104 180 L98 166 L92 152 L86 138 ' +
  'L80 124 L78 108 L82 92 L90 80 L100 70 L112 62 L126 56 L140 48 L154 40 Z';

// Approximate position of Chennai on the path: roughly bottom-east coast.
const CHENNAI = { x: 244, y: 256 };

const REACH_TARGETS: ReadonlyArray<{ x: number; y: number; label: string }> = [
  { x: 196, y: 60, label: 'NORTH' },     // upper india
  { x: 102, y: 110, label: 'NW' },        // ~mumbai
  { x: 290, y: 200, label: 'NE' },        // ~kolkata-ish
  { x: 174, y: 286, label: 'SOUTH' },    // ~kerala
];

export function IndiaMap({
  className,
  ariaLabel = 'Outline of India with Chennai marked and shipping reach lines to the four corners of the country',
}: IndiaMapProps) {
  return (
    <svg
      className={clsx(illuStyles.svgRoot, className)}
      viewBox="0 0 360 360"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel}
    >
      {/* Drawing frame */}
      <rect
        x="20"
        y="20"
        width="320"
        height="320"
        fill="none"
        stroke="var(--ink-30)"
        strokeWidth="1"
        shapeRendering="crispEdges"
      />
      <line
        x1="20"
        y1="56"
        x2="340"
        y2="56"
        stroke="var(--ink-30)"
        strokeWidth="1"
        shapeRendering="crispEdges"
      />
      <text
        x="32"
        y="44"
        fontFamily="var(--font-jetbrains)"
        fontSize="9"
        fontWeight="500"
        letterSpacing="0.1em"
        fill="var(--ink-70)"
      >
        PG-SHIP-IN · 4-DAY REACH · APPROX
      </text>

      {/* India outline */}
      <path
        d={INDIA_PATH}
        fill="var(--paper)"
        stroke="var(--ink)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Reach lines from Chennai */}
      <g stroke="var(--ink-50)" strokeWidth="1" strokeDasharray="2 4">
        {REACH_TARGETS.map((t, i) => (
          <line
            key={i}
            x1={CHENNAI.x}
            y1={CHENNAI.y}
            x2={t.x}
            y2={t.y}
          />
        ))}
      </g>

      {/* Reach endpoint dots */}
      <g fill="var(--ink-50)">
        {REACH_TARGETS.map((t, i) => (
          <circle key={i} cx={t.x} cy={t.y} r="2" />
        ))}
      </g>

      {/* Chennai marker — solid ink dot with a hairline halo ring. The
          dot is the heaviest mark on the map; the ring suggests "origin". */}
      <circle cx={CHENNAI.x} cy={CHENNAI.y} r="6" fill="var(--ink)" />
      <circle cx={CHENNAI.x} cy={CHENNAI.y} r="11" fill="none" stroke="var(--ink)" strokeWidth="1" />
      <line
        x1={CHENNAI.x + 16}
        y1={CHENNAI.y}
        x2={CHENNAI.x + 44}
        y2={CHENNAI.y}
        stroke="var(--ink)"
        strokeWidth="1"
      />
      <text
        x={CHENNAI.x + 50}
        y={CHENNAI.y + 4}
        fontFamily="var(--font-jetbrains)"
        fontSize="11"
        fontWeight="600"
        letterSpacing="0.05em"
        fill="var(--ink)"
      >
        CHENNAI · 13.08° N
      </text>
    </svg>
  );
}
