import { describe, expect, it } from 'vitest';
import { meshVolumeMm3 } from '../lib/server/mesh-volume';
import { computeMass, quote } from '@printgrid/pricing';

function binaryCube(s: number): Buffer {
  const v = [
    [0, 0, 0], [s, 0, 0], [s, s, 0], [0, s, 0],
    [0, 0, s], [s, 0, s], [s, s, s], [0, s, s],
  ];
  const tris = [
    [0, 2, 1], [0, 3, 2], [4, 5, 6], [4, 6, 7],
    [0, 1, 5], [0, 5, 4], [3, 7, 6], [3, 6, 2],
    [0, 4, 7], [0, 7, 3], [1, 2, 6], [1, 6, 5],
  ];
  const buf = Buffer.alloc(84 + tris.length * 50);
  buf.writeUInt32LE(tris.length, 80);
  let off = 84;
  for (const [a, b, c] of tris) {
    off += 12;
    for (const idx of [a, b, c]) {
      buf.writeFloatLE(v[idx]![0]!, off);
      buf.writeFloatLE(v[idx]![1]!, off + 4);
      buf.writeFloatLE(v[idx]![2]!, off + 8);
      off += 12;
    }
    off += 2;
  }
  return buf;
}

const OBJ_CUBE = `v 0 0 0
v 10 0 0
v 10 10 0
v 0 10 0
v 0 0 10
v 10 0 10
v 10 10 10
v 0 10 10
f 1 3 2
f 1 4 3
f 5 6 7
f 5 7 8
f 1 2 6
f 1 6 5
f 4 8 7
f 4 7 3
f 1 5 8
f 1 8 4
f 2 3 7
f 2 7 6
`;

describe('meshVolumeMm3 (server-authoritative volume)', () => {
  it('measures a 10mm binary STL cube as 1000 mm^3', async () => {
    const r = await meshVolumeMm3(binaryCube(10), 'cube.stl');
    expect(r.format).toBe('stl');
    expect(r.volumeMm3).toBeCloseTo(1000, 2);
  });

  it('measures a 10mm OBJ cube as 1000 mm^3', async () => {
    const r = await meshVolumeMm3(Buffer.from(OBJ_CUBE, 'utf8'), 'cube.obj');
    expect(r.format).toBe('obj');
    expect(r.volumeMm3).toBeCloseTo(1000, 2);
  });

  it('feeds @printgrid/pricing: 10mm PETG cube -> 32538 paise (same for STL and OBJ)', async () => {
    for (const [buf, name] of [[binaryCube(10), 'c.stl'], [Buffer.from(OBJ_CUBE, 'utf8'), 'c.obj']] as const) {
      const volumeMm3 = (await meshVolumeMm3(buf, name)).volumeMm3;
      const q = quote({
        files: [{ massGrams: computeMass(volumeMm3, 'petg'), materialKey: 'petg', layerHeight: '0.20', finish: 'as-printed', multicolor: false, qty: 1 }],
      });
      expect(q.grandTotalPaise).toBe(32538);
    }
  });
});
