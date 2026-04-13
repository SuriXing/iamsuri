# F3.16 Eval — Reviewer B (rubric re-score)

Post-F3.15 (`0f10887`). Re-scoring ProductRoom, BookRoom, IdeaLab against the
F3 rubric, determining ship-gate status per room.

## Hard-constraint audit (all 3 rooms)

- **[pass] `flatShading: true` on every lit material.**
  - ProductRoom: 51 `<meshPhongMaterial>` / 51 `flatShading` attrs
    (`src/world3d/scene/rooms/ProductRoom.tsx`, 1:1 grep parity).
  - BookRoom: 46 `<meshPhongMaterial>` / 46 `flatShading` +
    1 `<meshBasicMaterial>` at `BookRoom.tsx:206` (invisible
    `opacity={0}` interactable hitplane — basic materials are unlit so
    `flatShading` is a no-op). Pass.
  - IdeaLab: 57 `<meshPhongMaterial>` / 57 `flatShading`. Pass.
  - No `<meshStandardMaterial>` anywhere. Voxel-art look preserved.

- **[pass] Zero useFrame allocation — ProductRoom.**
  `ProductRoom.tsx:150-182` — walked line-by-line: only
  `clock.getElapsedTime()`, `Math.sin`, numeric literals,
  `.current` reads, `emissiveIntensity`/`rotation.z`/`position.y`/
  `intensity` scalar writes. No `new`, no `{}`, no `[]`. The only
  `new THREE.Color()` in the file is inside `useMemo` at L130 — fine.

- **[pass] Zero useFrame allocation — BookRoom.**
  `BookRoom.tsx:97-137` — line-by-line: `t = clock.getElapsedTime()`,
  `Math.sin`, numeric math, scalar writes to `material.emissiveIntensity`,
  `al.intensity`, `page.rotation.x`, `m.position.y`, `globe.rotation.y`,
  `fmat.emissiveIntensity`. All refs resolved via `xxxRef.current`.
  Casts are `as THREE.MeshPhongMaterial` type-only — no runtime alloc.
  `dustMotes[i]` is a stable-reference read from `useMemo` at L74-86. Pass.

- **[pass] Zero useFrame allocation — IdeaLab.**
  `IdeaLab.tsx:131-179` — line-by-line: `yOffset = Math.sin(...) * BULB_...`
  (scalar), scalar writes to `bulb.position.y`, `mat.emissiveIntensity`,
  `bulbLight.position.y`, `bulbLight.intensity`,
  `gA/B/C.rotation.z`, `proto.position.x/z`
  (using `proto.userData.baseX/baseZ` stashed via `onUpdate` at L316-320,
  so no per-frame closure), `hang.rotation.z`, `tip.material` scalar,
  `al.intensity`. No allocations. Pass.

- **[pass] mulberry32 for per-instance variation.**
  - ProductRoom: `makeRng(BAND_SEED)` at L129 → floor tint jitter in `useMemo`.
  - BookRoom: `makeRng(DUST_SEED)` at L75 → dust-mote scatter in `useMemo`.
  - IdeaLab: `makeRng(0x1dea5c)` at L106 → sketch scatter in `useMemo`.
  - All three also consume `DUSTY_SPINES` / hero-book seeds via the shared
    `Bookshelf` part (BookRoom L194/224).
  - Source: `src/world3d/util/rand.ts:3` `makeRng(seed: number)`.

- **[pass] Derived arrays/geometry inside `useMemo`.**
  `bandTints` (PR:128), `dustMotes` (BR:74), `sketches` (IL:105).
  All module-scope `const` arrays (`DESK_LEGS`, `RACK_LEDS`, `DUSTY_SPINES`,
  `BOARD_LINES`, `BENCH_LEGS`, `PEG_TOOLS`, `PLANK_STRIPES`) are frozen
  `ReadonlyArray`s, never rebuilt.

