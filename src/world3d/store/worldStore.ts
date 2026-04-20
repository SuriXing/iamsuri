import { create } from 'zustand';
import type { RoomId } from '../data/rooms';
import { ROOM_BY_ID } from '../data/rooms';
import { FP, STORAGE_KEYS } from '../constants';

export type ViewMode = 'overview' | RoomId;

type ViewTransition = 'idle' | 'entering' | 'exiting';

/**
 * Why a room transition was triggered. 'manual' = E-key / number-key /
 * direct setViewMode (player wasn't already inside the doorway, so the
 * camera should teleport to the canonical room-entry pose). 'auto' =
 * walk-through proximity detection — player is already past the door,
 * so the FP camera should snap onto the player's CURRENT position
 * without any positional teleport.
 */
type EnterReason = 'manual' | 'auto';

/**
 * Top-level camera flow for the 3D world. The intro sequence runs once:
 *
 *   intro-static  (tilted top-down establishing shot, ~1.6s)
 *        │
 *        ▼
 *   intro-zoom    (cinematic tween down toward the character, ~2.4s)
 *        │
 *        ▼
 *   dialogue      (camera parked behind character, text box visible)
 *        │  user clicks Next
 *        ▼
 *   follow        (default gameplay: third-person behind the character)
 *
 * Entering a room flips fpActive=true; the camera uses the FP logic
 * instead. Exiting a room returns to `follow`.
 */
type IntroPhase = 'intro-static' | 'intro-zoom' | 'dialogue' | 'follow';

export interface InteractableData {
  title: string;
  body: string;
  link?: string;
}

interface WorldState {
  // View
  viewMode: ViewMode;
  viewTransition: ViewTransition;
  /** How the most recent room-enter was triggered. */
  enterReason: EnterReason;
  // Player
  charPos: { x: number; z: number };
  charFacing: number; // radians
  // First-person
  fpActive: boolean;
  fpYaw: number;
  fpPitch: number;
  // Doors
  unlockedDoors: Set<RoomId>;
  // Theme
  theme: 'dark' | 'light';
  // Proximity / interactables
  nearbyRoom: RoomId | null;
  focusedInteractable: InteractableData | null;
  modalInteractable: InteractableData | null;
  // Intro sequence
  introPhase: IntroPhase;
  dialogueIndex: number;
  // BookRoom F-to-sit: when true, lower camera + freeze WASD walk.
  // First WASD press (or F) clears it.
  seated: boolean;

  // Actions
  setViewMode: (v: ViewMode) => void;
  setCharPos: (x: number, z: number) => void;
  setCharFacing: (f: number) => void;
  setFp: (active: boolean, yaw?: number, pitch?: number) => void;
  addFpDelta: (dYaw: number, dPitch: number) => void;
  unlockDoor: (id: RoomId) => void;
  lockDoor: (id: RoomId) => void;
  toggleTheme: () => void;
  setNearbyRoom: (id: RoomId | null) => void;
  setFocusedInteractable: (i: InteractableData | null) => void;
  openModal: (i: InteractableData) => void;
  closeModal: () => void;
  // View transition state machine — avoids useFrame ordering races
  // between CameraController (writes fpActive at tween end) and
  // PlayerController (reads fpActive to decide movement).
  beginRoomTransition: (room: RoomId, reason?: EnterReason) => void;
  completeRoomTransition: () => void;
  beginExitTransition: () => void;
  // Intro actions
  setIntroPhase: (p: IntroPhase) => void;
  advanceDialogue: () => void;
  // Seated (BookRoom couch). Clears fpActive position only — keeps yaw.
  sitDown: () => void;
  standUp: () => void;
}

