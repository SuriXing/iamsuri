import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PARTICLE_COUNT, PARTICLES } from '../constants';
import { makeRng } from '../util/rand';

interface ParticleBuffers {
  // Per-instance state — mutated each frame
  px: Float32Array;
  py: Float32Array;
  pz: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  vz: Float32Array;
  // Per-particle horizontal drift params (module-scope, baked at build).
  driftAmp: Float32Array;   // XZ drift amplitude
  driftFreq: Float32Array;  // XZ drift angular speed
  size: Float32Array;
  // Precomputed scale (size / 0.04 base cube) — read by index in useFrame to
  // avoid ~150 divisions per frame. F3.21 perf trim.
  sizeScale: Float32Array;
  phase: Float32Array;
  // Color name list (resolved at mount via setColorAt)
  colorHex: string[];
}

// F3.21: trimmed from 5 saturated hues (gold/green/purple/blue/red) to a
// 3-hue warm/pastel palette. Reviewer A flagged the cool blue + saturated
// red/purple as fighting the warm dorm-room ambient. Now: warm gold,
// dusty pink, and amber/orange for a cohesive "candle dust" mood.
const PARTICLE_COLORS = [
  '#fbbf24', // warm gold
  '#f4a8b8', // dusty pink
  '#ff9840', // amber/orange
];

function buildBuffers(): ParticleBuffers {
  const rng = makeRng(0xb0b);
  const px = new Float32Array(PARTICLE_COUNT);
  const py = new Float32Array(PARTICLE_COUNT);
  const pz = new Float32Array(PARTICLE_COUNT);
  const vx = new Float32Array(PARTICLE_COUNT);
  const vy = new Float32Array(PARTICLE_COUNT);
  const vz = new Float32Array(PARTICLE_COUNT);
  const driftAmp = new Float32Array(PARTICLE_COUNT);
  const driftFreq = new Float32Array(PARTICLE_COUNT);
  const size = new Float32Array(PARTICLE_COUNT);
  const sizeScale = new Float32Array(PARTICLE_COUNT);
  const phase = new Float32Array(PARTICLE_COUNT);
  const colorHex: string[] = new Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    px[i] = (rng() - 0.5) * PARTICLES.spread;
    py[i] = rng() * PARTICLES.ceiling;
    pz[i] = (rng() - 0.5) * PARTICLES.spread;
    size[i] = 0.02 + rng() * 0.04;
    // Precomputed once: each frame's per-instance scale uses this (no division).
    sizeScale[i] = size[i] / 0.04;
    vx[i] = (rng() - 0.5) * 0.005;
    vy[i] = 0.003 + rng() * 0.008;
    vz[i] = (rng() - 0.5) * 0.005;
    // Gentle horizontal drift — tiny amp, varied frequency so particles swirl
    // organically rather than marching uniformly.
    driftAmp[i] = 0.0015 + rng() * 0.0035;
    driftFreq[i] = 0.4 + rng() * 0.9;
    phase[i] = rng() * Math.PI * 2;
    colorHex[i] = PARTICLE_COLORS[Math.floor(rng() * PARTICLE_COLORS.length)];
  }
  return { px, py, pz, vx, vy, vz, driftAmp, driftFreq, size, sizeScale, phase, colorHex };
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
      DUMMY.scale.setScalar(BUF.sizeScale[i]);
      DUMMY.updateMatrix();
      mesh.setMatrixAt(i, DUMMY.matrix);
      TMP_COLOR.set(BUF.colorHex[i]);
      mesh.setColorAt(i, TMP_COLOR);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useFrame(({ clock }, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = delta * 60; // normalize against ~60fps tick used in legacy
    const t = clock.getElapsedTime();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let x = BUF.px[i];
      let y = BUF.py[i];
      let z = BUF.pz[i];
      // Base velocity + gentle swirl: sin for X, cos for Z (quadrature).
      const ph = BUF.phase[i];
      const f = BUF.driftFreq[i];
      const amp = BUF.driftAmp[i];
      x += BUF.vx[i] * dt + Math.sin(t * f + ph) * amp * dt;
      y += BUF.vy[i] * dt;
      z += BUF.vz[i] * dt + Math.cos(t * f * 0.85 + ph) * amp * dt;
      if (y > PARTICLES.ceiling) {
        y = PARTICLES.floorReset;
        x = (RESET_RNG() - 0.5) * PARTICLES.spread;
        z = (RESET_RNG() - 0.5) * PARTICLES.spread;
      }
      BUF.px[i] = x;
      BUF.py[i] = y;
      BUF.pz[i] = z;
      DUMMY.position.set(x, y, z);
      DUMMY.scale.setScalar(BUF.sizeScale[i]); // precomputed (size / 0.04)
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
