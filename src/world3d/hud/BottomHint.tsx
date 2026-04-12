import { useWorldStore } from '../store/worldStore';

export function BottomHint() {
  const viewMode = useWorldStore((s) => s.viewMode);
  if (viewMode !== 'overview') return null;
  return (
    <div id="hint">
      WASD / arrows to walk &middot; walk to a door, press <b>U</b> to unlock then <b>E</b> to enter &middot; drag to orbit
    </div>
  );
}
