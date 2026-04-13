import { useEffect, useMemo } from 'react';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';
import { ROOM, GAP, COLORS, DOOR, WALL_POLISH } from '../constants';
import { Door } from './Door';
import type { RoomId } from '../data/rooms';
import { ROOM_BY_ID } from '../data/rooms';
import { registerCollider, unregisterCollider } from './colliders';
import { useWorldStore } from '../store/worldStore';
import { makeRng } from '../util/rand';

const WALL_EMISSIVE = '#6b4e1f';
// Outline colors — match other scene components.
const EDGE_DARK = '#0a0a14';
const EDGE_LIGHT = '#5a4830';

interface DoorSpec {
  x: number;
  z: number;
  id: RoomId;
  color: string;
}

const HALF = ROOM / 2 + GAP;

const HORIZONTAL_DOORS: ReadonlyArray<DoorSpec> = [
  { x: -HALF, z:  GAP + 0.05, id: 'book',    color: '#4ade80' },
  { x:  HALF, z:  GAP + 0.05, id: 'idealab', color: '#fbbf24' },
  { x: -HALF, z: -(GAP + 0.05), id: 'myroom',  color: COLORS.pink },
  { x:  HALF, z: -(GAP + 0.05), id: 'product', color: '#60a5fa' },
];

// Deterministic L jitter + room-accent hue mix + optional hue rotation.
// Called once per segment inside useMemo — never per-frame.
// hDelta is in radians and wraps within 0-1.
function mixTint(
  baseHex: string,
  accentHex: string,
  mix: number,
  lDelta: number,
  hDelta = 0,
): string {
  const base = new THREE.Color(baseHex);
  const accent = new THREE.Color(accentHex);
  // Lerp base toward accent by `mix` (tiny hue shift, preserving brown register).
  base.lerp(accent, mix);
  const hsl = { h: 0, s: 0, l: 0 };
  base.getHSL(hsl);
  hsl.l = Math.max(0, Math.min(1, hsl.l + lDelta));
  hsl.h = ((hsl.h + hDelta / (Math.PI * 2)) % 1 + 1) % 1;
  base.setHSL(hsl.h, hsl.s, hsl.l);
  return `#${base.getHexString()}`;
}

interface WallStripProps {
  id: string;
  x: number;
  z: number;
  w: number;
  d: number;
  tint: string;
  edgeColor: string;
}

const WALL_H = 1.8;
const BASE_H = 0.14;  // taller baseboard (was 0.06) so it reads from distance
const CAP_H = 0.08;   // taller cap (was 0.04) same reason
// "Slightly wider" trim — a hair fatter in every horizontal dimension.
const TRIM_PAD = 0.03;

function WallStrip({ id, x, z, w, d, tint, edgeColor }: WallStripProps) {
  // Register as a collider so PlayerController blocks movement into it.
  useEffect(() => {
    registerCollider({ id, x, z, hx: w / 2, hz: d / 2 });
    return () => unregisterCollider(id);
  }, [id, x, z, w, d]);

  return (
    <group>
      {/* Main wall body */}
      <mesh position={[x, 1.0, z]} castShadow receiveShadow>
        <boxGeometry args={[w, WALL_H, d]} />
        <meshPhongMaterial
          color={tint}
          emissive={WALL_EMISSIVE}
          emissiveIntensity={0.12}
          flatShading
        />
        <Edges color={edgeColor} lineWidth={1.0} />
      </mesh>
      {/* Baseboard — thicker, slightly wider, ~20% darker */}
      <mesh position={[x, BASE_H / 2 + 0.01, z]} receiveShadow>
        <boxGeometry args={[w + TRIM_PAD, BASE_H, d + TRIM_PAD]} />
        <meshPhongMaterial
          color={WALL_POLISH.baseboard}
          emissive={WALL_EMISSIVE}
          emissiveIntensity={0.08}
          flatShading
        />
        <Edges color={edgeColor} lineWidth={1.0} />
      </mesh>
      {/* Top cap (picture rail) — thicker, slightly wider, ~15% lighter */}
      <mesh position={[x, WALL_H + CAP_H / 2 + 0.1, z]}>
        <boxGeometry args={[w + TRIM_PAD, CAP_H, d + TRIM_PAD]} />
        <meshPhongMaterial
          color={WALL_POLISH.topCap}
          emissive={WALL_EMISSIVE}
          emissiveIntensity={0.18}
          flatShading
        />
        <Edges color={edgeColor} lineWidth={1.0} />
      </mesh>
    </group>
  );
}

// ---------- F3.7 Wall props ----------
// Deterministic props along long horizontal wall strips. Pool: sconce,
// picture frame, vine. Only LONG horizontal strips carry props (vertical
// walls are narrow dividers between rooms, too close to the corner to read).
type PropKind = 'sconce' | 'picture' | 'vine';

