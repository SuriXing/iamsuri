import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { World } from './scene/World';
import { Hud } from './hud/Hud';
import { CAMERA } from './constants';
import { useWorldStore } from './store/worldStore';
import { ExitContext } from './exitContext';
import './world3d.css';

interface Props {
  /**
   * Called when the user clicks the "2D" button in the HUD. The parent
   * <App /> uses this to flip its top-level `view` state back to `'2d'`.
   */
  onExitTo2D?: () => void;
}

export default function App3D({ onExitTo2D }: Props) {
  // Legacy window bridges that Playwright drives directly. Installed on
  // mount so the 3D world is reachable from tests via `window.navigateTo*`.
  useEffect(() => {
    type Bridge = {
      navigateToRoom?: (id: string) => void;
      navigateToOverview?: () => void;
    };
    const w = window as unknown as Bridge;
    w.navigateToRoom = (id: string) => {
      const s = useWorldStore.getState();
      s.unlockDoor(id as Parameters<typeof s.unlockDoor>[0]);
      s.setViewMode(id as Parameters<typeof s.setViewMode>[0]);
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
          shadows
          // Render at retina (DPR up to 2). Without this R3F uses the
          // browser default which can leave 1px lines aliased on Mac
          // retina displays — at distance 13 the wall outlines start
          // to read as wavy/non-straight even though geometry is exact.
          dpr={[1, 2]}
          camera={{
            position: [...CAMERA.position],
            fov: CAMERA.fov,
            near: CAMERA.near,
            far: CAMERA.far,
          }}
          // antialias: true → browser-native MSAA on default framebuffer.
          // logarithmicDepthBuffer: true is the critical fix for the
          // "rooms swap positions" z-fighting bug. With far=200/near=0.1
          // (2000:1 ratio) the standard 24-bit depth buffer has only ~21cm
          // of precision at 13-unit camera distance, so multiple coplanar
          // floor surfaces (1cm apart) fight for the same pixel and the
          // winner shifts as the camera moves. Logarithmic depth gives
          // ~1µm precision at any distance — kills the entire class of
          // bug. Small perf cost, paid once per fragment.
          gl={{
            antialias: true,
            logarithmicDepthBuffer: true,
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
