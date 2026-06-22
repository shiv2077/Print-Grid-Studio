import { describe, expect, it } from 'vitest';
import { parseStl, StlParseError } from '@/lib/stl-parse';

// ---------------------------------------------------------------------------
// Cube fixtures — programmatically generated so the test owns the ground truth
// ---------------------------------------------------------------------------

/** 8 vertices of a 10mm cube centered at origin (±5 in each axis). */
const CUBE_VERTS: ReadonlyArray<readonly [number, number, number]> = [
  [-5, -5, -5], //0
  [ 5, -5, -5], //1
  [ 5,  5, -5], //2
  [-5,  5, -5], //3
  [-5, -5,  5], //4
  [ 5, -5,  5], //5
  [ 5,  5,  5], //6
  [-5,  5,  5], //7
];

/** 12 triangles forming the cube surface. CCW winding, outward normals. */
const CUBE_TRIS: ReadonlyArray<readonly [number, number, number]> = [
  // -Z (bottom)
  [0, 2, 1], [0, 3, 2],
  // +Z (top)
  [4, 5, 6], [4, 6, 7],
  // -Y (front)
  [0, 1, 5], [0, 5, 4],
  // +Y (back)
  [3, 6, 2], [3, 7, 6],
  // -X (left)
  [0, 4, 7], [0, 7, 3],
  // +X (right)
  [1, 2, 6], [1, 6, 5],
];

function buildBinaryCube(): ArrayBuffer {
  const triCount = CUBE_TRIS.length;
  const buffer = new ArrayBuffer(84 + triCount * 50);
  const view = new DataView(buffer);
  // 80-byte header is left as zeros — that's a valid binary STL.
  view.setUint32(80, triCount, true);
  let offset = 84;
  for (const tri of CUBE_TRIS) {
    // normal (zeros — parser ignores it for volume/bbox)
    view.setFloat32(offset + 0, 0, true);
    view.setFloat32(offset + 4, 0, true);
    view.setFloat32(offset + 8, 0, true);
    for (let v = 0; v < 3; v++) {
      const vert = CUBE_VERTS[tri[v]!]!;
      view.setFloat32(offset + 12 + v * 12 + 0, vert[0], true);
      view.setFloat32(offset + 12 + v * 12 + 4, vert[1], true);
      view.setFloat32(offset + 12 + v * 12 + 8, vert[2], true);
    }
    // attribute byte count (2 bytes) — leave as zero
    offset += 50;
  }
  return buffer;
}

function buildAsciiCube(): ArrayBuffer {
  const lines: string[] = ['solid cube'];
  for (const tri of CUBE_TRIS) {
    lines.push('  facet normal 0 0 0');
    lines.push('    outer loop');
    for (let v = 0; v < 3; v++) {
      const vert = CUBE_VERTS[tri[v]!]!;
      lines.push(`      vertex ${vert[0]} ${vert[1]} ${vert[2]}`);
    }
    lines.push('    endloop');
    lines.push('  endfacet');
  }
  lines.push('endsolid cube');
  return new TextEncoder().encode(lines.join('\n')).buffer as ArrayBuffer;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('parseStl — binary cube', () => {
  const buffer = buildBinaryCube();

  it('detects binary (not ASCII)', () => {
    const r = parseStl(buffer);
    expect(r.isAscii).toBe(false);
  });

  it('reports 12 triangles', () => {
    const r = parseStl(buffer);
    expect(r.triangleCount).toBe(12);
  });

  it('computes volume within 0.1% of analytic 1000 mm³', () => {
    const r = parseStl(buffer);
    expect(r.volumeMm3).toBeGreaterThan(999);
    expect(r.volumeMm3).toBeLessThan(1001);
  });

  it('computes bbox correctly', () => {
    const r = parseStl(buffer);
    expect(r.bboxMin).toEqual([-5, -5, -5]);
    expect(r.bboxMax).toEqual([5, 5, 5]);
    expect(r.bboxSize).toEqual([10, 10, 10]);
  });

  it('reports parse time as a non-negative number', () => {
    const r = parseStl(buffer);
    expect(r.parseTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('flags highPolyWarning false for 12 triangles', () => {
    const r = parseStl(buffer);
    expect(r.highPolyWarning).toBe(false);
  });
});

describe('parseStl — ASCII cube', () => {
  const buffer = buildAsciiCube();

  it('detects ASCII', () => {
    const r = parseStl(buffer);
    expect(r.isAscii).toBe(true);
  });

  it('reports 12 triangles', () => {
    const r = parseStl(buffer);
    expect(r.triangleCount).toBe(12);
  });

  it('computes volume within 1% of analytic', () => {
    const r = parseStl(buffer);
    expect(Math.abs(r.volumeMm3 - 1000)).toBeLessThan(10);
  });

  it('computes bbox correctly', () => {
    const r = parseStl(buffer);
    expect(r.bboxMin).toEqual([-5, -5, -5]);
    expect(r.bboxMax).toEqual([5, 5, 5]);
  });
});

describe('parseStl — error cases', () => {
  it('throws EMPTY on a zero-byte buffer', () => {
    try {
      parseStl(new ArrayBuffer(0));
      expect.fail('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(StlParseError);
      if (err instanceof StlParseError) expect(err.code).toBe('EMPTY');
    }
  });

  it('throws TOO_LARGE on a 101MB buffer', () => {
    // Use a single byte at the end to size the buffer cheaply.
    const buf = new ArrayBuffer(100 * 1024 * 1024 + 1);
    try {
      parseStl(buf);
      expect.fail('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(StlParseError);
      if (err instanceof StlParseError) expect(err.code).toBe('TOO_LARGE');
    }
  });

  it('throws PARSE_ERROR on a binary STL with size mismatch', () => {
    // Header claims 100 triangles but buffer only has 1.
    const buf = new ArrayBuffer(84 + 50);
    new DataView(buf).setUint32(80, 100, true);
    try {
      parseStl(buf);
      expect.fail('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(StlParseError);
      if (err instanceof StlParseError) expect(err.code).toBe('PARSE_ERROR');
    }
  });

  it('throws PARSE_ERROR on ASCII STL with no facets', () => {
    const text = 'solid empty\n  facet normal nothing here\nendsolid empty';
    const buf = new TextEncoder().encode(text).buffer as ArrayBuffer;
    expect(() => parseStl(buf)).toThrow(StlParseError);
  });
});

describe('parseStl — high-poly flag', () => {
  it('flags highPolyWarning when triangleCount > 250000', () => {
    // Build a binary STL header that claims 300000 triangles, then provide
    // exactly that many degenerate (zero-area) triangles. We don't care about
    // volume correctness here — only that the flag flips.
    const triCount = 300_000;
    const buf = new ArrayBuffer(84 + triCount * 50);
    new DataView(buf).setUint32(80, triCount, true);
    // All vertices remain at (0,0,0) — degenerate but parseable.
    const r = parseStl(buf);
    expect(r.triangleCount).toBe(triCount);
    expect(r.highPolyWarning).toBe(true);
  });
});
