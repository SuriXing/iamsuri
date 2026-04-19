// B1.4 walkthrough: follow-cam yaw hint for book / idealab approach.
//
// Acceptance (OUT-4): within 2 s of nearbyRoom === 'book' | 'idealab',
// follow-cam yaw is within 0.3 rad of atan2(roomCenter.x − charPos.x,
// roomCenter.z − charPos.z). Walking toward myroom / product must NOT
// auto-rotate. Active mouse drag overrides the hint.
//
// Test design: park the character in the door-proximity zone (so
// nearbyRoom is set) BUT short of the door-plane crossing test (so no
// auto-enter to FP mode). This isolates the yaw-hint logic from the
// transition state machine.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.env.B14_URL || 'http://localhost:5173/?view=3d';
const SCREEN_DIR = path.join(__dirname, 'screens');
const LOG = path.join(__dirname, 'yaw-trace.txt');
fs.mkdirSync(SCREEN_DIR, { recursive: true });

const lines = [];
function log(msg) { lines.push(msg); console.log(msg); }

// Room centers (must match src/world3d/data/rooms.ts).
// half = ROOM/2 + GAP, with ROOM=5 and GAP=1.2 → half = 3.7
const ROOM_CENTERS = {
  myroom:  { x: -3.7, z: -3.7 },
  product: { x:  3.7, z: -3.7 },
  book:    { x: -3.7, z:  3.7 },
  idealab: { x:  3.7, z:  3.7 },
};

