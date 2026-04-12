import { ROOM, FLOOR_Y } from '../constants';
import type { RoomDef } from '../data/rooms';

interface Props {
  room: RoomDef;
}

const ROOM_FLOOR_OPACITY: Record<string, number> = {
  myroom: 0.95,
  product: 0.8,
  book: 0.55,
  idealab: 0.5,
};

export function RoomFloor({ room }: Props) {
  const opacity = ROOM_FLOOR_OPACITY[room.id] ?? 1;
  return (
    <mesh position={[room.center.x, FLOOR_Y, room.center.z]} receiveShadow>
      <boxGeometry args={[ROOM, 0.12, ROOM]} />
      <meshPhongMaterial
        color={room.color}
        emissive={room.color}
        emissiveIntensity={0.3}
        transparent={opacity < 1}
        opacity={opacity}
        flatShading
      />
    </mesh>
  );
}
