# Plan — SuriWorld 3D R3 Polish (Loop)

7 units. Implement and review separated. One commit per unit.

## Project Context

- Repo: `/Users/surixing/Code/SuriWorld/SuriWorld` (branch `main`, 1 commit ahead of origin already, do not push without user request)
- Stack: Vite + React + TypeScript + react-three-fiber + drei + zustand
- Dev server: `npm run dev` on port 5173, route is `/3d`
- Build: `npm run build` (tsc -b && vite build)
- Lint: `npm run lint` (eslint)
- DEV-only seam: `window.__worldStore` exposes the zustand store for test teleports
- Project rule (CLAUDE.md): UI changes MUST be visually verified via webapp-testing skill (Playwright headless) before declaring done

## Validators Detected

- pre-commit hooks: none in repo (no `.husky/`, no `.git/hooks/pre-commit`)
- test script: none for FP scenes (`tests/3d-world.test.cjs` is older static-html-only)
- lint script: yes (`npm run lint`, ran cleanly in R2)
- typecheck: implicit via `npm run build` (`tsc -b`)

## Units

- R3.1: implement-ceiling — Replace plane ceiling with thin `boxGeometry`. Switch to `meshStandardMaterial` with a warm wood tone (or a deliberately chosen non-black `meshBasicMaterial` color matching the floor warmth) so it reads as architecture, not void. Add per-room under-ceiling fill light at y≈1.7 OR move existing y=4 room point lights to y=1.7. Set explicit `renderOrder` on ceiling so depth occludes stars. Revert the `viewMode === 'overview' && <StarField />` gate in `World.tsx`. Touches: `src/world3d/scene/Ceiling.tsx`, `src/world3d/scene/World.tsx`, `src/world3d/scene/StarField.tsx`.
  - verify: `npm run build` succeeds; `npm run lint` succeeds; Playwright screenshot `look-up-myroom-dark.png` shows ceiling brightness ≥ 30/255 in 200×200 center crop; `myroom-baseline-dark.png` brightness within 10% of `/tmp/sw-fp-down.png`; entering room mid-tween (t=500ms) shows stars above ceiling line, none below.
  - eval: OUT-1, OUT-2, OUT-4 (stars portion). Files reviewed: Ceiling.tsx, World.tsx, StarField.tsx. Watch for: render-order side effects on existing materials, light intensity ballooning, `meshStandardMaterial` causing FPS drop on mobile.

- R3.2: review-ceiling — Independent multi-role review of R3.1. Roles: frontend (R3F idiom + perf), designer (visual coherence + lighting). Reviewers see only the diff + acceptance-criteria.md, not the implementer's reasoning.
  - verify: ≥ 2 eval-{role}.md files in `.harness/nodes/R3.2/run_1/`; `opc-harness synthesize` produces a verdict.
  - eval: Roles must NOT have been the R3.1 implementer. Verdict feeds R3.7 fix-and-accept.

- R3.3: implement-particles-and-thresholds — Clamp `Particles` `py[i]` < 1.95 each frame so dust never breaches the ceiling. Patch the doorway threshold gap so the hallway floor + Ground are not visible looking down at a doorway. Touches: `src/world3d/scene/Particles.tsx`, possibly `src/world3d/scene/Hallway.tsx` or `src/world3d/scene/RoomFloor.tsx`.
  - verify: `npm run build` succeeds; `npm run lint` succeeds; Playwright `doorway-down-myroom.png` and `doorway-up-myroom.png` for all 4 rooms; bottom-third brightness ≥ 10/255 (no dark void); top-third bright-pixel count ≤ 5 (no stars through ceiling).
  - eval: OUT-3, OUT-4 (particles portion). Files reviewed: Particles.tsx + any threshold floor file. Watch for: Z-fighting between RoomFloor/Hallway/threshold patch, particles snapping at the ceiling.

- R3.4: review-particles-and-thresholds — Independent review of R3.3. Roles: frontend (geometry/depth correctness), tester (verify all 4 rooms covered).
  - verify: ≥ 2 eval-{role}.md files in `.harness/nodes/R3.4/run_1/`; verdict produced.
  - eval: Roles must NOT have been the R3.3 implementer. Verdict feeds R3.7 fix-and-accept.

- R3.5: implement-crosshair-feedback-and-tooltip — Add `.focused` class to the `.crosshair` element when `focusedInteractable` is non-null in FP. CSS color (gold→cyan) + scale 1.6×. New one-shot tooltip "Press E to interact" near crosshair, sessionStorage-gated so it only appears once per session, dismissed after 2.5s OR on first E press. Touches: `src/world3d/hud/Crosshair.tsx` (or wherever the crosshair lives — verify), `src/world3d/world3d.css`, possibly new `src/world3d/hud/InteractTooltip.tsx`.
  - verify: `npm run build` succeeds; `npm run lint` succeeds; Playwright teleport into MyRoom + walk near bed; `document.querySelector('.crosshair').classList.contains('focused')` is true; computed background-color changed from gold; tooltip element visible; sessionStorage `suri-interact-hint-shown=1` set.
  - eval: OUT-5. Files reviewed: Crosshair.tsx (or equivalent), new InteractTooltip.tsx, world3d.css, the zustand selector wiring. Watch for: tooltip overlap with EXIT ROOM on mobile, stale focused state after exiting room.

- R3.6: review-crosshair — Independent review of R3.5. Roles: a11y (focus visibility, screen-reader text on crosshair change), pm (does this actually solve discoverability?).
  - verify: ≥ 2 eval-{role}.md files in `.harness/nodes/R3.6/run_1/`; verdict produced.
  - eval: Roles must NOT have been the R3.5 implementer. Verdict feeds R3.7 fix-and-accept.

- R3.7: fix-and-accept — Address all 🔴/🟡 findings from R3.2 + R3.4 + R3.6. Then run final acceptance against all 6 OUT-N. If no findings, jump straight to acceptance.
  - verify: `npm run build` + `npm run lint` clean; all Playwright screenshots in `.harness/nodes/R3.7/run_1/screens/` exist with the names mandated in acceptance-criteria.md Verification section. Each OUT-N has a pass/fail line in `.harness/nodes/R3.7/run_1/eval.md`. Specific R3.2/R3.4/R3.6 findings cited in commit message.
  - eval: PASS only if 6/6 OUT-N pass AND no new 🔴 findings introduced. ITERATE on partial pass. FAIL on any 🔴.

## Backlog Promotion Rules

Anything that reviewers flag as 🟡-not-fixed-this-cycle goes to `.harness/backlog.md` with severity prefix. R3.7 must not pass with any open 🔴.

## Outright Off-Limits

- Do not touch `src/world3d/intro/*` — out of scope.
- Do not regenerate or refactor `tests/3d-world.test.cjs` beyond keeping it green.
- Do not push to remote — user has not requested it.
- Do not enable/disable any dev tooling (`@react-three/drei` Stats panel, etc.) globally.
