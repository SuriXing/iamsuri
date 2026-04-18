import { useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { EnterPrompt3D } from './EnterPrompt3D';
import { ROOMS } from '../data/rooms';
import { COLORS, LIGHTS, SHADOW_MAP_SIZE, FOG_DENSITY } from '../constants';
// NOTE: scene.background and scene.fog.color are set imperatively in
// ThemeEffect.tsx; we still mount a default `<color>` / `<fogExp2>` here
// so the very first frame (before the effect runs) isn't a black flash.
import { Ground } from './Ground';
import { RoomFloor } from './RoomFloor';
import { Walls } from './Walls';
import { Ceiling } from './Ceiling';
import { StarField } from './StarField';
import { Particles } from './Particles';
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
import { SpeechBubble3D } from './SpeechBubble3D';
import { useWorldStore } from '../store/worldStore';

const ROOM_LIGHTS: ReadonlyArray<{ pos: [number, number, number]; color: string }> = [
  { pos: [ROOMS[0].center.x, 4, ROOMS[0].center.z], color: '#ffb6c1' },
  { pos: [ROOMS[1].center.x, 4, ROOMS[1].center.z], color: '#60a5fa' },
  { pos: [ROOMS[2].center.x, 4, ROOMS[2].center.z], color: '#4ade80' },
  { pos: [ROOMS[3].center.x, 4, ROOMS[3].center.z], color: '#fbbf24' },
];

const LIGHT_BG = '#f0ede6';

/**
 * Compile every material's shader program ONCE at mount, before the
 * intro zoom starts. Without this, the GPU compiles shaders lazily on
 * first draw call — and with logarithmicDepthBuffer: true on the
 * WebGLRenderer, every fragment shader is rebuilt with a custom depth
 * uniform. That means the first frame stutters for ~1.5s while the GPU
 * compiles ~30 different material variants, exactly when the intro
 * camera tween is playing → the user sees the zoom-in lag.
 *
 * gl.compile(scene, camera) walks the scene graph and forces every
 * material to compile + link its shader program synchronously. After
 * this runs, the next animation frame paints with no compile delay.
 *
 * Placed as a child of the World <group> so it runs AFTER all room
 * meshes have mounted (an effect at the World level would race the
 * children's mount).
 */
function ShaderWarmup() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    // requestAnimationFrame defers compile by one frame so React has
    // committed every child mesh into the scene graph by the time we
    // walk it. Without this, gl.compile() can run before InstancedMesh
    // children have inserted their materials.
    const raf = requestAnimationFrame(() => {
      gl.compile(scene, camera);
    });
    return () => cancelAnimationFrame(raf);
  }, [gl, scene, camera]);
  return null;
}

export function World() {
  const viewMode = useWorldStore((s) => s.viewMode);
  const theme = useWorldStore((s) => s.theme);
  const showLabels = viewMode === 'overview';
  const bgColor = theme === 'light' ? LIGHT_BG : COLORS.bg;
  return (
    <>
      <color attach="background" args={[bgColor]} />
      <fogExp2 attach="fog" args={[bgColor, FOG_DENSITY]} />

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
      {/* Under-ceiling fill lights — at y=1.7, just below the ceiling at y=2.
          Same color per room. The y=4 lights stay (they handle the overview
          camera shot from above). These lights both illuminate the ceiling
          underside (now meshStandardMaterial) and brighten the room interior
          when the camera is inside the room. Intensity tuned so the floor
          brightness stays close to pre-ceiling baseline (just lifts a touch). */}
      {ROOM_LIGHTS.map((l, i) => (
        <pointLight
          key={`under-${i}`}
          position={[l.pos[0], 1.7, l.pos[2]]}
          color={l.color}
          intensity={0.25}
          distance={6}
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
      <Ceiling />

      {/* Hallway */}
      <Hallway />

      {/* Rooms */}
      <MyRoom />
      <ProductRoom />
      <BookRoom />
      <IdeaLab />

      {/* Character */}
      <Character />

      {/* Controllers / managers — invisible, but render null and run logic */}
      <ShaderWarmup />
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
