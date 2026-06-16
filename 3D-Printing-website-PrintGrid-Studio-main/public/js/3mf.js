// PrintGrid Studio — 3MF parser (v1)
//
// Treats a Bambu Studio (or generic) 3MF as a flat list of mesh objects.
// One row per <object> with a direct <mesh>. v1 limitations:
//   - Build-item transforms are NOT applied (mesh shows pre-transform geometry)
//   - Multi-plate organization is ignored — every plate's objects collapse together
//   - Component-only objects (which reference others via <components>) are skipped
//   - Painted multicolor / per-object material assignments not surfaced
//
// Dependency: jszip from CDN, exposed as window.JSZip. Loaded in quote.html
// via a classic <script> tag in <head>. ES modules can't import non-modules,
// so we read the global directly.
//
// Exports:
//   parse3MF(buffer: ArrayBuffer) → Promise<Array<{
//     objectName, triangles, volumeCm3, surfaceCm2, bbox, vertices, indices
//   }>>

const NS = 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02';

export async function parse3MF(buffer) {
  if (!(buffer instanceof ArrayBuffer)) {
    throw new Error('parse3MF expects an ArrayBuffer');
  }
  const JSZip = (typeof window !== 'undefined' && window.JSZip) || globalThis.JSZip;
  if (!JSZip) {
    throw new Error('JSZip not loaded — include the CDN <script> tag before parsing 3MF.');
  }

  // ── 1. Unzip ────────────────────────────────────────────────────────
  let zip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch (_) {
    throw new Error('3MF appears corrupt — file is not a valid ZIP archive.');
  }

  // ── 2. Locate model XML (case-insensitive — some writers use 3D/3DMODEL.MODEL) ──
  let modelEntry = zip.file('3D/3dmodel.model');
  if (!modelEntry) {
    const match = Object.keys(zip.files)
      .find((k) => k.toLowerCase() === '3d/3dmodel.model');
    if (match) modelEntry = zip.file(match);
  }
  if (!modelEntry) {
    throw new Error('Not a valid 3MF — missing 3D/3dmodel.model');
  }

  // ── 3. Parse XML ────────────────────────────────────────────────────
  const xmlText = await modelEntry.async('string');
  const parser  = new DOMParser();
  const doc     = parser.parseFromString(xmlText, 'application/xml');
  const parseErr = doc.getElementsByTagName('parsererror')[0];
  if (parseErr) {
    throw new Error('3MF model XML failed to parse — file may be malformed.');
  }

  // ── 4. Walk objects with a direct <mesh> child ──────────────────────
  const objects = Array.from(doc.getElementsByTagNameNS(NS, 'object'));
  const meshes  = [];
  let unnamed   = 0;
  let skippedAuxiliary = 0;

  for (const obj of objects) {
    // Skip non-printable types (model is the default; "other" / "support" are skipped).
    const type = obj.getAttribute('type');
    if (type && type !== 'model') continue;

    const meshEl = obj.getElementsByTagNameNS(NS, 'mesh')[0];
    if (!meshEl) continue;
    // Must be a direct child — skip composite objects whose <mesh> belongs to a component.
    if (meshEl.parentNode !== obj) continue;

    const verticesEl  = meshEl.getElementsByTagNameNS(NS, 'vertices')[0];
    const trianglesEl = meshEl.getElementsByTagNameNS(NS, 'triangles')[0];
    if (!verticesEl || !trianglesEl) continue;

    const vertexEls   = Array.from(verticesEl.getElementsByTagNameNS(NS, 'vertex'));
    const triangleEls = Array.from(trianglesEl.getElementsByTagNameNS(NS, 'triangle'));
    if (vertexEls.length === 0 || triangleEls.length === 0) continue;

    const verts = new Float32Array(vertexEls.length * 3);
    for (let i = 0; i < vertexEls.length; i++) {
      const v = vertexEls[i];
      verts[i * 3]     = parseFloat(v.getAttribute('x'));
      verts[i * 3 + 1] = parseFloat(v.getAttribute('y'));
      verts[i * 3 + 2] = parseFloat(v.getAttribute('z'));
    }

    const indices = new Uint32Array(triangleEls.length * 3);
    for (let i = 0; i < triangleEls.length; i++) {
      const t = triangleEls[i];
      indices[i * 3]     = parseInt(t.getAttribute('v1'), 10);
      indices[i * 3 + 1] = parseInt(t.getAttribute('v2'), 10);
      indices[i * 3 + 2] = parseInt(t.getAttribute('v3'), 10);
    }

    const stats = computeMeshStats(verts, indices);
    const name  = obj.getAttribute('name') || `Object ${++unnamed}`;

    // Auxiliary-object filter: Bambu 3MF often includes modifier bodies
    // (boolean cuts, paint regions, support markers) that are tiny and
    // not meant to be printed as separate parts. Skip anything with
    // volume < 0.05 cm³ AND every dimension < 5 mm.
    const isAuxiliary =
      stats.volumeCm3 < 0.05 &&
      stats.bbox.x < 5 && stats.bbox.y < 5 && stats.bbox.z < 5;
    if (isAuxiliary) {
      console.log('[3MF] skipping auxiliary object:', name,
        stats.volumeCm3.toFixed(4), 'cm³,',
        stats.bbox.x.toFixed(2), '×', stats.bbox.y.toFixed(2), '×',
        stats.bbox.z.toFixed(2), 'mm');
      skippedAuxiliary++;
      continue;
    }

    meshes.push({
      objectName: name,
      triangles:  indices.length / 3,
      volumeCm3:  stats.volumeCm3,
      surfaceCm2: stats.surfaceCm2,
      bbox:       stats.bbox,
      vertices:   verts,
      indices,
    });
  }

  if (skippedAuxiliary > 0 && meshes.length > 0) {
    console.log('[3MF]', skippedAuxiliary, 'auxiliary objects skipped,',
      meshes.length, 'printable meshes returned');
  }

  if (meshes.length === 0) {
    if (skippedAuxiliary > 0) {
      throw new Error('All objects in this 3MF are auxiliary bodies (modifiers, paint regions). Re-export the printable parts as STL or 3MF without modifiers.');
    }
    throw new Error('3MF has no usable mesh data — try re-exporting from Bambu Studio.');
  }
  return meshes;
}

