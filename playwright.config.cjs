const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.test.cjs',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 1280, height: 720 },
  },
  // P1.9: run against the static production build via `vite preview` instead
  // of `vite dev`. The dev server was crashing under the 3D test load with
  // ERR_CONNECTION_REFUSED (flake confirmed by P1.2 architect review: 9/12
  // and 7/12 on two consecutive full-suite runs). `vite preview` serves the
  // already-built dist/ — no ESM crawl, no HMR, no ws reconnects — so the
  // 3D test suite runs reliably. Requires a prior `npm run build`.
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