// localStorage persistence for unlocked doors
function loadUnlocks(): Set<RoomId> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.unlocks);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    const validIds = parsed.filter(
      (id): id is RoomId => typeof id === 'string' && id in ROOM_BY_ID,
    );
    return new Set(validIds);
  } catch {
    return new Set();
  }
}
function saveUnlocks(set: Set<RoomId>) {
  try {
    localStorage.setItem(STORAGE_KEYS.unlocks, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

function loadTheme(): 'dark' | 'light' {
  try {
    return localStorage.getItem(STORAGE_KEYS.theme) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export const useWorldStore = create<WorldState>((set) => ({
  viewMode: 'overview',
  viewTransition: 'idle',
  enterReason: 'manual',
  charPos: { x: 0, z: 0 },
  charFacing: 0,
  fpActive: false,
  fpYaw: 0,
  fpPitch: 0,
  unlockedDoors: loadUnlocks(),
  theme: loadTheme(),
  nearbyRoom: null,
  focusedInteractable: null,
  modalInteractable: null,
  // Skip the 4-second intro for repeat visitors in the same session.
  // First visit shows the static→zoom→dialogue cinematic; subsequent
  // entries to /3d during this session jump straight into 'follow' mode
  // so the user can move immediately. Cleared on full page close.
  introPhase:
    typeof window !== 'undefined' && window.sessionStorage?.getItem('suri-intro-played') === '1'
      ? 'follow'
      : 'intro-static',
  dialogueIndex: 0,
  seated: false,

  setViewMode: (v) => {
    // Centralize the "leaving a room" cleanup so stale focus/modal state
    // can't carry across room visits.
    if (v === 'overview') {
      set({
        viewMode: v,
        focusedInteractable: null,
        modalInteractable: null,
        seated: false,
      });
    } else {
      // Direct jumps (E key, number key, test bridge) are 'manual' —
      // CameraController will teleport to the canonical room-entry pose.
      set({ viewMode: v, enterReason: 'manual' });
    }
  },
  setCharPos: (x, z) => set({ charPos: { x, z } }),
  setCharFacing: (f) => set({ charFacing: f }),
  setFp: (active, yaw, pitch) =>
    set((s) => ({
      fpActive: active,
      fpYaw: yaw ?? s.fpYaw,
      fpPitch: pitch ?? s.fpPitch,
    })),
  addFpDelta: (dYaw, dPitch) =>
    set((s) => ({
      fpYaw: s.fpYaw + dYaw,
      fpPitch: Math.max(FP.pitchMin, Math.min(FP.pitchMax, s.fpPitch + dPitch)),
    })),
  unlockDoor: (id) =>
    set((s) => {
      const next = new Set(s.unlockedDoors);
      next.add(id);
      saveUnlocks(next);
      return { unlockedDoors: next };
    }),
  lockDoor: (id) =>
    set((s) => {
      if (!s.unlockedDoors.has(id)) return {};
      const next = new Set(s.unlockedDoors);
      next.delete(id);
      saveUnlocks(next);
      return { unlockedDoors: next };
    }),
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEYS.theme, next);
      } catch {
        /* ignore */
      }
      return { theme: next };
    }),
  setNearbyRoom: (id) => set((s) => (s.nearbyRoom === id ? s : { nearbyRoom: id })),
  setFocusedInteractable: (i) =>
    set((s) => (s.focusedInteractable === i ? s : { focusedInteractable: i })),
  openModal: (i) => {
    if (typeof document !== 'undefined' && document.pointerLockElement) {
      document.exitPointerLock();
    }
    set({ modalInteractable: i });
  },
  closeModal: () => set({ modalInteractable: null }),
  beginRoomTransition: (room, reason = 'manual') =>
    set({ viewMode: room, viewTransition: 'entering', enterReason: reason }),
  completeRoomTransition: () =>
    set({ fpActive: true, viewTransition: 'idle' }),
  beginExitTransition: () =>
    set({
      viewMode: 'overview',
      viewTransition: 'exiting',
      focusedInteractable: null,
      modalInteractable: null,
      seated: false,
    }),
  setIntroPhase: (p) => {
    if (p === 'follow' && typeof window !== 'undefined') {
      window.sessionStorage?.setItem('suri-intro-played', '1');
    }
    set({ introPhase: p });
  },
  advanceDialogue: () =>
    set((s) => {
      // Advancing ends the intro and drops the player straight into
      // first-person. Per user request, the entire post-intro experience
      // is FP — overview/follow third-person camera is only used for the
      // intro cinematic.
      // FP look convention: look = (-sin(fpYaw), -cos(fpYaw)). Char facing:
      // forward = (sin(charFacing), cos(charFacing)). So fpYaw = charFacing + π
      // makes the eyes look the same direction the avatar was facing.
      if (typeof window !== 'undefined') {
        window.sessionStorage?.setItem('suri-intro-played', '1');
      }
      return {
        introPhase: 'follow',
        dialogueIndex: s.dialogueIndex + 1,
        fpActive: true,
        fpYaw: s.charFacing + Math.PI,
        fpPitch: 0,
      };
    }),
  sitDown: () => set({ seated: true }),
  standUp: () => set({ seated: false }),
}));

// Test/dev seam: expose store on window (typed via global.d.ts). Gated
// behind DEV so the store isn't reachable from third-party scripts /
// extensions / console spelunkers in production.
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.__worldStore = useWorldStore;
}
