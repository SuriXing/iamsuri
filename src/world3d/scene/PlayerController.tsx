import { useFrame } from '@react-three/fiber';
import { useWorldStore } from '../store/worldStore';
import { useKeyboard } from '../hooks/useKeyboard';
import { SPEEDS, ROOM } from '../constants';
import { ROOM_BY_ID } from '../data/rooms';
import { camAngleRef } from './cameraRefs';

const FP_SPEED = 2.8;
const GROUND_LIMIT = 13;
const ROOM_MARGIN = 0.5;

export function PlayerController(): null {
  const keys = useKeyboard();

  useFrame((_, delta) => {
    const s = useWorldStore.getState();
    if (s.modalInteractable) return; // freeze movement when modal is open
    // Freeze player during view-mode tweens (entering or exiting a room).
    // Without this, the 1s camera blend window lets the player walk out of
    // room geometry (fpActive is false during the tween, so the overview
    // GROUND_LIMIT clamp is used instead of the room clamp).
    if (s.viewTransition !== 'idle') return;
    const dt = Math.min(0.2, delta);

    let mx = 0;
    let mz = 0;
    const k = keys.current;
    if (s.fpActive) {
      // FP convention from legacy: W = +Z (forward into world via -sin/-cos),
      // S = -Z, A = -X, D = +X. We compute (forward,right) from fpYaw below.
      if (k.has('w') || k.has('arrowup')) mz += 1;
      if (k.has('s') || k.has('arrowdown')) mz -= 1;
      if (k.has('a') || k.has('arrowleft')) mx -= 1;
      if (k.has('d') || k.has('arrowright')) mx += 1;
    } else {
      // Overview convention from legacy: W = -Z (north on screen).
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
      // Overview: rotate input by camera angle so WASD matches view.
      const ca = camAngleRef.current;
      const cosA = Math.cos(ca);
      const sinA = Math.sin(ca);
      worldX = cosA * mz + sinA * mx;
      worldZ = sinA * mz - cosA * mx;
    }

    const speed = s.fpActive ? FP_SPEED : SPEEDS.walk;
    let nx = s.charPos.x + worldX * speed * dt;
    let nz = s.charPos.z + worldZ * speed * dt;

    if (s.fpActive && s.viewMode !== 'overview') {
      const rc = ROOM_BY_ID[s.viewMode].center;
      nx = Math.max(rc.x - ROOM / 2 + ROOM_MARGIN, Math.min(rc.x + ROOM / 2 - ROOM_MARGIN, nx));
      nz = Math.max(rc.z - ROOM / 2 + ROOM_MARGIN, Math.min(rc.z + ROOM / 2 - ROOM_MARGIN, nz));
    } else if (!s.fpActive) {
      nx = Math.max(-GROUND_LIMIT, Math.min(GROUND_LIMIT, nx));
      nz = Math.max(-GROUND_LIMIT, Math.min(GROUND_LIMIT, nz));
    }

    s.setCharPos(nx, nz);
    if (!s.fpActive) {
      s.setCharFacing(Math.atan2(worldX, worldZ));
    }
  });

  return null;
}
