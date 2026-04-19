// Independent QA probes for B1.1–B1.4.
// Drives the live dev server through the bug-fix matrix and records findings.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.env.QA_URL || 'http://localhost:5173/?view=3d';
const SCREEN_DIR = path.join(__dirname, 'screens');
const LOG = path.join(__dirname, 'probes.txt');
fs.mkdirSync(SCREEN_DIR, { recursive: true });
const lines = [];
const log = (m) => { lines.push(m); console.log(m); };

// Room data from src/world3d/data/rooms.ts (ROOM=2.5, GAP=1.2 → half=3.7 from constants)
// Verified live via store getState().

async function setup(page) {
  await page.goto(URL);
  await page.waitForFunction(() => !!window.__worldStore, { timeout: 15000 });
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    s.setIntroPhase('follow');
  });
  await page.waitForTimeout(200);
}

async function snap(page, name) {
  await page.screenshot({ path: path.join(SCREEN_DIR, name) });
}

async function getState(page) {
  return page.evaluate(() => {
    const s = window.__worldStore.getState();
    return {
      charPos: s.charPos, viewMode: s.viewMode, fpActive: s.fpActive,
      viewTransition: s.viewTransition, nearbyRoom: s.nearbyRoom,
      modalTitle: s.modalInteractable?.title || null,
      focused: s.focusedInteractable?.title || null,
      unlocked: Array.from(s.unlockedDoors),
    };
  });
}

async function installLogger(page) {
  await page.evaluate(() => {
    window.__qa_log = [];
    if (window.__qa_unsub) window.__qa_unsub();
    window.__qa_unsub = window.__worldStore.subscribe((s) => {
      window.__qa_log.push({
        t: performance.now(), x: s.charPos.x, z: s.charPos.z,
        vm: s.viewMode, fp: s.fpActive, vt: s.viewTransition,
      });
    });
  });
}

async function fetchLog(page) {
  return page.evaluate(() => window.__qa_log.slice());
}

// Returns true if there was any FP↔overview flip within 0.5s of another flip.
function detectPingPong(events) {
  const flips = [];
  for (let i = 1; i < events.length; i++) {
    if (events[i].fp !== events[i - 1].fp) flips.push(events[i].t);
  }
  for (let i = 1; i < flips.length; i++) {
    if (flips[i] - flips[i - 1] < 500) return { pingPong: true, flips };
  }
  return { pingPong: false, flips };
}

async function teleportPlayer(page, x, z) {
  await page.evaluate(({ x, z }) => window.__worldStore.getState().setCharPos(x, z), { x, z });
}

async function unlock(page, room) {
  await page.evaluate((r) => window.__worldStore.getState().unlockDoor(r), room);
}

async function probeWalkInOut(page, roomId, approach, exit) {
  log(`\n--- Probe 1.${roomId}: walk in / out ---`);
  await teleportPlayer(page, approach.x, approach.z);
  await unlock(page, roomId);
  await page.waitForTimeout(150);
  await installLogger(page);
  // Walk into the room.
  await page.keyboard.down(approach.key);
  const t0 = Date.now();
  let entered = false;
  while (Date.now() - t0 < 4000) {
    const fp = await page.evaluate(() => window.__worldStore.getState().fpActive);
    if (fp) { entered = true; break; }
    await page.waitForTimeout(40);
  }
  await page.keyboard.up(approach.key);
  log(`  ${roomId}: entered=${entered}`);
  await page.waitForTimeout(300);
  await snap(page, `walk-${roomId}-inside.png`);
  // Walk back out.
  await page.keyboard.down(exit.key);
  const t1 = Date.now();
  let exited = false;
  while (Date.now() - t1 < 4000) {
    const st = await page.evaluate(() => window.__worldStore.getState());
    if (st.viewMode === 'overview' && !st.fpActive) { exited = true; break; }
    await page.waitForTimeout(40);
  }
  await page.keyboard.up(exit.key);
  log(`  ${roomId}: exited=${exited}`);
  await page.waitForTimeout(200);
  const events = await fetchLog(page);
  const pp = detectPingPong(events);
  log(`  ${roomId}: flips=${pp.flips.length} pingPong=${pp.pingPong}`);
  return { roomId, entered, exited, pingPong: pp.pingPong, flips: pp.flips.length };
}

