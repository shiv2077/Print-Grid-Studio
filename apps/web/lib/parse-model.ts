'use client';

import * as THREE from 'three';
import type { StlParseResult } from './stl-types';

const HIGH_POLY = 250_000;

/** Accumulate volume (signed tetrahedra, world space) + bbox + triangle count
 *  over every mesh in an object tree. */
function statsFromObject(root: THREE.Object3D): StlParseResult {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const cross = new THREE.Vector3();
  let vol = 0;
  let tris = 0;

  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    const geom = mesh.geometry as THREE.BufferGeometry;
    const pos = geom.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (!pos) return;
    box.expandByObject(mesh);
    const m = mesh.matrixWorld;
    const idx = geom.getIndex();
    const addTri = (i0: number, i1: number, i2: number) => {
      a.fromBufferAttribute(pos, i0).applyMatrix4(m);
      b.fromBufferAttribute(pos, i1).applyMatrix4(m);
      c.fromBufferAttribute(pos, i2).applyMatrix4(m);
      cross.copy(b).cross(c);
      vol += a.dot(cross) / 6;
      tris++;
    };
    if (idx) {
      for (let i = 0; i < idx.count; i += 3) addTri(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2));
    } else {
      for (let i = 0; i < pos.count; i += 3) addTri(i, i + 1, i + 2);
    }
  });

  const size = new THREE.Vector3();
  box.getSize(size);
  return {
    triangleCount: tris,
    volumeMm3: Math.abs(vol),
    bboxMin: [box.min.x, box.min.y, box.min.z],
    bboxMax: [box.max.x, box.max.y, box.max.z],
    bboxSize: [size.x, size.y, size.z],
    isAscii: false,
    parseTimeMs: 0,
    highPolyWarning: tris > HIGH_POLY,
  };
}

/** Load a model file into a centered, normalized THREE.Object3D for previewing. */
export async function loadModelObject(file: File): Promise<THREE.Object3D> {
  const ext = file.name.toLowerCase().split('.').pop();
  const buf = await file.arrayBuffer();
  let root: THREE.Object3D;
  if (ext === 'obj') {
    const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
    root = new OBJLoader().parse(new TextDecoder().decode(buf));
  } else if (ext === '3mf') {
    const { ThreeMFLoader } = await import('three/examples/jsm/loaders/3MFLoader.js');
    root = new ThreeMFLoader().parse(buf.slice(0));
  } else {
    const { STLLoader } = await import('three/examples/jsm/loaders/STLLoader.js');
    const geom = new STLLoader().parse(buf);
    geom.computeVertexNormals();
    root = new THREE.Mesh(geom);
  }
  return root;
}

/** Parse a model file (STL/OBJ/3MF) into pricing/warning stats. */
export async function parseModel(file: File): Promise<StlParseResult> {
  const root = await loadModelObject(file);
  const stats = statsFromObject(root);
  if (!Number.isFinite(stats.volumeMm3) || stats.volumeMm3 <= 0) {
    throw new Error('Could not measure a positive volume — is the mesh closed?');
  }
  return stats;
}
