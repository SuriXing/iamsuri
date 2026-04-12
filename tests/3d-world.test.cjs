// E2E tests for the 3D world, now served at /?view=3d from the unified
// landing page. `window.navigateToRoom` and `window.navigateToOverview`
// are bridges installed in src/world3d/App3D.tsx for test automation.
const { test, expect } = require('@playwright/test');

test.describe('3D World Landing Page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/?view=3d');
    await page.waitForTimeout(3000); // Wait for Three.js to render
  });

  test('page loads without JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.reload();
    await page.waitForTimeout(3000);
    expect(errors).toHaveLength(0);
  });

  test('Three.js canvas renders with dimensions', async ({ page }) => {
    const canvas = await page.$('canvas');
    expect(canvas).not.toBeNull();
    const box = await canvas.boundingBox();
    expect(box.width).toBeGreaterThan(100);
    expect(box.height).toBeGreaterThan(100);
  });

  test('room labels are visible', async ({ page }) => {
    const labels = ['label-myroom', 'label-product', 'label-book', 'label-idealab'];
    for (const id of labels) {
      const el = await page.$(`#${id}`);
      expect(el).not.toBeNull();
      const text = await el.textContent();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('My Room navigation and overlay', async ({ page }) => {
    await page.evaluate(() => window.navigateToRoom('myroom'));
    await page.waitForTimeout(2000);
    const overlay = await page.$('#overlay-myroom');
    const isActive = await overlay.evaluate(el => el.classList.contains('active'));
    expect(isActive).toBe(true);
    const text = await overlay.textContent();
    expect(text).toContain('Suri Xing');
    expect(text).toContain('Grade 8');
  });

  test('Product Room navigation with correct links', async ({ page }) => {
    await page.evaluate(() => window.navigateToRoom('product'));
    await page.waitForTimeout(2000);
    const overlay = await page.$('#overlay-product');
    const isActive = await overlay.evaluate(el => el.classList.contains('active'));
    expect(isActive).toBe(true);
    const text = await overlay.textContent();
    expect(text).toContain('Problem Solver');
    expect(text).toContain('Mentor Table');
    // Check links
    const links = await overlay.$$('a');
    expect(links.length).toBeGreaterThanOrEqual(2);
    const href1 = await links[0].getAttribute('href');
    const href2 = await links[1].getAttribute('href');
    expect(href1).toContain('problem-solver.vercel.app');
    expect(href2).toContain('mentor-table.vercel.app');
  });

  test('Book Room navigation and overlay', async ({ page }) => {
    await page.evaluate(() => window.navigateToRoom('book'));
    await page.waitForTimeout(2000);
    const overlay = await page.$('#overlay-book');
    const isActive = await overlay.evaluate(el => el.classList.contains('active'));
    expect(isActive).toBe(true);
    const text = await overlay.textContent();
    expect(text.length).toBeGreaterThan(10);
  });

  test('Idea Lab navigation and overlay', async ({ page }) => {
    await page.evaluate(() => window.navigateToRoom('idealab'));
    await page.waitForTimeout(2000);
    const overlay = await page.$('#overlay-idealab');
    const isActive = await overlay.evaluate(el => el.classList.contains('active'));
    expect(isActive).toBe(true);
    const text = await overlay.textContent();
    expect(text).toContain('Idea Lab');
  });

  test('back button returns to overview', async ({ page }) => {
    await page.evaluate(() => window.navigateToRoom('product'));
    await page.waitForTimeout(2000);
    // Back button should be visible
    const backBtn = await page.$('#back-btn');
    const isActive = await backBtn.evaluate(el => el.classList.contains('active'));
    expect(isActive).toBe(true);
    // Click back
    await backBtn.click();
    await page.waitForTimeout(2000);
    // Overlay should be hidden
    const overlay = await page.$('#overlay-product');
    const stillActive = await overlay.evaluate(el => el.classList.contains('active'));
    expect(stillActive).toBe(false);
  });

  test('theme toggle switches colors', async ({ page }) => {
    const toggle = await page.$('#theme-toggle');
    expect(toggle).not.toBeNull();
    // Click to light
    await toggle.click();
    await page.waitForTimeout(500);
    // Check localStorage
    const theme = await page.evaluate(() => localStorage.getItem('suri-theme'));
    expect(theme).toBe('light');
    // Click back to dark
    await toggle.click();
    await page.waitForTimeout(500);
    const theme2 = await page.evaluate(() => localStorage.getItem('suri-theme'));
    expect(theme2).toBe('dark');
  });

  test('page loads in reasonable time', async ({ page }) => {
    // Threshold generous for headless chromium (real browsers load in <1s)
    const start = Date.now();
    await page.goto('/?view=3d');
    await page.waitForSelector('canvas');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test('keyboard flow: teleport → unlock → enter → exit', async ({ page }) => {
    // Real-flow test: exercises unlockDoor + InteractionManager U/E key
    // handlers + Escape handler WITHOUT using window.navigateToRoom.
    // Uses setCharPos to teleport to the My Room doorway (more reliable
    // than walking, but still goes through the real keyboard path).

    // Clear door unlocks so we test the locked-door path
    await page.evaluate(() => localStorage.removeItem('suri-3d-doors-unlocked-v2'));
    await page.reload();
    await page.waitForTimeout(3000);

    // Focus the canvas so keys go to the game
    await page.click('canvas', { position: { x: 640, y: 360 } });
    await page.waitForTimeout(200);

    // Teleport character to the My Room door (top-left room center is
    // ~(-3.7, -3.7); doorway is around (-3.7, -1.8) on the +z side).
    await page.evaluate(() => {
      window.__worldStore.getState().setCharPos(-3.7, -1.8);
    });
    await page.waitForTimeout(200);

    // Wait for the proximity frame to set nearbyRoom
    await page.waitForFunction(
      () => window.__worldStore?.getState().nearbyRoom === 'myroom',
      { timeout: 2000 },
    );

    // Confirm the door is locked before we press U
    const lockedBefore = await page.evaluate(() =>
      window.__worldStore.getState().unlockedDoors.has('myroom'),
    );
    expect(lockedBefore).toBe(false);

    // Press U → unlockDoor('myroom')
    await page.keyboard.press('u');
    await page.waitForTimeout(200);
    const unlockedAfter = await page.evaluate(() =>
      window.__worldStore.getState().unlockedDoors.has('myroom'),
    );
    expect(unlockedAfter).toBe(true);

    // Press E → setViewMode('myroom')
    await page.keyboard.press('e');
    await page.waitForTimeout(2500); // camera tween

    const viewMode = await page.evaluate(() => window.__worldStore.getState().viewMode);
    expect(viewMode).toBe('myroom');

    // Escape → back to overview
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2000);

    const finalView = await page.evaluate(() => window.__worldStore.getState().viewMode);
    expect(finalView).toBe('overview');
  });

  test('no console errors during interaction', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    // Navigate through all rooms
    for (const room of ['myroom', 'product', 'book', 'idealab']) {
      await page.evaluate((r) => window.navigateToRoom(r), room);
      await page.waitForTimeout(1500);
      await page.evaluate(() => document.getElementById('back-btn').click());
      await page.waitForTimeout(1500);
    }
    // Toggle theme
    await page.click('#theme-toggle');
    await page.waitForTimeout(500);
    await page.click('#theme-toggle');
    expect(errors).toHaveLength(0);
  });
});
