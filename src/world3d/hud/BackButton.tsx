import { useWorldStore } from '../store/worldStore';

export function BackButton() {
  const viewMode = useWorldStore((s) => s.viewMode);
  const setViewMode = useWorldStore((s) => s.setViewMode);
  const active = viewMode !== 'overview';

  return (
    <button
      id="back-btn"
      type="button"
      className={'back-btn' + (active ? ' active' : '')}
      onClick={() => setViewMode('overview')}
    >
      &times; EXIT ROOM
    </button>
  );
}
