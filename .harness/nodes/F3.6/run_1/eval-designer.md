# F3.6 Door+Walls — Designer

## Visual Impression
The scene reads as a cozy voxel interior with warm amber lighting, but walls and doors are visually undercooked — flat monochrome brown surfaces with almost no trim, texture, or material storytelling. The close-up `screenshot-myroom-door.png` almost sells it thanks to the warm arch glow and flanking pumpkins, but the wider `screenshot-walls-overview.png` exposes how repetitive and flat the wall treatment becomes at scale.

## Material Variation (15)
🔴 5/15

In `screenshot-walls-overview.png` every room partition uses the same flat reddish-brown fill — no paneling, no wainscot, no hue shift between rooms, no plank/brick differentiation. Four+ visible rooms look identical, which destroys any sense that different rooms have different purposes. The door in `screenshot-myroom-door.png` has a warmer gold arch rim (that's the one material moment), but the door interior blends straight into the wall color. At game distance the whole interior sits in one narrow brown register.

## Silhouette & Shape Language (15)
🟡 9/15

Silhouettes are clean and readable — arched doorways pop as dark negative shapes against the brown walls, voxel language is consistent, and the blocky rooms in `screenshot-walls-overview.png` form a legible grid. But the door itself is a flat arch cutout rather than a door-as-object: no frame molding, no visible door slab, no handle, no threshold. The doorway is a hole in the wall, not an object you'd interact with.

## Color Palette & Harmony (12)
🟡 6/12

The warm amber/brown dominant palette is internally coherent with the "cozy lab" tone, and the green chalkboards + yellow interaction prompt in `screenshot-myroom-door.png` add decent complementary punch. But the brown is over-saturated and uniform — walls, door frames, and nearby surfaces all sit in the same hue band, so the eye has nowhere to rest. Needs value separation between floor / wall / door / trim.

## Lighting & Shading (12)
🟡 6/12

`screenshot-myroom-door.png` shows a decent warm point-light glow on the door arch — best lighting moment in either frame, the gold rim really pops. But `screenshot-walls-overview.png` is flatly lit: walls get near-uniform illumination, no ambient occlusion in corners, no shadow cast under door frames, no bounce light spilling from lamps into corridors. Rooms feel like daylight diagram renders, not an evening interior.

## Detail Density & Craft (12)
🔴 4/12

Walls have zero detail in either screenshot — no baseboards, no wall sockets, no posters, no corner trim, no scuffs. Doors are untextured arches. Compare this to the furniture (desks, green monitors, pumpkins, the character sprites) which clearly got an art pass. Walls and doors read as placeholder geometry that hasn't been touched yet. This is the biggest single gap.

## Composition & Framing (10)
🟡 6/10

`screenshot-myroom-door.png` frames the door centrally with symmetric pumpkin flanking and the "Press F to unlock My Room" prompt — solid, focused comp. `screenshot-walls-overview.png` is awkward: a big yellow cross icon floats dead-center competing with the player character for attention, and the symmetric grid of identical rooms gives no focal hierarchy. Hard to tell which room matters or where to go.

## Consistency with Style Bible (10)
🟡 6/10

The voxel/low-poly cozy aesthetic is internally consistent with the "Suri's Lab" branding top-left and the furniture treatment. But F-series world-building typically asks for material variation, crafted doors, and per-room visual identity — this delivery delivers none of those. Walls-as-placeholder breaks the crafted-world promise the rest of the scene is making.

## Readability & Affordance (14)
🟡 9/14

Doorways are clearly readable as passages in both screenshots — arched cutouts plus the interaction prompt in the door shot is unambiguous. Walls clearly bound rooms. But without any visual differentiation, players can't tell rooms apart at a glance in `screenshot-walls-overview.png`; navigation relies entirely on memory or the floating marker rather than architectural cues. Doors also give no visual "locked vs unlocked" state — I can read the text prompt but not infer state from the door itself.

## Total: 51/100
## Verdict: 🔴 FAIL

## Top 3 visual gaps
1. **Walls are flat placeholder geometry in `screenshot-walls-overview.png`.** Single uniform brown fill across every surface of every room. Needs at minimum: baseboard trim (2-3 voxel horizontal strip at floor), a secondary wall color/material per room zone to break the monotony, and ambient occlusion baked into corners and under doorframes. Highest-leverage fix — one pass here transforms the whole scene.
2. **Door is an arch cutout, not an object, in `screenshot-myroom-door.png`.** No frame molding, no visible door slab, no handle, no locked-state visual on the door itself. Add a proper frame trim, a visible door panel (even when "open," show it swung to the side), a knob, and a lantern/sigil that changes color with lock state so the door carries its own affordance without relying on text prompts.
3. **`screenshot-walls-overview.png` is flatly lit.** No directional shadows, no AO, no warm light spilling from doorways into the corridor. This kills the "cozy interior" mood that the close-up shot almost achieves. Bake AO into corners and doorframe undersides, add a warm point light inside each room so doorways glow into the hallway, and darken the ambient slightly to let those warm pools read.
