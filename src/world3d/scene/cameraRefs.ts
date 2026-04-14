/**
 * Shared mutable refs for the 3D follow camera.
 *
 * Module-level singletons (not React state) so the camera controller, the
 * player controller, and the mouse orbit controller can all read/write
 * the same camera state every frame without triggering re-renders.
 *
 * - `followCamYawRef`   — current smoothed yaw (azimuth) around the char
 * - `followCamPitchRef` — current smoothed pitch (elevation above horizon)
 * - `targetCamYawRef`   — what mouse drag is steering yaw toward
 * - `targetCamPitchRef` — what mouse drag is steering pitch toward
 *
 * The "current" refs lerp toward the "target" refs each frame in
 * CameraController. PlayerController reads `followCamYawRef.current`
 * (the smoothed value) to compute camera-relative WASD movement, so the
 * controls always feel right relative to whatever the user is looking at.
 */
export interface MutableNumberRef {
  current: number;
}

// Default pitch ≈ 63° above horizontal. Iterated on user feedback:
// 45° (π/4) read too close to horizon, 50° (0.87 rad) made the character
// look squashed/foreshortened, 63° (1.1 rad) gives a clearer overhead
// walking-sim read without being fully top-down. Camera sits ~5.34 above
// and ~2.72 behind the character at FOLLOW.distance = 6.
const DEFAULT_PITCH = 1.1;

export const followCamYawRef: MutableNumberRef = { current: 0 };
export const followCamPitchRef: MutableNumberRef = { current: DEFAULT_PITCH };
export const targetCamYawRef: MutableNumberRef = { current: 0 };
export const targetCamPitchRef: MutableNumberRef = { current: DEFAULT_PITCH };

export const FOLLOW_PITCH_MIN = 0.25;
export const FOLLOW_PITCH_MAX = 1.35;
