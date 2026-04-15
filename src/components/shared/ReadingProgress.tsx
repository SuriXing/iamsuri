import { useScrollProgress } from '../../lib/scroll';
import './ReadingProgress.css';

/**
 * Thin accent-colored bar fixed to the top of the viewport that fills
 * from 0 → 100% as the user scrolls through the article. Used by
 * WritingDetail (and safe to drop into any long page). P2.3.
 *
 * Reduced-motion: the bar still updates on scroll (it's direct
 * state, not an animation), but we disable any transition between
 * width changes via CSS so the bar moves in lock-step with the scroll
 * rather than smoothly lerping toward the target — which could read
 * as "motion" for users who opt out.
 */
export default function ReadingProgress() {
  const progress = useScrollProgress();
  return (
    <div
      className="reading-progress"
      role="progressbar"
      aria-label="Reading progress"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="reading-progress__bar"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
