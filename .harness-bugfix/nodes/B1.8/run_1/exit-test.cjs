const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto('http://localhost:5173/3d');
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(500);
  await p.evaluate(() => window.__worldStore.getState().setIntroPhase('follow'));
  await p.waitForTimeout(300);

  // Walk-into via auto-enter (simulates real user)
  console.log('--- driving W from origin to walk into myroom ---');
  await p.evaluate(() => window.__worldStore.getState().setCharPos(-3.7, 0));
  await p.waitForTimeout(400);
  await p.keyboard.down('w');
  for (let i = 0; i < 12; i++) {
    await p.waitForTimeout(250);
    const st = await p.evaluate(() => {
      const s = window.__worldStore.getState();
      return { vm: s.viewMode, fp: s.fpActive, x: s.charPos.x.toFixed(2), z: s.charPos.z.toFixed(2) };
    });
    console.log(`t=${(i+1)*0.25}s ${JSON.stringify(st)}`);
  }
  await p.keyboard.up('w');
  console.log('--- now press S to exit ---');
  await p.keyboard.down('s');
  for (let i = 0; i < 16; i++) {
    await p.waitForTimeout(250);
    const st = await p.evaluate(() => {
      const s = window.__worldStore.getState();
      return { vm: s.viewMode, fp: s.fpActive, x: s.charPos.x.toFixed(2), z: s.charPos.z.toFixed(2), fpYaw: s.fpYaw.toFixed(2) };
    });
    console.log(`exit t=${(i+1)*0.25}s ${JSON.stringify(st)}`);
  }
  await p.keyboard.up('s');
  await b.close();
})();