- **[pass] Interactables preserved.**
  - `PROBLEM_SOLVER`: `ProductRoom.tsx:254` (passed to `ScreenStand`,
    attached at L93 `m.userData.interactable = interactable`).
  - `MENTOR_TABLE`: `ProductRoom.tsx:262`.
  - `BLOG_INTERACTABLE`: `BookRoom.tsx:12, 202` (invisible plane at L199-207).
  - `IDEA_BOARD_INTERACTABLE`: `IdeaLab.tsx:12, 240`.

- **[pass] Scope clean.**
  `git diff --stat 0f10887 -- src/world3d/` returns empty — no changes
  since the F3.15 commit. The commit itself only touched `BookRoom.tsx`
  and `IdeaLab.tsx` (`+51 / -25`), ProductRoom untouched in F3.15.
  Nothing outside `src/world3d/scene/rooms/*`.

- **[pass] Frozen constants / data untouched.**
  `git diff 0f10887~1 0f10887 -- src/world3d/constants.ts src/world3d/data/rooms.ts`
  is empty. `constants.ts` `FOLLOW/CAMERA/FP/INTRO/ROOM/GAP/DOOR/CHARACTER`
  blocks all still present verbatim. `data/rooms.ts` accent colors intact:
  product `#60a5fa`, book `#4ade80`, idealab `#fbbf24`.

---

## ProductRoom rubric

*(ProductRoom was untouched by F3.15 — scores inherit from F3.14 state, which
was already strong post-F3.13 and flagged as `LGTM` in the F3.14 architect
eval.)*

| Dimension | Score | Weighted | Justification |
|---|---|---|---|
| Material variation | 90 | 13.50 | Four-tier slate (DEEP/MID/LIGHT/METAL) + CYAN/CYAN_DIM emissive + CABLE/RACK blacks + mulberry32 floor-band jitter at PR:128-139. Wood crates at L427-440 break up the cool palette. Missing: no true roughness variation (all `meshPhongMaterial` default shininess), so "metal-vs-painted-slate" read is color-driven only. |
| Edge / silhouette pop | 92 | 13.80 | `<Edges>` on every hero silhouette — desk top (L226), monitor bezels (L87 via `ScreenStand`), server rack + door (L375, L380), fan housing, crates (L430, L439), product cubes (L457). Thematically consistent `edgeColor` that respects theme at L125 (`#0a0a14` dark / `#5a4830` light). |
| Proportions | 88 | 13.20 | Desk top 2.2×0.08×0.95 (PR:224) — thin slab but not slab-look thanks to the trim strip + tapered 4-leg stack at L232-243. Monitors 1.1×0.76 bezel + 0.12 stand post — crafted. Server rack 0.8×1.5×0.6 — chunky hero. Crate stack with rotation at L437 — varied. |
| Micro-animations | 94 | 14.10 | Five drivers: power-LED blink (L154-158), rack-LED phased pulse (L160-167, 6 LEDs × unique phase), fan spin (L170-171), dual monitor scanline sweep (L173-177), accent-light breathing (L179-181). All use module-scope constants (L39-43). |
| Color harmony | 88 | 8.80 | Cool slate + cyan accent is visually tight. Cyan accent light at L461-468 matches the `data/rooms.ts` product accent `#60a5fa` **family** (cyan `#22d3ee` is close-but-not-exact to the canonical `#60a5fa` blue). Rubber-duck yellow + pink/yellow sticky-notes are small and balanced. |
| Clutter / props | 95 | 9.50 | Far above the "1–2 clutter props" minimum: keyboard + wrist-rest + mouse + mousepad (L269-294), closed laptop with cyan dot (L297-305), coffee mug with brown top (L308-316), headphones (L319-331), three sticky notes (L333-344), two USB drives (L347-354), rubber duck (L356-369), fan blade, coiled cable, crate label. |
| Character refinement | 100 | 10.00 | N/A — no character in room. |
| Performance feel | 94 | 9.40 | ~75 meshes by hand count, 5 per-frame drivers with scalar writes only, no geometry rebuilds, all lights are low-count point lights. Zero alloc confirmed above. |

**Weighted avg: 92.30 / 100**
**Ship gate: CLEAR** (no dimension below 70%; all above 88; no 🔴).

