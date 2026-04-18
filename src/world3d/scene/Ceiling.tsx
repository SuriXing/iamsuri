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
 *  - renderOrder = -1 forces the ceiling to draw before the StarField's
 *    transparent additive points; combined with depthWrite the stars
 *    fail the depth test below the ceiling and disappear naturally.
 */

const CEILING_Y = 2.0;
const CEILING_T = 0.1;        // box thickness (depth)
const ROOM_SIDE = ROOM + 0.2; // matches RoomFloor / wall span
const HALL_LEN = ROOM * 2 + GAP * 2 + 1;
const HALL_WIDTH = GAP * 2;

const CEILING_DARK = '#8b5e2e';
const CEILING_LIGHT = '#e8dcb8';
const CEILING_EMISSIVE_DARK = '#6b4218';
const CEILING_EMISSIVE_LIGHT = '#a08868';

export function Ceiling() {
  const theme = useWorldStore((s) => s.theme);
  const color = theme === 'light' ? CEILING_LIGHT : CEILING_DARK;
  const emissive = theme === 'light' ? CEILING_EMISSIVE_LIGHT : CEILING_EMISSIVE_DARK;
  return (
    <group>
      {/* Per-room ceilings */}
      {ROOMS.map((r) => (
        <mesh
          key={r.id}
          position={[r.center.x, CEILING_Y, r.center.z]}
          renderOrder={-1}
        >
          <boxGeometry args={[ROOM_SIDE, CEILING_T, ROOM_SIDE]} />
          <meshStandardMaterial
            color={color}
            roughness={0.85}
            metalness={0.0}
            emissive={emissive}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
      {/* Hallway ceiling cross — same treatment */}
      <mesh position={[0, CEILING_Y, 0]} renderOrder={-1}>
        <boxGeometry args={[HALL_WIDTH, CEILING_T, HALL_LEN]} />
        <meshStandardMaterial
          color={color}
          roughness={0.85}
          metalness={0.0}
          emissive={emissive}
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[0, CEILING_Y, 0]} renderOrder={-1}>
        <boxGeometry args={[HALL_LEN, CEILING_T, HALL_WIDTH]} />
        <meshStandardMaterial
          color={color}
          roughness={0.85}
          metalness={0.0}
          emissive={emissive}
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}
