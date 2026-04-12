import { ROOM_BY_ID } from '../../data/rooms';
import { Bookshelf } from '../parts/Bookshelf';
import { DeskLamp } from '../parts/DeskLamp';
import type { InteractableData } from '../../store/worldStore';

const HEADBOARD_INTERACTABLE: InteractableData = {
  title: 'My Bed',
  body: 'A cozy corner. Sometimes the best ideas come right before sleep.',
};
const MONITOR_INTERACTABLE: InteractableData = {
  title: 'About Suri',
  body: 'Suri Xing, Grade 8 — Math · Design · Debate · Building. Check back for more.',
};

const PINK = '#f4a8b8';
const PINK_SOFT = '#f8c4d0';
const PINK_DARK = '#d87890';
const WHITE = '#f8f8f8';
const WHITE_OFF = '#e8e8e8';
const WOOD = '#6b4423';
const SHELF_BACK = '#4a3018';

const BED_LEGS: ReadonlyArray<readonly [number, number]> = [
  [-0.7, -0.95],
  [0.7, -0.95],
  [-0.7, 0.95],
  [0.7, 0.95],
];

const DESK_LEGS: ReadonlyArray<readonly [number, number]> = [
  [-0.6, -0.7],
  [0.6, -0.7],
  [-0.6, 0.7],
  [0.6, 0.7],
];

const SHELF_BOOK_COLORS: ReadonlyArray<string> = ['#e94560', '#3b82f6', '#f4a8b8', '#f8c4d0', '#ffd700'];

