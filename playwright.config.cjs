const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.test.cjs',
  timeout: 30000,
  use: {
    // Vite serves the app under the `/iamsuri/` base path defined in vite.config.ts.
    baseURL: 'http://localhost:5173',
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'npx vite --port 5173 --strictPort',
    port: 5173,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
