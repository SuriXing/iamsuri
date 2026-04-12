import { useEffect, useRef } from 'react';
import { useWorldStore } from '../store/worldStore';

const HINT_DURATION_MS = 4000;

/**
 * Brief overlay shown each time FP mode activates. The CSS animation
 * (`fpIntroFade`) handles fade-in/out — we just toggle the `.active` class
 * imperatively to retrigger it on every FP entry.
 */
export function IntroHint() {
  const fpActive = useWorldStore((s) => s.fpActive);
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    if (!fpActive) {
      el.classList.remove('active');
      return;
    }
    el.classList.remove('active');
    // Force reflow so the next add() restarts the CSS animation.
    void el.offsetWidth;
    el.classList.add('active');
    const t = setTimeout(() => {
      if (el) el.classList.remove('active');
    }, HINT_DURATION_MS);
    return () => clearTimeout(t);
  }, [fpActive]);

  return (
    <div id="fp-intro-hint" ref={elRef} className="fp-intro-hint">
      Click to look around &middot; WASD to walk &middot; E to interact &middot; ESC to exit
    </div>
  );
}
