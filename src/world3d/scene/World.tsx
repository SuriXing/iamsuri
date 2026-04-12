import { Ground } from './Ground';
import { RoomFloor } from './RoomFloor';
import { ROOMS } from '../data/rooms';
import { COLORS, LIGHTS, SHADOW_MAP_SIZE, FOG_DENSITY } from '../constants';

export function World() {
  return (
    <>
      {/* Lights */}
      <ambientLight intensity={LIGHTS.ambient.intensity} color={LIGHTS.ambient.color} />
      <directionalLight
        position={[...LIGHTS.directional.position]}
        intensity={LIGHTS.directional.intensity}
        color={LIGHTS.directional.color}
        castShadow
        shadow-mapSize={[SHADOW_MAP_SIZE, SHADOW_MAP_SIZE]}
      />
      <hemisphereLight
        intensity={LIGHTS.hemisphere.intensity}
        color={LIGHTS.hemisphere.sky}
        groundColor={LIGHTS.hemisphere.ground}
      />

      {/* Scene */}
      <color attach="background" args={[COLORS.bg]} />
      <fogExp2 attach="fog" args={[COLORS.bg, FOG_DENSITY]} />

      <Ground />
      {ROOMS.map((r) => (
        <RoomFloor key={r.id} room={r} />
      ))}
    </>
  );
}
