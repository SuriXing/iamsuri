# F3.22 Final — Designer B Rubric

Commit under review: 2b156ae

Review basis: screenshots under `.harness/nodes/F3.21/run_1/` plus source in `src/world3d/scene/` (Character, Door, Walls, Hallway, HallwayLanterns, StarField, Particles, rooms/*).

## Per-dimension findings

### 1. Character polish — 9/10
Avatar is clearly crafted, not a prototype slab. `Character.tsx` ships chibi-proportioned head (0.54 × 0.36, 1.29× shoulder ratio), widened jaw, outlined hair cap + top tuft + front fringe, and a signature emissive pink hair bow group (3 cubes) that reads from the follow-cam back view. Lab coat now wraps the full torso depth (0.30) so the hero element is readable from behind — exactly what the back-visible requirement demands. Deterministic per-cube ±4% L tint table via mulberry32 gives the voxel body a hand-stamped feel. Motion: blink (4s cycle / 120ms closure), idle arm swing, head tilt, hair sway driven by lateral velocity, bob + sway split by moving state, smooth facing lerp (k=12). Shoes have darker toe-caps + shininess 60. Only minor gap: face is partially obscured by dialogue HUD in every screenshot so I can't fully verify front-face read, but the source is clean. -1 for not being able to visually confirm front face through HUD.

### 2. Door anatomy — 9/10
Each door ships: dark architectural jamb overlays (left, right, header) proud of wall; lighter inner frame posts; contrasting frame moldings; baseboards; lintel + overlapping trim board (F3.6 gap fix); 3-strip woodgrain panel (top rail / middle field / bottom rail) with rails guaranteed -0.16 L darker than field; center mullion; recessed inset panel; emissive accent stripe; escutcheon plate + knob sphere (1.5× sized per F3.5); accent-tinted doormat on hallway side; hanging lantern (chain + cap + glow body + finial) with lock-state color + pulse; and a lock/check indicator above. That's roughly 15+ discrete voxel pieces per door — firmly reads as DOOR at game distance. Product room screenshot confirms visible frame, mat, lantern. Slight deduction: in the overview dark screenshot, the doorways are partially swallowed by the HUD overlay and the camera angle crops the arches — can't independently verify all 4 at once. Source is robust.

### 3. Wall character — 8/10
`Walls.tsx` renders 16 props on 8 long horizontal strips via mulberry32(0xfacade01): sconces (plate + emissive glow cube + real warm pointLight distance 2.0), picture frames (frame + lighter canvas inset), and vines. Walls carry per-segment tint mixed toward per-room accent color (±0.12 L jitter + ±0.08 rad hue drift), plus thicker baseboard (0.14) and top cap (0.08) trim. Real light sources = ✓ (pointLights on sconces). Tint variation = ✓. Inhabited props = ✓. In MyRoom screenshot the wall reads cleanly as pink-tinted with the bookshelf prop. ProductRoom back wall shows the twin monitors mounted, visible dark wall field. Light-theme overview shows clearly differentiated tints between adjacent strips (green book wall vs warm brown idealab wall). Minor: vines at 0.04 × 0.6 × 0.03 are very thin and may not read from overview cam, but pictures and sconces carry the density. -2 for no screenshot that clearly showcases a single hallway wall run from mid-cam distance to confirm the density count visually.

### 4. Hallway atmosphere — 8/10
Corridor is a connective hub with multiple layers: cross-shaped dark hallway floor; rug (8B4513 + a0522d inner); two long runner rugs north/south; coffee machine with red emissive indicator + 3 animated steam boxes; 4 corner plants (2x2) with foliage sway (±0.02 rad); 5 ceiling beams along Z + 4 cross beams along X with per-beam mulberry32 lightness tints (±3%); beam crosshair cap; floating beam-dust mote (Y drift + opacity pulse); 6 ceiling light strips in a cross pattern; `HallwayLanterns.tsx` adds warm amber lanterns with Y bob + tightened pointLights (0.8 × 5.0 distance after F3.21 balance fix) — avoiding heavy overlap. Overview-light shows the red rug centered under character with plants at corners clearly visible. Feels like a connective hub. -2 because the dark overview is dim enough that beams and lanterns are barely separable from ceiling, and the runner rugs don't read in overview from this camera angle — atmosphere is there in source but I can't verify the amber lantern glow band pops until I see a clean in-corridor mid-cam shot.

### 5. Rooms identity — 13/15
Each room has a distinct theme from source and screenshots:
- **MyRoom** (pink): bed, desk, bookshelf, desk lamp, CRT monitor with scanline sweep, folded pink clothes stack, plant with breathing foliage, pink accent point light. Screenshot shows colorful book spines on shelf + large monitor glow + pink register.
- **ProductRoom** (cyan/tech): twin hero monitors with animated scanline bars, server rack with phased LED blinks, spinning fan, crate stack, LED dots, cyan floor stripe, cyan accent light, tint-banded floor stage. Screenshot shows twin cyan monitors + crate stack + desk = reads as workstation.
- **BookRoom** (amber/warm): L-R bookshelves with per-book tints, chair, side table, oil lamp (flicker), amber accent light, open-book page flutter, floating dust motes, spinning globe + ring + gold-framed picture breathing glow. Screenshot shows lamp + globe silhouette + warm amber palette.
- **IdeaLab** (green/maker): floating pulsing idea bulb + pointLight, 3 counter-rotating gears, vibrating prototype, swinging hanging tool, soldering iron tip glow, green accent light, instanced orange + warm-white spark particle drift. Screenshot shows workbench silhouette + amber warm tones + tool rack shapes.

Each room has strong identity and differs clearly from neighbors. Screenshots are partially HUD-obscured so not every hero prop is visible, but source is solid. -2 because IdeaLab screenshot is very dark and the "maker workshop" doesn't pop as hard as BookRoom's globe or ProductRoom's monitors — the hero read is weaker at game distance without the bulb visible.

### 6. Clutter density — 9/10
Room line counts: BookRoom 494, IdeaLab 699, MyRoom 375, ProductRoom 480. That's substantial voxel-prop mass. Every room has ≥8 distinct prop groups plus per-book/per-crate/per-spark sub-instances. No room feels bare. -1 because MyRoom at 375 lines is notably lighter than IdeaLab and the screenshot supports this (more empty wall area visible).

### 7. Motion density — 14/15
Verified micro-animations per room (read from source `useFrame` blocks):
- **MyRoom**: scanline sweep, plant foliage breathing, accent-light breathing = 3 ✓
- **ProductRoom**: power LED blink (×2), rack LED phased blinks (×N), fan spin, twin scanline bars, cyan accent breath = 6+ ✓
- **BookRoom**: lamp two-wave flicker, amber accent breath, page flutter, dust motes (×N), globe spin, gold-frame pulse = 6 ✓
- **IdeaLab**: bulb float+pulse, bulb pointLight pulse, 3 counter-rotating gears, prototype vibrate, hanging tool swing, solder tip pulse, accent breath, two spark instance buckets = 9+ ✓
- **Hallway**: steam, 4 plant sway, beam-dust mote, 2 runner rug scale pulse = 8
- **Character**: blink, arm swing, head tilt, hair sway, bob + sway, smooth facing
- **Doors**: lock group pulse, lantern group pulse + emissive pulse (different freq locked vs unlocked), hinge lerp
- **HallwayLanterns**: Y bob
- **StarField**: twinkling (per name)
- **Particles**: atmosphere drift

Every room exceeds the ≥3 requirement. The "alive but not distracting" balance holds because each anim is scalar scale/intensity/rotation — no large positional drifts that would compete with character focus. -1 only because I cannot verify "not distracting" visually without seeing the motion in realtime; screenshots are static.

### 8. Palette discipline — 9/10
Each room enforces a coherent accent: MyRoom pink (#f4a8b8 family), ProductRoom cyan, BookRoom amber/warm, IdeaLab green. Walls mix toward per-room accents so the corridor segments bleed hue into each room approach. Dark theme holds a warm-amber dominant (lanterns + beams) against cool navy hallway floor #1e2233 — good warm/cool contrast. Light theme (per overview-light) has a unified warm wood tone with each room reading its accent cleanly; no clashing. Character gold body + pink scarf + red shoes sits as a warm triad that pops against both themes. -1 because in the dark overview, the cyan ProductRoom accent may fight slightly with the amber-dominant hallway, but it's legible not clashing.

### 9. Theme handling — 5/5
Both themes render correctly. Dark: deep navy hallway, warm lantern band, emissives amplified, dark-edge outlines (#0a0a14). Light: warm wood dominance, muted lab coat (#e8e3d5), lighter edge outlines (#5a4830), no emissive blow-out. Theme is selector-subscribed (`useWorldStore((s) => s.theme)`) so edge colors and key meshes recolor on toggle without re-mounting. Screenshots show both themes reading the same scene layout with palette rotation working. Full marks.

### 10. Refinement feel — 5/5
Code quality is craft-tier: module-scope constants, mulberry32 deterministic seeds, framerate-independent lerps, zero-alloc useFrame loops (indexed for-loops, scalar writes, pre-computed phase tables), per-door/per-wall/per-beam tint pools, layered trim (baseboard + cap + molding + lintel trim overlap), HSL-aware tint helpers, explicit comments citing prior review findings (F3.5, F3.6, F3.7, F3.15, F3.19, F3.21). This is hand-tuned, not prototype. Full marks.

## 🔴 Critical findings (any = gate fail)
none

## 🟡 Iterate findings (non-blocking)
1. Dialogue/HUD overlay is visible in every screenshot, making it impossible to independently verify character front face read and full door row read — recommend capturing one HUD-off screenshot for future review snapshots.
2. MyRoom density is lighter than IdeaLab (375 vs 699 lines) and the screenshot shows more empty wall area — consider 2-3 more props (framed posters, slippers, nightstand clutter) to match the sibling rooms.
3. IdeaLab screenshot doesn't showcase the floating bulb hero element — either the camera angle is too low or the bulb is out of frame; ensure the hero motion element is visible from the default room-entry cam.
4. Dark overview screenshot has lantern glow band that barely separates from ceiling beams — consider raising lantern emissive by 0.2 or dropping hallway floor L by 2% to increase the contrast notch.
5. Thin vine wall props (0.04 × 0.6 × 0.03) may not read from overview distance — bump depth to 0.05-0.06 or add a second parallel strand for silhouette weight.

## Total: 89/100
## Verdict: 🔵 PASS (≥88)
