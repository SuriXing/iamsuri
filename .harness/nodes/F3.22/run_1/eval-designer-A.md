# F3.22 Final — Designer A Rubric

Commit under review: 2b156ae

Review method: all 6 screenshots read visually (overview-dark, overview-light,
myroom, product, book, idealab), supplemented by reading Character.tsx,
Door.tsx, Walls.tsx, Hallway.tsx, HallwayLanterns.tsx, StarField.tsx,
Particles.tsx, and all four room files to verify micro-animation loops and
prop density that screenshots alone cannot convey.

## Per-dimension findings

### 1. Character polish — 9/10

Back-follow-cam read on `screenshot-overview-*.png` is exactly what a hero
avatar needs: black hair cap + fringe, yellow torso, white lab-coat block
wrapping the full torso (not a front-only panel — confirmed in
Character.tsx:281), red shoes with darker toe-cap, clean silhouette against
the corridor rug. Proportions are chibi (head ~1.29× shoulder width, matches
the intended 1.2–1.4× sweet spot). `Character.tsx` implements blink (4s
cadence), arm sway, hair sway projected onto the facing vector, walk bob vs
idle hover, and smoothed turn (lerpAngle) — all zero-alloc. Pink bow sits on
the left head (screenshot doesn't capture that angle, but source confirms).
Minor nit: at the dark-theme follow-cam distance the bow/collar pink accents
don't pop as much as they could against the warm-amber hallway bloom — more
a lighting-bake thing than a character-build thing. 🔵

### 2. Door anatomy — 9/10

In `screenshot-overview-dark.png` and `screenshot-overview-light.png`, each
doorway reads as a real door: colored slab + distinctly darker jamb/header
overlay + visible wood-frame molding, and the door colors (pink, cyan,
green, amber) clearly key to their rooms. Source (Door.tsx) shows chunky
JAMB_DARK_COLOR #2a1a0c overlay that sits proud of the wall, plus a
3-strip slab with guaranteed rail-darker-than-field contrast, plus a
lantern beside each door with locked/unlocked hue swap. From game distance
this reads as "architectural doorway", not "wall seam". 🔵

### 3. Wall character — 8/10

`screenshot-overview-light.png` shows the wall-strip props doing their job:
I can see multiple small inset shapes along the horizontal strips (pictures
/ sconces / vines pool, 16 total per Walls.tsx). Tint variation is present
but subtle at the compressed screenshot size — the mixTint logic (accent
mix + L jitter + hue rotation) is in source, and in `screenshot-overview-dark`
you can faintly tell the left strip is warmer than the right. Sconce plates
have real `pointLight` instances (intensity 0.5, distance 2.0) so there's
actual light-pool baking. Could push tint deltas a little harder for
out-of-game-distance readability, but inside the rubric's "voxel + flat"
style this is solid. 🟡 small — tint jitter could be ~15% stronger for
better long-shot readability.

### 4. Hallway atmosphere — 9/10

This is the strongest dimension. `screenshot-overview-dark.png` shows the
crosshatch of ceiling beams clearly, plants at the 2×2 intersection corners,
the orange central rug, and the coffee machine shelf silhouette on the
left. `HallwayLanterns.tsx` gives 4 lanterns with independent Y-bob phases
and tightened-radius point lights (intensity 0.8, distance 4.5 — actually
addressing the "4-way overlap was too hot" fix in the source comment).
Hallway.tsx also idles plant sway (±0.02 rad), beam dust mote, runner rug
pulse, and coffee steam opacity/Y oscillation. That's 5+ concurrent idle
loops in the corridor alone. The cross reads as a connective hub. 🔵

### 5. Rooms identity — 14/15

All four rooms pass the "scream their theme" test:

- **MyRoom** (`screenshot-myroom.png`): pink-dominant bed, multi-color
  bookshelf, wide white-bezel monitor with pink-cyan glow, gold drawer
  handle, curtains. Unmistakably "cozy bedroom".
- **ProductRoom** (`screenshot-product.png`): twin large monitors with
  cyan emissive screens, desk rack silhouette left, pastel showcase cubes
  (red/green/orange) on the desk. Tech workstation. Cyan palette locked.
- **BookRoom** (`screenshot-book.png`): amber reading-lamp bloom dominates
  the frame, cream lampshade, wood-mahogany shelf edges, the globe
  silhouette, dark green chair hint. Cozy library, unmistakable.
- **IdeaLab** (`screenshot-idealab.png`): visible pegboard panel, copper /
  amber electric accents, wood bench silhouette, starry ceiling more
  peppered with warm motes than the bedroom screenshot — maker workshop.

Neighboring rooms differ clearly: pink vs cyan vs mahogany-red-brown vs
olive-pine-yellow-brown. The tonal split between BookRoom's red-brown and
IdeaLab's yellow-brown is exactly what the source comments claim they fixed
in F3.15. 🔵 Minor: at this screenshot resolution IdeaLab's hero prop
(floating bulb / spark layer) doesn't punch as visibly as BookRoom's
lamp — but density and palette are correct.

### 6. Clutter density — 10/10

Primitive-geometry counts per room file:
- MyRoom: 33 primitive meshes (bed+pillows+clothes+desk+monitor+stand+
  notebook+pen+plant+lamp+bookshelf+rug+borders+picture+curtains+rod)
- BookRoom: 45 (2 bookshelves+ladder+chair w/ cushions+throw+side table+
  lamp+open book+teacup+eyeglasses+stacked floor books+fern+globe+dust
  motes+framed picture)
- ProductRoom: 52
- IdeaLab: 59 (+ 14 instanced sparks)

All rooms are significantly above the 10–15 threshold. This is the
"hand-crafted" end of the density spectrum, not prototype-scale. 🔵

### 7. Motion density — 14/15

Catalog of live idle loops (from source):

- **Character**: blink, arm sway, head tilt, hair sway, bob/hover — 5.
- **StarField**: twinkle + per-star color/opacity phase.
- **Particles**: 150 drifting atmosphere motes, warm 3-hue palette.
- **Hallway**: coffee steam, plant sway (4), beam dust mote, runner pulse —
  4 distinct loops.
- **HallwayLanterns**: 4 lanterns, 4 phases, Y-bob at BOB_FREQ 1.1.
- **Doors**: shackle retract on unlock, lantern hue swap.
- **MyRoom**: scanline sweep + plant breathing + accent-light breathing — 3.
- **ProductRoom**: power LED blink (×2) + 6 rack LEDs phased + fan spin +
  2 scanline bars + accent light breath — 5 distinct loops.
- **BookRoom**: lamp flicker (2-wave noise) + accent breath + page flutter
  + 5 dust motes + globe spin + gold-frame emissive breath — 6 loops.
- **IdeaLab**: 3 gear speeds + bulb float + bulb pulse + point-light bulb
  tracking + prototype vibrate + hanging tool swing + solder tip pulse +
  accent light breath + 14 ambient sparks split across 2 emissive buckets
  — 8+ loops.

This is "alive but not distracting" done right: dozens of small loops, each
with its own phase and amplitude, none of them jarring individually. Losing
1 point because the screenshot read doesn't let me audit whether the
aggregated motion looks chaotic in-flight, but every individual loop amp is
small (±0.02–±0.08 rad, ±0.05–0.25 Y, low-freq). 🔵

### 8. Palette discipline — 9/10

Each room's palette is a coherent 3-note scheme:
- MyRoom: pink + cream/white + warm wood + gold accent.
- ProductRoom: slate/cool-gray + cyan emissive + metal.
- BookRoom: mahogany wood + forest green (chair) + amber lamp / dusty-pastel
  book spines.
- IdeaLab: pine/olive wood + copper + amber bulb / electric green accent.

`Particles.tsx` was intentionally trimmed from 5 saturated hues to 3
warm/pastel hues (gold / dusty pink / amber) — the source comment even
calls out that cool blue + saturated red/purple were fighting the warm
dorm ambient. That's exactly the kind of discipline a rubric rewards.
Tiny 🟡 — the MyRoom screenshot's shelf still reads as a rainbow of book
spines against the otherwise restrained pink/cream frame; intentional
hero element but it dings the "strict 3-note" ideal slightly.

### 9. Theme handling — 5/5

`screenshot-overview-dark.png` vs `screenshot-overview-light.png` both read
correctly and neither has broken chrome. In the dark shot, edges are dark
navy (#0a0a14) against warm wood; in the light shot, edges are warm brown
(#5a4830) and walls are lighter/creamier. `Character.tsx` lab coat swaps
DARK→f5f5f5 / LIGHT→e8e3d5 per theme. `Walls.tsx`, `Door.tsx`, `Hallway.tsx`,
`BookRoom.tsx`, `ProductRoom.tsx` all subscribe to the store with a
selector and recolor edges on flip. HUD chrome (bottom tab bar, dialogue
box with "text box" + next button) is legible in both shots. 🔵

### 10. Refinement feel — 5/5

Reading the source is the tell: every scene file has per-instance
deterministic tint jitter via mulberry32 seeds, zero-alloc useFrame
loops, separated sub-meshes for architectural details (jambs, moldings,
frame boxes on bookshelves, toe-caps on shoes, rail-vs-field wood
contrasts), and hero-anchor animations explicitly named (globe spin,
frame breathing, bulb float, fan spin). This is not prototype scaffolding
— this is polished hand-tuned work. 🔵

## 🔴 Critical findings (any = gate fail)

none

## 🟡 Iterate findings (non-blocking)

1. Wall-strip tint variation could be pushed ~15% harder for long-shot
   readability — at follow-cam distance in `screenshot-overview-dark` the
   eight segments still look closer to "one brown" than to "per-room
   accented". Not a showstopper, but the next pass's cheapest win.
2. MyRoom's multi-color book-spine shelf punches brighter than the rest of
   the room's restrained pink/cream palette. Consider muting 2 of the
   loudest spines to dusty-pastel (the approach BookRoom already uses).
3. IdeaLab's hero focal (floating amber bulb + spark layer) doesn't
   visually anchor the room as strongly as BookRoom's reading lamp does.
   Consider bumping the bulb's point-light intensity or adding one
   chunkier emissive halo so the "electric warmth" reads on first frame.
4. The particle-layer warm-gold/pink/amber drift is present but I can't
   verify density balance from stills alone — worth a motion spot-check
   that PARTICLE_COUNT (150 by convention) isn't bottom-heavy near the
   floor in the corridor.
5. Sconce pointLights (intensity 0.5, distance 2.0) are subtle enough
   that their light-pools are hard to spot in the overview shots —
   consider bumping distance to ~2.8 so the "real light pool on adjacent
   wall" detail actually reads.

## Total: 92/100
## Verdict: 🔵 PASS (≥88)
