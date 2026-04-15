import { useEffect, useMemo, useRef } from 'react';
import { Edges } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROOM_BY_ID } from '../../data/rooms';
import { FLOOR_Y } from '../../constants';
import { IDEA_LAB_CONTENT } from '../../../data/ideaLab';
import { useWorldStore } from '../../store/worldStore';
import { makeRng } from '../../util/rand';
import type { InteractableData } from '../../store/worldStore';

const IDEA_BOARD_INTERACTABLE: InteractableData = IDEA_LAB_CONTENT.dialogues.ideaBoard;

// --- Maker workshop palette (pine/olive-shifted — yellow-brown register) ---
// F3.15: nudged yellow +hue to lock tonal distinctness vs BookRoom's mahogany.
const WOOD_DEEP = '#4a3418';
const WOOD_MID = '#6e5428';
const WOOD_LIGHT = '#8f7436';
const WOOD_PLANK = '#7e6430';
const METAL_DARK = '#3a4250';
const METAL_MID = '#6a7280';
const METAL_LIGHT = '#9ba2ac';
const PEG_BROWN = '#5a3e22';
const WHITE_PAPER = '#f5f1e8';
const ELECTRIC_GREEN = '#4ade80';
const ORANGE_SPARK = '#f97316';
const AMBER_BULB = '#fbbf24';
const CORK = '#c8985a';
// F3.17 backlog: warm copper replaces the jarring electric-green tint on the
// heading bar and circuit-board top so they harmonize with the amber bulb.
const COPPER_ACCENT = '#c97a2a';

// F3.21: pegboard hole grid offsets — hoisted from inline JSX to module scope
// so the literal arrays aren't re-created on every render.
const PEG_HOLE_X: ReadonlyArray<number> = [-0.6, -0.3, 0.0, 0.3, 0.6];
const PEG_HOLE_Y: ReadonlyArray<number> = [-0.3, 0.0, 0.3];

// --- Ambient spark layer (F3.17) ---
const SPARK_COUNT = 14;
const SPARK_DRIFT_SPEED = 0.35;   // world units / sec
const SPARK_Y_MIN = 0.95;         // just above bench top
const SPARK_Y_MAX = 2.35;         // just below floating bulb

// F3.19: split into two sub-buffers so emissive colors can differ per bucket.
// meshPhongMaterial emissive is a material uniform (not per-instance), so a
// single InstancedMesh + setColorAt cannot produce two different glow hues.
// Solution: two separate InstancedMesh components, each with its own emissive.
interface SparkBucket {
  bx: Float32Array;     // local X offset from room center
  by: Float32Array;     // current Y (mutated in place)
  bz: Float32Array;     // local Z offset
  speed: Float32Array;  // per-spark drift speed mult
}

function buildSparkBuckets(): { orange: SparkBucket; warm: SparkBucket } {
  const rng = makeRng(0x1dea5 ^ SPARK_COUNT);
  const ox: number[] = [];
  const oy: number[] = [];
  const oz: number[] = [];
  const os: number[] = [];
  const wx: number[] = [];
  const wy: number[] = [];
  const wz: number[] = [];
  const ws: number[] = [];
  for (let i = 0; i < SPARK_COUNT; i++) {
    const x = (rng() - 0.5) * 2.2;
    const z = 0.6 + (rng() - 0.5) * 0.9;
    const y = SPARK_Y_MIN + rng() * (SPARK_Y_MAX - SPARK_Y_MIN);
    const sp = 0.7 + rng() * 0.6;
    const isOrange = rng() < 0.5;
    if (isOrange) {
      ox.push(x); oy.push(y); oz.push(z); os.push(sp);
    } else {
      wx.push(x); wy.push(y); wz.push(z); ws.push(sp);
    }
  }
  return {
    orange: {
      bx: new Float32Array(ox),
      by: new Float32Array(oy),
      bz: new Float32Array(oz),
      speed: new Float32Array(os),
    },
    warm: {
      bx: new Float32Array(wx),
      by: new Float32Array(wy),
      bz: new Float32Array(wz),
      speed: new Float32Array(ws),
    },
  };
}

const SPARK_BUCKETS = buildSparkBuckets();
const SPARK_ORANGE = SPARK_BUCKETS.orange;
const SPARK_WARM = SPARK_BUCKETS.warm;
const SPARK_ORANGE_COUNT = SPARK_ORANGE.bx.length;
const SPARK_WARM_COUNT = SPARK_WARM.bx.length;

