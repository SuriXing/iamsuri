import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STAR_COUNT, STARS } from '../constants';
import { makeRng } from '../util/rand';

interface StarData {
  position: [number, number, number];
  size: number;
  baseOpacity: number;
  phase: number;
}

function buildStars(): StarData[] {
  const rng = makeRng(0xa11ce);
  const out: StarData[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    out.push({
      position: [
        (rng() - 0.5) * STARS.spreadXZ,
        STARS.yMin + rng() * STARS.ySpread,
        (rng() - 0.5) * STARS.spreadXZ,
      ],
      size: 0.03 + rng() * 0.08,
      baseOpacity: 0.3 + rng() * 0.7,
      phase: rng() * Math.PI * 2,
    });
  }
  return out;
}

const STARS_DATA: ReadonlyArray<StarData> = buildStars();

export function StarField() {
  const groupRef = useRef<THREE.Group>(null);
  const stars = STARS_DATA;

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < g.children.length; i++) {
      const mesh = g.children[i] as THREE.Mesh;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const data = stars[i];
      mat.opacity = data.baseOpacity * (0.6 + 0.4 * Math.sin(t * 1.5 + data.phase));
    }
  });

  return (
    <group ref={groupRef}>
      {stars.map((s, i) => (
        <mesh key={i} position={s.position}>
          <sphereGeometry args={[s.size, 4, 4]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={s.baseOpacity} />
        </mesh>
      ))}
    </group>
  );
}