async function probeInterruptedApproach(page) {
  log('\n--- Probe 2: interrupted approach (book threshold, stop short) ---');
  // Book door is at (-3.7, +1.25). Approach from (-3.7, +1.0) — just OUTSIDE the door.
  // Drive S a tiny bit, then stop, wait 1s, then drive N away.
  await teleportPlayer(page, -3.7, 0.4);
  await unlock(page, 'book');
  await page.waitForTimeout(150);
  // tap S briefly to inch toward the door but not through
  await page.keyboard.down('s');
  await page.waitForTimeout(180); // ~0.5u at walk speed
  await page.keyboard.up('s');
  const stopped = await getState(page);
  log(`  stopped at ${stopped.charPos.x.toFixed(3)},${stopped.charPos.z.toFixed(3)} fp=${stopped.fpActive} vm=${stopped.viewMode}`);
  await page.waitForTimeout(1000);
  const after1s = await getState(page);
  log(`  after 1s: fp=${after1s.fpActive} vm=${after1s.viewMode}`);
  // Walk back N away
  await page.keyboard.down('w');
  await page.waitForTimeout(400);
  await page.keyboard.up('w');
  const final = await getState(page);
  log(`  after walk away: fp=${final.fpActive} vm=${final.viewMode}`);
  return { stoppedShort: !stopped.fpActive, stayedOut: !after1s.fpActive && !final.fpActive };
}

async function probeDiagonal(page) {
  log('\n--- Probe 3: diagonal approach (idealab, SE = D+S) ---');
  // idealab door (+3.7, +1.25). Start at (+1.5, 0) and walk SE.
  await teleportPlayer(page, 1.5, 0);
  await unlock(page, 'idealab');
  await page.waitForTimeout(150);
  await installLogger(page);
  await page.keyboard.down('d');
  await page.keyboard.down('s');
  const t0 = Date.now();
  let entered = false;
  while (Date.now() - t0 < 4500) {
    const st = await page.evaluate(() => window.__worldStore.getState());
    if (st.fpActive && st.viewMode === 'idealab') { entered = true; break; }
    await page.waitForTimeout(40);
  }
  await page.keyboard.up('d');
  await page.keyboard.up('s');
  log(`  diagonal entered: ${entered}`);
  await snap(page, 'diagonal-result.png');
  return { diagonalEntered: entered };
}

async function probeManualE(page) {
  log('\n--- Probe 4: manual E key still works ---');
  // Reset to overview at hallway south of myroom door (-3.7, -1.25).
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    if (s.fpActive || s.viewMode !== 'overview') s.setViewMode('overview');
  });
  await page.waitForTimeout(300);
  await teleportPlayer(page, -3.7, -2.0); // safely outside, in hallway
  await unlock(page, 'myroom');
  await page.waitForTimeout(200);
  // Just outside door — within proximity threshold (1.6) but not crossed.
  // door z=-1.25, so z=-2.0 is 0.75 away → triggers nearbyRoom but no auto-enter.
  const before = await getState(page);
  log(`  before E: nearby=${before.nearbyRoom} fp=${before.fpActive}`);
  await page.keyboard.press('e');
  await page.waitForTimeout(800);
  const after = await getState(page);
  log(`  after E: vm=${after.viewMode} fp=${after.fpActive}`);
  // Press E inside? Not specified — auto-exit replaces ESC; E inside opens
  // focused interactable, not exit.
  return { manualEEntered: after.viewMode === 'myroom' && after.fpActive };
}

async function probeUKey(page) {
  log('\n--- Probe 5: U key still works (lock toggle) ---');
  // Need a fresh page so myroom is locked again.
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    if (s.fpActive) s.setViewMode('overview');
    s.lockDoor('product');
  });
  await page.waitForTimeout(300);
  await teleportPlayer(page, 3.7, -2.0);
  await page.waitForTimeout(200);
  const before = await getState(page);
  log(`  before U: nearby=${before.nearbyRoom} unlocked=${before.unlocked.includes('product')}`);
  await page.keyboard.press('u');
  await page.waitForTimeout(150);
  const after = await getState(page);
  log(`  after U: unlocked=${after.unlocked.includes('product')}`);
  return { uToggle: before.unlocked.includes('product') !== after.unlocked.includes('product') };
}

async function probeYawHintClears(page) {
  log('\n--- Probe 7: yaw hint clears on book-room entry ---');
  // Reset to overview.
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    if (s.fpActive || s.viewMode !== 'overview') s.setViewMode('overview');
  });
  await page.waitForTimeout(400);
  await teleportPlayer(page, -3.7, 0);
  await unlock(page, 'book');
  await page.waitForTimeout(300);
  // Walk into book room.
  await page.keyboard.down('s');
  const t0 = Date.now();
  let entered = false;
  while (Date.now() - t0 < 4000) {
    const st = await page.evaluate(() => window.__worldStore.getState());
    if (st.fpActive && st.viewMode === 'book') { entered = true; break; }
    await page.waitForTimeout(40);
  }
  await page.keyboard.up('s');
  await page.waitForTimeout(400);
  // Probe yawHintRef. Imported indirectly: cameraRefs not on window. Best we
  // can check is that the camera tween isn't being dragged off-target (FOV
  // and rotation should be stable). Sample y rotation 0.5s after entry.
  const r1 = await page.evaluate(() => window.__camera ? window.__camera.rotation.y : null);
  await page.waitForTimeout(500);
  const r2 = await page.evaluate(() => window.__camera ? window.__camera.rotation.y : null);
  await snap(page, 'book-fp-after-entry.png');
  log(`  book: entered=${entered} cam.y t0=${r1} t+0.5=${r2}`);
  return { bookEntered: entered, camYaw1: r1, camYaw2: r2 };
}

