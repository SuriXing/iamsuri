import { ROOM, FLOOR_Y } from '../constants';
import type { RoomDef } from '../data/rooms';

interface Props {
  room: RoomDef;
}

export function RoomFloor({ room }: Props) {
  return (
    <mesh position={[room.center.x, FLOOR_Y, room.center.z]} receiveShadow>
      <boxGeometry args={[ROOM, 0.12, ROOM]} />
      <meshPhongMaterial color={room.color} />
    </mesh>
  );
}
