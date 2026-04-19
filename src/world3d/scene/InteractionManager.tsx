import { useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useWorldStore } from '../store/worldStore';
import { ROOMS, ROOM_BY_ID } from '../data/rooms';
import type { RoomId } from '../data/rooms';

const ROOM_NUMBER_KEYS: Record<string, RoomId> = {
  '1': 'myroom',
  '2': 'product',
  '3': 'book',
  '4': 'idealab',
};
// Measured against each room's DOOR position, not the room center.
// The door is the only point the character can physically reach from the
// hallway (walls block them from the room center). 1.6 is generous enough
// to cover the corridor in front of each door without overlapping siblings.
const PROXIMITY_THRESHOLD = 1.6;
// Auto-enter: triggered when the player has CROSSED the door plane into
// the room interior. We detect this with a door-normal dot product
// (player−door)·(roomCenter−door) > 0, plus a minimum inside-distance to
// avoid firing right at the doorway threshold (which created ping-pong
// because the auto-exit test on the same frame would still pass too).
//
// Inside-distance must be ≥ AUTO_ENTER_INSIDE so the trigger sits a
// little past the door plane, AND less than AUTO_EXIT_DIST below so the
// two regions can't both fire on the same straight walk.
const AUTO_ENTER_INSIDE = 0.4;
// Auto-unlock distance — when the character walks within this radius of
// a door we silently unlock it so they can keep walking through. Removes
// the "press U to unlock then E to enter" friction; doors still render
// their lock state and can be re-locked, but proximity is enough to open.
const AUTO_UNLOCK_DIST = 1.4;
// Auto-exit (FP mode): when the character walks past the doorway INTO
// the hallway from inside a room, drop them back to overview/follow mode.
// Measured against the room's door position. Larger than AUTO_ENTER_DIST
// so there's no ping-pong on the doorway threshold.
const AUTO_EXIT_DIST = 0.9;

/**
 * Centralized keyboard handler + proximity detection for the overworld.
 *
 * - U near a locked door → unlock
 * - E near an unlocked door → enter the room
 * - 1/2/3/4 → direct jump to a room (only if unlocked)
 * - E in FP mode → open focused interactable
 * - Escape → close modal, otherwise exit room to overview
 *
 * Pointer lock used to be wired here — removed because we now use
 * MouseOrbitController for click-and-drag FP look. Pointer lock + drag
 * are two competing paradigms; drag-to-look is the right one for a
 * portfolio site (cursor stays visible, modals/links remain clickable).
 */
