import * as THREE from 'three';
import { useMemo } from 'react';
import { ROOM, FLOOR_Y } from '../constants';
import type { RoomDef } from '../data/rooms';

interface Props {
  room: RoomDef;
}

// Per-room "floor weight" — was previously expressed as transparent
// opacity (0.5..0.95), which created a depth-sort fragility class:
// transparent meshes don't have a stable render order across camera
// motion, contributing to the "rooms swap positions" bug at distance 13.
//
// Now we bake the same visual difference into the base + emissive color
// directly: lower weight = darker tinted color, full alpha. Identical
// look from any angle, no transparency, no sort issues.
const ROOM_FLOOR_WEIGHT: Record<string, number> = {
  myroom: 0.95,
  product: 0.8,
  book: 0.55,
  idealab: 0.5,
};

function muteColor(hex: string, weight: number): { base: string; emissive: string } {
  const c = new THREE.Color(hex);
  // Lerp toward black by (1 - weight). weight=1 → no change, weight=0.5 → halfway to black.
  c.multiplyScalar(weight);
  return { base: `#${c.getHexString()}`, emissive: `#${c.getHexString()}` };
}

export function RoomFloor({ room }: Props) {
  const weight = ROOM_FLOOR_WEIGHT[room.id] ?? 1;
  const { base, emissive } = useMemo(() => muteColor(room.color, weight), [room.color, weight]);
  return (
    <mesh position={[room.center.x, FLOOR_Y, room.center.z]}>
      <boxGeometry args={[ROOM, 0.12, ROOM]} />
      <meshPhongMaterial
        color={base}
        emissive={emissive}
        emissiveIntensity={0.3}
        flatShading
      />
    </mesh>
  );
}