// Zero-alloc scratch for the spark useFrame loop.
const SPARK_DUMMY = new THREE.Object3D();

// --- Micro-anim constants (module scope) ---
const GEAR_SPEED_A = 1.4;
const GEAR_SPEED_B = -1.9;
const GEAR_SPEED_C = 2.3;
const BULB_FLOAT_AMPLITUDE = 0.08;
const BULB_FLOAT_SPEED = 1.2;
// Post-ship flicker fix: bulb, solder-tip, accent-light all pulsed hard
// enough (>20% amplitude) at different fast frequencies that their
// superposition on the shared scene read as flicker. Amplitudes are now
// <=5% of base, frequencies aligned to a slow 0.6 Hz for cohesion.
const BULB_PULSE_BASE = 2.8;
const BULB_PULSE_AMPLITUDE = 0.14;
const BULB_PULSE_SPEED = 0.6;
// Flicker-fix pass #3: 18 rad/s (~2.86 Hz) vibration at ±0.008m was a
// high-frequency position shake that read as mesh flicker even though
// it's position not brightness. Slowed to 0.6 Hz breath, same amplitude.
const PROTOTYPE_VIBRATE_AMPLITUDE = 0.003;
const PROTOTYPE_VIBRATE_SPEED = 0.6;
const HANGING_TOOL_SWING_AMPLITUDE = 0.06;
const HANGING_TOOL_SWING_SPEED = 1.3;
const SOLDER_TIP_PULSE_BASE = 1.6;
const SOLDER_TIP_PULSE_AMPLITUDE = 0.08;
const SOLDER_TIP_PULSE_SPEED = 0.6;
const ACCENT_LIGHT_BASE = 0.75;
const ACCENT_LIGHT_AMPLITUDE = 0.04;
const ACCENT_LIGHT_SPEED = 0.6;

