import { useEffect, useRef, useState } from 'react';

/**
 * PerspectiveTransition — quick fade-to-black overlay for camera-mode
 * swaps (auto-FP on first move, F-to-sit teleport, etc).
 *
 * Listens for `window` CustomEvent('suri-fade'). Each fire runs a 400ms
 * cycle: 0–180ms fade in to ~85% opacity, 180–400ms fade back to 0.
 * Pure DOM, no store coupling. Triggered with:
 *
 *   window.dispatchEvent(new CustomEvent('suri-fade'));
 */
export function PerspectiveTransition() {
  const [active, setActive] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const onFade = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      setActive(true);
      timerRef.current = window.setTimeout(() => {
        setActive(false);
        timerRef.current = null;
      }, 400);
    };
    window.addEventListener('suri-fade', onFade);
    return () => {
      window.removeEventListener('suri-fade', onFade);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        opacity: active ? 0.85 : 0,
        // Asymmetric: snap up, ease back down. Reads as a blink.
        transition: active
          ? 'opacity 180ms ease-out'
          : 'opacity 220ms ease-in',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}