interface WallPropProps {
  kind: PropKind;
  x: number;
  z: number;
  /** Y-center of the prop. */
  y: number;
  /** Direction (+1 or -1) on z-axis for mounting face — points into hallway. */
  faceZ: number;
  edgeColor: string;
}

const SCONCE_PLATE_COLOR = '#554433';
const SCONCE_GLOW_COLOR = '#ffcc66';
const PICTURE_FRAME_COLOR = '#6b4e1f';
const PICTURE_CANVAS_COLOR = '#d9c6a0';
const VINE_COLOR = '#4b7d3a';

function WallProp({ kind, x, z, y, faceZ, edgeColor }: WallPropProps) {
  // Push the prop just proud of the 0.1-thick wall surface.
  const mountOffset = 0.06;
  const pz = z + faceZ * mountOffset;

  if (kind === 'sconce') {
    return (
      <group position={[x, y, pz]}>
        {/* Wall plate */}
        <mesh>
          <boxGeometry args={[0.12, 0.12, 0.05]} />
          <meshPhongMaterial color={SCONCE_PLATE_COLOR} flatShading />
          <Edges color={edgeColor} lineWidth={1} />
        </mesh>
        {/* Emissive glow cube */}
        <mesh position={[0, 0, faceZ * 0.04]}>
          <boxGeometry args={[0.08, 0.08, 0.04]} />
          <meshPhongMaterial
            color={SCONCE_GLOW_COLOR}
            emissive={SCONCE_GLOW_COLOR}
            emissiveIntensity={2.0}
            flatShading
          />
        </mesh>
      </group>
    );
  }

  if (kind === 'picture') {
    return (
      <group position={[x, y, pz]}>
        {/* Frame */}
        <mesh>
          <boxGeometry args={[0.36, 0.26, 0.03]} />
          <meshPhongMaterial color={PICTURE_FRAME_COLOR} flatShading />
          <Edges color={edgeColor} lineWidth={1} />
        </mesh>
        {/* Canvas (lighter) inset */}
        <mesh position={[0, 0, faceZ * 0.02]}>
          <boxGeometry args={[0.30, 0.20, 0.01]} />
          <meshPhongMaterial color={PICTURE_CANVAS_COLOR} flatShading />
        </mesh>
      </group>
    );
  }

  // vine
  return (
    <mesh position={[x, y, pz]}>
      <boxGeometry args={[0.04, 0.6, 0.03]} />
      <meshPhongMaterial color={VINE_COLOR} flatShading />
      <Edges color={edgeColor} lineWidth={1} />
    </mesh>
  );
}

// Each vertical (hallway divider) wall sits closest to one specific room.
// Use that room's accent for tinting the wall body.
const VERTICAL_WALL_ROOMS: ReadonlyArray<{ id: RoomId; key: string; x: number; z: number }> = [
  // x > 0, z < 0 → Product Room side
  { id: 'product', key: 'wall-v-tl', x:  GAP + 0.05,  z: -HALF },
  // x < 0, z < 0 → My Room side
  { id: 'myroom',  key: 'wall-v-tr', x: -(GAP + 0.05), z: -HALF },
  // x > 0, z > 0 → Idea Lab side
  { id: 'idealab', key: 'wall-v-bl', x:  GAP + 0.05,  z:  HALF },
  // x < 0, z > 0 → Book Room side
  { id: 'book',    key: 'wall-v-br', x: -(GAP + 0.05), z:  HALF },
];

