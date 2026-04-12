import { Html } from '@react-three/drei';
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
import { CameraController } from './CameraController';
import { PlayerController } from './PlayerController';
import { MouseOrbitController } from './MouseOrbitController';
import { InteractionManager } from './InteractionManager';
import { InteractionRaycaster } from './InteractionRaycaster';
import { ThemeEffect } from './ThemeEffect';
import { EnterPrompt3D } from './EnterPrompt3D';
import { SpeechBubble3D } from './SpeechBubble3D';
import { useWorldStore } from '../store/worldStore';

const ROOM_LIGHTS: ReadonlyArray<{ pos: [number, number, number]; color: string }> = [
  { pos: [ROOMS[0].center.x, 4, ROOMS[0].center.z], color: '#ffb6c1' },
  { pos: [ROOMS[1].center.x, 4, ROOMS[1].center.z], color: '#60a5fa' },
  { pos: [ROOMS[2].center.x, 4, ROOMS[2].center.z], color: '#4ade80' },
  { pos: [ROOMS[3].center.x, 4, ROOMS[3].center.z], color: '#fbbf24' },
];

const LIGHT_BG = '#f0ede6';

export function World() {
  const viewMode = useWorldStore((s) => s.viewMode);
  const theme = useWorldStore((s) => s.theme);
  const showLabels = viewMode === 'overview';
  const bgColor = theme === 'light' ? LIGHT_BG : COLORS.bg;
  return (
    <>
      <color key={`bg-${theme}`} attach="background" args={[bgColor]} />
      <fogExp2 key={`fog-${theme}`} attach="fog" args={[bgColor, FOG_DENSITY]} />

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
      <pointLight position={[0, 3, 0]} color="#ffb060" intensity={0.5} distance={30} />
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

      {/* Controllers / managers — invisible, but render null and run logic */}
      <CameraController />
      <PlayerController />
      <MouseOrbitController />
      <InteractionManager />
      <InteractionRaycaster />
      <ThemeEffect />

      {/* Floating prompts anchored to world positions */}
      <EnterPrompt3D />
      <SpeechBubble3D />

      {/* Room labels — projected from 3D space via drei Html (fixed-pixel size) */}
      {showLabels &&
        ROOMS.map((r) => (
          <Html
            key={r.id}
            position={[r.center.x, 3.0, r.center.z]}
            center
            zIndexRange={[10, 0]}
            pointerEvents="none"
          >
            <div
              id={`label-${r.id}`}
              className="room-label"
              style={{ color: r.accentColor }}
            >
              {r.label}
            </div>
          </Html>
        ))}
    </>
  );
}
