# F3.18 Eval — Reviewer B (Hallway + IdeaLab backlog)

Scope: Hallway.tsx ambient polish (ceiling beams, runner rugs, corner plants)
and IdeaLab.tsx backlog cleanup (ambient sparks + ELECTRIC_GREEN retint).

## Backlog cleanup verification

- [x] **IdeaLab ambient sparks shipped** — `src/world3d/scene/rooms/IdeaLab.tsx:34-72`
  declares `SPARK_COUNT=14`, `buildSparkBuffers()` (mulberry32 seeded via
  `makeRng(0x1dea5 ^ SPARK_COUNT)`), module-scope `SPARK_BUF`, `SPARK_DUMMY`,
  and two pre-built scratch `THREE.Color` constants. InstancedMesh declared at
  `IdeaLab.tsx:609-623` (`<instancedMesh>` with `boxGeometry [0.03, 0.03, 0.03]`
  + emissive phong material). useFrame Y drift loop at `IdeaLab.tsx:227-241`
  mutates `SPARK_BUF.by[i]` in place, wraps `SPARK_Y_MAX → SPARK_Y_MIN`, uses
  `SPARK_DUMMY.position.set(...)` + `setMatrixAt`. Zero per-frame alloc
  confirmed. Initial bake + color assignment in `useEffect` at
  `IdeaLab.tsx:245-256` — matches spec exactly.

- [x] **ELECTRIC_GREEN retinted to warm copper** — new constant
  `COPPER_ACCENT = '#c97a2a'` at `IdeaLab.tsx:31`. Heading bar now uses
  `COPPER_ACCENT` at `IdeaLab.tsx:331-334`. Prototype circuit-board top uses
  `COPPER_ACCENT` at `IdeaLab.tsx:405-408`. Note: `ELECTRIC_GREEN` constant
  is still defined (`IdeaLab.tsx:25`) and still used inside `BOARD_LINES`
  (whiteboard text scribbles, `IdeaLab.tsx:105, 108, 111, 115`) and the
  marker tray (`IdeaLab.tsx:344`). Those were NOT flagged by F3.16 — F3.16
  only called out the heading bar (L~256) and circuit-board top (L~330).
  Both flagged sites are fixed. Copper `#c97a2a` harmonizes with the
  `AMBER_BULB='#fbbf24'` room accent (both in warm yellow-orange register).

- [ ] **Pegboard hole literals hoisted** — NOT done. Still inline at
  `IdeaLab.tsx:519-520`:
  ```
  {[-0.6, -0.3, 0.0, 0.3, 0.6].map((dx, i) =>
    [-0.3, 0.0, 0.3].map((dy, j) => (
  ```
  These are child-of-JSX literals that re-allocate on every parent re-render.
  Low-impact because IdeaLab re-renders only on theme flip, not per frame,
  but still 🔵 hygiene. Push back to F3.21 backlog.

- [ ] **BookRoom FRAME_GLOW_AMPLITUDE reduced** — NOT done.
  `src/world3d/scene/rooms/BookRoom.tsx:58-59` still reads `FRAME_GLOW_BASE =
  0.22` / `FRAME_GLOW_AMPLITUDE = 0.18` (~±82% swing — same as flagged).
  Target amplitude was ≤ ±5% (i.e. `BASE=0.35 AMPLITUDE=0.08`). Push back to
  F3.21 backlog.

Summary: 2 of 4 F3.16 backlog items shipped in F3.17. Both shipped items
were the ones explicitly targeted for "F3.17 implement-ambient" in the
backlog notes — the other two were tagged "F3.21 cleanup pass" anyway, so
F3.17 scope is intact.

## Hallway

### Hard-constraint audit

- `flatShading: true` on every material — verified lines 27, 31, 35, 39, 43,
  76, 80, 86, 90, 94, 102, 116, 121, 130, 138, 145, 151, 155, 162, 168.
  CLEAN.
- **useFrame zero-alloc audit** — `Hallway.tsx:60-69`:
  - Line 60: `({ clock }) => { ... }` destructure — OK.
  - Line 63: `const t = clock.getElapsedTime()` — scalar, OK.
  - Line 64: `g.children.forEach((child, i) => { ... })` — the `forEach`
    callback is a closure created every frame. **Not a THREE allocation**,
    but it is a function-object allocation per frame (~3 cb alloc/frame).
    Minor 🔵. Swap to a `for (let i=0; i<g.children.length; i++)` loop for
    exact zero-alloc.
  - Line 65: `child.position.y = ...` — mutation only, OK.
  - Line 66: `const mat = (child as THREE.Mesh).material as
    THREE.MeshPhongMaterial` — property read + cast, no alloc.
  - Line 67: `mat.opacity = ...` — scalar mutation on per-mesh material
    (each steam cube got its own material from JSX), OK.
  - No `new THREE.*`, no array literal, no object literal. PASS with one
    minor 🔵 on forEach closure.
- Derived arrays/constants in `useMemo` or module scope — `BEAM_Z`, `BEAM_X`,
  `STEAM_OFFSETS` all module scope. CLEAN.
