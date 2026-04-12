import { ROOM, GAP, COLORS, DOOR } from '../constants';
import { Door } from './Door';
import type { RoomId } from '../data/rooms';

const WALL_COLOR = '#3d2817';
const WALL_EMISSIVE = '#6b4e1f';

interface DoorSpec {
  x: number;
  z: number;
  id: RoomId;
  color: string;
}

const HALF = ROOM / 2 + GAP;

const HORIZONTAL_DOORS: ReadonlyArray<DoorSpec> = [
  { x: -HALF, z:  GAP + 0.05, id: 'book',    color: '#4ade80' },
  { x:  HALF, z:  GAP + 0.05, id: 'idealab', color: '#fbbf24' },
  { x: -HALF, z: -(GAP + 0.05), id: 'myroom',  color: COLORS.pink },
  { x:  HALF, z: -(GAP + 0.05), id: 'product', color: '#60a5fa' },
];

interface WallStripProps {
  x: number;
  z: number;
  w: number;
  d: number;
}

function WallStrip({ x, z, w, d }: WallStripProps) {
  return (
    <mesh position={[x, 1.0, z]} castShadow receiveShadow>
      <boxGeometry args={[w, 1.8, d]} />
      <meshPhongMaterial
        color={WALL_COLOR}
        emissive={WALL_EMISSIVE}
        emissiveIntensity={0.15}
        flatShading
      />
    </mesh>
  );
}

export function Walls() {
  // Each horizontal wall splits into 2 segments + door gap
  const segLen = (ROOM + 0.2 - DOOR.width) / 2; // 2.0

  return (
    <group>
      {HORIZONTAL_DOORS.map((d) => (
        <group key={d.id}>
          {/* Left segment */}
          <WallStrip
            x={d.x - DOOR.width / 2 - segLen / 2 - 0.075}
            z={d.z}
            w={segLen}
            d={0.1}
          />
          {/* Right segment */}
          <WallStrip
            x={d.x + DOOR.width / 2 + segLen / 2 + 0.075}
            z={d.z}
            w={segLen}
            d={0.1}
          />
          <Door x={d.x} z={d.z} horizontal={true} roomId={d.id} accentColor={d.color} />
        </group>
      ))}

      {/* Vertical solid dividers (4) */}
      <WallStrip x={GAP + 0.05} z={-HALF} w={0.1} d={ROOM + 0.2} />
      <WallStrip x={-(GAP + 0.05)} z={-HALF} w={0.1} d={ROOM + 0.2} />
      <WallStrip x={GAP + 0.05} z={HALF} w={0.1} d={ROOM + 0.2} />
      <WallStrip x={-(GAP + 0.05)} z={HALF} w={0.1} d={ROOM + 0.2} />
    </group>
  );
}
