import { useEffect, useMemo } from 'react';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';
import { ROOM, GAP, COLORS, DOOR } from '../constants';
import { Door } from './Door';
import type { RoomId } from '../data/rooms';
import { registerCollider, unregisterCollider } from './colliders';
import { useWorldStore } from '../store/worldStore';
import { makeRng } from '../util/rand';

const WALL_COLOR = '#3d2817';
const WALL_EMISSIVE = '#6b4e1f';
const WALL_BASE_COLOR = '#2a1a0d';  // darker baseboard
const WALL_CAP_COLOR = '#55361f';   // lighter top cap
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

// Tiny hex tint helper — called only inside useMemo, never per-frame.
function tintHex(hex: string, delta: number): string {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  hsl.l = Math.max(0, Math.min(1, hsl.l + delta));
  c.setHSL(hsl.h, hsl.s, hsl.l);
  return `#${c.getHexString()}`;
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
const BASE_H = 0.06;
const CAP_H = 0.04;
// "Slightly wider" trim — a hair fatter in every horizontal dimension.
const TRIM_PAD = 0.02;

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
          emissiveIntensity={0.15}
          flatShading
        />
        <Edges color={edgeColor} lineWidth={1.0} />
      </mesh>
      {/* Baseboard — thin, slightly wider, darker */}
      <mesh position={[x, BASE_H / 2 + 0.01, z]} receiveShadow>
        <boxGeometry args={[w + TRIM_PAD, BASE_H, d + TRIM_PAD]} />
        <meshPhongMaterial
          color={WALL_BASE_COLOR}
          emissive={WALL_EMISSIVE}
          emissiveIntensity={0.1}
          flatShading
        />
      </mesh>
      {/* Top cap — thin, slightly wider, lighter */}
      <mesh position={[x, WALL_H + CAP_H / 2 + 0.1, z]}>
        <boxGeometry args={[w + TRIM_PAD, CAP_H, d + TRIM_PAD]} />
        <meshPhongMaterial
          color={WALL_CAP_COLOR}
          emissive={WALL_EMISSIVE}
          emissiveIntensity={0.2}
          flatShading
        />
      </mesh>
    </group>
  );
}

export function Walls() {
  const theme = useWorldStore((s) => s.theme);
  const edgeColor = theme === 'dark' ? EDGE_DARK : EDGE_LIGHT;

  // Each horizontal wall splits into 2 segments + door gap
  const segLen = (ROOM + 0.2 - DOOR.width) / 2; // 2.0

  // Deterministic per-wall tints. 12 walls total: 8 horizontal (2 per door) + 4 vertical.
  const tints = useMemo<string[]>(() => {
    const rng = makeRng(0xd0071abc);
    const out: string[] = [];
    for (let i = 0; i < 12; i++) {
      out.push(tintHex(WALL_COLOR, (rng() - 0.5) * 0.06));
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

      {/* Vertical solid dividers (4) */}
      <WallStrip id="wall-v-tl" x={GAP + 0.05}  z={-HALF} w={0.1} d={ROOM + 0.2} tint={tints[8]}  edgeColor={edgeColor} />
      <WallStrip id="wall-v-tr" x={-(GAP + 0.05)} z={-HALF} w={0.1} d={ROOM + 0.2} tint={tints[9]}  edgeColor={edgeColor} />
      <WallStrip id="wall-v-bl" x={GAP + 0.05}  z={HALF}  w={0.1} d={ROOM + 0.2} tint={tints[10]} edgeColor={edgeColor} />
      <WallStrip id="wall-v-br" x={-(GAP + 0.05)} z={HALF}  w={0.1} d={ROOM + 0.2} tint={tints[11]} edgeColor={edgeColor} />
    </group>
  );
}