- mulberry32 — Hallway doesn't need randomness. N/A, no `Math.random`.
- InstancedMesh — Hallway doesn't use one; only 9 beams + 4 plants + 2
  runners. At this count, one draw call per mesh is fine (~20 new draw
  calls, well under 30% budget growth).
- Scope — only Hallway.tsx touched within this review's files; edge color
  imports `useWorldStore` (permitted). Frozen constants untouched. CLEAN.

### Rubric

| Dim | Score | Notes |
|---|---|---|
| Material variation | 82 | Beams use single `#3a2510`, center hub `#241608` — 2 tones only. Plants have 3 green shades (`#22c55e`/`#16a34a`/`#15803d`) + terracotta pot = decent. Runner rugs are monotonal `#6b3216`. Could benefit from per-beam hue jitter. |
| Edge / silhouette pop | 90 | Beams, runners all have theme-aware `<Edges>` at lineWidth 1. Plants don't — but they're sphere/cone so edges would look odd anyway. Good call. |
| Proportions | 86 | Beams `[HALL_WIDTH+0.1, 0.1, 0.12]` — 0.1 thick reads as trim not blocks. Runner `0.55 × 3.0` feels right. Plants 0.25 pot + 0.22 foliage sphere — chibi-correct. Ceiling beam y=2.92 sits right under the 3.0 ceiling cap. Clean. |
| Micro-animations | 75 | Steam bob still the only Hallway anim. No beam dust-mote drift, no plant sway, no runner ripple. Spec didn't demand more, but F3.12 designer asked for "≥3 idle loops per room" as cross-cutting goal. Hallway has 1. |
| Color harmony | 88 | Brown beams + brown runners + green plants + amber ceiling strips = consistent warm workshop register. Runner emissive `#d97034` at 0.05 is subtle and ties to copper room accents. Good. |
| Clutter / props | 84 | Plants 2→4, runner rugs 0→2, beam system added. Still feels sparse near the east/west endpoints of the cross. Could use a wall sconce or bench. |
| Character refinement | N/A | — |
| Performance feel | 88 | +9 beams + 1 hub + 2 runners + 2 plants ≈ +40 tris / +15 draw calls. Well under budget. One forEach closure alloc/frame is a -2 deduction. |

**Avg (excl. N/A): (82 + 90 + 86 + 75 + 88 + 84 + 88) / 7 = 84.71**

### Findings

- 🔵 `Hallway.tsx:64` forEach callback allocates one closure/frame. Swap to
  a `for` loop with index access (`g.children[i]`) for true zero-alloc.
- 🔵 Beams use single `#3a2510` color — add mulberry-seeded per-beam L
  jitter (±8%) for material variation pop in the F3.21 polish pass.
- 🔵 Runner rugs have `<Edges>` but no pattern stripes — consider a second
  thinner interior mesh with contrasting stripe color for rug detail.
- 🟡 Ceiling beams at y=2.92 with 0.1 height — if the ceiling cap is at
  3.0, that leaves 0.08 air gap (`2.92 + 0.05 = 2.97`). Hard to tell
  without reading `Walls.tsx` ceiling position. Visually it should read as
  flush-mounted trim. Verify in next screenshot.
- 🔵 Micro-anim count low (1 idle loop). Not a blocker for F3.18 scope but
  ties into F3.21 cross-cutting goal from F3.12.

## IdeaLab (post-backlog-cleanup)

### Hard-constraint audit

- `flatShading: true` — verified on all 70+ materials in the file (spot-
  checked lines 272, 277, 311, 321, 327, 333, 358, 364, 370, 407, 418, 423,
  428, 442, 463, 468, 478, 485, 504, 515, 523, 531, 544, 552, 566, 572,
  595, 600, 615-622). CLEAN.
- **useFrame zero-alloc audit** — `IdeaLab.tsx:176-242`, 66 lines walked
  line-by-line:
  - All scalar math (`Math.sin`, `Math.cos`).
  - All writes are `ref.current.foo = scalar` or `mat.emissiveIntensity =`.
  - Spark loop (229-239) is a `for (let i=0; ...)` with in-place
    `SPARK_BUF.by[i] = y` mutation. `SPARK_DUMMY.position.set(...)` reuses
    a module-scope `Object3D`. `setMatrixAt` reuses the existing matrix
    slot. No `new`, no `{}`, no `[]`, no lambda created per iteration.
  - Prototype `proto.userData.baseX/baseZ` are set once in `onUpdate` at
    `IdeaLab.tsx:394-397` — not re-allocated per frame.
  - PASS, truly zero-alloc.
- Derived arrays in `useMemo` — `sketches` memoized at `IdeaLab.tsx:149-162`.
  `BOARD_LINES`, `BENCH_LEGS`, `PEG_TOOLS`, `PLANK_STRIPES`, `SPARK_BUF` all
  module scope. Pegboard hole literals at `IdeaLab.tsx:519-520` are the one
  exception (flagged above).
- mulberry32 — used for sketches (`makeRng(0x1dea5c)`) and sparks
  (`makeRng(0x1dea5 ^ SPARK_COUNT)`). No `Math.random`. CLEAN.
