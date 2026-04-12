import { create } from 'zustand';
import type { RoomId } from '../data/rooms';
import { ROOM_BY_ID } from '../data/rooms';
import { FP, STORAGE_KEYS } from '../constants';

export type ViewMode = 'overview' | RoomId;

export type ViewTransition = 'idle' | 'entering' | 'exiting';

export interface InteractableData {
  title: string;
  body: string;
  link?: string;
}

export interface WorldState {
  // View
  viewMode: ViewMode;
  viewTransition: ViewTransition;
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

  // Actions
  setViewMode: (v: ViewMode) => void;
  setCharPos: (x: number, z: number) => void;
  setCharFacing: (f: number) => void;
  setFp: (active: boolean, yaw?: number, pitch?: number) => void;
  addFpDelta: (dYaw: number, dPitch: number) => void;
  unlockDoor: (id: RoomId) => void;
  toggleTheme: () => void;
  setNearbyRoom: (id: RoomId | null) => void;
  setFocusedInteractable: (i: InteractableData | null) => void;
  openModal: (i: InteractableData) => void;
  closeModal: () => void;
  // View transition state machine — avoids useFrame ordering races
  // between CameraController (writes fpActive at tween end) and
  // PlayerController (reads fpActive to decide movement).
  beginRoomTransition: (room: RoomId) => void;
  completeRoomTransition: () => void;
  beginExitTransition: () => void;
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

  setViewMode: (v) => {
    // Centralize the "leaving a room" cleanup so stale focus/modal state
    // can't carry across room visits.
    if (v === 'overview') {
      set({
        viewMode: v,
        focusedInteractable: null,
        modalInteractable: null,
      });
    } else {
      set({ viewMode: v });
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
  beginRoomTransition: (room) =>
    set({ viewMode: room, viewTransition: 'entering' }),
  completeRoomTransition: () =>
    set({ fpActive: true, viewTransition: 'idle' }),
  beginExitTransition: () =>
    set({
      viewMode: 'overview',
      viewTransition: 'exiting',
      focusedInteractable: null,
      modalInteractable: null,
    }),
}));

// Test/dev seam: expose store on window (typed via global.d.ts)
if (typeof window !== 'undefined') {
  window.__worldStore = useWorldStore;
}
