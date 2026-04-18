// R4.1 doorway screenshots — 4 rooms × {down, up} = 8 PNGs.
// Uses fpYaw/fpPitch via __worldStore.setFp. Outputs to
// .harness/nodes/R4.1/run_1/screens/doorway-{room}-{down|up}.png
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOMS = ['myroom', 'product', 'book', 'idealab'];
// Door positions per room (cz<0 → door at z=-(GAP+0.05)) — pitch-down looks
// at the floor seam at the doorway from inside the room. Yaw points the
// camera toward the corridor.
const HALF = 5 / 2 + 1.2;
const GAP = 1.2;
const ROOM_INFO = {
  myroom:  { cx: -HALF, cz: -HALF, doorYaw: Math.PI },         // door at +z relative to room → looking -z toward corridor; FP yaw=π faces -z
  product: { cx:  HALF, cz: -HALF, doorYaw: Math.PI },
  book:    { cx: -HALF, cz:  HALF, doorYaw: 0 },
  idealab: { cx:  HALF, cz:  HALF, doorYaw: 0 },
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('PAGEERR', e.message));

  const outDir = path.join(__dirname, '..', '.harness', 'nodes', 'R4.1', 'run_1', 'screens');
  fs.mkdirSync(outDir, { recursive: true });

  // Force dark theme via localStorage before navigating.
  await page.addInitScript(() => {
    try { localStorage.setItem('suri-theme', 'dark'); } catch (_) {}
  });

  await page.goto('http://localhost:5173/?view=3d');
  await page.waitForFunction(() => !!window.__worldStore, { timeout: 15000 });
  await page.waitForTimeout(800);

  for (const room of ROOMS) {
    const info = ROOM_INFO[room];
    // Enter room via store (bypasses intro/door-unlock dance).
    await page.evaluate((r) => {
      const st = window.__worldStore.getState();
      // Unlock the door so the player can stand inside without walking through.
      if (st.unlockDoor) st.unlockDoor(r);
      // setViewMode(roomId) flips into FP/room mode.
      st.setViewMode(r);
    }, room);
    await page.waitForTimeout(600);

    // Look DOWN at the doorway threshold.
    await page.evaluate(({ yaw }) => {
      const st = window.__worldStore.getState();
      st.setFp(true, yaw, -1.2); // pitch ≈ −1.2 rad (close to FP.pitchMin)
    }, { yaw: info.doorYaw });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, `doorway-${room}-down.png`) });

    // Look UP at the lintel + ceiling seam of the doorway.
    await page.evaluate(({ yaw }) => {
      const st = window.__worldStore.getState();
      st.setFp(true, yaw, 1.2);
    }, { yaw: info.doorYaw });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, `doorway-${room}-up.png`) });

    // Exit back to overview before next room (cleanup).
    await page.evaluate(() => window.__worldStore.getState().setViewMode('overview'));
    await page.waitForTimeout(300);
  }

  await browser.close();
  console.log('OK — 8 PNGs written to', outDir);
})();
