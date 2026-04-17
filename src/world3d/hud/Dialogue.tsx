import { useEffect } from 'react';
import { useWorldStore } from '../store/worldStore';

/**
 * Intro dialogue overlay. Mounts while introPhase === 'dialogue',
 * shows a text box placeholder + "Next" button. Click Next (or press
 * Enter/Space) to transition into follow mode.
 *
 * The enter animation is CSS-driven (see .dialogue-root in world3d.css);
 * no mount-state gymnastics needed because the component itself is
 * conditionally rendered and each mount runs the animation fresh.
 */
export function Dialogue() {
  const introPhase = useWorldStore((s) => s.introPhase);
  const advance = useWorldStore((s) => s.advanceDialogue);
  const visible = introPhase === 'dialogue';

  useEffect(() => {
    if (!visible) return undefined;
    // Only intercept the specific "advance" keys. Everything else —
    // Alt+Arrow (browser back/forward), F5/F11/F12, Tab, arrows,
    // modifier combos, printable keys used for focus — passes through
    // so the browser/OS keeps its own bindings during the intro.
    const ADVANCE_KEYS = new Set(['Enter', ' ', 'Spacebar']);
    const onKey = (e: KeyboardEvent) => {
      if (!ADVANCE_KEYS.has(e.key)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, advance]);

  if (!visible) return null;

  return (
    <div
      className="dialogue-root"
      role="dialog"
      aria-live="polite"
      aria-label="Suri speaks"
    >
      <div className="dialogue-box">
        <div className="dialogue-speaker">Suri</div>
        <p className="dialogue-text">
          Welcome to Suri&apos;s Lab! Walk around with WASD, step into a door to enter a room.
        </p>
        <div className="dialogue-actions">
          <button
            type="button"
            className="dialogue-next"
            onClick={() => advance()}
            autoFocus
          >
            Next <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
