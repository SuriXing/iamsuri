// Independent QA probes for B1.1–B1.4 (v2).
// Uses the proven B1.1 recipe: position char in hallway, walk into door.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.env.QA_URL || 'http://localhost:5173/?view=3d';
const SCREEN_DIR = path.join(__dirname, 'screens');
const LOG = path.join(__dirname, 'probes-v2.txt');
fs.mkdirSync(SCREEN_DIR, { recursive: true });
const lines = [];
const log = (m) => { lines.push(m); console.log(m); };

// Room layout: half=3.7. Doors at (±3.7, ±1.25), centers at (±3.7, ±3.7).
// Hallway start positions (just inside the hallway at the door's x):
const ROOMS = {
  myroom:  { hallStart: { x: -3.7, z:  0.0 }, walkKey: 'w', exitKey: 's' },  // door z=-1.25, center z=-3.7
  product: { hallStart: { x:  3.7, z:  0.0 }, walkKey: 'w', exitKey: 's' },
  book:    { hallStart: { x: -3.7, z:  0.0 }, walkKey: 's', exitKey: 'w' },  // door z=+1.25, center z=+3.7
  idealab: { hallStart: { x:  3.7, z:  0.0 }, walkKey: 's', exitKey: 'w' },
};

async function setup(page) {
  await page.goto(URL);
  await page.waitForFunction(() => !!window.__worldStore, { timeout: 15000 });
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    s.setIntroPhase('follow');
    for (const r of ['myroom','product','book','idealab']) s.unlockDoor(r);
  });
  await page.waitForTimeout(300);
}

async function snap(page, name) { await page.screenshot({ path: path.join(SCREEN_DIR, name) }); }
async function getState(page) {
  return page.evaluate(() => {
    const s = window.__worldStore.getState();
    return {
      x: s.charPos.x, z: s.charPos.z, vm: s.viewMode, fp: s.fpActive,
      vt: s.viewTransition, nearby: s.nearbyRoom,
      modalTitle: s.modalInteractable?.title || null,
      focused: s.focusedInteractable?.title || null,
      unlocked: Array.from(s.unlockedDoors),
    };
  });
}
async function teleport(page, x, z) {
  await page.evaluate(({ x, z }) => window.__worldStore.getState().setCharPos(x, z), { x, z });
}
async function reset(page) {
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    if (s.modalInteractable) s.closeModal();
    if (s.fpActive || s.viewMode !== 'overview') s.setViewMode('overview');
  });
  await page.waitForTimeout(500);
}
async function installLog(page) {
  await page.evaluate(() => {
    window.__qa_log = [];
    if (window.__qa_unsub) window.__qa_unsub();
    window.__qa_unsub = window.__worldStore.subscribe((s) => {
      window.__qa_log.push({ t: performance.now(), x: s.charPos.x, z: s.charPos.z, vm: s.viewMode, fp: s.fpActive, vt: s.viewTransition });
    });
  });
}
async function fetchLog(page) { return page.evaluate(() => window.__qa_log.slice()); }
function detectPingPong(events) {
  const flips = [];
  for (let i = 1; i < events.length; i++) if (events[i].fp !== events[i - 1].fp) flips.push(events[i].t);
  for (let i = 1; i < flips.length; i++) if (flips[i] - flips[i - 1] < 500) return { pingPong: true, flips };
  return { pingPong: false, flips };
}

async function waitFor(page, pred, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const v = await page.evaluate(pred);
    if (v) return true;
    await page.waitForTimeout(40);
  }
  return false;
}

async function probeWalkInOut(page, roomId) {
  log(`\n--- Probe 1.${roomId}: walk in / out ---`);
  await reset(page);
  const cfg = ROOMS[roomId];
  await teleport(page, cfg.hallStart.x, cfg.hallStart.z);
  await page.waitForTimeout(200);
  await installLog(page);

  await page.keyboard.down(cfg.walkKey);
  const entered = await waitFor(page, () => window.__worldStore.getState().fpActive, 5000);
  await page.waitForTimeout(300);
  await page.keyboard.up(cfg.walkKey);
  await page.waitForTimeout(150);
  const enteredState = await getState(page);
  log(`  ${roomId} entered: fp=${enteredState.fp} vm=${enteredState.vm} pos=(${enteredState.x.toFixed(2)},${enteredState.z.toFixed(2)})`);
  await snap(page, `${roomId}-inside.png`);

  // Walk back out.
  await page.keyboard.down(cfg.exitKey);
  const exited = await waitFor(page, () => {
    const s = window.__worldStore.getState();
    return s.viewMode === 'overview' && !s.fpActive;
  }, 5000);
  await page.keyboard.up(cfg.exitKey);
  await page.waitForTimeout(200);
  const exitState = await getState(page);
  const events = await fetchLog(page);
  const pp = detectPingPong(events);
  log(`  ${roomId} exited: vm=${exitState.vm} fp=${exitState.fp} pos=(${exitState.x.toFixed(2)},${exitState.z.toFixed(2)})`);
  log(`  ${roomId} flips=${pp.flips.length} pingPong=${pp.pingPong}`);
  return { roomId, entered, exited, pingPong: pp.pingPong, flips: pp.flips.length };
}

