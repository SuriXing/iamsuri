import { useEffect, useRef } from 'react';
import { registerCollider, unregisterCollider } from '../colliders';
import { Edges } from '@react-three/drei';
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

// Desk leg positions (tapered via two stacked chunks).
const DESK_LEGS: ReadonlyArray<readonly [number, number]> = [
  [-0.9, -0.35],
  [0.9, -0.35],
  [-0.9, 0.35],
  [0.9, 0.35],
];

// ---- Micro-anim constants (module-scope = zero per-frame alloc) ----
// Zero-brightness-motion pass: power LED + rack LED + accent light
// pulse animations all removed. Only physical motion (fan rotation +
// scanline position bob) remains.
const FAN_SPEED = 6.0;
const SCANLINE_BASE_Y = 1.88;
const SCANLINE_AMPLITUDE = 0.22;
const SCANLINE_SPEED = 2.3;
const ACCENT_LIGHT_BASE = 0.7;

// PR1.4: 3 explicit slate plank tiers (BookRoom-style discrete pattern)
// replacing the ±6% RNG jitter that collapsed all planks to one perceptual
// value. Tones span ~30% lightness so OUT-5 ≥3-tier check passes.
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

interface ScreenStandProps {
  x: number;
  oz: number;
  interactable: InteractableData;
  liveDotRef: React.RefObject<Mesh | null>;
  barRef: React.RefObject<Mesh | null>;
  edgeColor: string;
}

function ScreenStand({ x, oz, interactable, liveDotRef, barRef, edgeColor }: ScreenStandProps) {
  return (
    <group>
      {/* Stand post */}
      <mesh position={[x, 1.0, oz - 0.42]}>
        <boxGeometry args={[0.12, 0.6, 0.12]} />
        <meshPhongMaterial color={METAL} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      {/* Base plate */}
      <mesh position={[x, 0.73, oz - 0.42]}>
        <boxGeometry args={[0.38, 0.05, 0.26]} />
        <meshPhongMaterial color={METAL_LIGHT} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      {/* Monitor bezel */}
      <mesh position={[x, 1.55, oz - 0.42]}>
        <boxGeometry args={[1.1, 0.76, 0.08]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      {/* Screen (interactable) */}
      <mesh
        position={[x, 1.55, oz - 0.37]}
        onUpdate={(m) => {
          m.userData.interactable = interactable;
        }}
      >
        <boxGeometry args={[0.96, 0.62, 0.02]} />
        <meshPhongMaterial color="#0a1830" emissive={CYAN} emissiveIntensity={1.8} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      {/* Under-bezel brand bar */}
      <mesh position={[x, 1.14, oz - 0.37]}>
        <boxGeometry args={[0.6, 0.03, 0.01]} />
        <meshPhongMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={0.8} flatShading />
      </mesh>
      {/* Scanline bar — vertical sweep via useFrame */}
      <mesh ref={barRef} position={[x, SCANLINE_BASE_Y, oz - 0.36]}>
        <boxGeometry args={[0.9, 0.02, 0.01]} />
        <meshPhongMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2.2} flatShading />
      </mesh>
      {/* Power LED — blinks via ref */}
      <mesh ref={liveDotRef} position={[x + 0.46, 1.88, oz - 0.36]}>
        <boxGeometry args={[0.05, 0.05, 0.02]} />
        <meshPhongMaterial color={CYAN} emissive={CYAN} emissiveIntensity={4.0} flatShading />
      </mesh>
    </group>
  );
}

