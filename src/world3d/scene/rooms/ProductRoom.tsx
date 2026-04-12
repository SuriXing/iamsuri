import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROOM_BY_ID } from '../../data/rooms';
import type { InteractableData } from '../../store/worldStore';

const TABLE_LEGS: ReadonlyArray<readonly [number, number]> = [
  [-0.8, -0.3],
  [0.8, -0.3],
  [-0.8, 0.3],
  [0.8, 0.3],
];

const PRODUCT_COLORS = ['#e94560', '#ffd700', '#22c55e'];

const PROBLEM_SOLVER: InteractableData = {
  title: 'Problem Solver',
  body: 'Drop your worry in, get help thinking it through.',
  link: 'https://problem-solver.vercel.app',
};
const MENTOR_TABLE: InteractableData = {
  title: 'Mentor Table',
  body: 'Chat with great minds — practice thinking with AI versions of historical figures.',
  link: 'https://mentor-table.vercel.app',
};

interface ScreenStandProps {
  ox: number;
  oz: number;
  side: -1 | 1;
  liveDotRef: React.RefObject<THREE.Mesh | null>;
  interactable: InteractableData;
}

function ScreenStand({ ox, oz, side, liveDotRef, interactable }: ScreenStandProps) {
  const x = ox + 0.9 * side;
  return (
    <group>
      <mesh position={[x, 0.9, oz - 0.3]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 1.4, 0.3]} />
        <meshPhongMaterial color="#cccccc" flatShading />
      </mesh>
      <mesh position={[x, 1.9, oz - 0.3]} castShadow>
        <boxGeometry args={[1.0, 0.7, 0.06]} />
        <meshPhongMaterial color="#222222" flatShading />
      </mesh>
      <mesh
        position={[x, 1.92, oz - 0.27]}
        onUpdate={(m) => {
          m.userData.interactable = interactable;
        }}
      >
        <boxGeometry args={[0.85, 0.55, 0.02]} />
        <meshPhongMaterial color="#112211" emissive="#22c55e" emissiveIntensity={2.5} flatShading />
      </mesh>
      <mesh ref={liveDotRef} position={[x + 0.4, 2.18, oz - 0.25]}>
        <boxGeometry args={[0.06, 0.06, 0.02]} />
        <meshPhongMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={4.0} flatShading />
      </mesh>
    </group>
  );
}

export function ProductRoom() {
  const { center } = ROOM_BY_ID.product;
  const ox = center.x;
  const oz = center.z;
  const dot1Ref = useRef<THREE.Mesh>(null);
  const dot2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const blink = (Math.sin(t * 4) + 1) * 0.5 > 0.5 ? 1 : 0.2;
    [dot1Ref.current, dot2Ref.current].forEach((m) => {
      if (!m) return;
      const mat = m.material as THREE.MeshPhongMaterial;
      mat.emissiveIntensity = 1.5 + blink * 3;
    });
  });

  return (
    <group>
      {/* Stage */}
      <mesh position={[ox, 0.2, oz - 0.3]} castShadow receiveShadow>
        <boxGeometry args={[3.5, 0.15, 2.5]} />
        <meshPhongMaterial color="#1e293b" emissive="#3b82f6" emissiveIntensity={0.08} flatShading />
      </mesh>

      <ScreenStand ox={ox} oz={oz} side={-1} liveDotRef={dot1Ref} interactable={PROBLEM_SOLVER} />
      <ScreenStand ox={ox} oz={oz} side={1} liveDotRef={dot2Ref} interactable={MENTOR_TABLE} />

      {/* Product table */}
      <mesh position={[ox, 0.55, oz + 1.0]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 0.08, 0.8]} />
        <meshPhongMaterial color="#334155" flatShading />
      </mesh>
      {TABLE_LEGS.map(([dx, dz], i) => (
        <mesh key={i} position={[ox + dx, 0.34, oz + 1.0 + dz]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.42, 6]} />
          <meshPhongMaterial color="#555555" flatShading />
        </mesh>
      ))}

      {/* Product cubes */}
      {PRODUCT_COLORS.map((c, i) => (
        <mesh
          key={c}
          position={[ox - 0.5 + i * 0.5, 0.72, oz + 1.0]}
          rotation={[0, (Math.PI / 6) * i, 0]}
          castShadow
        >
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshPhongMaterial color={c} emissive={c} emissiveIntensity={0.4} flatShading />
        </mesh>
      ))}

      {/* Stage glow */}
      <pointLight position={[ox, 0.3, oz]} color="#3b82f6" intensity={0.6} distance={10} />
    </group>
  );
}
