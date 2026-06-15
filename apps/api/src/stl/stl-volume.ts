// Server-authoritative STL volume. Pure, synchronous, milliseconds — no Python,
// no queue. Volume = |Σ signed-tetrahedron(v0,v1,v2)| over all triangles, which
// equals the enclosed volume for a closed mesh regardless of triangle winding.
// Units are taken as millimetres (STL convention); result is mm^3.

export interface StlVolumeResult {
  volumeMm3: number;
  triangleCount: number;
  format: 'binary' | 'ascii';
}

// (1/6) * v0 · (v1 × v2)
function signedTetraVolume(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  cx: number, cy: number, cz: number,
): number {
  const crossX = by * cz - bz * cy;
  const crossY = bz * cx - bx * cz;
  const crossZ = bx * cy - by * cx;
  return (ax * crossX + ay * crossY + az * crossZ) / 6;
}

// A binary STL is exactly 84 + 50*triangleCount bytes. ASCII STLs that merely
// start with the bytes "solid" will not match this size, so size is the reliable
// discriminator.
function looksBinary(buf: Buffer): boolean {
  if (buf.length < 84) return false;
  const count = buf.readUInt32LE(80);
  return buf.length === 84 + count * 50;
}

function parseBinary(buf: Buffer): StlVolumeResult {
  const triangleCount = buf.readUInt32LE(80);
  let vol = 0;
  let off = 84;
  for (let i = 0; i < triangleCount; i++) {
    const p = off + 12; // skip the 12-byte normal
    vol += signedTetraVolume(
      buf.readFloatLE(p), buf.readFloatLE(p + 4), buf.readFloatLE(p + 8),
      buf.readFloatLE(p + 12), buf.readFloatLE(p + 16), buf.readFloatLE(p + 20),
      buf.readFloatLE(p + 24), buf.readFloatLE(p + 28), buf.readFloatLE(p + 32),
    );
    off += 50;
  }
  return { volumeMm3: Math.abs(vol), triangleCount, format: 'binary' };
}

function parseAscii(buf: Buffer): StlVolumeResult {
  const text = buf.toString('utf8');
  const nums = /vertex\s+(-?[\d.eE+]+)\s+(-?[\d.eE+]+)\s+(-?[\d.eE+]+)/g;
  const verts: number[][] = [];
  let m: RegExpExecArray | null;
  while ((m = nums.exec(text)) !== null) {
    verts.push([parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])]);
  }
  if (verts.length % 3 !== 0) {
    throw new Error(`Malformed ASCII STL: ${verts.length} vertices is not a multiple of 3`);
  }
  let vol = 0;
  const triangleCount = verts.length / 3;
  for (let i = 0; i < verts.length; i += 3) {
    const [a, b, c] = [verts[i], verts[i + 1], verts[i + 2]];
    vol += signedTetraVolume(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  }
  return { volumeMm3: Math.abs(vol), triangleCount, format: 'ascii' };
}

export function stlVolumeMm3(buffer: Buffer): StlVolumeResult {
  if (!buffer || buffer.length === 0) {
    throw new Error('Empty STL buffer');
  }
  const result = looksBinary(buffer) ? parseBinary(buffer) : parseAscii(buffer);
  if (!Number.isFinite(result.volumeMm3) || result.volumeMm3 <= 0) {
    throw new Error('STL volume is zero or non-finite — not a valid closed mesh');
  }
  return result;
}
