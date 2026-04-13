// One-shot screenshot script for F1.1 verification.
// Run with: node .harness/nodes/F1.1/run_1/screenshot.cjs
const { chromium } = require('@playwright/test');
const path = require('path');

const ROOMS = ['myroom', 'product', 'book', 'idealab'];
const OUT = path.join(__dirname);

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('[console.error]', msg.text());
  });

  await page.goto('http://localhost:5173/iamsuri/?view=3d', { waitUntil: 'networkidle' });
  // Wait for the World3D canvas to mount.
  await page.waitForFunction(() => typeof window.navigateToRoom === 'function', { timeout: 15000 });
  await page.waitForTimeout(2500);

  for (const room of ROOMS) {
    await page.evaluate((r) => window.navigateToRoom(r), room);
    await page.waitForTimeout(1800);
    const out = path.join(OUT, `3d-${room}.png`);
    await page.screenshot({ path: out });
    console.log('wrote', out);
  }

  await browser.close();
})();
