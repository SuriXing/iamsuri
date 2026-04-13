# F3.2 Eval — Reviewer A (craft + materiality)

Scope: Reviewer A (craft + materiality angle). Independent of Reviewer B
(proportions + animation). Screenshot reviewed:
`.harness/nodes/F3.1/run_1/screenshot-character.png`. Commit under review:
`0265c46`.

## Hard-constraint audit
- **pass** CHARACTER.scale = 0.9 unchanged — `src/world3d/constants.ts:87`
  still reads `scale: 0.9`; `Character.tsx:155` applies it as
  `<group ref={groupRef} scale={CHARACTER.scale}>`. Diff did not touch
  constants.ts.
- **pass** Collider radius unchanged — `src/world3d/constants.ts:94` still
  reads `colliderRadius: 0.28`. Untouched by the commit.
- **pass** Rig refs preserved — `groupRef` (`Character.tsx:43`), `headRef`
  (`:44`), `armLRef` (`:45`), `armRRef` (`:46`), `shadowRef` (`:47`) all
  declared and populated in JSX (`:147`, `:155`, `:157`, `:241`, `:245`).
  Existing useFrame mutations on them retained at lines 74, 85, 91, 92, 93.
- **pass** flatShading on all materials — every `meshPhongMaterial` in the
  file carries `flatShading`: lines 162, 168, 175, 179, 186, 191, 195, 203,
  209, 214, 225, 230, 237, 243, 247, 253, 257, 262, 266, 272, 276, 281, 285.
  Only non-Phong material is the shadow disc's `meshBasicMaterial`
  (`:152`), which is a flat unlit disc and does not require the flag.
- **pass** Zero per-frame allocation in useFrame — the entire useFrame body
  (`Character.tsx:57-113`) contains only primitive arithmetic, ref reads,
  and ref writes. No `new THREE.Vector3()`, `new THREE.Color()`, `.clone()`,
  object literals, or array literals. Scratch state lives in pre-allocated
  refs (`smoothFacingRef`, `lastPosRef`, `hairSwayRef`). The one ephemeral
  `THREE.Color` allocation in `tintHex` (`:34`) is called only from the
  `useMemo` at `:124-141`, which runs once at mount — not per frame.
- **pass** mulberry32 used — `import { makeRng }` at `Character.tsx:7`;
  `makeRng(0xC4A87EE)` seeded inside the memo at `:125`. No `Math.random()`
  anywhere in the file.

## Scores
| Dimension | Score | Justification |
|---|---|---|
| Material variation (15) | 85/100 | Per-cube `±4% L` tint table at `:124-141` gives every head/hair/body/limb/shoe cube a unique hue — exactly the "not stamped from uniform slabs" the brief asked for. Deterministic via mulberry32. flatShading preserved everywhere. Minor gap: all materials are `meshPhongMaterial` with default shininess — the brief explicitly asked for "specular/shininess varied across material families" to differentiate fabric vs skin vs leather. No `shininess=` prop is set anywhere, so wool scarf, hair, skin and leather shoes all read with identical specular response. |
| Edge / silhouette pop (15) | 82/100 | `<Edges>` with theme-aware color applied to head (`:163`), hair cap (`:204`), and body-top (`:226`) — the three largest silhouette blocks. Theme-reactive edge color (`:117-118`) is clean. In the screenshot the head and hair silhouette pop cleanly against the warm bronze background. Gap: no Edges on the jaw (`:166-169`), body-bottom (`:228-231`), or shoes — the waist-to-leg transition in the screenshot reads softer than the head-to-shoulder transition. The shadow disc on dark floor is also unoutlined so the character's ground contact point is slightly ambiguous. |
| Proportions (15) | 85/100 | Secondary dimension — deferring to Reviewer B. Head 0.42 wide over 0.36 jaw reads chibi; body taper 0.42 → 0.36 and ankle narrower than thigh both register. Arm 0.1×0.45×0.1 is appropriately thin now. No equal-slab look. |
| Micro-animations (15) | 88/100 | Secondary — deferring to Reviewer B. Deterministic blink (4s/120ms, `:97-101`), clamped lateral hair sway (`±0.06 rad`, `:106-112`), and preserved idle arm/head motion are all zero-alloc and read as life. Hair sway driving off world-space `dx` rather than local body-frame velocity is a minor correctness note but decorative-only. |
| Color harmony (10) | 90/100 | Palette is tight: gold `BODY_TOP`/`BODY_BOTTOM`, dark purple hair, skin `#ffcc99`, pink `COLORS.pink` scarf, red `COLORS.red` shoes + `TOE_CAP #b02940`, red mouth, `#ffaaaa` blush. The pink scarf (`:237`) is the keystone — it bridges gold torso to skin face and pre-echoes the red shoes, so the red doesn't read as disconnected. `HAIR_DARK #1e1a2e` plus `HAIR_HILITE #2d2440` both sit in the same hue family as the global `COLORS.bg #1a1a2e`, which keeps the hair from fighting the background. |
| Clutter / props (10) | 100/100 | N/A for the Character unit. |
| Character refinement (10) | 90/100 | Every box earned its place: stacked head+jaw trapezoid (`:160-169`), top tuft + front fringe for hair volume (`:207-215`), scarf band (`:235-238`), ankle taper (`:260-267`), contrasting toe-caps (`:279-286`), blush (`:189-196`), blink (`:172-181`). Reads as crafted, not stamped. |
| Performance feel (10) | 100/100 | useFrame is demonstrably zero-alloc (`:57-113`), derived arrays/tints memoised (`:124-141`), theme bound via store selector so the only re-render is on theme flip (`:117`). No new materials/meshes per frame. No red flags. |

