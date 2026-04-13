import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useWorldStore } from '../store/worldStore';
import {
  targetCamYawRef,
  targetCamPitchRef,
  FOLLOW_PITCH_MIN,
  FOLLOW_PITCH_MAX,
} from './cameraRefs';

const DRAG_SENSITIVITY = 0.005; // radians per pixel
// Yaw is unbounded (free 360° spin); pitch is clamped to keep the camera
// from going under the floor or flipping over the top of the character.

/**
 * Mouse / touch drag → camera orbit.
 *
 * Active only when the player is in the `follow` phase (not during the
 * intro, the dialogue, or while inside a room). All it does is steer the
 * `targetCamYawRef` / `targetCamPitchRef` module refs; the actual smooth
 * camera motion is driven by CameraController, and PlayerController
 * automatically picks up the new yaw for camera-relative WASD because
 * it reads `followCamYawRef.current` every frame.
 */
export function MouseOrbitController(): null {
  const { gl } = useThree();

  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const orbitEnabled = (): boolean => {
      const s = useWorldStore.getState();
      return (
        s.introPhase === 'follow' &&
        !s.fpActive &&
        s.viewMode === 'overview' &&
        s.viewTransition === 'idle' &&
        s.modalInteractable === null
      );
    };

    const onMouseDown = (e: MouseEvent): void => {
      if (!orbitEnabled()) return;
      // Only left button (0). Right-click / middle-click left alone for
      // browser default behaviour.
      if (e.button !== 0) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      el.style.cursor = 'grabbing';
    };
    const onMouseUp = (): void => {
      if (dragging) el.style.cursor = '';
      dragging = false;
    };
    const onMouseMove = (e: MouseEvent): void => {
      if (!dragging || !orbitEnabled()) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      // Drag right → camera spins counter-clockwise around char (yaw +).
      targetCamYawRef.current += dx * DRAG_SENSITIVITY;
      // Drag down → camera tilts up (lower pitch). Clamped.
      targetCamPitchRef.current = Math.max(
        FOLLOW_PITCH_MIN,
        Math.min(FOLLOW_PITCH_MAX, targetCamPitchRef.current - dy * DRAG_SENSITIVITY),
      );
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onTouchStart = (e: TouchEvent): void => {
      if (!orbitEnabled() || e.touches.length !== 1) return;
      dragging = true;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    };
    const onTouchEnd = (): void => {
      dragging = false;
    };
    const onTouchMove = (e: TouchEvent): void => {
      if (!dragging || !orbitEnabled() || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastX;
      const dy = e.touches[0].clientY - lastY;
      targetCamYawRef.current += dx * DRAG_SENSITIVITY;
      targetCamPitchRef.current = Math.max(
        FOLLOW_PITCH_MIN,
        Math.min(FOLLOW_PITCH_MAX, targetCamPitchRef.current - dy * DRAG_SENSITIVITY),
      );
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    el.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchmove', onTouchMove);
    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [gl]);

  return null;
}
