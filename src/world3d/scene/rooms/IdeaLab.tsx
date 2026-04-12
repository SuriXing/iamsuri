import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROOM_BY_ID } from '../../data/rooms';
import { FLOOR_Y } from '../../constants';
import type { InteractableData } from '../../store/worldStore';

const IDEA_BOARD_INTERACTABLE: InteractableData = {
  title: 'Idea Board',
  body: 'AI Study Buddy · Debate Trainer · Visual Math. Ideas brewing in the lab.',
};

const MONET = {
  cream:    '#ead9b8',
  lavender: '#b5a7d4',
  dustRose: '#d89cb0',
  sage:     '#9ec79e',
  teal:     '#8fb8c4',
  softBlue: '#9bb0cc',
  willow:   '#7a9d7e',
  peach:    '#e6b89c',
  fringe:   '#c8b78f',
} as const;

interface PatchSpec {
  x: number;
  z: number;
  w: number;
  d: number;
}

const PATCH_SEED: ReadonlyArray<PatchSpec> = [
  { x: -1.7, z: -1.6, w: 0.50, d: 0.36 },
  { x: -0.9, z: -1.8, w: 0.42, d: 0.30 },
  { x:  0.6, z: -1.7, w: 0.55, d: 0.38 },
  { x:  1.6, z: -1.4, w: 0.45, d: 0.32 },
  { x: -1.8, z: -0.4, w: 0.38, d: 0.50 },
  { x: -1.5, z:  0.7, w: 0.55, d: 0.32 },
  { x: -0.5, z:  0.0, w: 0.45, d: 0.42 },
  { x:  0.7, z:  0.4, w: 0.55, d: 0.40 },
  { x:  1.7, z:  0.1, w: 0.40, d: 0.55 },
  { x:  1.5, z:  1.3, w: 0.50, d: 0.38 },
  { x:  0.2, z:  1.7, w: 0.45, d: 0.42 },
  { x: -0.9, z:  1.5, w: 0.52, d: 0.36 },
  { x: -1.8, z:  1.8, w: 0.38, d: 0.44 },
  { x:  1.9, z:  1.9, w: 0.42, d: 0.36 },
  { x:  0.0, z: -0.9, w: 0.48, d: 0.34 },
  { x: -0.3, z:  0.9, w: 0.36, d: 0.50 },
];

const PATCH_COLORS = [
  MONET.lavender,
  MONET.dustRose,
  MONET.sage,
  MONET.teal,
  MONET.softBlue,
  MONET.willow,
  MONET.peach,
];

interface BoardLine {
  c: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const BOARD_LINES: ReadonlyArray<BoardLine> = [
  { c: MONET.lavender, x: -0.85, y: 1.80, w: 0.55, h: 0.06 },
  { c: MONET.lavender, x: -0.65, y: 1.70, w: 0.90, h: 0.05 },
  { c: MONET.dustRose, x: -0.70, y: 1.55, w: 0.70, h: 0.05 },
  { c: MONET.sage,     x: -0.50, y: 1.45, w: 0.80, h: 0.05 },
  { c: MONET.teal,     x:  0.60, y: 1.75, w: 0.60, h: 0.06 },
  { c: MONET.softBlue, x:  0.55, y: 1.62, w: 0.75, h: 0.05 },
  { c: MONET.willow,   x:  0.70, y: 1.48, w: 0.55, h: 0.05 },
  { c: MONET.peach,    x: -0.80, y: 1.00, w: 0.45, h: 0.05 },
  { c: MONET.dustRose, x: -0.55, y: 0.88, w: 0.70, h: 0.05 },
  { c: MONET.lavender, x:  0.55, y: 0.95, w: 0.70, h: 0.05 },
  { c: MONET.sage,     x:  0.70, y: 0.83, w: 0.50, h: 0.05 },
];

const TEA_TABLE_LEGS: ReadonlyArray<readonly [number, number]> = [
  [-0.38, -0.28],
  [0.38, -0.28],
  [-0.38, 0.28],
  [0.38, 0.28],
];

interface CushionProps {
  px: number;
  pz: number;
  color: string;
}

function Cushion({ px, pz, color }: CushionProps) {
  return (
    <group>
      <mesh position={[px, FLOOR_Y + 0.19, pz]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.12, 14]} />
        <meshPhongMaterial color={color} emissive={color} emissiveIntensity={0.22} flatShading />
      </mesh>
      <mesh position={[px, FLOOR_Y + 0.26, pz]}>
        <cylinderGeometry args={[0.34, 0.34, 0.02, 14]} />
        <meshPhongMaterial color="#ffffff" transparent opacity={0.18} flatShading />
      </mesh>
      <mesh position={[px, FLOOR_Y + 0.36, pz + 0.32]} castShadow>
        <boxGeometry args={[0.7, 0.3, 0.18]} />
        <meshPhongMaterial color={color} emissive={color} emissiveIntensity={0.18} flatShading />
      </mesh>
    </group>
  );
}

