import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useWorldStore } from '../store/worldStore';
import {
  targetCamYawRef,
  targetCamPitchRef,
  mouseDraggingRef,
  FOLLOW_PITCH_MIN,
  FOLLOW_PITCH_MAX,
} from './cameraRefs';

const DRAG_SENSITIVITY = 0.005; // radians per pixel
// Yaw is unbounded (free 360° spin); pitch is clamped to keep the camera
// from going under the floor or flipping over the top of the character.

/**
 * Mouse / touch drag → camera orbit (overview mode) OR FP look-around
 * (inside a room). Drag left/right, the camera (or character's eyes)
 * pan; drag up/down, they tilt.
 *
 * - In overview mode: dragging steers `targetCamYawRef` /
 *   `targetCamPitchRef` (third-person orbit around the character).
 * - In FP mode (after entering a room): dragging dispatches to the
 *   store's `addFpDelta` action which updates fpYaw / fpPitch.
 */
export function MouseOrbitController(): null {
  const { gl } = useThree();

  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const overviewOrbitEnabled = (): boolean => {
      const s = useWorldStore.getState();
      return (
        s.introPhase === 'follow' &&
        !s.fpActive &&
        s.viewMode === 'overview' &&
        s.viewTransition === 'idle' &&
        s.modalInteractable === null
      );
    };
    const fpLookEnabled = (): boolean => {
      const s = useWorldStore.getState();
      return (
        s.introPhase === 'follow' &&
        s.fpActive &&
        s.viewTransition === 'idle' &&
        s.modalInteractable === null
      );
    };

    const onMouseDown = (e: MouseEvent): void => {
      if (!overviewOrbitEnabled() && !fpLookEnabled()) return;
      if (e.button !== 0) return;
      dragging = true;
      mouseDraggingRef.current = true;
      lastX = e.clientX;
      lastY = e.clientY;
      el.style.cursor = 'grabbing';
    };
    const onMouseUp = (): void => {
      if (dragging) el.style.cursor = '';
      dragging = false;
      mouseDraggingRef.current = false;
    };
    const onMouseMove = (e: MouseEvent): void => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      if (overviewOrbitEnabled()) {
        targetCamYawRef.current += dx * DRAG_SENSITIVITY;
        targetCamPitchRef.current = Math.max(
          FOLLOW_PITCH_MIN,
          Math.min(FOLLOW_PITCH_MAX, targetCamPitchRef.current - dy * DRAG_SENSITIVITY),
        );
      } else if (fpLookEnabled()) {
        // FP look: drag right → look right (yaw +). Drag up → look up
        // (pitch +). Sensitivity slightly reduced so FP looks calmer.
        const s = useWorldStore.getState();
        // Drag right → look right (FP yaw decreases per the camera math).
        // Drag up → look up (pitch increases). Sensitivity reduced for calm.
        s.addFpDelta(-dx * DRAG_SENSITIVITY * 0.7, -dy * DRAG_SENSITIVITY * 0.7);
      }
    };

    const onTouchStart = (e: TouchEvent): void => {
      if (e.touches.length !== 1) return;
      if (!overviewOrbitEnabled() && !fpLookEnabled()) return;
      dragging = true;
      mouseDraggingRef.current = true;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    };
    const onTouchEnd = (): void => {
      dragging = false;
      mouseDraggingRef.current = false;
    };
    const onTouchMove = (e: TouchEvent): void => {
      if (!dragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastX;
      const dy = e.touches[0].clientY - lastY;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      if (overviewOrbitEnabled()) {
        targetCamYawRef.current += dx * DRAG_SENSITIVITY;
        targetCamPitchRef.current = Math.max(
          FOLLOW_PITCH_MIN,
          Math.min(FOLLOW_PITCH_MAX, targetCamPitchRef.current - dy * DRAG_SENSITIVITY),
        );
      } else if (fpLookEnabled()) {
        const s = useWorldStore.getState();
        // Drag right → look right (FP yaw decreases per the camera math).
        // Drag up → look up (pitch increases). Sensitivity reduced for calm.
        s.addFpDelta(-dx * DRAG_SENSITIVITY * 0.7, -dy * DRAG_SENSITIVITY * 0.7);
      }
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
