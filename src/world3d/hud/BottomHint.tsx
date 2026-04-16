import { useWorldStore } from '../store/worldStore';

export function BottomHint() {
  const viewMode = useWorldStore((s) => s.viewMode);
  const fpActive = useWorldStore((s) => s.fpActive);

  if (viewMode === 'overview') {
    return (
      <div id="hint">
        WASD / arrows to walk &middot; walk to a door, press <b>U</b> to open
        &middot; drag to orbit
      </div>
    );
  }

  // Inside a room (FP mode) — different hint, including the "click on
  // anything to read more" discoverability cue. This needs to live OUTSIDE
  // any trophy modal so the user knows to click BEFORE they've clicked.
  if (fpActive) {
    return (
      <div id="hint">
        💡 Click on trophies and other objects to read more &middot; drag to
        look around &middot; <b>ESC</b> to leave
      </div>
    );
  }

  return null;
}
