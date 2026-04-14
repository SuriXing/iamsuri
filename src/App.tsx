import { lazy, Suspense, useCallback, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
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
import { Placeholder } from './components/pages/Placeholder';
import { NotFound } from './components/pages/NotFound';

// 3D world is lazy-loaded so the 2D landing stays lightweight. three.js
// + R3F + drei ship in a separate chunk and only download when the user
// navigates to `/3d`.
const world3dImport = () => import('./world3d/App3D');
const World3D = lazy(world3dImport);

const roomComponents: Record<string, React.ComponentType> = {
  'my-room': MyRoom,
  'product-room': ProductRoom,
  'book-room': BookRoom,
  'idea-lab': IdeaLab,
};

/**
 * Pre-boot URL fixup and preload hint. Runs at module eval time, before
 * React mounts:
 *
 * 1. If the URL is the legacy `?view=3d` query shape, rewrite it to
 *    `/3d` so the router boots on the right path (no stale `/` render).
 * 2. If the resolved path is `/3d`, kick off the dynamic import for the
 *    3D chunk *now* instead of waiting for React + Suspense to reach
 *    the route. The network round-trip runs in parallel with React
 *    bootstrap, shaving ~1s off cold start on the `/3d` deep link.
 */
function bootstrapRoute() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  if (params.get('view') === '3d' && window.location.pathname !== '/3d') {
    window.history.replaceState(null, '', '/3d');
  }
  if (window.location.pathname === '/3d') {
    // Fire-and-forget: the lazy() above shares this in-flight promise
    // so the Suspense fallback resolves as soon as possible.
    void world3dImport();
  }
}

bootstrapRoute();

/**
 * Landing route — still wraps the current FloorPlan + RoomView pair.
 * This whole component dies in P1.5 when the editorial landing ships.
 * For P1.1 the goal is routing only, so the 2D behavior stays identical
 * (including the useState-driven room overlay).
 */
function Landing() {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  const handleEnterRoom = useCallback((roomId: string) => {
    setActiveRoomId(roomId);
  }, []);

  const handleBack = useCallback(() => {
    setActiveRoomId(null);
  }, []);

  const activeRoom = activeRoomId ? rooms.find((r) => r.id === activeRoomId) : null;
  const ActiveComponent = activeRoomId ? roomComponents[activeRoomId] : null;

  return (
    <>
      <ThemeToggle />
      <ViewSwitcher />
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

/**
 * /3d — lazy-loaded 3D world. The Exit HUD button (see
 * `src/world3d/hud/ViewSwitcher.tsx`) calls `onExitTo2D`, which we wire
 * to `navigate('/')` so the back/exit flow goes through router history.
 */
function ThreeDRoute() {
  const navigate = useNavigate();
  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <Suspense
      fallback={
        <div className="world3d-loading" role="status" aria-live="polite">
          Loading 3D world…
        </div>
      }
    >
      <World3D onExitTo2D={handleExit} />
      <ProjectsDock />
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/work" element={<Placeholder name="Work" />} />
        <Route path="/work/:slug" element={<Placeholder name="Work" />} />
        <Route path="/writing" element={<Placeholder name="Writing" />} />
        <Route path="/writing/:slug" element={<Placeholder name="Writing" />} />
        <Route path="/ideas" element={<Placeholder name="Ideas" />} />
        <Route path="/ideas/:slug" element={<Placeholder name="Ideas" />} />
        <Route path="/about" element={<Placeholder name="About" />} />
        <Route path="/3d" element={<ThreeDRoute />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
