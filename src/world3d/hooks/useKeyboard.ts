import { useEffect, useRef, type MutableRefObject } from 'react';

const MOVEMENT_KEYS = new Set([
  'w',
  'a',
  's',
  'd',
  'arrowup',
  'arrowdown',
  'arrowleft',
  'arrowright',
]);

/**
 * Module-level set of currently pressed keys. Listeners are installed once
 * (lazily on first hook mount) and shared across all consumers, so reading
 * this set inside `useFrame` does NOT cause React re-renders.
 */
const pressedKeys: Set<string> = new Set();
let listenersInstalled = false;
let installCount = 0;

function install(): void {
  if (listenersInstalled) return;
  listenersInstalled = true;
  window.addEventListener('keydown', handleDown);
  window.addEventListener('keyup', handleUp);
  window.addEventListener('blur', handleBlur);
}

function uninstall(): void {
  if (!listenersInstalled) return;
  listenersInstalled = false;
  window.removeEventListener('keydown', handleDown);
  window.removeEventListener('keyup', handleUp);
  window.removeEventListener('blur', handleBlur);
}

function handleDown(e: KeyboardEvent): void {
  const k = e.key.toLowerCase();
  pressedKeys.add(k);
  if (MOVEMENT_KEYS.has(k)) e.preventDefault();
}
function handleUp(e: KeyboardEvent): void {
  const k = e.key.toLowerCase();
  pressedKeys.delete(k);
  if (MOVEMENT_KEYS.has(k)) e.preventDefault();
}
function handleBlur(): void {
  pressedKeys.clear();
}

export function useKeyboard(): MutableRefObject<Set<string>> {
  const ref = useRef<Set<string>>(pressedKeys);
  useEffect(() => {
    installCount += 1;
    install();
    return () => {
      installCount -= 1;
      if (installCount <= 0) {
        installCount = 0;
        uninstall();
      }
    };
  }, []);
  return ref;
}
