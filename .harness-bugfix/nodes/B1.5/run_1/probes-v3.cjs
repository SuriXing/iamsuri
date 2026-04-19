// Targeted probes for book seat + product room polish + ping-pong stress.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.env.QA_URL || 'http://localhost:5173/?view=3d';
const SCREEN_DIR = path.join(__dirname, 'screens');
const LOG = path.join(__dirname, 'probes-v3.txt');
const lines = [];
const log = (m) => { lines.push(m); console.log(m); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => log('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') log('CONSOLE.ERROR: ' + m.text()); });

  await page.goto(URL);
  await page.waitForFunction(() => !!window.__worldStore, { timeout: 15000 });
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    s.setIntroPhase('follow');
    for (const r of ['myroom','product','book','idealab']) s.unlockDoor(r);
  });
  await page.waitForTimeout(300);

  // ---------- Probe A: Book seat — teleport directly onto chair ----------
  log('\n=== Probe A: book seat focus + modal ===');
  // Force enter book room.
  await page.evaluate(() => window.__worldStore.getState().setViewMode('book'));
  await page.waitForTimeout(800);
  // Chair at (-3.9, 4.0). Teleport char there.
  await page.evaluate(() => window.__worldStore.getState().setCharPos(-3.9, 4.0));
  await page.waitForTimeout(600);
  const st1 = await page.evaluate(() => {
    const s = window.__worldStore.getState();
    return { vm: s.viewMode, fp: s.fpActive, focused: s.focusedInteractable?.title || null,
             focusedRoom: s.focusedInteractable?.room || null,
             pos: s.charPos };
  });
  log(`  on-chair state: ${JSON.stringify(st1)}`);
  await page.screenshot({ path: path.join(SCREEN_DIR, 'A-on-chair.png') });

  // Try slight nudges to find focus.
  const nudges = [[0,0],[0.2,0],[-0.2,0],[0,0.2],[0,-0.2],[0.3,0.3],[-0.3,-0.3]];
  let bestFocus = null;
  for (const [dx, dz] of nudges) {
    await page.evaluate(({x,z}) => window.__worldStore.getState().setCharPos(x, z), { x: -3.9 + dx, z: 4.0 + dz });
    await page.waitForTimeout(400);
    const f = await page.evaluate(() => window.__worldStore.getState().focusedInteractable);
    if (f) { bestFocus = f; log(`  focus @ Δ(${dx},${dz}): ${f.title}`); break; }
  }
  if (!bestFocus) log('  NO FOCUS at any chair-area position');
  if (bestFocus && bestFocus.title) {
    await page.keyboard.press('e');
    await page.waitForTimeout(400);
    const modal = await page.evaluate(() => window.__worldStore.getState().modalInteractable);
    log(`  modal title: ${modal?.title}`);
    log(`  modal body length: ${modal?.body?.length || modal?.description?.length || 0}`);
    log(`  contains 许三观: ${modal?.title?.includes('许三观') || modal?.body?.includes('许三观')}`);
    await page.screenshot({ path: path.join(SCREEN_DIR, 'A-modal.png') });
  }

  // ---------- Probe B: Product Room polish — top-down view ----------
  log('\n=== Probe B: product room polish (top-down via __camera) ===');
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    if (s.modalInteractable) s.closeModal();
    s.setViewMode('product');
  });
  await page.waitForTimeout(900);
  // Top-down camera: place above product room center (3.7, 3.7).
  await page.evaluate(() => {
    const c = window.__camera;
    if (!c) return;
    c.position.set(3.7, 12, 3.7);
    c.lookAt(3.7, 0, 3.7);
    c.updateMatrixWorld(true);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREEN_DIR, 'B-product-topdown.png') });
  // FP eye-level view too:
  await page.evaluate(() => {
    const c = window.__camera;
    if (!c) return;
    c.position.set(3.7, 1.6, 3.7 - 1.7);
    c.lookAt(3.7, 1.4, 3.7);
    c.updateMatrixWorld(true);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREEN_DIR, 'B-product-fp.png') });

  // ---------- Probe C: Ping-pong stress — walk through doorway and back fast ----------
  log('\n=== Probe C: rapid in-out at doorway (book) ===');
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    if (s.fpActive || s.viewMode !== 'overview') s.setViewMode('overview');
  });
  await page.waitForTimeout(700);
  await page.evaluate(() => window.__worldStore.getState().setCharPos(-3.7, 0.0));
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    window.__pp_log = [];
    if (window.__pp_unsub) window.__pp_unsub();
    window.__pp_unsub = window.__worldStore.subscribe((s) => {
      window.__pp_log.push({ t: performance.now(), z: s.charPos.z, vm: s.viewMode, fp: s.fpActive });
    });
  });
  // Drive S into book, then immediately W to come out, repeat 3x.
  for (let i = 0; i < 3; i++) {
    await page.keyboard.down('s');
    await page.waitForTimeout(900);
    await page.keyboard.up('s');
    await page.waitForTimeout(50);
    await page.keyboard.down('w');
    await page.waitForTimeout(900);
    await page.keyboard.up('w');
    await page.waitForTimeout(50);
  }
  const events = await page.evaluate(() => window.__pp_log.slice());
  let flips = 0;
  let minGap = Infinity;
  let prev = null;
  for (let i = 1; i < events.length; i++) {
    if (events[i].fp !== events[i-1].fp) {
      flips++;
      if (prev !== null) minGap = Math.min(minGap, events[i].t - prev);
      prev = events[i].t;
    }
  }
  log(`  total fp flips during 3 cycles: ${flips}; min gap between flips: ${minGap.toFixed(0)}ms`);

  // ---------- Probe D: yaw hint stays cleared after entry (book room tween fight) ----------
  log('\n=== Probe D: yaw hint cleared after entry (longer sample) ===');
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    if (s.fpActive || s.viewMode !== 'overview') s.setViewMode('overview');
  });
  await page.waitForTimeout(700);
  await page.evaluate(() => window.__worldStore.getState().setCharPos(-3.7, -0.3));
  await page.waitForTimeout(300);
  await page.keyboard.down('s');
  // Sample camera y rotation for 2.5s.
  const samples = [];
  for (let i = 0; i < 50; i++) {
    samples.push(await page.evaluate(() => ({
      t: performance.now(),
      y: window.__camera ? window.__camera.rotation.y : null,
      vm: window.__worldStore.getState().viewMode,
      fp: window.__worldStore.getState().fpActive,
    })));
    await page.waitForTimeout(50);
  }
  await page.keyboard.up('s');
  const enterIdx = samples.findIndex(s => s.fp);
  if (enterIdx > 0) {
    const post = samples.slice(enterIdx + 5); // skip first 5 frames after entry (room tween starts)
    if (post.length > 5) {
      const ys = post.map(s => s.y);
      const range = Math.max(...ys) - Math.min(...ys);
      log(`  post-entry stability (${post.length} samples): yaw range=${range.toFixed(4)} rad`);
      log(`  first post: ${post[0].y.toFixed(4)} last: ${post[post.length-1].y.toFixed(4)}`);
    }
  }

  fs.writeFileSync(LOG, lines.join('\n'));
  await browser.close();
})().catch(e => {
  log('FATAL: ' + e.stack);
  fs.writeFileSync(LOG, lines.join('\n'));
  process.exit(1);
});
