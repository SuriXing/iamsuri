import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App3D from './App3D';
// Side-effect import: installs window.__worldStore seam for tests/dev.
// Kept here so the store module loads even when no components import it yet.
import { useWorldStore } from './store/worldStore';
import { ROOM_BY_ID, type RoomId } from './data/rooms';

// Legacy Playwright bridge: tests call `window.navigateToRoom('myroom')`.
function isRoomId(id: string): id is RoomId {
  return id in ROOM_BY_ID;
}
window.navigateToRoom = (id: string): void => {
  if (!isRoomId(id)) return;
  // Force-unlock so direct jumps from tests always work.
  const s = useWorldStore.getState();
  if (!s.unlockedDoors.has(id)) s.unlockDoor(id);
  s.setViewMode(id);
};
window.navigateToOverview = (): void => {
  useWorldStore.getState().setViewMode('overview');
};

const rootEl = document.getElementById('world3d-root');
if (!rootEl) throw new Error('#world3d-root not found');
createRoot(rootEl).render(
  <StrictMode>
    <App3D />
  </StrictMode>,
);
