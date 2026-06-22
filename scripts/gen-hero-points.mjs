// Build-time hero asset generator for the /v2 homepage.
//
// Generates a real, printable part — an 18-tooth spur gear with a center bore —
// as a watertight binary STL (public/v2/part.stl), then samples its surface into
// a compact point cloud (public/v2/part-points.json) that the 2D-canvas hero
// renders at runtime. No three.js and no STL parser ship to the browser; the
// points are precomputed here so the hero stays cheap on mobile.
//
// Volume is validated with the SAME signed-tetrahedron sum used by the existing
// parser (apps/web/lib/stl-parse.ts) — parity check, not a second parser.
//
// Run: node scripts/gen-hero-points.mjs   (also wired as a pnpm script)
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'apps', 'web', 'public', 'v2');

// ---- gear parameters (unitless; normalised later) -------------------------
const TEETH = 18;
const SAMPLES_PER_TOOTH = 4; // root, tip, tip, root -> trapezoidal teeth
const ANG = TEETH * SAMPLES_PER_TOOTH; // angular samples around the gear
const R_TIP = 1.0;
const R_ROOT = 0.8;
const R_BORE = 0.3;
const HALF_T = 0.2; // half thickness (z from -0.2 .. +0.2)

// radius at angular sample i (pattern per tooth: root, tip, tip, root)
function radiusAt(i) {
  const phase = i % SAMPLES_PER_TOOTH;
  return phase === 1 || phase === 2 ? R_TIP : R_ROOT;
}

const tris = []; // each: [ax,ay,az, bx,by,bz, cx,cy,cz]
const pushTri = (a, b, c) => tris.push([...a, ...b, ...c]);
const ringPt = (i, r, z) => {
  const t = (i / ANG) * Math.PI * 2;
  return [Math.cos(t) * r, Math.sin(t) * r, z];
};

for (let i = 0; i < ANG; i++) {
  const j = (i + 1) % ANG;
  const ro0 = radiusAt(i), ro1 = radiusAt(j);

  const oT0 = ringPt(i, ro0, HALF_T), oT1 = ringPt(j, ro1, HALF_T);
  const oB0 = ringPt(i, ro0, -HALF_T), oB1 = ringPt(j, ro1, -HALF_T);
  const iT0 = ringPt(i, R_BORE, HALF_T), iT1 = ringPt(j, R_BORE, HALF_T);
  const iB0 = ringPt(i, R_BORE, -HALF_T), iB1 = ringPt(j, R_BORE, -HALF_T);

  // top annulus face (normal +z)
  pushTri(oT0, oT1, iT0);
  pushTri(iT0, oT1, iT1);
  // bottom annulus face (normal -z, reversed winding)
  pushTri(iB0, oB1, oB0);
  pushTri(iB0, iB1, oB1);
  // outer wall
  pushTri(oT0, oB0, oT1);
  pushTri(oT1, oB0, oB1);
  // inner bore wall (faces inward)
  pushTri(iT1, iB1, iT0);
  pushTri(iT0, iB1, iB0);
}

// ---- volume parity check (signed tetrahedron sum) -------------------------
function signedTetra(p) {
  const [a, b, c] = [[p[0], p[1], p[2]], [p[3], p[4], p[5]], [p[6], p[7], p[8]]];
  const cx = b[1] * c[2] - b[2] * c[1];
  const cy = b[2] * c[0] - b[0] * c[2];
  const cz = b[0] * c[1] - b[1] * c[0];
  return (a[0] * cx + a[1] * cy + a[2] * cz) / 6;
}
const volume = Math.abs(tris.reduce((s, t) => s + signedTetra(t), 0));

// ---- write binary STL -----------------------------------------------------
function buildStl(triangles) {
  const buf = Buffer.alloc(84 + triangles.length * 50);
  buf.writeUInt32LE(triangles.length, 80);
  let off = 84;
  for (const t of triangles) {
    off += 12; // leave normal as 0,0,0 (slicers recompute)
    for (let k = 0; k < 9; k++) { buf.writeFloatLE(t[k], off); off += 4; }
    off += 2; // attribute byte count
  }
  return buf;
}

