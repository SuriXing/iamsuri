// B1.3 verification: shelves behind couch + 许三观卖血记 read interactable.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.env.B13_URL || 'http://localhost:5173/?view=3d';
const SCREEN_DIR = path.join(__dirname, 'screens');
const VERIFY = path.join(__dirname, 'verify.txt');
fs.mkdirSync(SCREEN_DIR, { recursive: true });

const lines = [];
const log = (m) => { lines.push(m); console.log(m); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => log('PAGEERROR: ' + e.message));

  await page.goto(URL);
  await page.waitForFunction(() => !!window.__worldStore, { timeout: 15000 });

  // Skip intro, unlock book room, snap into FP-spawn pose for the book room.
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    s.setIntroPhase('follow');
    s.unlockDoor('book');
    s.beginRoomTransition('book', 'manual');
  });
  // Wait for FP active.
  const t0 = Date.now();
  while (Date.now() - t0 < 4000) {
    const fp = await page.evaluate(() => window.__worldStore.getState().fpActive);
    if (fp) break;
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREEN_DIR, 'bookroom-fp-spawn.png') });
  log('FP-spawn captured');

  // Walk forward toward the chair: chairZ = oz - 0.5 = 3.2; chairX = -3.9.
  // Stand to the right of the chair and look left/down at the seat cushion
  // so the InteractionRaycaster ray (camera forward) hits the invisible
  // seat-read box.
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    s.setCharPos(-3.0, 4.0);
    // yaw=Math.PI/2 → look toward -x (chair); pitch -1.0 → look down at seat
    s.setFp(true, Math.PI / 2, -1.0);
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREEN_DIR, 'bookroom-focused.png') });
  const focused = await page.evaluate(() => {
    const f = window.__worldStore.getState().focusedInteractable;
    return f ? { title: f.title, body: f.body } : null;
  });
  log('focusedInteractable: ' + JSON.stringify(focused));

  // Press E to open modal.
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(500);
  const modal = await page.evaluate(() => {
    const m = window.__worldStore.getState().modalInteractable;
    return m ? { title: m.title, body: m.body } : null;
  });
  log('modalInteractable: ' + JSON.stringify(modal));
  await page.screenshot({ path: path.join(SCREEN_DIR, 'bookroom-modal.png') });

  const titleOk = !!(modal && modal.title && modal.title.includes('许三观卖血记'));
  const bodyOk = !!(modal && modal.body && modal.body.length >= 60);
  log('titleOk=' + titleOk + ' bodyOk=' + bodyOk + ' bodyLen=' + (modal?.body?.length ?? 0));

  fs.writeFileSync(VERIFY, lines.join('\n') + '\n');
  await browser.close();
  process.exit(titleOk && bodyOk ? 0 : 1);
})();