async function probeBookSeat(page) {
  log('\n--- Probe 8: book room seat interactable ---');
  // Should already be in book room from probe 7. Walk to chair.
  // BookRoom places chair somewhere — try keyboard W/A/S/D to find focus.
  // First check if focused.
  let st = await getState(page);
  log(`  starting fp state: vm=${st.viewMode} fp=${st.fpActive} focused=${st.focused}`);
  // Try walking around to find the chair focus.
  for (const k of ['w', 'a', 's', 'd']) {
    await page.keyboard.down(k);
    await page.waitForTimeout(700);
    await page.keyboard.up(k);
    st = await getState(page);
    log(`  after ${k}: pos=${st.charPos.x.toFixed(2)},${st.charPos.z.toFixed(2)} focused=${st.focused}`);
    if (st.focused && st.focused.includes('许三观')) break;
  }
  await snap(page, 'book-walking.png');
  // If focused on the book interactable, press E.
  if (st.focused) {
    await page.keyboard.press('e');
    await page.waitForTimeout(300);
    st = await getState(page);
    log(`  after E: modalTitle=${st.modalTitle}`);
    await snap(page, 'book-modal.png');
  }
  return { focused: st.focused, modalTitle: st.modalTitle };
}

async function probeCushionBlock(page) {
  log('\n--- Probe 8b: cushion blocks player? ---');
  // Close modal if open.
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    if (s.modalInteractable) s.closeModal();
  });
  await page.waitForTimeout(200);
  // Inspect colliders for cushion entries.
  const colliderInfo = await page.evaluate(() => {
    // colliders are not on window; just check whether the player can step
    // onto the cushion location. Cushion is part of BookRoom — exact pos
    // unknown. Just record final position to see if player moved freely.
    return null;
  });
  log(`  cushion collider info: ${colliderInfo}`);
  return { note: 'see source — ColliderRegistry not exposed; checked focus reachability above' };
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

  // Probe 1: walk in/out for all 4 rooms.
  // myroom: door (-3.7, -1.25), center (-3.7, -3.7). Approach from south (z>−1.25), drive W=north (mz>0)? No — in follow mode W= +Z forward i.e. into screen. Need to make sure direction is correct.
  // Actually re-read: "drive W toward myroom door (north for top rooms)". Top rooms are myroom & product (z<0). W → north means -Z direction. PlayerController does worldZ = sinY*mz + cosY*mx. With camera looking down by default (yaw=0, looks +Z?), W (mz=+1) → worldZ=+cosY. We saw the B1.1 walkthrough use W toward myroom (z<0), so W must produce -Z motion in default camera. Trust the existing recipe.
  // Approach positions: just outside the door on hallway side.
  results.walkMy   = await probeWalkInOut(page, 'myroom', { x: -3.7, z: -0.6, key: 'w' }, { key: 's' });
  results.walkProd = await probeWalkInOut(page, 'product', { x:  3.7, z: -0.6, key: 'w' }, { key: 's' });
  results.walkBook = await probeWalkInOut(page, 'book',    { x: -3.7, z:  0.6, key: 's' }, { key: 'w' });
  results.walkLab  = await probeWalkInOut(page, 'idealab', { x:  3.7, z:  0.6, key: 's' }, { key: 'w' });

  // Reset to overview & origin between probes.
  async function resetOverview() {
    await page.evaluate(() => {
      const s = window.__worldStore.getState();
      if (s.fpActive || s.viewMode !== 'overview') s.setViewMode('overview');
    });
    await page.waitForTimeout(400);
    await teleportPlayer(page, 0, 0);
    await page.waitForTimeout(200);
  }

  await resetOverview();
  results.interrupted = await probeInterruptedApproach(page);
  await resetOverview();
  results.diagonal = await probeDiagonal(page);
  await resetOverview();
  results.manualE = await probeManualE(page);
  await resetOverview();
  results.uKey = await probeUKey(page);
  await resetOverview();
  results.yawHint = await probeYawHintClears(page);
  results.bookSeat = await probeBookSeat(page);
  results.cushion = await probeCushionBlock(page);

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
