# F3.8 Eval — Reviewer B (full rubric re-score)

Scope: re-score the full 8-dim rubric against F3.7 state (commit `9a1894c`)
for `src/world3d/scene/Door.tsx` + `src/world3d/scene/Walls.tsx`.

## Hard-constraint audit

- **[PASS] Character unchanged (rig refs still valid).** `git show --stat 9a1894c`
  lists only `constants.ts`, `Door.tsx`, `Walls.tsx`. `Character.tsx` not in
  the diff; `CHARACTER.scale = 0.9` at `constants.ts:125` unchanged; collider
  radius `0.28` unchanged.
- **[PASS] Frozen constants intact.** `git diff 9a1894c~1 9a1894c -- constants.ts`
  is purely additive: new `DOOR_POLISH` block (`constants.ts:86-107`) and
  `WALL_POLISH` block (`constants.ts:110-121`) inserted between the existing
  `DOOR` and `CHARACTER` blocks. `FOLLOW`, `CAMERA`, `FP`, `INTRO`, `ROOM`,
  `GAP`, `DOOR` all untouched.
- **[PASS] flatShading on every new material.** Door.tsx every
  `<meshPhongMaterial>` has `flatShading` — lines 269, 274, 284, 293, 301,
  306, 312, 322, 330, 343, 354, 366, 372, 377, 383, 392, 398, 410, 416, 425,
  429, 440, 445, 455, 462. Walls.tsx lines 87, 97, 108, 151, 160, 174, 180,
  190. No outliers.
- **[PASS] Zero useFrame allocation — Door.tsx (line-by-line, L109-147):**
  - L110 scalar `target`
  - L112 scalar `factor`
  - L113 scalar add
  - L114 scalar assign to `.rotation.y`
  - L115 scalar `t = clock.getElapsedTime()`
  - L117-119 `wave`, `pulse`, `s` scalars
  - L120-125 three scalar assigns to `lockGroupRef.current.scale.{x,y,z}`
  - L126-128 material cast + scalar `emissiveIntensity` assign
  - L129-131 same for shackle
  - L134-140 scalar `freq`, `s`, three scalar assigns to lanternGroup scale
  - L141-146 scalar `freq`, `base`, scalar `emissiveIntensity` assign
  - No `new THREE.*()`, no array/object literal, no `.copy()`/`.set()` that
    would need a temp. Cast-to-`MeshPhongMaterial` is a TS noop at runtime.
    **Clean.**
- **[PASS] Zero useFrame allocation — Walls.tsx.** No `useFrame` in the file
  at all. Walls are static. Trivially zero.
- **[PASS] mulberry32 used.** `Door.tsx:9` imports `makeRng` and calls it at
  `Door.tsx:77` for per-door panel tints. `Walls.tsx:10` imports it; used at
  `Walls.tsx:220` for per-segment wall tints and `Walls.tsx:275` for wall
  prop placement. No `Math.random` in either file (grep: 0 hits).
- **[PASS] Collider registrations intact.** `Door.tsx:92-107` still registers
  `door-${roomId}` while locked and unregisters on unlock; `Walls.tsx:73-76`
  still calls `registerCollider({ id, x, z, hx: w/2, hz: d/2 })` on every
  `WallStrip` mount and unregisters on unmount. No change in effect shape
  vs F3.5.
- **[PASS] Scope: no frozen-file edits.** `git show --stat 9a1894c`:
  ```
   src/world3d/constants.ts    |  38 +++++++
   src/world3d/scene/Door.tsx  | 270 +++++++++++++++++++++++++++++++++++---------
   src/world3d/scene/Walls.tsx | 269 ++++++++++++++++++++++++++++++++++++++-----
  ```
  No `rooms.ts`, no `CameraController`, no `PlayerController`, no HUD, no
  store. Util untouched (mulberry32 already existed at `util/rand.ts`).

**All hard constraints pass. No automatic 🔴.**

## Rubric scores

Character refinement is N/A for this tick; total weight reduces from 100 → 90
and the final is renormalized by ×(100/90).

