# F3.20 Eval — Reviewer B (ambient rubric re-score)

Scope: 5 ambient files after F3.19 (`28363f0`):
`StarField.tsx`, `Particles.tsx`, `HallwayLanterns.tsx`, `Hallway.tsx`, `rooms/IdeaLab.tsx`.

## Hard-constraint audit (all 5 files)

- **PASS — flatShading on every meshPhong/Standard/Toon material**
  - StarField.tsx — material is `pointsMaterial` only (lines 106–114), N/A.
  - Particles.tsx — 1 `meshPhongMaterial` at line 129, `flatShading` line 134.
  - HallwayLanterns.tsx — 13 `meshPhongMaterial` declarations at lines 53, 58, 62, 68, 73, 84, 91, 97, 103. Every one ends with `flatShading`.
  - Hallway.tsx — 18 `meshPhongMaterial` declarations (lines 27, 30, 34, 38, 42, 76, 80, 86, 90, 94, 102, 116, 121, 130, 138, 145, 151, 155, 162, 167). Every one carries `flatShading`. (F3.19 dropped emissive props but kept `flatShading` intact on each — verified by reading lines 76, 80, 116, 121, 151, 155.)
  - IdeaLab.tsx — well over 60 `meshPhongMaterial` declarations including the two new spark buckets at lines 658 and 673. Both spark materials carry `flatShading` (lines 664, 680). Sampling: lines 315, 320, 326, 343, 354, 364, 370, 376, 381, 401, 407, 413, 425, 444, 450, 461, 471, 481, 491, 500, 506, 511, 515, 520, 528, 533, 547, 552, 558, 566, 574, 583, 587, 595, 601, 605, 615, 620, 638, 643, 664, 680 — all `flatShading`. **PASS.**

- **PASS — Zero useFrame allocation StarField** (lines 74–99)
  - Reads two refs, scalar `t = clock.getElapsedTime()`, branches on theme.
  - Inside loop: `arr[i3+k] = srcColors[i3+k] * op` writes into the existing typed array referenced by `colorAttrRef.current.array`. Only scalar locals (`shimmer`, `op`, `i3`).
  - No `new`, no object literal, no array literal. **PASS.**

- **PASS — Zero useFrame allocation Particles** (lines 90–120)
  - Loop body: scalar arithmetic on `BUF.*` typed arrays, `DUMMY.position.set(x,y,z)`, `DUMMY.scale.setScalar(...)`, `DUMMY.updateMatrix()`, `mesh.setMatrixAt(i, DUMMY.matrix)`.
  - `DUMMY` and `TMP_COLOR` declared at module scope (lines 68–69). `RESET_RNG` is a closure created at module scope (line 65) — its invocation is just a function call, no allocation.
  - No `new` inside. **PASS.**

- **PASS — Zero useFrame allocation HallwayLanterns** (lines 30–37)
  - One scalar `t`, then a four-iteration loop that writes `g.position.y = Math.sin(...) * BOB_AMP` on each Group ref.
  - No object construction. **PASS.**

