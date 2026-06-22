// Manufacturability checks — pure geometric analysis of the mesh stats we
// already compute (volume, bounding box, triangle count). No AI, no STEP, no
// auto-repair; advisory only (never affects price or payment).

export interface MeshStats {
  volumeMm3: number;
  bboxSize: readonly [number, number, number];
  triangleCount: number;
}

export type Severity = 'error' | 'warning' | 'info';

export interface ManufacturabilityWarning {
  code: 'build_envelope' | 'tiny_units' | 'thin_wall' | 'watertight' | 'high_poly';
  severity: Severity;
  message: string;
}

export const BUILD_ENVELOPE_MM = 256; // Bambu P1S usable bed
export const MIN_FEATURE_MM = 1.2; // ~3 perimeters at a 0.4mm nozzle
export const HIGH_POLY = 250_000;
const TINY_MAX_MM = 10; // likely an inch-export mistake below this
const WATERTIGHT_RATIO = 0.02; // volume/bbox below this looks open/hollow

export function analyzeManufacturability(stats: MeshStats): ManufacturabilityWarning[] {
  const out: ManufacturabilityWarning[] = [];
  const [x, y, z] = stats.bboxSize;
  const maxDim = Math.max(x, y, z);
  const minDim = Math.min(x, y, z);

  // 1. Build envelope.
  if (maxDim > BUILD_ENVELOPE_MM) {
    out.push({
      code: 'build_envelope',
      severity: 'error',
      message: `Largest dimension ~${maxDim.toFixed(0)}mm exceeds the ${BUILD_ENVELOPE_MM}mm build envelope — scale down or split the part.`,
    });
  }

  // 2. Unit sanity (inch export).
  if (maxDim > 0 && maxDim < TINY_MAX_MM) {
    out.push({
      code: 'tiny_units',
      severity: 'warning',
      message: 'Model is very small — if it was exported in inches, scale it ×25.4.',
    });
  }

  // 3. Thin-wall / min feature size (heuristic: thinnest overall extent).
  if (minDim > 0 && minDim < MIN_FEATURE_MM) {
    out.push({
      code: 'thin_wall',
      severity: 'warning',
      message: `Thinnest extent ~${minDim.toFixed(1)}mm is below the ~${MIN_FEATURE_MM}mm we can reliably print — fine features may not survive.`,
    });
  }

  // 4. Watertightness (heuristic: volume vs bounding-box volume).
  const bboxVol = x * y * z;
  if (bboxVol > 0 && stats.volumeMm3 / bboxVol < WATERTIGHT_RATIO) {
    out.push({
      code: 'watertight',
      severity: 'warning',
      message: 'Measured volume is very low vs the bounding box — the mesh may be open / not watertight. We confirm this before printing.',
    });
  }

  // 5. High poly (informational; printing is unaffected).
  if (stats.triangleCount > HIGH_POLY) {
    out.push({
      code: 'high_poly',
      severity: 'info',
      message: `High triangle count (${stats.triangleCount.toLocaleString()}) — the preview is simplified; printing is unaffected.`,
    });
  }

  return out;
}
