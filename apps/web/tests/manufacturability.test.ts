import { describe, expect, it } from 'vitest';
import { analyzeManufacturability, type MeshStats } from '../lib/manufacturability';

const codes = (s: MeshStats) => analyzeManufacturability(s).map((w) => w.code);

describe('analyzeManufacturability', () => {
  it('a healthy 50mm solid cube produces no warnings', () => {
    expect(analyzeManufacturability({ volumeMm3: 125000, bboxSize: [50, 50, 50], triangleCount: 12 })).toEqual([]);
  });

  it('flags exceeding the 256mm build envelope as an error', () => {
    const w = analyzeManufacturability({ volumeMm3: 1_500_000, bboxSize: [300, 100, 100], triangleCount: 12 });
    const e = w.find((x) => x.code === 'build_envelope');
    expect(e).toBeDefined();
    expect(e!.severity).toBe('error');
  });

  it('flags very small models (likely inch export)', () => {
    expect(codes({ volumeMm3: 8, bboxSize: [2, 2, 2], triangleCount: 12 })).toContain('tiny_units');
  });

  it('flags thin walls when the thinnest extent is below the min feature size', () => {
    expect(codes({ volumeMm3: 8000, bboxSize: [100, 100, 0.8], triangleCount: 12 })).toContain('thin_wall');
  });

  it('flags likely non-watertight meshes (low volume vs bounding box)', () => {
    expect(codes({ volumeMm3: 50, bboxSize: [100, 100, 100], triangleCount: 12 })).toContain('watertight');
  });

  it('flags high triangle counts as info (not error)', () => {
    const w = analyzeManufacturability({ volumeMm3: 125000, bboxSize: [50, 50, 50], triangleCount: 300_000 });
    const h = w.find((x) => x.code === 'high_poly');
    expect(h).toBeDefined();
    expect(h!.severity).toBe('info');
  });

  it('can surface multiple warnings at once', () => {
    // big + thin + hollow
    const c = codes({ volumeMm3: 10, bboxSize: [300, 300, 0.5], triangleCount: 12 });
    expect(c).toEqual(expect.arrayContaining(['build_envelope', 'thin_wall', 'watertight']));
  });
});
