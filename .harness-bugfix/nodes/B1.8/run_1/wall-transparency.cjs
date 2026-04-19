const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  await p.setViewportSize({ width: 1280, height: 800 });
  await p.goto('http://localhost:5173/3d');
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(500);
  await p.evaluate(() => window.__worldStore.getState().setIntroPhase('follow'));
  await p.waitForTimeout(300);
  // Walk into myroom then move to a wall
  await p.evaluate(() => {
    const s = window.__worldStore.getState();
    s.setCharPos(-3.7, 0);
  });
  await p.waitForTimeout(300);
  await p.keyboard.down('w');
  await p.waitForTimeout(2500);
  await p.keyboard.up('w');
  let st = await p.evaluate(() => window.__worldStore.getState().charPos);
  console.log('inside myroom at', st);
  // Now press D to move to east wall (x → less negative)
  await p.evaluate(() => {
    const s = window.__worldStore.getState();
    // Force position right against east wall x=-2 (room x=-3.7, ROOM/2=2.5, so wall at x=-3.7+2.5=-1.2; player against wall at x=-1.4)
    s.setCharPos(-1.5, -3.7);
  });
  await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/door-video/01-FP-against-east-wall.png' });
  console.log('camera near after FP:', await p.evaluate(() => window.__camera.near));
  await p.screenshot({ path: '/Users/surixing/Code/SuriWorld/SuriWorld/.harness-bugfix/nodes/B1.8/run_1/screens/FP-against-wall.png' });
  await b.close();
})();
