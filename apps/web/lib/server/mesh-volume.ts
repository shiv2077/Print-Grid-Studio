// Server-authoritative mesh volume for STL / OBJ / 3MF. Volume =
// |Σ (1/6) v0·(v1×v2)| over all triangles. Units = mm³ (model convention).
import { stlVolumeMm3 } from './stl-volume';

export interface MeshVolumeResult {
  volumeMm3: number;
  triangleCount: number;
  format: 'stl' | 'obj' | '3mf';
}

function signedTetra(a: readonly number[], b: readonly number[], c: readonly number[]): number {
  const ax = a[0] ?? 0, ay = a[1] ?? 0, az = a[2] ?? 0;
  const bx = b[0] ?? 0, by = b[1] ?? 0, bz = b[2] ?? 0;
  const cx = c[0] ?? 0, cy = c[1] ?? 0, cz = c[2] ?? 0;
  const crx = by * cz - bz * cy;
  const cry = bz * cx - bx * cz;
  const crz = bx * cy - by * cx;
  return (ax * crx + ay * cry + az * crz) / 6;
}

function objVolume(buf: Buffer): MeshVolumeResult {
  const verts: number[][] = [];
  let vol = 0;
  let tris = 0;
  for (const line of buf.toString('utf8').split('\n')) {
    if (line.startsWith('v ')) {
      const p = line.split(/\s+/);
      verts.push([Number(p[1]), Number(p[2]), Number(p[3])]);
    } else if (line.startsWith('f ')) {
      const idx = line
        .trim()
        .split(/\s+/)
        .slice(1)
        .map((t) => {
          const i = parseInt(t.split('/')[0] ?? '', 10);
          return i < 0 ? verts.length + i : i - 1; // OBJ is 1-indexed; negatives relative
        });
      for (let k = 1; k + 1 < idx.length; k++) {
        const a = verts[idx[0] ?? -1];
        const b = verts[idx[k] ?? -1];
        const c = verts[idx[k + 1] ?? -1];
        if (a && b && c) {
          vol += signedTetra(a, b, c);
          tris++;
        }
      }
    }
  }
  return { volumeMm3: Math.abs(vol), triangleCount: tris, format: 'obj' };
}

async function threemfVolume(buf: Buffer): Promise<MeshVolumeResult> {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(buf);
  let entry = zip.file('3D/3dmodel.model');
  if (!entry) {
    const found = Object.keys(zip.files).find((n) => n.toLowerCase().endsWith('.model'));
    if (found) entry = zip.file(found);
  }
  if (!entry) throw new Error('No 3D model found inside the 3MF');
  const xml = await entry.async('string');

  let vol = 0;
  let tris = 0;
  const meshRe = /<mesh>([\s\S]*?)<\/mesh>/g;
  let mesh: RegExpExecArray | null;
  while ((mesh = meshRe.exec(xml)) !== null) {
    const block = mesh[1] ?? '';
    const verts: number[][] = [];
    const vRe = /<vertex[^>]*\bx="([^"]+)"[^>]*\by="([^"]+)"[^>]*\bz="([^"]+)"/g;
    let v: RegExpExecArray | null;
    while ((v = vRe.exec(block)) !== null) verts.push([Number(v[1]), Number(v[2]), Number(v[3])]);
    const tRe = /<triangle[^>]*\bv1="(\d+)"[^>]*\bv2="(\d+)"[^>]*\bv3="(\d+)"/g;
    let t: RegExpExecArray | null;
    while ((t = tRe.exec(block)) !== null) {
      const a = verts[Number(t[1])];
      const b = verts[Number(t[2])];
      const c = verts[Number(t[3])];
      if (a && b && c) {
        vol += signedTetra(a, b, c);
        tris++;
      }
    }
  }
  return { volumeMm3: Math.abs(vol), triangleCount: tris, format: '3mf' };
}

export async function meshVolumeMm3(buffer: Buffer, filename: string): Promise<MeshVolumeResult> {
  if (!buffer || buffer.length === 0) throw new Error('Empty file');
  const ext = filename.toLowerCase().split('.').pop();
  let result: MeshVolumeResult;
  if (ext === 'obj') {
    result = objVolume(buffer);
  } else if (ext === '3mf') {
    result = await threemfVolume(buffer);
  } else {
    const stl = stlVolumeMm3(buffer);
    result = { volumeMm3: stl.volumeMm3, triangleCount: stl.triangleCount, format: 'stl' };
  }
  if (!Number.isFinite(result.volumeMm3) || result.volumeMm3 <= 0) {
    throw new Error('Could not measure a positive volume — is the mesh closed?');
  }
  return result;
}
