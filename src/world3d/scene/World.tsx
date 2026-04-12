import { Ground } from './Ground';
import { RoomFloor } from './RoomFloor';
import { ROOMS } from '../data/rooms';
import { COLORS } from '../constants';

export function World() {
  return (
    <>
      {/* Lights */}
      <ambientLight intensity={1.2} color="#ffd8a8" />
      <directionalLight
        position={[-10, 18, 8]}
        intensity={1.0}
        color="#ffeab0"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <hemisphereLight intensity={0.5} color="#ffc88a" groundColor="#4a3020" />

      {/* Scene */}
      <color attach="background" args={[COLORS.bg]} />
      <fogExp2 attach="fog" args={[COLORS.bg, 0.004]} />

      <Ground />
      {ROOMS.map((r) => (
        <RoomFloor key={r.id} room={r} />
      ))}
    </>
  );
}
