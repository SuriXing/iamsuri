import { useMemo } from 'react';
import { Edges } from '@react-three/drei';
import { makeRng } from '../../util/rand';

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
  /** Color palette for book spines. */
  bookColors: ReadonlyArray<string>;
  /** Whether to render the outer chunky frame box. Default: false. */
  withFrameBox?: boolean;
  /** Color of the outer frame box if enabled. */
  frameBoxColor?: string;
  /** Frame box height. */
  frameBoxHeight?: number;
  /** Frame box vertical center Y. */
  frameBoxY?: number;
  /**
   * Optional deterministic seed. When provided, book colors and heights are
   * scrambled via mulberry32 so no two spines look identical. When omitted,
   * the shelf uses the legacy modulo-based pattern for backward compat.
   */
  seed?: number;
  /**
   * If provided, the first N books (in row-major order) get `<Edges>` outlines
   * for extra pop. Requires `seed` to be meaningful. Default: 0.
   */
  heroBookCount?: number;
  /** Outline color used for hero book Edges. Default '#0a0a14'. */
  edgeColor?: string;
}

interface BookCell {
  row: number;
  col: number;
  color: string;
  height: number;
  isHero: boolean;
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
  seed,
  heroBookCount = 0,
  edgeColor = '#0a0a14',
}: BookshelfProps) {
  const bookSpacing = width / (booksPerRow + 1);
  const bookWidth = bookSpacing * 0.7;
  const bookDepth = depth * 0.75;

  const cells = useMemo<ReadonlyArray<BookCell>>(() => {
    const out: BookCell[] = [];
    const useRng = seed !== undefined;
    const rng = useRng ? makeRng(seed) : null;
    let heroLeft = heroBookCount;
    for (let row = 0; row < rows; row++) {
      for (let b = 0; b < booksPerRow; b++) {
        let colorIdx: number;
        let h: number;
        if (rng) {
          colorIdx = Math.floor(rng() * bookColors.length);
          // Height between 0.18 and 0.32 — visibly varied but still shelf-contained.
          h = 0.18 + rng() * 0.14;
        } else {
          colorIdx = (row * 3 + b) % bookColors.length;
          h = 0.22 + ((row * 5 + b) % 5) * 0.018;
        }
        const isHero = heroLeft > 0;
        if (isHero) heroLeft--;
        out.push({
          row,
          col: b,
          color: bookColors[colorIdx],
          height: h,
          isHero,
        });
      }
    }
    return out;
  }, [rows, booksPerRow, bookColors, seed, heroBookCount]);

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
          <mesh key={`plank-${row}`} position={[x, y, z]} castShadow receiveShadow>
            <boxGeometry args={[width, 0.05, depth]} />
            <meshPhongMaterial color={plankColor} flatShading />
          </mesh>
        );
      })}
      {cells.map((cell) => {
        const y = baseY + cell.row * rowSpacing;
        const bx = x - width / 2 + bookSpacing * (cell.col + 1);
        // Center the book so its bottom rests on the plank top.
        const by = y + 0.025 + cell.height / 2;
        return (
          <mesh key={`book-${cell.row}-${cell.col}`} position={[bx, by, z]} castShadow>
            <boxGeometry args={[bookWidth, cell.height, bookDepth]} />
            <meshPhongMaterial color={cell.color} flatShading />
            {cell.isHero && <Edges color={edgeColor} lineWidth={1.2} />}
          </mesh>
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
