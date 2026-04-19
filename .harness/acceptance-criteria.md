# Acceptance Criteria — SuriWorld 3D R4 Architecture Refactor

R4 is a refactor loop addressing R3's self-critique: the bugs no longer manifest in
screenshots, but the architecture that produced them is unchanged. Goal: make the
code architecturally honest so future feature work doesn't resurface variants.

## Outcomes

- OUT-1: Every room is constructed as a single closed-volume mesh group via a shared `Room.tsx` builder taking `{id, center, footprint, accentColor, floorColor}` and emitting floor + 4 walls (with door cutouts) + ceiling as one logical unit. The Ground plane at y=−0.5 is REMOVED from the scene (rooms+hallway floors must tile the entire walkable space). Verified by raycasting downward from 100 sample points covering each room's footprint at FP eye height (1.5) — every ray must hit a floor mesh before y=−0.1, and `git grep "Ground"` in src/ must show only the deletion commit. Failure mode: any raycast that misses or any visible dark void in the 8 doorway screenshots (4 rooms × down/up) fails OUT-1.
- OUT-2: StarField is occluded by a full-coverage room shell. Verified by 4 screenshots of REAL PointerLock pitch=−π/2 (camera looking straight up) inside each room — bright pixel count >200/255 must be ≤ 5 in the FULL frame, not a center crop. Real PointerLock pitch is achieved by either (a) `page.locator('canvas').click()` then incremental `page.mouse.move()` deltas, OR (b) DEV-exposed `window.__camera = camera` mutated to `rotation.x = -Math.PI/2`. Screenshot taken AFTER one RAF paint. Failure mode: bright count > 5 in any room's straight-up shot fails OUT-2 — even the previously-tolerated "stars past finite ceiling extent" must be gone now.
- OUT-3: All in-world interactable prompts ("Press E to interact") are world-anchored via drei `<Html>` attached to the interactable mesh, not center-screen HUD chrome. Crosshair retains its focus-state visual (cyan + 1.6× scale). Verified by 4 screenshots showing prompt visibly anchored within 50px of the target interactable's projected screen position; plus a 30°-rotated screenshot showing the prompt has moved with the object on screen. Failure mode: prompt remains at screen center, or prompt does not track the object across camera rotation, fails OUT-3.
- OUT-4: First-time user gets a single 5-second onboarding overlay on first room entry per session: "Move with WASD · Look with mouse · Press E to interact · Press ESC to exit". Dismissible via click or any key. Persisted via `sessionStorage.setItem('suri-onboarding-shown', '1')`. Verified by Playwright: clear sessionStorage → load /3d → enter myroom → screenshot showing overlay → reload → enter myroom → screenshot showing NO overlay. Failure mode: overlay shows on second entry, or doesn't show on first entry, or doesn't dismiss on click/key, fails OUT-4.
- OUT-5: A single `useWorldStore` selector `isAnyModalOpen` returns true when ANY modal/dialogue/overlay is open (intro modal, dialogue, interact-modal, onboarding overlay, room-entry toast). All HUD components (crosshair tooltip, future contextual hints) gate on this selector. Verified by `git grep -nE "(introPhase|dialogueOpen|modalOpen)" src/world3d/hud/` returning ONLY the new selector definition (no direct key reads in HUD code). Plus Playwright: open dialogue → verify Press-E hint does not show; close → focus interactable → hint shows. Failure mode: any HUD component still reads individual keys directly, or hint shows over a modal, fails OUT-5.
- OUT-6: A real PointerLock E2E test exists at `tests/3d-fp-flow.spec.cjs` runs the full user journey: load /3d → start → intro dialogue → dismiss → enter myroom → look around (real mouse-move) → focus interactable → press E → close interact modal → press ESC to exit → enter productroom → exit. Test captures 6+ named screenshots, asserts zero `pageerror` and zero `console.error`. Used as the per-unit smoke test from R4.4 onward. Failure mode: test exits non-zero, OR any console error captured, OR a screenshot reveals a visual regression vs prior tick, fails OUT-6.
- OUT-7: OUT-2 (R3) brightness band is RESTORED to ±10% of pre-R3 baseline (`/tmp/sw-fp-down.png` = 64.19, target window 57.8–70.6), undoing R3.7's lower-bound amendment. Light-theme ceiling brightness ≥ 180 must still hold simultaneously. Achieved by reducing emissive intensity now that closed-volume room provides ambient occlusion (less reliance on emissive bounce). Verified by `look-down-myroom-dark.png` brightness 57.8–70.6 AND `look-up-myroom-light.png` brightness ≥180, sampled with PIL. Failure mode: either threshold missed, fails OUT-7.

