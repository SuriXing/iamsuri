import { useFrame } from '@react-three/fiber';
import { useWorldStore } from '../store/worldStore';
import { useKeyboard } from '../hooks/useKeyboard';
import { SPEEDS, ROOM, CHARACTER, DOOR } from '../constants';
import { ROOM_BY_ID } from '../data/rooms';
import { followCamYawRef } from './cameraRefs';
import { hitTest } from './colliders';

const FP_SPEED = 2.8;
const GROUND_LIMIT = 13;
const ROOM_MARGIN = 0.35;

/**
 * Translates WASD/arrow input into character movement.
 *
 * Movement model:
 *   - In follow mode (default gameplay): input is camera-relative. Since
 *     the follow camera sits behind the character, W always walks "into
 *     the screen". The character faces the direction of motion and the
 *     camera chases it via CameraController.
 *   - In first-person mode: input is character-yaw-relative via fpYaw.
 *
 * Movement is frozen during: the intro sequence (static / zoom / dialogue),
 * any in-progress room tween, and while the interact modal is open.
 */
export function PlayerController(): null {
  const keys = useKeyboard();

  useFrame((_, delta) => {
    const s = useWorldStore.getState();
    if (s.modalInteractable) return;
    if (s.viewTransition !== 'idle') return;
    // Freeze movement until the intro finishes and the user clicks Next.
    if (s.introPhase !== 'follow') return;

    const dt = Math.min(0.2, delta);

    let mx = 0;
    let mz = 0;
    const k = keys.current;
    if (s.fpActive) {
      if (k.has('w') || k.has('arrowup')) mz += 1;
      if (k.has('s') || k.has('arrowdown')) mz -= 1;
      if (k.has('a') || k.has('arrowleft')) mx -= 1;
      if (k.has('d') || k.has('arrowright')) mx += 1;
    } else {
      // Follow mode input convention:
      //   mz > 0 = forward (in the direction the camera is looking)
      //   mx > 0 = right (camera right)
      // Up / W → forward. Down / S → back. Left / A → left. Right / D → right.
      if (k.has('w') || k.has('arrowup')) mz += 1;
      if (k.has('s') || k.has('arrowdown')) mz -= 1;
      if (k.has('a') || k.has('arrowleft')) mx -= 1;
      if (k.has('d') || k.has('arrowright')) mx += 1;
    }
    if (mx === 0 && mz === 0) return;

    const len = Math.hypot(mx, mz);
    mx /= len;
    mz /= len;

    let worldX: number;
    let worldZ: number;
    if (s.fpActive) {
      // forward = (-sin(yaw), -cos(yaw)); right = (cos(yaw), -sin(yaw))
      const sinY = Math.sin(s.fpYaw);
      const cosY = Math.cos(s.fpYaw);
      worldX = -sinY * mz + cosY * mx;
      worldZ = -cosY * mz - sinY * mx;
    } else {
      // Follow mode.
      //
      // Three.js camera convention: when the camera looks toward +Z (yaw
      // = 0), its local +X (the right side of the screen) points to world
      // -X. This is because the default camera looks down -Z, so rotating
      // 180° to face +Z flips the right axis. Verified empirically.
      //
      //   camera_forward = (sin(yaw), cos(yaw))     — W / ↑
      //   camera_right   = (-cos(yaw), sin(yaw))    — D / →   ← note minus
      //
      //   world = forward * mz + right * mx
      //
      // Check @ yaw=0 (camera at -Z behind char, looking toward +Z):
      //   W (mz=1, mx=0) → (0, 1)   +Z, "into the screen"           ✓
      //   D (mz=0, mx=1) → (-1, 0)  -X, screen-right                 ✓
      //   A (mz=0, mx=-1) → (1, 0)  +X, screen-left                  ✓
      //   S (mz=-1, mx=0) → (0, -1) -Z, back toward camera           ✓
      const yaw = followCamYawRef.current;
      const sinY = Math.sin(yaw);
      const cosY = Math.cos(yaw);
      worldX = sinY * mz - cosY * mx;
      worldZ = cosY * mz + sinY * mx;
    }

    const speed = s.fpActive ? FP_SPEED : SPEEDS.walk;
    const radius = CHARACTER.colliderRadius;

    const curX = s.charPos.x;
    const curZ = s.charPos.z;
    let nx = curX + worldX * speed * dt;
    let nz = curZ + worldZ * speed * dt;

    // Per-axis collision so the player slides along walls.
    if (hitTest(nx, curZ, radius)) nx = curX;
    if (hitTest(nx, nz, radius)) nz = curZ;

    if (s.fpActive && s.viewMode !== 'overview') {
      const room = ROOM_BY_ID[s.viewMode];
      const rc = room.center;
      // Door span on the perpendicular axis — within this span we OPEN
      // the room clamp on the door's normal axis so the player can walk
      // back out through the doorway. Outside the span the wall clamp
      // stays in force (the wall is solid there). Door normal axis is
      // whichever axis has |door − center| > 0.
      const doorDx = room.door.x - rc.x;
      const doorDz = room.door.z - rc.z;
      const doorIsZAxis = Math.abs(doorDz) > Math.abs(doorDx);
      const halfSpan = DOOR.width / 2 + CHARACTER.colliderRadius;
      let clampMinX = rc.x - ROOM / 2 + ROOM_MARGIN;
      let clampMaxX = rc.x + ROOM / 2 - ROOM_MARGIN;
      let clampMinZ = rc.z - ROOM / 2 + ROOM_MARGIN;
      let clampMaxZ = rc.z + ROOM / 2 - ROOM_MARGIN;
      if (doorIsZAxis) {
        // Door is on +z or -z wall. Within ±halfSpan of door.x, allow
        // the player to cross the door's z-edge (extra halfSpan beyond
        // the wall) so they can walk back into the hallway.
        if (Math.abs(nx - room.door.x) < halfSpan) {
          if (doorDz > 0) clampMaxZ += halfSpan + ROOM_MARGIN;
          else clampMinZ -= halfSpan + ROOM_MARGIN;
        }
      } else {
        if (Math.abs(nz - room.door.z) < halfSpan) {
          if (doorDx > 0) clampMaxX += halfSpan + ROOM_MARGIN;
          else clampMinX -= halfSpan + ROOM_MARGIN;
        }
      }
      nx = Math.max(clampMinX, Math.min(clampMaxX, nx));
      nz = Math.max(clampMinZ, Math.min(clampMaxZ, nz));
    } else if (!s.fpActive) {
      nx = Math.max(-GROUND_LIMIT, Math.min(GROUND_LIMIT, nx));
      nz = Math.max(-GROUND_LIMIT, Math.min(GROUND_LIMIT, nz));
    }

    if (nx === curX && nz === curZ) return;

    s.setCharPos(nx, nz);
    // Character facing is intentionally NOT updated in follow mode so
    // the avatar doesn't spin around on direction changes (and so the
    // camera, which is locked to followCamYawRef, doesn't drift).
    // Down/back is a true reverse step — character walks backwards
    // while still facing the camera-forward direction.
  });

  return null;
}
