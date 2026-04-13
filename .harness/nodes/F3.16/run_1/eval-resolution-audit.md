# F3.16 Eval — Reviewer A (findings resolution audit)

Commit under review: `0f10887` — "polish(3d): F3.15 differentiate warm-room
wood + BookRoom hero focal"
Stat: `BookRoom.tsx +51/-14, IdeaLab.tsx +6/-5` — only two room files touched.
ProductRoom unchanged.

## F3.14 IdeaLab 🟡 findings

| Finding | Status | Evidence |
|---|---|---|
| No ambient particle layer (sparks/dust) | **unresolved** | `IdeaLab.tsx` has no `Points`, no sprite, no mulberry32-scattered dust motes. The F3.15 diff does not touch the lighting/particle region at all. Full-file grep for `Points`, `sprite`, `dustRef`, `Particles` → zero hits. The finding from `eval-idealab.md:173-177` was the #1 top-priority 🟡 and was fully skipped. |
| Draw-call budget at risk (~200 from IdeaLab) | **not-applicable** (deferred, correctly) | The F3.14 eval itself (`eval-idealab.md:181-184`) explicitly said "Flag for F3.17 or F3.21 cross-cutting optimization rather than F3.15 (this is a pattern, not an IdeaLab bug)." F3.15 following that deferral is correct. `IdeaLab.tsx:442-449` pegboard grid still 15 meshes, `:247-252` BOARD_LINES still 11 meshes, `:197-202` PLANK_STRIPES still 5 meshes — unchanged, as expected. |
| ELECTRIC_GREEN heading bar + circuit board fight the gold room accent | **unresolved** | `IdeaLab.tsx:254-257` heading bar still `color={ELECTRIC_GREEN} emissive={ELECTRIC_GREEN} emissiveIntensity={1.0}`. `IdeaLab.tsx:328-331` circuit board still `color={ELECTRIC_GREEN_DIM} emissive={ELECTRIC_GREEN_DIM}`. Neither changed in commit `0f10887`. `eval-idealab.md:187-192` suggested recolour to `AMBER_BULB` + `#7a7a3a` dark olive. Not done. |
| Pegboard-hole array literals not hoisted to module scope | **unresolved** | `IdeaLab.tsx:442-443` still contains inline render-time literals `[-0.6, -0.3, 0.0, 0.3, 0.6].map(...)` and nested `[-0.3, 0.0, 0.3].map(...)`. `eval-idealab.md:193-197` flagged this as a 5-LOC module-scope hoist. Zero diff lines in this region of the commit. |

**Resolution rate: 0 of 3** (1 legitimately deferred; 3 ignored).

## F3.15 scope additions

| Change | Motivated by | Assessment |
|---|---|---|
| BookRoom mahogany palette (`#4a281a`/`#6b3a1e`/`#9c5a30`) at `BookRoom.tsx:16-18` | Neither `eval-rooms-ab.md` nor `eval-idealab.md` asked for it. BookRoom was **PASS 92.40** with only 🔵 cosmetic notes. | **Scope creep.** However, the tonal shift is defensible on its own merits — mahogany is a more recognisable "cozy library" cue than generic brown, and it creates cleaner visual separation from IdeaLab's new olive-pine. Low risk. Acceptable-but-unsanctioned. |
| IdeaLab pine-olive palette (`#4a3418`/`#6e5428`/`#8f7436`/`#7e6430`) at `IdeaLab.tsx:16-19` | Not a F3.14 finding. IdeaLab was ITERATE at 87.75 but the gap was particles + palette-identity-drift-FROM-gold, not wood tone. | **Scope creep.** The olive-shift does nothing to address the actual F3.14 gap (which was ELECTRIC_GREEN fighting gold). Nudging the wood yellower while leaving the green untouched is fixing a non-problem while leaving the real problem. Acceptable in isolation, but *displaced* the real 🟡 fix. |
| BookRoom globe slow-spin (`BookRoom.tsx:131`, `:432-442`) | Not requested. BookRoom micro-animations scored **91/100** — already fine. | **Pure scope creep.** Adds a 6th animation driver to a room that F3.14 Reviewer A said "no fixes required" (`eval-rooms-ab.md:107`). Not harmful — slow-spin at 0.35 rad/s is tasteful and the useFrame body stays allocation-free — but effort-misallocated when IdeaLab had 3 unfixed 🟡 findings sitting right there. |
| BookRoom gold picture-frame breathing glow (`BookRoom.tsx:132-136`, `:470-479`) | Not requested. | **Pure scope creep.** Same reasoning — BookRoom was a PASS. The breathing glow on the frame is ±0.18 on base 0.22 which is ±82% swing, visually loud; whether it reads as "hero focal" or "blinking alarm" depends on the screenshot (not provided for this audit). Concerning amplitude given that the F3.14 Reviewer A *specifically* flagged lamp flicker's ±23% as pushing the spec's ±5% guideline — this new FRAME_GLOW is 3.5× looser. |

