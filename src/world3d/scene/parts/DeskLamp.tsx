interface DeskLampProps {
  /** Base X (lamp foot). */
  x: number;
  /** Base Y (top of desk surface). */
  y: number;
  /** Base Z. */
  z: number;
  /** Glow color (head + light). */
  color: string;
  /** Cool/warm tone for the point light, defaults to color. */
  lightColor?: string;
  /** Light intensity. Default 1.0. */
  intensity?: number;
  /** Light distance. Default 6. */
  distance?: number;
  /** Body color (foot + arm). Default off-white. */
  bodyColor?: string;
}

/**
 * Reusable desk-lamp combo: foot + arm + emissive head + warm point light.
 */
export function DeskLamp({
  x,
  y,
  z,
  color,
  lightColor,
  intensity = 1.0,
  distance = 6,
  bodyColor = '#e8e8e8',
}: DeskLampProps) {
  return (
    <group>
      {/* Foot */}
      <mesh position={[x, y + 0.04, z]}>
        <cylinderGeometry args={[0.1, 0.13, 0.05, 8]} />
        <meshPhongMaterial color={bodyColor} flatShading />
      </mesh>
      {/* Arm */}
      <mesh position={[x, y + 0.26, z]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
        <meshPhongMaterial color={bodyColor} flatShading />
      </mesh>
      {/* Head */}
      <mesh position={[x, y + 0.5, z]}>
        <boxGeometry args={[0.16, 0.08, 0.12]} />
        <meshPhongMaterial color={color} emissive={color} emissiveIntensity={1.8} flatShading />
      </mesh>
      <pointLight
        position={[x, y + 0.4, z]}
        color={lightColor ?? color}
        intensity={intensity}
        distance={distance}
      />
    </group>
  );
}