export function InteractionManager(): null {

  // ── Keyboard ────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      const s = useWorldStore.getState();

      // During the intro sequence (static / zoom / dialogue) every key
      // except Enter/Space is swallowed. Enter/Space advance the
      // dialogue — handled by the Dialogue component directly, so here
      // we just freeze everything else.
      if (s.introPhase !== 'follow') return;

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
        // U: toggle the nearby door — unlock if locked, close if unlocked.
        if (key === 'u' && s.nearbyRoom) {
          if (s.unlockedDoors.has(s.nearbyRoom)) {
            s.lockDoor(s.nearbyRoom);
          } else {
            s.unlockDoor(s.nearbyRoom);
          }
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

  // ── Modal: click-outside closes it ──────────────────────
  // Closes the modal on any click that DIDN'T originate inside the
  // modal itself or on the canvas. Canvas clicks are excluded because
  // R3F's onClick on a trophy mesh still bubbles a native click event
  // up to document — that was closing the modal in the same click that
  // opened it. Canvas clicks now fall through silently; modal closes
  // via the X button, ESC, or a click on chrome outside the modal.
  useEffect(() => {
    const onClick = (e: MouseEvent): void => {
      const s = useWorldStore.getState();
      if (!s.modalInteractable) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.id === 'interact-link') return;
      if (target.tagName === 'CANVAS') return;
      // Don't close if the click was inside the modal (e.g. clicking
      // the modal body to read).
      if (target.closest('#interact-modal')) return;
      s.closeModal();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // ── Proximity: nearest door (for the open/close hint) AND
  //     auto-enter detection (walk into the room interior). Both
  //     run only in overview mode.
  useFrame(() => {
    const s = useWorldStore.getState();

    // ── FP-mode auto-exit ──────────────────────────────────
    // When the player walks back through the doorway (past the door
    // position toward the hallway side), drop them back to overview.
    // This pairs with auto-enter so the player never needs ESC.
    if (s.fpActive && s.viewMode !== 'overview' && s.introPhase === 'follow' && !s.modalInteractable) {
      const room = ROOM_BY_ID[s.viewMode];
      const dx = s.charPos.x - room.door.x;
      const dz = s.charPos.z - room.door.z;
      // Door-normal dot product: (player − door) · (roomCenter − door).
      // Negative when the player has crossed back out to the hallway side.
      // Works for any axis-aligned door, not just horizontal-wall doors.
      const dxIn = room.center.x - room.door.x;
      const dzIn = room.center.z - room.door.z;
      const onHallwaySide = dx * dxIn + dz * dzIn < 0;
      if (onHallwaySide && Math.hypot(dx, dz) > AUTO_EXIT_DIST) {
        s.beginExitTransition();
      }
      return;
    }

    if (s.viewMode !== 'overview' || s.fpActive) {
      if (s.nearbyRoom !== null) s.setNearbyRoom(null);
      return;
    }

    // Door proximity for the open/close hint.
    let nearest: RoomId | null = null;
    let nearestDist = PROXIMITY_THRESHOLD;
    for (const r of ROOMS) {
      const dx = s.charPos.x - r.door.x;
      const dz = s.charPos.z - r.door.z;
      const d = Math.hypot(dx, dz);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = r.id;
      }
    }
    if (nearest !== s.nearbyRoom) s.setNearbyRoom(nearest);

    // Auto-unlock: any door the character walks up to silently unlocks.
    // Removes the U-key friction; doors still visibly animate open.
    if (s.introPhase === 'follow' && nearest && nearestDist < AUTO_UNLOCK_DIST && !s.unlockedDoors.has(nearest)) {
      s.unlockDoor(nearest);
    }

    // Auto-enter: if character is well INSIDE a room (closer to the
    // room center than the doorway, AND past the auto-enter threshold),
    // automatically trigger the room first-person view. Door must be
    // unlocked first — locked doors block walking-in via collision.
    // TODO: wire beginRoomTransition/beginExitTransition — see .bugbash/sw-eng.md
    // (the state machine is off-by-one-frame because we flip viewMode
    // directly instead of going through the transition action).
    //
    // Short-circuit: don't auto-enter while the intro cinematic is still
    // running. The player position isn't yet under user control, so any
    // auto-enter during 'intro-static' / 'intro-zoom' / 'dialogue' would
    // race the intro tween and teleport the camera mid-cinematic.
    if (s.introPhase !== 'follow') return;
    for (const r of ROOMS) {
      // Door-plane crossing test: player has crossed the doorway into
      // the room when the vector (player − door) points the same way as
      // (roomCenter − door). Works for any axis-aligned door because
      // the dot product handles arbitrary normals.
      const dxDoor = s.charPos.x - r.door.x;
      const dzDoor = s.charPos.z - r.door.z;
      const dxIn = r.center.x - r.door.x;
      const dzIn = r.center.z - r.door.z;
      const crossed = dxDoor * dxIn + dzDoor * dzIn > 0;
      const insideDist = Math.hypot(dxDoor, dzDoor);
      if (crossed && insideDist >= AUTO_ENTER_INSIDE && s.unlockedDoors.has(r.id)) {
        s.beginRoomTransition(r.id, 'auto');
        return;
      }
    }
  });

  return null;
}
