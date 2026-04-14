import { useMemo, useRef } from 'react';
import { Edges } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROOM_BY_ID } from '../../data/rooms';
import { Bookshelf } from '../parts/Bookshelf';
import { DeskLamp } from '../parts/DeskLamp';
import { MY_ROOM_CONTENT } from '../../../data/myRoom';
import { makeRng } from '../../util/rand';
import type { InteractableData } from '../../store/worldStore';

const HEADBOARD_INTERACTABLE: InteractableData = MY_ROOM_CONTENT.dialogues.bed;
const MONITOR_INTERACTABLE: InteractableData = MY_ROOM_CONTENT.dialogues.monitor;

const PINK = '#f4a8b8';
const PINK_SOFT = '#f8c4d0';
const PINK_DARK = '#d87890';
const PINK_DUSTY = '#c87890';
const WHITE = '#f8f8f8';
const WHITE_OFF = '#e8e8e8';
const WOOD = '#6b4423';
const WOOD_DARK = '#4a3018';
const SHELF_BACK = '#4a3018';
const GOLD = '#c9a14a';
const EDGE_COLOR = '#0a0a14';
const FRAME_DARK = '#3a2a1a';

const BED_LEGS: ReadonlyArray<readonly [number, number]> = [
  [-0.7, -0.95],
  [0.7, -0.95],
  [-0.7, 0.95],
  [0.7, 0.95],
];

// Tapered desk legs: top square + slight inset bottom handled via two stacked boxes.
const DESK_LEGS: ReadonlyArray<readonly [number, number]> = [
  [-0.6, -0.7],
  [0.6, -0.7],
  [-0.6, 0.7],
  [0.6, 0.7],
];

const SHELF_BOOK_COLORS: ReadonlyArray<string> = MY_ROOM_CONTENT.shelfBookColors;

// Deterministic pillow tint seed for two pillows.
const PILLOW_SEED = 0x51f3a8;

// ---- Micro-animation constants (module-scope = zero per-frame alloc) ----
// Monitor scanline sweep: vertical oscillation across screen face.
const SCANLINE_BASE_Y = 1.25;
const SCANLINE_SWEEP_AMPLITUDE = 0.25; // ±0.25 fits within 0.58 screen half-height
const SCANLINE_SWEEP_SPEED = 2.0;
// Plant foliage breathing: ±3% scale pulse.
const PLANT_BREATH_AMPLITUDE = 0.03;
const PLANT_BREATH_SPEED = 0.8;
// Pink accent light breathing: base 0.3, ~5% at slow 0.6 Hz. Dampened
// from 10% post-ship when the combined 4-room pulse superposition read
// as flicker.
const ACCENT_LIGHT_BASE = 0.3;
const ACCENT_LIGHT_AMPLITUDE = 0.015;
const ACCENT_LIGHT_SPEED = 0.6;

// Folded clothes stack — small boxes in pink/white.
interface ClothesBoxSpec {
  readonly dy: number;
  readonly w: number;
  readonly h: number;
  readonly d: number;
  readonly color: string;
}
const CLOTHES_STACK: ReadonlyArray<ClothesBoxSpec> = [
  { dy: 0.0,  w: 0.42, h: 0.06, d: 0.28, color: PINK_SOFT },
  { dy: 0.065, w: 0.40, h: 0.05, d: 0.26, color: WHITE },
  { dy: 0.12, w: 0.38, h: 0.05, d: 0.25, color: PINK_DARK },
];

