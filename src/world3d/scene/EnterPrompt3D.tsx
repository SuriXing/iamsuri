import { Html } from '@react-three/drei';
import { useWorldStore } from '../store/worldStore';
import { ROOMS, ROOM_BY_ID } from '../data/rooms';
import type { RoomId } from '../data/rooms';

/**
 * One permanent door-state sign per room, anchored above each doorframe.
 * The sign always reads either "Press U to open <Room>" (locked) or
 * "Press U to close <Room>" (unlocked). Color cues:
 *   🔒 red  → locked, U will open it
 *   🚪 teal → open, U will close it
 *
 * Using individual <DoorSign> components subscribed to the per-room
 * unlocked-state means each sign re-renders only when its own door
 * toggles, not on every player movement frame.
 */
function DoorSign({ id }: { id: RoomId }) {
  const room = ROOM_BY_ID[id];
  const unlocked = useWorldStore((s) => s.unlockedDoors.has(id));
  const cls = unlocked ? 'enter-prompt active unlocked' : 'enter-prompt active locked';
  const verb = unlocked ? 'close' : 'open';
  return (
    <group position={[room.door.x, 2.7, room.door.z]}>
      <Html center zIndexRange={[55, 0]} pointerEvents="none">
        <div className={cls}>
          Press <kbd>U</kbd> to {verb} {room.label}
        </div>
      </Html>
    </group>
  );
}

export function EnterPrompt3D() {
  const viewMode = useWorldStore((s) => s.viewMode);
  const fpActive = useWorldStore((s) => s.fpActive);
  // Only show the door labels once the player is actually walking the
  // corridor in first-person. The wide top-down overview (before any
  // WASD press) is already information-rich; layering 4 banners on top
  // of it just clutters the bird's-eye composition.
  if (viewMode !== 'overview' || !fpActive) return null;
  return (
    <>
      {ROOMS.map((r) => (
        <DoorSign key={r.id} id={r.id} />
      ))}
    </>
  );
}