- **PASS — Zero useFrame allocation Hallway (post-F3.19)** (lines 60–69)
  - Walks `steamRef.current.children`, mutates `child.position.y` and `mat.opacity` on the existing material.
  - The `forEach` callback closes over `t`/`STEAM_OFFSETS` — no allocations inside (forEach itself doesn't allocate per call beyond the iterator).
  - F3.19 only touched JSX bodies (de-emissive) — useFrame body untouched and clean. **PASS.**

- **PASS — Zero useFrame allocation IdeaLab sparks (2-bucket post-F3.19)** (lines 199–277)
  - All refs read into locals, scalar `t = clock.getElapsedTime()`.
  - Bulb block (203–214): scalar position writes + `mat.emissiveIntensity` mutation. No new.
  - Gears (217–222): `gA.rotation.z = t * GEAR_SPEED_A` etc. Scalar.
  - Prototype (225–229): writes `proto.position.x/.z` from `userData.baseX/baseZ` + scalar trig. No new.
  - Hanging tool (232–235), solder tip (238–242), accent light (245–246): all scalar mutations.
  - **Spark loop orange (251–263):** reads/writes `SPARK_ORANGE.by[i]`, calls `SPARK_DUMMY.position.set(...)`, `SPARK_DUMMY.updateMatrix()`, `smO.setMatrixAt(i, SPARK_DUMMY.matrix)`. `SPARK_DUMMY` is module-scope (line 95). No `new`.
  - **Spark loop warm (264–276):** identical pattern, same single `SPARK_DUMMY` reused across both passes. **PASS.**

- **PASS — InstancedMesh scratch reused module-scope**
  - Particles.tsx `DUMMY` + `TMP_COLOR` at lines 68–69.
  - IdeaLab.tsx `SPARK_DUMMY` at line 95 — single Object3D shared across both spark buckets (orange loop reuses it after the warm loop overwrites it; safe because each loop iteration immediately consumes the matrix via `setMatrixAt`).
  - **PASS.**

- **PASS — Derived arrays/geometry in useMemo**
  - StarField geometry at line 55 (`useMemo`). Star buffers built in module-scope `buildStarBuffers()` at line 47.
  - Particles `BUF` built in module-scope `buildBuffers()` at line 63 (constant data — module scope is even stricter than useMemo).
  - IdeaLab `sketches` at line 171 (`useMemo`). Spark buckets built in module-scope `buildSparkBuckets()` at line 88.
  - **PASS.**

- **PASS — mulberry32 used (no Math.random)**
  - StarField line 26 `makeRng(0xa11ce)`.
  - Particles line 33 `makeRng(0xb0b)` + line 65 `makeRng(0xfeed)` for reset.
  - IdeaLab line 51 `makeRng(0x1dea5 ^ SPARK_COUNT)` + line 172 `makeRng(0x1dea5c)`.
  - HallwayLanterns and Hallway have no procedural scatter — N/A.
  - Grep for `Math.random` in the 5 files: zero hits. **PASS.**

- **PASS — Interactables preserved**
  - IdeaLab IDEA_BOARD_INTERACTABLE wired at line 360 via `m.userData.interactable = IDEA_BOARD_INTERACTABLE` on the whiteboard mesh (line 357). F3.19 diff did not touch this region.
  - BLOG (BookRoom), PROBLEM_SOLVER (ProductRoom), MENTOR_TABLE (MyRoom) live in their own room files which F3.19 did NOT touch. Out of ambient-file scope but verified untouched via `git show 28363f0 --stat` — only `Hallway.tsx` + `IdeaLab.tsx` modified.
  - **PASS.**

- **PASS — Scope clean + frozen blocks untouched**
  - `git show 28363f0 --stat`: `src/world3d/scene/Hallway.tsx` (18 lines) + `src/world3d/scene/rooms/IdeaLab.tsx` (170 lines). Two files only, both inside `src/world3d/scene/`.
  - `data/rooms.ts` last touched at `8017b89` (pre-F3 series) — untouched.
  - `constants.ts` last touched at `9a1894c` (F3.7, additive `DOOR_POLISH` + `WALL_POLISH` blocks). FOLLOW/CAMERA/FP/INTRO/ROOM/GAP/DOOR frozen blocks verified intact (lines 1–83). **PASS.**

## Aggregated rubric

| Dim | Score | Weight | Weighted | Justification |
|---|---|---|---|---|
| Material variation | 86 | 15 | 12.90 | StarField 4-color palette + per-star baseOpacity + phase. Particles still 5-color saturated palette (NOT trimmed). Lanterns: wood + iron + glow + chain layers. Hallway beams use a single dark wood `#3a2510` (still flagged in F3.18 #3 — unchanged). IdeaLab now genuinely splits sparks orange vs warm-white at the material level — that's a meaningful jump from F3.18. |
| Edge / silhouette pop | 88 | 15 | 13.20 | Hallway: Edges on runner rugs + every ceiling beam (theme-aware `edgeColor`). HallwayLanterns: 4-corner-post frame creates strong silhouette but **no drei `<Edges>` on lantern body or top cap** — minor missed opportunity. IdeaLab: dense Edges coverage on every bench leg, board, jar, vise, gear, plank, sketch. Particles + StarField: N/A (pixel/cube primitives). |
| Proportions | 90 | 15 | 13.50 | Lanterns full anatomy: chain → cap → pagoda point → 4 posts → body → bottom plate (HallwayLanterns.tsx 51–111). Hallway crosshatch beam grid + center hub (Hallway.tsx 127–146). IdeaLab bench is hero-sized with 4 chunky legs + cross-brace + trim band (398–432). Star/particle sizing tuned (avgSize derived in build). No equal-thickness slab look anywhere. |
| Micro-animations | 92 | 15 | 13.80 | StarField per-star independent phase shimmer (74–99). Particles quadrature sin/cos swirl with per-particle freq+amp (90–120). HallwayLanterns 4 phase-offset bobs (30–37). Hallway steam group (60–69). IdeaLab: bulb float+pulse, 3 counter-rotating gears, prototype micro-vibrate, hanging tool swing, solder tip pulse, accent light breathing, AND now two independent spark drift loops (199–277). All amplitude-disciplined. |
| Color harmony | 80 | 10 | 8.00 | Hallway warm band now genuinely owned by lanterns post-de-emissive (Hallway.tsx 76, 80, 116, 121, 151, 155 all dropped emissive). IdeaLab sparks now actually read as two colors at the material level. BUT: Particles palette is still 5 saturated colors including `#3b82f6` blue and `COLORS.purple` — F3.18 #5 was NOT applied. Plant leaves in Hallway.tsx 35, 39 still carry `emissive` 0.15/0.1 — F3.18 #4 NOT applied. Hallway ceiling-light strips at 159–170 still emit `#ffd700` at 0.8 intensity, partially competing with lanterns. |
| Clutter / props | 90 | 10 | 9.00 | Hallway: coffee machine + steam particles + 4 plants + 2 runners + center rug + 9 ceiling beams + center hub + 6 ceiling strips. IdeaLab is the densest room in the codebase: bench, vise, gears, soldering iron, hammer, wrench, jar of parts, tape, pencil cup, paper rolls, pegboard with 7 hanging tools, swinging hanging tool, cork board with 3 sketches, stool, floating bulb, scattered sketches. Lanterns each have 7+ sub-parts. |
| Character refinement | N/A | — | — | No characters in ambient layer. Treated as 100% (no penalty per rubric). |
| Performance feel | 90 | 10 | 9.00 | All useFrame zero-alloc verified line-by-line. Both spark buckets share one `SPARK_DUMMY` (zero double-cost). Two new draw calls from the spark split (orange + warm) — total spark instances unchanged at 14, just split across two meshes. Negligible perf cost (~2 extra draw calls vs the prior 1). Star field still skips render entirely in light theme (returns null line 102). Particles use a single InstancedMesh of 150 cubes. Theme-skipping in StarField is a clean win. |

**Weighted sum:** 12.90 + 13.20 + 13.50 + 13.80 + 8.00 + 9.00 + 9.00 = **79.40**
**Weight applied (excluding character N/A):** 90
**Weighted average: 79.40 / 90 = 88.22 / 100**

**Ship gate: CLEAR (88.22 ≥ 88, no 🔴, no dimension < 70%).**

Note on the dim-floor check: lowest dim is Color harmony at 80 — well above the 70 floor.

## Visual verification

- **IdeaLab sparks 2-bucket color split:** Code change is structurally correct. The F3.18 reviewer's exact diagnosis ("`meshPhongMaterial` emissive is a material uniform, not a per-instance attribute") is now resolved at the architectural level: orange sparks render via one InstancedMesh with `emissive="#f97316"` intensity 2.0 (lines 658–665), warm sparks via a second InstancedMesh with `emissive="#fff3a0"` intensity 1.5 (lines 673–681). The two buckets cannot bleed colors into each other because they are different materials. The `screenshot-fix.png` resolution is too low to count individual sparks above the bench (the dialogue UI fills the lower half of the frame), but the warm orange/amber tones dominating the IdeaLab interior are consistent with two-color emissive sparks doing their job. **Verified at code level; visual confirmation is partial.**

- **Hallway warm glow ownership:** Floor cross (lines 76, 80), both runner rugs (116, 121), and both rug layers (151, 155) all had `emissive` props removed. The lanterns at 4 corners (`HallwayLanterns.tsx` 100–111) are now the unambiguous source of the warm band: glow core `emissiveIntensity={4.2}` + warm `pointLight` intensity 1.1, distance 6.5. **Verified at code level.** Screenshot doesn't directly show the hallway floor but the IdeaLab interior shot has clean dark-around-warm contrast which is the same lighting principle.

- **Particles palette trim:** **NOT done.** Particles.tsx 24–30 still has 5 colors: `COLORS.gold`, `COLORS.green`, `COLORS.purple`, `'#3b82f6'`, `COLORS.red`. F3.18 designer flagged this as an *optional* fix (#5), so it doesn't trip the ship gate, but it remains a 🟡 iterate item.

- **HallwayLanterns Edges:** **NOT done.** No `<Edges>` import in HallwayLanterns.tsx (verified — file has no import from `@react-three/drei`). Lantern silhouette currently relies on the 4-corner-post geometry and color contrast, which works but a single `<Edges color={edgeColor} />` on the body box (line 89) and top cap (line 66) would be a cheap pop. Not flagged in F3.18 ranked top-5; treating as opportunistic 🔵 LGTM-with-suggestion.

## Findings

### 🔴 Critical
None. F3.19 hit the F3.18-designer top-2 fixes cleanly without breaking any hard constraint.

### 🟡 Iterate
1. **Particles palette still 5 saturated colors** (`Particles.tsx:24–30`). F3.18 #5 not applied. With `emissiveIntensity: 0.9` + `opacity: 0.75`, blue (`#3b82f6`) and purple (`#64477d`) particles still risk reading as confetti against a warm-lit hallway. Trim to 3 warm hues (gold/amber/pale-rose) or split into two material buckets like IdeaLab sparks did.
2. **Hallway plant leaves still emissive** (`Hallway.tsx:35, 39`). Plants shouldn't self-light. Drop `emissive` from the two leaf spheres (and the cone if you want full consistency).
3. **Hallway ceiling beam color too dark vs dark-mode edge** (`Hallway.tsx:130, 138`). `#3a2510` against `edgeColor` `#0a0a14` risks merging. F3.18 #3 untouched. Lift to `#4a3018` or `#553520`.

### 🔵 LGTM
1. **Spark 2-bucket architecture is the right fix.** The diff at IdeaLab.tsx 50–86 + 199–276 + 647–682 is exactly what the F3.18 reviewer prescribed (option c), with zero per-frame alloc preserved across both buckets via shared `SPARK_DUMMY`.
2. **Hallway de-emissive is comprehensive.** Floor cross + both runners + both rug layers all stripped of emissive in one pass. Clean targeted diff (18 lines).
3. **Single shared `SPARK_DUMMY` across two loops** is a nice perf detail — easy to forget and accidentally instantiate two scratch Object3Ds, but the implementer kept it to one (line 95).
4. **Optional cheap win:** Add `<Edges color={edgeColor} />` to lantern body (line 89) and top cap (line 66) in HallwayLanterns — would push Edge dim from 88 to ~92.

## Verdict
- **PASS**
- F3.19 cleanly addressed F3.18 designer's top-2 leverage fixes (spark color split + hallway de-emissive) without violating any hard constraint; weighted rubric crosses the 88 ship gate at 88.22, no 🔴, lowest dim 80 (Color harmony) — well above the 70 floor. Three 🟡 iterate items remain (particles palette, plant leaf emissive, beam color lift) but they are F3.18 #3-#5 — explicitly lower-leverage and not blocking.