// ─────────────────────────────────────────────────────────────────────
// Mesh stats — same signed-tetrahedron volume + cross-product area as
// stl.js, just iterating indexed triangles.
// ─────────────────────────────────────────────────────────────────────
function computeMeshStats(verts, indices) {
  let volMm3  = 0;
  let areaMm2 = 0;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  // Bbox: walk all vertices.
  for (let i = 0; i < verts.length; i += 3) {
    const x = verts[i], y = verts[i + 1], z = verts[i + 2];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }

  // Volume + area: walk indexed triangles.
  const triCount = indices.length / 3;
  for (let i = 0; i < triCount; i++) {
    const i0 = indices[i * 3]     * 3;
    const i1 = indices[i * 3 + 1] * 3;
    const i2 = indices[i * 3 + 2] * 3;
    const v0x = verts[i0],     v0y = verts[i0 + 1], v0z = verts[i0 + 2];
    const v1x = verts[i1],     v1y = verts[i1 + 1], v1z = verts[i1 + 2];
    const v2x = verts[i2],     v2y = verts[i2 + 1], v2z = verts[i2 + 2];

    // Signed-tetrahedron volume contribution: v0 · (v1 × v2) / 6
    const cx = v1y * v2z - v1z * v2y;
    const cy = v1z * v2x - v1x * v2z;
    const cz = v1x * v2y - v1y * v2x;
    volMm3 += (v0x * cx + v0y * cy + v0z * cz) / 6;

    // Surface area: |(v1 - v0) × (v2 - v0)| / 2
    const e1x = v1x - v0x, e1y = v1y - v0y, e1z = v1z - v0z;
    const e2x = v2x - v0x, e2y = v2y - v0y, e2z = v2z - v0z;
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;
    areaMm2 += Math.sqrt(nx * nx + ny * ny + nz * nz) / 2;
  }

  return {
    volumeCm3:  Math.abs(volMm3) / 1000,
    surfaceCm2: areaMm2 / 100,
    bbox: {
      x: maxX - minX,
      y: maxY - minY,
      z: maxZ - minZ,
    },
  };
}
