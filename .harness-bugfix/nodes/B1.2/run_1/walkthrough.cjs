// B1.2 verification: Product room rack at back wall, single-rect carpet.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.env.B12_URL || 'http://localhost:5173/?view=3d';
const SCREEN_DIR = path.join(__dirname, 'screens');
fs.mkdirSync(SCREEN_DIR, { recursive: true });
const lines = [];
const log = (m) => { lines.push(m); console.log(m); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => log('PAGEERROR: ' + e.message));

  await page.goto(URL);
  await page.waitForFunction(() => !!window.__worldStore, { timeout: 15000 });

  // Skip intro, unlock product, position char south of product door (3.7, -1.25)
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    s.setIntroPhase('follow');
    s.unlockDoor && s.unlockDoor('product');
    s.setCharPos(3.7, 0.0);
  });
  await page.waitForTimeout(300);

  // Walk north into product room
  // Focus the canvas so keyboard input reaches the controls
  await page.click('canvas');
  await page.waitForTimeout(100);
  await page.keyboard.down('w');
  const t0 = Date.now();
  let entered = false;
  let lastPos = null;
  while (Date.now() - t0 < 8000) {
    const st = await page.evaluate(() => {
      const s = window.__worldStore.getState();
      return { fp: s.fpActive, vm: s.viewMode, x: s.charPos.x, z: s.charPos.z };
    });
    lastPos = st;
    if (st.fp) { entered = true; break; }
    await page.waitForTimeout(60);
  }
  await page.keyboard.up('w');
  log('lastPos: ' + JSON.stringify(lastPos));
  await page.waitForTimeout(400);
  log('Entered FP product: ' + entered);

  await page.screenshot({ path: path.join(SCREEN_DIR, 'product-fp.png') });

  // Top-down: release viewMode to overview, then snap camera every frame
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    s.setViewMode && s.setViewMode('overview');
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    window.__tdInterval = setInterval(() => {
      const cam = window.__camera;
      if (!cam) return;
      cam.position.set(3.7, 9, -3.7);
      cam.lookAt(3.7, 0, -3.7);
      cam.up.set(0, 0, -1);
      cam.updateProjectionMatrix && cam.updateProjectionMatrix();
    }, 16);
  });
  await page.waitForTimeout(800);
  const tdInfo = await page.evaluate(() => {
    const cam = window.__camera;
    return cam ? { ok: true, pos: [cam.position.x, cam.position.y, cam.position.z] } : { ok: false };
  });
  log('TD cam: ' + JSON.stringify(tdInfo));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREEN_DIR, 'product-topdown.png') });

  fs.writeFileSync(path.join(__dirname, 'walkthrough.txt'), lines.join('\n'));
  await browser.close();
  process.exit(entered ? 0 : 1);
})().catch(e => {
  console.error(e);
  fs.writeFileSync(path.join(__dirname, 'walkthrough.txt'), lines.join('\n') + '\nERR ' + e.stack);
  process.exit(2);
});
