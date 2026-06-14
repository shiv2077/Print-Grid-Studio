// Pure STL parser. Mirrors the logic in /public/stl-parser.worker.js.
// Tested directly in /tests/stl-parse.test.ts. The worker.js duplicates
// this algorithm because classic Web Workers cannot import ESM/TS
// modules; that drift risk is logged in BUILD_LOG/needs-human.md.

import {
  HIGH_POLY_THRESHOLD,
  STL_MAX_BYTES,
  type StlParseResult,
  type Vec3,
} from './stl-types';

const TEXT_DECODER = new TextDecoder('utf-8');

/** Throws on any parse failure. The worker translates throws into
 *  structured error messages; tests can catch directly. */
export function parseStl(buffer: ArrayBuffer): StlParseResult {
  const start =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();

  if (buffer.byteLength === 0) {
    throw new StlParseError('EMPTY', 'STL file is empty');
  }
  if (buffer.byteLength > STL_MAX_BYTES) {
    throw new StlParseError(
      'TOO_LARGE',
      `STL file exceeds ${STL_MAX_BYTES / (1024 * 1024)}MB limit`
    );
  }

  const isAscii = detectAscii(buffer);
  const parsed = isAscii ? parseAscii(buffer) : parseBinary(buffer);

  const end =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();

  return {
    ...parsed,
    isAscii,
    parseTimeMs: end - start,
    highPolyWarning: parsed.triangleCount > HIGH_POLY_THRESHOLD,
  };
}

export class StlParseError extends Error {
  constructor(public code: 'EMPTY' | 'TOO_LARGE' | 'PARSE_ERROR', message: string) {
    super(message);
    this.name = 'StlParseError';
  }
}

// -------------------------------------------------------------------
// ASCII vs binary detection
//
// Claude.md spec: "Detect ASCII vs binary by checking first 5 bytes
// for 'solid' + scanning for 'facet normal' within first 200 bytes."
// Some binary STLs ALSO start with "solid" in the 80-byte header, so
// the second check (facet normal in first 200 bytes) is the real one.
// -------------------------------------------------------------------
function detectAscii(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 84) return true; // can't be a valid binary STL
  const head = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 256));
  const headText = TEXT_DECODER.decode(head);
  // Strict: starts with "solid " (case-insensitive) AND has "facet normal"
  // in the first 200 bytes.
  if (!/^solid\s/i.test(headText)) return false;
  return /facet\s+normal/i.test(headText.slice(0, 200));
}

// -------------------------------------------------------------------
// Binary parse
// -------------------------------------------------------------------
interface RawParse {
  triangleCount: number;
  volumeMm3: number;
  bboxMin: Vec3;
  bboxMax: Vec3;
  bboxSize: Vec3;
}

function parseBinary(buffer: ArrayBuffer): RawParse {
  if (buffer.byteLength < 84) {
    throw new StlParseError('PARSE_ERROR', 'Binary STL too short for header');
  }
  const view = new DataView(buffer);
  const triCount = view.getUint32(80, true);
  const expected = 84 + triCount * 50;
  if (buffer.byteLength !== expected) {
    throw new StlParseError(
      'PARSE_ERROR',
      `Binary STL size mismatch: header says ${triCount} triangles ` +
        `(${expected} bytes) but buffer is ${buffer.byteLength} bytes`
    );
  }

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  let signedVolume = 0;

  let offset = 84;
  for (let i = 0; i < triCount; i++) {
    // skip 12-byte normal
    const v0x = view.getFloat32(offset + 12, true);
    const v0y = view.getFloat32(offset + 16, true);
    const v0z = view.getFloat32(offset + 20, true);
    const v1x = view.getFloat32(offset + 24, true);
    const v1y = view.getFloat32(offset + 28, true);
    const v1z = view.getFloat32(offset + 32, true);
    const v2x = view.getFloat32(offset + 36, true);
    const v2y = view.getFloat32(offset + 40, true);
    const v2z = view.getFloat32(offset + 44, true);

    signedVolume += signedTetraVolume(
      v0x, v0y, v0z,
      v1x, v1y, v1z,
      v2x, v2y, v2z
    );

    if (v0x < minX) minX = v0x; if (v0x > maxX) maxX = v0x;
    if (v0y < minY) minY = v0y; if (v0y > maxY) maxY = v0y;
    if (v0z < minZ) minZ = v0z; if (v0z > maxZ) maxZ = v0z;
    if (v1x < minX) minX = v1x; if (v1x > maxX) maxX = v1x;
    if (v1y < minY) minY = v1y; if (v1y > maxY) maxY = v1y;
    if (v1z < minZ) minZ = v1z; if (v1z > maxZ) maxZ = v1z;
    if (v2x < minX) minX = v2x; if (v2x > maxX) maxX = v2x;
    if (v2y < minY) minY = v2y; if (v2y > maxY) maxY = v2y;
    if (v2z < minZ) minZ = v2z; if (v2z > maxZ) maxZ = v2z;

    offset += 50;
  }

  return finalize(triCount, signedVolume, minX, minY, minZ, maxX, maxY, maxZ);
}

