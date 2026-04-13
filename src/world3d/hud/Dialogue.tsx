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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        advance();
      }
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
        <p className="dialogue-text">text box</p>
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
