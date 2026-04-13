import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';
import { ROOM, GAP, FLOOR_Y } from '../constants';
import { useWorldStore } from '../store/worldStore';

const HALL_COLOR = '#1e2233';
const HALL_LEN = ROOM * 2 + GAP * 2 + 1;
const HALL_WIDTH = GAP * 2;

// Ceiling beam positions along the hallway Z axis (main axis).
const BEAM_Z: ReadonlyArray<number> = [-4.5, -2.5, -0.5, 1.5, 3.5];
// Crosshatch beams along X axis (cross-corridor).
const BEAM_X: ReadonlyArray<number> = [-4.5, -2.5, 2.5, 4.5];

interface PlantProps {
  x: number;
  z: number;
}

function Plant({ x, z }: PlantProps) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.12, 0.25, 8]} />
        <meshPhongMaterial color="#cc7744" flatShading />
      </mesh>
      <mesh position={[0, 0.38, 0]} receiveShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.03, 8]} />
        <meshPhongMaterial color="#4a3520" flatShading />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <sphereGeometry args={[0.22, 6, 6]} />
        <meshPhongMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.15} flatShading />
      </mesh>
      <mesh position={[0.08, 0.78, 0]} castShadow>
        <sphereGeometry args={[0.15, 6, 6]} />
        <meshPhongMaterial color="#16a34a" emissive="#22c55e" emissiveIntensity={0.1} flatShading />
      </mesh>
      <mesh position={[-0.05, 0.85, 0.05]} castShadow>
        <coneGeometry args={[0.12, 0.25, 6]} />
        <meshPhongMaterial color="#15803d" flatShading />
      </mesh>
    </group>
  );
}

const STEAM_OFFSETS: ReadonlyArray<readonly [number, number, number]> = [
  [-0.05, 0.85, 0],
  [0.03, 0.95, 0],
  [-0.02, 1.05, 0],
];

export function Hallway() {
  const steamRef = useRef<THREE.Group>(null);
  const theme = useWorldStore((s) => s.theme);
  const edgeColor = theme === 'dark' ? '#0a0a14' : '#5a4830';

  useFrame(({ clock }) => {
    const g = steamRef.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    g.children.forEach((child, i) => {
      child.position.y = STEAM_OFFSETS[i][1] + Math.sin(t * 2 + i) * 0.05;
      const mat = (child as THREE.Mesh).material as THREE.MeshPhongMaterial;
      mat.opacity = 0.2 + 0.15 * Math.sin(t * 2 + i);
    });
  });

  return (
    <group>
      {/* Hallway floor cross — F3.19: de-emissived to restore lantern visual authority */}
      <mesh position={[0, FLOOR_Y - 0.02, 0]} receiveShadow>
        <boxGeometry args={[HALL_WIDTH, 0.08, HALL_LEN]} />
        <meshPhongMaterial color={HALL_COLOR} flatShading />
      </mesh>
      <mesh position={[0, FLOOR_Y - 0.02, 0]} receiveShadow>
        <boxGeometry args={[HALL_LEN, 0.08, HALL_WIDTH]} />
        <meshPhongMaterial color={HALL_COLOR} flatShading />
      </mesh>

      {/* Coffee machine */}
      <mesh position={[-1.5, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.6, 0.35]} />
        <meshPhongMaterial color="#222222" flatShading />
      </mesh>
      <mesh position={[-1.5, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.38, 0.1, 0.33]} />
        <meshPhongMaterial color="#333333" flatShading />
      </mesh>
      <mesh position={[-1.5, 0.55, 0.18]}>
        <boxGeometry args={[0.06, 0.06, 0.01]} />
        <meshPhongMaterial color="#e94560" emissive="#e94560" emissiveIntensity={3.0} flatShading />
      </mesh>

      {/* Steam */}
      <group ref={steamRef} position={[-1.5, 0, 0]}>
        {STEAM_OFFSETS.map((p, i) => (
          <mesh key={i} position={[...p]}>
            <boxGeometry args={[0.03, 0.03, 0.03]} />
            <meshPhongMaterial color="#ffffff" transparent opacity={0.3} flatShading />
          </mesh>
        ))}
      </group>

      {/* Plants — intersection corners (2x2) */}
      <Plant x={1.3} z={-0.5} />
      <Plant x={1.5} z={0.6} />
      <Plant x={-1.35} z={0.6} />
      <Plant x={-1.35} z={-0.55} />

      {/* Runner strip (long narrow rug between corridor doors) — F3.19: de-emissived */}
      <mesh position={[0, FLOOR_Y + 0.005, 2.2]} receiveShadow>
        <boxGeometry args={[0.55, 0.01, 3.0]} />
        <meshPhongMaterial color="#6b3216" flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[0, FLOOR_Y + 0.005, -2.2]} receiveShadow>
        <boxGeometry args={[0.55, 0.01, 3.0]} />
        <meshPhongMaterial color="#6b3216" flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>

      {/* ----- CEILING BEAM TRIM (crosshatch planks along hallway axes) ----- */}
      {/* Main beams along Z — span hallway width */}
      {BEAM_Z.map((z) => (
        <mesh key={`beamZ-${z}`} position={[0, 2.92, z]} castShadow>
          <boxGeometry args={[HALL_WIDTH + 0.1, 0.1, 0.12]} />
          <meshPhongMaterial color="#3a2510" flatShading />
          <Edges color={edgeColor} lineWidth={1} />
        </mesh>
      ))}
      {/* Cross beams along X — span cross-corridor width */}
      {BEAM_X.map((x) => (
        <mesh key={`beamX-${x}`} position={[x, 2.92, 0]} castShadow>
          <boxGeometry args={[0.12, 0.1, HALL_WIDTH + 0.1]} />
          <meshPhongMaterial color="#3a2510" flatShading />
          <Edges color={edgeColor} lineWidth={1} />
        </mesh>
      ))}
      {/* Center cross-join cap (darker hub) */}
      <mesh position={[0, 2.96, 0]}>
        <boxGeometry args={[0.28, 0.04, 0.28]} />
        <meshPhongMaterial color="#241608" flatShading />
      </mesh>

      {/* Rug — F3.19/F3.21: both layers neutral to let lanterns own the warm glow band */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[1.8, 0.02, 1.0]} />
        <meshPhongMaterial color="#8B4513" flatShading />
      </mesh>
      <mesh position={[0, 0.14, 0]} receiveShadow>
        <boxGeometry args={[1.4, 0.01, 0.6]} />
        <meshPhongMaterial color="#a0522d" flatShading />
      </mesh>

      {/* Ceiling light strips (cross pattern) */}
      {[-3, 0, 3].map((z) => (
        <mesh key={`hz-${z}`} position={[0, 2.8, z]}>
          <boxGeometry args={[0.6, 0.04, 0.1]} />
          <meshPhongMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.8} flatShading />
        </mesh>
      ))}
      {[-3, 0, 3].map((x) => (
        <mesh key={`vx-${x}`} position={[x, 2.8, 0]}>
          <boxGeometry args={[0.1, 0.04, 0.6]} />
          <meshPhongMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.8} flatShading />
        </mesh>
      ))}
    </group>
  );
}
