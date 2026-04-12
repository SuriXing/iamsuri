import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STAR_COUNT, STARS } from '../constants';
import { makeRng } from '../util/rand';
import { useWorldStore } from '../store/worldStore';

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
  const theme = useWorldStore((s) => s.theme);

  // Single shared geometry — owned per-component to play nice with r3f reconciliation.
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(STAR_BUFFERS.positions, 3));
    return g;
  }, []);

  // Global twinkle: cheap single opacity write per frame instead of per-star.
  // In light mode, force opacity to 0 so stars are invisible against the
  // pale background (twinkle still computed so we don't branch on theme
  // inside the frame loop — useFrame checks `theme` via closure, which
  // only updates when this component re-renders from the store subscription).
  useFrame(({ clock }) => {
    const m = matRef.current;
    if (!m) return;
    if (theme === 'light') {
      m.opacity = 0;
      return;
    }
    const t = clock.getElapsedTime();
    m.opacity = 0.65 + 0.25 * Math.sin(t * 1.5);
  });

  // Skip rendering entirely in light mode — avoids the draw call too.
  if (theme === 'light') return null;

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
