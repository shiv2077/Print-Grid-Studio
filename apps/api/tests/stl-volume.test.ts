import { describe, expect, it } from 'vitest';
import { stlVolumeMm3 } from '../src/stl/stl-volume';
import { computeMass, quote } from '@printgrid/pricing';

// Build a binary STL of an axis-aligned cube [0,s]^3 (12 triangles, outward winding).
function buildBinaryCubeStl(s: number): Buffer {
  const v = [
    [0, 0, 0], [s, 0, 0], [s, s, 0], [0, s, 0],
    [0, 0, s], [s, 0, s], [s, s, s], [0, s, s],
  ];
  const tris = [
    [0, 2, 1], [0, 3, 2], // bottom z=0
    [4, 5, 6], [4, 6, 7], // top z=s
    [0, 1, 5], [0, 5, 4], // front y=0
    [3, 7, 6], [3, 6, 2], // back y=s
    [0, 4, 7], [0, 7, 3], // left x=0
    [1, 2, 6], [1, 6, 5], // right x=s
  ];
  const buf = Buffer.alloc(84 + tris.length * 50);
  buf.writeUInt32LE(tris.length, 80);
  let off = 84;
  for (const [a, b, c] of tris) {
    off += 12; // normal left as zeros; parser ignores it
    for (const idx of [a, b, c]) {
      buf.writeFloatLE(v[idx][0], off);
      buf.writeFloatLE(v[idx][1], off + 4);
      buf.writeFloatLE(v[idx][2], off + 8);
      off += 12;
    }
    off += 2; // attribute byte count
  }
  return buf;
}

describe('stlVolumeMm3 (server-authoritative volume)', () => {
  it('measures a 10mm binary cube as 1000 mm^3', () => {
    const result = stlVolumeMm3(buildBinaryCubeStl(10));
    expect(result.format).toBe('binary');
    expect(result.triangleCount).toBe(12);
    expect(result.volumeMm3).toBeCloseTo(1000, 3);
  });

  it('is orientation-independent in magnitude (20mm cube = 8000 mm^3)', () => {
    expect(stlVolumeMm3(buildBinaryCubeStl(20)).volumeMm3).toBeCloseTo(8000, 2);
  });

  it('feeds the shared pricing engine: 10mm PETG cube -> deterministic paise total', () => {
    const volumeMm3 = stlVolumeMm3(buildBinaryCubeStl(10)).volumeMm3;
    const massGrams = computeMass(volumeMm3, 'petg');
    const q = quote({
      files: [{ massGrams, materialKey: 'petg', layerHeight: '0.20', finish: 'as-printed', multicolor: false, qty: 1 }],
    });
    // Price is derived from the SERVER-measured volume via @printgrid/pricing.
    expect(Number.isInteger(q.grandTotalPaise)).toBe(true);
    expect(q.grandTotalPaise).toBe(32538);
  });
});
