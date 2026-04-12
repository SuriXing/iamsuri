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

    // Observe OS-level pointer-lock changes. When the user presses Esc
    // or alt-tabs, the browser releases the lock and we stop getting
    // mousemove events. We don't need to do anything heavy here — the
    // click handler above already re-requests the lock on canvas click,
    // so this listener exists to be explicit that we know about the
    // lifecycle. Kept as a named handler so cleanup removes exactly it.
    const onLockChange = (): void => {
      // intentionally empty: state reads through `document.pointerLockElement`
      // in the other handlers already correctly reflect the new state.
    };

    element.addEventListener('click', onClick);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('pointerlockchange', onLockChange);
    return () => {
      element.removeEventListener('click', onClick);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('pointerlockchange', onLockChange);
    };
  }, [element]);
}
