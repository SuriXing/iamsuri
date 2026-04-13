# F3.2 Character Review — Architect

Reviewing `src/world3d/scene/Character.tsx` at commit `0265c46` (F3.1 polish pass), against `.harness/acceptance-criteria.md` and `.harness/nodes/F3.1/run_1/screenshot-character.png`.

## Code-Quality Must-Checks (pre-rubric gate)

1. No `new THREE.*()` inside `useFrame` — 🔵 PASS. The only `new THREE.Color()` lives in `tintHex` (`Character.tsx:33-40`), called exclusively from the `useMemo` at `Character.tsx:124-141`. Frame loop (`Character.tsx:57-113`) does scalar writes only.
2. Store reads in `useFrame` use `useWorldStore.getState()` — 🔵 PASS. `Character.tsx:59` uses imperative getState; the only selector is `theme` at `Character.tsx:117`, correctly kept at component top.
3. `flatShading: true` on every `meshPhongMaterial` — 🔵 PASS. All 22 phong materials in the JSX tree carry the prop (head, jaw, eyes×2, mouth, blush×2, hair cap/tuft/fringe, body×2, collar, arms×2, thighs×2, ankles×2, shoes×2, toe-caps×2).
4. `<Edges>` count ≤ 4 — 🔵 PASS. Three in total: head top (`:163`), hair cap (`:204`), body top block (`:226`). One slot still free.
5. Frozen constants untouched — 🔵 PASS. `CHARACTER.scale` read at `:155`, `bobAmp/bobFreq/swayAmp/swayFreq/shadowRadius` read in frame loop, `colliderRadius` never referenced. `src/world3d/constants.ts` not mutated.
6. Six original refs still present and used — 🔵 PASS. `groupRef, headRef, armLRef, armRRef, shadowRef, smoothFacingRef, lastPosRef` all declared at `:43-50` and all driven inside `useFrame`. New refs (`blinkRef, hairGroupRef, hairSwayRef`) are additive, not replacements.

All hygiene gates clear. Proceed to rubric.

## Material Variation (15)
🔵 Score: 13/15

Deterministic mulberry32 tint table at `:124-141`, seeded off `0xC4A87EE`, pushes 12 cubes through a ±4% L jitter via `tintHex` HSL roundtrip. Memoised once — zero per-frame cost. Body uses a real `BODY_TOP`/`BODY_BOTTOM` two-hex gradient (`:20-21`) rather than one flat slab. Hair has `HAIR_DARK`/`HAIR_HILITE` differentiation. Shoes get `COLORS.red` sole vs darker `TOE_CAP = '#b02940'` front plate. Skin jaw is tinted −0.02 darker than head top — a deliberate choice, not jitter.

Docked 2 points: the ankles (`:262, :266`) and the top hair tuft (`:209`) bypass the `tints` table and use raw `LEG` / `HAIR_HILITE` literals, so the jitter system is 12-of-16 rather than complete. Minor asymmetry, not a defect.

## Edge / Silhouette Pop (15)
🔵 Score: 13/15

Three `<Edges>` placed on the three biggest silhouette-defining boxes: head top, hair cap, upper body. Correct picks — those are what read from the follow-cam distance in the screenshot. Edge color is theme-reactive via `edgeColor = theme === 'dark' ? EDGE_DARK : EDGE_LIGHT` (`:117-118`), recolored on theme flip via a single selector → one re-render per toggle, not per frame. `lineWidth={1}` consistent across all three.

Docked 2 points: you have budget headroom (3/4 used). The jaw block (`:166`) would give the head a real chin-step silhouette; the scarf (`:235`) would make the accent readable from any angle. One more Edges call is the highest-ROI silhouette move available.

## Proportions (15)
🟡 Score: 11/15

Genuine improvements over the baseline slab:
- Trapezoidal head: 0.42 upper (`:161`) over 0.36 jaw (`:167`) — reads as a jaw step.
- Torso taper: 0.42×0.22 shoulder block (`:224`) over 0.36×0.32 waist block (`:229`) — shoulder→waist gradient + geometric taper reinforce each other.
- Arms dropped to `0.1×0.45×0.1` (`:242, :246`) — real limbs, not oven-mitt slabs.
- Toe-caps extend the shoe forward (`:280, :284`) → shoes have a tip rather than reading as red cubes.

What's still slab-y: the legs. Thigh `0.14×0.32×0.14` (`:251-258`) and ankle `0.11×0.1×0.11` (`:260-267`) are nearly the same width and the 0.1-tall ankle is invisible from the follow-cam distance in the screenshot — it's solving a problem the camera can't see. Either drop the ankle (−2 meshes) or restructure as wider-thigh-top → narrower-calf-bottom so the taper actually reads at game distance. This is why the dimension sits at 🟡 73% rather than 🔵. Above the 70% iterate threshold, so no forced iterate, but it's the #1 fix.

## Micro-animations (15)
🔵 Score: 14/15