interface BoardLine {
  c: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// Keep the board content but retint into electric workshop accents.
const BOARD_LINES: ReadonlyArray<BoardLine> = [
  { c: ELECTRIC_GREEN, x: -0.85, y: 1.80, w: 0.55, h: 0.06 },
  { c: '#fbbf24',      x: -0.65, y: 1.70, w: 0.90, h: 0.05 },
  { c: '#fb7185',      x: -0.70, y: 1.55, w: 0.70, h: 0.05 },
  { c: ELECTRIC_GREEN, x: -0.50, y: 1.45, w: 0.80, h: 0.05 },
  { c: '#60a5fa',      x:  0.60, y: 1.75, w: 0.60, h: 0.06 },
  { c: ORANGE_SPARK,   x:  0.55, y: 1.62, w: 0.75, h: 0.05 },
  { c: ELECTRIC_GREEN, x:  0.70, y: 1.48, w: 0.55, h: 0.05 },
  { c: '#fbbf24',      x: -0.80, y: 1.00, w: 0.45, h: 0.05 },
  { c: '#fb7185',      x: -0.55, y: 0.88, w: 0.70, h: 0.05 },
  { c: '#60a5fa',      x:  0.55, y: 0.95, w: 0.70, h: 0.05 },
  { c: ELECTRIC_GREEN, x:  0.70, y: 0.83, w: 0.50, h: 0.05 },
];

// Workbench leg positions.
const BENCH_LEGS: ReadonlyArray<readonly [number, number]> = [
  [-1.15, -0.35],
  [1.15, -0.35],
  [-1.15, 0.35],
  [1.15, 0.35],
];

// Pegboard hanging tools — [dxFromBoardCenter, yOffset, width, height, color]
const PEG_TOOLS: ReadonlyArray<readonly [number, number, number, number, string]> = [
  [-0.7, 0.0, 0.06, 0.28, METAL_LIGHT], // wrench stem
  [-0.4, 0.0, 0.22, 0.08, METAL_MID],   // hammer head
  [-0.4, -0.15, 0.04, 0.28, WOOD_LIGHT], // hammer handle
  [0.0, 0.0, 0.12, 0.22, METAL_LIGHT],  // pliers body
  [0.4, 0.0, 0.06, 0.3, METAL_MID],     // screwdriver shaft
  [0.4, -0.22, 0.05, 0.1, ORANGE_SPARK], // screwdriver grip
  [0.7, 0.0, 0.18, 0.08, METAL_LIGHT],  // wrench head
];

// Floor plank stripes (X positions).
const PLANK_STRIPES: ReadonlyArray<number> = [-1.6, -0.8, 0.0, 0.8, 1.6];

export function IdeaLab() {
  const { center } = ROOM_BY_ID.idealab;
  const ox = center.x;
  const oz = center.z;

  const theme = useWorldStore((s) => s.theme);
  const edgeColor = theme === 'dark' ? '#0a0a14' : '#5a4830';

  // Deterministic paper sketch positions scattered on floor/bench.
  const sketches = useMemo(() => {
    const rng = makeRng(0x1dea5c);
    const arr: Array<{ x: number; z: number; rot: number; size: number; tint: number }> = [];
    for (let i = 0; i < 6; i++) {
      arr.push({
        x: (rng() - 0.5) * 2.4,
        z: 0.8 + (rng() - 0.5) * 1.2,
        rot: rng() * Math.PI,
        size: 0.18 + rng() * 0.08,
        tint: (rng() - 0.5) * 0.08,
      });
    }
    return arr;
  }, []);

  // Refs for micro-animations.
  const bulbRef = useRef<THREE.Mesh>(null);
  const bulbLightRef = useRef<THREE.PointLight>(null);
  const gearARef = useRef<THREE.Mesh>(null);
  const gearBRef = useRef<THREE.Mesh>(null);
  const gearCRef = useRef<THREE.Mesh>(null);
  const prototypeRef = useRef<THREE.Mesh>(null);
  const hangingToolRef = useRef<THREE.Group>(null);
  const solderTipRef = useRef<THREE.Mesh>(null);
  const accentLightRef = useRef<THREE.PointLight>(null);
  const sparksOrangeRef = useRef<THREE.InstancedMesh>(null);
  const sparksWarmRef = useRef<THREE.InstancedMesh>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    // Floating idea bulb (vertical bob + pulse).
    const bulb = bulbRef.current;
    const yOffset = Math.sin(t * BULB_FLOAT_SPEED) * BULB_FLOAT_AMPLITUDE;
    if (bulb) {
      bulb.position.y = 2.5 + yOffset;
      const mat = bulb.material as THREE.MeshPhongMaterial;
      mat.emissiveIntensity = BULB_PULSE_BASE + Math.sin(t * BULB_PULSE_SPEED) * BULB_PULSE_AMPLITUDE;
    }
    const bulbLight = bulbLightRef.current;
    if (bulbLight) {
      bulbLight.position.y = 2.5 + yOffset;
      // Flicker-fix pass #3: ±25% was visible breathing bordering on
      // flicker. ±5% keeps it alive without pumping the scene.
      bulbLight.intensity = 0.6 + Math.sin(t * BULB_PULSE_SPEED) * 0.03;
    }

    // Gears — counter-rotating.
    const gA = gearARef.current;
    if (gA) gA.rotation.z = t * GEAR_SPEED_A;
    const gB = gearBRef.current;
    if (gB) gB.rotation.z = t * GEAR_SPEED_B;
    const gC = gearCRef.current;
    if (gC) gC.rotation.z = t * GEAR_SPEED_C;

    // Prototype vibrating (high-freq tiny shake).
    const proto = prototypeRef.current;
    if (proto) {
      proto.position.x = proto.userData.baseX + Math.sin(t * PROTOTYPE_VIBRATE_SPEED) * PROTOTYPE_VIBRATE_AMPLITUDE;
      proto.position.z = proto.userData.baseZ + Math.cos(t * PROTOTYPE_VIBRATE_SPEED * 0.9) * PROTOTYPE_VIBRATE_AMPLITUDE;
    }

    // Hanging tool swinging.
    const hang = hangingToolRef.current;
    if (hang) {
      hang.rotation.z = Math.sin(t * HANGING_TOOL_SWING_SPEED) * HANGING_TOOL_SWING_AMPLITUDE;
    }

    // Soldering iron tip glow pulse.
    const tip = solderTipRef.current;
    if (tip) {
      const mat = tip.material as THREE.MeshPhongMaterial;
      mat.emissiveIntensity = SOLDER_TIP_PULSE_BASE + Math.sin(t * SOLDER_TIP_PULSE_SPEED) * SOLDER_TIP_PULSE_AMPLITUDE;
    }

    // Gold/copper accent — phase 3π/2 offset (last quadrant of cycle).
    const al = accentLightRef.current;
    if (al) al.intensity = ACCENT_LIGHT_BASE + Math.sin(t * ACCENT_LIGHT_SPEED + 4.71) * ACCENT_LIGHT_AMPLITUDE;

    // Ambient sparks — pure Y drift with wraparound, zero-alloc.
    // Two sub-buffers rendered by two InstancedMesh components so each
    // bucket carries its own emissive color (orange vs warm white).
    const smO = sparksOrangeRef.current;
    if (smO) {
      for (let i = 0; i < SPARK_ORANGE_COUNT; i++) {
        let y = SPARK_ORANGE.by[i];
        y += SPARK_DRIFT_SPEED * SPARK_ORANGE.speed[i] * delta;
        if (y > SPARK_Y_MAX) y = SPARK_Y_MIN;
        SPARK_ORANGE.by[i] = y;
        SPARK_DUMMY.position.set(SPARK_ORANGE.bx[i], y, SPARK_ORANGE.bz[i]);
        SPARK_DUMMY.updateMatrix();
        smO.setMatrixAt(i, SPARK_DUMMY.matrix);
      }
      smO.instanceMatrix.needsUpdate = true;
    }
    const smW = sparksWarmRef.current;
    if (smW) {
      for (let i = 0; i < SPARK_WARM_COUNT; i++) {
        let y = SPARK_WARM.by[i];
        y += SPARK_DRIFT_SPEED * SPARK_WARM.speed[i] * delta;
        if (y > SPARK_Y_MAX) y = SPARK_Y_MIN;
        SPARK_WARM.by[i] = y;
        SPARK_DUMMY.position.set(SPARK_WARM.bx[i], y, SPARK_WARM.bz[i]);
        SPARK_DUMMY.updateMatrix();
        smW.setMatrixAt(i, SPARK_DUMMY.matrix);
      }
      smW.instanceMatrix.needsUpdate = true;
    }
  });

  // Initial bake of spark instance matrices.
  useEffect(() => {
    const smO = sparksOrangeRef.current;
    if (smO) {
      for (let i = 0; i < SPARK_ORANGE_COUNT; i++) {
        SPARK_DUMMY.position.set(SPARK_ORANGE.bx[i], SPARK_ORANGE.by[i], SPARK_ORANGE.bz[i]);
        SPARK_DUMMY.updateMatrix();
        smO.setMatrixAt(i, SPARK_DUMMY.matrix);
      }
      smO.instanceMatrix.needsUpdate = true;
    }
    const smW = sparksWarmRef.current;
    if (smW) {
      for (let i = 0; i < SPARK_WARM_COUNT; i++) {
        SPARK_DUMMY.position.set(SPARK_WARM.bx[i], SPARK_WARM.by[i], SPARK_WARM.bz[i]);
        SPARK_DUMMY.updateMatrix();
        smW.setMatrixAt(i, SPARK_DUMMY.matrix);
      }
      smW.instanceMatrix.needsUpdate = true;
    }
  }, []);

  // Layout anchors.
  const benchX = ox;
  const benchZ = oz + 0.6;
  const benchTopY = 0.78;

  const pegboardX = ox;
  const pegboardY = 1.45;
  const pegboardZ = oz + 2.0;

  return (
    <group>
      {/* ----- WOOD PLANK FLOOR (two-tone bands) ----- */}
      <mesh position={[ox, FLOOR_Y + 0.09, oz]} receiveShadow>
        <boxGeometry args={[4.6, 0.03, 4.6]} />
        <meshPhongMaterial color={WOOD_DEEP} flatShading />
      </mesh>
      {PLANK_STRIPES.map((dx, i) => (
        <mesh key={`plank-${i}`} position={[ox + dx, FLOOR_Y + 0.105, oz]} receiveShadow>
          <boxGeometry args={[0.74, 0.01, 4.5]} />
          <meshPhongMaterial color={i % 2 === 0 ? WOOD_MID : WOOD_PLANK} flatShading />
        </mesh>
      ))}
      {/* Oil-stain accent patches */}
      <mesh position={[ox + 0.8, FLOOR_Y + 0.12, oz + 1.2]}>
        <boxGeometry args={[0.4, 0.002, 0.3]} />
        <meshPhongMaterial color="#2a1a0a" flatShading />
      </mesh>
      <mesh position={[ox - 1.2, FLOOR_Y + 0.12, oz - 0.5]}>
        <boxGeometry args={[0.5, 0.002, 0.35]} />
        <meshPhongMaterial color="#2a1a0a" flatShading />
      </mesh>

      {/* ----- PAPER SKETCHES SCATTERED ON FLOOR ----- */}
      {sketches.map((s, i) => (
        <mesh
          key={`sketch-${i}`}
          position={[ox + s.x, FLOOR_Y + 0.115, oz + s.z]}
          rotation={[0, s.rot, 0]}
        >
          <boxGeometry args={[s.size, 0.003, s.size * 0.75]} />
          <meshPhongMaterial
            color={WHITE_PAPER}
            emissive={WHITE_PAPER}
            emissiveIntensity={0.25 + s.tint}
            flatShading
          />
          <Edges color={edgeColor} lineWidth={1} />
        </mesh>
      ))}

      {/* ----- IDEA BOARD / WHITEBOARD (interactable preserved) ----- */}
      <mesh position={[ox, 1.25, oz - 2.08]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 1.7, 0.08]} />
        <meshPhongMaterial color={WOOD_MID} flatShading />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      <mesh
        position={[ox, 1.25, oz - 2.03]}
        onUpdate={(m) => {
          m.userData.interactable = IDEA_BOARD_INTERACTABLE;
        }}
      >
        <boxGeometry args={[2.4, 1.5, 0.02]} />
        <meshPhongMaterial color={WHITE_PAPER} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      {BOARD_LINES.map((l, i) => (
        <mesh key={`bline-${i}`} position={[ox + l.x, l.y, oz - 1.99]}>
          <boxGeometry args={[l.w, l.h, 0.012]} />
          <meshPhongMaterial color={l.c} emissive={l.c} emissiveIntensity={0.7} flatShading />
        </mesh>
      ))}
      {/* Heading bar (warm copper — F3.17 retint away from electric green) */}
      <mesh position={[ox, 1.96, oz - 1.99]}>
        <boxGeometry args={[1.6, 0.09, 0.012]} />
        <meshPhongMaterial color={COPPER_ACCENT} emissive={COPPER_ACCENT} emissiveIntensity={1.0} flatShading />
      </mesh>
      {/* Whiteboard marker tray */}
      <mesh position={[ox, 0.48, oz - 2.0]}>
        <boxGeometry args={[2.2, 0.04, 0.08]} />
        <meshPhongMaterial color={METAL_MID} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      {/* 3 markers on tray */}
      <mesh position={[ox - 0.5, 0.51, oz - 1.98]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.14, 6]} />
        <meshPhongMaterial color={ELECTRIC_GREEN} flatShading />
      </mesh>
      <mesh position={[ox - 0.3, 0.51, oz - 1.98]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.14, 6]} />
        <meshPhongMaterial color="#fb7185" flatShading />
      </mesh>
      <mesh position={[ox - 0.1, 0.51, oz - 1.98]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.14, 6]} />
        <meshPhongMaterial color="#60a5fa" flatShading />
      </mesh>

      {/* ----- WORKBENCH (hero — thick top + trim + 4 legs) ----- */}
      <mesh position={[benchX, benchTopY, benchZ]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.14, 0.95]} />
        <meshPhongMaterial color={WOOD_LIGHT} flatShading />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      {/* Bench trim (darker band beneath top) */}
      <mesh position={[benchX, benchTopY - 0.1, benchZ]} castShadow>
        <boxGeometry args={[2.58, 0.06, 0.93]} />
        <meshPhongMaterial color={WOOD_MID} flatShading />
      </mesh>
      {/* Legs — chunky 4-post */}
      {BENCH_LEGS.map(([dx, dz], i) => (
        <mesh key={`bleg-${i}`} position={[benchX + dx, benchTopY - 0.42, benchZ + dz]} castShadow>
          <boxGeometry args={[0.12, 0.6, 0.12]} />
          <meshPhongMaterial color={WOOD_DEEP} flatShading />
          <Edges color={edgeColor} lineWidth={1} />
        </mesh>
      ))}
      {/* Cross-brace under bench */}
      <mesh position={[benchX, benchTopY - 0.65, benchZ]}>
        <boxGeometry args={[2.2, 0.06, 0.08]} />
        <meshPhongMaterial color={WOOD_MID} flatShading />
      </mesh>
      {/* Bench vise (front edge) */}
      <mesh position={[benchX - 1.0, benchTopY + 0.08, benchZ - 0.42]} castShadow>
        <boxGeometry args={[0.28, 0.16, 0.18]} />
        <meshPhongMaterial color={METAL_DARK} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[benchX - 1.0, benchTopY + 0.12, benchZ - 0.32]}>
        <cylinderGeometry args={[0.015, 0.015, 0.18, 6]} />
        <meshPhongMaterial color={METAL_LIGHT} flatShading />
      </mesh>

      {/* ----- WORK-IN-PROGRESS PROTOTYPE (vibrates, center of bench) ----- */}
      <mesh
        ref={prototypeRef}
        position={[benchX, benchTopY + 0.16, benchZ]}
        onUpdate={(m) => {
          m.userData.baseX = benchX;
          m.userData.baseZ = benchZ;
        }}
        castShadow
      >
        <boxGeometry args={[0.3, 0.18, 0.22]} />
        <meshPhongMaterial color={METAL_MID} flatShading />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      {/* Circuit-board top on prototype (warm copper — F3.17 retint) */}
      <mesh position={[benchX, benchTopY + 0.26, benchZ]}>
        <boxGeometry args={[0.28, 0.02, 0.2]} />
        <meshPhongMaterial color={COPPER_ACCENT} emissive={COPPER_ACCENT} emissiveIntensity={0.4} flatShading />
      </mesh>
      {/* Prototype LED indicator */}
      <mesh position={[benchX + 0.1, benchTopY + 0.28, benchZ + 0.08]}>
        <boxGeometry args={[0.02, 0.02, 0.02]} />
        <meshPhongMaterial color={ORANGE_SPARK} emissive={ORANGE_SPARK} emissiveIntensity={3.0} flatShading />
      </mesh>

      {/* ----- GEARS (3, counter-rotating) — mounted on bench ----- */}
      <mesh ref={gearARef} position={[benchX + 0.9, benchTopY + 0.15, benchZ - 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.04, 8]} />
        <meshPhongMaterial color={METAL_LIGHT} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh ref={gearBRef} position={[benchX + 1.15, benchTopY + 0.15, benchZ - 0.05]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.04, 6]} />
        <meshPhongMaterial color={METAL_MID} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh ref={gearCRef} position={[benchX + 0.75, benchTopY + 0.15, benchZ + 0.05]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.04, 6]} />
        <meshPhongMaterial color={METAL_DARK} flatShading />
      </mesh>

      {/* ----- SOLDERING IRON (pulsing tip) ----- */}
      <mesh position={[benchX - 0.5, benchTopY + 0.05, benchZ + 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.3, 6]} />
        <meshPhongMaterial color={ORANGE_SPARK} flatShading />
      </mesh>
      <mesh position={[benchX - 0.68, benchTopY + 0.05, benchZ + 0.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.1, 6]} />
        <meshPhongMaterial color={METAL_LIGHT} flatShading />
      </mesh>
      <mesh ref={solderTipRef} position={[benchX - 0.76, benchTopY + 0.05, benchZ + 0.3]}>
        <boxGeometry args={[0.03, 0.03, 0.03]} />
        <meshPhongMaterial color={ORANGE_SPARK} emissive={ORANGE_SPARK} emissiveIntensity={SOLDER_TIP_PULSE_BASE} flatShading />
      </mesh>

      {/* ----- WRENCH + HAMMER ON BENCH (scatter tools) ----- */}
      <mesh position={[benchX - 0.2, benchTopY + 0.04, benchZ + 0.32]} rotation={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.24, 0.03, 0.05]} />
        <meshPhongMaterial color={METAL_LIGHT} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[benchX + 0.1, benchTopY + 0.05, benchZ + 0.3]} rotation={[0, -0.3, 0]} castShadow>
        <boxGeometry args={[0.18, 0.03, 0.04]} />
        <meshPhongMaterial color={WOOD_LIGHT} flatShading />
      </mesh>
      <mesh position={[benchX + 0.2, benchTopY + 0.06, benchZ + 0.3]} rotation={[0, -0.3, 0]} castShadow>
        <boxGeometry args={[0.08, 0.06, 0.04]} />
        <meshPhongMaterial color={METAL_MID} flatShading />
      </mesh>

      {/* ----- JAR OF PARTS (screws) ----- */}
      <mesh position={[benchX + 0.4, benchTopY + 0.13, benchZ + 0.3]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.22, 10]} />
        <meshPhongMaterial color="#a8bdd0" transparent opacity={0.5} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[benchX + 0.4, benchTopY + 0.06, benchZ + 0.3]}>
        <cylinderGeometry args={[0.065, 0.065, 0.08, 10]} />
        <meshPhongMaterial color={METAL_MID} flatShading />
      </mesh>
      <mesh position={[benchX + 0.4, benchTopY + 0.24, benchZ + 0.3]}>
        <cylinderGeometry args={[0.07, 0.065, 0.02, 10]} />
        <meshPhongMaterial color={METAL_DARK} flatShading />
      </mesh>

      {/* ----- TAPE ROLL ----- */}
      <mesh position={[benchX - 0.75, benchTopY + 0.08, benchZ + 0.05]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.04, 10]} />
        <meshPhongMaterial color={AMBER_BULB} emissive={AMBER_BULB} emissiveIntensity={0.1} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>

      {/* ----- PENCIL CUP ----- */}
      <mesh position={[benchX + 0.7, benchTopY + 0.1, benchZ - 0.32]} castShadow>
        <cylinderGeometry args={[0.07, 0.06, 0.2, 8]} />
        <meshPhongMaterial color={METAL_MID} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[benchX + 0.69, benchTopY + 0.22, benchZ - 0.34]} rotation={[0.2, 0, 0.1]}>
        <cylinderGeometry args={[0.01, 0.01, 0.18, 6]} />
        <meshPhongMaterial color={AMBER_BULB} flatShading />
      </mesh>
      <mesh position={[benchX + 0.72, benchTopY + 0.22, benchZ - 0.3]} rotation={[-0.15, 0, -0.1]}>
        <cylinderGeometry args={[0.01, 0.01, 0.18, 6]} />
        <meshPhongMaterial color="#fb7185" flatShading />
      </mesh>
      <mesh position={[benchX + 0.67, benchTopY + 0.22, benchZ - 0.31]}>
        <cylinderGeometry args={[0.01, 0.01, 0.18, 6]} />
        <meshPhongMaterial color="#60a5fa" flatShading />
      </mesh>

      {/* ----- ROLLS OF PAPER (blueprints, under bench) ----- */}
      <mesh position={[benchX - 1.05, 0.2, benchZ + 0.35]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
        <meshPhongMaterial color={WHITE_PAPER} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[benchX - 1.05, 0.31, benchZ + 0.35]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.45, 8]} />
        <meshPhongMaterial color={CORK} flatShading />
      </mesh>

      {/* ----- PEGBOARD (on back wall) ----- */}
      <mesh position={[pegboardX, pegboardY, pegboardZ]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 1.0, 0.04]} />
        <meshPhongMaterial color={PEG_BROWN} flatShading />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      {/* Pegboard hole pattern (darker dots) */}
      {PEG_HOLE_X.map((dx, i) =>
        PEG_HOLE_Y.map((dy, j) => (
          <mesh key={`hole-${i}-${j}`} position={[pegboardX + dx, pegboardY + dy, pegboardZ + 0.021]}>
            <boxGeometry args={[0.02, 0.02, 0.002]} />
            <meshPhongMaterial color="#2a1a0a" flatShading />
          </mesh>
        ))
      )}
      {/* Tools hanging on pegboard */}
      {PEG_TOOLS.map(([dx, dy, w, h, c], i) => (
        <mesh key={`ptool-${i}`} position={[pegboardX + dx, pegboardY + dy, pegboardZ + 0.05]} castShadow>
          <boxGeometry args={[w, h, 0.04]} />
          <meshPhongMaterial color={c} flatShading />
          <Edges color={edgeColor} lineWidth={1} />
        </mesh>
      ))}

      {/* ----- HANGING SWINGING TOOL (rope + wrench, swings) ----- */}
      <group ref={hangingToolRef} position={[pegboardX + 0.9, pegboardY + 0.5, pegboardZ + 0.1]}>
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[0.008, 0.4, 0.008]} />
          <meshPhongMaterial color={CORK} flatShading />
        </mesh>
        <mesh position={[0, -0.45, 0]} castShadow>
          <boxGeometry args={[0.06, 0.18, 0.04]} />
          <meshPhongMaterial color={METAL_LIGHT} flatShading />
          <Edges color={edgeColor} lineWidth={1} />
        </mesh>
      </group>

      {/* ----- CORK BOARD (small, side wall) ----- */}
      <mesh position={[ox + 2.05, 1.2, oz - 0.5]} rotation={[0, -Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[1.0, 0.7, 0.04]} />
        <meshPhongMaterial color={CORK} flatShading />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      {/* 3 pinned sketches */}
      <mesh position={[ox + 2.02, 1.3, oz - 0.7]} rotation={[0, -Math.PI / 2, 0.1]}>
        <boxGeometry args={[0.2, 0.16, 0.005]} />
        <meshPhongMaterial color={WHITE_PAPER} flatShading />
      </mesh>
      <mesh position={[ox + 2.02, 1.18, oz - 0.3]} rotation={[0, -Math.PI / 2, -0.1]}>
        <boxGeometry args={[0.2, 0.16, 0.005]} />
        <meshPhongMaterial color={WHITE_PAPER} flatShading />
      </mesh>
      <mesh position={[ox + 2.02, 1.02, oz - 0.55]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[0.18, 0.14, 0.005]} />
        <meshPhongMaterial color="#ffe4b0" flatShading />
      </mesh>

      {/* ----- STOOL (simple seat beside bench) ----- */}
      <mesh position={[benchX + 1.4, 0.45, benchZ + 0.8]} castShadow>
        <boxGeometry args={[0.35, 0.06, 0.35]} />
        <meshPhongMaterial color={WOOD_LIGHT} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[benchX + 1.26, 0.21, benchZ + 0.66]}>
        <boxGeometry args={[0.04, 0.46, 0.04]} />
        <meshPhongMaterial color={WOOD_MID} flatShading />
      </mesh>
      <mesh position={[benchX + 1.54, 0.21, benchZ + 0.66]}>
        <boxGeometry args={[0.04, 0.46, 0.04]} />
        <meshPhongMaterial color={WOOD_MID} flatShading />
      </mesh>
      <mesh position={[benchX + 1.26, 0.21, benchZ + 0.94]}>
        <boxGeometry args={[0.04, 0.46, 0.04]} />
        <meshPhongMaterial color={WOOD_MID} flatShading />
      </mesh>
      <mesh position={[benchX + 1.54, 0.21, benchZ + 0.94]}>
        <boxGeometry args={[0.04, 0.46, 0.04]} />
        <meshPhongMaterial color={WOOD_MID} flatShading />
      </mesh>

      {/* ----- FLOATING IDEA BULB (hero, pulses) ----- */}
      <mesh ref={bulbRef} position={[ox, 2.5, oz + 0.4]}>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshPhongMaterial color="#ffe28a" emissive={AMBER_BULB} emissiveIntensity={BULB_PULSE_BASE} flatShading />
      </mesh>
      {/* Bulb screw base */}
      <mesh position={[ox, 2.65, oz + 0.4]}>
        <boxGeometry args={[0.07, 0.08, 0.07]} />
        <meshPhongMaterial color={METAL_MID} flatShading />
      </mesh>
      <pointLight ref={bulbLightRef} position={[ox, 2.5, oz + 0.4]} color="#ffe0a0" intensity={0.7} distance={9} />

      {/* ----- AMBIENT SPARK LAYER (F3.19: two buckets for true color split) ----- */}
      {/* Small emissive cubes drifting upward over the workbench. Split into
          orange + warm-white InstancedMesh so each carries its own emissive
          uniform (meshPhongMaterial emissive can't vary per-instance). */}
      <group position={[ox, 0, oz]}>
        <instancedMesh
          ref={sparksOrangeRef}
          args={[undefined, undefined, SPARK_ORANGE_COUNT]}
          frustumCulled={false}
        >
          <boxGeometry args={[0.03, 0.03, 0.03]} />
          <meshPhongMaterial
            color="#f97316"
            emissive="#f97316"
            emissiveIntensity={2.0}
            transparent
            opacity={0.95}
            flatShading
          />
        </instancedMesh>
        <instancedMesh
          ref={sparksWarmRef}
          args={[undefined, undefined, SPARK_WARM_COUNT]}
          frustumCulled={false}
        >
          <boxGeometry args={[0.03, 0.03, 0.03]} />
          <meshPhongMaterial
            color="#fff3a0"
            emissive="#fff3a0"
            emissiveIntensity={1.5}
            transparent
            opacity={0.9}
            flatShading
          />
        </instancedMesh>
      </group>

      {/* ----- GOLD ACCENT LIGHT at workbench (room accent per rooms.ts #fbbf24) ----- */}
      <pointLight
        ref={accentLightRef}
        color={AMBER_BULB}
        intensity={ACCENT_LIGHT_BASE}
        distance={6}
        position={[benchX, benchTopY + 0.4, benchZ]}
      />
    </group>
  );
}
