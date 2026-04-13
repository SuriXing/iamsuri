/**
 * Shared mutable refs for the 3D camera.
 *
 * Module-level singletons (not React state) so the camera controller and
 * the player controller can read/write the same yaw every frame without
 * triggering re-renders.
 *
 * `followCamYawRef` holds the camera's current (smoothed) yaw around Y.
 * In follow mode it chases the character's facing; the player controller
 * uses it to compute camera-relative WASD movement.
 */
export interface MutableNumberRef {
  current: number;
}

export const followCamYawRef: MutableNumberRef = { current: 0 };
