# F3 — 3D World Polish Pass Plan

Goal: every visible component in `src/world3d/scene/**` reads as 精致 (refined)
instead of blocky-prototype. Architecture and feature set are FROZEN.

## Project Context (re-read each tick)

- Working dir: `/Users/surixing/Code/iamsuri`
- Stack: React 19 + TypeScript + Vite + R3F 9 + drei 10 + zustand 5
- Node: 23.7 (works fine despite engines warning)
- Constants in `src/world3d/constants.ts` — may ADD new keys, may NOT change
  FOLLOW / CAMERA / FP / INTRO / ROOM / GAP
- Shared parts at `src/world3d/scene/parts/`: Bookshelf, TableWithLegs, DeskLamp.
  Add new shared parts here when 3+ rooms repeat the same primitive.
- Mulberry32 seeded RNG at `src/world3d/util/rand.ts` — use this for any
  deterministic per-instance variation.
- Theme: `src/world3d/scene/ThemeEffect.tsx` mutates scene background + ground
  + walls based on `useWorldStore((s) => s.theme)`. Any new colour must
  respect both dark and light themes.
- Materials: keep `flatShading: true` for voxel-art look. Vary specular and
  shininess to differentiate wood / metal / fabric.
- Architecture / movement / camera / store / HUD files are FROZEN.
- No mouse, no questions — make decisions and keep building.

## Available Validators

- `npx tsc -b` (typecheck)
- `npm run lint` (eslint)
- `npm run build` (vite production)
- `npx playwright test --config=playwright.config.cjs` (12 tests, ~1.5 min)
- Dev server: `npm run dev` then visit `http://localhost:5173/?view=3d`
- Test seam: `window.__worldStore` exposes the zustand store
- `window.navigateToRoom('myroom'|'product'|'book'|'idealab')` jumps directly
  into a room (force-unlocks)
- `setIntroPhase('follow')` skips intro for screenshot tests

## Units

- F3.1: implement-character — Refine `Character.tsx`. Smoother proportions,
  small color variation on body cubes, optional accent (scarf / hat band),
  preserve chibi feel and the existing rig (head/hair/body/arms/legs/shoes
  refs used by useFrame). DO NOT change `CHARACTER.scale = 0.9` or the
  collider radius. Add deterministic micro-animation if it improves life
  (subtle blink, hair sway).
  - verify: `npx tsc -b && npm run lint && npm run build && npx playwright test --config=playwright.config.cjs` all pass; screenshot of character in dialogue phase
  - eval: avatar reads as crafted, not stamped; flatShading preserved; no per-frame allocation in useFrame

- F3.2: review-character — 2 designer subagents review the new character
  visually + read the code. Score against rubric dimensions: character
  refinement, micro-animations, color harmony, performance feel.
  - verify: 2 eval files with 🔴/🟡/🔵 markers; weighted score
  - eval: severity emojis present; specific file:line refs; constructive

- F3.3: fix-character — Address any 🔴 / 🟡 from F3.2.
  - verify: build+lint+tsc+tests all clean; new screenshot
  - eval: every flagged finding traced to a concrete diff

- F3.4: review-fix-character — Confirm fixes landed. 2 fresh subagents,
  short re-review.
  - verify: 2 eval files
  - eval: previous findings resolved, no regressions

- F3.5: implement-doors-walls — Refine `Door.tsx` (door panel woodgrain,
  knob detail, lock design, lantern shape) and `Walls.tsx` (baseboard trim,
  top edge cap, gentle pattern via drei Edges). Keep all existing
  collider registrations. Door open/close animation untouched.
  - verify: all build/test gates clean; screenshot of a door close-up
  - eval: door panel reads as crafted; lock indicator more refined; lantern
    outline pops; walls have visible trim

- F3.6: review-doors-walls — 2 fresh subagents.
  - verify: 2 eval files
  - eval: as F3.2

- F3.7: fix-doors-walls — Address findings.
  - verify: as F3.3
  - eval: as F3.3

- F3.8: review-fix-doors-walls — Confirm fixes.
  - verify: as F3.4
  - eval: as F3.4

- F3.9: implement-myroom — Refine `rooms/MyRoom.tsx`. Bed (pink Monet) needs
  better proportions (thicker mattress, pillow indent, blanket fold). White
  desk gets gold trim accents. Bookshelf (use shared part) book color
  variation. Add 1–2 clutter props (folded clothes, framed picture). Add
  accent pink point light to enrich the room. Respect both themes.
  - verify: all gates; screenshot inside My Room (use navigateToRoom('myroom'))
  - eval: every furniture object reads as polished; no equal-thickness slabs

- F3.10: review-myroom — 2 fresh subagents.
  - verify: 2 eval files
  - eval: as F3.2

- F3.11: fix-myroom — Address findings.
  - verify: as F3.3
  - eval: as F3.3

- F3.12: review-fix-myroom — Confirm fixes.
  - verify: as F3.4
  - eval: as F3.4

- F3.13: implement-other-rooms — Refine `rooms/ProductRoom.tsx`,
  `rooms/BookRoom.tsx`, `rooms/IdeaLab.tsx`. Same checklist as MyRoom:
  proportions, accents, clutter, accent lights, shared parts. Each room
  must visually read as a different vibe (Product=tech, Book=cozy library,
  Idea Lab=workshop).
  - verify: all gates; 3 screenshots (one per room)
  - eval: each room visually distinct and refined

- F3.14: review-other-rooms — 2 fresh subagents (one per pair: PR+BR, IL).
  - verify: 2 eval files
  - eval: as F3.2

- F3.15: fix-other-rooms — Address findings.
  - verify: as F3.3
  - eval: as F3.3

- F3.16: review-fix-other-rooms — Confirm fixes.
  - verify: as F3.4
  - eval: as F3.4

- F3.17: implement-ambient — Refine `StarField.tsx` (color variation,
  twinkle phase variation), `Particles.tsx` (gentle drift acceleration),
  `Hallway.tsx` (rug detail, ceiling beam trim, plant accents),
  `HallwayLanterns.tsx` (lantern frame detail, warmer glow, gentle bob).
  - verify: all gates; screenshot of overview
  - eval: ambient layer feels alive but not distracting

- F3.18: review-ambient — 2 fresh subagents.
  - verify: 2 eval files
  - eval: as F3.2

- F3.19: fix-ambient — Address findings.
  - verify: as F3.3
  - eval: as F3.3

- F3.20: review-fix-ambient — Confirm fixes.
  - verify: as F3.4
  - eval: as F3.4

- F3.21: implement-final-polish — Cross-cutting tweaks based on what
  reviewers flagged repeatedly across F3.2/6/10/14/18. Examples: shared
  Edges color constant, light theme color tuning, perf optimization if
  any frame budget overrun was noted.
  - verify: all gates; screenshots of dialogue, my room, product room,
    book room, idea lab, dark and light theme overview
  - eval: any cross-cutting issue addressed

- F3.22: review-final — Final independent gate. 2 fresh designer
  subagents apply the full visual rubric (8 dimensions, weighted). The
  averaged score MUST be ≥ 88 with no 🔴 findings.
  - verify: 2 eval files with full rubric scores
  - eval: weighted average ≥ 88; zero 🔴 findings

- F3.23: ship — Final atomic commit (or final summary commit if previous
  ticks already committed atomically). Push tag `polish-pass-shipped`.
  Update `.harness/progress.md` with summary.
  - verify: `git status` clean; full test+build suite green post-commit
  - eval: ship checklist complete
