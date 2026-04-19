const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const SCREEN_DIR = path.join(__dirname, 'screens');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => console.log('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:5173/?view=3d');
  await page.waitForFunction(() => !!window.__worldStore);
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    s.setIntroPhase('follow');
    for (const r of ['myroom','product','book','idealab']) s.unlockDoor(r);
    s.setViewMode('book');
  });
  await page.waitForTimeout(1000);
  // Chair at (-3.9, 4.0). Stand in front of chair (z=4.5) facing chair (-z direction → yaw=0? let's try variants).
  // FP forward = (-sin(yaw), -cos(yaw)). To face -z (i.e., walk toward chair from +z side), need forward=(0,-1) → yaw=0? Actually -cos(0)=-1 ✓
  // So char at z=4.5, looking yaw=0 → forward=(0,-1) → looks toward -z, toward chair at z=4.0.
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    s.setCharPos(-3.9, 4.5);
    s.setFp(true, 0, 0);
  });
  await page.waitForTimeout(800);
  const f1 = await page.evaluate(() => window.__worldStore.getState().focusedInteractable);
  console.log('z=4.5 yaw=0:', f1?.title);
  // Also try standing closer.
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    s.setCharPos(-3.9, 4.3); s.setFp(true, 0, 0);
  });
  await page.waitForTimeout(500);
  const f2 = await page.evaluate(() => window.__worldStore.getState().focusedInteractable);
  console.log('z=4.3 yaw=0:', f2?.title);

  // Slight off-center: x=-3.6 (0.3 off-center on cushion box hx=0.7 → 0.35 half-extent. So x=-3.55 is ~0.05 off edge but cushion is 0.7 wide centered at -3.9 → from -4.25 to -3.55. So -3.55 is right at edge.)
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    s.setCharPos(-3.6, 4.5); s.setFp(true, 0, 0);
  });
  await page.waitForTimeout(500);
  const f3 = await page.evaluate(() => window.__worldStore.getState().focusedInteractable);
  console.log('off-center x=-3.6:', f3?.title);
  if (f3) {
    await page.keyboard.press('e');
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => window.__worldStore.getState().modalInteractable);
    console.log('modal:', m?.title, 'body len:', (m?.body || m?.description || '').length);
    console.log('contains 许三观:', (m?.title || '').includes('许三观'));
    await page.screenshot({ path: path.join(SCREEN_DIR, 'A2-modal.png') });
  }
  await browser.close();
})();
