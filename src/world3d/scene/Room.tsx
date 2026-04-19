import { useEffect, useMemo } from 'react';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';
import { ROOM, GAP, FLOOR_Y, DOOR, WALL_POLISH } from '../constants';
import { Door } from './Door';
import type { RoomDef } from '../data/rooms';
import { registerCollider, unregisterCollider } from './colliders';
import { useWorldStore } from '../store/worldStore';
import { makeRng } from '../util/rand';

/**
 * Room — single closed-volume builder.
 *
 * R4.1 (OUT-1): every room is constructed as ONE logical mesh group:
 *   - floor (slightly extended on doorway side to tile-meet hallway with no gap)
 *   - 4 walls forming a closed perimeter (doorway side has a cutout =
 *     two pillars + cap that bridges across; the Door component supplies
 *     its own lintel/header for the visual top of the opening)
 *   - ceiling
 *
 * Door cutouts are built from boxGeometry pieces (no CSG dep). The door's
 * frame + slab is rendered via the existing <Door /> component.
 */

// Hoisted from Ceiling.tsx (deleted in R4.1) — kept exported in case other
// modules grow a dependency on it later. Bottom of ceiling box sits at y=2.0.
export const CEILING_Y = 2.05;
const CEILING_T = 0.1;
const ROOM_SIDE = ROOM + 0.2; // ceiling spans the full wall-trim footprint

const CEILING_DARK = '#6b5b4a';
const CEILING_LIGHT = '#c9b48a';
const CEILING_EMISSIVE_DARK = '#4a3f33';
const CEILING_EMISSIVE_LIGHT = '#a08868';

const WALL_EMISSIVE = '#6b4e1f';
const EDGE_DARK = '#0a0a14';
const EDGE_LIGHT = '#5a4830';

const WALL_H = 1.8;
const WALL_THICK = 0.1;
const BASE_H = 0.14;
const CAP_H = 0.08;
const TRIM_PAD = 0.03;

// Per-room "floor weight" — same look as the deleted RoomFloor.tsx.
const ROOM_FLOOR_WEIGHT: Record<string, number> = {
  myroom: 0.95,
  product: 0.8,
  book: 0.55,
  idealab: 0.5,
};

function muteHex(hex: string, weight: number): string {
  const c = new THREE.Color(hex);
  c.multiplyScalar(weight);
  return `#${c.getHexString()}`;
}

