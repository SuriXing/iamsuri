interface TableWithLegsProps {
  /** Center X. */
  x: number;
  /** Center Z. */
  z: number;
  /** Top Y (the y of the tabletop center). */
  y: number;
  width: number;
  depth: number;
  /** Top thickness. Default 0.08. */
  topThickness?: number;
  /** Leg height (from floor to underside of top). */
  legHeight: number;
  /** Leg thickness (square). Default 0.08. */
  legThickness?: number;
  topColor: string;
  legColor: string;
  /** Inset of legs from corners (positive = inset). Default 0.1. */
  legInset?: number;
  /** Optional emissive on the top. */
  topEmissive?: string;
  topEmissiveIntensity?: number;
}

/**
 * Reusable rectangular table with four corner legs. Used for desks and product tables.
 */
export function TableWithLegs({
  x,
  z,
  y,
  width,
  depth,
  topThickness = 0.08,
  legHeight,
  legThickness = 0.08,
  topColor,
  legColor,
  legInset = 0.1,
  topEmissive,
  topEmissiveIntensity = 0,
}: TableWithLegsProps) {
  const legY = y - topThickness / 2 - legHeight / 2;
  const xOff = width / 2 - legInset;
  const zOff = depth / 2 - legInset;
  const corners: ReadonlyArray<readonly [number, number]> = [
    [-xOff, -zOff],
    [xOff, -zOff],
    [-xOff, zOff],
    [xOff, zOff],
  ];
  return (
    <group>
      <mesh position={[x, y, z]} castShadow receiveShadow>
        <boxGeometry args={[width, topThickness, depth]} />
        <meshPhongMaterial
          color={topColor}
          emissive={topEmissive ?? topColor}
          emissiveIntensity={topEmissive ? topEmissiveIntensity : 0}
          flatShading
        />
      </mesh>
      {corners.map(([dx, dz], i) => (
        <mesh key={i} position={[x + dx, legY, z + dz]} castShadow>
          <boxGeometry args={[legThickness, legHeight, legThickness]} />
          <meshPhongMaterial color={legColor} flatShading />
        </mesh>
      ))}
    </group>
  );
}
