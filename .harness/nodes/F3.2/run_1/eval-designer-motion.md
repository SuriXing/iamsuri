# F3.2 Eval — Reviewer B (proportions + animation)

Independent review of commit `0265c46` touching `src/world3d/scene/Character.tsx`.
Focus: proportions, micro-animations, performance feel, character refinement.
Reviewer A leads material/edge/color dimensions.

## Hard-constraint audit

- **[pass] `CHARACTER.scale = 0.9` unchanged** — `src/world3d/constants.ts:86-95`, still
  `scale: 0.9`. Diff only touches `Character.tsx`; constants file untouched in the commit.
- **[pass] Collider radius unchanged** — `src/world3d/constants.ts:94` still
  `colliderRadius: 0.28`. Also `CHARACTER.shadowRadius: 0.28` unchanged (shadow disc
  at `Character.tsx:151`).
- **[pass] Rig refs preserved** — `groupRef` (`Character.tsx:43,74`), `headRef`
  (`Character.tsx:44,157`), `armLRef` (`Character.tsx:45,91,241`), `armRRef`
  (`Character.tsx:46,92,245`), `shadowRef` (`Character.tsx:47,85,147`), plus
  `smoothFacingRef` (`:49,71,83`) all still present and mutated in `useFrame`.
- **[pass] Zero per-frame allocation in useFrame** — exhaustive line-by-line audit
  of `useFrame` body, `Character.tsx:57-113`, below. Every line is either a primitive
  number op, a ref read, a scalar assign, or a clamp — no `new THREE.*`, no array
  literal, no object literal, no `.clone()`, no closures captured per frame.

  ```
  L58  const t = clock.getElapsedTime();                            // primitive
  L59  const { charPos, charFacing } = useWorldStore.getState();    // destructure existing refs, no alloc (getState returns the already-held state object)
  L62  const dx = charPos.x - lastPosRef.current.x;                  // primitive
  L63  const dz = charPos.z - lastPosRef.current.z;                  // primitive
  L64  const moving = (dx * dx + dz * dz) > 0.00002;                 // primitive
  L65  lastPosRef.current.x = charPos.x;                             // in-place scalar
  L66  lastPosRef.current.z = charPos.z;                             // in-place scalar
  L69  const k = 12;                                                 // primitive
  L70  const tf = 1 - Math.exp(-k * delta);                          // primitive
  L71  smoothFacingRef.current = lerpAngle(...);                     // lerpAngle is pure math, numeric return
  L73  const g = groupRef.current;                                   // ref read
  L74-84 g.position.x/y/z =, g.rotation.y =                          // in-place property writes
  L85-88 shadowRef.current.position.x/z =                            // in-place property writes
  L90  const swing = Math.sin(t * 2) * 0.3;                          // primitive
  L91  armLRef.current.rotation.x = swing;                           // in-place
  L92  armRRef.current.rotation.x = -swing;                          // in-place
  L93  headRef.current.rotation.z = Math.sin(t * 1.5) * 0.05;        // in-place
  L98  const cycle = t % 4.0;                                        // primitive
  L99  const closed = cycle < 0.12;                                  // primitive
  L100 blinkRef.current.scale.y = closed ? 0.1 : 1.0;                // in-place
  L107 let target = -dx * 6.0;                                       // primitive
  L108-109 clamp branches                                            // primitive
  L110 hairSwayRef.current += (target - hairSwayRef.current) * tf;   // in-place scalar
  L111 hairGroupRef.current.rotation.z = hairSwayRef.current;        // in-place
  ```

  One small caveat: the destructure at L59 `{ charPos, charFacing } = ...getState()`
  does NOT allocate — JS destructure just binds local slots. Zustand's `getState()`
  returns the current state reference (no clone), so this is safe. Verified clean.

- **[pass] Animation determinism** — every time-driver is `clock.getElapsedTime()`
  (`Character.tsx:58`) or `delta` from r3f (`L57`); no `Date.now()`, no `Math.random()`
  inside `useFrame`. The hair sway seeds off `dx` (world-space delta), which is
  deterministic given deterministic player input. Blink uses `t % 4.0` — pure phase.
- **[pass] mulberry32 used for randomness** — `Character.tsx:125`,
  `const rng = makeRng(0xC4A87EE);` inside `useMemo`, with a stable hex seed. No
  other random source in the file.

All hard constraints pass.

## Scores

