import { useEffect, useState } from 'react';

/**
 * Tracks how far the user has scrolled through the document, as a
 * value in [0, 1]. Used by the reading-progress bar on writing detail
 * pages (P2.3).
 *
 * Implementation notes:
 *   - Listens to `window.scroll` passively so it doesn't block scroll.
 *   - Also updates on `resize` because the document height can change
 *     when fonts / images load after mount.
 *   - Reads once synchronously after mount to seed the initial value
 *     without waiting for the first scroll event.
 *   - Clamped to [0, 1] to avoid bouncy overshoot on iOS rubber-band.
 */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function compute(): number {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      if (scrollHeight <= 0) return 0;
      const raw = scrollTop / scrollHeight;
      return raw < 0 ? 0 : raw > 1 ? 1 : raw;
    }

    function update(): void {
      setProgress(compute());
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return progress;
}
