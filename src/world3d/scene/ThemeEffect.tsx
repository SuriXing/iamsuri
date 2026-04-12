import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../store/worldStore';

/**
 * Side effects of theme changes that React's declarative path can't handle:
 *  - toggling `world3d-light-theme` on `<body>` for HUD CSS overrides
 *  - tweaking ambient + hemisphere intensities by traversing the scene
 *
 * The scene background and fog are reactive in `World.tsx` (via the
 * `<color attach>` JSX), so they don't need to be mutated here.
 */
export function ThemeEffect(): null {
  const r3fState = useThree();
  const theme = useWorldStore((s) => s.theme);

  useEffect(() => {
    const sc: THREE.Scene = r3fState.scene;
    const isLight = theme === 'light';
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('world3d-light-theme', isLight);
    }
    sc.traverse((obj) => {
      if (obj instanceof THREE.AmbientLight) {
        obj.intensity = isLight ? 2.5 : 1.8;
      } else if (obj instanceof THREE.HemisphereLight) {
        obj.intensity = isLight ? 0.8 : 0.5;
      }
    });
  }, [theme, r3fState]);

  return null;
}
