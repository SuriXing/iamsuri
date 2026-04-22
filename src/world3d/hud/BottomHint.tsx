import { useWorldStore } from '../store/worldStore';

export function BottomHint() {
  const viewMode = useWorldStore((s) => s.viewMode);
  const fpActive = useWorldStore((s) => s.fpActive);

  if (viewMode === 'overview') {
    return (
      <div id="hint">
        WASD / arrows to walk &middot; walk to a door, press <b>U</b> to
        open / close &middot; drag to orbit
      </div>
    );
  }

  // Inside a room (FP mode): suppress this bottom-hint entirely. The
  // `.exit-hint` banner ("Press ESC or click × EXIT ROOM to leave") and
  // the always-on EXIT ROOM button already cover the discoverability
  // case — duplicating "ESC to leave" here just crowded the bottom edge,
  // and on mobile the two banners stacked into a 4-line wrap that the
  // user reported as "no hints telling me what to do".
  if (fpActive) return null;

  return null;
}
