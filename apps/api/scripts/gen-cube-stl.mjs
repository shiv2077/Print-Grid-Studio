// Emit a binary STL of a cube to the path in argv[2] (default /tmp/cube.stl).
import { writeFileSync } from 'node:fs';
const s = Number(process.argv[3] ?? 10);
const out = process.argv[2] ?? '/tmp/cube.stl';
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
    buf.writeFloatLE(v[idx][0], off);
    buf.writeFloatLE(v[idx][1], off + 4);
    buf.writeFloatLE(v[idx][2], off + 8);
    off += 12;
  }
  off += 2;
}
writeFileSync(out, buf);
console.log(`wrote ${out} (${s}mm cube, ${tris.length} tris, ${buf.length} bytes)`);
