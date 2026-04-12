import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useWorldStore } from '../store/worldStore';
import { usePointerLock } from '../hooks/usePointerLock';
import { ROOMS } from '../data/rooms';
import type { RoomId } from '../data/rooms';

const ROOM_NUMBER_KEYS: Record<string, RoomId> = {
  '1': 'myroom',
  '2': 'product',
  '3': 'book',
  '4': 'idealab',
};
const PROXIMITY_THRESHOLD = 2.6;

/**
 * Centralized keyboard handler + proximity detection for the overworld.
 *
 * - U near a locked door → unlock
 * - E near an unlocked door → enter the room
 * - 1/2/3/4 → direct jump to a room (only if unlocked)
 * - E in FP mode → open focused interactable
 * - Escape → close modal, otherwise exit room to overview
 *
 * Pointer lock for the canvas is wired here too — kept colocated so the
 * canvas element comes from the same `useThree` instance.
 */
export function InteractionManager(): null {
  const { gl } = useThree();
  usePointerLock(gl.domElement);

  // ── Keyboard ────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      const s = useWorldStore.getState();

      // When a modal is open, only Escape is allowed. Number keys / U / E
      // must not fire a room jump or unlock while the modal has focus.
      if (s.modalInteractable) {
        if (e.key === 'Escape') s.closeModal();
        return;
      }

      if (e.key === 'Escape') {
        if (s.viewMode !== 'overview') {
          s.setViewMode('overview');
          return;
        }
        return;
      }

      const key = e.key.toLowerCase();

      // FP mode: E opens focused interactable
      if (s.fpActive && key === 'e') {
        if (s.focusedInteractable) {
          s.openModal(s.focusedInteractable);
        }
        return;
      }

      if (s.viewMode === 'overview' && !s.fpActive) {
        // U: unlock the nearby door
        if (key === 'u' && s.nearbyRoom && !s.unlockedDoors.has(s.nearbyRoom)) {
          s.unlockDoor(s.nearbyRoom);
          return;
        }
        // E / Enter: enter nearby room (if unlocked)
        if ((key === 'e' || e.key === 'Enter') && s.nearbyRoom) {
          if (!s.unlockedDoors.has(s.nearbyRoom)) return;
          s.setViewMode(s.nearbyRoom);
          return;
        }
        // Number keys: direct jump (only if unlocked)
        const direct = ROOM_NUMBER_KEYS[e.key];
        if (direct) {
          if (!s.unlockedDoors.has(direct)) return;
          s.setViewMode(direct);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // ── Modal: click-anywhere closes it ─────────────────────
  useEffect(() => {
    const onClick = (e: MouseEvent): void => {
      const s = useWorldStore.getState();
      if (!s.modalInteractable) return;
      const target = e.target as HTMLElement | null;
      if (target && target.id === 'interact-link') return;
      s.closeModal();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // ── Proximity: nearest room (overview only) ─────────────
  useFrame(() => {
    const s = useWorldStore.getState();
    if (s.viewMode !== 'overview' || s.fpActive) {
      if (s.nearbyRoom !== null) s.setNearbyRoom(null);
      return;
    }
    let nearest: RoomId | null = null;
    let nearestDist = PROXIMITY_THRESHOLD;
    for (const r of ROOMS) {
      const dx = s.charPos.x - r.center.x;
      const dz = s.charPos.z - r.center.z;
      const d = Math.hypot(dx, dz);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = r.id;
      }
    }
    if (nearest !== s.nearbyRoom) s.setNearbyRoom(nearest);
  });

  return null;
}
