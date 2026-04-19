# Plan — SuriWorld 3D R4 Architecture Refactor

12 units. Implement and review separated. Serial-with-context review (Round 1 parallel, Round 2 sees Round 1 findings). E2E smoke test runs after every implement unit from R4.4 onward.

## Project Context

- Repo: `/Users/surixing/Code/SuriWorld/SuriWorld` (branch `main`, currently 9 commits ahead of origin from R2+R3, do not push without user request)
- Stack: Vite + React + TypeScript + react-three-fiber + drei + zustand
- Dev server: `npm run dev` on port 5173, route `/3d`
- Build: `npm run build` (tsc -b && vite build)
- Lint: `npm run lint` (eslint)
- DEV-only seam: `window.__worldStore` exposes the zustand store; R4 will add `window.__camera` similarly
- Project rule (CLAUDE.md): UI changes MUST be visually verified via webapp-testing (Playwright headless) before declaring done — R4 reviewers MUST visually inspect screenshots, not just brightness numbers (R3 critique G)
- R3 critique → R4 mandates:
  - Critique A: real PointerLock pitch screenshots, not store mutation cosplay
  - Critique B: restore OUT-2 ±10% band (now possible because closed-volume rooms = better ambient occlusion = less emissive needed)
  - Critique C: kill threshold patches by extending floors to fully tile
  - Critique D: respawn distribution must match measured spawn distribution
  - Critique E: single `isAnyModalOpen` selector
  - Critique F: serial-with-context review
  - Critique G: light-theme screenshots VIEWED by reviewer, not just brightness numbers
  - Critique H: full E2E smoke test in every unit

## Validators Detected

- pre-commit hooks: none
- test script: `tests/3d-world.test.cjs` (legacy static-html, must keep green); will add `tests/3d-fp-flow.spec.cjs` for E2E
- lint script: `npm run lint` (clean in R3)
- typecheck: implicit via `npm run build`

## Units

- R4.1: implement-room-builder — Create `src/world3d/scene/Room.tsx` builder taking `{id, center, footprint, accentColor, floorColor}`. Emit floor + 4 walls (with door cutouts using shape-extrude or boolean-via-mesh-grouping if CSG too heavy) + ceiling as one logical mesh group. Update `World.tsx` to render `ROOMS.map(r => <Room {...r}/>)` instead of separate Walls/Ceiling/RoomFloor components. Hallway stays separate but its floor must tile-meet room floors at every doorway with no gap. Delete the 4 threshold patches added in R3.3 — they should be unnecessary now. Touches: NEW `src/world3d/scene/Room.tsx`, modify `src/world3d/scene/World.tsx`, modify `src/world3d/scene/Hallway.tsx` (remove threshold patches, extend floor as needed), DELETE or shrink `src/world3d/scene/Walls.tsx` + `src/world3d/scene/Ceiling.tsx` + `src/world3d/scene/RoomFloor.tsx`.
  - verify: `npm run build` + `npm run lint` clean; new `Room.tsx` exists; raycast script `tests/raycast-coverage.cjs` (write it) emits 100 rays per room and reports 100% floor coverage to `.harness/nodes/R4.1/run_1/raycast.txt`; doorway-down screenshots for all 4 rooms show continuous floor.
  - eval: OUT-1 (closed-volume + Ground deletion deferred to R4.3). Files: Room.tsx, World.tsx, Hallway.tsx, deleted Walls/Ceiling/RoomFloor. Watch for: door cutouts not aligning with hallway openings; floor color mismatch at room/hall seam; FPS regression from CSG-style geometry.

- R4.2: review-room-builder — Round 1 parallel: frontend (R3F geometry correctness), architect (refactor health, file count, abstraction quality). Round 2 serial: tester sees both Round 1 findings, looks for adjacent missed bugs (esp. "did the threshold patch deletion regress R3.3?").
  - verify: ≥3 eval files (`eval-frontend.md`, `eval-architect.md`, `eval-tester.md`) in `.harness/nodes/R4.2/run_1/`; verdict.md synthesized.
  - eval: Round 2 reviewer must explicitly cite Round 1 findings or note "no adjacent issues found." Verdict feeds R4.12.

