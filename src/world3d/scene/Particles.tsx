import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PARTICLE_COUNT, PARTICLES, COLORS } from '../constants';
import { makeRng } from '../util/rand';

interface ParticleData {
  position: [number, number, number];
  size: number;
  color: string;
  opacity: number;
  vx: number;
  vy: number;
  vz: number;
  phase: number;
}

const PARTICLE_COLORS = [
  COLORS.gold,
  COLORS.green,
  COLORS.purple,
  '#3b82f6',
  COLORS.red,
];

function buildParticles(): ParticleData[] {
  const rng = makeRng(0xb0b);
  const out: ParticleData[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const size = 0.02 + rng() * 0.04;
    out.push({
      position: [
        (rng() - 0.5) * PARTICLES.spread,
        rng() * PARTICLES.ceiling,
        (rng() - 0.5) * PARTICLES.spread,
      ],
      size,
      color: PARTICLE_COLORS[Math.floor(rng() * PARTICLE_COLORS.length)],
      opacity: 0.5 + rng() * 0.4,
      vx: (rng() - 0.5) * 0.005,
      vy: 0.003 + rng() * 0.008,
      vz: (rng() - 0.5) * 0.005,
      phase: rng() * Math.PI * 2,
    });
  }
  return out;
}

const PARTICLES_DATA: ReadonlyArray<ParticleData> = buildParticles();

export function Particles() {
  const groupRef = useRef<THREE.Group>(null);
  const particles = PARTICLES_DATA;

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const dt = delta * 60; // normalize against ~60fps tick used in legacy
    for (let i = 0; i < g.children.length; i++) {
      const mesh = g.children[i] as THREE.Mesh;
      const data = particles[i];
      mesh.position.x += data.vx * dt + Math.sin(data.phase + mesh.position.y * 0.5) * 0.0008 * dt;
      mesh.position.y += data.vy * dt;
      mesh.position.z += data.vz * dt;
      if (mesh.position.y > PARTICLES.ceiling) {
        mesh.position.y = PARTICLES.floorReset;
        mesh.position.x = (Math.random() - 0.5) * PARTICLES.spread;
        mesh.position.z = (Math.random() - 0.5) * PARTICLES.spread;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={p.position}>
          <boxGeometry args={[p.size, p.size, p.size]} />
          <meshPhongMaterial
            color={p.color}
            emissive={p.color}
            emissiveIntensity={1.2}
            transparent
            opacity={p.opacity}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}
