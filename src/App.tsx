import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { rooms } from './data/rooms';
import FloorPlan from './components/World/FloorPlan';
import RoomView from './components/Rooms/RoomView';
import MyRoom from './components/Rooms/MyRoom';
import ProductRoom from './components/Rooms/ProductRoom';
import BookRoom from './components/Rooms/BookRoom';
import IdeaLab from './components/Rooms/IdeaLab';
import ThemeToggle from './components/shared/ThemeToggle';
import ViewSwitcher from './components/shared/ViewSwitcher';
import ProjectsDock from './components/shared/ProjectsDock';

// 3D world is lazy-loaded so the 2D home page stays lightweight.
// three.js + R3F + drei ship in a separate chunk and only download
// when the user flips the switcher to 3D.
const World3D = lazy(() => import('./world3d/App3D'));

const roomComponents: Record<string, React.ComponentType> = {
  'my-room': MyRoom,
  'product-room': ProductRoom,
  'book-room': BookRoom,
  'idea-lab': IdeaLab,
};

type ViewMode = '2d' | '3d';

function readInitialView(): ViewMode {
  if (typeof window === 'undefined') return '2d';
  // `?view=3d` lets Playwright (and direct links) boot straight into 3D.
  const params = new URLSearchParams(window.location.search);
  if (params.get('view') === '3d') return '3d';
  try {
    const stored = window.localStorage.getItem('suri-landing-view');
    if (stored === '3d' || stored === '2d') return stored;
  } catch { /* storage unavailable */ }
  return '2d';
}

export default function App() {
  const [view, setView] = useState<ViewMode>(() => readInitialView());
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem('suri-landing-view', view);
    } catch { /* storage unavailable */ }
  }, [view]);

  // Dev/test seam: let Playwright flip views without clicking the HUD.
  useEffect(() => {
    const w = window as unknown as { __setView?: (v: ViewMode) => void };
    w.__setView = setView;
    return () => { delete w.__setView; };
  }, []);

  const handleSwitchTo3D = useCallback(() => setView('3d'), []);
  const handleSwitchTo2D = useCallback(() => {
    setView('2d');
    setActiveRoomId(null);
  }, []);

  const handleEnterRoom = useCallback((roomId: string) => {
    setActiveRoomId(roomId);
  }, []);

  const handleBack = useCallback(() => {
    setActiveRoomId(null);
  }, []);

  const activeRoom = activeRoomId ? rooms.find(r => r.id === activeRoomId) : null;
  const ActiveComponent = activeRoomId ? roomComponents[activeRoomId] : null;

  if (view === '3d') {
    return (
      <Suspense
        fallback={
          <div className="world3d-loading" role="status" aria-live="polite">
            Loading 3D world…
          </div>
        }
      >
        <World3D onExitTo2D={handleSwitchTo2D} />
        <ProjectsDock />
      </Suspense>
    );
  }

  return (
    <>
      <ThemeToggle />
      <ViewSwitcher onClick={handleSwitchTo3D} />
      {activeRoom && ActiveComponent ? (
        <RoomView room={activeRoom} onBack={handleBack}>
          <ActiveComponent />
        </RoomView>
      ) : (
        <FloorPlan onEnterRoom={handleEnterRoom} />
      )}
      <ProjectsDock />
    </>
  );
}
