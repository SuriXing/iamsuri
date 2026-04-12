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
});
