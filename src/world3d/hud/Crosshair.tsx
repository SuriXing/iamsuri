import { useWorldStore } from '../store/worldStore';

export function Crosshair() {
  const fpActive = useWorldStore((s) => s.fpActive);
  const focused = useWorldStore((s) => s.focusedInteractable);
  const cls =
    'crosshair' + (fpActive ? ' active' : '') + (focused ? ' focused' : '');
  const hintCls = 'crosshair-hint' + (fpActive && focused ? ' visible' : '');
  return (
    <>
      <div id="crosshair" className={cls} />
      <div className={hintCls}>
        <kbd>E</kbd> interact
      </div>
    </>
  );
}
