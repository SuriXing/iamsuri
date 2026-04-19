import { useWorldStore } from '../store/worldStore';

export function BackButton() {
  const viewMode = useWorldStore((s) => s.viewMode);
  const active = viewMode !== 'overview';

  // Exit returns the player to the spawn point AND drops out of FP into
  // the third-person follow camera so the user sees the full hallway again
  // and can re-orient. Pure setViewMode('overview') alone left them stuck
  // in FP wherever they were standing inside the room — confusing.
  const handleExit = () => {
    const s = useWorldStore.getState();
    window.dispatchEvent(new CustomEvent('suri-fade'));
    s.setCharPos(0, 0);
    s.setCharFacing(0);
    s.setFp(false, 0, 0);
    s.setViewMode('overview');
  };

  return (
    <button
      id="back-btn"
      type="button"
      className={'back-btn' + (active ? ' active' : '')}
      onClick={handleExit}
    >
      &times; EXIT ROOM
    </button>
  );
}