export function ProductRoom() {
  const { center } = ROOM_BY_ID.product;
  const ox = center.x;
  const oz = center.z;

  const theme = useWorldStore((s) => s.theme);
  const edgeColor = theme === 'dark' ? '#0a0a14' : '#5a4830';

  // All refs — declared in stable order, top of component.
  const dot1Ref = useRef<Mesh>(null);
  const dot2Ref = useRef<Mesh>(null);
  const bar1Ref = useRef<Mesh>(null);
  const bar2Ref = useRef<Mesh>(null);
  const fanRef = useRef<Mesh>(null);
  const rackLedRefs = useRef<Array<Mesh | null>>([]);
  const accentLightRef = useRef<PointLight>(null);

  useFrame(({ clock }) => {
    const vm = useWorldStore.getState().viewMode;
    if (vm !== 'overview' && vm !== 'product') return;
    const t = clock.getElapsedTime();
    // intensity mutations all removed. Only physical motion remains
    // (fan rotation + scanline position bob).
    const fan = fanRef.current;
    if (fan) fan.rotation.z = t * FAN_SPEED;
    const b1 = bar1Ref.current;
    if (b1) b1.position.y = SCANLINE_BASE_Y + Math.sin(t * SCANLINE_SPEED) * SCANLINE_AMPLITUDE;
    const b2 = bar2Ref.current;
    if (b2) b2.position.y = SCANLINE_BASE_Y + Math.sin(t * SCANLINE_SPEED + 1.3) * SCANLINE_AMPLITUDE;
  });

  const leftX = ox - 0.95;
  const rightX = ox + 0.95;

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

  // Furniture colliders (player-only).
  useEffect(() => {
    const items = [
      { id: 'pr-desk',  x: deskX,  z: deskZ,  hx: 0.85, hz: 0.45 },
      { id: 'pr-rack',  x: rackX,  z: rackZ,  hx: 0.4,  hz: 0.4  },
      { id: 'pr-crate', x: crateX, z: crateZ, hx: 0.45, hz: 0.45 },
      // PR1.5: 4 station plinths on back wall (+z side) at oz+1.55.
      { id: 'pr-station-0', x: ox - 1.65, z: oz + 1.55, hx: 0.4, hz: 0.3 },
      { id: 'pr-station-1', x: ox - 0.55, z: oz + 1.55, hx: 0.4, hz: 0.3 },
      { id: 'pr-station-2', x: ox + 0.55, z: oz + 1.55, hx: 0.4, hz: 0.3 },
      { id: 'pr-station-3', x: ox + 1.65, z: oz + 1.55, hx: 0.4, hz: 0.3 },
    ] as const;
    for (const it of items) registerCollider({ ...it, playerOnly: true });
    return () => { for (const it of items) unregisterCollider(it.id); };
  }, [deskX, deskZ, rackX, rackZ, crateX, crateZ, ox, oz]);

  return (
    <group>
      {/* ----- FLOOR STAGE — base slab (kept as backing) + 8 planks ----- */}
      <mesh position={[ox, 0.18, oz]}>
        <boxGeometry args={[ROOM, 0.02, ROOM]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
      </mesh>
      {/* 8 planks running along z-axis (player-facing direction).
          PR1.4: y bumped 0.215 → 0.225 (10mm above base slab top at 0.19,
          clears precision noise) and tints now use 3 explicit slate
          constants (PLANK_TIERS) instead of ±6% RNG jitter. */}
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
      {/* Rug border — PR1.4: was cyan emissive (read as LED strip).
          Now non-emissive deep slate textile trim — woven border feel. */}
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

      {/* ----- BASEBOARDS — all 4 walls, inside face at y=0.25.
          PR1.4: side pieces shortened to ROOM-0.10 so the front/back
          full-length pieces own the corners (no co-planar overlap). ----- */}
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

      {/* ----- TOP TRIM / COVE — all 4 walls at y=2.85, METAL.
          PR1.4: same corner cleanup as baseboards above. ----- */}
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
      {/* PR1.4: subdivided 3x3 coffer grid (was a single 2.9x2.9 emissive
          panel that read as office fluorescent). Each small panel sits in
          a slate frame so the ceiling reads as architectural coffer. Top
          face of each inner panel at 2.89 — 1cm clear of outer cove
          bottom (2.90). */}
      {Array.from({ length: 9 }, (_, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        // 3x3 grid spans 2.7m with 0.06m gaps between panels (slate frame
        // showing through from the outer dark panel above).
        const cell = 0.86; // panel size
        const step = 0.92; // center-to-center
        const cx = ox + (col - 1) * step;
        const cz = oz + (row - 1) * step;
        return (
          <mesh key={`coffer-${i}`} position={[cx, 2.88, cz]}>
            <boxGeometry args={[cell, 0.02, cell]} />
            <meshPhongMaterial color={WHITE_COOL} emissive={WHITE_COOL} emissiveIntensity={0.4} flatShading />
          </mesh>
        );
      })}

      {/* ----- DESK (top + trim + tapered legs) ----- */}
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
      {/* Cable tray under desk */}
      <mesh position={[deskX, deskY - 0.15, deskZ - 0.3]}>
        <boxGeometry args={[1.8, 0.04, 0.12]} />
        <meshPhongMaterial color={CABLE_BLACK} flatShading />
      </mesh>

      {/* ----- DUAL MONITORS ----- */}
      <ScreenStand
        x={leftX}
        oz={oz}
        interactable={PROBLEM_SOLVER}
        liveDotRef={dot1Ref}
        barRef={bar1Ref}
        edgeColor={edgeColor}
      />
      <ScreenStand
        x={rightX}
        oz={oz}
        interactable={MENTOR_TABLE}
        liveDotRef={dot2Ref}
        barRef={bar2Ref}
        edgeColor={edgeColor}
      />

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
      {/* Horizontal server slots */}
      {[0.2, 0.55, 0.9, 1.25].map((y, i) => (
        <mesh key={`slot-${i}`} position={[rackX, y, rackZ + 0.31]}>
          <boxGeometry args={[0.66, 0.24, 0.02]} />
          <meshPhongMaterial color={i % 2 === 0 ? '#242a34' : '#1b1f27'} flatShading />
          <Edges color={edgeColor} lineWidth={1} />
        </mesh>
      ))}
      {/* Rack LEDs — blink via refs */}
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
      {/* Fan — side vent with spinning blade */}
      <mesh position={[rackX + 0.41, 0.7, rackZ]}>
        <boxGeometry args={[0.02, 0.28, 0.28]} />
        <meshPhongMaterial color="#14181f" flatShading />
      </mesh>
      <mesh ref={fanRef} position={[rackX + 0.422, 0.7, rackZ]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.22, 0.04, 0.04]} />
        <meshPhongMaterial color={METAL} flatShading />
      </mesh>
      {/* Cable coil on floor beside rack */}
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
      {/* Crate label (cyan sticker) */}
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

      {/* ----- PROJECT STATIONS — 4 distinct stations along back wall (+z).
          PR1.5: replaces the flat back-wall card grid. Each station =
          plinth + monitor (faces -z toward door) + label sign + accent bar
          + 1 unique decorative prop (mug / sticky stack / trophy / books).
          Plinth colliders registered playerOnly above. ----- */}
      {(() => {
        const stationZ = oz + 1.55;
        // x positions match design-note: ox-1.65, -0.55, +0.55, +1.65.
        const stationX = [-1.65, -0.55, 0.55, 1.65];
        return PROJECT_SHOWCASE_ENTRIES.map((entry, i) => {
          const sx = ox + stationX[i];
          const interactable: InteractableData = {
            title: entry.title,
            body: entry.pitch,
            ...(entry.link ? { link: entry.link } : {}),
          };
          // Monitor faces -z (toward player on entry). Screen face is on
          // the -z side of the bezel: stationZ - 0.04.
          return (
            <group key={`station-${entry.id}`}>
              {/* Plinth base (slate, BookRoom-style two-tier) */}
              <mesh position={[sx, 0.625, stationZ]}>
                <boxGeometry args={[0.7, 0.85, 0.55]} />
                <meshPhongMaterial color={SLATE_MID} flatShading />
                <Edges color={edgeColor} lineWidth={1.2} />
              </mesh>
              {/* Plinth top trim band */}
              <mesh position={[sx, 1.06, stationZ]}>
                <boxGeometry args={[0.72, 0.04, 0.57]} />
                <meshPhongMaterial color={SLATE_LIGHT} flatShading />
                <Edges color={edgeColor} lineWidth={1} />
              </mesh>
              {/* Plinth foot kick */}
              <mesh position={[sx, 0.225, stationZ]}>
                <boxGeometry args={[0.74, 0.05, 0.59]} />
                <meshPhongMaterial color={SLATE_DEEP} flatShading />
              </mesh>
              {/* Monitor bezel — faces -z */}
              <mesh position={[sx, 1.45, stationZ]}>
                <boxGeometry args={[0.85, 0.55, 0.06]} />
                <meshPhongMaterial color={SLATE_DEEP} flatShading />
                <Edges color={edgeColor} lineWidth={1.2} />
              </mesh>
              {/* Screen face (interactable, emissive) — slightly forward on -z */}
              <mesh
                position={[sx, 1.45, stationZ - 0.04]}
                onUpdate={(m) => {
                  m.userData.interactable = interactable;
                }}
              >
                <boxGeometry args={[0.74, 0.44, 0.02]} />
                <meshPhongMaterial
                  color="#0a1830"
                  emissive={entry.accent}
                  emissiveIntensity={1.6}
                  flatShading
                />
                <Edges color={edgeColor} lineWidth={1} />
              </mesh>
              {/* Monitor stand neck */}
              <mesh position={[sx, 1.18, stationZ + 0.02]}>
                <boxGeometry args={[0.08, 0.18, 0.08]} />
                <meshPhongMaterial color={METAL} flatShading />
              </mesh>
              {/* Label plate under monitor (faces -z) */}
              <mesh position={[sx, 1.13, stationZ - 0.27]}>
                <boxGeometry args={[0.7, 0.12, 0.02]} />
                <meshPhongMaterial color={SLATE_LIGHT} flatShading />
                <Edges color={edgeColor} lineWidth={1} />
              </mesh>
              {/* Accent brand bar on label (per-station color) */}
              <mesh position={[sx, 1.08, stationZ - 0.281]}>
                <boxGeometry args={[0.6, 0.025, 0.005]} />
                <meshPhongMaterial
                  color={entry.accent}
                  emissive={entry.accent}
                  emissiveIntensity={1.2}
                  flatShading
                />
              </mesh>
              {/* Title block on label (small dark ticks suggesting text) */}
              {[-0.18, -0.06, 0.06, 0.18].map((dx, k) => (
                <mesh
                  key={`title-tick-${k}`}
                  position={[sx + dx, 1.155, stationZ - 0.281]}
                >
                  <boxGeometry args={[0.08, 0.02, 0.005]} />
                  <meshPhongMaterial color={SLATE_DEEP} flatShading />
                </mesh>
              ))}
              {/* Per-station accent strip on plinth front (visual accent
                  light proxy — cheap glow without a real point light) */}
              <mesh position={[sx, 0.45, stationZ - 0.281]}>
                <boxGeometry args={[0.5, 0.025, 0.005]} />
                <meshPhongMaterial
                  color={entry.accent}
                  emissive={entry.accent}
                  emissiveIntensity={1.4}
                  flatShading
                />
              </mesh>

              {/* ----- Per-station decorative prop (varies by index) ----- */}
              {i === 0 && (
                <>
                  {/* Coffee mug — white ceramic + brown coffee surface */}
                  <mesh position={[sx + 0.22, 1.16, stationZ + 0.05]}>
                    <cylinderGeometry args={[0.06, 0.055, 0.13, 10]} />
                    <meshPhongMaterial color={WHITE_COOL} flatShading />
                    <Edges color={edgeColor} lineWidth={1} />
                  </mesh>
                  <mesh position={[sx + 0.22, 1.225, stationZ + 0.05]}>
                    <cylinderGeometry args={[0.05, 0.05, 0.008, 10]} />
                    <meshPhongMaterial color="#5a3a1a" flatShading />
                  </mesh>
                  {/* Mug handle (boxy) */}
                  <mesh position={[sx + 0.29, 1.16, stationZ + 0.05]}>
                    <boxGeometry args={[0.02, 0.07, 0.015]} />
                    <meshPhongMaterial color={WHITE_COOL} flatShading />
                  </mesh>
                </>
              )}
              {i === 1 && (
                <>
                  {/* Sticky-note stack — 3 colored squares offset */}
                  <mesh
                    position={[sx + 0.2, 1.095, stationZ + 0.04]}
                    rotation={[0, 0.18, 0]}
                  >
                    <boxGeometry args={[0.11, 0.012, 0.11]} />
                    <meshPhongMaterial
                      color="#facc15"
                      emissive="#facc15"
                      emissiveIntensity={0.3}
                      flatShading
                    />
                  </mesh>
                  <mesh
                    position={[sx + 0.21, 1.108, stationZ + 0.06]}
                    rotation={[0, -0.12, 0]}
                  >
                    <boxGeometry args={[0.1, 0.012, 0.1]} />
                    <meshPhongMaterial
                      color={CYAN}
                      emissive={CYAN}
                      emissiveIntensity={0.3}
                      flatShading
                    />
                  </mesh>
                  <mesh
                    position={[sx + 0.19, 1.121, stationZ + 0.05]}
                    rotation={[0, 0.05, 0]}
                  >
                    <boxGeometry args={[0.1, 0.012, 0.1]} />
                    <meshPhongMaterial
                      color="#fb7185"
                      emissive="#fb7185"
                      emissiveIntensity={0.3}
                      flatShading
                    />
                  </mesh>
                </>
              )}
              {i === 2 && (
                <>
                  {/* Mini trophy — gold cup on dark base */}
                  <mesh position={[sx + 0.22, 1.115, stationZ + 0.05]}>
                    <boxGeometry args={[0.1, 0.04, 0.1]} />
                    <meshPhongMaterial color={SLATE_DEEP} flatShading />
                    <Edges color={edgeColor} lineWidth={1} />
                  </mesh>
                  <mesh position={[sx + 0.22, 1.18, stationZ + 0.05]}>
                    <cylinderGeometry args={[0.045, 0.03, 0.09, 10]} />
                    <meshPhongMaterial
                      color="#facc15"
                      emissive="#facc15"
                      emissiveIntensity={0.5}
                      flatShading
                    />
                  </mesh>
                  {/* Trophy handles */}
                  <mesh position={[sx + 0.275, 1.18, stationZ + 0.05]}>
                    <boxGeometry args={[0.012, 0.05, 0.012]} />
                    <meshPhongMaterial color="#facc15" flatShading />
                  </mesh>
                  <mesh position={[sx + 0.165, 1.18, stationZ + 0.05]}>
                    <boxGeometry args={[0.012, 0.05, 0.012]} />
                    <meshPhongMaterial color="#facc15" flatShading />
                  </mesh>
                </>
              )}
              {i === 3 && (
                <>
                  {/* Mini book stack — 3 books in different colors */}
                  <mesh position={[sx + 0.2, 1.115, stationZ + 0.05]}>
                    <boxGeometry args={[0.18, 0.04, 0.13]} />
                    <meshPhongMaterial color="#3b82f6" flatShading />
                    <Edges color={edgeColor} lineWidth={1} />
                  </mesh>
                  <mesh
                    position={[sx + 0.2, 1.155, stationZ + 0.04]}
                    rotation={[0, 0.08, 0]}
                  >
                    <boxGeometry args={[0.17, 0.035, 0.12]} />
                    <meshPhongMaterial color="#16a34a" flatShading />
                    <Edges color={edgeColor} lineWidth={1} />
                  </mesh>
                  <mesh
                    position={[sx + 0.21, 1.19, stationZ + 0.06]}
                    rotation={[0, -0.05, 0]}
                  >
                    <boxGeometry args={[0.16, 0.03, 0.12]} />
                    <meshPhongMaterial color="#fb7185" flatShading />
                    <Edges color={edgeColor} lineWidth={1} />
                  </mesh>
                  {/* Bookmark ribbon */}
                  <mesh position={[sx + 0.27, 1.21, stationZ + 0.06]}>
                    <boxGeometry args={[0.012, 0.005, 0.05]} />
                    <meshPhongMaterial color={CYAN} flatShading />
                  </mesh>
                </>
              )}

              {/* Cable coil tucked behind plinth on left side (varies offset) */}
              {i % 2 === 0 && (
                <mesh position={[sx - 0.28, 0.265, stationZ + 0.18]}>
                  <cylinderGeometry args={[0.05, 0.05, 0.04, 10]} />
                  <meshPhongMaterial color={CABLE_BLACK} flatShading />
                </mesh>
              )}
            </group>
          );
        });
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

      {/* ----- CYAN ACCENT POINT LIGHT near server rack ----- */}
      <pointLight
        ref={accentLightRef}
        color={CYAN}
        intensity={ACCENT_LIGHT_BASE}
        distance={6}
        position={[rackX, 1.4, rackZ + 0.4]}
      />
      {/* Secondary stage light */}
      <pointLight position={[ox, 2.0, oz + 0.5]} color="#60a5fa" intensity={0.35} distance={8} />
    </group>
  );
}
