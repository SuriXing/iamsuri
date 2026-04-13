# Acceptance Criteria — F3 Polish Pass

## What "done" looks like

The 3D world (`src/world3d/scene/**`) reads as **精致** (refined, well-crafted)
rather than blocky-prototype. Every visible furniture, character, room and
ambient component has been touched in at least one of these ways:

- material variation (per-instance hue/lightness, deterministic via mulberry32)
- bevels / trim / contrasting top edges or baseboards
- drei `<Edges>` outline pop on key silhouettes
- subtle ambient micro-animations (≤ ±5% pulse, ≤ ±2° flutter)
- improved proportions (no equal-thickness slab look)
- joint detail (chamfer / corner block / bracket)
- material expressiveness (wood matte, metal slight specular)
- 1–2 clutter props per room
- accent point lights to break up flat shading

## Hard constraints (must NOT change)

- `src/world3d/data/rooms.ts`
- `src/world3d/scene/CameraController.tsx`
- `src/world3d/scene/PlayerController.tsx`
- `src/world3d/scene/MouseOrbitController.tsx`
- `src/world3d/scene/colliders.ts` (and existing collider registrations)
- `src/world3d/store/worldStore.ts`
- `src/world3d/hud/*`
- `src/world3d/constants.ts` FOLLOW / CAMERA / FP / INTRO / ROOM / GAP
- 4-room layout, door positions, character scale (0.9), intro flow
- `tests/3d-world.test.cjs` test assertions
- Any file outside `src/world3d/scene/` and `src/world3d/util/`

## How to verify each tick

- `cd /Users/surixing/Code/iamsuri && npx tsc -b` — clean
- `npm run lint` — clean (no new violations beyond baseline 0)
- `npm run build` — clean
- `npx playwright test --config=playwright.config.cjs` — **12/12 passing**
- Per implement tick: a Playwright screenshot of the affected component, saved
  to `.harness/nodes/{NODE_ID}/run_{N}/screenshot-*.png`
- Per review tick: at least 2 independent subagent eval files with severity
  emojis (🔴 / 🟡 / 🔵)

## Performance budget

- 60fps on mid-range hardware (no visible jank)
- Triangle count growth ≤ 50% (currently ~5k)
- Draw call growth ≤ 30% (currently ~80)
- All useFrame callbacks: zero per-frame allocation (no `new THREE.Vector3()`
  inside the loop). Use module-scope scratch vectors.
- All derived geometry / arrays inside `useMemo`

## How quality is evaluated (final gate)

Two independent designer subagents review with this rubric:

| Dimension | Weight |
|---|---|
| Material variation | 15 |
| Edge / silhouette pop | 15 |
| Proportions | 15 |
| Micro-animations | 15 |
| Color harmony | 10 |
| Clutter / props | 10 |
| Character refinement | 10 |
| Performance feel | 10 |

Score 0–100 each, average them. Ship gate: **≥ 88 AND no 🔴 critical findings**.
Any dimension < 70% from a reviewer = 🟡 ITERATE → fix unit before re-scoring.

## No regressions checklist

- collision still blocks walking through walls
- door unlock still requires walking up + U key
- intro static→zoom→dialogue→follow flow still plays
- mouse orbit drag still rotates camera
- arrow keys still walk character (Up forward, Down back, Left/Right strafe)
- theme toggle still flips both HTML overlay and 3D scene background
- 2D ↔ 3D switcher still works
