/* eslint-disable */
/* PrintGrid Studio — classic Web Worker for STL parsing.
   Vanilla JS so Next.js serves it from /public without a bundler step.
   Loaded via: new Worker('/stl-parser.worker.js')

   This file MIRRORS lib/stl-parse.ts. Classic workers cannot import
   ESM modules, so the algorithm is duplicated. If you change one, change
   both — drift risk is documented in BUILD_LOG/needs-human.md. */

/** @typedef {[number, number, number]} Vec3 */

const STL_MAX_BYTES = 100 * 1024 * 1024;
const HIGH_POLY_THRESHOLD = 250000;
const TEXT_DECODER = new TextDecoder('utf-8');

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !(data.buffer instanceof ArrayBuffer)) {
    self.postMessage({
      ok: false,
      error: { code: 'PARSE_ERROR', message: 'Worker expected { buffer: ArrayBuffer }' },
    });
    return;
  }
  try {
    const result = parseStl(data.buffer);
    self.postMessage({ ok: true, result });
  } catch (err) {
    const code = err && err.code ? err.code : 'PARSE_ERROR';
    const message = err && err.message ? err.message : String(err);
    self.postMessage({ ok: false, error: { code, message } });
  }
});

function parseStl(buffer) {
  const start =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();

  if (buffer.byteLength === 0) {
    throw withCode('EMPTY', 'STL file is empty');
  }
  if (buffer.byteLength > STL_MAX_BYTES) {
    throw withCode('TOO_LARGE', 'STL file exceeds 100MB limit');
  }

  const isAscii = detectAscii(buffer);
  const parsed = isAscii ? parseAscii(buffer) : parseBinary(buffer);

  const end =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();

  return Object.assign({}, parsed, {
    isAscii,
    parseTimeMs: end - start,
    highPolyWarning: parsed.triangleCount > HIGH_POLY_THRESHOLD,
  });
}

function withCode(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function detectAscii(buffer) {
  if (buffer.byteLength < 84) return true;
  const head = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 256));
  const headText = TEXT_DECODER.decode(head);
  if (!/^solid\s/i.test(headText)) return false;
  return /facet\s+normal/i.test(headText.slice(0, 200));
}

function parseBinary(buffer) {
  if (buffer.byteLength < 84) {
    throw withCode('PARSE_ERROR', 'Binary STL too short for header');
  }
  const view = new DataView(buffer);
  const triCount = view.getUint32(80, true);
  const expected = 84 + triCount * 50;
  if (buffer.byteLength !== expected) {
    throw withCode(
      'PARSE_ERROR',
      'Binary STL size mismatch: header says ' +
        triCount +
        ' triangles (' +
        expected +
        ' bytes) but buffer is ' +
        buffer.byteLength +
        ' bytes'
    );
  }

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  let signedVolume = 0;

  let offset = 84;
  for (let i = 0; i < triCount; i++) {
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

function parseAscii(buffer) {
  const text = TEXT_DECODER.decode(new Uint8Array(buffer));
  const facetRe =
    /facet\s+normal\s+(\S+)\s+(\S+)\s+(\S+)[\s\S]*?vertex\s+(\S+)\s+(\S+)\s+(\S+)[\s\S]*?vertex\s+(\S+)\s+(\S+)\s+(\S+)[\s\S]*?vertex\s+(\S+)\s+(\S+)\s+(\S+)[\s\S]*?endfacet/g;

  let match;
  let triCount = 0;
  let signedVolume = 0;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  while ((match = facetRe.exec(text)) !== null) {
    const v0x = parseFloat(match[4]);
    const v0y = parseFloat(match[5]);
    const v0z = parseFloat(match[6]);
    const v1x = parseFloat(match[7]);
    const v1y = parseFloat(match[8]);
    const v1z = parseFloat(match[9]);
    const v2x = parseFloat(match[10]);
    const v2y = parseFloat(match[11]);
    const v2z = parseFloat(match[12]);

    if (
      [v0x, v0y, v0z, v1x, v1y, v1z, v2x, v2y, v2z].some((n) => Number.isNaN(n))
    ) {
      throw withCode('PARSE_ERROR', 'ASCII STL facet ' + triCount + ' has non-numeric vertex');
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
    throw withCode('PARSE_ERROR', 'ASCII STL contained no facets');
  }

  return finalize(triCount, signedVolume, minX, minY, minZ, maxX, maxY, maxZ);
}

function signedTetraVolume(v0x, v0y, v0z, v1x, v1y, v1z, v2x, v2y, v2z) {
  const cx = v1y * v2z - v1z * v2y;
  const cy = v1z * v2x - v1x * v2z;
  const cz = v1x * v2y - v1y * v2x;
  return (v0x * cx + v0y * cy + v0z * cz) / 6;
}

function finalize(triCount, signedVolume, minX, minY, minZ, maxX, maxY, maxZ) {
  return {
    triangleCount: triCount,
    volumeMm3: Math.abs(signedVolume),
    bboxMin: [minX, minY, minZ],
    bboxMax: [maxX, maxY, maxZ],
    bboxSize: [maxX - minX, maxY - minY, maxZ - minZ],
  };
}
