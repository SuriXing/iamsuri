# F3.4 Eval — Reviewer A (findings resolution audit)

Scope: confirm F3.3 fixes resolved the F3.2 findings on
`src/world3d/scene/Character.tsx`. Commits audited: `a78a1e3` +
`f17a4e7` (concurrent/additive fix pass). Current file state read at
`src/world3d/scene/Character.tsx:1-362`.

## Findings resolution table

### From eval-designer.md (was 🔴 FAIL 59/100)

| Finding | Status | Evidence |
|---|---|---|
| Silhouette dead at game distance (lower body dissolves, only 3 meshes outlined) | **resolved** | `Character.tsx:179,185,226,232,238,248,253,258,270,275,284,292,303,308,319,324,330,335,343,348` — 20 Edges calls cover head-upper, jaw, hair cap, hair tuft, hair fringe, bow ×3, body-top, body-mid, lab coat, scarf, arms ×2, thighs ×2, shins ×2, shoes ×2. Edge color `EDGE_DARK` bumped to `#0a0a14` (`Character.tsx:31`) for higher contrast vs dark-theme ambient. Lower body is now fully outlined — the "mushy dark blob" is gone. |
| No signature element visible at 40px | **resolved** | Two signature moves both added. (a) Pink emissive hair bow — 3 cubes at `Character.tsx:245-259` (wing+knot+wing), `COLORS.pink` + `emissiveIntensity=0.4`, all outlined. (b) Lab coat hero panel `Character.tsx:281-285`, white `#f5f5f5` in dark theme / `#e8e3d5` in light theme, `0.42 × 0.40` front panel — reads as "scientist" at any distance. Screenshot `.harness/nodes/F3.3/run_1/screenshot-character.png` confirms both elements clearly visible mid-dialogue at follow-cam distance. |
| Hero color commits against environment (yellow body camouflages vs gold signage) | **resolved** | White lab coat (`Character.tsx:281-285`) is now the dominant front-facing block covering `y=0.86–1.26`, which is exactly the shoulder-to-waist silhouette the camera reads. The gold body is still present on shoulders + sides but is visually subordinate to the white hero panel. Pink bow + pink scarf provide secondary emissive focal anchors. Screenshot confirms strong white-on-dark pop. |
| Chibi head:shoulder ratio 1:1 (reads as adult miniature, not mascot) | **resolved** | Head widened from 0.42 → 0.54 (`Character.tsx:177`) and jaw from 0.36 → 0.48 (`Character.tsx:183`). Shoulder width unchanged at 0.42 (`Character.tsx:268`). New ratio 0.54/0.42 = **1.29×**, lands inside the 1.2–1.4× chibi sweet spot the designer asked for. Hair cap (`:224`) widened to 0.58 to wrap the bigger head. |

### From eval-architect.md (was 🔵 PASS 88/100 with 3 🟡)

| Finding | Status | Evidence |
|---|---|---|
| Legs taper same-thickness slab (ankle 0.1-tall invisible at game distance) | **resolved** | Ankle blocks deleted entirely. Legs now thigh `0.14 × 0.30 × 0.14` (`Character.tsx:317,322`) + shin `0.12 × 0.18 × 0.12` (`Character.tsx:328,333`). Width delta 0.14 → 0.12 (14% narrower) is visibly larger than the old 0.14 → 0.11 step, and the shin lives in the visible upper-leg range rather than the sub-pixel ankle zone. Shin tints also darker via `jitter() - 0.03` (`Character.tsx:149-150`) for a secondary shading cue. |
| Scarf missing Edges outline | **resolved** | `<Edges color={edgeColor} lineWidth={1.5} />` added to the scarf mesh at `Character.tsx:292`, inside the scarf meshPhongMaterial block at `:289-293`. |
| HAIR_HILITE delta too low; ankles/tuft bypass tints | **resolved** | (a) `HAIR_HILITE` bumped from `#2d2440` to `#3a2f52` at `Character.tsx:23` (comment explicitly notes "bumped from 6% → 12% L delta"). (b) Top tuft now reads `tints.hairTuft` at `Character.tsx:231` (was raw `HAIR_HILITE`). (c) Ankles gone; the replacement shins read `tints.shinL`/`tints.shinR` at `Character.tsx:329,334`, and those entries exist in the tints memo at `Character.tsx:149-150`. Every body/leg cube is now routed through the tint table. |

### From eval-designer-craft.md (was 🟡 89/100)

