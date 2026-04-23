import { useEffect, useMemo, useRef } from 'react';
import { registerCollider, unregisterCollider } from '../colliders';
import { Edges, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
// Named imports — namespace import defeats tree-shaking of three.
import { Mesh, PointLight } from 'three';
import { ROOM_BY_ID } from '../../data/rooms';
import { ROOM } from '../../constants';
import { PRODUCT_ROOM_CONTENT, PROJECT_SHOWCASE_ENTRIES } from '../../../data/productRoom';
import { useWorldStore } from '../../store/worldStore';
import type { InteractableData } from '../../store/worldStore';

const PRODUCT_COLORS: ReadonlyArray<string> = PRODUCT_ROOM_CONTENT.showcaseCubeColors;

const PROBLEM_SOLVER: InteractableData = PRODUCT_ROOM_CONTENT.dialogues.problemSolver;
const MENTOR_TABLE: InteractableData = PRODUCT_ROOM_CONTENT.dialogues.mentorTable;

// --- Tech / startup-war-room palette (cool slate + cyan) ---
const SLATE_DEEP = '#1e293b';
const SLATE_MID = '#334155';
const SLATE_LIGHT = '#475569';
const METAL = '#8a93a0';
const METAL_LIGHT = '#b7c0cc';
const WHITE_COOL = '#e6ecf2';
const CYAN = '#22d3ee';
const CYAN_DIM = '#0ea5b7';
const CABLE_BLACK = '#0f172a';
const RACK_BLACK = '#14181f';
const WOOD_WARM = '#8a6f4d';

// PR1.7: cool-palette overrides for warm data accents (D3). Data file
// stays canonical (brand truth); the room re-temperatures the warm
// accents toward the cool slate axis at render time.
const COOL_ACCENT_OVERRIDE: Record<string, string> = {
  '#facc15': '#5eead4', // saturated yellow → mint
  '#fb7185': '#c4b5fd', // coral pink → lavender
};

// Desk leg positions (tapered via two stacked chunks).
const DESK_LEGS: ReadonlyArray<readonly [number, number]> = [
  [-0.9, -0.35],
  [0.9, -0.35],
  [-0.9, 0.35],
  [0.9, 0.35],
];

// ---- Micro-anim constants (module-scope = zero per-frame alloc) ----
const FAN_SPEED = 6.0;
// PR1.8 hero focal: rotating logo cube spin rate (rad/s, ≤0.5).
const HERO_CUBE_SPIN_SPEED = 0.4;

// PR1.4: 3 explicit slate plank tiers (BookRoom-style discrete pattern).
const PLANK_TIERS: ReadonlyArray<string> = ['#1e293b', '#334155', '#475569'];

// Server rack LED layout: [dy, dx, color] relative to rack top.
const RACK_LEDS: ReadonlyArray<readonly [number, number, string]> = [
  [0.0, 0.0, '#22d3ee'],
  [0.08, 0.0, '#22d3ee'],
  [0.0, -0.18, '#ef4444'],
  [0.08, -0.18, '#22c55e'],
  [0.0, -0.36, '#22c55e'],
  [0.08, -0.36, '#facc15'],
];

// PR1.7: 6 unified project stations (D6). Order = 2 dialogue-rich +
// 4 PROJECT_SHOWCASE_ENTRIES. Variants give per-station silhouette
// variation (D1) — vary plinth h/w, monitor w/h, top material, optional
// stacked second screen.
interface StationVariant {
  plinthH: number;
  plinthW: number;
  monitorW: number;
  monitorH: number;
  top: 'slate' | 'wood' | 'metal';
  stacked?: boolean;
}
const STATION_VARIANTS: ReadonlyArray<StationVariant> = [
  { plinthH: 0.85, plinthW: 0.70, monitorW: 0.95, monitorH: 0.45, top: 'slate' },
  { plinthH: 0.95, plinthW: 0.62, monitorW: 0.55, monitorH: 0.70, top: 'wood' },
  { plinthH: 0.78, plinthW: 0.74, monitorW: 0.85, monitorH: 0.55, top: 'slate' },
  { plinthH: 0.92, plinthW: 0.70, monitorW: 0.85, monitorH: 0.40, top: 'metal', stacked: true },
  { plinthH: 0.82, plinthW: 0.70, monitorW: 0.92, monitorH: 0.46, top: 'slate' },
  { plinthH: 0.90, plinthW: 0.66, monitorW: 0.70, monitorH: 0.56, top: 'wood' },
];

// PR1.7: shallow V z-stagger (D4). Outer stations toward door (smaller z),
// center stations away (larger z). Returns ±0.15 m max around oz+1.55.
function stationDz(i: number, n: number): number {
  if (n <= 1) return 0;
  const half = (n - 1) / 2;
  const dist = Math.abs(i - half) / half; // 0 center, 1 edge
  return -0.15 + (1 - dist) * 0.30;
}

interface StationConfig {
  id: string;
  title: string;
  body: string;
  link?: string;
  accent: string;
}

function buildStations(): ReadonlyArray<StationConfig> {
  const dialogue: StationConfig[] = [
    {
      id: 'station-problem-solver-rich',
      title: PROBLEM_SOLVER.title,
      body: PROBLEM_SOLVER.body,
      link: PROBLEM_SOLVER.link,
      accent: '#22d3ee',
    },
    {
      id: 'station-mentor-table-rich',
      title: MENTOR_TABLE.title,
      body: MENTOR_TABLE.body,
      link: MENTOR_TABLE.link,
      accent: '#22c55e',
    },
  ];
  const fromEntries: StationConfig[] = PROJECT_SHOWCASE_ENTRIES.map((e) => ({
    id: `station-${e.id}`,
    title: e.title,
    body: e.pitch,
    link: e.link,
    accent: COOL_ACCENT_OVERRIDE[e.accent] ?? e.accent,
  }));
  return [...dialogue, ...fromEntries];
}

const STATIONS: ReadonlyArray<StationConfig> = buildStations();
const STATION_SPAN = 4.2; // back-wall span used for x layout
const STATION_STRIDE =
  STATIONS.length > 1 ? STATION_SPAN / (STATIONS.length - 1) : 0;

function stationX(i: number, ox: number): number {
  return ox + (i - (STATIONS.length - 1) / 2) * STATION_STRIDE;
}

export function ProductRoom() {
  const { center } = ROOM_BY_ID.product;
  const ox = center.x;
  const oz = center.z;

  const theme = useWorldStore((s) => s.theme);
  const edgeColor = theme === 'dark' ? '#0a0a14' : '#5a4830';

  // Refs for surviving animations (fan + rack LEDs + hero cube).
  const fanRef = useRef<Mesh>(null);
  const rackLedRefs = useRef<Array<Mesh | null>>([]);
  const accentLightRef = useRef<PointLight>(null);
  // PR1.8 hero focal: rotating logo cube inside glass display case.
  const heroCubeRef = useRef<Mesh>(null);

  // PR1.8: gate idle rotation on prefers-reduced-motion. Mirrors the
  // BookRoom globe intent — when user opts out of motion, hero cube
  // stays at its static angle (no useFrame work for it).
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useFrame(({ clock }) => {
    const vm = useWorldStore.getState().viewMode;
    if (vm !== 'overview' && vm !== 'product') return;
    const t = clock.getElapsedTime();
    const fan = fanRef.current;
    if (fan) fan.rotation.z = t * FAN_SPEED;
    // PR1.8 hero focal: Y-axis rotation only, gated on reduced-motion.
    // No emissiveIntensity / scale changes per spec.
    if (!prefersReducedMotion) {
      const cube = heroCubeRef.current;
      if (cube) cube.rotation.y = t * HERO_CUBE_SPIN_SPEED;
    }
  });

  // Desk geometry.
  const deskX = ox;
  const deskZ = oz - 0.3;
  const deskY = 0.76;

  // Server rack location (left back).
  const rackX = ox - 1.55;
  const rackZ = oz - 1.6;

  // Crate stack location (right back).
  const crateX = ox + 1.55;
  const crateZ = oz - 1.55;

  // Furniture colliders (player-only). PR1.7: station colliders now
  // computed from STATIONS length + STATION_SPAN with z-stagger; hx
  // widened 0.4 → 0.45 to cover the wider monitor bezel (F1).
  useEffect(() => {
    const stationItems = STATIONS.map((_, i) => ({
      id: `pr-station-${i}`,
      x: stationX(i, ox),
      z: oz + 1.55 + stationDz(i, STATIONS.length),
      hx: 0.45,
      hz: 0.3,
    }));
    const items = [
      { id: 'pr-desk',  x: deskX,  z: deskZ,  hx: 0.85, hz: 0.45 },
      { id: 'pr-rack',  x: rackX,  z: rackZ,  hx: 0.4,  hz: 0.4  },
      { id: 'pr-crate', x: crateX, z: crateZ, hx: 0.45, hz: 0.45 },
      // PR1.8: hero focal pedestal — playerOnly so avatar bounces
      // off the glass case but camera wall-clip ignores it.
      // registerCollider invocation is shared with siblings below.
      { id: 'pr-hero',  x: ox,     z: oz + 2.05, hx: 0.30, hz: 0.30 },
      ...stationItems,
    ];
    for (const it of items) registerCollider({ ...it, playerOnly: true });
    return () => { for (const it of items) unregisterCollider(it.id); };
  }, [deskX, deskZ, rackX, rackZ, crateX, crateZ, ox, oz]);

  return (
    <group>
      {/* ----- FLOOR STAGE — base slab + 8 planks ----- */}
      <mesh position={[ox, 0.18, oz]}>
        <boxGeometry args={[ROOM, 0.02, ROOM]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const px = ox + (i - 3.5) * 0.6;
        const tint = PLANK_TIERS[i % 3];
        return (
          <mesh key={`plank-${i}`} position={[px, 0.225, oz]}>
            <boxGeometry args={[0.58, 0.04, ROOM - 0.04]} />
            <meshPhongMaterial color={tint} flatShading />
            <Edges color={edgeColor} lineWidth={1} />
          </mesh>
        );
      })}
      {/* Entry rug at door (-z side) */}
      <mesh position={[ox, 0.255, oz - 1.6]}>
        <boxGeometry args={[2.0, 0.005, 1.2]} />
        <meshPhongMaterial color={SLATE_LIGHT} flatShading />
      </mesh>
      <mesh position={[ox, 0.26, oz - 1.6 - 0.58]}>
        <boxGeometry args={[1.92, 0.006, 0.04]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
      </mesh>
      <mesh position={[ox, 0.26, oz - 1.6 + 0.58]}>
        <boxGeometry args={[1.92, 0.006, 0.04]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
      </mesh>
      <mesh position={[ox - 0.98, 0.26, oz - 1.6]}>
        <boxGeometry args={[0.04, 0.006, 1.12]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
      </mesh>
      <mesh position={[ox + 0.98, 0.26, oz - 1.6]}>
        <boxGeometry args={[0.04, 0.006, 1.12]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
      </mesh>

      {/* ----- BASEBOARDS ----- */}
      <mesh position={[ox, 0.25, oz - 2.45]}>
        <boxGeometry args={[ROOM, 0.12, 0.05]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[ox, 0.25, oz + 2.45]}>
        <boxGeometry args={[ROOM, 0.12, 0.05]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[ox - 2.45, 0.25, oz]}>
        <boxGeometry args={[0.05, 0.12, ROOM - 0.10]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[ox + 2.45, 0.25, oz]}>
        <boxGeometry args={[0.05, 0.12, ROOM - 0.10]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>

      {/* ----- TOP TRIM / COVE ----- */}
      <mesh position={[ox, 2.85, oz - 2.45]}>
        <boxGeometry args={[ROOM, 0.12, 0.05]} />
        <meshPhongMaterial color={METAL} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[ox, 2.85, oz + 2.45]}>
        <boxGeometry args={[ROOM, 0.12, 0.05]} />
        <meshPhongMaterial color={METAL} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[ox - 2.45, 2.85, oz]}>
        <boxGeometry args={[0.05, 0.12, ROOM - 0.10]} />
        <meshPhongMaterial color={METAL} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[ox + 2.45, 2.85, oz]}>
        <boxGeometry args={[0.05, 0.12, ROOM - 0.10]} />
        <meshPhongMaterial color={METAL} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>

      {/* ----- CEILING RECESSED LIGHT COVE PANEL ----- */}
      <mesh position={[ox, 2.92, oz]}>
        <boxGeometry args={[3.0, 0.04, 3.0]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const cell = 0.86;
        const step = 0.92;
        const cx = ox + (col - 1) * step;
        const cz = oz + (row - 1) * step;
        return (
          <mesh key={`coffer-${i}`} position={[cx, 2.88, cz]}>
            <boxGeometry args={[cell, 0.02, cell]} />
            <meshPhongMaterial color={WHITE_COOL} emissive={WHITE_COOL} emissiveIntensity={0.4} flatShading />
          </mesh>
        );
      })}

      {/* ----- DESK (top + trim + tapered legs) -----
          PR1.7 (D6): legacy ScreenStand dual monitors removed; their
          PROBLEM_SOLVER + MENTOR_TABLE dialogues now live on the unified
          station row (stations 0 & 1). Desk stays as a workstation prop
          but no longer carries interactables. */}
      <mesh position={[deskX, deskY, deskZ]}>
        <boxGeometry args={[2.2, 0.08, 0.95]} />
        <meshPhongMaterial color={SLATE_MID} flatShading />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      <mesh position={[deskX, deskY - 0.06, deskZ]}>
        <boxGeometry args={[2.18, 0.03, 0.93]} />
        <meshPhongMaterial color={SLATE_LIGHT} flatShading />
      </mesh>
      {DESK_LEGS.map(([dx, dz], i) => (
        <mesh key={`leg-top-${i}`} position={[deskX + dx, deskY - 0.25, deskZ + dz]}>
          <boxGeometry args={[0.08, 0.42, 0.08]} />
          <meshPhongMaterial color={METAL} flatShading />
        </mesh>
      ))}
      {DESK_LEGS.map(([dx, dz], i) => (
        <mesh key={`leg-bot-${i}`} position={[deskX + dx, deskY - 0.6, deskZ + dz]}>
          <boxGeometry args={[0.06, 0.28, 0.06]} />
          <meshPhongMaterial color={METAL_LIGHT} flatShading />
        </mesh>
      ))}
      <mesh position={[deskX, deskY - 0.15, deskZ - 0.3]}>
        <boxGeometry args={[1.8, 0.04, 0.12]} />
        <meshPhongMaterial color={CABLE_BLACK} flatShading />
      </mesh>

      {/* ----- KEYBOARD + MOUSE + MOUSEPAD ON DESK ----- */}
      <mesh position={[deskX, deskY + 0.055, deskZ + 0.15]}>
        <boxGeometry args={[0.85, 0.03, 0.26]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[deskX, deskY + 0.075, deskZ + 0.08]}>
        <boxGeometry args={[0.8, 0.01, 0.06]} />
        <meshPhongMaterial color={CABLE_BLACK} flatShading />
      </mesh>
      <mesh position={[deskX, deskY + 0.075, deskZ + 0.16]}>
        <boxGeometry args={[0.8, 0.01, 0.06]} />
        <meshPhongMaterial color={CABLE_BLACK} flatShading />
      </mesh>
      <mesh position={[deskX, deskY + 0.075, deskZ + 0.24]}>
        <boxGeometry args={[0.65, 0.01, 0.06]} />
        <meshPhongMaterial color={CABLE_BLACK} flatShading />
      </mesh>
      <mesh position={[deskX + 0.6, deskY + 0.045, deskZ + 0.2]}>
        <boxGeometry args={[0.32, 0.01, 0.24]} />
        <meshPhongMaterial color={SLATE_LIGHT} flatShading />
      </mesh>
      <mesh position={[deskX + 0.6, deskY + 0.07, deskZ + 0.2]}>
        <boxGeometry args={[0.08, 0.04, 0.12]} />
        <meshPhongMaterial color={WHITE_COOL} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>

      {/* ----- LAPTOP (closed) ----- */}
      <mesh position={[deskX - 0.75, deskY + 0.06, deskZ + 0.05]} rotation={[0, 0.1, 0]}>
        <boxGeometry args={[0.42, 0.03, 0.3]} />
        <meshPhongMaterial color="#0f172a" flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[deskX - 0.75, deskY + 0.076, deskZ + 0.05]}>
        <boxGeometry args={[0.06, 0.002, 0.06]} />
        <meshPhongMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.5} flatShading />
      </mesh>

      {/* ----- COFFEE MUG ----- */}
      <mesh position={[deskX + 0.9, deskY + 0.125, deskZ - 0.15]}>
        <cylinderGeometry args={[0.07, 0.065, 0.17, 10]} />
        <meshPhongMaterial color={WHITE_COOL} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[deskX + 0.9, deskY + 0.205, deskZ - 0.15]}>
        <cylinderGeometry args={[0.06, 0.06, 0.01, 10]} />
        <meshPhongMaterial color="#5a3a1a" flatShading />
      </mesh>

      {/* ----- HEADPHONES (boxy) ----- */}
      <mesh position={[deskX - 0.9, deskY + 0.135, deskZ - 0.2]}>
        <boxGeometry args={[0.04, 0.16, 0.18]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
      </mesh>
      <mesh position={[deskX - 0.78, deskY + 0.2, deskZ - 0.2]}>
        <boxGeometry args={[0.22, 0.02, 0.04]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
      </mesh>
      <mesh position={[deskX - 0.66, deskY + 0.135, deskZ - 0.2]}>
        <boxGeometry args={[0.04, 0.16, 0.18]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
      </mesh>

      {/* ----- STICKY NOTES ----- */}
      <mesh position={[deskX - 0.3, deskY + 0.051, deskZ - 0.3]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.005, 0.1]} />
        <meshPhongMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.3} flatShading />
      </mesh>
      <mesh position={[deskX - 0.18, deskY + 0.053, deskZ - 0.28]} rotation={[0, -0.15, 0]}>
        <boxGeometry args={[0.09, 0.005, 0.09]} />
        <meshPhongMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.3} flatShading />
      </mesh>
      <mesh position={[deskX - 0.08, deskY + 0.052, deskZ - 0.31]}>
        <boxGeometry args={[0.09, 0.005, 0.09]} />
        <meshPhongMaterial color="#fb7185" emissive="#fb7185" emissiveIntensity={0.3} flatShading />
      </mesh>

      {/* ----- USB DRIVES ----- */}
      <mesh position={[deskX + 0.35, deskY + 0.07, deskZ - 0.32]}>
        <boxGeometry args={[0.04, 0.04, 0.1]} />
        <meshPhongMaterial color={METAL_LIGHT} flatShading />
      </mesh>
      <mesh position={[deskX + 0.43, deskY + 0.07, deskZ - 0.32]}>
        <boxGeometry args={[0.04, 0.04, 0.1]} />
        <meshPhongMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.5} flatShading />
      </mesh>

      {/* ----- RUBBER DUCK (debug buddy) ----- */}
      <mesh position={[deskX + 0.15, deskY + 0.09, deskZ - 0.32]}>
        <boxGeometry args={[0.09, 0.08, 0.12]} />
        <meshPhongMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.3} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[deskX + 0.15, deskY + 0.15, deskZ - 0.34]}>
        <boxGeometry args={[0.07, 0.06, 0.08]} />
        <meshPhongMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.3} flatShading />
      </mesh>
      <mesh position={[deskX + 0.19, deskY + 0.15, deskZ - 0.39]}>
        <boxGeometry args={[0.04, 0.02, 0.03]} />
        <meshPhongMaterial color="#f97316" flatShading />
      </mesh>

      {/* ----- SERVER RACK (hero) ----- */}
      <mesh position={[rackX, 0.8, rackZ]}>
        <boxGeometry args={[0.8, 1.5, 0.6]} />
        <meshPhongMaterial color={RACK_BLACK} flatShading />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      <mesh position={[rackX, 0.8, rackZ + 0.305]}>
        <boxGeometry args={[0.7, 1.4, 0.02]} />
        <meshPhongMaterial color="#1a1f28" flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[rackX, 1.56, rackZ]}>
        <boxGeometry args={[0.78, 0.04, 0.58]} />
        <meshPhongMaterial color={METAL} flatShading />
      </mesh>
      {[0.2, 0.55, 0.9, 1.25].map((y, i) => (
        <mesh key={`slot-${i}`} position={[rackX, y, rackZ + 0.31]}>
          <boxGeometry args={[0.66, 0.24, 0.02]} />
          <meshPhongMaterial color={i % 2 === 0 ? '#242a34' : '#1b1f27'} flatShading />
          <Edges color={edgeColor} lineWidth={1} />
        </mesh>
      ))}
      {RACK_LEDS.map(([dy, dx, color], i) => (
        <mesh
          key={`led-${i}`}
          ref={(el) => {
            rackLedRefs.current[i] = el;
          }}
          position={[rackX + 0.26 + dx, 1.36 + dy, rackZ + 0.325]}
        >
          <boxGeometry args={[0.03, 0.03, 0.012]} />
          <meshPhongMaterial color={color} emissive={color} emissiveIntensity={2.5} flatShading />
        </mesh>
      ))}
      <mesh position={[rackX + 0.41, 0.7, rackZ]}>
        <boxGeometry args={[0.02, 0.28, 0.28]} />
        <meshPhongMaterial color="#14181f" flatShading />
      </mesh>
      <mesh ref={fanRef} position={[rackX + 0.422, 0.7, rackZ]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.22, 0.04, 0.04]} />
        <meshPhongMaterial color={METAL} flatShading />
      </mesh>
      <mesh position={[rackX + 0.35, 0.18, rackZ + 0.35]}>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 10]} />
        <meshPhongMaterial color={CABLE_BLACK} flatShading />
      </mesh>
      <mesh position={[rackX + 0.35, 0.23, rackZ + 0.35]}>
        <cylinderGeometry args={[0.07, 0.07, 0.04, 10]} />
        <meshPhongMaterial color={CABLE_BLACK} flatShading />
      </mesh>

      {/* ----- SHIPPING CRATES (stacked) ----- */}
      <mesh position={[crateX, 0.33, crateZ]}>
        <boxGeometry args={[0.72, 0.48, 0.6]} />
        <meshPhongMaterial color="#6b5a42" flatShading />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      <mesh position={[crateX, 0.58, crateZ]}>
        <boxGeometry args={[0.73, 0.04, 0.61]} />
        <meshPhongMaterial color="#8a7354" flatShading />
      </mesh>
      <mesh position={[crateX - 0.1, 0.92, crateZ - 0.05]} rotation={[0, 0.15, 0]}>
        <boxGeometry args={[0.56, 0.4, 0.5]} />
        <meshPhongMaterial color="#7a6746" flatShading />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      <mesh position={[crateX, 0.4, crateZ + 0.305]}>
        <boxGeometry args={[0.22, 0.12, 0.01]} />
        <meshPhongMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.7} flatShading />
      </mesh>

      {/* ----- PRODUCT CUBES ON DESK ----- */}
      {PRODUCT_COLORS.map((c, i) => (
        <mesh
          key={c}
          position={[deskX - 0.5 + i * 0.5, deskY + 0.13, deskZ - 0.05]}
          rotation={[0, (Math.PI / 6) * i, 0]}
        >
          <boxGeometry args={[0.18, 0.18, 0.18]} />
          <meshPhongMaterial color={c} emissive={c} emissiveIntensity={0.5} flatShading />
          <Edges color={edgeColor} lineWidth={1} />
        </mesh>
      ))}

      {/* ----- PROJECT STATIONS — unified row of 6 along back wall (+z).
          PR1.7 (D1/D2/D3/D4/D5/D6, F1/F2/F3/F4):
            - 6 stations: 2 dialogue-rich (PROBLEM_SOLVER, MENTOR_TABLE)
              + 4 PROJECT_SHOWCASE_ENTRIES — replaces legacy desk monitors.
            - x positions computed from N/STATION_SPAN (scales with N).
            - z stagger ±0.15 m (shallow V opening toward door).
            - Per-station silhouette via STATION_VARIANTS (plinth h/w,
              monitor w/h, top material, optional stacked screen).
            - Cool-palette accent override (mint / lavender) for warm
              data accents.
            - Readable label via drei <Html transform> (D2).
            - Foot kick raised above plank top; collider hx widened. ----- */}
      {STATIONS.map((s, i) => {
        const v = STATION_VARIANTS[i] ?? STATION_VARIANTS[0];
        const sx = stationX(i, ox);
        const sz = oz + 1.55 + stationDz(i, STATIONS.length);
        const interactable: InteractableData = {
          title: s.title,
          body: s.body,
          ...(s.link ? { link: s.link } : {}),
        };
        // Plank top is at y=0.245; foot kick spans 0.25–0.30 (clear).
        const footY = 0.275;
        // Plinth body sits on top of foot kick (y=0.30).
        const plinthBaseY = 0.30;
        const plinthCenterY = plinthBaseY + v.plinthH / 2;
        const trimY = plinthBaseY + v.plinthH + 0.02;
        const monitorY = plinthBaseY + v.plinthH + 0.40;
        const topColor =
          v.top === 'wood' ? WOOD_WARM :
          v.top === 'metal' ? METAL_LIGHT :
          SLATE_LIGHT;

        return (
          <group key={s.id}>
            {/* Foot kick — y=0.275 (5mm above plank top 0.245), F4 fix */}
            <mesh position={[sx, footY, sz]}>
              <boxGeometry args={[v.plinthW + 0.04, 0.05, 0.59]} />
              <meshPhongMaterial color={SLATE_DEEP} flatShading />
            </mesh>
            {/* Plinth body — varies in height + width per variant (D1) */}
            <mesh position={[sx, plinthCenterY, sz]}>
              <boxGeometry args={[v.plinthW, v.plinthH, 0.55]} />
              <meshPhongMaterial color={SLATE_MID} flatShading />
              <Edges color={edgeColor} lineWidth={1.2} />
            </mesh>
            {/* Top trim band — material varies (slate / wood / metal, D1) */}
            <mesh position={[sx, trimY, sz]}>
              <boxGeometry args={[v.plinthW + 0.02, 0.04, 0.57]} />
              <meshPhongMaterial color={topColor} flatShading />
              <Edges color={edgeColor} lineWidth={1} />
            </mesh>
            {/* Monitor neck */}
            <mesh position={[sx, monitorY - v.monitorH / 2 - 0.12, sz + 0.02]}>
              <boxGeometry args={[0.08, 0.18, 0.08]} />
              <meshPhongMaterial color={METAL} flatShading />
            </mesh>
            {/* Monitor bezel — faces -z */}
            <mesh position={[sx, monitorY, sz]}>
              <boxGeometry args={[v.monitorW, v.monitorH, 0.06]} />
              <meshPhongMaterial color={SLATE_DEEP} flatShading />
              <Edges color={edgeColor} lineWidth={1.2} />
            </mesh>
            {/* Screen face — interactable. F3: pushed 4cm in front of bezel
                front (bezel front at sz-0.03; screen at sz-0.07). */}
            <mesh
              position={[sx, monitorY, sz - 0.07]}
              onUpdate={(m) => {
                m.userData.interactable = interactable;
              }}
            >
              <boxGeometry args={[v.monitorW - 0.11, v.monitorH - 0.11, 0.02]} />
              <meshPhongMaterial
                color="#0a1830"
                emissive={s.accent}
                emissiveIntensity={1.6}
                flatShading
              />
              <Edges color={edgeColor} lineWidth={1} />
            </mesh>
            {/* Optional stacked secondary screen (variant 3 only) */}
            {v.stacked && (
              <mesh position={[sx, monitorY + v.monitorH / 2 + 0.20, sz - 0.07]}>
                <boxGeometry args={[v.monitorW - 0.30, 0.22, 0.02]} />
                <meshPhongMaterial
                  color="#0a1830"
                  emissive={s.accent}
                  emissiveIntensity={1.4}
                  flatShading
                />
                <Edges color={edgeColor} lineWidth={1} />
              </mesh>
            )}
            {/* Readable project label — drei <Html transform> (D2).
                Faces -z (toward door). pointer-events: none. Sized to
                read from ~3m. */}
            <Html
              transform
              position={[sx, monitorY - v.monitorH / 2 - 0.18, sz - 0.08]}
              rotation={[0, Math.PI, 0]}
              distanceFactor={1}
              pointerEvents="none"
              zIndexRange={[10, 0]}
            >
              <div
                style={{
                  color: WHITE_COOL,
                  background: 'rgba(15, 23, 42, 0.88)',
                  border: `1px solid ${s.accent}`,
                  padding: '4px 14px',
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '34px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  borderRadius: '4px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                }}
              >
                {s.title}
              </div>
            </Html>

            {/* Cable coil under EVERY plinth (lived-in mess, D5). Slight
                size variation by index. */}
            <mesh position={[sx - 0.28, 0.265, sz + 0.18]}>
              <cylinderGeometry args={[0.05 + (i % 3) * 0.008, 0.05, 0.04, 10]} />
              <meshPhongMaterial color={CABLE_BLACK} flatShading />
            </mesh>

            {/* Lived-in props (D5) — sprinkled on selected stations */}
            {i === 1 && (
              // knocked-over mug coaster (flat disc, slightly rotated)
              <mesh
                position={[sx - 0.18, plinthBaseY + v.plinthH + 0.045, sz + 0.05]}
                rotation={[0, 0.3, 0]}
              >
                <cylinderGeometry args={[0.06, 0.06, 0.005, 12]} />
                <meshPhongMaterial color={SLATE_DEEP} flatShading />
              </mesh>
            )}
            {i === 3 && (
              // pen on plinth edge
              <mesh
                position={[sx + 0.20, plinthBaseY + v.plinthH + 0.045, sz - 0.18]}
                rotation={[0, 0.4, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.008, 0.008, 0.13, 8]} />
                <meshPhongMaterial color={CYAN_DIM} flatShading />
              </mesh>
            )}
            {i === 4 && (
              // folded paper (slightly rotated)
              <mesh
                position={[sx + 0.18, plinthBaseY + v.plinthH + 0.045, sz + 0.04]}
                rotation={[0.06, -0.2, 0]}
              >
                <boxGeometry args={[0.12, 0.005, 0.16]} />
                <meshPhongMaterial color={WHITE_COOL} flatShading />
                <Edges color={edgeColor} lineWidth={1} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* ----- PR1.8 HERO FOCAL — glass display case w/ rotating logo cube -----
          Anchors the back-wall composition between stations 2 & 3. Pedestal
          + brushed-metal cap + 4 thin transparent glass walls + glass top +
          floating cyan cube. Cube spins on Y only (≤0.5 rad/s), gated on
          prefers-reduced-motion. NO emissiveIntensity / scale changes per
          zero-brightness-motion rule. Collider registered above (pr-hero). */}
      {(() => {
        const hx = ox;
        const hz = oz + 2.05;
        // Pedestal y=0..0.6 ; cap at 0.62 ; glass case body 0.65..1.25
        const caseW = 0.45;
        const caseH = 0.6;
        const caseBaseY = 0.65;
        const caseTopY = caseBaseY + caseH;
        const wallT = 0.015;
        return (
          <group>
            {/* Pedestal block (slate) */}
            <mesh position={[hx, 0.30, hz]}>
              <boxGeometry args={[0.55, 0.6, 0.55]} />
              <meshPhongMaterial color={SLATE_DEEP} flatShading />
              <Edges color={edgeColor} lineWidth={1.2} />
            </mesh>
            {/* Brushed-metal cap */}
            <mesh position={[hx, 0.62, hz]}>
              <boxGeometry args={[0.58, 0.04, 0.58]} />
              <meshPhongMaterial color={METAL_LIGHT} flatShading />
              <Edges color={edgeColor} lineWidth={1} />
            </mesh>
            {/* Glass case — 4 thin transparent side walls + top */}
            {/* front (-z) */}
            <mesh position={[hx, caseBaseY + caseH / 2, hz - caseW / 2]}>
              <boxGeometry args={[caseW, caseH, wallT]} />
              <meshPhongMaterial color={WHITE_COOL} transparent opacity={0.18} flatShading />
              <Edges color={edgeColor} lineWidth={1} />
            </mesh>
            {/* back (+z) */}
            <mesh position={[hx, caseBaseY + caseH / 2, hz + caseW / 2]}>
              <boxGeometry args={[caseW, caseH, wallT]} />
              <meshPhongMaterial color={WHITE_COOL} transparent opacity={0.18} flatShading />
              <Edges color={edgeColor} lineWidth={1} />
            </mesh>
            {/* left (-x) */}
            <mesh position={[hx - caseW / 2, caseBaseY + caseH / 2, hz]}>
              <boxGeometry args={[wallT, caseH, caseW]} />
              <meshPhongMaterial color={WHITE_COOL} transparent opacity={0.18} flatShading />
              <Edges color={edgeColor} lineWidth={1} />
            </mesh>
            {/* right (+x) */}
            <mesh position={[hx + caseW / 2, caseBaseY + caseH / 2, hz]}>
              <boxGeometry args={[wallT, caseH, caseW]} />
              <meshPhongMaterial color={WHITE_COOL} transparent opacity={0.18} flatShading />
              <Edges color={edgeColor} lineWidth={1} />
            </mesh>
            {/* top */}
            <mesh position={[hx, caseTopY, hz]}>
              <boxGeometry args={[caseW + 0.01, wallT, caseW + 0.01]} />
              <meshPhongMaterial color={WHITE_COOL} transparent opacity={0.22} flatShading />
              <Edges color={edgeColor} lineWidth={1} />
            </mesh>
            {/* Logo cube — floats inside, spins on Y only. Static emissive
                (no per-frame brightness). */}
            <mesh
              ref={heroCubeRef}
              position={[hx, caseBaseY + caseH / 2, hz]}
            >
              <boxGeometry args={[0.22, 0.22, 0.22]} />
              <meshPhongMaterial
                color={CYAN}
                emissive={CYAN}
                emissiveIntensity={0.9}
                flatShading
              />
              <Edges color={edgeColor} lineWidth={1.2} />
            </mesh>
          </group>
        );
      })()}

      {/* ----- SHOWCASE WALL SHELF (brushed-metal beneath the cards) ----- */}
      <mesh position={[ox, 2.08, oz - 2.4]}>
        <boxGeometry args={[4.0, 0.04, 0.18]} />
        <meshPhongMaterial color={METAL_LIGHT} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[ox, 2.05, oz - 2.4]}>
        <boxGeometry args={[4.0, 0.02, 0.16]} />
        <meshPhongMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={0.6} flatShading />
      </mesh>

      {/* ----- PR1.9 LAYERED LIGHTING (≤8 point lights) -----
          Key (top-down warm cream) + fill (cool lavender bounce, opposite
          side) + hero accent (cyan on display case) + 5 per-station
          accents. Stations 0 & 1 (both cool cyan/green, adjacent on the
          left) share one mint-cyan accent so total stays at 8. All
          colors live on the cool-tech / cozy palette — no #FFFFFF, no
          per-frame intensity changes. accentLightRef preserved so the
          server-rack cyan accent still has a stable handle for any
          future ref-based work. */}
      {/* 1. Key — top-down warm cream wash, centered on room */}
      <pointLight
        position={[ox, 2.7, oz]}
        color="#ffd9b0"
        intensity={0.8}
        distance={6}
      />
      {/* 2. Fill — soft cool lavender bounce on entry side (opposite key) */}
      <pointLight
        position={[ox, 2.4, oz - 1.6]}
        color="#93c5fd"
        intensity={0.4}
        distance={9}
      />
      {/* 3. Hero accent — cyan on the glass display case + logo cube */}
      <pointLight
        ref={accentLightRef}
        position={[ox, 1.5, oz + 1.7]}
        color={CYAN}
        intensity={0.7}
        distance={5}
      />
      {/* 4. Stations 0+1 shared accent (mint-cyan blend of cyan + green) */}
      <pointLight
        position={[stationX(0, ox) + STATION_STRIDE / 2, 2.0, oz + 1.4]}
        color="#5eead4"
        intensity={0.35}
        distance={3.5}
      />
      {/* 5–8. Per-station accents for stations 2..5 (within 1.5m each) */}
      {[2, 3, 4, 5].map((i) => (
        <pointLight
          key={`station-accent-${i}`}
          position={[stationX(i, ox), 2.0, oz + 1.4]}
          color={STATIONS[i]?.accent ?? CYAN}
          intensity={0.35}
          distance={3.5}
        />
      ))}
    </group>
  );
}
