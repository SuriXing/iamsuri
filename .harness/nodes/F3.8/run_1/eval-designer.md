# F3.8 Door+Walls Re-Review — Designer

Scoring the AFTER state from F3.7 against the F3.6 failure call.

Evidence reviewed:
- BEFORE: `/Users/surixing/Code/iamsuri/.harness/nodes/F3.5/run_1/screenshot-myroom-door.png`, `screenshot-walls-overview.png`
- AFTER: `/Users/surixing/Code/iamsuri/.harness/nodes/F3.7/run_1/screenshot-door-fixed.png`, `screenshot-walls-fixed.png`, `screenshot-walls-closeup.png`, `screenshot-walls-overview.png`, `screenshot-door-locked.png`, `screenshot-door-unlocked.png`

## Visual diff since F3.6

- **Doormats landed.** Each door now has a color-matched rug tile in front of it (green / pink / yellow / red). Biggest single readability win — eye snaps to "entrance here" from silhouette alone.
- **Per-door hue deltas are larger.** F3.5 doors sat in one brown family. F3.7 reads 4 distinct doors (green, pink, yellow, red) even under the warm night ambient.
- **Vertical seam / mullion on door slab.** In `screenshot-walls-closeup.png` the green door shows a clean vertical split. Reads as a seam, not a framed panel.
- **Knob present but tiny.** Slightly larger than F3.5, still a flat dot with no shadow or plate — lost at normal camera distance.
- **Wall sconces: claimed, not selling.** A couple yellow specks along upper wall edges in the closeup. No light pools on adjacent walls, so they read as decorative pixels, not lights.
- **Wall art / vines: sparse.** Maybe 1–2 frame-shapes on the left wall in closeup. Most wall runs are still monochrome brown slab.
- **Inset panel on door: not carrying.** Whatever shadow/bevel was intended doesn't survive the dim ambient — door face in `screenshot-door-fixed.png` still reads as a flat slab.
- **Door-state diff is text-only.** Locked vs unlocked prompts change ("unlock" → "enter") but the door art is visually identical between states.
- **Wall tinting exists but is swamped by lighting.** `walls-closeup` proves the green-tint channel is in the material, but in `walls-overview` the warm global light flattens it back toward monochrome.
- **Floor + prop layer unchanged** from F3.5 — same beds, desks, planks.

## Material Variation (15)
🟡 9/15

Doors now vary by hue + doormat — that's real variation. Walls are still ~90% one brown; the "trim" strip barely differs in value. Per-room wall tint is technically present but gets eaten by ambient lighting outside of close-up shots.

## Silhouette / Affordance Readability (15)
🟡 9/15

Doormats do the heavy lifting. Eye locks onto "entrance." But the door slab itself still fails the squint test — without the mat, door and wall panel are indistinguishable rectangles. Mullion reads as a seam, not frame+panel anatomy.

## Color Palette Cohesion (10)
🔵 8/10

Hue separation is stronger and still coordinated with the night ambient. Green/pink/yellow/red doors don't clash with the warm base. Palette is the one thing that's consistently working.

## Lighting & Atmosphere (10)
🟡 6/10

Sconces are present as pixels but not as light sources — no cast pools on adjacent walls. Ambient is still one flat warm tint with no per-room differentiation. Night sky and torches are pretty but that was already true in F3.5.

## Per-Door Storytelling (15)
🟡 8/15

F3.6's zero is now non-zero: doormats + hue hint at distinct rooms (green = nature/garden, pink = bedroom, yellow = workshop). But there's no icon, no over-door sign, no propped object near each door that actually names the room. A player still can't identify rooms from the hall without walking up to read the prompt.

## Wall Decoration Density (10)
🔴 4/10

Walls are still mostly empty brown. One or two picture/vine shapes visible in the closeup only. Hall-wide shots show long uninterrupted wall runs. The "wall props" fix was gestured at, not shipped.

## Door Frame / Panel Anatomy (15)
🔴 5/15

This is the core F3.6 complaint and it's still failing. A readable door needs: visible frame (jamb) stepping out from the wall, an inset panel with readable shadow, a handle with shape, and ideally a threshold strip. What shipped: a vertical seam + a knob dot. The panel inset doesn't carry under night lighting. The frame isn't distinguishable from the wall edge.

## Consistency / Polish (10)
🟡 6/10

No broken geometry, no z-fighting, mats align with doors. But the visual grammar between "door," "wall," "trim," "prop" isn't consistently established, so the scene still reads as "placeholder with colored hints."

## Total: 55/100

(9 + 9 + 8 + 6 + 8 + 4 + 5 + 6 = 55)

## Verdict: 🔴 FAIL (below 85)

F3.7 is real progress — doormats and hue deltas meaningfully fix "can't tell doors apart," and I'm scoring those wins. But F3.6's specific failure was **doors don't read as doors** and **walls are monochrome**. Those two failures are still present:

1. Door slab still lacks frame + inset-panel anatomy that survives the game camera.
2. Walls are still long monochrome brown runs with sparse, dim props.

Scoring cleared maybe 4–6 points above F3.6's midpoint (51–63 → 55). Nowhere near 85. Calling this a pass would be dishonest — the core anatomy fix wasn't delivered, it was gestured at with a seam and a dot.

## Remaining gaps

- **Door frame must exist as geometry**, not a seam. One pixel darker jamb around the opening + one pixel lighter top edge. Must read from 3+ tiles away.
- **Inset panel shadow delta must be real** (~15–20% value drop, not 5%). Currently invisible under night ambient.
- **Knob → handle shape**: minimum 2×2 px with a darker shadow pixel, or a horizontal lever bar. The current dot is lost.
- **Door-state legibility from art alone**: add a lock icon / red knob → green knob / subtle glow when unlocked. Don't make state depend on the prompt text.
- **Wall tints need to beat the lighting**: either 2–3× saturation boost, or per-room ambient light colors so lighting reinforces the tint instead of erasing it.
- **Wall decoration density**: target one prop every ~2 tiles of wall run. Currently ~1 per 6.
- **Sconces need light pools**: a soft warm blob on the wall adjacent to each sconce, otherwise they're just yellow noise pixels.
- **Per-door storytelling needs explicit signage**: a small icon above each door (book, brush, plant, flask) to carry room identity without leaning on hue alone.
- **Trim row between wall and floor**: a single darker pixel row at wall base would give walls a grounded anatomy and break the monochrome.

Ship F3.9 with door anatomy actually built (frame + inset shadow + handle) and wall decoration density raised, then re-review. Until then: 🔴 FAIL.
