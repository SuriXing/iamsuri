import { chromium } from 'playwright';

const OUT = '/Users/surixing/Code/iamsuri/.harness/nodes/F3.13/run_1';

// Rooms centered at (±3.7, ±3.7). Move character slightly off-center so the
// follow camera frames the hero furniture from a natural third-person angle.
const ROOMS = [
  // Product: hero is server rack at left-back, dual monitors at (ox±0.95, oz-0.42)
  // Put char in front of desk looking at monitors.
  { id: 'product', file: 'screenshot-product.png', cx: 3.7, cz: -3.2, facing: Math.PI },
  // Book: reading chair at (ox-0.2, oz+0.9), shelves at back.
  { id: 'book', file: 'screenshot-book.png', cx: -3.7, cz: 4.4, facing: 0 },
  // Idealab: workbench at (ox, oz+0.6), whiteboard at back.
  { id: 'idealab', file: 'screenshot-idealab.png', cx: 3.7, cz: 4.2, facing: 0 },
];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGE ERR:', e.message));
  await page.goto('http://localhost:5173/?view=3d', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__worldStore, { timeout: 15000 });
  // Skip intro.
  await page.evaluate(() => {
    const s = window.__worldStore.getState();
    s.setIntroPhase('follow');
  });
  await page.waitForTimeout(600);

  // Overview shot (top-down of all 4 rooms).
  await page.screenshot({ path: `${OUT}/screenshot-overview.png` });
  console.log('overview captured');

  for (const r of ROOMS) {
    // Reset: return to overview + stand character at origin.
    await page.evaluate(() => {
      const s = window.__worldStore.getState();
      s.beginExitTransition();
      s.setFp(false);
      s.setCharPos(0, 0);
    });
    await page.waitForTimeout(600);
    // Move character into position, keep follow-cam (no FP).
    await page.evaluate((cfg) => {
      const s = window.__worldStore.getState();
      s.setCharPos(cfg.cx, cfg.cz);
      s.setCharFacing(cfg.facing);
    }, r);
    // Let follow cam tween in.
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/${r.file}` });
    console.log(`${r.id} captured`);
  }

  await browser.close();
  console.log('done');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
