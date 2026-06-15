/* CAD-style isometric wireframe of a 256×256×256mm build envelope
   with axis arrows + dimension labels in mono. */

import clsx from 'clsx';
import illuStyles from './illustration.module.css';

export interface BuildEnvelopeDiagramProps {
  className?: string;
  ariaLabel?: string;
}

export function BuildEnvelopeDiagram({
  className,
  ariaLabel = 'Isometric wireframe diagram of a 256mm cubic build envelope',
}: BuildEnvelopeDiagramProps) {
  // Isometric projection: 30deg axes
  // Cube vertices (front-bottom-left at origin, right-handed)
  // Front face: square 0-1-2-3 at z=0
  // Back face: same shifted by isometric offset
  const isoX = 60; // horizontal projection of depth
  const isoY = -34; // vertical projection of depth

  // Front face square (size 200, top-left at 60,180 -> bottom-right at 260,40)
  const front = {
    bl: { x: 60, y: 240 },
    br: { x: 260, y: 240 },
    tr: { x: 260, y: 40 },
    tl: { x: 60, y: 40 },
  };
  const back = {
    bl: { x: front.bl.x + isoX, y: front.bl.y + isoY },
    br: { x: front.br.x + isoX, y: front.br.y + isoY },
    tr: { x: front.tr.x + isoX, y: front.tr.y + isoY },
    tl: { x: front.tl.x + isoX, y: front.tl.y + isoY },
  };

  return (
    <svg
      className={clsx(illuStyles.svgRoot, className)}
      viewBox="0 0 410 360"
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
        PG-ENV-256 · BUILD VOLUME · ISO
      </text>

      <g transform="translate(0, 30)">
      {/* Hidden edges (back) — dashed */}
      <g stroke="var(--ink-50)" strokeWidth="1" strokeDasharray="3 3" fill="none">
        <line x1={back.bl.x} y1={back.bl.y} x2={back.br.x} y2={back.br.y} />
        <line x1={back.bl.x} y1={back.bl.y} x2={back.tl.x} y2={back.tl.y} />
        <line x1={back.bl.x} y1={back.bl.y} x2={front.bl.x} y2={front.bl.y} />
      </g>

      {/* Visible edges (front + connections) — solid */}
      <g stroke="var(--ink)" strokeWidth="1.5" fill="none">
        {/* Front face */}
        <line x1={front.bl.x} y1={front.bl.y} x2={front.br.x} y2={front.br.y} />
        <line x1={front.br.x} y1={front.br.y} x2={front.tr.x} y2={front.tr.y} />
        <line x1={front.tr.x} y1={front.tr.y} x2={front.tl.x} y2={front.tl.y} />
        <line x1={front.tl.x} y1={front.tl.y} x2={front.bl.x} y2={front.bl.y} />
        {/* Top face perspective edges */}
        <line x1={front.tl.x} y1={front.tl.y} x2={back.tl.x} y2={back.tl.y} />
        <line x1={front.tr.x} y1={front.tr.y} x2={back.tr.x} y2={back.tr.y} />
        <line x1={back.tl.x} y1={back.tl.y} x2={back.tr.x} y2={back.tr.y} />
        {/* Bottom-right connection */}
        <line x1={front.br.x} y1={front.br.y} x2={back.br.x} y2={back.br.y} />
      </g>

      {/* Sample part inside — solid ink-filled cube. The envelope itself
          stays wireframe; the inner part is the visual mass that signals
          "your part fits inside the volume". No colour, just contrast. */}
      <g stroke="var(--ink)" strokeWidth="1" fill="var(--ink)">
        <polygon points="130,220 190,220 208,208 148,208" />
        <polygon points="190,160 190,220 208,208 208,148" />
        <polygon points="130,160 190,160 208,148 148,148" />
      </g>
      <g stroke="var(--ink)" strokeWidth="1" fill="none">
        <rect x="130" y="160" width="60" height="60" />
        <line x1="130" y1="160" x2="148" y2="148" />
        <line x1="190" y1="160" x2="208" y2="148" />
        <line x1="148" y1="148" x2="208" y2="148" />
        <line x1="208" y1="148" x2="208" y2="208" />
        <line x1="190" y1="220" x2="208" y2="208" />
      </g>

      {/* Dimension labels */}
      <g
        fontFamily="var(--font-jetbrains)"
        fontSize="11"
        fontWeight="500"
        letterSpacing="0.05em"
        fill="var(--ink-70)"
      >
        <text x="160" y="270" textAnchor="middle">
          X · 256 mm
        </text>
        <text x="44" y="144" transform="rotate(-90 44 144)" textAnchor="middle">
          Z · 256 mm
        </text>
        <text x="296" y="284">
          Y · 256
        </text>
      </g>

      {/* Origin marker — kept neutral; the solid inner sample part is the
          diagram's focal point (mass, not colour). */}
      <circle cx={front.bl.x} cy={front.bl.y} r="3" fill="var(--ink-70)" />
      <text
        x={front.bl.x - 6}
        y={front.bl.y + 16}
        fontFamily="var(--font-jetbrains)"
        fontSize="10"
        fontWeight="500"
        letterSpacing="0.05em"
        fill="var(--ink-70)"
        textAnchor="end"
      >
        0,0,0
      </text>
      </g>
    </svg>
  );
}
