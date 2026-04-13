# F3.14 Eval — Reviewer B (IdeaLab)

Angle: deep-dive on `src/world3d/scene/rooms/IdeaLab.tsx` post-F3.13 (commit
`2d34b4c`). Independent of Reviewer A. Focus: hard-constraint audit on the
largest and most animated of the three new rooms, plus rubric + vibe-brief
coverage.

## Hard-constraint audit

- **[PASS] flatShading on all materials.** `IdeaLab.tsx` declares 57 material
  tags (`meshPhongMaterial`) and 57 `flatShading` props — perfect parity. No
  `meshBasicMaterial` / `meshStandardMaterial` / `meshLambertMaterial` /
  `meshToonMaterial` anywhere; every material is Phong (which honours
  `flatShading`). Evidence: grep counts in `IdeaLab.tsx` (57/57).

- **[PASS] Zero per-frame allocation in useFrame** (`IdeaLab.tsx:130-178`).
  Line-by-line walk of the whole body:
  - `:131` `const t = clock.getElapsedTime()` — scalar read.
  - `:134` `const bulb = bulbRef.current` — ref deref, no alloc.
  - `:135` `const yOffset = Math.sin(t * BULB_FLOAT_SPEED) * BULB_FLOAT_AMPLITUDE`
    — scalar math on module-scope constants.
  - `:137` `bulb.position.y = 2.5 + yOffset` — scalar write on existing Vector3.
  - `:138` `const mat = bulb.material as THREE.MeshPhongMaterial` — TS cast,
    compiles to a bare read, no allocation.
  - `:139` `mat.emissiveIntensity = BULB_PULSE_BASE + Math.sin(...) * BULB_PULSE_AMPLITUDE`
    — scalar assignment.
  - `:141-145` `bulbLight` ref: scalar writes to `position.y` and
    `intensity`, no alloc.
  - `:148-153` three gear refs (`gA`, `gB`, `gC`), each a single
    `rotation.z = t * SPEED` scalar write.
  - `:156-160` prototype ref: reads `proto.userData.baseX` / `.baseZ` (set
    once in `onUpdate` at mount), then `proto.position.x = ... + Math.sin(...)`
    and `position.z = ... + Math.cos(...)` — scalar writes on existing Vector3.
  - `:163-166` hanging-tool group: single `rotation.z = Math.sin(...) * amp`
    scalar write.
  - `:169-173` solder tip ref: cast-read material, scalar `emissiveIntensity`
    write.
  - `:176-177` `accentLightRef`: scalar `intensity` write.

  No `new THREE.Vector3()`, no `.clone()`, no array/object literals, no
  closures created per frame, no string interpolation, no `.map()`. All state
  lives in pre-existing refs mutated in place. **Confirmed zero-alloc.**

- **[PASS] Derived arrays in useMemo or module scope.** `sketches` is
  generated inside `useMemo(..., [])` at `IdeaLab.tsx:104-117`. All other
  reused arrays (`BOARD_LINES`, `BENCH_LEGS`, `PEG_TOOLS`, `PLANK_STRIPES`)
  are **module-scope** `ReadonlyArray` constants (`:59-93`), which is
  stricter than `useMemo`. Minor style note: the pegboard-hole double-map at
  `:441-448` builds `[-0.6, -0.3, 0, 0.3, 0.6]` and `[-0.3, 0, 0.3]` as
  inline literals on each render. It is not inside `useFrame` so it does not
  violate the hard constraint, but it is sloppier than the `CLOTHES_STACK`
  module-constant pattern MyRoom uses. Not a failure — flagged as polish
  candidate in F3.15.

- **[PASS] mulberry32 only — no `Math.random`.** Grep for `Math\.random` in
  `IdeaLab.tsx` returns zero matches. `sketches` uses `makeRng(0x1dea5c)`
  from `../../util/rand` (`:9, :105`). Deterministic.