export function MyRoom() {
  const { center } = ROOM_BY_ID.myroom;
  const ox = center.x;
  const oz = center.z;
  const bedX = ox - 1.0;
  const bedZ = oz - 0.3;
  const deskX = ox + 1.0;
  const deskZ = oz - 0.3;
  const shelfX = ox - 0.1;
  const shelfZ = oz - 1.7;

  // Deterministic pillow tints — subtle variation, stable per mount.
  const pillowTints = useMemo<readonly [string, string]>(() => {
    const rng = makeRng(PILLOW_SEED);
    // Two slightly different hues biased toward PINK_SOFT.
    const pool = [PINK_SOFT, '#fbd0da', '#f6bccc', '#ffd6e1'] as const;
    const a = pool[Math.floor(rng() * pool.length)];
    let b = pool[Math.floor(rng() * pool.length)];
    if (b === a) b = pool[(pool.indexOf(a) + 1) % pool.length];
    return [a, b];
  }, []);

  // Micro-animation refs (mirrors DeskLamp zero-alloc pattern).
  const scanlineRef = useRef<THREE.Mesh>(null);
  const plantLeavesRef = useRef<THREE.Mesh>(null);
  const accentLightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Monitor scanline sweep — vertical oscillation across screen.
    const scan = scanlineRef.current;
    if (scan) {
      scan.position.y = SCANLINE_BASE_Y + Math.sin(t * SCANLINE_SWEEP_SPEED) * SCANLINE_SWEEP_AMPLITUDE;
    }
    // Plant foliage breathing — uniform scale pulse.
    const leaves = plantLeavesRef.current;
    if (leaves) {
      const s = 1 + Math.sin(t * PLANT_BREATH_SPEED) * PLANT_BREATH_AMPLITUDE;
      leaves.scale.setScalar(s);
    }
    // Pink accent point-light breathing.
    const al = accentLightRef.current;
    if (al) {
      al.intensity = ACCENT_LIGHT_BASE + Math.sin(t * ACCENT_LIGHT_SPEED) * ACCENT_LIGHT_AMPLITUDE;
    }
  });

  return (
    <group>
      {/* ----- BED ----- */}
      {/* Base — thinner slab */}
      <mesh position={[bedX, 0.15, bedZ]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.18, 2.1]} />
        <meshPhongMaterial color={WOOD} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      {/* Mattress — thicker slab */}
      <mesh position={[bedX, 0.38, bedZ]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.28, 2.0]} />
        <meshPhongMaterial color={PINK} emissive={PINK} emissiveIntensity={0.12} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      {/* Sheet fold — visible light/shadow edge */}
      <mesh position={[bedX, 0.545, bedZ + 0.25]} castShadow>
        <boxGeometry args={[1.42, 0.06, 1.4]} />
        <meshPhongMaterial color={PINK_DARK} emissive={PINK_DARK} emissiveIntensity={0.08} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1.2} />
      </mesh>
      {/* Pillow indent — two boxes with slightly different tints */}
      <mesh position={[bedX - 0.3, 0.59, bedZ - 0.75]} rotation={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.55, 0.14, 0.35]} />
        <meshPhongMaterial color={pillowTints[0]} emissive={pillowTints[0]} emissiveIntensity={0.1} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      <mesh position={[bedX + 0.3, 0.59, bedZ - 0.75]} rotation={[0, -0.05, 0]} castShadow>
        <boxGeometry args={[0.55, 0.14, 0.35]} />
        <meshPhongMaterial color={pillowTints[1]} emissive={pillowTints[1]} emissiveIntensity={0.1} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      {/* Headboard (bed interactable) */}
      <mesh
        position={[bedX, 0.65, bedZ - 1.05]}
        castShadow
        receiveShadow
        onUpdate={(m) => {
          m.userData.interactable = HEADBOARD_INTERACTABLE;
        }}
      >
        <boxGeometry args={[1.5, 0.7, 0.12]} />
        <meshPhongMaterial color={WOOD} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      {/* Bed legs */}
      {BED_LEGS.map(([dx, dz], i) => (
        <mesh key={i} position={[bedX + dx, 0.05, bedZ + dz]} castShadow>
          <boxGeometry args={[0.08, 0.1, 0.08]} />
          <meshPhongMaterial color={WOOD_DARK} flatShading />
        </mesh>
      ))}
      {/* Folded clothes stacked at foot of bed */}
      {CLOTHES_STACK.map((c, i) => (
        <mesh
          key={`clothes-${i}`}
          position={[bedX + 0.35, 0.56 + c.dy, bedZ + 0.75]}
          rotation={[0, 0.12, 0]}
          castShadow
        >
          <boxGeometry args={[c.w, c.h, c.d]} />
          <meshPhongMaterial color={c.color} emissive={c.color} emissiveIntensity={0.08} flatShading />
        </mesh>
      ))}

      {/* ----- DESK ----- */}
      {/* Desk top */}
      <mesh position={[deskX, 0.78, deskZ]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.08, 1.6]} />
        <meshPhongMaterial color={WHITE} emissive={WHITE} emissiveIntensity={0.05} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1.2} />
      </mesh>
      {/* Trim board under desk top edge */}
      <mesh position={[deskX, 0.72, deskZ]} castShadow>
        <boxGeometry args={[1.38, 0.02, 1.58]} />
        <meshPhongMaterial color={WHITE_OFF} flatShading />
      </mesh>
      {/* Tapered desk legs — top chunk */}
      {DESK_LEGS.map(([dx, dz], i) => (
        <mesh key={`leg-top-${i}`} position={[deskX + dx, 0.55, deskZ + dz]} castShadow>
          <boxGeometry args={[0.09, 0.36, 0.09]} />
          <meshPhongMaterial color={WHITE_OFF} flatShading />
        </mesh>
      ))}
      {/* Tapered desk legs — bottom chunk (slimmer) */}
      {DESK_LEGS.map(([dx, dz], i) => (
        <mesh key={`leg-bot-${i}`} position={[deskX + dx, 0.19, deskZ + dz]} castShadow>
          <boxGeometry args={[0.06, 0.36, 0.06]} />
          <meshPhongMaterial color={WHITE_OFF} flatShading />
        </mesh>
      ))}
      {/* Drawer face */}
      <mesh position={[deskX, 0.6, deskZ + 0.5]} castShadow>
        <boxGeometry args={[1.3, 0.22, 0.5]} />
        <meshPhongMaterial color={WHITE_OFF} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1.2} />
      </mesh>
      {/* Gold drawer handle — small sphere */}
      <mesh position={[deskX, 0.6, deskZ + 0.77]}>
        <sphereGeometry args={[0.028, 8, 6]} />
        <meshPhongMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.3} flatShading />
      </mesh>

      {/* Monitor frame — bumped 1.0x0.65 -> 1.2x0.72 for proper proportion */}
      <mesh position={[deskX, 1.25, deskZ - 0.5]} castShadow>
        <boxGeometry args={[1.2, 0.72, 0.06]} />
        <meshPhongMaterial color="#eeeeee" flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1.2} />
      </mesh>
      {/* Screen (monitor interactable) */}
      <mesh
        position={[deskX, 1.25, deskZ - 0.47]}
        onUpdate={(m) => {
          m.userData.interactable = MONITOR_INTERACTABLE;
        }}
      >
        <boxGeometry args={[1.02, 0.58, 0.02]} />
        <meshPhongMaterial color="#1a1a3e" emissive="#ffb6c1" emissiveIntensity={1.2} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      {/* Stand */}
      <mesh position={[deskX, 0.96, deskZ - 0.45]}>
        <boxGeometry args={[0.08, 0.32, 0.08]} />
        <meshPhongMaterial color={WHITE_OFF} flatShading />
      </mesh>
      {/* Base */}
      <mesh position={[deskX, 0.82, deskZ - 0.45]}>
        <boxGeometry args={[0.32, 0.04, 0.18]} />
        <meshPhongMaterial color={WHITE_OFF} flatShading />
      </mesh>
      {/* Scanline — sweeps vertically via useFrame */}
      <mesh ref={scanlineRef} position={[deskX, SCANLINE_BASE_Y, deskZ - 0.45]}>
        <boxGeometry args={[0.95, 0.02, 0.01]} />
        <meshPhongMaterial color="#ffd0e0" emissive="#ffd0e0" emissiveIntensity={2.0} flatShading />
      </mesh>

      {/* Notebook + pen */}
      <mesh position={[deskX - 0.4, 0.82, deskZ + 0.1]} rotation={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.4, 0.04, 0.3]} />
        <meshPhongMaterial color={PINK_SOFT} emissive={PINK_SOFT} emissiveIntensity={0.1} flatShading />
      </mesh>
      <mesh position={[deskX - 0.1, 0.82, deskZ + 0.05]} rotation={[0, 0.3, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.3, 6]} />
        <meshPhongMaterial color={GOLD} flatShading />
      </mesh>

      {/* Tiny potted plant on desk */}
      <mesh position={[deskX - 0.5, 0.87, deskZ - 0.3]} castShadow>
        <cylinderGeometry args={[0.07, 0.06, 0.1, 8]} />
        <meshPhongMaterial color="#c06850" flatShading />
      </mesh>
      <mesh ref={plantLeavesRef} position={[deskX - 0.5, 0.99, deskZ - 0.3]} castShadow>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshPhongMaterial color="#4ade80" emissive="#22c55e" emissiveIntensity={0.18} flatShading />
      </mesh>

      {/* Desk lamp with subtle pulsing glow */}
      <DeskLamp
        x={deskX + 0.5}
        y={0.82}
        z={deskZ - 0.3}
        color="#ffd700"
        lightColor="#ffd6a8"
        intensity={1.0}
        distance={6}
        bodyColor={WHITE_OFF}
        pulse
      />

      {/* ----- BOOKSHELF ----- */}
      <Bookshelf
        x={shelfX}
        z={shelfZ}
        rows={3}
        booksPerRow={4}
        width={1.2}
        depth={0.3}
        rowSpacing={0.5}
        baseY={0.45}
        backPanelColor={SHELF_BACK}
        plankColor={WOOD}
        bookColors={SHELF_BOOK_COLORS}
        seed={0xb00c5}
        heroBookCount={3}
        edgeColor={EDGE_COLOR}
      />

      {/* ----- RUG + INNER BORDER ----- */}
      <mesh position={[bedX, 0.075, bedZ + 0.7]} receiveShadow>
        <boxGeometry args={[1.8, 0.03, 1.2]} />
        <meshPhongMaterial color={PINK_DUSTY} emissive={PINK_DUSTY} emissiveIntensity={0.12} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      {/* Rug inner border — 4 thin strips */}
      <mesh position={[bedX, 0.095, bedZ + 0.19]}>
        <boxGeometry args={[1.55, 0.005, 0.04]} />
        <meshPhongMaterial color={PINK_DARK} emissive={PINK_DARK} emissiveIntensity={0.25} flatShading />
      </mesh>
      <mesh position={[bedX, 0.095, bedZ + 1.21]}>
        <boxGeometry args={[1.55, 0.005, 0.04]} />
        <meshPhongMaterial color={PINK_DARK} emissive={PINK_DARK} emissiveIntensity={0.25} flatShading />
      </mesh>
      <mesh position={[bedX - 0.79, 0.095, bedZ + 0.7]}>
        <boxGeometry args={[0.04, 0.005, 1.06]} />
        <meshPhongMaterial color={PINK_DARK} emissive={PINK_DARK} emissiveIntensity={0.25} flatShading />
      </mesh>
      <mesh position={[bedX + 0.79, 0.095, bedZ + 0.7]}>
        <boxGeometry args={[0.04, 0.005, 1.06]} />
        <meshPhongMaterial color={PINK_DARK} emissive={PINK_DARK} emissiveIntensity={0.25} flatShading />
      </mesh>

      {/* ----- FRAMED PICTURE ON WALL ----- */}
      {/* Frame — raised to decrowd shelf top */}
      <mesh position={[ox + 0.9, 1.85, oz - 1.92]} castShadow>
        <boxGeometry args={[0.5, 0.4, 0.04]} />
        <meshPhongMaterial color={FRAME_DARK} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      {/* Frame center — lighter */}
      <mesh position={[ox + 0.9, 1.85, oz - 1.9]}>
        <boxGeometry args={[0.4, 0.3, 0.02]} />
        <meshPhongMaterial color={PINK_SOFT} emissive={PINK_SOFT} emissiveIntensity={0.2} flatShading />
      </mesh>

      {/* ----- CURTAINS ----- */}
      {/* Rod — pulled forward alongside panels to avoid back-wall clip */}
      <mesh position={[bedX, 2.1, oz - 1.89]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 1.2, 8]} />
        <meshPhongMaterial color={GOLD} flatShading />
      </mesh>
      {/* Left curtain panel — z shifted 0.05 forward from back wall */}
      <mesh position={[bedX - 0.45, 1.5, oz - 1.88]} castShadow>
        <boxGeometry args={[0.3, 1.1, 0.04]} />
        <meshPhongMaterial color={PINK_SOFT} emissive={PINK_SOFT} emissiveIntensity={0.12} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      {/* Right curtain panel — slightly darker */}
      <mesh position={[bedX + 0.45, 1.5, oz - 1.88]} castShadow>
        <boxGeometry args={[0.3, 1.1, 0.04]} />
        <meshPhongMaterial color={PINK_DUSTY} emissive={PINK_DUSTY} emissiveIntensity={0.12} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>

      {/* ----- PINK ACCENT POINT LIGHT ----- breathes base 0.3, ±10% @ 0.6 Hz */}
      <pointLight
        ref={accentLightRef}
        color="#f4a8b8"
        intensity={ACCENT_LIGHT_BASE}
        distance={3}
        position={[bedX, 0.9, bedZ]}
      />
    </group>
  );
}
