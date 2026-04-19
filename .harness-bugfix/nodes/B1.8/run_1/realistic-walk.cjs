const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.setViewportSize({ width: 1280, height: 800 });
  await p.goto('http://localhost:5173/3d');
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(500);
  await p.evaluate(() => window.__worldStore.getState().setIntroPhase('follow'));
  await p.waitForTimeout(300);

  // Get the door positions
  const doors = await p.evaluate(() => {
    const ROOMS = window.__worldStore.getState();
    // Use module access via known refs - read from rooms
    return ['myroom','product','book','idealab'].map(id => {
      const s = window.__worldStore.getState();
      // We don't have direct access; just inspect colliders
      return id;
    });
  });

  // Realistic test: start char NOT directly in front of door, simulate slight off-center walk
  const tests = [
    { name: 'myroom-perfect', start: [-3.7, 0], drive: 'w', durationMs: 3500 },
    { name: 'myroom-offset-x', start: [-3.4, 0], drive: 'w', durationMs: 3500 },  // off by 0.3
    { name: 'myroom-offset-x-half', start: [-3.5, 0], drive: 'w', durationMs: 3500 },
    { name: 'myroom-from-origin-diagonal', start: [0, 0], drive: 'wa', durationMs: 5000 },
  ];

  for (const t of tests) {
    await p.evaluate(() => {
      const s = window.__worldStore.getState();
      s.setViewMode('overview');
      s.setFp(false, 0, 0);
    });
    await p.waitForTimeout(300);
    await p.evaluate((s) => {
      window.__worldStore.getState().setCharPos(s[0], s[1]);
    }, t.start);
    await p.waitForTimeout(300);
    for (const k of t.drive) await p.keyboard.down(k);
    let blocked = false, lastX = t.start[0], lastZ = t.start[1], stuckFor = 0;
    const interval = 250;
    const ticks = Math.ceil(t.durationMs / interval);
    let entered = false, finalState = null;
    for (let i = 0; i < ticks; i++) {
      await p.waitForTimeout(interval);
      const st = await p.evaluate(() => {
        const s = window.__worldStore.getState();
        return { vm: s.viewMode, fp: s.fpActive, x: s.charPos.x, z: s.charPos.z };
      });
      finalState = st;
      if (st.vm !== 'overview' && !entered) entered = true;
      if (Math.abs(st.x - lastX) < 0.01 && Math.abs(st.z - lastZ) < 0.01) {
        stuckFor += interval;
      } else {
        stuckFor = 0;
      }
      lastX = st.x; lastZ = st.z;
    }
    for (const k of t.drive) await p.keyboard.up(k);
    console.log(`${t.name}: start=${t.start} drive=${t.drive} → entered=${entered} finalPos=(${finalState.x.toFixed(2)},${finalState.z.toFixed(2)}) vm=${finalState.vm} stuckFor=${stuckFor}ms`);
  }
  await b.close();
})();