- **[PASS] `IDEA_BOARD` interactable preserved.**
  `IdeaLab.tsx:12`
  `const IDEA_BOARD_INTERACTABLE: InteractableData = IDEA_LAB_CONTENT.dialogues.ideaBoard;`
  wired to a mesh at `IdeaLab.tsx:236-245`:
  ```tsx
  <mesh position={[ox, 1.25, oz - 2.03]} onUpdate={(m) => {
    m.userData.interactable = IDEA_BOARD_INTERACTABLE;
  }}>
  ```
  Position matches the front-face of the whiteboard, so HUD proximity
  prompt will trigger in the same zone as pre-F3.13. Body sourced from
  `src/data/ideaLab.ts:41-44` unchanged. **Verified.**

- **[PASS] Scope clean.** `git show --stat 2d34b4c` touched only
  `src/world3d/scene/rooms/{BookRoom,IdeaLab,ProductRoom}.tsx`. No edits to
  `data/rooms.ts`, `constants.ts`, `colliders.ts`, store, HUD, or anything
  outside `src/world3d/scene/`.

- **[PASS] Frozen constants untouched.** `git show 2d34b4c -- src/world3d/constants.ts`
  produces empty output — zero diff. FOLLOW / CAMERA / FP / INTRO / ROOM /
  GAP / DOOR untouched.

## Rubric