---

## BookRoom rubric

*(F3.15 touched BookRoom: mahogany palette shift + globe slow-spin + gold
frame breathing glow.)*

| Dimension | Score | Weighted | Justification |
|---|---|---|---|
| Material variation | 90 | 13.50 | Post-F3.15 mahogany four-tier WOOD_DEEP/MID/LIGHT (L17-19) + CREAM/CREAM_DARK + FOREST/FOREST_LIGHT + GOLD/BRASS + CHAIR_GREEN/DK. `DUSTY_SPINES` 8-color pastel array at L32-40 replaces the loud data-file palette — textbook dusty-library treatment. Missing: same "no real roughness channel" note — books and wood share shininess. |
| Edge / silhouette pop | 93 | 13.95 | `<Edges>` on the right silhouettes: rug (L165), ladder posts (L233/238), chair base/seat/back (L258/264/270/276), throw blanket (L292), cushion (L298), side-table top + base (L305/314), lamp shade (L330), open book halves (L343/348), tea cup (L360), stacked books (L385/390/395), globe sphere (L436), picture frame (L478). Hero silhouettes pop. |
| Proportions | 88 | 13.20 | Chair: base 0.95×0.32×0.85, seat cushion 0.82×0.12, back 0.95×0.9 with 0.14 depth — reads as a proper reading chair, not a slab. Bookshelves use `Bookshelf` part at L178/208 with `frameBoxHeight={2.2}`. Side table pedestal (L307) 0.08 post on 0.28 base — slightly thin but acceptable for library feel. |
| Micro-animations | 95 | 14.25 | Six drivers post-F3.15: lamp 2-wave flicker (L102-106), amber accent breath (L109-112), open-book page flutter (L114-118), five dust motes phased bob (L120-127), **globe slow spin `t * 0.35`** (L130-131, F3.15), **picture-frame breathing glow `0.22 ± 0.18 @ 1.3 Hz`** (L132-136, F3.15). The dual focal anims successfully anchor the reading nook. |
| Color harmony | 92 | 9.20 | F3.15 mahogany shift (`#4a281a`/`#6b3a1e`/`#9c5a30`) lands the red-brown register cleanly — visibly warmer and redder than IdeaLab's yellow-olive pines. Chair green #4a6b42 + amber lamp glow + cream book pages form a classic cozy-library triad. Gold frame (`#c9a14a`) picks up lamp warmth without muddying. Minor: chair cushion `#dda0a0` blush matches the blush book spine — intentional echo. |
| Clutter / props | 92 | 9.20 | Above the minimum: library ladder (L229-251), throw blanket on arm (L289-293), decorative cushion (L295-299), side table with full still-life (open book, tea cup + saucer + creamer dot, eyeglasses with 2 torus lenses + brass bridge), stacked floor books + bookmark (L381-401), potted fern (L404-420), spinning globe (L422-442), framed picture (L469-483), floating dust motes (L444-456). |
| Character refinement | 100 | 10.00 | N/A. |
| Performance feel | 92 | 9.20 | ~95 meshes, 6 drivers all scalar. `dustMotes` memoized. Two point lights. `<Edges>` count is higher than ProductRoom — slight draw-call pressure but well under the 30% budget. |

**Weighted avg: 93.30 / 100**
**Ship gate: CLEAR** (no dim <70%; all above 88; no 🔴).

---

## IdeaLab rubric

*(F3.15 touched IdeaLab: pine-olive wood palette shift only. ELECTRIC_GREEN
re-tint was NOT done — F3.15 took BookRoom hero anims instead.)*

