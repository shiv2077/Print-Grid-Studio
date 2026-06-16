// PrintGrid Studio — STL parser
// Pure-function: parses both binary and ASCII STL into mesh stats.
// No dependencies. ES module.

export function parseSTL(buffer) {
  if (!(buffer instanceof ArrayBuffer)) {
    throw new Error('parseSTL expects an ArrayBuffer');
  }

  // Binary STL: byteLength must equal 84 + triCount * 50.
  // The triangle count is a uint32 LE at byte offset 80.
  let result = null;
  if (buffer.byteLength >= 84) {
    const view = new DataView(buffer);
    const triCount = view.getUint32(80, true);
    if (84 + triCount * 50 === buffer.byteLength) {
      result = readBinary(view, triCount);
    }
  }

  if (!result) {
    // Size invariant failed. Decide between ASCII or corrupt:
    // ASCII STLs always start with the literal "solid " (with trailing space).
    // Anything else with a failing size invariant is a truncated / damaged
    // binary STL — caller surfaces a friendly "STL appears corrupt" message.
    const head = new Uint8Array(buffer, 0, Math.min(6, buffer.byteLength));
    const startsWithSolid =
      head.length >= 5 &&
      head[0] === 0x73 && head[1] === 0x6F && head[2] === 0x6C &&
      head[3] === 0x69 && head[4] === 0x64; // "solid"
    if (!startsWithSolid) {
      throw new Error('STL appears corrupt — triangle count does not match file size');
    }
    result = readAscii(new TextDecoder().decode(buffer));
  }

  // Catch the ASCII silent-zero case (header present but no vertex blocks)
  // and the rare binary file whose size invariant matches but with zero
  // actual geometry. Either way the file isn't usable.
  if (result.triangles === 0) {
    throw new Error('STL appears empty (0 triangles after parse). The file may be corrupt or malformed.');
  }
  return result;
}

function readBinary(view, triCount) {
  const acc = newAcc();
  let off = 84;
  for (let i = 0; i < triCount; i++) {
    off += 12; // skip face normal (3 × float32)
    const v0x = view.getFloat32(off,    true);
    const v0y = view.getFloat32(off+4,  true);
    const v0z = view.getFloat32(off+8,  true);
    off += 12;
    const v1x = view.getFloat32(off,    true);
    const v1y = view.getFloat32(off+4,  true);
    const v1z = view.getFloat32(off+8,  true);
    off += 12;
    const v2x = view.getFloat32(off,    true);
    const v2y = view.getFloat32(off+4,  true);
    const v2z = view.getFloat32(off+8,  true);
    off += 12;
    off += 2; // skip uint16 attribute byte count (almost always 0)
    addTriangle(acc, v0x, v0y, v0z, v1x, v1y, v1z, v2x, v2y, v2z);
  }
  acc.triangles = triCount;
  return finalize(acc, true);
}

function readAscii(text) {
  const acc = newAcc();
  // Match every "vertex X Y Z" line. Group every 3 vertices into a triangle.
  const re = /vertex\s+(-?[\d.eE+-]+)\s+(-?[\d.eE+-]+)\s+(-?[\d.eE+-]+)/g;
  const verts = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    verts.push(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]));
  }
  const triCount = Math.floor(verts.length / 9);
  for (let i = 0; i < triCount; i++) {
    const o = i * 9;
    addTriangle(acc,
      verts[o],   verts[o+1], verts[o+2],
      verts[o+3], verts[o+4], verts[o+5],
      verts[o+6], verts[o+7], verts[o+8],
    );
  }
  acc.triangles = triCount;
  return finalize(acc, false);
}

function newAcc() {
  return {
    volMm3: 0,
    areaMm2: 0,
    minX:  Infinity, minY:  Infinity, minZ:  Infinity,
    maxX: -Infinity, maxY: -Infinity, maxZ: -Infinity,
    triangles: 0,
    degenerate: 0,
  };
}

// Triangles whose cross-product magnitude squared falls below this threshold
// are essentially zero-area: roughly side lengths under ~1 µm, which slicers
// reject. Counted, not removed — surfaced as a per-file warning upstream.
const DEGENERATE_SQR_MAG_THRESHOLD = 4e-12;

function addTriangle(a, v0x, v0y, v0z, v1x, v1y, v1z, v2x, v2y, v2z) {
  // Signed-tetrahedron volume contribution: v0 · (v1 × v2) / 6.
  // Summed over a closed mesh this yields the enclosed volume (sign depends on winding).
  const cx = v1y * v2z - v1z * v2y;
  const cy = v1z * v2x - v1x * v2z;
  const cz = v1x * v2y - v1y * v2x;
  a.volMm3 += (v0x * cx + v0y * cy + v0z * cz) / 6;

  // Surface area contribution: |(v1 - v0) × (v2 - v0)| / 2.
  const e1x = v1x - v0x, e1y = v1y - v0y, e1z = v1z - v0z;
  const e2x = v2x - v0x, e2y = v2y - v0y, e2z = v2z - v0z;
  const nx = e1y * e2z - e1z * e2y;
  const ny = e1z * e2x - e1x * e2z;
  const nz = e1x * e2y - e1y * e2x;
  const sqrMag = nx * nx + ny * ny + nz * nz;
  a.areaMm2 += Math.sqrt(sqrMag) / 2;
  if (sqrMag < DEGENERATE_SQR_MAG_THRESHOLD) a.degenerate++;

  // Bounding box: extents across all 3 vertices of the triangle.
  if (v0x < a.minX) a.minX = v0x; if (v0x > a.maxX) a.maxX = v0x;
  if (v0y < a.minY) a.minY = v0y; if (v0y > a.maxY) a.maxY = v0y;
  if (v0z < a.minZ) a.minZ = v0z; if (v0z > a.maxZ) a.maxZ = v0z;
  if (v1x < a.minX) a.minX = v1x; if (v1x > a.maxX) a.maxX = v1x;
  if (v1y < a.minY) a.minY = v1y; if (v1y > a.maxY) a.maxY = v1y;
  if (v1z < a.minZ) a.minZ = v1z; if (v1z > a.maxZ) a.maxZ = v1z;
  if (v2x < a.minX) a.minX = v2x; if (v2x > a.maxX) a.maxX = v2x;
  if (v2y < a.minY) a.minY = v2y; if (v2y > a.maxY) a.maxY = v2y;
  if (v2z < a.minZ) a.minZ = v2z; if (v2z > a.maxZ) a.maxZ = v2z;
}

function finalize(a, isBinary) {
  return {
    triangles: a.triangles,
    degenerateTriangles: a.degenerate,
    volumeCm3: Math.abs(a.volMm3) / 1000,    // mm³ → cm³
    surfaceCm2: a.areaMm2 / 100,             // mm² → cm²
    bbox: {
      x: a.triangles ? a.maxX - a.minX : 0,
      y: a.triangles ? a.maxY - a.minY : 0,
      z: a.triangles ? a.maxZ - a.minZ : 0,
    },
    isBinary,
  };
}