## Verification

- OUT-1: TypeScript file diff (Walls.tsx + Ceiling.tsx + per-room files reduced; new `Room.tsx` exists; `ROOMS.map(r => <Room {...r}/>)` in World.tsx). Raycast script `tests/raycast-coverage.cjs` runs 100 rays per room; output to `.harness/nodes/{node}/run_1/raycast.txt`. Doorway screenshots (8 PNGs) — bottom-third PIL brightness ≥30 in dark mode.
- OUT-2: Real PointerLock pitch verification described in outcome. Screenshots `.harness/nodes/{node}/run_1/screens/look-up-real-pitch-{room}.png`. PIL bright-pixel count on full frame.
- OUT-3: 4 anchored-prompt screenshots + 1 rotation-test screenshot per room. Manual visual inspection by reviewer (not just bounding box) — does the prompt READ as part of the world, not HUD chrome?
- OUT-4: Playwright sequence + 2 screenshots (first-time vs second-time). Plus check `sessionStorage.getItem('suri-onboarding-shown') === '1'` after first dismiss.
- OUT-5: `git grep` output saved to `.harness/nodes/{node}/run_1/grep-modal-keys.txt`; integration test screenshots.
- OUT-6: `npm run test:e2e` (or whatever script wires the spec) exits 0; saves to `.harness/nodes/{node}/run_1/e2e-output.txt` plus 6 milestone PNGs.
- OUT-7: PIL brightness numbers logged to `.harness/nodes/{node}/run_1/brightness.txt`. Both thresholds compared against criterion.

## Quality Constraints

- No new console errors during full E2E run (Playwright `pageerror` + `console.error` handlers capture 0 errors).
- `npm run build` + `npm run lint` clean on every commit.
- All commits atomic, one logical change per commit. No `--no-verify`.
- Pre-existing `tests/3d-world.test.cjs` continues to pass.
- No FPS regression: dev frame-time median ≤ 18ms over 3-second sample inside a room.
- File-level discipline: `Room.tsx` is the only structural file for room construction; `InteractPrompt3D.tsx` is the only file for world-anchored prompts; `OnboardingOverlay.tsx` is the only file for the new overlay; `isAnyModalOpen` selector lives in `worldStore.ts`. No bleed across layers.
- Reviewer roles run in serial-with-context (Round 1 parallel for fresh angles; Round 2 second-wave reviewers see Round 1 findings).
- E2E smoke test runs after every implement unit, not just at the end.

## Out of Scope

- Mobile-specific onboarding copy or tap-to-interact gestures (still desktop-FP focused).
- New room content or new interactables (refactor preserves existing scene state).
- Window/door geometry beyond what's needed for closed-volume seams.
- Replacing zustand or migrating to a different state library.
- Audio cues, haptics, or controller support.
- Refactoring intro sequence (`src/world3d/intro/*` remains off-limits).
- Texture maps or PBR materials beyond the existing `meshStandardMaterial`.
- Pushing R3 commits to origin (deferred until user explicitly requests).

## Quality Baseline (polished)

- Dark mode + light mode both supported and visually verified by READING screenshots, not just numbers (R3 critique G).
- Responsive: desktop 1280×800 + mobile 390×844 verified for all UI changes (overlay, world-anchored prompts must not overlap EXIT ROOM at mobile).
- Loading/error/empty states: room-entry toast, exit hint, intro dialogue, new onboarding overlay all preserved/coordinated under `isAnyModalOpen`.
- Focus styles preserved on EXIT ROOM, interact modal, onboarding overlay's dismiss button.
- Favicon, font loading, color tokens unchanged from R3.