| Finding | Status | Evidence |
|---|---|---|
| Z-fight mouth/blush at z=0.20 (coplanar with head front face) | **resolved** | Mouth pushed to `z=0.225` at `Character.tsx:204`, both blush cubes to `z=0.225` at `Character.tsx:209,213`. Comment at `:201-203` explicitly notes "front face (0.235) sits 0.005 proud of the head upper front face (0.23)." Head upper depth is `0.46` centered at z=0 (`Character.tsx:177`) → front face at z=0.23, so mouth/blush front at 0.235 is 0.005 proud. Fix applied exactly as craft review recommended. |
| No shininess variation across material families | **resolved** | `shininess={8}` added to hair cap (`:225`), hair tuft (`:231`), hair fringe (`:237`) and scarf (`:291`) for matte cloth read. `shininess={60}` added to shoe soles (`:342,347`) and toe-caps (`:353,357`) for leather sheen. Skin/body left at default. Exactly the material-family split the craft reviewer specified. |
| Edges missing jaw + body-bottom | **resolved** | Jaw Edges at `Character.tsx:185` (inside jaw mesh at `:182-186`). Body-bottom (body-mid) Edges at `Character.tsx:275` (inside body-mid mesh at `:272-276`). Upper-body silhouette density now includes the waist→leg transition. |
| Hair fringe vs hair cap lightness delta ~2% (recommended jitter + 0.08) | **partially resolved** | Fringe lift still uses `jitter() + 0.02` at `Character.tsx:146` — the specific nudge wasn't bumped to +0.08 as the craft reviewer recommended. HOWEVER: the separation is now carried by two other changes: (a) fringe has its own Edges outline at `:238` which gives it an explicit silhouette break from the cap, (b) `HAIR_HILITE` was bumped so the tuft vs cap axis is louder, distracting from the fringe-vs-cap equivalence. The overall "hair reads as layered" effect lands in the screenshot, but the specific jitter delta is still 2%. Low-severity residual. |

### From eval-designer-motion.md (was 🟡 83.4/100)

| Finding | Status | Evidence |
|---|---|---|
| Arms intersect body-mid at y=1.05 (arms span 0.825–1.275, body-mid spans 0.80–1.12) | **resolved** | Arms Y unchanged at `y=1.05` (`Character.tsx:300,305`) but X pulled outward from `±0.25` → `±0.32`. Body-mid is `0.36` wide (half 0.18, `Character.tsx:273`). Arm inner face at `0.32 - 0.05 = 0.27` → `0.09` clearance to body-mid side. The Y-range overlap no longer produces a geometric intersection because the arms are fully outboard of the torso on the X axis. Comment at `Character.tsx:295-299` explicitly notes this ("~0.05 gap — prevents the 'arms glued to torso' silhouette and kills any grazing z-fight risk"). Motion review's primary concern was z-fight, which is now impossible. |
| Hair sway uses world dx not character right | **resolved** | `Character.tsx:112-121` now projects `(dx, dz)` onto the character right-vector: `const lateral = dx * Math.cos(facing) - dz * Math.sin(facing);`. Comment at `:107-111` explicitly describes the fix ("strafing while facing any direction produces sway but pure forward walking does not"). Zero-alloc scalar math preserved. Exactly the fix the motion review prescribed. |
| Ankle blocks don't taper (read as stacked segments) | **resolved** | Ankle blocks deleted. Replacement shins (`0.12` vs thigh `0.14`) provide a wider width delta at a bigger mesh height (`0.18` vs old ankle `0.10`), so the taper is actually visible at game distance. |
| Ankle blocks bypass mulberry32 tints | **resolved** | Ankles gone; shins routed through `tints.shinL`/`tints.shinR` at `Character.tsx:329,334`, memo entries at `:149-150`. All 15 tinted slots in the memo are now consumed (`headTop, jaw, bodyTop, bodyMid, armL, armR, hairCap, hairTuft, hairFringe, thighL, thighR, shinL, shinR, shoeL, shoeR`). Only toe-caps still use raw `TOE_CAP` (`:353,357`) but that's a deliberate contrast accent, not a missed slot. |

## Hard-constraint regression check

