import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Deployed to iamsuri.ai via Vercel — root-relative paths.
// (Previously served under /iamsuri/ on GitHub Pages.)
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    chunkSizeWarningLimit: 1500,
  },
  // Pre-bundle the heavy 3D deps at dev-server start so the first cold
  // navigation to `/3d` doesn't pay the ESM crawl cost. Measurable win
  // for the Playwright perf test (`page loads in reasonable time`)
  // which asserts a 5s upper bound on `goto('/?view=3d')`.
  optimizeDeps: {
    include: [
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'zustand',
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
    ],
  },
});