function mixTint(
  baseHex: string,
  accentHex: string,
  mix: number,
  lDelta: number,
  hDelta = 0,
): string {
  const base = new THREE.Color(baseHex);
  const accent = new THREE.Color(accentHex);
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

function WallStrip({ id, x, z, w, d, tint, edgeColor }: WallStripProps) {
  useEffect(() => {
    registerCollider({ id, x, z, hx: w / 2, hz: d / 2 });
    return () => unregisterCollider(id);
  }, [id, x, z, w, d]);
  return (
    <group>
      <mesh position={[x, 1.0, z]}>
        <boxGeometry args={[w, WALL_H, d]} />
        <meshPhongMaterial
          color={tint}
          emissive={WALL_EMISSIVE}
          emissiveIntensity={0.12}
          flatShading
          side={THREE.DoubleSide}
        />
        <Edges color={edgeColor} lineWidth={1.0} />
      </mesh>
      <mesh position={[x, BASE_H / 2 + 0.01, z]}>
        <boxGeometry args={[w + TRIM_PAD, BASE_H, d + TRIM_PAD]} />
        <meshPhongMaterial
          color={WALL_POLISH.baseboard}
          emissive={WALL_EMISSIVE}
          emissiveIntensity={0.08}
          flatShading
          side={THREE.DoubleSide}
        />
        <Edges color={edgeColor} lineWidth={1.0} />
      </mesh>
      <mesh position={[x, WALL_H + CAP_H / 2 + 0.1, z]}>
        <boxGeometry args={[w + TRIM_PAD, CAP_H, d + TRIM_PAD]} />
        <meshPhongMaterial
          color={WALL_POLISH.topCap}
          emissive={WALL_EMISSIVE}
          emissiveIntensity={0.18}
          flatShading
          side={THREE.DoubleSide}
        />
        <Edges color={edgeColor} lineWidth={1.0} />
      </mesh>
    </group>
  );
}

/**
 * Door-cutout wall: two pillars (left/right) + a continuous cap bridge
 * + a small lintel block above the door opening so the wall reads as
 * cleanly cut, with no visible void above the door from inside.
 */
interface DoorwayWallProps {
  idPrefix: string;
  /** Door center position (matches Door.x / Door.z). */
  doorX: number;
  doorZ: number;
  /** Wall axis: 'x' = wall runs along x (cutout splits in x); 'z' = along z. */
  axis: 'x' | 'z';
  /** Total wall extent along its axis (matches the old ROOM+0.2 footprint). */
  totalLen: number;
  tintLeft: string;
  tintRight: string;
  edgeColor: string;
}

function DoorwayWall({
  idPrefix,
  doorX,
  doorZ,
  axis,
  totalLen,
  tintLeft,
  tintRight,
  edgeColor,
}: DoorwayWallProps) {
  const segLen = (totalLen - DOOR.width) / 2;

  if (axis === 'x') {
    const leftCenterX = doorX - DOOR.width / 2 - segLen / 2;
    const rightCenterX = doorX + DOOR.width / 2 + segLen / 2;
    return (
      <group>
        <WallStrip
          id={`${idPrefix}-L`}
          x={leftCenterX}
          z={doorZ}
          w={segLen}
          d={WALL_THICK}
          tint={tintLeft}
          edgeColor={edgeColor}
        />
        <WallStrip
          id={`${idPrefix}-R`}
          x={rightCenterX}
          z={doorZ}
          w={segLen}
          d={WALL_THICK}
          tint={tintRight}
          edgeColor={edgeColor}
        />
        {/* Lintel block above the door opening — fills the cap-level gap
            above DOOR.frameHeight (1.9) up to the wall top (~1.98) so
            looking up through the doorway shows wall, not void. */}
        <mesh position={[doorX, (DOOR.frameHeight + WALL_H + 0.1) / 2, doorZ]}>
          <boxGeometry
            args={[
              DOOR.width,
              Math.max(WALL_H + 0.1 - DOOR.frameHeight, 0.12),
              WALL_THICK,
            ]}
          />
          <meshPhongMaterial
            color={tintLeft}
            emissive={WALL_EMISSIVE}
            emissiveIntensity={0.12}
            flatShading
            side={THREE.DoubleSide}
          />
          <Edges color={edgeColor} lineWidth={1.0} />
        </mesh>
      </group>
    );
  }
  // axis === 'z'
  const leftCenterZ = doorZ - DOOR.width / 2 - segLen / 2;
  const rightCenterZ = doorZ + DOOR.width / 2 + segLen / 2;
  return (
    <group>
      <WallStrip
        id={`${idPrefix}-L`}
        x={doorX}
        z={leftCenterZ}
        w={WALL_THICK}
        d={segLen}
        tint={tintLeft}
        edgeColor={edgeColor}
      />
      <WallStrip
        id={`${idPrefix}-R`}
        x={doorX}
        z={rightCenterZ}
        w={WALL_THICK}
        d={segLen}
        tint={tintRight}
        edgeColor={edgeColor}
      />
      <mesh position={[doorX, (DOOR.frameHeight + WALL_H + 0.1) / 2, doorZ]}>
        <boxGeometry
          args={[
            WALL_THICK,
            Math.max(WALL_H + 0.1 - DOOR.frameHeight, 0.12),
            DOOR.width,
          ]}
        />
        <meshPhongMaterial
          color={tintLeft}
          emissive={WALL_EMISSIVE}
          emissiveIntensity={0.12}
          flatShading
          side={THREE.DoubleSide}
        />
        <Edges color={edgeColor} lineWidth={1.0} />
      </mesh>
    </group>
  );
}

interface Props {
  room: RoomDef;
}

export function Room({ room }: Props) {
  const theme = useWorldStore((s) => s.theme);
  const edgeColor = theme === 'dark' ? EDGE_DARK : EDGE_LIGHT;
  const cx = room.center.x;
  const cz = room.center.z;

  // The doorway-bearing wall faces the hallway (toward origin). For a room
  // at cz=-3.7 (top half) the door sits at z=-1.25 = sign(cz)*(GAP+0.05).
  // R4.1-fix: sign was inverted (cz<0 ? 1 : -1) which placed the doorway
  // wall on the BACK side and left the actual room face transparent. The
  // opposite/outer walls then doubled up on the back side because the
  // double negative cancelled. Correct sign = sign(cz).
  const doorwayZSign: 1 | -1 = cz < 0 ? -1 : 1;
  const doorWallZ = doorwayZSign * (GAP + 0.05);
  // Opposite wall sits on the SAME signed side as doorwayZSign, one room
  // half-extent further out (at the back of the room).
  const oppositeWallZ = cz + doorwayZSign * (ROOM / 2 + 0.05);
  // Corridor-side wall sits at x = sign(cx)*(GAP+0.05); outer wall sits
  // beyond the room footprint on the same side.
  const innerWallXSign: 1 | -1 = cx < 0 ? -1 : 1;
  const innerWallX = innerWallXSign * (GAP + 0.05);
  const outerWallX = cx + innerWallXSign * (ROOM / 2 + 0.05);

  // Floor — extend ROOM_SIDE by 0.20 toward the hallway/doorway side so
  // the room floor tile-meets the hallway X-arm with a small overlap
  // (kills the seam the R3.3 threshold patches were band-aiding). The
  // doorway sits at z = doorwayZSign * (GAP + 0.05); the room center is
  // at cz on the OTHER side of that, so we extend toward origin = subtract
  // doorwayZSign * floorExtra / 2 from cz.
  const floorExtra = 0.2;
  const floorDepth = ROOM + floorExtra;
  const floorZ = cz - (doorwayZSign * floorExtra) / 2;
  const weight = ROOM_FLOOR_WEIGHT[room.id] ?? 1;
  const floorColor = useMemo(() => muteHex(room.color, weight), [room.color, weight]);

  // Wall tints — preserve the deterministic L jitter look from old Walls.tsx.
  // RNG seed mixes a constant with the room id hash so tints stay stable
  // per room across reloads.
  const tints = useMemo(() => {
    let h = 0xd0071abc >>> 0;
    for (let i = 0; i < room.id.length; i++) {
      h ^= room.id.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const rng = makeRng(h >>> 0);
    const accent = room.accentColor;
    const t = (): string =>
      mixTint(
        WALL_POLISH.baseColor,
        accent,
        WALL_POLISH.accentMix,
        (rng() - 0.5) * WALL_POLISH.tintJitter,
        (rng() - 0.5) * 0.08,
      );
    return {
      doorL: t(),
      doorR: t(),
      opposite: t(),
      inner: t(),
      outer: t(),
    };
  }, [room.id, room.accentColor]);

  // Ceiling material — hoisted from Ceiling.tsx.
  const ceilingMaterial = useMemo(() => {
    const isLight = theme === 'light';
    return new THREE.MeshStandardMaterial({
      color: isLight ? CEILING_LIGHT : CEILING_DARK,
      roughness: 0.85,
      metalness: 0.0,
      emissive: isLight ? CEILING_EMISSIVE_LIGHT : CEILING_EMISSIVE_DARK,
      emissiveIntensity: 0.4,
    });
  }, [theme]);

  return (
    <group>
      {/* Floor */}
      <mesh position={[cx, FLOOR_Y, floorZ]}>
        <boxGeometry args={[ROOM, 0.12, floorDepth]} />
        <meshPhongMaterial
          color={floorColor}
          emissive={floorColor}
          emissiveIntensity={0.3}
          flatShading
        />
      </mesh>

      {/* Doorway wall (toward origin) — split into pillars + lintel,
          door slab + frame supplied by <Door />. */}
      <DoorwayWall
        idPrefix={`wall-h-${room.id}`}
        doorX={room.door.x}
        doorZ={doorWallZ}
        axis="x"
        totalLen={ROOM + 0.2}
        tintLeft={tints.doorL}
        tintRight={tints.doorR}
        edgeColor={edgeColor}
      />
      <Door
        x={room.door.x}
        z={doorWallZ}
        horizontal={true}
        roomId={room.id}
        accentColor={room.accentColor}
      />

      {/* Opposite wall — solid, away from origin. */}
      <WallStrip
        id={`wall-back-${room.id}`}
        x={cx}
        z={oppositeWallZ}
        w={ROOM + 0.2}
        d={WALL_THICK}
        tint={tints.opposite}
        edgeColor={edgeColor}
      />

      {/* Inner-x (corridor-side perpendicular) wall — solid. */}
      <WallStrip
        id={`wall-v-inner-${room.id}`}
        x={innerWallX}
        z={cz}
        w={WALL_THICK}
        d={ROOM + 0.2}
        tint={tints.inner}
        edgeColor={edgeColor}
      />

      {/* Outer-x wall — solid, away from origin. */}
      <WallStrip
        id={`wall-v-outer-${room.id}`}
        x={outerWallX}
        z={cz}
        w={WALL_THICK}
        d={ROOM + 0.2}
        tint={tints.outer}
        edgeColor={edgeColor}
      />

      {/* Ceiling */}
      <mesh
        position={[cx, CEILING_Y, cz]}
        renderOrder={-1}
        material={ceilingMaterial}
      >
        <boxGeometry args={[ROOM_SIDE, CEILING_T, ROOM_SIDE]} />
      </mesh>
    </group>
  );
}
