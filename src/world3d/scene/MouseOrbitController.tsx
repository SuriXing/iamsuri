import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useWorldStore } from '../store/worldStore';
import {
  targetAngleRef,
  targetPitchRef,
  targetDistRef,
} from './cameraRefs';

const PITCH_MIN = 0.3;
const PITCH_MAX = 1.4;
const DIST_MIN = 8;
const DIST_MAX = 35;
const DRAG_SENSITIVITY = 0.005;
const ZOOM_SENSITIVITY = 0.02;

/**
 * Mouse drag + scroll wheel orbit control for overview mode.
 * Touch (single finger) is also wired for parity with the legacy file.
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
      return !s.fpActive && s.viewMode === 'overview';
    };

    const onMouseDown = (e: MouseEvent): void => {
      if (!orbitEnabled()) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onMouseUp = (): void => {
      dragging = false;
    };
    const onMouseMove = (e: MouseEvent): void => {
      if (!dragging || !orbitEnabled()) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      targetAngleRef.current -= dx * DRAG_SENSITIVITY;
      targetPitchRef.current = Math.max(
        PITCH_MIN,
        Math.min(PITCH_MAX, targetPitchRef.current + dy * DRAG_SENSITIVITY),
      );
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onWheel = (e: WheelEvent): void => {
      if (!orbitEnabled()) return;
      targetDistRef.current = Math.max(
        DIST_MIN,
        Math.min(DIST_MAX, targetDistRef.current + e.deltaY * ZOOM_SENSITIVITY),
      );
      e.preventDefault();
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
      targetAngleRef.current -= dx * DRAG_SENSITIVITY;
      targetPitchRef.current = Math.max(
        PITCH_MIN,
        Math.min(PITCH_MAX, targetPitchRef.current + dy * DRAG_SENSITIVITY),
      );
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchmove', onTouchMove);
    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [gl]);

  return null;
}