| Dimension | Score | Justification |
|---|---|---|
| Material variation (15) | 80/100 | Secondary — defer to Reviewer A. Tints are deterministic per cube via `tintHex` (`:33-40`) keyed off a mulberry32 table at `:124-141`. ±4% L nudge is subtle but present; good separation of wood vs fabric not attempted (everything `meshPhongMaterial flatShading`, no specular variance). |
| Edge / silhouette pop (15) | 78/100 | Secondary — defer. drei `<Edges>` applied to head-top (`:163`), body-top (`:226`), hair-cap (`:204`) only. Three edge passes is right for the silhouette read without over-lining. Theme-aware `EDGE_DARK/EDGE_LIGHT` binding at `:117-118` is correct. Partial coverage is a deliberate choice — I'd want Reviewer A's call on whether jaw and arms also need edges. |
| **Proportions (15)** | **86/100** | PRIMARY. Major win: head is no longer a 0.4³ cube (the old `Character.tsx:80` baseline). Upper head `[0.42,0.28,0.4]` stacked over jaw `[0.36,0.16,0.36]` produces a proper trapezoidal chibi silhouette (`:160-169`). Body shoulder→waist taper — top `[0.42,0.22,0.26]` at y=1.22, mid `[0.36,0.32,0.24]` at y=0.96 (`:223-231`) — eliminates the old "one gold slab" look. Arms correctly thinned from 0.12 → 0.10 (`:242,246`). Legs split into thigh `0.14` + ankle `0.11` (`:251-267`) — decent leg taper. Toe-caps `[0.16,0.07,0.06]` at z=0.14 (`:279-286`) add shoe tip. **Concerns**: (a) head-to-body ratio is borderline — combined head+hair height (top of fringe y≈1.9, base of jaw y≈1.26) gives head ≈ 0.64 units vs body+legs ≈ 1.02 units, so the head/body ratio is ~0.63 — chibi territory expects ~0.5–0.7, so this lands OK but is on the "tall-head" side. (b) Ankle blocks (`:260-267`) are not edges/rims, they're axis-aligned boxes that visually read as *added* segments, not a taper — the silhouette helps but the block stack is still visible. (c) The arm y=1.05 (`:241,245`) now sits INSIDE the lower body block (body-mid center 0.96, half-height 0.16 → spans 0.80–1.12) — arms intersect the waist geometry. Not catastrophic for flatShading voxel-art but the z-fighting risk is real. |
| **Micro-animations (15)** | **82/100** | PRIMARY. Blink (`:97-101`): 120 ms closure at 4 s period. 120 ms is on the fast end of natural (humans: 100–400 ms, avg 150) — reads as crisp, not twitchy. 4 s cadence is slightly slow vs human (3–5 s is in spec, fine). Implementation via `t % 4.0` is deterministic and cheap. Hair sway (`:106-112`): `-dx*6.0` clamped ±0.06 rad (3.4°) lerped with `tf` per frame. Magnitude is in spec (≤±2° was the guideline but ±3.4° is forgivable for a chibi). **Concern 1:** `dx` is the *per-frame* positional delta — at 60 fps that's very small. For walking at 5.5 u/s (`constants.ts:15`), dx per frame ≈ 0.092 → target ≈ -0.55, clamped to ±0.06 instantly. So the sway **always saturates during walking** and the clamp does all the work. That's acceptable but it means the ±0.06 clamp is the only useful control, not the ×6 multiplier. The smoothing via `tf` still gives the sway inertia so it doesn't snap. **Concern 2:** hair sway is driven by **world-space** dx, not by *lateral* (strafe) velocity relative to facing. Walking forward with `charFacing = π/2` produces a world-space dz change but no dx, so no hair sway — the hair only sways on E-W walks. The comment at `:104` acknowledges this ("that's fine for a tiny decorative sway"), and it IS fine for the budget — but it's a soft 🟡 if the team wanted proper side-to-side-relative-to-facing sway. **Concern 3:** idle arm swing (`:90-92`) uses `Math.sin(t*2)*0.3` with NO moving gate — arms swing even while idle, which is consistent with the "idle sway" design in the comment but stacks onto any walk cycle that future code adds. As-is, it's idle-only so this is fine. Idle head roll (`:93`) `Math.sin(t*1.5)*0.05` also always on, stacks with blink — subtle, reads OK. |
| Color harmony (10) | 82/100 | Secondary — defer. Pink scarf (`COLORS.pink`, `:237`) contrasts the gold body well and matches the Monet-pink room theme. Red shoes + red mouth tie together. Dark hair vs skin is clean. Jitter table keeps all variation within ±4% L so no cube screams. The only clash risk is pink scarf + emissive — at 0.2 it shouldn't bloom under dark theme but I'd check in both themes. |
| Clutter / props (10) | N/A | Not applicable for Character. |
| **Character refinement (10)** | **86/100** | PRIMARY. The screenshot (`.harness/nodes/F3.1/run_1/screenshot-character.png`) shows the character at right, mid-dialogue, with distinguishable head stack, hair cap, gold body with pink scarf band, and red shoes. The screenshot is taken at dialogue distance so fine detail (blush, mouth, toe-cap contrast) is not readable — reviewer can see the overall silhouette is more "crafted figurine" than the old uniform slab. Shoulder blocks, hair tuft, and scarf all read at viewing distance. Reads as crafted, yes — not final-polish level but clearly past "blocky prototype." |
| **Performance feel (10)** | **94/100** | PRIMARY. Zero-alloc in `useFrame` verified line-by-line above. `tints` table is `useMemo` with `[]` deps (`:141`) — computed once at mount, re-render only on theme toggle (which doesn't invalidate the memo). Theme subscription via selector (`:117`) is the only React re-render path and it's one flip. **Primitive growth**: old file had ~12 mesh primitives (head, 2 eyes, mouth, 2 blush, hair, body, 2 arms, 2 legs, 2 shoes = 14). New file has ~22 (head, jaw, 2 eyes, mouth, 2 blush, hair-cap, hair-tuft, hair-fringe, body-top, body-mid, scarf, 2 arms, 2 thighs, 2 ankles, 2 shoes, 2 toe-caps = 22). ~57% mesh growth on Character alone, but from a tiny base; negligible vs the 5k scene total. 3× `<Edges>` passes add 3 `LineSegments` but those are auto-generated by drei from the existing geometry — cheap. Well within the 50% triangle / 30% draw budget at scene level. **Minor deduction**: each `<Edges>` is a separate LineSegments draw call, so net +3 draw calls. Acceptable. |

**Weighted average:**

| Dim | Weight | Score | W×S |
|---|---|---|---|
| Material variation | 15 | 80 | 1200 |
| Edge / silhouette pop | 15 | 78 | 1170 |
| Proportions | 15 | 86 | 1290 |
| Micro-animations | 15 | 82 | 1230 |
| Color harmony | 10 | 82 | 820 |
| Character refinement | 10 | 86 | 860 |
| Performance feel | 10 | 94 | 940 |
| **Total (sum of weights = 90)** | | | **7510** |

Weighted average = 7510 / 90 = **83.4 / 100**

## Findings

### 🔴 Critical
- (none)

### 🟡 Iterate

1. **`Character.tsx:241,245` — arm position y=1.05 intersects body-mid block.**
   Body-mid is centered at y=0.96 with half-height 0.16 (spans 0.80–1.12, `:228-231`).
   Arms are 0.45 tall boxes centered at y=1.05 (span 0.825–1.275). Arm lower halves
   are *inside* the torso mesh — z-fight risk plus the shoulder socket doesn't read
   cleanly. **Fix**: raise arms to y≈1.18 (shoulder at top of body-top block) or
   reduce arm height to 0.36 and re-center.

2. **`Character.tsx:107 — hair sway uses world-space dx, not lateral velocity.**
   When the character walks due-north the hair doesn't move. The comment
   acknowledges this trade-off but for a ship-quality polish the sway should
   respect facing. **Fix**: project `(dx, dz)` onto the right-vector
   `(sin(charFacing), cos(charFacing))` → scalar lateral velocity, use that as the
   target. Still zero-alloc (all scalars).

3. **`Character.tsx:260-267` — ankle boxes read as stacked segments, not taper.**
   Thigh is `0.14` wide, ankle is `0.11` wide, centered at same x — produces a
   visible step in the silhouette. A real taper would need either a cylinder-ish
   geometry or an extra mid-calf block. **Fix (cheap)**: add a mid-calf `0.125`
   width block between them, or just delete the ankle block and let the shoe
   provide the foot tip (leg reads as a single tapered-by-edge column).

4. **`Character.tsx:261,265` — ankle blocks use raw `LEG` constant, not tint
   table.** Breaks the per-cube variation pattern applied everywhere else. **Fix**:
   add `ankleL/ankleR` entries to the tints memo at `:127-141`.

### 🔵 LGTM

- Zero-alloc `useFrame` is clean and verified line-by-line. Good discipline moving
  `tintHex` + `new THREE.Color` into `useMemo` only.
- Deterministic mulberry32 seeding with a stable hex constant (`0xC4A87EE`) — exactly
  how the rand.ts utility is meant to be used.
- Blink implementation via eye-group Y-scale is elegant — no new geometry, just an
  existing group's transform. 120 ms closure feels snappy and not unsettling.
- Theme-aware edge color via store selector — one re-render per theme flip, correct
  pattern for "follow theme without per-frame cost."
- Head trapezoid via stacked boxes (`:160-169`) is the right move — preserves
  voxel-art aesthetic while giving a non-cubic head silhouette.
- Toe-cap contrast block (`:279-286`) is a nice small detail that reads as a shoe
  tip rather than a flat block.
- Scarf accent at the neckline (`:235-238`) breaks up the gold body nicely and ties
  to the pink room theme without pulling in a new constant.

## Verdict

**ITERATE** — weighted score 83.4 is below the ship gate of 88. No 🔴 blockers, but
four 🟡 findings (arm/body intersection, facing-relative hair sway, ankle
step-vs-taper, ankle tint-table inconsistency) should be addressed before F3.2 can
sign off. The primary-weighted dimensions (proportions, micro-animations,
performance, refinement) all land in the 82–94 range — the ceiling is just held
down by the arm geometry bug and the hair sway axis issue. Fix those two in F3.3
and this should clear 88.
