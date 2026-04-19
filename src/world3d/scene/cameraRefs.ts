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
interface MutableNumberRef {
  current: number;
}
interface MutableNullableNumberRef {
  current: number | null;
}
interface MutableBoolRef {
  current: boolean;
}

// Default pitch ≈ 63° above horizontal — overhead walking-sim read.
const DEFAULT_PITCH = 1.1;

// Default yaw = π (180°). CRITICAL FIX for the "rooms swap places" bug:
// the intro camera sits at world (0, 20, +14) — on the +Z side of the
// world, looking toward -Z. With yaw=0 the follow camera math
// `charPos.z - cos(yaw)*dist` puts the camera at z = -dist (the -Z
// side, OPPOSITE of intro). So when the intro tween finishes, the
// camera literally orbits 180° around the character, mirror-flipping
// every room's screen position. With yaw=π, `charPos.z - cos(π)*dist
// = charPos.z + dist`, putting the camera on the +Z side — the SAME
// side as the intro camera. World +X = screen-right consistently
// from intro through follow, no flip.
const DEFAULT_YAW = Math.PI;

export const followCamYawRef: MutableNumberRef = { current: DEFAULT_YAW };
export const followCamPitchRef: MutableNumberRef = { current: DEFAULT_PITCH };
export const targetCamYawRef: MutableNumberRef = { current: DEFAULT_YAW };
export const targetCamPitchRef: MutableNumberRef = { current: DEFAULT_PITCH };

export const FOLLOW_PITCH_MIN = 0.25;
export const FOLLOW_PITCH_MAX = 1.35;

/**
 * Yaw hint published by InteractionManager when the player is approaching
 * a "spotlight" room (book / idealab). CameraController's follow branch
 * lerps `targetCamYawRef` toward this value so the room rotates into
 * frame as the player walks up. `null` = no hint, fall through to the
 * existing auto-yaw-drift behavior.
 */
export const followCamYawHintRef: MutableNullableNumberRef = { current: null };

/**
 * Set true on pointerdown / false on pointerup by MouseOrbitController.
 * CameraController consults this to make sure the yaw hint never fights
 * an active mouse drag — drag wins, hint pauses.
 */
export const mouseDraggingRef: MutableBoolRef = { current: false };