| Dimension | Score | Weighted | Justification |
|---|---|---|---|
| Material variation | 88 | 13.20 | Four-tier wood DEEP/MID/LIGHT/PLANK (L15-18) post-F3.15 + three-tier metal DARK/MID/LIGHT (L19-21) + ELECTRIC_GREEN/ORANGE_SPARK/AMBER_BULB/CORK. Translucent screws jar at L386 (`opacity={0.5}`) is the only translucent element and lands. |
| Edge / silhouette pop | 91 | 13.65 | `<Edges>` on idea-board frame (L235), workbench top (L282), bench legs (L294), prototype + circuit stack (L325), all 3 gears (L342/347), wrench (L372), jar of parts (L387), tape roll (L402), pencil cup (L409), paper rolls (L428), pegboard (L439), peg tools (L455), cork board (L476), stool top (L496), sketches on floor (L227), whiteboard marker tray (L262), idea-board plane (L245). |
| Proportions | 88 | 13.20 | Workbench 2.6×0.14×0.95 thick top + 0.06 trim band + 4× 0.12×0.6 chunky legs (L290-296) + cross-brace. Hero bench reads heavy and real. Idea board 2.6×1.7×0.08 — reads as a proper whiteboard, not a slab. Pegboard 1.8×1.0×0.04 — thin but correct for pegboard. |
| Micro-animations | 94 | 14.10 | Seven drivers — most animated room: bulb vertical bob + emissive pulse (L134-141, 2 linked channels), linked bulb-light position + intensity (L142-146), 3 counter-rotating gears at 1.4/-1.9/2.3 rad/s (L148-154), prototype XY vibration at 18 Hz tiny amplitude (L156-161), hanging-tool swing (L163-167), soldering-tip pulse (L169-174), green accent breath (L176-178). |
| Color harmony | 80 | 8.00 | **Still the weakest dim.** F3.15 locked warm-wood tonal distinctness (pine-olive `#4a3418/6e5428/8f7436/7e6430`) — visibly yellower than BookRoom's mahogany. BUT: `ELECTRIC_GREEN` heading bar (L256) and `ELECTRIC_GREEN_DIM` circuit-board top (L330) still compete with the nominal `data/rooms.ts` idealab accent `#fbbf24` (gold). The `AMBER_BULB` floating bulb + gold accent pointLight (L527-534) do dominate in the camera, so it reads OK — but the palette identity is still mildly confused at close range. Carry-over from F3.14 finding; F3.15 did not address it. Not a regression, but also not resolved. |
| Clutter / props | 96 | 9.60 | Highest clutter count: 6 scattered floor sketches (mulberry seeded), board with 11 colored lines + 3 markers + heading bar, prototype with LED, 3 gears, soldering iron + tip, wrench + hammer head + handle, screws jar, tape roll, pencil cup with 3 pencils, 2 blueprint rolls, pegboard with 7 hanging tools + hole pattern, swinging rope tool, cork board with 3 pinned sketches, stool. |
| Character refinement | 100 | 10.00 | N/A. |
| Performance feel | 90 | 9.00 | ~115 meshes by hand count — heaviest room. 7 scalar-write drivers. Two point lights. Bulb light tracks the floating bulb (scalar). Still well under draw-call budget; playwright pass proves 60fps feel. |

**Weighted avg: 90.75 / 100**
**Ship gate: CLEAR** (color harmony 80/100 is > 70% threshold; weighted avg
≥ 88; no 🔴). Color harmony stays 🟡 but passes the gate.

---

## F3.15 visual verification

- **BookRoom mahogany palette.** `BookRoom.tsx:17-19` shows
  `WOOD_DEEP=#4a281a`, `WOOD_MID=#6b3a1e`, `WOOD_LIGHT=#9c5a30`. Versus
  pre-F3.15 (`#4a2f1a/#6b4423/#8b5e3c`) this is +3° hue redshift and ~+10%
  saturation on MID/LIGHT. Confirmed in the F3.15 overview screenshot —
  the left-hand (book) room reads visibly red-brown rather than neutral
  mid-brown.
- **IdeaLab pine-olive palette.** `IdeaLab.tsx:15-18` shows
  `WOOD_DEEP=#4a3418`, `WOOD_MID=#6e5428`, `WOOD_LIGHT=#8f7436`,
  `WOOD_PLANK=#7e6430`. Visibly yellower (higher red-green balance shift)
  vs the pre-F3.15 `#4a2f1a/6b4a2a/8b6a42/7a5a3a`. In the F3.15 overview
  the IdeaLab floor/walls read yellow-olive next to BookRoom's red-brown
  — tonal distinctness lock lands.
