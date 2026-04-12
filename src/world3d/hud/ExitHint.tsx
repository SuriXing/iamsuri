import { useWorldStore } from '../store/worldStore';

export function ExitHint() {
  const viewMode = useWorldStore((s) => s.viewMode);
  const active = viewMode !== 'overview';
  return (
    <div id="exit-hint" className={'exit-hint' + (active ? ' active' : '')}>
      Press <kbd>ESC</kbd> or click <kbd>&times; EXIT ROOM</kbd> to leave
    </div>
  );
}
