'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as THREE from 'three';
import type { MaterialKey } from '@printgrid/pricing';

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

export function StlViewer({ file, materialKey, triangleCount }: StlViewerProps) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new STLLoader();
    file
      .arrayBuffer()
      .then((buf) => {
        if (cancelled) return;
        try {
          const geom = loader.parse(buf);
          geom.computeVertexNormals();
          geom.computeBoundingBox();
          const bbox = geom.boundingBox;
          if (bbox) {
            const center = new THREE.Vector3();
            bbox.getCenter(center);
            geom.translate(-center.x, -center.y, -center.z);
          }
          setGeometry(geom);
          setError(null);
        } catch {
          setError('Could not render preview');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not read file');
      });
    return () => {
      cancelled = true;
      setGeometry((g) => {
        g?.dispose();
        return null;
      });
    };
  }, [file]);

  const colorSpec = MATERIAL_COLORS[materialKey];
  const isHighPoly = triangleCount > HIGH_POLY;

  return (
    <div className="quote-viewer">
      <span className="quote-viewer__label">STL · preview</span>
      {error ? (
        <div className="quote-viewer__empty">{error}</div>
      ) : !geometry ? (
        <div className="quote-viewer__empty">Loading preview…</div>
      ) : (
        <>
          <Canvas camera={{ position: [80, 70, 100], fov: 35 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[80, 120, 60]} intensity={0.9} />
            <directionalLight position={[-80, 40, -60]} intensity={0.35} />
            <Suspense fallback={null}>
              <CenteredModel geometry={geometry} colorSpec={colorSpec} isHighPoly={isHighPoly} />
              {!isHighPoly && (
                <ContactShadows position={[0, -50, 0]} opacity={0.3} scale={200} blur={2} far={120} />
              )}
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

function CenteredModel({
  geometry,
  colorSpec,
  isHighPoly,
}: {
  geometry: THREE.BufferGeometry;
  colorSpec: { color: string; opacity: number };
  isHighPoly: boolean;
}) {
  const scaledGeometry = useMemo(() => {
    const cloned = geometry.clone();
    cloned.computeBoundingBox();
    const bbox = cloned.boundingBox;
    if (!bbox) return cloned;
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const longest = Math.max(size.x, size.y, size.z) || 1;
    cloned.scale(80 / longest, 80 / longest, 80 / longest);
    return cloned;
  }, [geometry]);

  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh ref={meshRef} geometry={scaledGeometry}>
      {isHighPoly ? (
        <meshBasicMaterial color={colorSpec.color} />
      ) : (
        <meshStandardMaterial
          color={colorSpec.color}
          metalness={0.05}
          roughness={0.65}
          transparent={colorSpec.opacity < 1}
          opacity={colorSpec.opacity}
        />
      )}
    </mesh>
  );
}
