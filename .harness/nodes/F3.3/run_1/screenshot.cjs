// One-off screenshot script for F3.3 — captures the character during the
// intro 'dialogue' phase after the F3.2 review-findings fix pass.
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  page.on('pageerror', (e) => console.error('PAGE ERROR:', e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('CONSOLE ERROR:', msg.text());
  });

  await page.goto('http://localhost:5173/?view=3d');
  await page.waitForSelector('canvas', { timeout: 10000 });
  await page.waitForTimeout(2500);

  await page.evaluate(() => {
    const store = window.__worldStore;
    if (!store) throw new Error('worldStore not on window');
    const s = store.getState();
    if (typeof s.setIntroPhase === 'function') s.setIntroPhase('dialogue');
    if (typeof s.setCharPos === 'function') s.setCharPos(0, 0);
  });

  await page.waitForTimeout(2500);

  const outPath = path.resolve(__dirname, 'screenshot-character.png');
  await page.screenshot({ path: outPath, fullPage: false });
  console.log('wrote', outPath);

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
