interface BookshelfProps {
  /** Center X of the shelf in world space. */
  x: number;
  /** Center Z of the shelf in world space. */
  z: number;
  /** Number of horizontal shelves (planks). */
  rows: number;
  /** Books per row. */
  booksPerRow: number;
  /** Width of the shelf (X axis). */
  width: number;
  /** Depth of the shelf (Z axis). */
  depth: number;
  /** Vertical gap between shelves. */
  rowSpacing: number;
  /** Y of the lowest plank. */
  baseY: number;
  /** Optional back panel. Pass null to skip. */
  backPanelColor?: string | null;
  /** Color of the wooden frame planks. */
  plankColor: string;
  /** Color cycle for book spines. */
  bookColors: ReadonlyArray<string>;
  /** Whether to render the outer chunky frame box. Default: false. */
  withFrameBox?: boolean;
  /** Color of the outer frame box if enabled. */
  frameBoxColor?: string;
  /** Frame box height. */
  frameBoxHeight?: number;
  /** Frame box vertical center Y. */
  frameBoxY?: number;
}

/**
 * Reusable bookshelf primitive used by MyRoom and BookRoom.
 * Renders horizontal planks + colored book spines + an optional back panel
 * + an optional outer wood frame box.
 */
export function Bookshelf({
  x,
  z,
  rows,
  booksPerRow,
  width,
  depth,
  rowSpacing,
  baseY,
  backPanelColor = null,
  plankColor,
  bookColors,
  withFrameBox = false,
  frameBoxColor,
  frameBoxHeight,
  frameBoxY,
}: BookshelfProps) {
  const bookSpacing = width / (booksPerRow + 1);
  const bookWidth = bookSpacing * 0.7;
  const bookDepth = depth * 0.75;
  return (
    <group>
      {withFrameBox && frameBoxColor !== undefined && frameBoxHeight !== undefined && frameBoxY !== undefined && (
        <mesh position={[x, frameBoxY, z]} castShadow receiveShadow>
          <boxGeometry args={[width + 0.1, frameBoxHeight, depth + 0.05]} />
          <meshPhongMaterial color={frameBoxColor} flatShading />
        </mesh>
      )}
      {Array.from({ length: rows }, (_, row) => {
        const y = baseY + row * rowSpacing;
        return (
          <group key={row}>
            <mesh position={[x, y, z]} castShadow receiveShadow>
              <boxGeometry args={[width, 0.05, depth]} />
              <meshPhongMaterial color={plankColor} flatShading />
            </mesh>
            {Array.from({ length: booksPerRow }, (_, b) => {
              const colorIdx = (row * 3 + b) % bookColors.length;
              const h = 0.22 + ((row * 5 + b) % 5) * 0.018;
              return (
                <mesh
                  key={b}
                  position={[
                    x - width / 2 + bookSpacing * (b + 1),
                    y + 0.16,
                    z,
                  ]}
                  castShadow
                >
                  <boxGeometry args={[bookWidth, h, bookDepth]} />
                  <meshPhongMaterial color={bookColors[colorIdx]} flatShading />
                </mesh>
              );
            })}
          </group>
        );
      })}
      {backPanelColor !== null && (
        <mesh position={[x, baseY + (rows * rowSpacing) / 2, z - depth / 2 - 0.02]} receiveShadow>
          <boxGeometry args={[width + 0.05, rows * rowSpacing + 0.1, 0.04]} />
          <meshPhongMaterial color={backPanelColor} flatShading />
        </mesh>
      )}
    </group>
  );
}
