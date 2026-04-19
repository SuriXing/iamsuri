const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const SCREEN_DIR = path.join(__dirname, 'screens');
const LOG = path.join(__dirname, 'verify.txt');
fs.mkdirSync(SCREEN_DIR, { recursive: true });
const lines = [];
const log = (m) => { lines.push(m); console.log(m); };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => log('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') log('CONSOLE.ERROR: ' + m.text()); });

  await page.goto('http://localhost:5173/?view=3d');
  await page.waitForFunction(() => !!window.__worldStore, { timeout: 15000 });
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    s.setIntroPhase('follow');
    for (const r of ['myroom','product','book','idealab']) s.unlockDoor(r);
  });
  await page.waitForTimeout(400);

  // === FINDING 1: Product Room — enter & screenshot from default spawn pose ===
  log('--- Product Room: spawn FP, screenshot ---');
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    s.setViewMode('product');
  });
  await page.waitForTimeout(1500);  // viewTransition: zoom → fp
  // Force FP if not already
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    if (!s.fpActive) s.setFp(true, 0, 0);
  });
  await page.waitForTimeout(500);
  const prState = await page.evaluate(() => {
    const s = window.__worldStore.getState();
    return { vm: s.viewMode, fp: s.fpActive, x: s.charPos.x, z: s.charPos.z };
  });
  log(`  product state: ${JSON.stringify(prState)}`);
  await page.screenshot({ path: path.join(SCREEN_DIR, 'product-fp-fixed.png') });
  log('  screenshot → product-fp-fixed.png');

  // Sample several yaw angles to confirm no blue band visible from any direction
  for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    await page.evaluate(({ y }) => {
      const s = window.__worldStore.getState();
      s.setFp(true, y, 0);
    }, { y: yaw });
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(SCREEN_DIR, `product-fp-yaw-${yaw.toFixed(2)}.png`) });
  }
  // Pitch down to see the slab edge against walls — verify slab covers footprint
  await page.evaluate(() => window.__worldStore.getState().setFp(true, 0, -0.8));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(SCREEN_DIR, 'product-fp-pitch-down.png') });

  // === FINDING 2: Book Room chair — standing pose, default pitch=0 ===
  log('\n--- Book Room: chair focus from standing pose pitch=0 ---');
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    s.setViewMode('book');
  });
  await page.waitForTimeout(900);
  // Chair at chairX=-3.9 chairZ=4.0 (from probe-chair2 inferring chairZ-0.02=3.98 → chairZ=4.0).
  // Stand 1u in front of chair (chair faces -z is back; reading chair faces +z toward shelves? probe used z=4.5 = south of chair).
  // Try standing 1u south of chair at z=5.0... but room half=3.7 → bounds. The room is at center z=4.0 (book id center).
  // Actually book room center is something like... let me try multiple distances and yaws.
  const chairX = -3.9, chairZ = 4.0;
  // Standing distance candidates (1u from chair). Try facing chair from various sides.
  const positions = [
    { x: chairX, z: chairZ - 1.0, yaw: Math.PI, label: 'south-of-chair-facing-N' },
    { x: chairX, z: chairZ + 1.0, yaw: 0,        label: 'north-of-chair-facing-S' },
    { x: chairX + 1.0, z: chairZ, yaw: Math.PI/2, label: 'east-of-chair-facing-W' },
    { x: chairX - 1.0, z: chairZ, yaw: -Math.PI/2,  label: 'west-of-chair-facing-E' },
  ];
  // Reset to ensure clean fp state after product loop
  await page.evaluate(() => window.__worldStore.getState().setViewMode('overview'));
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__worldStore.getState().setViewMode('book'));
  await page.waitForTimeout(1200);
  let hit = null;
  for (const p of positions) {
    await page.evaluate(({ x, z, yaw }) => {
      const s = window.__worldStore.getState();
      s.setCharPos(x, z);
      s.setFp(true, yaw, 0);
    }, p);
    await page.waitForTimeout(800);  // raycaster needs frames
    const fr = await page.evaluate(() => {
      const s = window.__worldStore.getState();
      const f = s.focusedInteractable;
      const cam = window.__camera;
      return {
        focused: f?.title || null, fp: s.fpActive, vt: s.viewTransition,
        x: s.charPos.x, z: s.charPos.z, yaw: s.fpYaw, pitch: s.fpPitch,
        camPos: cam ? [cam.position.x.toFixed(2), cam.position.y.toFixed(2), cam.position.z.toFixed(2)] : null,
      };
    });
    log(`  ${p.label}: ${JSON.stringify(fr)}`);
    if (fr.focused && fr.focused.includes('许三观')) {
      hit = p;
      await page.evaluate(() => {
        const s = window.__worldStore.getState();
        if (s.focusedInteractable) s.openModal(s.focusedInteractable);
      });
      break;
    }
  }
  if (!hit) {
    log('  NO HIT at standing pose pitch=0. FAIL.');
  } else {
    await page.waitForTimeout(400);
    const m = await page.evaluate(() => window.__worldStore.getState().modalInteractable);
    log(`  modal: title=${m?.title} bodyLen=${(m?.body || '').length}`);
    await page.screenshot({ path: path.join(SCREEN_DIR, 'book-modal-fixed.png') });
    log('  screenshot → book-modal-fixed.png');
  }

  fs.writeFileSync(LOG, lines.join('\n'));
  await browser.close();
})().catch(e => {
  log('FATAL: ' + e.stack);
  fs.writeFileSync(LOG, lines.join('\n'));
  process.exit(1);
});
