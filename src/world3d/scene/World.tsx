import { ROOMS } from '../data/rooms';
import { COLORS, LIGHTS, SHADOW_MAP_SIZE, FOG_DENSITY } from '../constants';
import { Ground } from './Ground';
import { RoomFloor } from './RoomFloor';
import { Walls } from './Walls';
import { StarField } from './StarField';
import { Particles } from './Particles';
import { HallwayLanterns } from './HallwayLanterns';
import { Hallway } from './Hallway';
import { Character } from './Character';
import { MyRoom } from './rooms/MyRoom';
import { ProductRoom } from './rooms/ProductRoom';
import { BookRoom } from './rooms/BookRoom';
import { IdeaLab } from './rooms/IdeaLab';

const ROOM_LIGHTS: ReadonlyArray<{ pos: [number, number, number]; color: string }> = [
  { pos: [ROOMS[0].center.x, 4, ROOMS[0].center.z], color: '#ffb6c1' },
  { pos: [ROOMS[1].center.x, 4, ROOMS[1].center.z], color: '#60a5fa' },
  { pos: [ROOMS[2].center.x, 4, ROOMS[2].center.z], color: '#4ade80' },
  { pos: [ROOMS[3].center.x, 4, ROOMS[3].center.z], color: '#fbbf24' },
];

export function World() {
  return (
    <>
      <color attach="background" args={[COLORS.bg]} />
      <fogExp2 attach="fog" args={[COLORS.bg, FOG_DENSITY]} />

      {/* Lights */}
      <ambientLight intensity={LIGHTS.ambient.intensity} color={LIGHTS.ambient.color} />
      <directionalLight
        position={[...LIGHTS.directional.position]}
        intensity={LIGHTS.directional.intensity}
        color={LIGHTS.directional.color}
        castShadow
        shadow-mapSize={[SHADOW_MAP_SIZE, SHADOW_MAP_SIZE]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-bias={-0.001}
      />
      <hemisphereLight
        intensity={LIGHTS.hemisphere.intensity}
        color={LIGHTS.hemisphere.sky}
        groundColor={LIGHTS.hemisphere.ground}
      />
      <pointLight position={[0, 3, 0]} color="#ffb060" intensity={0.4} distance={30} />
      <pointLight position={[-8, 5, -8]} color="#ff8844" intensity={0.3} distance={30} />
      <pointLight position={[8, 5, -8]} color="#ffaa66" intensity={0.3} distance={30} />
      {ROOM_LIGHTS.map((l, i) => (
        <pointLight
          key={i}
          position={l.pos}
          color={l.color}
          intensity={1.0}
          distance={10}
        />
      ))}

      {/* Background */}
      <StarField />
      <Particles />

      {/* Floors */}
      <Ground />
      {ROOMS.map((r) => (
        <RoomFloor key={r.id} room={r} />
      ))}

      {/* Structure */}
      <Walls />

      {/* Hallway */}
      <Hallway />
      <HallwayLanterns />

      {/* Rooms */}
      <MyRoom />
      <ProductRoom />
      <BookRoom />
      <IdeaLab />

      {/* Character */}
      <Character />
    </>
  );
}
