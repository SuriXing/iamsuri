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
    // Accept ANY key to advance — was Enter/Space only, which left
    // arrow-key presses falling silently into the void during the intro
    // dialogue. Users hit Left and the avatar didn't move for ~5 seconds
    // because the dialogue was eating + ignoring the keypress.
    const onKey = (e: KeyboardEvent) => {
      // Skip pure modifier presses so Cmd-tabbing doesn't advance.
      if (e.key === 'Meta' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift') return;
      // Let the browser keep its own navigation/close keys. Tab must stay
      // focusable-traversable for a11y; Escape belongs to the global
      // handler (modals / room exit); Cmd/Ctrl combos are OS shortcuts.
      if (e.key === 'Tab' || e.key === 'Escape') return;
      if (e.metaKey || e.ctrlKey) return;
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