| Dimension | Score | Weight | Weighted | Justification |
|---|---|---|---|---|
| Material variation | 88 | 15 | 13.20 | Clean four-tier wood palette (DEEP/MID/LIGHT/PLANK) + three-tier metal (DARK/MID/LIGHT) + accent amber, orange, electric-green. Wood and metal differentiate well via colour alone (no roughness channel — all Phong). Missing: specular / shininess tuning between wood-matte and metal — everything is same Phong default, so wood and metal read as "slightly different browns" rather than "matte vs polished". Notable: screws jar uses `transparent opacity={0.5}` (L385) — only translucent element in the room, nice touch. |
| Edge / silhouette pop | 86 | 15 | 12.90 | `Edges` applied to every hero object: workbench top, bench legs, prototype, vise, gears A+B (C missing edges at L348-351 — deliberate for small sub-gear?), jar, tape roll, pencil cup, blueprint roll, pegboard, all peg-tools, cork board, stool seat, whiteboard, board-frame, marker tray, sketches on floor. Theme-aware `edgeColor` (`dark→#0a0a14`, `light→#5a4830`) at L101 — correct theming. Small misses: BOARD_LINES marker strokes, LED, bulb, hanging-tool rope, circuit board, oil stains, pegboard holes have no edges — consistent with "only silhouette elements get outlines" convention, fine. |
| Proportions | 85 | 15 | 12.75 | Workbench 2.6 × 0.14 × 0.95 top with 0.12-square legs — chunky, grounded, correct. Prototype 0.3 × 0.18 × 0.22 sits naturally on bench at hand height. Whiteboard 2.6 × 1.7 balances the room. Pegboard 1.8 × 1.0 on back wall — readable size. Stool 0.35² seat with 0.04² legs is borderline twiggy for chibi voxel (MyRoom bed legs are 0.08² for a reference) — the legs disappear visually. Floating idea bulb 0.14 radius sphere reads as a small hanging bulb from the screenshot — correct. Marker cylinders at 0.018 radius are very thin — fine for markers, but at chibi distance they barely register as objects. Minor proportion issue: the hanging-tool group at L459-469 places the string at `y = -0.2` and the wrench at `y = -0.45` relative to the group origin — that puts the string midpoint at +0.3 below the anchor, plausible. |
| Micro-animations | 94 | 15 | 14.10 | **Six independent drivers** — the most of any room: floating bulb bob + emissive pulse (two linked channels), prototype XY vibration, hanging-tool swing, solder tip emissive pulse, accent light breath, and three counter-rotating gears. All drivers use sin/cos on pre-existing refs with module-scope constants. The gear counter-rotation (1.4 / -1.9 / 2.3 rad/s) is visually legible and mechanically plausible. Prototype vibration amplitude 0.008 m is subtle enough to feel alive without distracting. Gain: accent light 0.75 ± 0.15 at 1.3 Hz is slightly faster than MyRoom's 0.6 Hz — appropriate (workshop is more frenetic than bedroom). Lose: there's no sticky-note flutter or beaker oscillation from the brief (see vibe-brief section), and the soldering-iron tip pulse amplitude 0.7 is very large (base 1.6, so it swings 0.9 → 2.3) which may cause overbloom — hard to judge from one screenshot. |
| Color harmony | 80 | 10 | 8.00 | Dominant palette reads as cohesive wood-and-metal workshop in the screenshot. Amber bulb + amber accent light pool gold warmth in the centre. BUT: the palette file still mixes `ELECTRIC_GREEN`, `ORANGE_SPARK`, pink (`#fb7185`), and blue (`#60a5fa`) across board markers, circuit board, pencils, LED. On camera these are small and read as "rainbow-tinted post-its", but the room's nominal `accentColor` in `data/rooms.ts` is **gold** `#fbbf24` — the electric-green circuit-board top at L329 and the electric-green heading bar at L255 actively compete with the gold identity. Screenshot shows gold bulb dominating, so visually it lands, but the palette identity is slightly confused. |
| Clutter / props | 96 | 10 | 9.60 | **Massively clutter-rich.** Workbench carries: prototype (with circuit-board top + LED), 3 gears, soldering iron (body + handle + tip), wrench, hammer (head + handle), screw jar (3-mesh composite), tape roll, pencil cup (body + 3 pencils). Under the bench: 2 rolled blueprints. Wall: pegboard with 7 tools, hanging swinging wrench, cork board with 3 pinned sketches. On floor: 6 deterministic scattered sketches, 2 oil stains. Hero: floating bulb with screw base. Stool beside bench. Vise. Cross-brace. Every surface inhabited without feeling staged. This is well above the "1–2 clutter props per room" floor. |
| Character refinement | 100 | 10 | 10.00 | N/A (room). |
| Performance feel | 72 | 10 | 7.20 | **The risk dimension.** Mesh count estimate: 151 runtime meshes from IdeaLab alone (57 material tags, ~43 wrapped in map-producers that expand: PLANK_STRIPES 5, sketches 6, BOARD_LINES 11, BENCH_LEGS 4, PEG_TOOLS 7, pegboard holes 15). Every outlined mesh adds an `Edges` line-geometry draw call on top of the mesh. That means IdeaLab alone likely consumes ~200+ draw calls. The scene-wide pre-F3 baseline was ~80 draw calls; the budget is +30% = ~104. With MyRoom (~66 literals), ProductRoom (102), BookRoom (94) all now inflated, the scene is likely **well over the +30% draw-call budget** — this is an ecosystem-level concern, not IdeaLab-specific, but IdeaLab is the largest contributor. Mitigating: all geometry uses low segment counts (max 10 on cylinders/sphere), box meshes dominate. Triangle count probably stays under the +50% tri budget, but draw calls are the squeeze point. Dropped below 70 threshold would trigger 🟡, but 72 is just above — flagged not blocking. |

**Weighted average:** 13.20 + 12.90 + 12.75 + 14.10 + 8.00 + 9.60 + 10.00 + 7.20 = **87.75 / 100**

**Ship gate:** NOT CLEAR — the weighted average rounds to 87.8, below the
≥ 88 requirement by 0.25 points. Failing dimension: performance feel at 72
(above the <70% auto-iterate line, but the smallest dimension score).

## F3.13 checklist verification

Comparing against F3.13 vibe brief spec:

- **[✓] Workshop vibe visible in screenshot.** Wood-plank floor, exposed
  workbench, tools, pegboard — reads immediately as "inventor's workshop".
  Gold bulb gives warmth.
- **[✓/PARTIAL] Whiteboard/corkboard wall with sticky-note cubes.**
  Whiteboard `IdeaLab.tsx:231-275` ✓. Side cork board
  `IdeaLab.tsx:472-489` ✓. **But the "sticky-note cubes" element is
  missing** — the cork board has 3 flat pinned sketches (thin `0.005`
  boxes), not cube-like volumetric notes that could flutter. The whiteboard
  has marker-stroke bars (`BOARD_LINES`), not sticky notes either.
