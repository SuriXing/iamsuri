import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STAR_COUNT, STARS } from '../constants';
import { makeRng } from '../util/rand';

interface StarBuffers {
  positions: Float32Array;
  baseOpacity: Float32Array;
  phase: Float32Array;
  size: number; // average size used by pointsMaterial
}

function buildStarBuffers(): StarBuffers {
  const rng = makeRng(0xa11ce);
  const positions = new Float32Array(STAR_COUNT * 3);
  const baseOpacity = new Float32Array(STAR_COUNT);
  const phase = new Float32Array(STAR_COUNT);
  let avgSize = 0;
  for (let i = 0; i < STAR_COUNT; i++) {
    positions[i * 3 + 0] = (rng() - 0.5) * STARS.spreadXZ;
    positions[i * 3 + 1] = STARS.yMin + rng() * STARS.ySpread;
    positions[i * 3 + 2] = (rng() - 0.5) * STARS.spreadXZ;
    baseOpacity[i] = 0.3 + rng() * 0.7;
    phase[i] = rng() * Math.PI * 2;
    avgSize += 0.03 + rng() * 0.08;
  }
  return { positions, baseOpacity, phase, size: (avgSize / STAR_COUNT) * 6 };
}

const STAR_BUFFERS: StarBuffers = buildStarBuffers();

export function StarField() {
  const matRef = useRef<THREE.PointsMaterial>(null);

  // Single shared geometry — owned per-component to play nice with r3f reconciliation.
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(STAR_BUFFERS.positions, 3));
    return g;
  }, []);

  // Global twinkle: cheap single opacity write per frame instead of per-star.
  useFrame(({ clock }) => {
    const m = matRef.current;
    if (!m) return;
    const t = clock.getElapsedTime();
    m.opacity = 0.65 + 0.25 * Math.sin(t * 1.5);
  });

  return (
    <points geometry={geometry}>
      <pointsMaterial
        ref={matRef}
        color="#ffffff"
        size={STAR_BUFFERS.size}
        sizeAttenuation
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </points>
  );
}