export function MyRoom() {
  const { center } = ROOM_BY_ID.myroom;
  const ox = center.x;
  const oz = center.z;
  const bedX = ox - 1.0;
  const bedZ = oz - 0.3;
  const deskX = ox + 1.0;
  const deskZ = oz - 0.3;
  const shelfX = ox - 0.1;
  const shelfZ = oz - 1.7;

  return (
    <group>
      {/* Bed frame */}
      <mesh position={[bedX, 0.18, bedZ]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.25, 2.1]} />
        <meshPhongMaterial color={WOOD} flatShading />
      </mesh>
      {/* Mattress */}
      <mesh position={[bedX, 0.42, bedZ]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.2, 2.0]} />
        <meshPhongMaterial color={PINK} emissive={PINK} emissiveIntensity={0.12} flatShading />
      </mesh>
      {/* Sheet */}
      <mesh position={[bedX, 0.55, bedZ + 0.25]} castShadow>
        <boxGeometry args={[1.42, 0.05, 1.4]} />
        <meshPhongMaterial color={PINK_DARK} emissive={PINK_DARK} emissiveIntensity={0.08} flatShading />
      </mesh>
      {/* Pillows */}
      <mesh position={[bedX - 0.3, 0.58, bedZ - 0.75]} rotation={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.55, 0.13, 0.35]} />
        <meshPhongMaterial color={PINK_SOFT} emissive={PINK_SOFT} emissiveIntensity={0.1} flatShading />
      </mesh>
      <mesh position={[bedX + 0.3, 0.58, bedZ - 0.75]} rotation={[0, -0.05, 0]} castShadow>
        <boxGeometry args={[0.55, 0.13, 0.35]} />
        <meshPhongMaterial color={PINK_SOFT} emissive={PINK_SOFT} emissiveIntensity={0.1} flatShading />
      </mesh>
      {/* Headboard */}
      <mesh
        position={[bedX, 0.65, bedZ - 1.05]}
        castShadow
        receiveShadow
        onUpdate={(m) => {
          m.userData.interactable = HEADBOARD_INTERACTABLE;
        }}
      >
        <boxGeometry args={[1.5, 0.7, 0.12]} />
        <meshPhongMaterial color={WOOD} flatShading />
      </mesh>
      {/* Bed legs */}
      {BED_LEGS.map(([dx, dz], i) => (
        <mesh key={i} position={[bedX + dx, 0.09, bedZ + dz]} castShadow>
          <boxGeometry args={[0.08, 0.18, 0.08]} />
          <meshPhongMaterial color={WOOD} flatShading />
        </mesh>
      ))}

      {/* Desk top */}
      <mesh position={[deskX, 0.78, deskZ]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.08, 1.6]} />
        <meshPhongMaterial color={WHITE} emissive={WHITE} emissiveIntensity={0.05} flatShading />
      </mesh>
      {/* Desk legs */}
      {DESK_LEGS.map(([dx, dz], i) => (
        <mesh key={i} position={[deskX + dx, 0.37, deskZ + dz]} castShadow>
          <boxGeometry args={[0.08, 0.74, 0.08]} />
          <meshPhongMaterial color={WHITE_OFF} flatShading />
        </mesh>
      ))}
      {/* Drawer */}
      <mesh position={[deskX, 0.6, deskZ + 0.5]} castShadow>
        <boxGeometry args={[1.3, 0.18, 0.5]} />
        <meshPhongMaterial color={WHITE_OFF} flatShading />
      </mesh>
      {/* Drawer handle */}
      <mesh position={[deskX, 0.6, deskZ + 0.78]}>
        <boxGeometry args={[0.2, 0.03, 0.04]} />
        <meshPhongMaterial color="#c0a060" flatShading />
      </mesh>

      {/* Monitor frame */}
      <mesh position={[deskX, 1.2, deskZ - 0.5]} castShadow>
        <boxGeometry args={[1.0, 0.65, 0.06]} />
        <meshPhongMaterial color="#eeeeee" flatShading />
      </mesh>
      {/* Screen */}
      <mesh
        position={[deskX, 1.22, deskZ - 0.47]}
        onUpdate={(m) => {
          m.userData.interactable = MONITOR_INTERACTABLE;
        }}
      >
        <boxGeometry args={[0.85, 0.5, 0.02]} />
        <meshPhongMaterial color="#1a1a3e" emissive="#ffb6c1" emissiveIntensity={1.2} flatShading />
      </mesh>
      {/* Stand */}
      <mesh position={[deskX, 0.96, deskZ - 0.45]}>
        <boxGeometry args={[0.08, 0.32, 0.08]} />
        <meshPhongMaterial color={WHITE_OFF} flatShading />
      </mesh>
      {/* Base */}
      <mesh position={[deskX, 0.82, deskZ - 0.45]}>
        <boxGeometry args={[0.32, 0.04, 0.18]} />
        <meshPhongMaterial color={WHITE_OFF} flatShading />
      </mesh>
      {/* Scanline (static for now) */}
      <mesh position={[deskX, 1.22, deskZ - 0.45]}>
        <boxGeometry args={[0.8, 0.02, 0.01]} />
        <meshPhongMaterial color="#ffd0e0" emissive="#ffd0e0" emissiveIntensity={2.0} flatShading />
      </mesh>

      {/* Notebook + pen */}
      <mesh position={[deskX - 0.4, 0.82, deskZ + 0.1]} rotation={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.4, 0.04, 0.3]} />
        <meshPhongMaterial color={PINK_SOFT} emissive={PINK_SOFT} emissiveIntensity={0.1} flatShading />
      </mesh>
      <mesh position={[deskX - 0.1, 0.82, deskZ + 0.05]} rotation={[0, 0.3, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.3, 6]} />
        <meshPhongMaterial color="#ffd700" flatShading />
      </mesh>

      {/* Desk lamp */}
      <DeskLamp
        x={deskX + 0.5}
        y={0.82}
        z={deskZ - 0.3}
        color="#ffd700"
        lightColor="#ffd6a8"
        intensity={1.0}
        distance={6}
        bodyColor={WHITE_OFF}
      />

      {/* Bookshelf */}
      <Bookshelf
        x={shelfX}
        z={shelfZ}
        rows={3}
        booksPerRow={4}
        width={1.2}
        depth={0.3}
        rowSpacing={0.5}
        baseY={0.45}
        backPanelColor={SHELF_BACK}
        plankColor={WOOD}
        bookColors={SHELF_BOOK_COLORS}
      />

      {/* Pink rug */}
      <mesh position={[bedX, 0.13, bedZ + 0.7]} receiveShadow>
        <boxGeometry args={[1.7, 0.02, 1.4]} />
        <meshPhongMaterial
          color={PINK_SOFT}
          emissive={PINK_SOFT}
          emissiveIntensity={0.15}
          transparent
          opacity={0.6}
          flatShading
        />
      </mesh>

      {/* Tiny potted plant on desk */}
      <mesh position={[deskX - 0.5, 0.87, deskZ - 0.3]}>
        <cylinderGeometry args={[0.07, 0.06, 0.1, 8]} />
        <meshPhongMaterial color="#c06850" flatShading />
      </mesh>
      <mesh position={[deskX - 0.5, 0.99, deskZ - 0.3]}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshPhongMaterial color="#4ade80" emissive="#22c55e" emissiveIntensity={0.15} flatShading />
      </mesh>
    </group>
  );
}