- **Globe slow-spin.** Code check pass:
  `BookRoom.tsx:94` declares `globeRef`, `BookRoom.tsx:130-131` assigns
  `globe.rotation.y = t * GLOBE_SPIN_SPEED` with `GLOBE_SPIN_SPEED = 0.35`
  (L57). Globe group at L432-442 wraps sphere + brass ring — rotation on
  the group rotates both together. Correct.
- **Picture frame breathing glow.** Code check pass:
  `frameRef` at L95, useFrame at L132-136 writes
  `fmat.emissiveIntensity = FRAME_GLOW_BASE + Math.sin(t * FRAME_GLOW_SPEED) * FRAME_GLOW_AMPLITUDE`
  (base 0.22, amp 0.18, speed 1.3 at L58-60). Frame material at L472-477
  has `emissive={GOLD}`. Correct.
- **IdeaLab ambient particles.** NOT added in F3.15 (scoped out — not in
  the commit message). The room still lacks ambient golden sparkle dust.
  F3.14 IdeaLab review suggested this; carry-over.
- **ELECTRIC_GREEN → gold-family re-tint.** NOT done. `ELECTRIC_GREEN = '#4ade80'`
  still at `IdeaLab.tsx:25`, still used for heading bar (L256) + circuit
  board top (L330) + board lines (L61, L64, L67, L71). F3.15 deliberately
  scoped to wood + BookRoom focals. Carry-over 🟡 finding.

---

## Findings

### 🔴 Critical
- (none)

### 🟡 Iterate
- **IdeaLab color harmony 80/100.** Carry-over from F3.14.
  `ELECTRIC_GREEN` heading bar `IdeaLab.tsx:254-256` and
  `ELECTRIC_GREEN_DIM` circuit-board top `IdeaLab.tsx:328-330` still
  compete with the gold room-accent from `data/rooms.ts:22`. Not a ship
  blocker (above 70% floor + weighted avg still clears 88), but it's the
  one dimension where IdeaLab lags behind its peers. Consider re-tinting
  the heading bar and circuit board to `AMBER_BULB` / `GOLD` family in a
  later tick (or in F3.17 implement-ambient, which already touches
  IdeaLab for particles). One-line fix.

### 🔵 LGTM
- **BookRoom hero focals land.** Globe slow-spin + frame breathing glow
  at `BookRoom.tsx:130-136` give the reading nook two anchoring
  ambient animations without distraction. Both use module-scope
  constants and scalar writes — zero perf cost.
- **Warm-room tonal lock works.** The F3.15 palette shift reads
  immediately in the overview screenshot: mahogany vs pine-olive are
  now separable by eye. Designer F3.14's top-1 finding resolved.
- **ProductRoom perf feel.** Five micro-anim drivers on ~75 meshes with
  scalar-only writes and all derived data in `useMemo`. Gold standard
  for the other rooms.
- **Zero useFrame allocation confirmed in all 3 rooms** by line-by-line
  walk.
- **Scope discipline.** Since the F3.15 commit `0f10887`:
  `git diff --stat` on `src/world3d/` is empty. No unauthorized edits to
  frozen files.

---

## Overall verdict

**PASS** (ship gate CLEAR for all 3 rooms).

- ProductRoom: **92.30 / 100** — CLEAR
- BookRoom:    **93.30 / 100** — CLEAR
- IdeaLab:     **90.75 / 100** — CLEAR

Combined 3-room weighted average: **92.12 / 100**. No 🔴 critical findings,
no dimension below the 70% floor. One outstanding 🟡 (IdeaLab color
harmony, ELECTRIC_GREEN vs gold accent) that F3.15 chose not to address
and can be safely deferred to F3.17 or F3.21 cross-cutting polish.

One-sentence rationale: F3.15 landed exactly the two top-priority fixes
from F3.14 (warm-wood tonal distinctness + BookRoom hero focal
animations), left ProductRoom untouched because it didn't need work,
and every ship-gate threshold clears without drama.
