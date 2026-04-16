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
  { x: -HALF, z:  GAP + 0.05, id: 'book',    color: '#f43f5e' },
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

// Wall props (sconces / pictures / vines) and the wallProps useMemo
// removed per user request — the small wall-mounted blocks were
// cluttering the wall surfaces. Component file kept in git history.

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

      {/* Wall props removed per user request — sconces / pictures / vines
          were cluttering the wall surfaces. */}

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
