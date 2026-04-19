import * as THREE from 'three';
import { COLORS } from '../constants';
import { useWorldStore } from '../store/worldStore';

/**
 * Skybox — opaque horizontal sky-cap plane that occludes the StarField
 * for any ray escaping the closed-volume rooms upward.
 *
 * Why a horizontal plane and not a true 6-sided box:
 *   - Rooms extend to ~±6 in XZ; we need the occluder to enclose the
 *     world horizontally → must be at least ±15 in XZ.
 *   - StarField is at y∈[5,30] with XZ spread ±30 — i.e. INSIDE any
 *     plausible enclosing box. So a closed box won't sit between the
 *     camera and the stars; stars draw on top regardless.
 *   - The actual line of attack for "look-up sees stars" is purely
 *     UPWARD escape rays through ceiling gaps. A horizontal cap at
 *     y=4.5 (above any room ceiling at y=2.05, below STARS.yMin=5)
 *     intercepts every upward ray before it can reach a star.
 *
 * Visibility direction: BackSide on a horizontal plane with default +Y
 * normal renders only when viewed from BELOW (camera below the plane
 * looking up). The overview-mode camera at y=20 sits ABOVE the cap and
 * sees the FrontSide → culled → cap is invisible from above, rooms
 * remain visible in the establishing shot.
 *
 * Render order -1 + depthWrite (default true) lets the cap paint into
 * the depth buffer first; the StarField's additive points (drawn later
 * with depthWrite=false) then depth-test against the cap and fail
 * because their world-space depth is GREATER than the cap depth from
 * any below-cap camera viewpoint.
 *
 * No fog (`fog={false}`) keeps the cap at the exact bg color regardless
 * of distance — otherwise a distant cap fragment fades and creates a
 * visible "horizon" line where it meets the actual scene background.
 */
const LIGHT_BG = '#f0ede6';
const SKY_CAP_Y = 4.5;
const SKY_CAP_SIZE = 200;

export function Skybox() {
  const theme = useWorldStore((s) => s.theme);
  const color = theme === 'light' ? LIGHT_BG : COLORS.bg;
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, SKY_CAP_Y, 0]}
      renderOrder={-1}
    >
      <planeGeometry args={[SKY_CAP_SIZE, SKY_CAP_SIZE]} />
      <meshBasicMaterial color={color} side={THREE.BackSide} fog={false} />
    </mesh>
  );
}
