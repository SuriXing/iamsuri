# F3.18 Ambient Layer — Designer Review

## Per-file findings

### StarField.tsx
4-color palette (cool white / warm white / pale cyan / pale rose) with per-star phase offset and 0.55–1.0 shimmer range. Disciplined: the palette is subtle enough not to turn starfield into carnival, but varied enough to defeat uniformity. Per-star baseOpacity (0.3–1.0) adds depth. Phase is independent per-star, so no unison pulse. Math is correct — each star has its own sinusoid. This is textbook "living sky, not snow."

One nit: can't see stars in the supplied screenshot (hallway overview shoots too low). Trusting the code — it reads right.

### Particles.tsx
Added per-particle `driftAmp` (0.0015–0.005), `driftFreq` (0.4–1.3), and `phase` with quadrature sin/cos on X/Z for organic swirl. Colors: 5-color palette (gold/green/purple/blue/red). The swirl math (sin for X, `cos(t*f*0.85 + ph)` for Z) creates slightly-off-phase loops — each particle traces its own tiny lissajous as it rises. Good. Amplitude is tiny enough that it reads as drift, not chaos.

Mild concern: 5 colors on floating cubes can read as confetti if density is high. `emissiveIntensity: 0.9` + `opacity: 0.75` means they're pretty bright. Can't tell from the screenshot whether density is tuned right — hallway view doesn't show many.

### Hallway.tsx
Crosshatch ceiling beams: 5 main Z-beams + 4 X-cross beams + center dark hub at y=2.92–2.96. Reads as wooden rafter grid. Runner rugs (55×300cm, dark brown with warm amber emissive tint) at z=±2.2. 4 corner plants at intersection corners with clay pot + soil + 2 leaf spheres + 1 cone top. 

Evidence from screenshot: I can clearly see the orange runner rugs running into the corridor arms, the crosshatch beam shadows on the ceiling area, and at least two plants at the central crossing. The runners are doing real work — they give directional flow to the corridor.

Concerns:
- `emissive={HALL_COLOR}` on the floor (`#1e2233` at intensity 0.1) + emissive on the runners + emissive on both rug layers stacks a lot of self-lit surfaces. The hallway floor doesn't need to glow.
- Plants: sphereGeometry with 6x6 segments is the right voxel-adjacent call, but `emissiveIntensity: 0.15` on leaves is questionable — plants shouldn't emit. Minor.
- Ceiling beams use `#3a2510` (very dark brown). Against the dark `#0a0a14` edge color in dark mode they may disappear entirely. The beam color might need a slightly brighter accent to read.

### HallwayLanterns.tsx
Full anatomy: ceiling anchor plate → chain cylinder + cross bar → top cap + pagoda point → 4 corner posts → lantern body → bottom plate → glow core → warm pointLight. Y-bob at 1.1Hz, 0.035 amplitude, 4 phase offsets (0, π/2, π, 3π/2) so they sway out-of-sync. Glow: `#ffb870` body + `#ff9840` emissive at 4.2 intensity — definitively warmer than before.

This is the strongest file in the review. Each lantern reads as a real fixture, not a floating cube. The 4-post frame with posts at (±0.1, ±0.1) around a 0.22-wide body creates clear silhouette separation between frame and glow. The chain + ceiling plate + pagoda cap is the full hardware kit.

Screenshot confirms the warm amber glow at all 4 corner positions, clearly differentiated from the cool overhead ceiling strips. The lanterns are the single biggest reason the hallway reads as "inhabited."

### IdeaLab.tsx sparks + copper retint
14 sparks as `instancedMesh` of 0.03 cubes, confined to bench footprint (2.2×0.9 XZ, Y 0.95→2.35), 50/50 split between orange (`#f97316`) and warm white (`#fff3a0`). Pure Y drift at 0.35 × per-spark speed (0.7–1.3) with wraparound. Zero swirl, zero phase — just "heat rising from the work."

Density feels right: 14 is sparse enough to read as "a few sparks flying," not a storm. The orange/warm-white split distinguishes them from the board's fixed orange/green LEDs: LEDs are stationary point emitters, sparks are moving micro-cubes — different motion signature.

