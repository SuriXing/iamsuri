import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App3D from './App3D';
// Side-effect import: installs window.__worldStore seam for tests/dev.
// Kept here so the store module loads even when no components import it yet.
import './store/worldStore';

const rootEl = document.getElementById('world3d-root');
if (!rootEl) throw new Error('#world3d-root not found');
createRoot(rootEl).render(
  <StrictMode>
    <App3D />
  </StrictMode>,
);