**Summary:** F3.15 fixed zero of the three actionable IdeaLab 🟡 findings and
instead spent its effort on 4 unsolicited BookRoom enhancements. The
implementer prioritized scope creep over the review backlog.

## Hard-constraint regression check

- **[PASS] flatShading on all materials in all 3 rooms**:
  `meshPhongMaterial` / `flatShading` count parity — IdeaLab 57/57, BookRoom
  46/46, ProductRoom 51/51. BookRoom has 1 additional `meshBasicMaterial`
  at `BookRoom.tsx:206` on the invisible click target for
  `BLOG_INTERACTABLE` (`transparent opacity={0} depthWrite={false}`) —
  same as pre-F3.15, acceptable.
- **[PASS] Zero useFrame allocation in BookRoom** (`BookRoom.tsx:97-137`):
  line-by-line walk —
  - `:98` `t = clock.getElapsedTime()` scalar
  - `:101-106` lamp: ref deref + scalar `flick` math + material cast + scalar
    `emissiveIntensity` write
  - `:109-112` accent light: scalar intensity write
  - `:115-118` page ref: scalar `rotation.x` write
  - `:121-127` dust loop: indexed array read `dustMotes[i]` (no alloc since
    `dustMotes` is the same `useMemo`'d array reference), scalar `position.y`
    write on ref
  - `:130-131` **NEW** globe ref: scalar `rotation.y = t * GLOBE_SPIN_SPEED`
  - `:132-136` **NEW** frame ref: material cast + scalar `emissiveIntensity`
    assignment
  No `new THREE.*`, no `.clone()`, no object/array literals. Clean.
- **[PASS] Zero useFrame allocation in IdeaLab** (`IdeaLab.tsx:131-179`):
  useFrame body is identical to F3.14 (commit touched palette constants
  only, not the animation body). F3.14 Reviewer B already audited this
  line-by-line and confirmed zero-alloc. Spot re-walk confirms no change at
  `:131-179`.
- **[PASS] ProductRoom unchanged**: `git show 0f10887 -- src/world3d/scene/rooms/ProductRoom.tsx`
  produces empty output. File identical to F3.13/F3.14 state. F3.14 Reviewer
  A already confirmed useFrame is alloc-free at `ProductRoom.tsx:150-182`.
- **[PASS] mulberry32 (no Math.random)**: grep `Math\.random` across all 3
  rooms → zero hits. IdeaLab uses `makeRng(0x1dea5c)` at `:106`, BookRoom
  uses `makeRng(DUST_SEED)` with `DUST_SEED = 0xb00c2a` at `:75`,
  ProductRoom uses `makeRng` at `:129`.
- **[PASS] Interactables preserved**:
  - `IDEA_BOARD` → `IdeaLab.tsx:12` const + `:237-246` mesh with
    `m.userData.interactable = IDEA_BOARD_INTERACTABLE` in `onUpdate`.
    Unchanged.
  - `PROBLEM_SOLVER` + `MENTOR_TABLE` → `ProductRoom.tsx:13-14` (unchanged
    file).
  - `BLOG` → `BookRoom.tsx:12` const + `:199-207` invisible plane with
    `m.userData.interactable = BLOG_INTERACTABLE` in `onUpdate`. Unchanged —
    F3.15 did not move this mesh; it sits before the globe and frame
    additions in the JSX tree.
- **[PASS] Scope clean**: `git show 0f10887 --stat` —
  `src/world3d/scene/rooms/BookRoom.tsx | 65 +++++++++++++++-----`
  `src/world3d/scene/rooms/IdeaLab.tsx  | 11 +++---`
  `2 files changed, 51 insertions(+), 25 deletions(-)`.
  Only `src/world3d/scene/rooms/`. No edits to `data/rooms.ts`,
  `constants.ts`, `colliders.ts`, controllers, store, HUD.
- **[PASS] Frozen constants untouched**: commit stat above shows no
  `constants.ts` or `data/rooms.ts` edits. `FOLLOW / CAMERA / FP / INTRO /
  ROOM / GAP` all untouched.

## New issues

### 🔴 Critical
- **(none)** — no hard-constraint violation, no regression.

### 🟡 Iterate
- **F3.14 IdeaLab 🟡 backlog effectively dropped.** Three actionable findings
  (particles, ELECTRIC_GREEN retint, pegboard-hole hoist) all unresolved in
  F3.15. The F3.14 review predicted "If F3.15 adds the particle layer +
  hoists the pegboard-hole literals + re-tints the heading bar/circuit board
  to gold-family, IdeaLab should clear 88+ easily on the next review cycle"
  (`eval-idealab.md:238-241`) — none of the three required actions were
  taken. Re-scoring at F3.16 second-reviewer pass will likely land IdeaLab
  at the same 87.75 ITERATE, missing the 88 ship gate by the same 0.25.
  Either do the three fixes now or accept that IdeaLab will be an F3.21
  cleanup target.
- **BookRoom FRAME_GLOW amplitude is too hot.** `BookRoom.tsx:58-59`
  `FRAME_GLOW_BASE = 0.22, FRAME_GLOW_AMPLITUDE = 0.18` gives
  `emissiveIntensity ∈ [0.04, 0.40]` — an ±82% swing. The F3.14 reviewer
  already flagged the lamp flicker's ±23% as pushing the spec's "≤ ±5%
  pulse" guideline (`eval-rooms-ab.md:86`); this new frame glow is ~3.5×
  looser still. On a gold picture frame this will read as blinking, not
  breathing. Recommend `FRAME_GLOW_BASE = 0.35, FRAME_GLOW_AMPLITUDE = 0.08`
  (22% swing) to match the lamp's "deliberate style call" register.

### 🔵 LGTM
- **Palette shifts are executed cleanly.** Both mahogany and olive-pine
  constants are hoisted to module scope (`BookRoom.tsx:16-18`,
  `IdeaLab.tsx:16-19`), no inline hex strings leaked, all downstream
  references pick up the new values via the constant names.
- **Globe slow-spin is textbook clean.** `BookRoom.tsx:432-442` wraps the
  sphere + brass ring in a `<group ref={globeRef}>`, useFrame just does
  `globe.rotation.y = t * GLOBE_SPIN_SPEED` — single scalar write, no
  allocation, speed (0.35 rad/s ≈ 3.3 sec/revolution) is cinematically slow.
- **BookRoom useFrame body additions maintain zero-alloc discipline.** The
  two new drivers bring BookRoom to 6 animation channels, all still pure
  scalar math on pre-existing refs.
- **All three interactables preserved**, scope is clean, no regressions to
  the 12-test Playwright suite (per commit message claim — not re-verified
  in this audit).

## Verdict

**ITERATE**

- **Resolution rate: 0 of 3** actionable F3.14 IdeaLab 🟡 findings
  (particles, palette-fight, pegboard hoist). One finding (draw-call budget)
  was correctly deferred to F3.17/F3.21 per the F3.14 reviewer's own
  guidance. So the honest accounting is:
  - actionable findings addressed: 0/3
  - legitimately deferred: 1/4
  - ignored: 3/4

- **One-sentence rationale**: F3.15 is technically clean and introduces no
  regressions, but it spent all its effort on unsolicited BookRoom polish
  (mahogany repaint + globe spin + frame glow + olive IdeaLab repaint) while
  skipping every actionable 🟡 on the F3.14 IdeaLab backlog, so the ship gate
  on IdeaLab is still open and F3.16 cannot declare "fixes landed".

- **Recommended next step**: a short targeted F3.15.1 that does exactly the
  three things F3.14 asked for — (1) add an ambient sparks/dust particle
  layer to IdeaLab (~30 LOC), (2) recolour heading bar + circuit board away
  from ELECTRIC_GREEN into the gold family, (3) hoist the pegboard-hole
  literals to module scope. Plus tame `FRAME_GLOW_AMPLITUDE` on BookRoom.
  Total est. ~50 LOC across both files.
