// F3.7 screenshot capture — doors + walls polish.
// Runs standalone with `node capture.cjs` against a dev server on $PORT.
const { chromium } = require('@playwright/test');
const path = require('path');

const PORT = process.env.PORT || '5175';
const OUT = __dirname;

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  page.on('pageerror', (e) => console.error('PAGEERROR:', e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('CONSOLE:', msg.text());
  });

  await page.goto(`http://localhost:${PORT}/?view=3d`);
  // Wait for overview labels to render.
  await page.waitForSelector('#label-myroom', { timeout: 15000 });
  await page.waitForTimeout(2500);

  // Skip intro via the store seam.
  await page.evaluate(() => {
    const w = window.__worldStore;
    if (w) {
      const s = w.getState();
      if (typeof s.setIntroPhase === 'function') s.setIntroPhase('follow');
    }
  });
  await page.waitForTimeout(1000);

  // 1) Walls overview — wide-angle at origin. Rotate camera via store seam if available.
  await page.screenshot({ path: path.join(OUT, 'screenshot-walls-overview.png') });
  console.log('captured screenshot-walls-overview.png');

  // 2) Approach the MyRoom door but don't unlock — locked state.
  await page.evaluate(() => {
    const w = window.__worldStore;
    if (!w) return;
    const state = w.getState();
    if (state.unlockedDoors && typeof state.unlockedDoors.clear === 'function') {
      state.unlockedDoors.clear();
    }
    // MyRoom door is at (-half, -(GAP+0.05)) = (-3.7, -1.25). Park the player
    // just on the hallway side so the camera frames the door from ~1.5 units back.
    if (typeof state.setCharPos === 'function') state.setCharPos(-3.7, -0.6);
    if (typeof state.setCharFacing === 'function') state.setCharFacing(Math.PI); // face -z
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT, 'screenshot-door-locked.png') });
  console.log('captured screenshot-door-locked.png');

  // 3) Unlock myroom door and re-screenshot for lantern-gold state.
  await page.evaluate(() => {
    const w = window.__worldStore;
    if (!w) return;
    const state = w.getState();
    if (typeof state.unlockDoor === 'function') state.unlockDoor('myroom');
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT, 'screenshot-door-unlocked.png') });
  console.log('captured screenshot-door-unlocked.png');

  // 4) Walls close-up — move player next to a wall to see baseboard/top trim.
  await page.evaluate(() => {
    const w = window.__worldStore;
    if (!w) return;
    const state = w.getState();
    if (typeof state.setCharPos === 'function') state.setCharPos(-1.5, -1.0);
    if (typeof state.setCharFacing === 'function') state.setCharFacing(-Math.PI / 2);
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, 'screenshot-walls-closeup.png') });
  console.log('captured screenshot-walls-closeup.png');

  await browser.close();
})();
