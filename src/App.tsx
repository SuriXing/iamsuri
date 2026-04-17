import { lazy, Suspense, useCallback, useEffect } from 'react';
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
import SkipLink from './components/shared/SkipLink';
import RouteAnnouncer from './components/shared/RouteAnnouncer';
import SearchBox from './components/shared/SearchBox';
import { NotFound } from './components/pages/NotFound';
import { ComingSoon } from './components/pages/ComingSoon';

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

// P1.7 content pages — each is its own chunk so a deep link to
// /writing/foo doesn't pay for /work or /ideas.
const WorkList = lazy(() => import('./components/pages/WorkList'));
const WorkDetail = lazy(() => import('./components/pages/WorkDetail'));
const WritingList = lazy(() => import('./components/pages/WritingList'));
const WritingDetail = lazy(() => import('./components/pages/WritingDetail'));
const IdeasList = lazy(() => import('./components/pages/IdeasList'));
const IdeaDetail = lazy(() => import('./components/pages/IdeaDetail'));
const About = lazy(() => import('./components/pages/About'));

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
  // P1.2 architect note: only rewrite ?view=3d when on the root path,
  // so a hypothetical /work?view=3d link doesn't silently drop /work.
  if (
    params.get('view') === '3d' &&
    window.location.pathname === '/'
  ) {
    window.history.replaceState(null, '', '/3d' + window.location.hash);
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
 * Suspense fallback shared by every 2D page route. Token-styled so it
 * matches the editorial palette instead of inheriting raw UA defaults.
 */
function PageLoading() {
  return (
    <div
      className="page-loading"
      role="status"
      aria-live="polite"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--fg-muted)',
        background: 'var(--bg)',
        fontFamily: 'var(--font-mono, system-ui, monospace)',
        fontSize: '0.875rem',
        letterSpacing: '0.04em',
        textTransform: 'lowercase',
      }}
    >
      loading…
    </div>
  );
}

/**
 * Landing route — the editorial single-scroll 2D portfolio (P1.5).
 * ThemeToggle + ViewSwitcher sit fixed top-right; ProjectsDock sits
 * fixed bottom; the Landing component is the full scroll flow.
 */
function LandingRoute() {
  return (
    <>
      <SearchBox />
      <ThemeToggle />
      <ViewSwitcher />
      <Suspense fallback={<PageLoading />}>
        <Landing />
      </Suspense>
      <ProjectsDock />
    </>
  );
}

/**
 * Generic shell for the P1.7 content pages. Same persistent chrome as
 * the landing route, but the inner page is parameterized.
 *
 * `hideDock` — omit the ProjectsDock on pages that already have a
 * primary CTA pointing at external products (e.g. /work/:slug has its
 * own "Launch {product}" button, and the dock overlaps it on mobile).
 */
function ContentRoute({ children, hideDock = false }: { children: React.ReactNode; hideDock?: boolean }) {
  return (
    <>
      <SearchBox />
      <ThemeToggle />
      <ViewSwitcher />
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
      {!hideDock && <ProjectsDock />}
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

  useEffect(() => {
    document.title = "3D World — Suri's Lab";
  }, []);

  return (
    <Suspense
      fallback={
        <div
          className="world3d-loading"
          role="status"
          aria-live="polite"
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a0a0b0',
            background: '#0a0a10',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Loading 3D world…
        </div>
      }
    >
      <World3D onExitTo2D={handleExit} />
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* P1.7 a11y: skip-to-main + SR live-region announcer.
          SkipLink is the first focusable element in DOM order so
          keyboard users can Tab → Enter past the persistent chrome. */}
      <SkipLink />
      <RouteAnnouncer />
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route
          path="/work"
          element={
            <ContentRoute>
              <WorkList />
            </ContentRoute>
          }
        />
        <Route
          path="/work/:slug"
          element={
            <ContentRoute hideDock>
              <WorkDetail />
            </ContentRoute>
          }
        />
        <Route
          path="/writing"
          element={
            <ContentRoute>
              <WritingList />
            </ContentRoute>
          }
        />
        <Route
          path="/writing/:slug"
          element={
            <ContentRoute>
              <WritingDetail />
            </ContentRoute>
          }
        />
        <Route
          path="/ideas"
          element={
            <ContentRoute>
              <IdeasList />
            </ContentRoute>
          }
        />
        <Route
          path="/ideas/:slug"
          element={
            <ContentRoute>
              <IdeaDetail />
            </ContentRoute>
          }
        />
        <Route
          path="/about"
          element={
            <ContentRoute>
              <About />
            </ContentRoute>
          }
        />
        <Route path="/3d" element={<ThreeDRoute />} />
        <Route
          path="/blog"
          element={
            <ContentRoute>
              <ComingSoon />
            </ContentRoute>
          }
        />
        <Route
          path="/anoncafe"
          element={
            <ContentRoute>
              <ComingSoon />
            </ContentRoute>
          }
        />
        <Route
          path="/404"
          element={
            <ContentRoute>
              <NotFound />
            </ContentRoute>
          }
        />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