Five independent channels driven off a single `useFrame`:
- Smooth-turn facing (`:69-71`) via `lerpAngle` helper (`:11-15`) — fixes the ±π wrap-around that would spin the character the long way around on quick direction flips. k=12 → ~120ms settle, FPS-independent `1 - Math.exp(-k*delta)`.
- Walking bob uses `|sin(t*8)|` for a foot-push pulse (always positive); idle bob uses regular `sin(t*bobFreq)` (oscillates above/below). Mode switched by a movement gate `dx²+dz² > 0.00002` (`:64`). Subtle but correct — walking shouldn't dip the character below ground.
- Idle sway disabled during walk (`:82`) — rotation feels decisive rather than waggly.
- Arm swing (`:90-92`) and head tilt (`:93`) unchanged from baseline.
- Blink at `:97-101` — deterministic 4.0s period, 120ms closure window, scale-Y compression of a wrapper group. Zero alloc.
- Hair sway at `:106-112` — lerps hair-group `rotation.z` toward `-dx * 6.0`, clamped to ±0.06 rad (≈3.4°). Reacts to lateral velocity. Uses the existing `tf` lerp factor.

Docked 1 point: hair sway is clamped to ±0.06 rad, slightly over the rubric's "≤ ±2°" flutter guidance — but hair isn't "flutter," so the larger range is defensible. Also, head-tilt `rotation.z` and hair-group `rotation.z` both drive the same axis; they compose correctly (hair is a descendant of head), but worth noting.

## Color Harmony (10)
🔵 Score: 9/10

Intentional warm triad with a cool anchor:
- Gold body (`#ffe352`/`#e6b800`) + pink scarf (`COLORS.pink`) + red shoes + darker red toe-caps form a warm yellow→pink→red progression.
- Dark purple-black hair (`#1e1a2e`) is desaturated so it anchors without fighting the gold.
- Skin `#ffcc99` bridges yellow body to dark hair.
- Blush `#ffaaaa` with emissive 0.3 ties back to scarf pink.

Docked 1: `HAIR_HILITE = '#2d2440'` is only ~6% lighter than `HAIR_DARK = '#1e1a2e'`. At the screenshot camera distance the tuft is invisible. Push to ~12% delta.

## Accent / Polish (10)
🔵 Score: 9/10

- Pink scarf with `emissiveIntensity={0.2}` (`:237`) — correct intensity for a small accent, visible in dark-theme ambient without looking self-lit.
- Blush with `emissiveIntensity={0.3}` (`:191-196`) — higher OK because area is small.
- Toe-cap contrast blocks — smart mini-prop.
- Module-level frozen palette constants (`:20-28`) — good discipline, no new exports added to `constants.ts`.
- `tintHex` helper uses HSL roundtrip (correct; RGB lerp would shift hue).

Docked 1: the hair tuft could carry an edge or emissive highlight to actually pop as an accent — right now at 6% L delta it just disappears into the cap.

## Character Refinement (10)
🔵 Score: 9/10

Mesh count grew from ~11 baseline to 23 — spent on the right things: jaw step, hair tuft, front fringe, scarf, blush patches, ankles, toe-caps. The front fringe at `:212-215` sitting just above the forehead is the single biggest silhouette win — it's what makes the head read as "a head with hair" rather than "a box on top of a box." The screenshot confirms the character now has recognisable features: two eyes, mouth, blush, fringe, scarf band, shoes-with-tips.

Docked 1: face is slightly flat-staring — no eyebrows, no pupil offset, mouth is a single red slab. Also the current follow-cam angle in the F3.1 screenshot under-sells the trapezoidal head; a ground-level shot would land harder but that's not the geometry's fault.

## Performance (10)
🔵 Score: 10/10

- `useFrame` (`:57-113`): zero allocations. All mutations are scalar writes on existing refs. Verified line-by-line.
- Store pattern: imperative `getState()` inside frame loop, single selector for `theme` outside frame loop → one re-render per theme flip, not 60/sec.
- `tints` memoised with `[]` deps → computed once per mount.
- Mesh growth +12 is well within the rubric's 30% draw-call budget.
- Theme-reactive edge color costs one re-render on toggle, correctly isolated.
- No `Vector3/Quaternion/Matrix4` instantiation anywhere in the file. `THREE.Color` only at module scope in `tintHex`.

## Total: 88/100

13 + 13 + 11 + 14 + 9 + 9 + 9 + 10 = **88**

## Verdict: 🔵 PASS (≥85)

Clears the ≥85 architect gate. The single 🟡 dimension (Proportions at 11/15 = 73%) is above the 70% iterate threshold, so no forced iterate. The character has stopped reading as a yellow slab and now reads as a crafted voxel avatar with deliberate taper, warm triad, smooth-turning, reactive hair sway, and clean code hygiene. Second reviewer needs to concur for the final ≥88 ship gate.

## Top 3 fixes for F3.3

1. **Fix the legs.** Either drop the 0.1-tall ankle block entirely (`:260-267`, −2 meshes, frees budget for something that actually reads at camera distance) or restructure the thigh/calf as a real taper where the upper box is meaningfully wider than the lower. The current near-equal stack is the one proportion that still looks slabby in the screenshot.
2. **Spend the 4th `<Edges>` slot on the scarf** (`:235`). Budget is 3/4; the scarf is a pink emissive accent sitting against a yellow body — an outline makes it readable from any angle and costs one draw-list entry. Jaw would be the second pick; scarf is the higher-leverage visual.
3. **Complete the tint system and push `HAIR_HILITE`.** Route the ankles (`:262, :266`) and top tuft (`:209`) through the `tints` table so the jitter discipline is 16-of-16 rather than 12-of-16. Separately, bump `HAIR_HILITE` from `#2d2440` (6% L delta) to ~`#3a2f52` (~12%) so the tuft is actually visible at game distance.
