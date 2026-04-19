// Walk-through verification for B1.1.
// Installs an in-page subscriber so we capture EVERY charPos / state
// change with sub-frame fidelity (no CDP polling jitter). Then drives
// W to enter myroom, S to exit. Asserts:
//   - FP triggers from a walk-through (no E key)
//   - The teleport delta at the exact instant fpActive flips on is ≤0.5u
//   - Walking back S returns to overview without an E/Esc keypress
//   - No FP↔overview ping-pong (no flip within 0.5s on a single straight walk)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.env.B11_URL || 'http://localhost:5175/?view=3d';
const SCREEN_DIR = path.join(__dirname, 'screens');
const LOG = path.join(__dirname, 'walkthrough.txt');
fs.mkdirSync(SCREEN_DIR, { recursive: true });

const lines = [];
function log(msg) { lines.push(msg); console.log(msg); }

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => log('PAGEERROR: ' + e.message));

  await page.goto(URL);
  await page.waitForFunction(() => !!window.__worldStore, { timeout: 15000 });

  // Skip intro, unlock myroom, position char in hallway just south of door
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    s.setIntroPhase('follow');
    s.unlockDoor('myroom');
    s.setCharPos(-3.7, 0.0);  // hallway center, just south of myroom door (-3.7, -1.25)
    // Install in-page subscriber that records every store change.
    window.__b11log = [];
    window.__b11unsub = window.__worldStore.subscribe((s) => {
      window.__b11log.push({
        t: performance.now(),
        x: s.charPos.x, z: s.charPos.z,
        vm: s.viewMode, fp: s.fpActive, vt: s.viewTransition,
      });
    });
  });
  await page.waitForTimeout(300);

  log('Initial: ' + JSON.stringify(await page.evaluate(() => {
    const s = window.__worldStore.getState();
    return { charPos: s.charPos, viewMode: s.viewMode, fpActive: s.fpActive };
  })));
  await page.screenshot({ path: path.join(SCREEN_DIR, '01-outside-door.png') });

  // Press W: walk north (charPos.z DECREASES toward myroom's door at z=-1.25, room center at z=-3.7).
  await page.keyboard.down('w');
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(SCREEN_DIR, '02-mid-doorway.png') });

  // Wait for fpActive
  const t0 = Date.now();
  let entered = false;
  while (Date.now() - t0 < 4000) {
    const fp = await page.evaluate(() => window.__worldStore.getState().fpActive);
    if (fp) { entered = true; break; }
    await page.waitForTimeout(40);
  }
  log('Entered FP: ' + entered);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREEN_DIR, '03-just-inside.png') });
  await page.keyboard.up('w');

  // Now extract teleport delta from the subscriber log: find the index
  // where fp flipped false→true; compare charPos to the immediately
  // preceding sample (sub-frame, recorded only when state changed).
  const log1 = await page.evaluate(() => window.__b11log.slice());
  let teleportDelta = null;
  let triggerIdx = -1;
  for (let i = 1; i < log1.length; i++) {
    if (!log1[i - 1].fp && log1[i].fp) {
      teleportDelta = Math.hypot(log1[i].x - log1[i - 1].x, log1[i].z - log1[i - 1].z);
      triggerIdx = i;
      log(`FP-on at idx ${i} t=${log1[i].t.toFixed(0)}: prev=(${log1[i-1].x.toFixed(3)},${log1[i-1].z.toFixed(3)}) new=(${log1[i].x.toFixed(3)},${log1[i].z.toFixed(3)}) Δ=${teleportDelta.toFixed(3)}`);
      break;
    }
  }
  // Also report viewTransition='entering' moment for reference.
  const enteringIdx = log1.findIndex(s => s.vt === 'entering');
  if (enteringIdx >= 0) {
    log(`viewTransition=entering at idx ${enteringIdx}: pos=(${log1[enteringIdx].x.toFixed(3)},${log1[enteringIdx].z.toFixed(3)})`);
  }

  // Reset subscriber log; press S to walk back out.
  await page.evaluate(() => { window.__b11log = []; });
  log('Walking back out (S)...');
  await page.keyboard.down('s');
  // Wait until viewMode returns to overview OR 2500ms.
  const t1 = Date.now();
  let exited = false;
  while (Date.now() - t1 < 2500) {
    const vm = await page.evaluate(() => window.__worldStore.getState().viewMode);
    if (vm === 'overview') { exited = true; break; }
    await page.waitForTimeout(40);
  }
  await page.keyboard.up('s');
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(SCREEN_DIR, '04-exiting.png') });

  const log2 = await page.evaluate(() => window.__b11log.slice());
  const finalState = await page.evaluate(() => {
    const s = window.__worldStore.getState();
    return { vm: s.viewMode, fp: s.fpActive, x: s.charPos.x, z: s.charPos.z };
  });
  log('Final: ' + JSON.stringify(finalState));
  log(`Exit reached overview within 2.5s: ${exited}`);

  // Ping-pong: count fp flips during S-walk + check spacing
  let flips = 0;
  let pingPong = false;
  let lastFlipT = -Infinity;
  for (let i = 1; i < log2.length; i++) {
    if (log2[i].fp !== log2[i - 1].fp) {
      if (log2[i].t - lastFlipT < 500) pingPong = true;
      lastFlipT = log2[i].t;
      flips++;
    }
  }
  log(`FP flips during S-walk: ${flips}, pingPong<0.5s: ${pingPong}`);

  await page.evaluate(() => { try { window.__b11unsub?.(); } catch {} });

  const passes = {
    entered,
    teleportDelta,
    teleportLE05: teleportDelta !== null && teleportDelta <= 0.5,
    exitedToOverview: exited,
    noPingPong: !pingPong,
  };
  log('PASSES: ' + JSON.stringify(passes, null, 2));
  fs.writeFileSync(LOG, lines.join('\n'));
  await browser.close();

  const ok = passes.entered && passes.teleportLE05 && passes.exitedToOverview && passes.noPingPong;
  process.exit(ok ? 0 : 1);
})().catch(e => {
  console.error(e);
  fs.writeFileSync(LOG, lines.join('\n') + '\nERROR: ' + e.stack);
  process.exit(2);
});