export function Walls() {
  const theme = useWorldStore((s) => s.theme);
  const edgeColor = theme === 'dark' ? EDGE_DARK : EDGE_LIGHT;

  // Each horizontal wall splits into 2 segments + door gap
  const segLen = (ROOM + 0.2 - DOOR.width) / 2; // 2.0

  // Deterministic per-segment tints mixed toward per-room accent.
  // 12 walls total: 8 horizontal (2 per door) + 4 vertical.
  // Each segment gets L jitter (±half of tintJitter) + ±0.04 rad hue rotation.
  const tints = useMemo<string[]>(() => {
    const rng = makeRng(0xd0071abc);
    const out: string[] = [];
    // Horizontal walls — index order matches HORIZONTAL_DOORS.
    for (let i = 0; i < HORIZONTAL_DOORS.length; i++) {
      const d = HORIZONTAL_DOORS[i];
      const accent = ROOM_BY_ID[d.id].accentColor;
      // Two segments per door; give them clearly distinct L jitter (±0.12) + hue drift (±0.04 rad).
      out.push(
        mixTint(
          WALL_POLISH.baseColor,
          accent,
          WALL_POLISH.accentMix,
          (rng() - 0.5) * WALL_POLISH.tintJitter,
          (rng() - 0.5) * 0.08,
        ),
      );
      out.push(
        mixTint(
          WALL_POLISH.baseColor,
          accent,
          WALL_POLISH.accentMix,
          (rng() - 0.5) * WALL_POLISH.tintJitter,
          (rng() - 0.5) * 0.08,
        ),
      );
    }
    // Vertical walls.
    for (let i = 0; i < VERTICAL_WALL_ROOMS.length; i++) {
      const accent = ROOM_BY_ID[VERTICAL_WALL_ROOMS[i].id].accentColor;
      out.push(
        mixTint(
          WALL_POLISH.baseColor,
          accent,
          WALL_POLISH.accentMix,
          (rng() - 0.5) * WALL_POLISH.tintJitter,
          (rng() - 0.5) * 0.08,
        ),
      );
    }
    return out;
  }, []);

  // ---------- F3.7 — 16 wall props along the 8 long horizontal strips. ----------
  // Deterministic via mulberry32(0xfacade01). Pool: sconce / picture / vine.
  // Each strip gets 2 props at offsets ~[-segLen*0.25, +segLen*0.25] ± jitter.
  // Hallway face faces toward the corridor (z=0 line); faceZ = sign of -d.z.
  interface WallPropSpec {
    key: string;
    kind: PropKind;
    x: number;
    y: number;
    z: number;
    faceZ: number;
  }
  const wallProps = useMemo<WallPropSpec[]>(() => {
    const rng = makeRng(0xfacade01);
    const pool: PropKind[] = ['sconce', 'picture', 'vine'];
    const out: WallPropSpec[] = [];
    for (let i = 0; i < HORIZONTAL_DOORS.length; i++) {
      const d = HORIZONTAL_DOORS[i];
      // Top rooms have door z = -(GAP+0.05) so z is negative → hallway side
      // is z > d.z → faceZ = +1. Bottom rooms → faceZ = -1.
      const faceZ = d.z < 0 ? 1 : -1;
      // Left + right segment centers (match the WallStrip position math below).
      const leftCenterX = d.x - DOOR.width / 2 - segLen / 2 - 0.075;
      const rightCenterX = d.x + DOOR.width / 2 + segLen / 2 + 0.075;
      for (const [side, cx] of [
        ['L', leftCenterX],
        ['R', rightCenterX],
      ] as const) {
        for (let p = 0; p < 2; p++) {
          const kind = pool[Math.floor(rng() * pool.length)];
          // Offset along strip: two slots near 25% / 75% of the strip width, ± jitter.
          const slot = p === 0 ? -segLen * 0.25 : segLen * 0.25;
          const jitter = (rng() - 0.5) * segLen * 0.15;
          // Y center varies by kind: sconce high, picture mid, vine slightly off mid.
          const y =
            kind === 'sconce' ? 1.45 : kind === 'picture' ? 1.1 : 0.9 + (rng() - 0.5) * 0.1;
          out.push({
            key: `wp-${d.id}-${side}-${p}`,
            kind,
            x: cx + slot + jitter,
            y,
            z: d.z,
            faceZ,
          });
        }
      }
    }
    return out;
  }, [segLen]);

  return (
    <group>
      {HORIZONTAL_DOORS.map((d, i) => (
        <group key={d.id}>
          {/* Left segment */}
          <WallStrip
            id={`wall-h-${d.id}-L`}
            x={d.x - DOOR.width / 2 - segLen / 2 - 0.075}
            z={d.z}
            w={segLen}
            d={0.1}
            tint={tints[i * 2]}
            edgeColor={edgeColor}
          />
          {/* Right segment */}
          <WallStrip
            id={`wall-h-${d.id}-R`}
            x={d.x + DOOR.width / 2 + segLen / 2 + 0.075}
            z={d.z}
            w={segLen}
            d={0.1}
            tint={tints[i * 2 + 1]}
            edgeColor={edgeColor}
          />
          <Door x={d.x} z={d.z} horizontal={true} roomId={d.id} accentColor={d.color} />
        </group>
      ))}

      {/* Wall props: sconces / pictures / vines — 16 total on 8 long walls */}
      {wallProps.map((wp) => (
        <WallProp
          key={wp.key}
          kind={wp.kind}
          x={wp.x}
          y={wp.y}
          z={wp.z}
          faceZ={wp.faceZ}
          edgeColor={edgeColor}
        />
      ))}

      {/* Vertical solid dividers (4) — each tied to its nearest room's accent */}
      {VERTICAL_WALL_ROOMS.map((v, i) => (
        <WallStrip
          key={v.key}
          id={v.key}
          x={v.x}
          z={v.z}
          w={0.1}
          d={ROOM + 0.2}
          tint={tints[HORIZONTAL_DOORS.length * 2 + i]}
          edgeColor={edgeColor}
        />
      ))}
    </group>
  );
}