- **[✓/PARTIAL] Work table with tools, beakers, a model.** Workbench ✓,
  tools ✓ (8+ distinct tools), model (prototype) ✓. **Beakers missing** —
  replaced by screw jar + soldering iron + gears. The brief asked for lab
  glassware; the implementer went maker-shop instead. Semantic substitution,
  not a literal match.
- **[✓] Gold accent pointLight.** `IdeaLab.tsx:527-533`
  `color={AMBER_BULB}` where `AMBER_BULB = '#fbbf24'` (L27) — exact match
  with `data/rooms.ts` idealab `accentColor`. Positioned at workbench top.
- **[✗] Sparks / dust particles.** **Not implemented.** No `Points`, no
  `sprite`, no floating spark mesh. The room has zero ambient particle
  layer. This was an explicit F3.13 brief item for IdeaLab.
- **[✗] Sticky-note flutter.** Not implemented (no sticky-notes exist to
  flutter).
- **[✗] Beaker oscillation.** Not implemented (no beakers exist).
- **[✓] Gold accent light breath.** `IdeaLab.tsx:176-177`
  `al.intensity = ACCENT_LIGHT_BASE + Math.sin(t * ACCENT_LIGHT_SPEED) * ACCENT_LIGHT_AMPLITUDE`
  — base 0.75, amplitude 0.15, speed 1.3 Hz. Works.

**Summary:** 4 ✓, 2 ✗, 2 partial. The implementer delivered an *equivalent
workshop vibe* with substitute props (soldering iron for beaker, marker
strokes + scattered paper for sticky notes) and substitute animations
(prototype vibration, gear rotation, hanging-tool swing, solder-tip pulse
for sticky-flutter + beaker-oscillation). The core miss is **no ambient
particle layer** — no sparks, no dust. That is 1 of 8 vibe items unmet
with no substitute.

## Performance check

- **Estimated mesh count in IdeaLab:** ~151 meshes. Breakdown:
  - Static literals: ~67 non-map meshes
  - PLANK_STRIPES: 5
  - Sketches: 6
  - BOARD_LINES: 11
  - BENCH_LEGS: 4
  - PEG_TOOLS: 7
  - Pegboard holes: 15 (double-map)
  - Plus hanging-tool group (2 children) + embedded pencil/marker cylinders
- **Estimated Edges count:** ~30 outlined meshes × 1 Edges draw call each =
  ~30 additional draw calls from outlines alone.
- **High-segment geometry:** **None flagged.** Max cylinder segments = 10
  (screws jar, tape roll at L384, L399); max sphere = 10 × 10 = 200 tris on
  the bulb (L516). All other cylinders are 6–8 segments. Triangle count
  growth is safe.
- **Budget fit:**
  - Triangle budget (+50% of ~5k baseline = 7.5k): **fits with margin.**
    Estimated IdeaLab tri contribution ~2.5–3k; across all 4 rooms the
    scene is likely in the 7–8k range. Borderline but not clearly over.
  - Draw-call budget (+30% of ~80 baseline = 104): **at risk / likely
    over.** IdeaLab alone contributes ~180–200 draw calls (meshes + edges).
    This is an ecosystem-level overrun, not isolated to IdeaLab.
- **Verdict:** triangles OK, **draw calls at risk** — recommend F3.17/F3.21
  introduce mesh-merging or `<Instances>` for the pegboard holes, plank
  stripes, and BOARD_LINES.

## Findings

### 🔴 Critical
- (none) — no hard-constraint violation, no regression, no blocking bug.

### 🟡 Iterate
- **No ambient particle layer** — F3.13 vibe brief called for sparks/dust
  particles in IdeaLab. None shipped. Add a small `Points` field or a
  handful of deterministic mulberry32-placed `boxGeometry` dust motes with
  scalar-only drift animation. Approx 20-40 LOC. (`IdeaLab.tsx:188`
  insertion point near the other group children.)
