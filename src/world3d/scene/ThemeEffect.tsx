import { useEffect } from 'react';
import { useStore } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../store/worldStore';
import { COLORS } from '../constants';

const LIGHT_BG = '#f0ede6';

/**
 * Side effects of theme changes that React's declarative path can't reach
 * through the existing JSX tree:
 *  - toggles `world3d-light-theme` on `<body>` for HUD CSS overrides
 *  - imperatively writes `scene.background` and `scene.fog.color` (the JSX
 *    `<color>` / `<fogExp2>` approach in World.tsx was unreliable — the r3f
 *    reconciler didn't always re-attach on theme change, leaving the scene
 *    navy in light mode)
 *  - tweaks ambient / hemisphere / directional light intensities by
 *    traversing the scene
 *
 * Re-runs only when `theme` changes. We deliberately do NOT depend on the
 * full `useThree()` snapshot (it's a fresh object per render).
 */
export function ThemeEffect(): null {
  // Use the r3f store itself (not the reactive hook result) so we can
  // mutate `scene.background` without tripping react-hooks/immutability.
  const r3fStore = useStore();
  const theme = useWorldStore((s) => s.theme);

  useEffect(() => {
    const scene = r3fStore.getState().scene;
    const isLight = theme === 'light';
    const bg = isLight ? LIGHT_BG : COLORS.bg;

    if (typeof document !== 'undefined') {
      document.body.classList.toggle('world3d-light-theme', isLight);
    }

    // Imperative scene.background / scene.fog — the authoritative path.
    scene.background = new THREE.Color(bg);
    const fog = scene.fog;
    if (fog instanceof THREE.Fog || fog instanceof THREE.FogExp2) {
      fog.color.set(bg);
    }

    scene.traverse((obj) => {
      if (obj instanceof THREE.AmbientLight) {
        obj.intensity = isLight ? 2.5 : 1.8;
      } else if (obj instanceof THREE.HemisphereLight) {
        obj.intensity = isLight ? 0.8 : 0.5;
      } else if (obj instanceof THREE.DirectionalLight) {
        obj.intensity = isLight ? 0.6 : 1.0;
      }
    });
  }, [theme, r3fStore]);

  return null;
}