// ---- surface point sampling (area-weighted) -------------------------------
function triArea(t) {
  const ux = t[3] - t[0], uy = t[4] - t[1], uz = t[5] - t[2];
  const vx = t[6] - t[0], vy = t[7] - t[1], vz = t[8] - t[2];
  const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
  return 0.5 * Math.hypot(cx, cy, cz);
}
// deterministic PRNG so the asset is stable across runs (no Math.random)
let seed = 0x2f6e2b1;
const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

const TARGET = 1600;
const totalArea = tris.reduce((s, t) => s + triArea(t), 0);
const pts = [];
for (const t of tris) {
  const n = Math.max(1, Math.round((triArea(t) / totalArea) * TARGET));
  for (let s = 0; s < n; s++) {
    let u = rand(), v = rand();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    pts.push([
      t[0] + u * (t[3] - t[0]) + v * (t[6] - t[0]),
      t[1] + u * (t[4] - t[1]) + v * (t[7] - t[1]),
      t[2] + u * (t[5] - t[2]) + v * (t[8] - t[2]),
    ]);
  }
}

// normalise: center on bbox midpoint, scale longest axis to 1
const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
for (const p of pts) for (let k = 0; k < 3; k++) { if (p[k] < min[k]) min[k] = p[k]; if (p[k] > max[k]) max[k] = p[k]; }
const ctr = min.map((m, k) => (m + max[k]) / 2);
const span = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1;
const flat = [];
for (const p of pts) for (let k = 0; k < 3; k++) flat.push(Math.round(((p[k] - ctr[k]) / span) * 1000) / 1000);

// ---- static SVG fallback (no-JS / reduced-motion / low-end) ---------------
// Project the normalised points with a fixed isometric-ish rotation and draw
// them as orange dots on near-black. Downsampled for file size.
function projectSvg() {
  const W = 640, cx = W / 2, cy = W / 2, scale = W * 0.42;
  const ax = -0.5, ay = 0.7; // fixed view angles
  const cax = Math.cos(ax), sax = Math.sin(ax), cay = Math.cos(ay), say = Math.sin(ay);
  const proj = [];
  for (let n = 0; n < flat.length; n += 3) {
    let x = flat[n], y = flat[n + 1], z = flat[n + 2];
    // rotate Y then X
    let x1 = x * cay + z * say, z1 = -x * say + z * cay;
    let y2 = y * cax - z1 * sax, z2 = y * sax + z1 * cax;
    proj.push([cx + x1 * scale, cy - y2 * scale, z2]);
  }
  proj.sort((a, b) => a[2] - b[2]); // far first
  const step = Math.max(1, Math.round(proj.length / 620));
  let dots = '';
  for (let i = 0; i < proj.length; i += step) {
    const [px, py, pz] = proj[i];
    const t = (pz + 0.7) / 1.4;              // depth 0..1
    const r = (0.9 + t * 1.5).toFixed(2);
    const o = (0.35 + t * 0.6).toFixed(2);
    dots += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${r}" fill="#E55934" opacity="${o}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="${W}" height="${W}" role="img" aria-label="Point-cloud render of a 3D-printed gear"><rect width="${W}" height="${W}" fill="#0A0A0A"/>${dots}</svg>`;
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'part.stl'), buildStl(tris));
writeFileSync(join(OUT_DIR, 'part-points.json'), JSON.stringify({
  source: 'spur-gear (18T, bored) generated by scripts/gen-hero-points.mjs',
  count: pts.length,
  points: flat,
}));
writeFileSync(join(OUT_DIR, 'hero-fallback.svg'), projectSvg());

console.log(`gear: ${tris.length} triangles, volume=${volume.toFixed(4)} (unitless)`);
console.log(`points: ${pts.length} -> part-points.json (${(JSON.stringify(flat).length / 1024).toFixed(1)} KB raw)`);
console.log(`wrote ${join(OUT_DIR, 'part.stl')} (${(84 + tris.length * 50)} bytes)`);