async function probeInterrupted(page) {
  log('\n--- Probe 2: interrupted approach (book) ---');
  await reset(page);
  // Start at (-3.7, 0), nudge S briefly, then stop and check no entry.
  await teleport(page, -3.7, 0.0);
  await page.waitForTimeout(200);
  await page.keyboard.down('s');
  await page.waitForTimeout(120); // very brief nudge
  await page.keyboard.up('s');
  const stopped = await getState(page);
  log(`  brief nudge → pos=(${stopped.x.toFixed(2)},${stopped.z.toFixed(2)}) fp=${stopped.fp} vm=${stopped.vm}`);
  await page.waitForTimeout(1200);
  const after1s = await getState(page);
  log(`  +1.2s → fp=${after1s.fp} vm=${after1s.vm}`);
  // Walk back N
  await page.keyboard.down('w');
  await page.waitForTimeout(500);
  await page.keyboard.up('w');
  const final = await getState(page);
  log(`  walked away → pos=(${final.x.toFixed(2)},${final.z.toFixed(2)}) fp=${final.fp} vm=${final.vm}`);
  return {
    pos: stopped, after1s,
    didNotAutoEnter: !stopped.fp && !after1s.fp && !final.fp,
  };
}

async function probeManualE(page) {
  log('\n--- Probe 4: manual E key still works ---');
  await reset(page);
  await teleport(page, -3.7, 0.0); // hallway, near myroom door (door z=-1.25)
  await page.waitForTimeout(300);
  // The proximity threshold is 1.6, so dist=1.25 → nearbyRoom=myroom.
  const before = await getState(page);
  log(`  before E: nearby=${before.nearby} fp=${before.fp} pos=(${before.x.toFixed(2)},${before.z.toFixed(2)})`);
  if (before.nearby !== 'myroom') log(`  WARN: nearbyRoom not detected, manual E test inconclusive`);
  await page.keyboard.press('e');
  await page.waitForTimeout(900);
  const after = await getState(page);
  log(`  after E: vm=${after.vm} fp=${after.fp}`);
  return { manualEEntered: after.vm === 'myroom' && after.fp, hadNearby: before.nearby === 'myroom' };
}

async function probeUKey(page) {
  log('\n--- Probe 5: U key still works ---');
  await reset(page);
  // Lock myroom, teleport just outside (within 1.6 proximity but >1.4 auto-unlock).
  await page.evaluate(() => window.__worldStore.getState().lockDoor('myroom'));
  // Door at -1.25; we want dist from door between 1.4 and 1.6 → z=0.2 gives dist 1.45 ✓
  // But proximity is hypot(dx,dz). At x=-3.7 z=0.2: dist = |0.2-(-1.25)| = 1.45.
  await teleport(page, -3.7, 0.2);
  await page.waitForTimeout(400);
  const before = await getState(page);
  log(`  before U: nearby=${before.nearby} unlocked-myroom=${before.unlocked.includes('myroom')}`);
  if (before.unlocked.includes('myroom')) {
    log(`  WARN: auto-unlock fired before test could probe U key`);
    return { uToggle: 'inconclusive (auto-unlock raced)' };
  }
  await page.keyboard.press('u');
  await page.waitForTimeout(200);
  const after = await getState(page);
  log(`  after U: unlocked-myroom=${after.unlocked.includes('myroom')}`);
  return { uToggle: !before.unlocked.includes('myroom') && after.unlocked.includes('myroom') };
}

async function probeYawHint(page) {
  log('\n--- Probe 7: yaw hint behavior on book approach + entry ---');
  await reset(page);
  await teleport(page, -3.7, -0.5); // hallway, north of book door
  await page.waitForTimeout(300);
  await installLog(page);
  // Walk S into book room. Sample camera y rotation during.
  const samples = [];
  await page.keyboard.down('s');
  for (let i = 0; i < 30; i++) {
    const s = await page.evaluate(() => ({
      t: performance.now(), camY: window.__camera ? window.__camera.rotation.y : null,
      vm: window.__worldStore.getState().viewMode,
      fp: window.__worldStore.getState().fpActive,
    }));
    samples.push(s);
    await page.waitForTimeout(80);
  }
  await page.keyboard.up('s');
  await page.waitForTimeout(400);
  const final = await getState(page);
  log(`  final state vm=${final.vm} fp=${final.fp} pos=(${final.x.toFixed(2)},${final.z.toFixed(2)})`);
  // Look for camY trajectory: did it rotate during approach? Did it stabilize after entry?
  const enterIdx = samples.findIndex(s => s.fp);
  log(`  enterIdx=${enterIdx} of ${samples.length}`);
  if (enterIdx > 0) {
    const yawChange = samples[enterIdx - 1].camY - samples[0].camY;
    log(`  pre-entry yaw change = ${yawChange.toFixed(3)} rad`);
    // After entry, check yaw is stable (not fighting):
    const tail = samples.slice(enterIdx).map(s => s.camY);
    const tailDelta = Math.max(...tail) - Math.min(...tail);
    log(`  post-entry yaw delta = ${tailDelta.toFixed(3)} rad`);
    return { entered: true, preYawChange: yawChange, postYawDelta: tailDelta };
  }
  return { entered: false };
}

