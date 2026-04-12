/**
 * Shared mutable refs for the overview orbit camera.
 *
 * These are intentionally module-level singletons (not React state) so the
 * mouse-orbit handler, the camera controller, and the player controller
 * can all read/write the same orbit angle/pitch/distance every frame
 * without triggering React re-renders.
 *
 * Pragmatic > idiomatic for game state in `useFrame`.
 */
export interface MutableNumberRef {
  current: number;
}

export const camAngleRef: MutableNumberRef = { current: Math.PI / 4 };
export const camPitchRef: MutableNumberRef = { current: 0.85 };
export const camDistRef: MutableNumberRef = { current: 14 };

export const targetAngleRef: MutableNumberRef = { current: Math.PI / 4 };
export const targetPitchRef: MutableNumberRef = { current: 0.85 };
export const targetDistRef: MutableNumberRef = { current: 14 };

export function resetOrbitTargets(): void {
  camAngleRef.current = Math.PI / 4;
  camPitchRef.current = 0.85;
  camDistRef.current = 14;
  targetAngleRef.current = Math.PI / 4;
  targetPitchRef.current = 0.85;
  targetDistRef.current = 14;
}