export function IdeaLab() {
  const { center } = ROOM_BY_ID.idealab;
  const ox = center.x;
  const oz = center.z;
  const bulbRef = useRef<THREE.Mesh>(null);
  const bulbLightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const yOffset = Math.sin(t * 1.2) * 0.1;
    if (bulbRef.current) bulbRef.current.position.y = 2.5 + yOffset;
    if (bulbLightRef.current) {
      bulbLightRef.current.position.y = 2.5 + yOffset;
      bulbLightRef.current.intensity = 0.6 + Math.sin(t * 2) * 0.15;
    }
  });

  return (
    <group>
      {/* Carpet base */}
      <mesh position={[ox, FLOOR_Y + 0.09, oz]} receiveShadow>
        <boxGeometry args={[4.6, 0.03, 4.6]} />
        <meshPhongMaterial color={MONET.cream} emissive={MONET.lavender} emissiveIntensity={0.12} flatShading />
      </mesh>
      {/* Inner ring */}
      <mesh position={[ox, FLOOR_Y + 0.11, oz]} receiveShadow>
        <boxGeometry args={[3.6, 0.015, 3.6]} />
        <meshPhongMaterial
          color={MONET.softBlue}
          emissive={MONET.softBlue}
          emissiveIntensity={0.08}
          transparent
          opacity={0.55}
          flatShading
        />
      </mesh>
      {/* Patches */}
      {PATCH_SEED.map((p, i) => {
        const col = PATCH_COLORS[i % PATCH_COLORS.length];
        return (
          <mesh
            key={i}
            position={[ox + p.x, FLOOR_Y + 0.12, oz + p.z]}
            rotation={[0, (i * 0.37) % Math.PI, 0]}
          >
            <boxGeometry args={[p.w, 0.012, p.d]} />
            <meshPhongMaterial
              color={col}
              emissive={col}
              emissiveIntensity={0.18}
              transparent
              opacity={0.75}
              flatShading
            />
          </mesh>
        );
      })}
      {/* Fringe */}
      {[-2.32, 2.32].map((zOff) => (
        <mesh key={zOff} position={[ox, FLOOR_Y + 0.10, oz + zOff]}>
          <boxGeometry args={[4.6, 0.02, 0.14]} />
          <meshPhongMaterial color={MONET.fringe} emissive={MONET.fringe} emissiveIntensity={0.1} flatShading />
        </mesh>
      ))}

      {/* Whiteboard */}
      <mesh position={[ox, 1.25, oz - 2.08]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 1.7, 0.08]} />
        <meshPhongMaterial color="#8a8a8a" flatShading />
      </mesh>
      <mesh
        position={[ox, 1.25, oz - 2.03]}
        onUpdate={(m) => {
          m.userData.interactable = IDEA_BOARD_INTERACTABLE;
        }}
      >
        <boxGeometry args={[2.4, 1.5, 0.02]} />
        <meshPhongMaterial color="#f5f1e8" flatShading />
      </mesh>
      {/* Board lines */}
      {BOARD_LINES.map((l, i) => (
        <mesh key={i} position={[ox + l.x, l.y, oz - 1.99]}>
          <boxGeometry args={[l.w, l.h, 0.012]} />
          <meshPhongMaterial color={l.c} emissive={l.c} emissiveIntensity={0.6} flatShading />
        </mesh>
      ))}
      {/* Heading bar */}
      <mesh position={[ox, 1.96, oz - 1.99]}>
        <boxGeometry args={[1.6, 0.09, 0.012]} />
        <meshPhongMaterial color={MONET.lavender} emissive={MONET.lavender} emissiveIntensity={0.9} flatShading />
      </mesh>

      {/* Cushions */}
      <Cushion px={ox - 1.4} pz={oz + 0.2} color={MONET.lavender} />
      <Cushion px={ox} pz={oz + 0.6} color={MONET.dustRose} />
      <Cushion px={ox + 1.4} pz={oz + 0.2} color={MONET.sage} />

      {/* Tea table */}
      <mesh position={[ox + 1.5, 0.30, oz - 0.9]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.05, 0.7]} />
        <meshPhongMaterial color={MONET.cream} emissive={MONET.peach} emissiveIntensity={0.15} flatShading />
      </mesh>
      {TEA_TABLE_LEGS.map(([dx, dz], i) => (
        <mesh key={i} position={[ox + 1.5 + dx, 0.14, oz - 0.9 + dz]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.28, 6]} />
          <meshPhongMaterial color="#7a5a3a" flatShading />
        </mesh>
      ))}
      {/* Notebook */}
      <mesh position={[ox + 1.38, 0.355, oz - 0.95]} rotation={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.32, 0.04, 0.24]} />
        <meshPhongMaterial color={MONET.lavender} emissive={MONET.lavender} emissiveIntensity={0.25} flatShading />
      </mesh>
      {/* Pencil */}
      <mesh position={[ox + 1.65, 0.35, oz - 0.82]} rotation={[0, 0.3, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.3, 6]} />
        <meshPhongMaterial color={MONET.peach} flatShading />
      </mesh>
      {/* Prototype */}
      <mesh position={[ox + 1.6, 0.41, oz - 1.05]} castShadow>
        <boxGeometry args={[0.16, 0.16, 0.16]} />
        <meshPhongMaterial color={MONET.teal} emissive={MONET.teal} emissiveIntensity={0.55} flatShading />
      </mesh>
      {/* Teacup */}
      <mesh position={[ox + 1.4, 0.37, oz - 0.78]} castShadow>
        <cylinderGeometry args={[0.06, 0.05, 0.09, 10]} />
        <meshPhongMaterial color="#f5f1e8" flatShading />
      </mesh>
      <mesh position={[ox + 1.4, 0.415, oz - 0.78]}>
        <cylinderGeometry args={[0.05, 0.05, 0.015, 10]} />
        <meshPhongMaterial color={MONET.willow} emissive={MONET.willow} emissiveIntensity={0.3} flatShading />
      </mesh>

      {/* Floating idea bulb */}
      <mesh ref={bulbRef} position={[ox, 2.5, oz + 0.4]}>
        <sphereGeometry args={[0.13, 10, 10]} />
        <meshPhongMaterial color="#ffe28a" emissive="#ffd77a" emissiveIntensity={3.0} flatShading />
      </mesh>
      <pointLight ref={bulbLightRef} position={[ox, 2.5, oz + 0.4]} color="#ffe0a0" intensity={0.7} distance={9} />
    </group>
  );
}
