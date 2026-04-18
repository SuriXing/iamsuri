import { useWorldStore } from '../store/worldStore';

export function Crosshair() {
  const fpActive = useWorldStore((s) => s.fpActive);
  const focused = useWorldStore((s) => s.focusedInteractable);
  const cls =
    'crosshair' + (fpActive ? ' active' : '') + (focused ? ' focused' : '');
  return <div id="crosshair" className={cls} />;
}