- **[pass] CHARACTER.scale = 0.9**: `src/world3d/constants.ts:87` still `scale: 0.9`; applied at `Character.tsx:168` as `<group ref={groupRef} scale={CHARACTER.scale}>`. `git diff 0265c46..HEAD -- src/world3d/constants.ts` is empty.
- **[pass] colliderRadius = 0.28**: `src/world3d/constants.ts:94` still `colliderRadius: 0.28`. Untouched by either F3.3 commit. Shadow disc still reads `CHARACTER.shadowRadius` at `Character.tsx:164`.
- **[pass] Rig refs preserved**: all six originals still declared and populated — `groupRef` (`:47,168`), `headRef` (`:48,174`), `armLRef` (`:49,300`), `armRRef` (`:50,305`), `shadowRef` (`:51,160`), `smoothFacingRef` (`:53,75,87`). New additive refs (`blinkRef`, `hairGroupRef`, `hairSwayRef`) at `:56-58` — no replacements. All still mutated in useFrame (lines 79–120).
- **[pass] flatShading on all materials**: every `meshPhongMaterial` in the file carries `flatShading` — verified at lines 178, 184, 193, 197, 206, 211, 215, 225, 231, 237, 247, 252, 257, 269, 274, 283, 291, 302, 307, 318, 323, 329, 334, 342, 347, 353, 357. Only non-Phong material is the shadow disc `meshBasicMaterial` (`:165`) which is flat unlit — doesn't need the flag.
- **[pass] Zero useFrame allocation**: useFrame body (`Character.tsx:61-122`) is exhaustively scalar: primitive math, ref reads, ref writes, `Math.cos/sin/exp`, `clock.getElapsedTime()`, `useWorldStore.getState()` destructure (non-allocating). No `new THREE.*`, no array/object literals, no `.clone()`. The new hair-sway projection math (`:113-115`) adds two scalars — still zero-alloc. The one `THREE.Color` lives in `tintHex` at `:38`, called only from `useMemo` at `:134-154` (once per mount).
- **[pass] mulberry32 (no Math.random)**: `import { makeRng }` at `:7`; `makeRng(0xC4A87EE)` at `:135` inside `useMemo`. Grepped — no `Math.random()` anywhere in Character.tsx.
- **[pass] No frozen-file edits**: `git diff 0265c46..HEAD --stat` shows only `src/world3d/scene/Character.tsx` + screenshots/script in `.harness/`. `constants.ts`, `CameraController.tsx`, `PlayerController.tsx`, `colliders.ts`, `worldStore.ts`, HUD files, `rooms.ts` — all untouched.

## New issues introduced (if any)

### 🔴 Critical
- (none)

### 🟡 Iterate
- **`Character.tsx:146` — hair fringe jitter delta still only +0.02** (not bumped to +0.08 as craft review recommended). Not a blocker — the added fringe Edges outline and bumped HAIR_HILITE cover most of the separation deficit, but the specific craft recommendation was partially adopted. If a future polish pass wants full compliance, change `jitter() + 0.02` to `jitter() + 0.08`.

### 🔵 LGTM
- **Edges density on the lab coat + bow** — the new hero element carries a lineWidth=1.5 outline (`Character.tsx:284`) and the bow's three cubes each carry Edges (`:248,253,258`). Both the hero panel and the signature accent survive at game distance, as the screenshot confirms. The lineWidth bump from `1` → `1.5` across the board is also the right move for the darker new EDGE_DARK — fatter strokes compensate for the lower-contrast edge color against the darker background.
- **Hair sway fix is the cleanest change in the diff** — the projection `dx * Math.cos(facing) - dz * Math.sin(facing)` adds two scalar mults + one subtract, still zero-alloc, and fixes the "forward walk → no hair motion" bug the motion reviewer flagged. Comment at `:107-111` matches the implementation exactly.
- **Lab coat theme-reactive color** (`Character.tsx:28-29,128,283`) — theme selector already existed for edges, adding `labCoatColor` reuses the same re-render path. Zero per-frame cost.
- **Shin tint rule** — using `jitter() - 0.03` for shins (`:149-150`) to make them read slightly darker than thighs is a nice touch that reinforces the taper silhouette with a shading cue. Zero cost.
- **Arm X position** — pulling arms out to `±0.32` gives a ~9px lateral gap at follow-cam distance, which is exactly what was needed to kill the geometric overlap without making the silhouette look T-posed.
- **mouth/blush z=0.225 comment** at `:201-203` is clear and states the 0.005 clearance over the head front face — good evidence trail for the next reviewer.

## Verdict

- **PASS**
- All 15 findings across 4 eval files are addressed in the F3.3 diffs — 14 fully resolved, 1 partially (hair fringe jitter delta — low severity, compensated by other changes). No hard-constraint regressions. No new issues introduced. The designer's 🔴 FAIL 59 root cause (polish invisible at game distance) is definitively fixed: the screenshot shows a recognizable chibi scientist silhouette with lab coat hero + pink bow signature + outlined legs, not a yellow slab with sub-pixel details.
- **Resolution rate: 14 of 15 findings fully resolved, 1 partially resolved (15/15 addressed)**