| Dimension | Score | Weight | Weighted | Justification |
|---|---|---|---|---|
| Material variation | 92 | 15 | 13.80 | Per-segment wall tints via mulberry32 accentMix 0.08 + ±0.12 L jitter + ±0.04 rad hue drift (`Walls.tsx:219-260`); per-door 3-strip wood tints + mullion + inset panel (`Door.tsx:76-88`); frame molding in a lighter wood (`Door.tsx:22` = #8a6732); accent stripe in per-room color. walls-overview shows pink/blue/green/gold room-side tints reading clearly. No uniform-brown slab. |
| Edge / silhouette pop | 91 | 15 | 13.65 | drei `<Edges>` on every body mesh: wall strip body + baseboard + cap (`Walls.tsx:89,100,111`), frame posts + moldings + baseboards + lintel + lintel trim, panel rails + inset + mullion + knob escutcheon + knob sphere, lock body + shackle, lantern cap + body + chain. Theme-aware edge color (`EDGE_DARK/EDGE_LIGHT`). Baseboards and top cap clearly outlined in walls-closeup. Knob now 1.5× and outlined — finally reads at game distance. |
| Proportions | 88 | 15 | 13.20 | 3-strip door panel (rail/field/rail) with distinct mass; inset panel + center mullion break up the slab read; baseboard 0.14 + cap 0.08 + TRIM_PAD 0.03 wider than the wall body gives a clear trim tier instead of equal thickness. Lintel + lintel trim overlap closes the F3.6 gap (`Door.tsx:171-176` — trim bottom at 0.09, lintel top at 0.11, 0.02 overlap). Minor nit: main wall body is still a flat 0.1-thick slab so from the extreme closeup the "wall is a box" read is still there, but at normal game distance the trim stack sells it. |
| Micro-animations | 90 | 15 | 13.50 | Lantern body + group breathe at ±5% scale sync'd with emissive (`Door.tsx:134-146`), freq differs by lock state (1.2 unlocked / 2.5 locked). Lock body + shackle pulse as one group via shared `lockGroupRef` (`Door.tsx:120-131`) — exactly the fix F3.6 asked for. Hinge swing framerate-independent via `1 - exp(-k*dt)`. All within ±5% / subtle — no distraction. |
| Color harmony | 89 | 10 | 8.90 | Panel base shifted to `#5a2814` deep red-brown (`Door.tsx:27`) gives a clear value+hue separation from the neutral brown walls (`WALL_POLISH.baseColor = #3d2817`). Per-room accent (pink/blue/green/gold) is wired into both the wall tint (low accentMix 0.08 so it reads as a hint, not a costume) and the door's emissive stripe/hint. Warm `#ffb060` spill light (`DOOR_POLISH.spillLight`) inside the arch harmonizes with the existing `LIGHTS.ambient = #ffd8a8`. Lock red vs lantern warm amber reads correctly in `screenshot-door-locked.png`. |
| Clutter / props | 82 | 10 | 8.20 | Per-door doormat (`Door.tsx:328-332`) visible in all closeups, tinted in a desaturated version of the room accent. 16 wall props (`Walls.tsx:274-310`) — sconces/pictures/vines across the 8 long horizontal strips. walls-overview clearly shows a picture frame (top-center) and vines on the divider walls. Slight deduction: some props are small at the current camera distance and the vine is a single thin box — functional but thin. Still a dim >70% — no 🟡. |
| Character refinement | N/A | 0 | — | Doors + walls tick. Character.tsx not touched; not in scope. Redistribute weight via ×(100/90). |
| Performance feel | 93 | 10 | 9.30 | Zero useFrame allocation verified above. All derived arrays in `useMemo` with stable deps: `panelTints` (`Door.tsx:76-88`, dep `[roomId]`), `matColor` (`Door.tsx:232-239`), wall `tints` (`Walls.tsx:219-260`, dep `[]`), `wallProps` (`Walls.tsx:274-310`, dep `[segLen]`). Only net additions: 2 point lights per door (lantern + spill) × 4 doors = 8 pointlights, plus ~16 small static prop meshes and ~24 trim meshes. Draw-call growth well under the 30% budget. No shader recompiles. |

**Raw weighted sum: 13.80 + 13.65 + 13.20 + 13.50 + 8.90 + 8.20 + 9.30 = 80.55 / 90**

**Renormalized to /100: 80.55 × (100/90) = 89.50**

**Weighted average: 89.5 / 100**
**Ship gate (≥88 AND no 🔴 AND no dim <70%): CLEAR.** Min dim = Clutter 82% ≥ 70%.

## F3.7 visual audit

- **Per-room hue variation:** VISIBLE in `screenshot-walls-overview.png`. Left
  side walls carry a distinct pink/green lean (My Room / Book Room accents),
  right side reads warmer gold/blue (Idea Lab / Product). The effect is
  deliberately subtle (accentMix 0.08) but clearly non-uniform vs F3.6's
  single-brown read. Vertical dividers also inherit the adjacent room's
  accent.
- **Baseboard + top cap:** VISIBLE in `screenshot-walls-closeup.png`. Thicker
  baseboard (0.14 vs F3.6 0.06) sits darker than the wall body with a clear
  Edges outline. Top cap (0.08) is a lighter register. Three distinct tiers
  read cleanly at game distance — the F3.6 "trim is invisible" complaint is
  resolved.
- **Door reads as an object, not a hole:** YES. `screenshot-door-locked.png`
  and `-door-unlocked.png` both show: (a) frame posts with contrasting
  lighter-wood moldings, (b) lintel + overhanging lintel trim (no visible
  gap, the F3.6 gap critique is fixed), (c) 3-strip slab with visible
  mullion + inset panel rectangle, (d) knob sphere+escutcheon at ~0.085
  radius that actually reads, (e) lantern with cap / body / chain / finial
  hanging above, (f) doormat on the hallway floor. None of the F3.6
  "looks like a doorway cutout" read remains.
- **Lock-state affordance:** YES. `-door-locked.png` shows a clear red
  padlock glyph (body + shackle) above the arch AND a red-leaning lantern
  body; `-door-unlocked.png` shows the green checkmark glyph + warm
  gold-yellow lantern. Without reading the HUD prompt, you can tell
  locked-vs-unlocked at a glance from color + glyph.
- **Warm spill glow:** VISIBLE in the door closeups. The inside of the arch
  carries a warm `#ffb060` pool spilling into the hallway floor tiles and
  lifting the inside edge of the frame. Not blown out — tuned to intensity
  0.9 / distance 3.2 which is roughly half the lantern's reach. The F3.6
  "flat lighting at the threshold" critique is resolved.
- **Shackle + lantern pulse:** Confirmed wired correctly in the locked
  screenshot (both burn hot) and in code: `lockGroupRef` drives scale on
  both body and shackle as one group (`Door.tsx:120-125`), and the two
  emissive intensities are both set to the same `pulse` scalar (`:127,130`)
  so they're phase-locked to the same `Math.sin(t*3)`. Lantern body runs on
  its own (faster) frequency, which is a deliberate contrast. Previously
  the F3.6 complaint was that body/shackle drifted out of sync; that is
  fixed.
- **Per-door doormat:** VISIBLE on all 4 doors. Size is 1.2 × 0.6, tinted in
  a desaturated HSL-derived version of each room's accent (`Door.tsx:232-239`),
  with an edges outline. Reads as a soft rug at the threshold.

## New findings

### 🔴 Critical
- (none)

### 🟡 Iterate (dim <70%)
- (none — lowest dim is Clutter at 82%)

### 🔵 LGTM
- `Door.tsx:120-131` — single `lockGroupRef` + shared scalar `pulse` + shared
  scalar `s` is the right fix for the F3.6 "shackle drifts" finding: zero
  allocation, zero vector math, phase lock is structural.
- `Walls.tsx:219-260` — per-segment tint generation lives in `useMemo([])`
  with per-segment deterministic advance of a single `rng()` sequence. New
  segment additions preserve determinism as long as insertion order is
  stable. Clean pattern.
- `Door.tsx:256-262` — `insideSignX/Z` spill-light placement is a clean
  generalization over horizontal+vertical door orientations. Reads once at
  render, never per-frame.
- `Walls.tsx:274-310` — `wallProps` is memoized on `[segLen]` (effectively
  constant). Pool is a small literal array. Re-entry is cheap.
- Frame molding color `#8a6732` (`Door.tsx:23`) is a well-picked ~15% lighter
  shift from the base frame `#6b4e1f`. That value separation is what sells
  the "crafted frame" read at distance.

## Verdict

- **PASS**
- All 8 hard constraints pass, weighted average is 89.5/100, minimum
  dimension 82% (Clutter), the F3.6 designer's four critical calls
  (missing frame/knob/lock-affordance, invisible wall trim, flat threshold
  lighting, shackle-lantern drift) are all resolved on screen and in code.
  Ship gate clear — no iteration needed on F3.8.
