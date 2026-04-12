import { useEffect } from 'react';
import { useWorldStore } from '../store/worldStore';
import { FP } from '../constants';

/**
 * Wires pointer-lock + mouse-look to a canvas element. Active only while
 * `fpActive` is true. Mouse delta is forwarded to the store via
 * `addFpDelta` so the camera controller can react each frame.
 */
export function usePointerLock(element: HTMLElement | null): void {
  useEffect(() => {
    if (!element) return;

    const onClick = (): void => {
      const s = useWorldStore.getState();
      if (!s.fpActive) return;
      if (s.modalInteractable) return;
      if (document.pointerLockElement !== element) {
        element.requestPointerLock();
      }
    };

    const onMove = (e: MouseEvent): void => {
      if (document.pointerLockElement !== element) return;
      const s = useWorldStore.getState();
      if (!s.fpActive) return;
      s.addFpDelta(
        -e.movementX * FP.lookSensitivity,
        -e.movementY * FP.lookSensitivity,
      );
    };

    element.addEventListener('click', onClick);
    document.addEventListener('mousemove', onMove);
    return () => {
      element.removeEventListener('click', onClick);
      document.removeEventListener('mousemove', onMove);
    };
  }, [element]);
}
