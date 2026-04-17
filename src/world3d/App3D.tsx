import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { World } from './scene/World';
import { Hud } from './hud/Hud';
import { CAMERA } from './constants';
import { useWorldStore } from './store/worldStore';
import { ROOM_BY_ID } from './data/rooms';
import type { RoomId } from './data/rooms';
import { ExitContext } from './exitContext';
import { THEME_CHANGE_EVENT } from '../context/ThemeContext';
import './world3d.css';

interface Props {
  /**
   * Called when the user clicks the "2D" button in the HUD. The parent
   * <App /> uses this to flip its top-level `view` state back to `'2d'`.
   */
  onExitTo2D?: () => void;
}

export default function App3D({ onExitTo2D }: Props) {
  // Bidirectional theme sync with the 2D ThemeContext. ThemeContext
  // dispatches `THEME_CHANGE_EVENT` on every flip; we mirror into the
  // world store. Inverse direction: subscribing to the store and
  // re-dispatching the same event would loop, so we guard on equality.
  useEffect(() => {
    const onExternal = (e: Event) => {
      const next = (e as CustomEvent<'dark' | 'light'>).detail;
      const cur = useWorldStore.getState().theme;
      if (next && next !== cur) useWorldStore.getState().toggleTheme();
    };
    window.addEventListener(THEME_CHANGE_EVENT, onExternal);
    // On mount, align store → context if localStorage already flipped
    // while the 3D chunk was unloaded.
    const saved = (localStorage.getItem('suri-theme') === 'light' ? 'light' : 'dark') as 'dark' | 'light';
    if (useWorldStore.getState().theme !== saved) {
      useWorldStore.getState().toggleTheme();
    }
    const unsub = useWorldStore.subscribe((s, prev) => {
      if (s.theme !== prev.theme) {
        window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: s.theme }));
      }
    });
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, onExternal);
      unsub();
    };
  }, []);

  // Legacy window bridges that Playwright drives directly. Installed on
  // mount so the 3D world is reachable from tests via `window.navigateTo*`.
  // Gated behind DEV so the bridges do not ship to production bundles.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    type Bridge = {
      navigateToRoom?: (id: string) => void;
      navigateToOverview?: () => void;
    };
    const w = window as unknown as Bridge;
    w.navigateToRoom = (id: string) => {
      // Validate against the canonical room registry before dispatch —
      // an unknown id would crash CameraController when it dereferences
      // ROOM_BY_ID[id].center.
      if (!(id in ROOM_BY_ID)) {
        console.warn(`[navigateToRoom] unknown room id: ${id}`);
        return;
      }
      const s = useWorldStore.getState();
      s.unlockDoor(id as RoomId);
      s.setViewMode(id as RoomId);
    };
    w.navigateToOverview = () => {
      useWorldStore.getState().setViewMode('overview');
    };
    return () => {
      delete w.navigateToRoom;
      delete w.navigateToOverview;
    };
  }, []);

  return (
    <ExitContext.Provider value={onExitTo2D ?? null}>
      <div className="world3d-root">
        <Canvas
          // Bump this key any time the gl prop below changes — forces
          // React to unmount + remount the Canvas so a fresh
          // WebGLRenderer is constructed with the new config.
          key="canvas-v5-drop-logdepth-2026-04-15"
          // shadows REMOVED — was the single largest per-frame cost.
          // Each frame the directional light re-rendered the entire
          // scene into a 1024×1024 shadow map = ~1M extra fragment
          // evaluations per frame. Combined with logarithmicDepthBuffer
          // and DPR 2 on retina, the M1 was missing frame budget on
          // every character move → "一顿一顿的" stutter.
          // Voxel/flatShading style still reads cleanly without shadows.
          // dpr capped at 1.5 (was [1, 2]). Retina at 2× = 4× pixels =
          // 4× fragment shader work. 1.5 keeps edges crisp without
          // doubling pixel count. Single number forces fixed ratio
          // instead of dynamic clamping.
          dpr={1.5}
          camera={{
            position: [...CAMERA.position],
            fov: CAMERA.fov,
            near: CAMERA.near,
            far: CAMERA.far,
          }}
          // logarithmicDepthBuffer DROPPED — was the largest single GPU
          // cost (~2× fragment shading on M1) and turned out to be
          // unnecessary: the other z-fight fixes alone are sufficient.
          //   - Ground.y at -0.5 (50cm gap below room floors)
          //   - RoomFloor opaque (no transparent sort flicker)
          //   - CAMERA.near 0.5 (5× linear depth precision improvement)
          //   - Floor stack has 50cm of headroom in the depth buffer
          // At distance 16 with near 0.5, linear depth precision is
          // ~11cm — coarser than logarithmic, but the floor surfaces
          // are now 50cm apart so it's plenty.
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
          }}
        >
          <World />
        </Canvas>
        <Hud />
      </div>
    </ExitContext.Provider>
  );
}