- **Draw-call budget at risk** (performance feel 72/100) — ecosystem-level
  concern across all three F3.13 rooms. Strongly recommend consolidating
  the pegboard-hole grid (15 meshes) into a single textured plane or an
  Instanced mesh; same for BOARD_LINES (11 meshes) and PLANK_STRIPES (5).
  Would cut ~25 draw calls from IdeaLab alone. Flag for F3.17 or F3.21
  cross-cutting optimization rather than F3.15 (this is a pattern, not an
  IdeaLab bug).
- **Palette identity drift from gold** (color harmony 80/100) — the
  nominal room accent in `data/rooms.ts:22` is gold `#fbbf24`, but board
  decoration uses `ELECTRIC_GREEN` for the heading bar (L254-256) and
  circuit-board (L328-330). On camera the gold bulb dominates so it reads
  fine, but the palette *code* is inconsistent with the room identity.
  Suggested F3.15 tweak: recolour the whiteboard heading bar to
  `AMBER_BULB` and the circuit board to `#7a7a3a` (dark olive) to reduce
  electric-green's share.
- **Pegboard-hole array literals not hoisted to module scope**
  (`IdeaLab.tsx:441-442`) — render-time alloc of `[-0.6, -0.3, 0, 0.3, 0.6]`
  and `[-0.3, 0, 0.3]` on every parent re-render. Not a hard violation
  (useFrame is clean), but MyRoom's `CLOTHES_STACK` / `BED_LEGS` pattern
  is stricter and should be applied here. 5 LOC fix.

### 🔵 LGTM
- **useFrame is completely allocation-free** across 6 animation drivers
  with ~20 scalar operations. The module-scope constants (L33-48) and
  `userData.baseX/.baseZ` pattern on the prototype at `:316-319` is a
  clean way to avoid capturing `benchX/benchZ` in the useFrame closure via
  any kind of object. Well done.
- **Interactable preservation is clean** — single mesh, single `onUpdate`,
  content sourced from `src/data/ideaLab.ts` via
  `IDEA_LAB_CONTENT.dialogues.ideaBoard`. No regression risk for the HUD
  proximity prompt.
- **Theme-aware edge color** at `:101` respects both dark and light
  themes — matches the F3 brief requirement.
- **Clutter density is the best in the project.** Workbench tells an
  inventor story: half-built prototype, gears mid-turn, soldering iron
  still hot (pulsing tip), tools scattered, screws-jar ready. The scene
  narrates.
- **Zero `Math.random`, mulberry32 everywhere** (seed `0x1dea5c` — love
  the IDEA leet-spelling).
- **Six independent micro-animation drivers** — counter-rotating gears,
  bulb bob + pulse, prototype vibration, hanging-tool swing, solder pulse,
  accent-light breath. Most animated room in the scene.
- **All materials `flatShading: true`** — 57/57, voxel-art consistency
  preserved.

## Verdict

**ITERATE** — 0.25 points below the ship gate (87.75 vs 88.00). No
🔴 criticals, no regressions, every hard constraint passes cleanly, the
useFrame audit is the best in the project. The gap is small and concentrated
in two areas:

1. **Missing ambient particle layer** (sparks/dust from F3.13 brief) — this
   is a concrete 🟡 to fix in F3.15, should recover ~2 points on
   micro-animations + color harmony once the particles add golden sparkle.
2. **Draw-call budget stress** — cross-cutting concern that belongs in
   F3.17/F3.21 mesh-merging pass, not F3.15. Not a reason to block this
   room individually.

If F3.15 adds the particle layer + hoists the pegboard-hole literals +
re-tints the heading bar/circuit board to gold-family, IdeaLab should clear
88+ easily on the next review cycle.

**One-sentence rationale:** IdeaLab is the most technically clean and
animation-rich room in F3.13 but misses 0.25 points on the ship gate due to
an unshipped ambient particle layer plus an at-risk draw-call budget.
