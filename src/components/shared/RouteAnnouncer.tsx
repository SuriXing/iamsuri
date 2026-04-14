import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * RouteAnnouncer (P1.7 a11y).
 *
 * SPA navigations don't trigger a page-load announcement on screen
 * readers, and react-router-dom doesn't move focus on `<Link>` clicks.
 * This component closes both gaps:
 *
 *   1. On every `useLocation()` change, it reads `document.title`
 *      (which each page sets in its own `useEffect`) and writes it into
 *      a polite `aria-live` region so SR users hear the new page name.
 *   2. It moves DOM focus to the page's `<main id="main" tabIndex={-1}>`
 *      so subsequent Tab presses start from the top of content, not
 *      from wherever the previous focus was.
 *
 * The live-region div is visually hidden but kept in the DOM so SR
 * focus tracking stays anchored. Skips the very first render (the
 * initial page load is already announced by the natural <title>).
 */
export default function RouteAnnouncer() {
  const location = useLocation();
  const [announcement, setAnnouncement] = useState('');
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    // Defer one tick so the destination page's own `useEffect`
    // (`document.title = ...`) has a chance to run first.
    const id = window.setTimeout(() => {
      setAnnouncement(document.title);
      const main = document.getElementById('main');
      if (main instanceof HTMLElement) {
        main.focus({ preventScroll: false });
      }
    }, 50);

    return () => window.clearTimeout(id);
  }, [location.pathname]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {announcement}
    </div>
  );
}
