import { create } from 'zustand';
import type { RoomId } from '../data/rooms';

export type ViewMode = 'overview' | RoomId;

export interface WorldState {
  // View
  viewMode: ViewMode;
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
  // Keyboard (for debug/test)
  keys: Record<string, boolean>;

  // Actions
  setViewMode: (v: ViewMode) => void;
  setCharPos: (x: number, z: number) => void;
  setCharFacing: (f: number) => void;
  setFp: (active: boolean, yaw?: number, pitch?: number) => void;
  addFpDelta: (dYaw: number, dPitch: number) => void;
  unlockDoor: (id: RoomId) => void;
  isDoorUnlocked: (id: RoomId) => boolean;
  toggleTheme: () => void;
  setKey: (key: string, down: boolean) => void;
}

// localStorage persistence for unlocked doors
const LS_KEY = 'suri-3d-doors-unlocked-v2';
function loadUnlocks(): Set<RoomId> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as RoomId[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}
function saveUnlocks(set: Set<RoomId>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

function loadTheme(): 'dark' | 'light' {
  try {
    return localStorage.getItem('suri-theme') === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export const useWorldStore = create<WorldState>((set, get) => ({
  viewMode: 'overview',
  charPos: { x: 0, z: 0 },
  charFacing: 0,
  fpActive: false,
  fpYaw: 0,
  fpPitch: 0,
  unlockedDoors: loadUnlocks(),
  theme: loadTheme(),
  keys: {},

  setViewMode: (v) => set({ viewMode: v }),
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
      fpPitch: Math.max(-1.3, Math.min(1.3, s.fpPitch + dPitch)),
    })),
  unlockDoor: (id) =>
    set((s) => {
      const next = new Set(s.unlockedDoors);
      next.add(id);
      saveUnlocks(next);
      return { unlockedDoors: next };
    }),
  isDoorUnlocked: (id) => get().unlockedDoors.has(id),
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('suri-theme', next);
      } catch {
        /* ignore */
      }
      return { theme: next };
    }),
  setKey: (key, down) => set((s) => ({ keys: { ...s.keys, [key]: down } })),
}));

// Test/dev seam: expose store on window
if (typeof window !== 'undefined') {
  (window as unknown as { __worldStore?: typeof useWorldStore }).__worldStore = useWorldStore;
}