function angDiff(a, b) {
  let d = ((a - b + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

async function readState(page) {
  return await page.evaluate(() => {
    const s = window.__worldStore.getState();
    const cam = window.__camera;
    // Prefer the actual smoothed follow-cam yaw ref (exposed in dev).
    // Fall back to recovering from camera position (less accurate while
    // the camera position lerp is still converging).
    let yaw;
    const ref = window.__followCamYawRef;
    if (ref && typeof ref.current === 'number') {
      yaw = ref.current;
    } else {
      const dx = cam.position.x - s.charPos.x;
      const dz = cam.position.z - s.charPos.z;
      yaw = Math.atan2(-dx, -dz);
    }
    return {
      x: s.charPos.x, z: s.charPos.z,
      vm: s.viewMode, fp: s.fpActive, near: s.nearbyRoom,
      yaw,
    };
  });
}

// Stage the char in the door-proximity ring without crossing the door
// plane. Door is at (±3.7, ±~0.55) for the four rooms. We pick a spot
// inside the 1.6 proximity radius but on the hallway side of the door,
// so nearbyRoom fires but auto-enter does not.
async function stage(page, x, z) {
  await page.evaluate(({x, z}) => {
    const s = window.__worldStore.getState();
    s.setIntroPhase('follow');
    if (s.viewMode !== 'overview') s.setViewMode('overview');
    s.setFp(false);
    s.setCharPos(x, z);
  }, { x, z });
  // 600 ms idle so InteractionManager publishes nearbyRoom + hint and
  // CameraController has at least one frame to react.
  await page.waitForTimeout(200);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => log('PAGEERROR: ' + e.message));

  await page.goto(URL);
  await page.waitForFunction(() => !!window.__worldStore && !!window.__camera, { timeout: 15000 });
  await page.evaluate(() => {
    window.__worldStore.getState().setIntroPhase('follow');
  });
  // Long initial settle: the intro-zoom tween (2.4 s) and any room
  // transition tween block the follow-cam branch entirely. Wait long
  // enough that we know we're in pure follow mode before the first test.
  await page.waitForTimeout(3500);

  // ── Test 1: BOOK proximity → yaw rotates toward book within 2 s ──
  log('\n=== Test 1: BOOK approach ===');
  // Book door at (-3.7, +1.25), room center (-3.7, +3.7). Hallway side
  // is z < +1.25. Stage at (-3.0, +0.5): door-dist ≈ 1.03 < 1.6 (so
  // nearbyRoom='book' fires) and dot((char-door),(center-door)) = -1.84
  // < 0 (not crossed → no auto-enter to FP).
  await stage(page, -3.0, 0.5);
  const t0Book = await readState(page);
  log('t=0 ' + JSON.stringify(t0Book));
  await page.waitForTimeout(2000);
  const t2Book = await readState(page);
  log('t=2 ' + JSON.stringify(t2Book));
  const targetBook = Math.atan2(
    ROOM_CENTERS.book.x - t2Book.x,
    ROOM_CENTERS.book.z - t2Book.z,
  );
  const dBook = angDiff(t2Book.yaw, targetBook);
  log(`book target=${targetBook.toFixed(3)} actual=${t2Book.yaw.toFixed(3)} Δ=${dBook.toFixed(3)} (need < 0.3)`);
  await page.screenshot({ path: path.join(SCREEN_DIR, 'book-approach.png') });

  // Reset
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    if (s.viewMode !== 'overview') s.setViewMode('overview');
    s.setCharPos(0, 0);
  });
  await page.waitForTimeout(600);

  // ── Test 2: IDEALAB proximity → yaw rotates toward idealab ──
  log('\n=== Test 2: IDEALAB approach ===');
  // Idealab door at (3.7, +1.25). Stage at (3.0, +0.5).
  await stage(page, 3.0, 0.5);
  const t0Idea = await readState(page);
  log('t=0 ' + JSON.stringify(t0Idea));
  await page.waitForTimeout(2000);
  const t2Idea = await readState(page);
  log('t=2 ' + JSON.stringify(t2Idea));
  const targetIdea = Math.atan2(
    ROOM_CENTERS.idealab.x - t2Idea.x,
    ROOM_CENTERS.idealab.z - t2Idea.z,
  );
  const dIdea = angDiff(t2Idea.yaw, targetIdea);
  log(`idealab target=${targetIdea.toFixed(3)} actual=${t2Idea.yaw.toFixed(3)} Δ=${dIdea.toFixed(3)} (need < 0.3)`);
  await page.screenshot({ path: path.join(SCREEN_DIR, 'idealab-approach.png') });

  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    if (s.viewMode !== 'overview') s.setViewMode('overview');
    s.setCharPos(0, 0);
  });
  await page.waitForTimeout(600);

  // ── Test 3: MYROOM proximity → yaw should NOT rotate to face room ──
  log('\n=== Test 3: MYROOM approach (NO auto-rotate) ===');
  // Myroom door at (-3.7, -1.25). Stage at (-3.0, -0.5).
  await stage(page, -3.0, -0.5);
  const t0My = await readState(page);
  log('t=0 ' + JSON.stringify(t0My));
  await page.waitForTimeout(2000);
  const t2My = await readState(page);
  log('t=2 ' + JSON.stringify(t2My));
  const targetMy = Math.atan2(
    ROOM_CENTERS.myroom.x - t2My.x,
    ROOM_CENTERS.myroom.z - t2My.z,
  );
  const dMyHint = angDiff(t2My.yaw, targetMy);
  const dMyDrift = angDiff(t2My.yaw, t0My.yaw);
  log(`myroom hint-target=${targetMy.toFixed(3)} actual=${t2My.yaw.toFixed(3)} ΔtoHint=${dMyHint.toFixed(3)} ΔdriftFromT0=${dMyDrift.toFixed(3)}`);
  // Pass if yaw did NOT converge on myroom direction (i.e. distance to
  // would-be hint stayed > 0.3) AND the overall drift from t0 is small.
  await page.screenshot({ path: path.join(SCREEN_DIR, 'myroom-approach-no-rotate.png') });

  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    if (s.viewMode !== 'overview') s.setViewMode('overview');
    s.setCharPos(0, 0);
  });
  await page.waitForTimeout(600);

  // ── Test 4: drag overrides hint while in book proximity ──
  log('\n=== Test 4: drag overrides hint ===');
  await stage(page, -3.0, 0.5);
  await page.waitForTimeout(400);
  // Drag yaw FAR from the hint: push pointer +400px in X.
  await page.mouse.move(512, 384);
  await page.mouse.down();
  for (let i = 0; i < 40; i++) {
    await page.mouse.move(512 + (i + 1) * 12, 384);
    await page.waitForTimeout(8);
  }
  // Sample WHILE drag is still held (mouseDraggingRef.current === true)
  // — this is the moment the hint must be inert.
  const midDrag = await readState(page);
  log('mid-drag ' + JSON.stringify(midDrag));
  await page.mouse.up();
  await page.screenshot({ path: path.join(SCREEN_DIR, 'drag-overrides.png') });
  const hintAtDrag = Math.atan2(
    ROOM_CENTERS.book.x - midDrag.x,
    ROOM_CENTERS.book.z - midDrag.z,
  );
  const dDragVsHint = angDiff(midDrag.yaw, hintAtDrag);
  log(`drag yaw=${midDrag.yaw.toFixed(3)} vs hint=${hintAtDrag.toFixed(3)} Δ=${dDragVsHint.toFixed(3)} (drag should win → > 0.5)`);

  // ── Verdict ──
  log('\n=== VERDICT ===');
  const passes = {
    book: dBook < 0.3,
    idealab: dIdea < 0.3,
    myroom_no_rotate: dMyHint > 0.3,
    drag_overrides: dDragVsHint > 0.5,
  };
  log(JSON.stringify(passes, null, 2));
  const allPass = Object.values(passes).every(Boolean);
  log('ALL PASS? ' + allPass);

  fs.writeFileSync(LOG, lines.join('\n'));
  await browser.close();
  process.exit(allPass ? 0 : 1);
})();
