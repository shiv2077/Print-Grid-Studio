'use client';

import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { MaterialKey } from '@printgrid/pricing';
import { loadModelObject } from '@/lib/parse-model';

const MATERIAL_COLORS: Readonly<Record<MaterialKey, { color: string; opacity: number }>> = {
  'pla-plus': { color: '#EAEAEA', opacity: 1 },
  'pla-lw': { color: '#D8C9A8', opacity: 1 },
  petg: { color: '#DCDCDF', opacity: 0.55 },
  abs: { color: '#3A3A3A', opacity: 1 },
  'tpu-95a': { color: '#4A4A4A', opacity: 1 },
  pa6: { color: '#B89A7E', opacity: 1 },
  'pa-cf': { color: '#4A4A4C', opacity: 1 },
};

const HIGH_POLY = 250_000;

export interface StlViewerProps {
  file: File;
  materialKey: MaterialKey;
  triangleCount: number;
}

/** Center at origin, scale longest axis to 80, and apply the material colour. */
function normalize(root: THREE.Object3D, color: string, opacity: number, isHighPoly: boolean) {
  const box = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  const longest = Math.max(size.x, size.y, size.z) || 1;
  const factor = 80 / longest;
  root.scale.setScalar(factor);
  root.position.copy(center).multiplyScalar(-factor);
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.material = isHighPoly
      ? new THREE.MeshBasicMaterial({ color })
      : new THREE.MeshStandardMaterial({ color, metalness: 0.05, roughness: 0.65, transparent: opacity < 1, opacity });
  });
}

export function StlViewer({ file, materialKey, triangleCount }: StlViewerProps) {
  const [object, setObject] = useState<THREE.Object3D | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    loadModelObject(file)
      .then((root) => {
        if (cancelled) return;
        const spec = MATERIAL_COLORS[materialKey];
        normalize(root, spec.color, spec.opacity, triangleCount > HIGH_POLY);
        setObject(root);
      })
      .catch(() => {
        if (!cancelled) setError('Could not render preview');
      });
    return () => {
      cancelled = true;
      setObject(null);
    };
  }, [file, materialKey, triangleCount]);

  const isHighPoly = triangleCount > HIGH_POLY;

  return (
    <div className="quote-viewer">
      <span className="quote-viewer__label">3D · preview</span>
      {error ? (
        <div className="quote-viewer__empty">{error}</div>
      ) : !object ? (
        <div className="quote-viewer__empty">Loading preview…</div>
      ) : (
        <>
          <Canvas camera={{ position: [80, 70, 100], fov: 35 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[80, 120, 60]} intensity={0.9} />
            <directionalLight position={[-80, 40, -60]} intensity={0.35} />
            <Suspense fallback={null}>
              <primitive object={object} />
              {!isHighPoly && <ContactShadows position={[0, -50, 0]} opacity={0.3} scale={200} blur={2} far={120} />}
            </Suspense>
            <OrbitControls
              enablePan={false}
              enableZoom
              enableRotate
              dampingFactor={0.1}
              minDistance={40}
              maxDistance={400}
              autoRotate
              autoRotateSpeed={0.6}
            />
          </Canvas>
          <span className="quote-viewer__tip">Drag to rotate · scroll to zoom</span>
        </>
      )}
    </div>
  );
}
