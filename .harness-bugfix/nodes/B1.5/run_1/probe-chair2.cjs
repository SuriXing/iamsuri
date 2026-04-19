const { chromium } = require('playwright');
const path = require('path');
const SCREEN_DIR = path.join(__dirname, 'screens');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:5173/?view=3d');
  await page.waitForFunction(() => !!window.__worldStore);
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    s.setIntroPhase('follow');
    for (const r of ['myroom','product','book','idealab']) s.unlockDoor(r);
    s.setViewMode('book');
  });
  await page.waitForTimeout(1000);

  // Cushion box at y=0.55±0.1, z=3.98 (chairZ - 0.02), x=-3.9, hx=0.35.
  // Stand at z=4.5, look down with pitch toward (x=-3.9, y=0.55, z=3.98).
  // dx=0, dy=0.55-1.6=-1.05, dz=3.98-4.5=-0.52
  // forward = (-sinY*cosP, sinP, -cosY*cosP). Want y=-1.05 over distance ~1.17 → sinP=-0.9 → pitch=-1.12 rad.
  // But fpPitch may be clamped. Try -1.0.
  for (const [zPos, pitch, label] of [[4.5, -0.9, 'z=4.5,p=-0.9'], [4.3, -1.2, 'z=4.3,p=-1.2'], [4.6, -0.8, 'z=4.6,p=-0.8'], [4.8, -0.6, 'z=4.8,p=-0.6']]) {
    await page.evaluate(({z,p}) => {
      const s = window.__worldStore.getState();
      s.setCharPos(-3.9, z);
      s.setFp(true, 0, p);
    }, { z: zPos, p: pitch });
    await page.waitForTimeout(500);
    const f = await page.evaluate(() => window.__worldStore.getState().focusedInteractable);
    console.log(`${label}:`, f?.title || 'null');
    if (f && f.title && f.title.includes('许三观')) {
      await page.keyboard.press('e');
      await page.waitForTimeout(400);
      const m = await page.evaluate(() => window.__worldStore.getState().modalInteractable);
      console.log('  MODAL:', m.title);
      console.log('  body len:', (m.body || '').length);
      console.log('  body preview:', (m.body || '').slice(0, 200));
      await page.screenshot({ path: path.join(SCREEN_DIR, 'A2-modal.png') });
      break;
    }
  }
  await browser.close();
})();
