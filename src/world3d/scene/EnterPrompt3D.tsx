import { Html } from '@react-three/drei';
import { useWorldStore } from '../store/worldStore';
import { ROOMS, ROOM_BY_ID } from '../data/rooms';
import type { RoomId } from '../data/rooms';

/**
 * Door-state sign for the door the player is currently FACING the most
 * (highest dot product with the FP look vector). One sign at a time —
 * the sign is the visual contract for what U will toggle. Reads:
 *   🔒 red  → locked, U will open it
 *   🚪 teal → open,   U will close it
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
  const fpYaw = useWorldStore((s) => s.fpYaw);
  const charPos = useWorldStore((s) => s.charPos);
  if (viewMode !== 'overview' || !fpActive) return null;

  // Mirror the U-key logic: pick the door with the highest forward dot.
  const lookX = -Math.sin(fpYaw);
  const lookZ = -Math.cos(fpYaw);
  let target: RoomId | null = null;
  let bestDot = 0;
  for (const r of ROOMS) {
    const dx = r.door.x - charPos.x;
    const dz = r.door.z - charPos.z;
    const len = Math.hypot(dx, dz) || 1;
    const dot = (dx * lookX + dz * lookZ) / len;
    if (dot > bestDot) { bestDot = dot; target = r.id; }
  }
  if (!target) return null;
  return <DoorSign key={target} id={target} />;
}