// -------------------------------------------------------------------
// ASCII parse
// -------------------------------------------------------------------
function parseAscii(buffer: ArrayBuffer): RawParse {
  const text = TEXT_DECODER.decode(new Uint8Array(buffer));
  // Match facet blocks. STL ASCII syntax:
  //   facet normal <nx> <ny> <nz>
  //     outer loop
  //       vertex <x> <y> <z>
  //       vertex <x> <y> <z>
  //       vertex <x> <y> <z>
  //     endloop
  //   endfacet
  const facetRe =
    /facet\s+normal\s+(\S+)\s+(\S+)\s+(\S+)[\s\S]*?vertex\s+(\S+)\s+(\S+)\s+(\S+)[\s\S]*?vertex\s+(\S+)\s+(\S+)\s+(\S+)[\s\S]*?vertex\s+(\S+)\s+(\S+)\s+(\S+)[\s\S]*?endfacet/g;

  let match: RegExpExecArray | null;
  let triCount = 0;
  let signedVolume = 0;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  while ((match = facetRe.exec(text)) !== null) {
    // match[1..3] are the normal — unused
    const v0x = parseFloat(match[4]!);
    const v0y = parseFloat(match[5]!);
    const v0z = parseFloat(match[6]!);
    const v1x = parseFloat(match[7]!);
    const v1y = parseFloat(match[8]!);
    const v1z = parseFloat(match[9]!);
    const v2x = parseFloat(match[10]!);
    const v2y = parseFloat(match[11]!);
    const v2z = parseFloat(match[12]!);

    if (
      [v0x, v0y, v0z, v1x, v1y, v1z, v2x, v2y, v2z].some((n) => Number.isNaN(n))
    ) {
      throw new StlParseError('PARSE_ERROR', `ASCII STL facet ${triCount} has non-numeric vertex`);
    }

    triCount++;
    signedVolume += signedTetraVolume(
      v0x, v0y, v0z,
      v1x, v1y, v1z,
      v2x, v2y, v2z
    );

    if (v0x < minX) minX = v0x; if (v0x > maxX) maxX = v0x;
    if (v0y < minY) minY = v0y; if (v0y > maxY) maxY = v0y;
    if (v0z < minZ) minZ = v0z; if (v0z > maxZ) maxZ = v0z;
    if (v1x < minX) minX = v1x; if (v1x > maxX) maxX = v1x;
    if (v1y < minY) minY = v1y; if (v1y > maxY) maxY = v1y;
    if (v1z < minZ) minZ = v1z; if (v1z > maxZ) maxZ = v1z;
    if (v2x < minX) minX = v2x; if (v2x > maxX) maxX = v2x;
    if (v2y < minY) minY = v2y; if (v2y > maxY) maxY = v2y;
    if (v2z < minZ) minZ = v2z; if (v2z > maxZ) maxZ = v2z;
  }

  if (triCount === 0) {
    throw new StlParseError('PARSE_ERROR', 'ASCII STL contained no facets');
  }

  return finalize(triCount, signedVolume, minX, minY, minZ, maxX, maxY, maxZ);
}

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------
function signedTetraVolume(
  v0x: number, v0y: number, v0z: number,
  v1x: number, v1y: number, v1z: number,
  v2x: number, v2y: number, v2z: number
): number {
  // (v0 · (v1 × v2)) / 6
  const cx = v1y * v2z - v1z * v2y;
  const cy = v1z * v2x - v1x * v2z;
  const cz = v1x * v2y - v1y * v2x;
  return (v0x * cx + v0y * cy + v0z * cz) / 6;
}

function finalize(
  triCount: number,
  signedVolume: number,
  minX: number, minY: number, minZ: number,
  maxX: number, maxY: number, maxZ: number
): RawParse {
  const bboxMin: Vec3 = [minX, minY, minZ];
  const bboxMax: Vec3 = [maxX, maxY, maxZ];
  const bboxSize: Vec3 = [maxX - minX, maxY - minY, maxZ - minZ];
  return {
    triangleCount: triCount,
    volumeMm3: Math.abs(signedVolume),
    bboxMin,
    bboxMax,
    bboxSize,
  };
}
