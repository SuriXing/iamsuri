import { lazy, Suspense, useCallback } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
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

// Landing is also lazy so the /3d cold boot doesn't have to evaluate
// Landing.tsx (and its webfont CSS graph) just to render a canvas. On
// the `/` route the pre-boot fire-and-forget below hydrates it before
// React reaches the Suspense boundary.
const landingImport = () => import('./components/pages/Landing');
const Landing = lazy(landingImport);

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
  } else {
    // Same trick for the Landing route — kick off the dynamic import so
    // the editorial page + font CSS stream in parallel with React
    // bootstrap instead of waiting for the Suspense boundary.
    void landingImport();
  }
}

bootstrapRoute();

/**
 * Landing route — the editorial single-scroll 2D portfolio (P1.5).
 * ThemeToggle + ViewSwitcher sit fixed top-right; ProjectsDock sits
 * fixed bottom; the Landing component is the full scroll flow.
 */
function LandingRoute() {
  return (
    <>
      <ThemeToggle />
      <ViewSwitcher />
      <Suspense
        fallback={
          <div
            className="landing-loading"
            role="status"
            aria-live="polite"
            style={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--fg, #ededf5)',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '0.875rem',
              opacity: 0.6,
            }}
          >
            Loading…
          </div>
        }
      >
        <Landing />
      </Suspense>
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
        <Route path="/" element={<LandingRoute />} />
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
