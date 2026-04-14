import { StrictMode } from 'react';
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
