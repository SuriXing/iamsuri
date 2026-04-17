import { GROUND } from '../constants';
import { useWorldStore } from '../store/worldStore';

const GROUND_LIGHT = '#d4cfc4';

export function Ground() {
  const theme = useWorldStore((s) => s.theme);
  const color = theme === 'light' ? GROUND_LIGHT : GROUND.color;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND.y, 0]}>
      <planeGeometry args={[GROUND.size, GROUND.size]} />
      <meshPhongMaterial color={color} />
    </mesh>
  );
}
