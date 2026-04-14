import { createRoot } from 'react-dom/client';
// NOTE: fonts.css is intentionally NOT imported here. The 3D route
// (/3d) doesn't need Fraunces/Inter/JetBrains Mono — it's a canvas. Only
// the editorial Landing component imports fonts.css, so the /3d cold
// boot stays lightweight and the Playwright 5s load budget holds.
import './styles/tokens.css';
import './styles/theme.css';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';

// StrictMode intentionally omitted: @react-three/fiber + our WebGL shadow
// pipeline don't survive StrictMode's dev-only double-invoke cleanly — the
// Canvas receives a dispose → remount on every effect pass, which
// visibly flickers the scene (shadow map regenerates, lights flash). The
// prod bundle never had StrictMode enabled either. If we want StrictMode
// back, we'd need to either wrap only the 2D subtree or pin to an r3f
// release that guards its internal state against the double-mount.
createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
);
