import { useWorldStore } from '../store/worldStore';

export function ExitHint() {
  const viewMode = useWorldStore((s) => s.viewMode);
  const active = viewMode !== 'overview';
  return (
    <div id="exit-hint" className={'exit-hint' + (active ? ' active' : '')}>
      <span className="exit-hint-line">
        Press <kbd>ESC</kbd> or tap <kbd>&times; EXIT ROOM</kbd> to leave
      </span>
    </div>
  );
}
