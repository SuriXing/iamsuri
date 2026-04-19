const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  p.on('console', m => { if(m.type()==='error') console.log('CONSOLE.ERROR', m.text()); });
  await p.goto('http://localhost:5173/3d');
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(500);
  // Skip intro
  await p.evaluate(() => {
    const s = window.__worldStore.getState();
    s.setIntroPhase('follow');
  });
  await p.waitForTimeout(300);

  const tests = [
    { name: 'myroom', target: { x: -3.7, z: -1.8 } },
    { name: 'product', target: { x: 3.7, z: -1.8 } },
    { name: 'book', target: { x: -3.7, z: 1.8 } },
    { name: 'idealab', target: { x: 3.7, z: 1.8 } },
  ];

  for (const t of tests) {
    // Reset
    await p.evaluate(() => {
      const s = window.__worldStore.getState();
      s.setViewMode('overview');
      s.setCharPos(0, 0);
      s.setFp(false, 0, 0);
    });
    await p.waitForTimeout(400);
    // Teleport directly past the door plane (≥ 0.4 inside)
    await p.evaluate((t) => {
      const s = window.__worldStore.getState();
      // Place at a position well inside the room (z=±1.8 puts player 0.55 past door)
      s.setCharPos(t.target.x, t.target.z);
    }, t);
    await p.waitForTimeout(800);
    const result = await p.evaluate(() => {
      const s = window.__worldStore.getState();
      return { vm: s.viewMode, fp: s.fpActive, pos: s.charPos };
    });
    console.log(`${t.name}: target=${JSON.stringify(t.target)} → vm=${result.vm} fp=${result.fp} pos=${JSON.stringify(result.pos)}`);
  }
  await b.close();
})();
