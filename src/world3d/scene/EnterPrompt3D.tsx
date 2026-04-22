import { Html } from '@react-three/drei';
import { useWorldStore } from '../store/worldStore';
import { ROOMS, ROOM_BY_ID } from '../data/rooms';
import type { RoomId } from '../data/rooms';

/**
 * Permanent door-state sign per room. Always visible above each door
 * once the player is walking in FP. U targets the door the avatar is
 * currently facing (handled in InteractionManager) — the signs are the
 * persistent visual reminder of every door's open/closed state.
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
  if (viewMode !== 'overview' || !fpActive) return null;
  return (
    <>
      {ROOMS.map((r) => (
        <DoorSign key={r.id} id={r.id} />
      ))}
    </>
  );
}
