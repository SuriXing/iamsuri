const LANTERN_POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [-1.5, -1.5],
  [1.5, -1.5],
  [-1.5, 1.5],
  [1.5, 1.5],
];

export function HallwayLanterns() {
  return (
    <group>
      {LANTERN_POSITIONS.map(([x, z]) => (
        <group key={`${x},${z}`} position={[x, 0, z]}>
          {/* String */}
          <mesh position={[0, 2.3, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 1.0, 4]} />
            <meshPhongMaterial color="#222222" flatShading />
          </mesh>
          {/* Lantern body */}
          <mesh position={[0, 1.65, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.22, 0.3, 0.22]} />
            <meshPhongMaterial color="#a0522d" flatShading />
          </mesh>
          {/* Lantern glow */}
          <mesh position={[0, 1.65, 0]}>
            <boxGeometry args={[0.16, 0.2, 0.16]} />
            <meshPhongMaterial
              color="#ffe090"
              emissive="#ffe090"
              emissiveIntensity={3.5}
              transparent
              opacity={0.95}
              flatShading
            />
          </mesh>
          {/* Light */}
          <pointLight position={[0, 1.55, 0]} color="#ffcc80" intensity={0.9} distance={6} />
        </group>
      ))}
    </group>
  );
}