- R4.3: implement-ground-removal-and-skybox — Delete `src/world3d/scene/Ground.tsx` from the scene OR push to y=−5 + below FOG_DENSITY threshold so unreachable from any FP angle. Add a full-coverage skybox interior (large inverted box or sphere with `BackSide` material) to occlude StarField from any pitch angle. The R3 finite-ceiling architecture is replaced — stars must NOT be visible from inside any room when looking straight up. Touches: `src/world3d/scene/World.tsx`, `src/world3d/scene/Ground.tsx` (delete or modify), NEW `src/world3d/scene/Skybox.tsx` (or merge into existing StarField).
  - verify: `npm run build` + `npm run lint` clean; `git grep "Ground"` in src/ shows minimal references; **REAL PointerLock screenshots** for all 4 rooms — `.harness/nodes/R4.3/run_1/screens/look-up-real-pitch-{room}.png` — using `window.__camera` DEV exposure (you must add this) and direct `camera.rotation.x = -Math.PI/2`; PIL bright-pixel count on FULL frame ≤ 5 per room.
  - eval: OUT-2 (stars + ground removal). Files: World.tsx, Ground.tsx (deleted), Skybox.tsx (new). Watch for: skybox blocking the overview camera shot from above; stars now invisible in overview mode (regression).

- R4.4: review-ground-and-skybox — Round 1: frontend (depth + scene graph), designer (does the skybox visual coordinate with the room aesthetic?). Round 2: pm sees both Round 1 findings, judges "does this still feel like Suri's lab, not a Quake map?"
  - verify: 3 eval files; verdict.md; FIRST E2E SMOKE TEST RUN (per critique H — use the new `tests/3d-fp-flow.spec.cjs` which R4.7 will create; for R4.4 run a stub that at minimum loads /3d, enters myroom, exits, captures screenshots — full E2E spec is R4.7's deliverable).
  - eval: Round 2 reviewer must cite Round 1 findings.

- R4.5: implement-world-anchored-prompts — Replace center-screen `InteractTooltip.tsx` (or supplement) with a 3D-anchored prompt via drei `<Html>` attached to the focused interactable's mesh. Crosshair retains cyan + 1.6× scale focus state. Tooltip text "Press E to interact" floats above the interactable, follows the object on screen as camera rotates. Sessionstorage gate from R3.5 still applies. Touches: NEW `src/world3d/scene/InteractPrompt3D.tsx`, modify `src/world3d/hud/InteractTooltip.tsx` (deprecate or repurpose), modify `src/world3d/scene/InteractionRaycaster.tsx` (expose focused mesh ref + position).
  - verify: build + lint; 4 anchored-prompt screenshots (one per room) showing prompt within 50px of target's projected screen position; 1 rotation-test showing prompt has moved with the object; E2E smoke test green.
  - eval: OUT-3. Watch for: occlusion (prompt visible through walls); prompt appearing for un-aimed objects; mobile overlap with EXIT ROOM at 390×844.

- R4.6: review-world-anchored-prompts — Round 1: designer (visual integration), a11y (aria-live still works for screen readers when prompt is in 3D space). Round 2: new-user persona reviewer sees both Round 1 findings, judges discoverability for someone who's never played the game.
  - verify: 3 eval files; verdict.md; E2E smoke test green.
  - eval: Round 2 must cite Round 1.

- R4.7: implement-onboarding-overlay-and-e2e-test — Add `src/world3d/hud/OnboardingOverlay.tsx`: 5-second one-shot overlay on first room entry per session with WASD/Mouse/E/ESC instructions. Click or any-key dismisses. SessionStorage `suri-onboarding-shown=1`. ALSO write the canonical E2E spec `tests/3d-fp-flow.spec.cjs` (was a stub in R4.4): full user journey load→intro→enter myroom→look→focus→E→close→ESC→enter productroom→exit. 6+ named screenshots, 0 console errors. Wire to `npm run test:e2e` script in package.json. Touches: NEW `src/world3d/hud/OnboardingOverlay.tsx`, modify `src/world3d/hud/Hud.tsx` (or wherever HUD assembles), NEW `tests/3d-fp-flow.spec.cjs`, modify `package.json`.
  - verify: build + lint + `npm run test:e2e` exits 0; clear sessionStorage → enter myroom → screenshot showing overlay; reload → enter myroom → screenshot showing NO overlay; full E2E flow captures 6 milestone PNGs.
  - eval: OUT-4 + OUT-6. Watch for: overlay overlapping EXIT ROOM at mobile; E2E test flakiness from race conditions in intro sequence.

- R4.8: review-onboarding-and-e2e — Round 1: pm (does this solve the original "no hints" complaint at the category level?), tester (is the E2E spec robust or flaky?). Round 2: a11y sees both Round 1, checks overlay is keyboard-dismissible + screen-reader friendly + respects PRM.
  - verify: 3 eval files; verdict.md; E2E rerun green.
  - eval: OUT-4 + OUT-6. Round 2 reviewer must explicitly cite Round 1 findings or note "no adjacent issues found." Verdict feeds R4.11.

- R4.9: implement-isAnyModalOpen-refactor — Add `isAnyModalOpen` derived selector to `src/world3d/store/worldStore.ts`. Refactor all HUD components currently reading `introPhase`, `dialogueOpen`, `modalOpen` etc. for visibility-gating to use the new selector. Includes the R3.7 InteractTooltip gating fix (remove its specific key reads, use selector). Touches: `src/world3d/store/worldStore.ts`, `src/world3d/hud/*` (multiple files via grep).
  - verify: build + lint; `git grep -nE "(introPhase|dialogueOpen|modalOpen)" src/world3d/hud/` returns ONLY the selector definition import; integration test: open dialogue → Press-E hint hidden; close dialogue → focus interactable → hint visible. E2E smoke test green.
  - eval: OUT-5. Watch for: missed HUD components that now show over modals; race conditions when modals close.

- R4.10: review-isAnyModalOpen — Round 1: frontend (selector correctness, memoization, derived state vs computed), architect (is this the right abstraction or is it leaking concerns?). Round 2: tester sees Round 1, runs a matrix of (modal-A-open, modal-B-open) × (hint-X-active, hint-Y-active) to confirm selector covers all cases.
  - verify: 3 eval files; matrix test output; E2E green.
  - eval: OUT-5. Round 2 reviewer must explicitly cite Round 1 findings or note "no adjacent issues found." Verdict feeds R4.11.

- R4.11: fix-and-accept — Address all 🔴/🟡 findings from R4.2/R4.4/R4.6/R4.8/R4.10. ALSO tune ceiling emissive intensity to bring `look-down-myroom-dark.png` back into 57.8–70.6 band while keeping `look-up-myroom-light.png` ≥180 (closed-volume rooms now provide better ambient occlusion so emissive can be reduced). Update `acceptance-criteria.md` to confirm OUT-7 lower-bound amendment is no longer needed. Run final acceptance against all 7 OUT-N. If no findings, jump straight to acceptance.
  - verify: build + lint clean; all named screenshots present in `.harness/nodes/R4.11/run_1/screens/`; each OUT-N has a PASS/FAIL line in `eval.md`; raycast coverage 100%; E2E green; brightness within both bands; specific R4.2/R4.4/R4.6/R4.8/R4.10 findings cited in commit messages.
  - eval: PASS only if 7/7 OUT-N pass AND zero new 🔴 introduced AND R3 critique items A–H all addressed (this is the final test against R3 self-critique). FAIL on any 🔴.

## Backlog Promotion Rules

Anything reviewers flag as 🟡-not-fixed-this-cycle goes to `.harness/backlog.md` with severity prefix. R4.12 must not pass with any open 🔴.

## Outright Off-Limits

- Do not touch `src/world3d/intro/*` — out of scope.
- Do not regenerate `tests/3d-world.test.cjs` beyond keeping it green.
- Do not push to remote — user has not requested it.
- Do not enable/disable any dev tooling globally.
- Do not change zustand or storage architecture.
