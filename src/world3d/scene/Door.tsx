import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DOOR } from '../constants';
import { useWorldStore } from '../store/worldStore';
import type { RoomId } from '../data/rooms';

interface DoorProps {
  x: number;
  z: number;
  horizontal: boolean;
  roomId: RoomId;
  accentColor: string;
}

const FRAME_COLOR = '#6b4e1f';
const FRAME_EMISSIVE = '#4a2c0a';
const PANEL_COLOR = '#4a2c0a';
const LOCK_COLOR = '#ff2244';
const LANTERN_LOCKED_BODY = '#ff5544';
const LANTERN_UNLOCKED_BODY = '#ffd700';
const LANTERN_LOCKED_LIGHT = '#ff6644';
const LANTERN_UNLOCKED_LIGHT = '#ffb366';

export function Door({ x, z, horizontal, roomId, accentColor }: DoorProps) {
  const unlocked = useWorldStore((s) => s.unlockedDoors.has(roomId));
  const hingeRef = useRef<THREE.Group>(null);
  const lockRef = useRef<THREE.Mesh>(null);
  const angleRef = useRef<number>(unlocked ? DOOR.openAngle : 0);

  useFrame(({ clock }, delta) => {
    const target = unlocked ? DOOR.openAngle : 0;
    // Framerate-independent lerp: factor = 1 - exp(-k * delta) where k = hingeLerp * 60.
    const factor = 1 - Math.exp(-DOOR.hingeLerp * 60 * delta);
    angleRef.current += (target - angleRef.current) * factor;
    if (hingeRef.current) hingeRef.current.rotation.y = angleRef.current;
    if (!unlocked && lockRef.current) {
      const mat = lockRef.current.material as THREE.MeshPhongMaterial;
      mat.emissiveIntensity = 2.0 + Math.sin(clock.getElapsedTime() * 3) * 0.8;
    }
  });

  const yMid = DOOR.frameHeight / 2;
  const lanternBodyColor = unlocked ? LANTERN_UNLOCKED_BODY : LANTERN_LOCKED_BODY;
  const lanternLightColor = unlocked ? LANTERN_UNLOCKED_LIGHT : LANTERN_LOCKED_LIGHT;

  // Frame post + lintel positions depend on orientation
  const postLeft: [number, number, number] = horizontal
    ? [x - DOOR.width / 2, yMid, z]
    : [x, yMid, z - DOOR.width / 2];
  const postRight: [number, number, number] = horizontal
    ? [x + DOOR.width / 2, yMid, z]
    : [x, yMid, z + DOOR.width / 2];
  const lintelPos: [number, number, number] = [x, DOOR.frameHeight + 0.02, z];

  const postArgs: [number, number, number] = horizontal
    ? [DOOR.postW, DOOR.frameHeight, 0.18]
    : [0.18, DOOR.frameHeight, DOOR.postW];
  const lintelArgs: [number, number, number] = horizontal
    ? [DOOR.width + DOOR.postW * 2, 0.18, 0.22]
    : [0.22, 0.18, DOOR.width + DOOR.postW * 2];

  // Hinge group anchored at left post
  const hingePos: [number, number, number] = horizontal
    ? [x - DOOR.width / 2, 0, z]
    : [x, 0, z - DOOR.width / 2];

  const panelPos: [number, number, number] = horizontal
    ? [DOOR.width / 2, DOOR.height / 2, 0]
    : [0, DOOR.height / 2, DOOR.width / 2];
  const panelRotY = horizontal ? 0 : Math.PI / 2;

  const handlePos: [number, number, number] = horizontal
    ? [DOOR.width * 0.85, DOOR.height / 2, 0.06]
    : [0.06, DOOR.height / 2, DOOR.width * 0.85];

  return (
    <group>
      {/* Frame posts */}
      <mesh position={postLeft} castShadow receiveShadow>
        <boxGeometry args={postArgs} />
        <meshPhongMaterial color={FRAME_COLOR} emissive={FRAME_EMISSIVE} emissiveIntensity={0.3} flatShading />
      </mesh>
      <mesh position={postRight} castShadow receiveShadow>
        <boxGeometry args={postArgs} />
        <meshPhongMaterial color={FRAME_COLOR} emissive={FRAME_EMISSIVE} emissiveIntensity={0.3} flatShading />
      </mesh>
      {/* Lintel */}
      <mesh position={lintelPos} castShadow receiveShadow>
        <boxGeometry args={lintelArgs} />
        <meshPhongMaterial color={FRAME_COLOR} emissive={FRAME_EMISSIVE} emissiveIntensity={0.3} flatShading />
      </mesh>

      {/* Hinge group with door panel */}
      <group ref={hingeRef} position={hingePos}>
        <mesh position={panelPos} rotation={[0, panelRotY, 0]} castShadow receiveShadow>
          <boxGeometry args={[DOOR.width, DOOR.height, 0.06]} />
          <meshPhongMaterial color={PANEL_COLOR} emissive={accentColor} emissiveIntensity={0.15} flatShading />
        </mesh>
        {/* Accent stripe */}
        <mesh position={panelPos} rotation={[0, panelRotY, 0]}>
          <boxGeometry args={[DOOR.width * 0.8, 0.06, 0.07]} />
          <meshPhongMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.6} flatShading />
        </mesh>
        {/* Knob */}
        <mesh position={handlePos} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.06, 8]} />
          <meshPhongMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.4} flatShading />
        </mesh>
      </group>

      {/* Lock indicator (only when locked) */}
      {!unlocked && (
        <>
          <mesh ref={lockRef} position={[x, DOOR.frameHeight + 0.45, z]}>
            <boxGeometry args={[0.18, 0.18, 0.06]} />
            <meshPhongMaterial color={LOCK_COLOR} emissive={LOCK_COLOR} emissiveIntensity={2.5} flatShading />
          </mesh>
          <mesh position={[x, DOOR.frameHeight + 0.55, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.06, 0.02, 4, 8, Math.PI]} />
            <meshPhongMaterial color={LOCK_COLOR} emissive={LOCK_COLOR} emissiveIntensity={2.5} flatShading />
          </mesh>
        </>
      )}

      {/* Lantern */}
      <mesh position={[x, DOOR.frameHeight + 0.2, z]}>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
        <meshPhongMaterial
          color={lanternBodyColor}
          emissive={lanternBodyColor}
          emissiveIntensity={2.5}
          flatShading
        />
      </mesh>
      <pointLight
        position={[x, DOOR.frameHeight + 0.2, z]}
        color={lanternLightColor}
        intensity={0.7}
        distance={5}
      />
    </group>
  );
}
