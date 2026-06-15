/* CAD-style hairline diagram of an FDM printer's hot-end + gantry.
   Pure inline SVG. All strokes 1px (or 1.5px for the extruder body to
   read at scale). No fills except the extruder body's interior tint.
   Dimension callouts use JetBrains Mono via the .mono-spec class. */

import clsx from 'clsx';
import illuStyles from './illustration.module.css';

export interface ExtruderDiagramProps {
  className?: string;
  ariaLabel?: string;
}

export function ExtruderDiagram({
  className,
  ariaLabel = 'Diagram of an FDM extruder over a build plate',
}: ExtruderDiagramProps) {
  return (
    <svg
      className={clsx(illuStyles.svgRoot, className)}
      viewBox="0 0 360 360"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel}
    >
      {/* Outer engineering frame */}
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

      {/* Crosshair tick marks at corners */}
      <g stroke="var(--ink-30)" strokeWidth="1" shapeRendering="crispEdges">
        <line x1="20" y1="40" x2="32" y2="40" />
        <line x1="40" y1="20" x2="40" y2="32" />
        <line x1="328" y1="40" x2="340" y2="40" />
        <line x1="320" y1="20" x2="320" y2="32" />
        <line x1="20" y1="320" x2="32" y2="320" />
        <line x1="40" y1="328" x2="40" y2="340" />
        <line x1="328" y1="320" x2="340" y2="320" />
        <line x1="320" y1="328" x2="320" y2="340" />
      </g>

      {/* Title block — vintage-instrument-manual style */}
      <g>
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
          PG-EXT-001 · FDM HOT-END · 1:1
        </text>
      </g>

      {/* Gantry — horizontal beam */}
      <line
        x1="60"
        y1="100"
        x2="300"
        y2="100"
        stroke="var(--ink)"
        strokeWidth="2"
      />
      {/* Vertical rails */}
      <line
        x1="60"
        y1="100"
        x2="60"
        y2="280"
        stroke="var(--ink)"
        strokeWidth="2"
      />
      <line
        x1="300"
        y1="100"
        x2="300"
        y2="280"
        stroke="var(--ink)"
        strokeWidth="2"
      />

      {/* Stepper motor box */}
      <rect
        x="155"
        y="80"
        width="50"
        height="40"
        fill="var(--paper)"
        stroke="var(--ink)"
        strokeWidth="1.5"
      />
      {/* Motor axis dot */}
      <circle cx="180" cy="100" r="3" fill="var(--ink)" />

      {/* Hot-end carriage */}
      <rect
        x="160"
        y="120"
        width="40"
        height="60"
        fill="var(--paper-warm)"
        stroke="var(--ink)"
        strokeWidth="1.5"
      />

      {/* Hot-end nozzle — solid ink fill. The single mass of black at the
          bottom of the carriage is the visual focal point of the diagram. */}
      <polygon
        points="172,180 188,180 184,200 176,200"
        fill="var(--ink)"
        stroke="var(--ink)"
        strokeWidth="1"
      />

      {/* Filament path — dashed line through the carriage */}
      <line
        x1="180"
        y1="120"
        x2="180"
        y2="200"
        stroke="var(--ink-70)"
        strokeWidth="1"
        strokeDasharray="2 3"
      />

      {/* Build plate */}
      <line
        x1="60"
        y1="280"
        x2="300"
        y2="280"
        stroke="var(--ink)"
        strokeWidth="2"
      />
      <rect
        x="60"
        y="280"
        width="240"
        height="8"
        fill="var(--ink-10)"
        stroke="var(--ink)"
        strokeWidth="1"
      />

      {/* Sample part on build plate */}
      <rect
        x="140"
        y="240"
        width="80"
        height="40"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="1"
      />
      <line
        x1="140"
        y1="280"
        x2="220"
        y2="240"
        stroke="var(--ink-30)"
        strokeWidth="1"
      />
      <line
        x1="220"
        y1="280"
        x2="140"
        y2="240"
        stroke="var(--ink-30)"
        strokeWidth="1"
      />

      {/* Dimension callouts */}
      <g>
        {/* Width callout below build plate */}
        <line
          x1="60"
          y1="308"
          x2="300"
          y2="308"
          stroke="var(--ink-70)"
          strokeWidth="1"
        />
        <line
          x1="60"
          y1="304"
          x2="60"
          y2="312"
          stroke="var(--ink-70)"
          strokeWidth="1"
        />
        <line
          x1="300"
          y1="304"
          x2="300"
          y2="312"
          stroke="var(--ink-70)"
          strokeWidth="1"
        />
        <text
          x="180"
          y="324"
          fontFamily="var(--font-jetbrains)"
          fontSize="11"
          fontWeight="500"
          letterSpacing="0.05em"
          fill="var(--ink-70)"
          textAnchor="middle"
        >
          256 mm
        </text>

        {/* Height callout right of carriage */}
        <line
          x1="220"
          y1="100"
          x2="220"
          y2="180"
          stroke="var(--ink-70)"
          strokeWidth="1"
        />
        <line
          x1="216"
          y1="100"
          x2="224"
          y2="100"
          stroke="var(--ink-70)"
          strokeWidth="1"
        />
        <line
          x1="216"
          y1="180"
          x2="224"
          y2="180"
          stroke="var(--ink-70)"
          strokeWidth="1"
        />
        <text
          x="232"
          y="144"
          fontFamily="var(--font-jetbrains)"
          fontSize="11"
          fontWeight="500"
          letterSpacing="0.05em"
          fill="var(--ink-70)"
        >
          Z
        </text>
      </g>
    </svg>
  );
}
