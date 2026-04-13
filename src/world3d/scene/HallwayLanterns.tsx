import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';

// Shared dark outline (matches the rest of the scene's dark-theme edge color).
const EDGE_COLOR = '#0a0a14';

const LANTERN_POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [-1.5, -1.5],
  [1.5, -1.5],
  [-1.5, 1.5],
  [1.5, 1.5],
];

// Per-lantern bob phase offsets so they don't sway in unison.
const BOB_PHASES: ReadonlyArray<number> = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
const BOB_FREQ = 1.1;
const BOB_AMP = 0.035;
const LANTERN_BASE_Y = 1.65;

// Frame post offsets (corner posts around the glow cube).
const FRAME_POSTS: ReadonlyArray<readonly [number, number]> = [
  [-0.1, -0.1],
  [0.1, -0.1],
  [-0.1, 0.1],
  [0.1, 0.1],
];

export function HallwayLanterns() {
  // One ref per lantern group so useFrame can mutate Y position without alloc.
  const groupRefs = useRef<Array<THREE.Group | null>>([null, null, null, null]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (let i = 0; i < LANTERN_POSITIONS.length; i++) {
      const g = groupRefs.current[i];
      if (!g) continue;
      g.position.y = Math.sin(t * BOB_FREQ + BOB_PHASES[i]) * BOB_AMP;
    }
  });

  return (
    <group>
      {LANTERN_POSITIONS.map(([x, z], idx) => (
        <group
          key={`${x},${z}`}
          ref={(el) => {
            groupRefs.current[idx] = el;
          }}
          position={[0, 0, 0]}
        >
          <group position={[x, 0, z]}>
            {/* Ceiling anchor plate */}
            <mesh position={[0, 2.82, 0]}>
              <boxGeometry args={[0.14, 0.04, 0.14]} />
              <meshPhongMaterial color="#1a1a1a" flatShading />
            </mesh>
            {/* Chain (short cylinders stacked as links) */}
            <mesh position={[0, 2.55, 0]} castShadow>
              <cylinderGeometry args={[0.018, 0.018, 0.5, 4]} />
              <meshPhongMaterial color="#2a2a2a" flatShading />
            </mesh>
            <mesh position={[0, 2.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.022, 0.022, 0.04, 4]} />
              <meshPhongMaterial color="#3a3a3a" flatShading />
            </mesh>

            {/* Top cap (wider plate on top of lantern) */}
            <mesh position={[0, LANTERN_BASE_Y + 0.2, 0]} castShadow>
              <boxGeometry args={[0.28, 0.05, 0.28]} />
              <meshPhongMaterial color="#3a2512" flatShading />
              <Edges color={EDGE_COLOR} lineWidth={1.5} />
            </mesh>
            {/* Top cap point (small pyramid/pagoda accent) */}
            <mesh position={[0, LANTERN_BASE_Y + 0.26, 0]}>
              <boxGeometry args={[0.08, 0.04, 0.08]} />
              <meshPhongMaterial color="#5a3820" flatShading />
            </mesh>

            {/* 4 corner posts framing the glow cube */}
            {FRAME_POSTS.map(([px, pz], pi) => (
              <mesh
                key={`post-${pi}`}
                position={[px, LANTERN_BASE_Y, pz]}
                castShadow
              >
                <boxGeometry args={[0.02, 0.32, 0.02]} />
                <meshPhongMaterial color="#2a1808" flatShading />
              </mesh>
            ))}

            {/* Lantern body (wood/metal frame surround) */}
            <mesh position={[0, LANTERN_BASE_Y, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.22, 0.3, 0.22]} />
              <meshPhongMaterial color="#a0522d" flatShading />
              <Edges color={EDGE_COLOR} lineWidth={1.5} />
            </mesh>

            {/* Bottom plate */}
            <mesh position={[0, LANTERN_BASE_Y - 0.17, 0]} castShadow>
              <boxGeometry args={[0.26, 0.04, 0.26]} />
              <meshPhongMaterial color="#3a2512" flatShading />
            </mesh>

            {/* Warm glow core — nudged toward amber/orange */}
            <mesh position={[0, LANTERN_BASE_Y, 0]}>
              <boxGeometry args={[0.16, 0.2, 0.16]} />
              <meshPhongMaterial
                color="#ffb870"
                emissive="#ff9840"
                emissiveIntensity={4.2}
                transparent
                opacity={0.95}
                flatShading
              />
            </mesh>

            {/* Warm point light — F3.21: tightened from intensity 1.1 ×
                distance 6.5 (heavy 4-way overlap) to intensity 0.8 ×
                distance 4.5 so neighboring lanterns don't double-bake. */}
            <pointLight
              position={[0, LANTERN_BASE_Y - 0.1, 0]}
              color="#ffa860"
              intensity={0.8}
              distance={4.5}
            />
          </group>
        </group>
      ))}
    </group>
  );
}
