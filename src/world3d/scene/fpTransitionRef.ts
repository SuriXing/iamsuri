/**
 * Cross-component channel for the auto-FP camera transition.
 *
 * InteractionManager sets `pending = { yaw }` when the user presses their
 * first WASD key after the intro. CameraController polls each frame, and
 * when it sees a pending request it starts a smooth ~0.7s tween from the
 * current third-person follow pose to the first-person eye pose at
 * `charPos`, lerping FOV in parallel. On completion it flips
 * `fpActive=true` and clears `pending`.
 *
 * Module-level mutable ref (not zustand state) — we don't want this to
 * trigger React re-renders, and the tween is driven entirely from
 * useFrame / refs anyway.
 */
export const fpTransitionRef: { pending: { yaw: number } | null } = {
  pending: null,
};
