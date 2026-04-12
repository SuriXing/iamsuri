import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PARTICLE_COUNT, PARTICLES, COLORS } from '../constants';
import { makeRng } from '../util/rand';

interface ParticleBuffers {
  // Per-instance state — mutated each frame
  px: Float32Array;
  py: Float32Array;
  pz: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  vz: Float32Array;
  size: Float32Array;
  phase: Float32Array;
  // Color name list (resolved at mount via setColorAt)
  colorHex: string[];
}

const PARTICLE_COLORS = [
  COLORS.gold,
  COLORS.green,
  COLORS.purple,
  '#3b82f6',
  COLORS.red,
];

function buildBuffers(): ParticleBuffers {
  const rng = makeRng(0xb0b);
  const px = new Float32Array(PARTICLE_COUNT);
  const py = new Float32Array(PARTICLE_COUNT);
  const pz = new Float32Array(PARTICLE_COUNT);
  const vx = new Float32Array(PARTICLE_COUNT);
  const vy = new Float32Array(PARTICLE_COUNT);
  const vz = new Float32Array(PARTICLE_COUNT);
  const size = new Float32Array(PARTICLE_COUNT);
  const phase = new Float32Array(PARTICLE_COUNT);
  const colorHex: string[] = new Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    px[i] = (rng() - 0.5) * PARTICLES.spread;
    py[i] = rng() * PARTICLES.ceiling;
    pz[i] = (rng() - 0.5) * PARTICLES.spread;
    size[i] = 0.02 + rng() * 0.04;
    vx[i] = (rng() - 0.5) * 0.005;
    vy[i] = 0.003 + rng() * 0.008;
    vz[i] = (rng() - 0.5) * 0.005;
    phase[i] = rng() * Math.PI * 2;
    colorHex[i] = PARTICLE_COLORS[Math.floor(rng() * PARTICLE_COLORS.length)];
  }
  return { px, py, pz, vx, vy, vz, size, phase, colorHex };
}

const BUF: ParticleBuffers = buildBuffers();
// Deterministic reset RNG so respawned particles stay reproducible across reloads.
const RESET_RNG = makeRng(0xfeed);

// One shared dummy + color for all per-frame writes — zero allocations in hot path.
const DUMMY = new THREE.Object3D();
const TMP_COLOR = new THREE.Color();

export function Particles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Initial bake of per-instance colors + matrices.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      DUMMY.position.set(BUF.px[i], BUF.py[i], BUF.pz[i]);
      DUMMY.scale.setScalar(BUF.size[i] / 0.04);
      DUMMY.updateMatrix();
      mesh.setMatrixAt(i, DUMMY.matrix);
      TMP_COLOR.set(BUF.colorHex[i]);
      mesh.setColorAt(i, TMP_COLOR);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = delta * 60; // normalize against ~60fps tick used in legacy
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let x = BUF.px[i];
      let y = BUF.py[i];
      let z = BUF.pz[i];
      x += BUF.vx[i] * dt + Math.sin(BUF.phase[i] + y * 0.5) * 0.0008 * dt;
      y += BUF.vy[i] * dt;
      z += BUF.vz[i] * dt;
      if (y > PARTICLES.ceiling) {
        y = PARTICLES.floorReset;
        x = (RESET_RNG() - 0.5) * PARTICLES.spread;
        z = (RESET_RNG() - 0.5) * PARTICLES.spread;
      }
      BUF.px[i] = x;
      BUF.py[i] = y;
      BUF.pz[i] = z;
      DUMMY.position.set(x, y, z);
      DUMMY.scale.setScalar(BUF.size[i] / 0.04); // base geometry is 0.04 cube
      DUMMY.updateMatrix();
      mesh.setMatrixAt(i, DUMMY.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, PARTICLE_COUNT]}
      frustumCulled={false}
    >
      <boxGeometry args={[0.04, 0.04, 0.04]} />
      <meshPhongMaterial
        emissive="#ffffff"
        emissiveIntensity={0.9}
        transparent
        opacity={0.75}
        flatShading
      />
    </instancedMesh>
  );
}