**Weighted average: 89.0 / 100**

Arithmetic:
`(85×15 + 82×15 + 85×15 + 88×15 + 90×10 + 100×10 + 90×10 + 100×10) / 100`
`= (1275 + 1230 + 1275 + 1320 + 900 + 1000 + 900 + 1000) / 100 = 8900 / 100 = 89.0`

## Findings

### 🔴 Critical
- (none)

### 🟡 Iterate
- **`Character.tsx:184-196` — coplanar face features risk z-fight under orbit.**
  Head front face is at `z = +0.20` (position `z=0` + half of `0.4` depth).
  Mouth (`:184` `position=[0, 1.36, 0.19]`, depth `0.02`) and both blush
  cubes (`:189`, `:193` `position z=0.19`, depth `0.02`) have their front
  face at exactly `z = 0.20` — coplanar with the head. The eyes (`:173`,
  `:177` at `z=0.2`, depth `0.02`) are `+0.01` proud of the head and safe.
  Screenshot renders fine at rest, but under camera orbit / perspective
  shifts this is textbook z-fighting waiting to flicker.
  **Fix:** push mouth and blush forward by `+0.005` to `z=0.195` (front
  face at `0.205`), matching the eyes' clearance.

- **`Character.tsx:162,168,175,179,186,191,195,203,209,214,225,230,237,243,247,253,257,262,266,272,276,281,285` — no shininess variation across material families.**
  Every material is `meshPhongMaterial` with default shininess (`30`).
  The brief (`plan.md:20-21`) explicitly calls out "vary specular and
  shininess to differentiate wood / metal / fabric." Shoes (leather),
  scarf (fabric), hair, and skin should not all reflect the same
  highlight.
  **Fix:** add `shininess={8}` to the scarf (`:237`) and hair meshes
  (`:203`, `:209`, `:214`) for a matte cloth/felt read; add
  `shininess={60}` to shoe sole + toe-cap (`:272`, `:276`, `:281`,
  `:285`) for a leather sheen; leave skin/body at default. Zero runtime
  cost, pure material-prop change.

- **`Character.tsx:163, 204, 226` — selective Edges only cover 3 silhouette blocks.**
  Edges are on head, hair cap, and body-top — but the jaw (`:166`) and
  body-bottom (`:228`) do not get them. In the screenshot the
  head→shoulder silhouette reads crisp while the waist→leg transition is
  softer, so the lower body feels slightly more "prototype" than the
  upper body. The brief wants "outline pop on key silhouettes" and the
  waist block is a key silhouette.
  **Fix:** add `<Edges color={edgeColor} lineWidth={1} />` to the jaw
  mesh (`:166`) and body-bottom mesh (`:228`). Two extra `<Edges>` is
  negligible perf cost. Leave legs/shoes un-edged so the focal density
  stays at the upper body.

- **`Character.tsx:135` — hair fringe vs hair cap lightness delta is ~2% and barely separates.**
  `hairFringe` uses `jitter() + 0.02` on top of `HAIR_DARK #1e1a2e`
  while `hairCap` uses straight `jitter()`. With jitter at `±4% L`, the
  expected separation between fringe and cap is `~2% L` — visually
  indistinguishable in the screenshot. The front fringe is supposed to
  read as a separate plane catching the forehead light.
  **Fix:** bump to `jitter() + 0.08` so the fringe is reliably `~8% L`
  lighter than the cap. `HAIR_HILITE` (`#2d2440`, used on the top tuft
  at `:209`) could also be upgraded — it's only `~5% L` above `HAIR_DARK`.

### 🔵 LGTM
- `Character.tsx:33-40` `tintHex` lives outside `useFrame` and is only
  called inside the `useMemo` at `:124-141`, so the one `THREE.Color`
  allocation per cube is amortized once at mount. Correctly reasoned in
  the comment at `:31-32`.
- `Character.tsx:125` seed `0xC4A87EE` makes the tint table stable across
  sessions without any state-file — exactly the "deterministic per-instance
  variation" the rubric wants.
- `Character.tsx:117-118` theme-reactive `edgeColor` via store selector is
  the right tradeoff: one cheap re-render on theme flip, zero per-frame
  cost. The `EDGE_LIGHT #b8a890` choice for light theme is a warm
  bronze-sand that reads as "hand-drawn linework," not harsh black.
- `Character.tsx:97-101` blink math is branchless and deterministic;
  the 0.12s closure at a 4.0s period (3% duty cycle) is imperceptibly
  natural without being distracting — good timing call.
- `Character.tsx:106-112` hair sway is correctly clamped before the lerp
  so the filter can't overshoot, and it reuses the same `tf` from the
  facing lerp (FPS-independent). Zero allocation.
- `Character.tsx:235-238` the pink scarf is the single best craft choice
  in the unit — it breaks the gold torso horizontally at the neckline,
  adds the only warm-pink accent in the upper half, and reads clearly in
  the dark-theme screenshot despite being a thin 0.05-tall strip, thanks
  to the `emissiveIntensity={0.2}` boost.

## Verdict
- **ITERATE**
- Weighted 89.0 clears the ≥ 88 ship gate and there are no 🔴 critical
  findings, but four 🟡 items (z-fight risk, no material-family shininess
  split, missing jaw/body-bottom edges, under-separated hair fringe)
  should land in F3.3 before this avatar reads as fully crafted rather
  than merely "close."