Copper retint: `COPPER_ACCENT = '#c97a2a'` applied to the heading bar (top of whiteboard) and the circuit-board-top of the vibrating prototype. Previously these were electric green which clashed with the `#fbbf24` amber bulb. The new copper sits between the amber bulb and the orange prototype LED, closing the warm accent family. Good call — the retint actually harmonizes.

Concern: the spark material uses `color: '#ffffff', emissive: '#ffc870'` on the material itself but then `setColorAt` overrides per-instance with pure orange or pure warm white. For `meshPhongMaterial`, the instance color multiplies against the base material color, but the emissive is NOT multiplied per-instance (three.js limitation). So the "orange vs warm white" distinction only lives in the diffuse color channel, not in the glow. With emissive `#ffc870` at intensity 1.6 and opacity 0.9, the emissive basically dominates — the per-instance color difference will be washed out. In practice all 14 sparks will look like "warm white-orange" blobs regardless of which flag you picked. Mild functional regression from the architect's perspective too, but designer-visible here.

## Scores

1. Star variation: 14/15 — palette is tasteful, phase math is correct, only knocking 1 for not being verifiable in the screenshot
2. Particle motion: 8/10 — organic swirl math is good, but the 5-color palette risks confetti feel and I can't confirm density tuning
3. Hallway decor: 12/15 — beams + runners + plants do add life, but overlapping emissive on floor/runners and the very-dark beam color hurt read
4. Lantern polish: 14/15 — strongest element, full anatomy, warm glow, out-of-sync bob. Minor: chain is a single cylinder not actual links
5. IdeaLab spark layer: 7/10 — good density, workshop-appropriate vertical drift, but the per-instance color vs emissive-on-material bug collapses the orange/warm-white variation into one look
6. IdeaLab warm copper retint: 9/10 — genuinely harmonizes with amber bulb, clean targeted fix
7. Alive but not distracting: 13/15 — motion budget feels right (lantern bob + spark drift + star twinkle + particle swirl all at low amplitude), but multiple emissive stacking in the hallway pushes toward "a lot going on"
8. Distinctness hallway vs rooms: 8/10 — hallway now has its own vocabulary (crosshatch wood beams, runner rugs, lanterns) that rooms don't share. Clear transitional feel.

## Total: 85/100
## Verdict: 🔵 PASS

Just over the line. F3.17 meaningfully lifts the ambient layer and the lantern work is genuinely excellent. What keeps it from the 90s is the hallway emissive stacking and the spark-color bug that collapses the intended orange/warm-white variation.

## Top fixes for F3.19 (ranked by leverage)

1. **Fix the spark color variation.** `meshPhongMaterial` with a fixed `emissive` ignores per-instance color on the glow channel. Either (a) drop the per-instance color and use a single warm-amber glow, or (b) switch to `meshBasicMaterial` and set per-instance color (which basic material DOES multiply), or (c) split into two `instancedMesh` calls — one orange material, one warm-white material. Option (c) is the cleanest visual win: you'll actually see the 50/50 split.

2. **De-emissive the hallway floor + runners.** The hall floor has `emissive={HALL_COLOR}` at 0.1 and both rug layers add more emissive on top. Drop emissive to zero on the floor (let the lanterns light it) and pick one rug layer to carry the warm accent. Right now multiple faint self-lit surfaces dilute the lanterns' visual authority.

3. **Lift the ceiling beam color.** `#3a2510` is too close to the dark mode edge color `#0a0a14` — beams risk disappearing. Try `#4a3018` or `#553520` so the crosshatch reads as actual wood structure, not shadow.

4. **Remove emissive from plant leaves.** `emissiveIntensity: 0.15` on the green spheres is tiny but wrong — plants aren't self-lit. Drops one more unnecessary glow source.

5. **(Optional) Sanity-check particle density vs. palette.** If particle count is high and you're seeing confetti, cut the palette to 3 warm colors (gold/amber/pale-rose) and let the hallway lanterns own "warm floating things."
