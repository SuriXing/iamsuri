import { GROUND } from '../constants';

export function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND.y, 0]} receiveShadow>
      <planeGeometry args={[GROUND.size, GROUND.size]} />
      <meshPhongMaterial color={GROUND.color} />
    </mesh>
  );
}