- InstancedMesh — sparks use `<instancedMesh ref={sparksRef}
  args={[undefined, undefined, SPARK_COUNT]}>` at `IdeaLab.tsx:609`.
  Correct scratch reuse. CLEAN.
- IDEA_BOARD interactable wired — verified at `IdeaLab.tsx:314-318` via
  `onUpdate={(m) => { m.userData.interactable = IDEA_BOARD_INTERACTABLE; }}`.
  CLEAN.
- Scope — only IdeaLab.tsx touched (other rooms untouched in this commit).
  Frozen constants untouched. `rooms.ts` untouched (last modified commit
  predates F3.0). CLEAN.

### Rubric

| Dim | Score | Notes |
|---|---|---|
| Material variation | 90 | Wood in 4 tones (DEEP/MID/LIGHT/PLANK), metal in 3 (DARK/MID/LIGHT), copper/amber/orange/green/pink/blue accents. Bench, pegboard, sketches, jar, tape roll, rolls of paper, cork — every surface pair reads as a different material. |
| Edge / silhouette pop | 92 | Theme-aware `<Edges>` on 20+ hero silhouettes: workbench top, legs, board, prototype, vise, gears, tools, jar, tape, pencil cup, stool, pegboard, cork, tool hangers, blueprints. Excellent coverage. |
| Proportions | 88 | Workbench 2.6×0.14×0.95 (not a slab — has 0.06 trim band beneath + 0.6 leg), pegboard 1.8×1.0, prototype 0.3×0.18×0.22. Good chunk/slim contrast. Sparks 0.03³ are tiny — reads correctly as dust. |
| Micro-animations | 93 | 8 independent loops: bulb bob+pulse, bulb point light pulse, 3 gears counter-rotating, prototype vibrate, hanging tool swing, solder tip pulse, accent light breathe, **NEW ambient spark drift**. Way above the "≥3 idle loops" target. |
| Color harmony | 90 | Copper retint of heading bar + circuit top brings both flagged elements into the amber/copper/gold axis with `AMBER_BULB #fbbf24`. Whiteboard lines still use ELECTRIC_GREEN on BOARD_LINES (3 instances) — this is a minor residual since the scribbles are small and sit against cream paper, they read as accent marker strokes not walls-of-green. Acceptable. |
| Clutter / props | 96 | Paper sketches ×6, bench vise, prototype, 3 gears, soldering iron, wrench, hammer head+handle, parts jar, tape roll, pencil cup + 3 pencils, 2 blueprint rolls, 7 pegboard tools, hanging tool, cork board + 3 pinned sketches, stool with 4 legs, bulb, oil stains, plank bands, spark cloud. Dense workshop. |
| Character refinement | N/A | — |
| Performance feel | 92 | Spark layer is 1 draw call for 14 cubes (InstancedMesh). Total IdeaLab draw call growth estimated ~0 vs previous (sparks add 1, already dense). useFrame is truly zero-alloc. |

**Avg (excl. N/A): (90 + 92 + 88 + 93 + 90 + 96 + 92) / 7 = 91.57**

### Findings

- 🔵 `ELECTRIC_GREEN` still used on `BOARD_LINES` (`IdeaLab.tsx:105, 108,
  111, 115`) and marker tray (`IdeaLab.tsx:344`). F3.16 did not flag
  these sites — only the heading bar and circuit top — so this is
  out-of-scope for the backlog cleanup, but the room palette would
  harmonize even better if 1-2 of the BOARD_LINES were recolored to copper
  or amber.
- 🔵 Spark seed `0x1dea5 ^ SPARK_COUNT` is a fun mnemonic but the comment
  at `IdeaLab.tsx:48-49` explains it — fine.
- 🔵 `SPARK_BUF.isOrange` typed `Uint8Array` and used for initial color
  bake only. Color is baked once in useEffect, never updated per frame.
  Zero-alloc. Good.
- 🔵 Spark drift is Y-only — spec said "Y drift", so this matches. If
  F3.21 wants a touch more life, tiny X sway via `Math.sin(t + phase[i])`
  would still be zero-alloc.
- 🔵 Pegboard hole literals at `IdeaLab.tsx:519-520` still inline (carried
  over from F3.16).

## Combined verdict

- **Hallway avg: 84.71 / 100**
- **IdeaLab avg: 91.57 / 100**
- **Aggregated avg: (84.71 + 91.57) / 2 = 88.14 / 100**
- **Ship gate:**
  - avg ≥ 88 — **CLEAR** (88.14)
  - no 🔴 — **CLEAR** (only 🟡/🔵)
  - no dim < 70% — **CLEAR** (min is Hallway Micro-animations at 75)
- **PASS / ITERATE / FAIL: PASS** (borderline — aggregated avg sits 0.14
  above the ship-gate, driven entirely by IdeaLab's strong 91.57).

**One-sentence rationale:** IdeaLab is a polished, dense workshop with
all F3.16 backlog items targeted at F3.17 shipped and a truly zero-alloc
useFrame; Hallway is clean but thin on micro-animations and material
variation — passes the gate on IdeaLab's back, but F3.19 should ideally
nudge Hallway above 88 before F3.21.
