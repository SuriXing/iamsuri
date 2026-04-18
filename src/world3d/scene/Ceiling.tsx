import { useMemo } from 'react';
import * as THREE from 'three';
import { ROOMS } from '../data/rooms';
import { ROOM, GAP } from '../constants';
import { useWorldStore } from '../store/worldStore';

/**
 * Ceiling — real architecture, not a workaround.
 *
 * Why box + standard material (not plane + basic):
 *  - boxGeometry has thickness so it depth-writes on every face from any
 *    pitch (looking up *or* down at the room edge). A planeGeometry only
 *    writes from one side, so glancing angles let transparent point
 *    materials (StarField) bleed through.
 *  - meshStandardMaterial responds to the under-ceiling point lights, so
 *    the surface reads as lit wood rather than a flat black void.
 *  - renderOrder=-1: opaque-first depth-write occludes additive transparent
 *    points (StarField). renderOrder=-1 is belt-and-suspenders for any later
 *    transparent material that might insert.
 */

// R3.7 Y2: raised from 2.0 → 2.05 to clear the 1.98 wall top cap (3cm z-fight).
export const CEILING_Y = 2.05;
const CEILING_T = 0.1;        // box thickness (depth) → bottom face at y=2.0
const ROOM_SIDE = ROOM + 0.2; // matches RoomFloor / wall span
const HALL_LEN = ROOM * 2 + GAP * 2 + 1;
const HALL_WIDTH = GAP * 2;

// R3.7 F4: dark ceiling → neutral warm gray (was saturated brown #8b5e2e
// which fought blue/green/gold room accents). New #6b5b4a + emissive #4a3f33.
const CEILING_DARK = '#6b5b4a';
// R3.7 F3: light ceiling → deeper warm tan to contrast LIGHT_BG #f0ede6
// (was #e8dcb8 which washed into the bg).
const CEILING_LIGHT = '#c9b48a';
const CEILING_EMISSIVE_DARK = '#4a3f33';
const CEILING_EMISSIVE_LIGHT = '#a08868';

export function Ceiling() {
  const theme = useWorldStore((s) => s.theme);
  // R3.7 Y3: hoist material — one shared instance across all 6 ceiling meshes
  // instead of 6 inline material elements. Keyed on theme so it rebuilds on
  // theme toggle. Saves GPU material slots, identical visuals.
  const material = useMemo(() => {
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
      {/* Per-room ceilings */}
      {ROOMS.map((r) => (
        <mesh
          key={r.id}
          position={[r.center.x, CEILING_Y, r.center.z]}
          renderOrder={-1}
          material={material}
        >
          <boxGeometry args={[ROOM_SIDE, CEILING_T, ROOM_SIDE]} />
        </mesh>
      ))}
      {/* Hallway ceiling cross — same treatment */}
      <mesh position={[0, CEILING_Y, 0]} renderOrder={-1} material={material}>
        <boxGeometry args={[HALL_WIDTH, CEILING_T, HALL_LEN]} />
      </mesh>
      <mesh position={[0, CEILING_Y, 0]} renderOrder={-1} material={material}>
        <boxGeometry args={[HALL_LEN, CEILING_T, HALL_WIDTH]} />
      </mesh>
    </group>
  );
}