async function probeBookSeat(page) {
  log('\n--- Probe 8: book room seat interactable + cushion blocking ---');
  await reset(page);
  // Walk into book room by teleport (FP), then explore.
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    s.unlockDoor('book');
  });
  await teleport(page, -3.7, -0.5);
  await page.waitForTimeout(300);
  await page.keyboard.down('s');
  await waitFor(page, () => window.__worldStore.getState().fpActive && window.__worldStore.getState().viewMode === 'book', 6000);
  await page.keyboard.up('s');
  await page.waitForTimeout(400);
  const inRoom = await getState(page);
  log(`  in book room: vm=${inRoom.vm} fp=${inRoom.fp} pos=(${inRoom.x.toFixed(2)},${inRoom.z.toFixed(2)})`);
  await snap(page, 'book-spawn-fp.png');

  // Try walking around to find chair focus.
  let bestFocus = null;
  const directions = [
    ['s', 600], ['d', 400], ['s', 400], ['a', 400], ['w', 300], ['a', 400], ['s', 800],
    ['d', 600], ['w', 400], ['d', 400], ['s', 400],
  ];
  const positions = [];
  for (const [k, ms] of directions) {
    await page.keyboard.down(k);
    await page.waitForTimeout(ms);
    await page.keyboard.up(k);
    const st = await getState(page);
    positions.push({ k, ms, pos: [st.x.toFixed(2), st.z.toFixed(2)], focused: st.focused });
    if (st.focused && (!bestFocus || st.focused.includes('许三观'))) bestFocus = st.focused;
    if (st.focused && st.focused.includes('许三观')) {
      log(`  focus acquired @ (${st.x.toFixed(2)},${st.z.toFixed(2)}): ${st.focused}`);
      await snap(page, 'book-focused.png');
      break;
    }
  }
  if (!bestFocus) {
    log(`  NO FOCUS ACQUIRED. positions visited: ${JSON.stringify(positions.slice(-5))}`);
    return { focused: null };
  }
  // Press E to open.
  await page.keyboard.press('e');
  await page.waitForTimeout(400);
  const after = await getState(page);
  log(`  after E: modalTitle=${after.modalTitle}`);
  await snap(page, 'book-modal.png');
  // Read body length too.
  const body = await page.evaluate(() => {
    const m = window.__worldStore.getState().modalInteractable;
    return m?.body || m?.description || null;
  });
  log(`  modal body length: ${body ? body.length : 'null'}`);
  return { focused: bestFocus, modalTitle: after.modalTitle, bodyLen: body ? body.length : null };
}

async function probeNoYawHintForOtherRooms(page) {
  log('\n--- Probe 7b: no yaw hint for myroom/product approach ---');
  await reset(page);
  await teleport(page, 0, 0);
  await page.waitForTimeout(300);
  // Walk N toward myroom.
  const camY0 = await page.evaluate(() => window.__camera ? window.__camera.rotation.y : null);
  await page.keyboard.down('w');
  await page.waitForTimeout(1500);
  await page.keyboard.up('w');
  await page.waitForTimeout(200);
  const camY1 = await page.evaluate(() => window.__camera ? window.__camera.rotation.y : null);
  log(`  myroom approach: camY ${camY0?.toFixed(3)} → ${camY1?.toFixed(3)} Δ=${(camY1-camY0).toFixed(3)}`);
  return { myroomYawDelta: camY1 - camY0 };
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => { errors.push('PAGEERROR: ' + e.message); log('PAGEERROR: ' + e.message); });
  page.on('console', m => { if (m.type() === 'error') { errors.push('CONSOLE: ' + m.text()); log('CONSOLE.ERROR: ' + m.text()); } });

  await setup(page);
  await snap(page, '00-initial.png');

  const results = {};
  for (const r of ['myroom','product','book','idealab']) {
    results['walk_' + r] = await probeWalkInOut(page, r);
  }
  results.interrupted = await probeInterrupted(page);
  results.manualE = await probeManualE(page);
  results.uKey = await probeUKey(page);
  results.yawHint = await probeYawHint(page);
  results.noYawForOthers = await probeNoYawHintForOtherRooms(page);
  results.bookSeat = await probeBookSeat(page);

  log('\n=== RESULTS ===');
  log(JSON.stringify(results, null, 2));
  log(`\nerrors: ${errors.length}`);
  errors.forEach(e => log('  ' + e));
  fs.writeFileSync(LOG, lines.join('\n'));
  await browser.close();
})().catch(e => {
  log('FATAL: ' + e.stack);
  fs.writeFileSync(LOG, lines.join('\n'));
  process.exit(1);
});
