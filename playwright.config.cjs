const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.test.cjs',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3003',
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'python3 -m http.server 3003 --directory public',
    port: 3003,
    reuseExistingServer: true,
  },
});
