# Acceptance Criteria — SuriWorld 3D Bugfix Loop

## Outcomes

- OUT-1: Walk-through doors works without keypress. Player can walk W/A/S/D toward any room door from overview/follow mode and pass through it. Camera transitions to FP without teleporting the character more than 0.5u from their pre-transition position. Walking back out drops to overview without ESC. Zero ping-pong (no FP↔overview flip within 0.5s on a single straight walk through the door). Auto-enter trigger only fires once player has crossed the door plane (dot product `(player − door) · (roomCenter − door) > 0` AND inside-distance ≥ 0.4u).
- OUT-2: Product Room — server rack at back wall, ≥ 2.0u from doorway. Floor stage under desk is a single rectangular slab in one tint with visible edges. No offset side bands, no cyan stripe, no F3.21 dark overlay quadrant.
- OUT-3: Book Room — bookshelves rendered behind couch (couch in middle ground, shelves in background from FP-spawn camera POV). Seat cushion has a focused interactable; pressing E opens a modal titled `读《许三观卖血记》(余华)` with a 2-3 sentence body summary of the novel.
- OUT-4: Follow camera auto-rotates to face book and idealab when player approaches them in overview/follow mode. Within 2 seconds of `nearbyRoom === 'book' or 'idealab'`, follow yaw is within 0.3 rad of the target yaw `atan2(roomCenter.x − charPos.x, roomCenter.z − charPos.z)`. Walking toward myroom or product room does NOT trigger auto-rotation. Active mouse drag overrides auto-rotation within one frame.

## Verification

- OUT-1: Playwright sequence `tests/bugfix-walkthrough.spec.cjs`: load `/3d`, dismiss intro, drive W toward myroom door (north for top rooms), capture FP screenshot at `z ≈ -1.6` (assert FP active, no teleport > 0.5u from prior `charPos.z`). Drive S until `z > -1`; assert overview mode resumed. Repeat for product (E), book (S), idealab (SE). Frame-by-frame `charPos` deltas captured; max single-frame jump < 0.5u. Zero `pageerror` and zero `console.error` over the run. Output: `.harness-bugfix/nodes/B1/run_1/walkthrough.txt` + 4 screenshots.
- OUT-2: Playwright enter Product Room via auto-walk; FP screenshot at eye height looking forward — captured to `.harness-bugfix/nodes/B2/run_1/screens/product-fp.png`. Top-down screenshot via `__camera` mutation captured to `product-topdown.png`. Mechanical check: PIL pixel-color sample of the carpet from top-down — sample 9 points across the slab, all must be within ΔE < 5 of base slate `#1e293b` (proves single tint).
- OUT-3: Playwright enter Book Room, capture `.harness-bugfix/nodes/B3/run_1/screens/bookroom-fp-spawn.png`. Walk character to chair (auto-focus must occur); capture `bookroom-focused.png`. Press E; capture `bookroom-modal.png`. Mechanical check: read `__worldStore.getState().modalInteractable.title` — assert string contains `许三观卖血记`. Body length ≥ 60 characters.
- OUT-4: Playwright: position character at origin, drive S to approach book room. Sample `__worldStore.getState()` and `window.__camera.rotation.y` at t=0 and t=2s. Compute target yaw = `Math.atan2(bookCenter.x − charX, bookCenter.z − charZ)`; assert `|yaw_t2 − target| < 0.3`. Repeat for idealab (drive SE). Drive N toward myroom; assert `|yaw_t2 − yaw_t0| < 0.1` (no auto-rotation). Drag mouse during book approach via `page.mouse.down()` + `move()` + `up()`; assert post-drag yaw matches drag end position. Output: `.harness-bugfix/nodes/B4/run_1/yaw-trace.txt` + 4 screenshots.

## Quality Constraints

- `npm run build` + `npm run lint` clean on every commit.
- No new `pageerror` or `console.error` during full Playwright walk-through.
- Existing E/U keybindings still work (manual enter/unlock parity must not regress).
- Existing R4.1 closed-volume floors must not regress (no transparent walls reintroduced).
- All commits atomic (one per outcome ideally).
- Pre-existing `tests/3d-world.test.cjs` continues to pass.

## Quality Baseline (polished)

- Dark mode + light mode both supported and visually verified by READING screenshots, not just numbers.
- Responsive: desktop 1280×800 verified for visual changes (mobile 390×844 acceptable to skip — bug fixes only, no new HUD).
- Loading/error/empty states preserved.
- Focus styles preserved on EXIT ROOM, interact modal.

## Out of Scope

- Mobile-specific gestures.
- New rooms or interactables beyond the 许三观卖血记 one.
- Replacing the intro sequence (`src/world3d/intro/*` off-limits).
- Audio cues.
- Onboarding overlay (that's R4.7 in the sibling harness).
- Pushing to remote.
