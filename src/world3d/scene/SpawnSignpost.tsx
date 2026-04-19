import { Html } from '@react-three/drei';
import { Edges } from '@react-three/drei';
import { ROOMS } from '../data/rooms';
import { useWorldStore } from '../store/worldStore';

// 4-direction floating sign post at the hallway intersection (0, 0).
// Hidden once the player enters a room (viewMode !== 'overview').
//
// Each arm is a short wood post + an Html plaque billboarded toward the
// camera, sized via distanceFactor so the labels stay readable up close
// and shrink at distance — matches the existing room-label pattern in
// World.tsx but anchored at spawn instead of per-room.

const POST_HEIGHT = 2.2;
const PLAQUE_Y = 1.7;
const ARM_LENGTH = 0.55;
const POST_COLOR = '#4a3018';
const POST_CAP_COLOR = '#6b4423';

// Direction unit vectors per room — looked up by signed center coords
// rather than hard-coded so the signpost auto-tracks any room layout
// change in rooms.ts.
function arm(centerX: number, centerZ: number): [number, number] {
  const sx = Math.sign(centerX);
  const sz = Math.sign(centerZ);
  return [sx * ARM_LENGTH, sz * ARM_LENGTH];
}

export function SpawnSignpost() {
  const viewMode = useWorldStore((s) => s.viewMode);
  if (viewMode !== 'overview') return null;

  return (
    <group position={[0, 0, 0]}>
      {/* Vertical post */}
      <mesh position={[0, POST_HEIGHT / 2, 0]}>
        <boxGeometry args={[0.12, POST_HEIGHT, 0.12]} />
        <meshPhongMaterial color={POST_COLOR} flatShading />
        <Edges color="#0a0a14" lineWidth={1} />
      </mesh>
      {/* Cap */}
      <mesh position={[0, POST_HEIGHT + 0.05, 0]}>
        <boxGeometry args={[0.22, 0.1, 0.22]} />
        <meshPhongMaterial color={POST_CAP_COLOR} flatShading />
        <Edges color="#0a0a14" lineWidth={1} />
      </mesh>

      {/* Per-room arms + plaques */}
      {ROOMS.map((r) => {
        const [ax, az] = arm(r.center.x, r.center.z);
        return (
          <group key={r.id}>
            {/* Short wood arm pointing toward room */}
            <mesh position={[ax * 0.5, PLAQUE_Y, az * 0.5]}>
              <boxGeometry args={[Math.abs(ax) + 0.06, 0.04, Math.abs(az) + 0.06]} />
              <meshPhongMaterial color={POST_CAP_COLOR} flatShading />
            </mesh>
            {/* Accent color bar — slim plank below the plaque */}
            <mesh position={[ax, PLAQUE_Y - 0.13, az]}>
              <boxGeometry args={[0.42, 0.03, 0.06]} />
              <meshPhongMaterial
                color={r.accentColor}
                emissive={r.accentColor}
                emissiveIntensity={0.5}
                flatShading
              />
            </mesh>
            {/* DOM plaque — billboards via drei Html, shrinks at distance */}
            <Html
              position={[ax, PLAQUE_Y, az]}
              center
              distanceFactor={6}
              zIndexRange={[12, 0]}
              pointerEvents="none"
            >
              <div
                className="spawn-sign-plaque"
                style={{
                  background: 'rgba(20, 14, 10, 0.88)',
                  border: `2px solid ${r.accentColor}`,
                  color: r.accentColor,
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '15px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.55)',
                  textShadow: `0 0 8px ${r.accentColor}66`,
                }}
              >
                {r.label}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
