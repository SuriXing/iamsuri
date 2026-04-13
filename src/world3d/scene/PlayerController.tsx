import { useFrame } from '@react-three/fiber';
import { useWorldStore } from '../store/worldStore';
import { useKeyboard } from '../hooks/useKeyboard';
import { SPEEDS, ROOM, CHARACTER } from '../constants';
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
      // Follow mode: W moves away from camera, S toward, A/D strafe.
      if (k.has('w') || k.has('arrowup')) mz -= 1;
      if (k.has('s') || k.has('arrowdown')) mz += 1;
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
      // Follow mode. Camera looks toward character FROM yaw direction,
      // so camera-forward = (-sin(yaw), -cos(yaw)). "W" (mz=-1) should
      // move the character in camera-forward. "D" (mx=+1) strafes right
      // relative to that forward.
      //   camera_forward = (-sinY, -cosY)
      //   camera_right   = (cosY, -sinY)
      //   world = forward * (-mz) + right * mx
      //         = (-sinY * -mz + cosY * mx, -cosY * -mz + -sinY * mx)
      //         = (sinY * mz + cosY * mx, cosY * mz - sinY * mx)
      // wait — easier: want W (mz=-1) to give camera_forward = (-sinY, -cosY):
      //   worldX =  sinY * -mz + cosY *  mx = -sinY*mz + cosY*mx
      // Let's derive fresh:
      //   pressing W (mz=-1, mx=0) → move in (-sinY, -cosY) →
      //     worldX = -sinY, worldZ = -cosY
      //   pressing D (mz=0, mx=1) → move in (cosY, -sinY) →
      //     worldX = cosY, worldZ = -sinY
      // So:
      //   worldX = -sinY*mz + cosY*mx  (no — check: W mz=-1 mx=0: -sinY*-1=sinY, not -sinY)
      // Re-derive:
      //   W: mz=-1, mx=0 → need worldX=-sinY, worldZ=-cosY
      //     worldX = sinY*mz        → sinY*-1=-sinY ✓
      //     worldZ = cosY*mz        → cosY*-1=-cosY ✓
      //   D: mz=0, mx=1 → need worldX=cosY, worldZ=-sinY
      //     worldX = sinY*mz + cosY*mx = 0 + cosY = cosY ✓
      //     worldZ = cosY*mz - sinY*mx = 0 - sinY = -sinY ✓
      const yaw = followCamYawRef.current;
      const sinY = Math.sin(yaw);
      const cosY = Math.cos(yaw);
      worldX = sinY * mz + cosY * mx;
      worldZ = cosY * mz - sinY * mx;
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
      const rc = ROOM_BY_ID[s.viewMode].center;
      nx = Math.max(rc.x - ROOM / 2 + ROOM_MARGIN, Math.min(rc.x + ROOM / 2 - ROOM_MARGIN, nx));
      nz = Math.max(rc.z - ROOM / 2 + ROOM_MARGIN, Math.min(rc.z + ROOM / 2 - ROOM_MARGIN, nz));
    } else if (!s.fpActive) {
      nx = Math.max(-GROUND_LIMIT, Math.min(GROUND_LIMIT, nx));
      nz = Math.max(-GROUND_LIMIT, Math.min(GROUND_LIMIT, nz));
    }

    if (nx === curX && nz === curZ) return;

    s.setCharPos(nx, nz);
    // In follow mode, face the direction we actually moved.
    if (!s.fpActive) {
      s.setCharFacing(Math.atan2(nx - curX, nz - curZ));
    }
  });

  return null;
}
