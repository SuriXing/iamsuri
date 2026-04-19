# Acceptance Criteria — SuriWorld 3D R3 Polish

R3 of /3d FP-mode bug fixes addressing 6 issues raised after R2 (A–F)
plus 2 better-solution patterns.

## Outcomes

- OUT-1: Looking straight up in any of the 4 rooms (myroom, productroom, bookroom, idealab) at FP altitude shows a non-flat-black ceiling. Average pixel brightness in a 200×200 crop centered on screen at the look-up screenshot is ≥ 30 (out of 255) on dark theme and ≥ 180 on light theme. Implemented via `meshStandardMaterial` (or basic with theme-coordinated color, NOT raw `#2a1d10`) on a thin `boxGeometry`, plus relocated/added under-ceiling room lighting.
- OUT-2: Average pixel brightness inside MyRoom (200×200 crop centered on the bed mesh, FP eye at room center) is within 10% of the pre-R3 baseline screenshot at `/tmp/sw-fp-down.png`. The ceiling fix MUST NOT seal the lights above it.
- OUT-3: Standing at any doorway threshold in FP, looking down shows continuous floor (sampled bottom-third pixel brightness ≥ 10/255 in dark mode), no Ground plane at y=-0.5 visible, no dark void. Looking up at the threshold shows ceiling/hallway-ceiling (no stars in top-third of screenshot).
- OUT-4: Stars render in all viewModes (revert the `viewMode === 'overview'` gate). The ceiling occludes them via depth testing — verified by entering a room mid-tween: at t=0.5s into the camera tween, stars are visible above the ceiling line and absent below it (no full-frame pop). Particles `py[i]` is clamped at < 1.95 each frame so dust never breaches the ceiling.
- OUT-5: When `focusedInteractable` is non-null in FP, the `.crosshair` element gains a `.focused` class that changes color (gold→cyan, hex shift verifiable in computed style) AND scales up by 1.6×. A one-shot tooltip "Press E to interact" appears within 200ms of focus, dismissed after 2.5s OR after first E press, persisted in sessionStorage so it does not repeat.
- OUT-6: All OUT-1 through OUT-5 pass screenshot verification in BOTH dark mode and light mode. Mobile viewport 390×844: EXIT ROOM button, exit-hint banner, and the new interact tooltip do not visually overlap (bounding-box check via Playwright `boundingBox()`).

## Verification

- OUT-1: Playwright screenshot `look-up-{room}-{theme}.png` for all 4 rooms × 2 themes. Pixel-brightness sampling via PIL on a 200×200 center crop. Threshold: dark ≥ 30, light ≥ 180.
- OUT-2: Playwright screenshot `myroom-baseline-{theme}.png` after R3 vs `/tmp/sw-fp-down.png` baseline. PIL average brightness on bed-area crop. Threshold: |new - old| / old < 0.10.
- OUT-3: Playwright screenshots `doorway-down-{room}.png` and `doorway-up-{room}.png` for all 4 rooms. Bottom-third pixel brightness sampled with PIL. UP check: 200×200 overhead crop bright pixel count ≤ 5 (>200/255), mirroring the OUT-1 method (R3.7 amendment per R3.4 reviewer recommendation; finite ceiling extent past building footprint is intentional architecture, not a bleed-through defect — top-third sampling caught those legitimate stars too).
- OUT-4: Playwright with frame timer — screenshot at exactly t=500ms after `beginRoomTransition()` call. Visual diff: stars present above midline, absent below. Plus a code-level assertion: read `World.tsx` and confirm `viewMode === 'overview' && <StarField />` gate is removed.
- OUT-5: Playwright `evaluate()` reads `document.querySelector('.crosshair').classList.contains('focused')` after triggering proximity to a known interactable. Computed-style color check: getComputedStyle background-color must change. Tooltip element queryable by selector and visible. SessionStorage key set.
- OUT-6: All screenshots taken at both 1280×800 and 390×844 viewports, both `theme: dark` and `theme: light` set via `window.__worldStore.getState().toggleTheme()`. Bounding-box overlap check: `intersect(rect(.exit-hint), rect(.back-btn), rect(.interact-tooltip)) === empty`.

## Quality Constraints

- No new console errors during room enter/exit cycle (Playwright captures `page.on('pageerror')` and `page.on('console', msg if msg.type() == 'error')`).
- `npm run build` succeeds (TypeScript compile + Vite build, no warnings about new code).
- All commits atomic, one per implement/fix unit. No `--no-verify`.
- Pre-existing tests in `tests/3d-world.test.cjs` continue to pass.
- No FPS regression measurable: dev FPS counter (if present) within 5fps of pre-R3 baseline; otherwise frame-time sampling via `requestAnimationFrame` over 3 seconds shows median frame ≤ 18ms.
- File-level discipline: Ceiling.tsx is the only structural file touched for ceiling work; new crosshair/tooltip code is colocated in HUD layer not bleeding into scene/.

## Out of Scope

- Mobile swipe-down-to-exit gesture (called out as "better" but separate UX feature, not a bug).
- Texture maps for the ceiling (just a solid material is sufficient — KISS).
- Replacing the room point lights with area lights or refactoring the lighting system globally.
- Audio cues for interactability.
- Refactoring StarField/Particles to instance via a shader instead of points/instancedMesh.
- Animations on the new ceiling box (no swaying lamps, no parallax).

## Quality Baseline (polished)

- Dark mode + light mode both supported and visually verified.
- Responsive: desktop 1280×800 + mobile 390×844 verified for all changes.
- Loading/error/empty states: room-entry toast, exit hint, intro dialogue all preserved unchanged.
- Focus styles preserved on EXIT ROOM, interact buttons, the new "Press E" tooltip kbd.
- Favicon, font loading, color tokens unchanged.
