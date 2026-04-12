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
          camera={{
            position: [...CAMERA.position],
            fov: CAMERA.fov,
            near: CAMERA.near,
            far: CAMERA.far,
          }}
          gl={{ antialias: true }}
        >
          <World />
        </Canvas>
        <Hud />
      </div>
    </ExitContext.Provider>
  );
}
