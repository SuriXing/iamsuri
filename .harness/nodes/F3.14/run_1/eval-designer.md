# F3.14 Other Rooms — Designer Review

Grading within the voxel + flatShading style bible. MyRoom F3.12/F3.13 is the reference polish bar. I am NOT penalizing for boxy geometry, flat per-face shading, aliased edges, or low polycount — those are intentional. I AM grading on palette discipline, silhouette pop, density, motion, and vibe identity.

---

## ProductRoom — tech war-room

**File:** `src/world3d/scene/rooms/ProductRoom.tsx`

### Findings

- **Material variation (14/15):** The floor stage is a 3-band tint (deterministic HSL jitter on SLATE_DEEP via `bandTints`), desk has a top + darker trim, server rack has alternating slot tints (`'#242a34' : '#1b1f27'`), monitors have bezel+screen+brand bar. Every large surface is broken up. Slight ding because the desk top itself is a single flat slab — a cable-grommet line or mid-trim would push it over the top.
- **Edge pop (14/15):** `<Edges>` on all hero elements — monitors, server rack, rack door panel, crates, desk, product cubes, rubber duck, laptop, mug, keyboard. Edges switch to `#5a4830` in light theme (nice touch). Hero silhouettes — dual monitors flanking desk + server rack hulk — read cleanly at distance. Very clean.
- **Micro-animations (15/15):** Blowout count — 2 power-LED blinks, 6 rack LEDs on phased blink, 1 spinning fan, 2 vertical scanline sweeps on the monitors, 1 breathing cyan accent light. That's **~12 visible motion affordances**, far past the 3-minimum. Also notable: blinks are discrete step-based (not sinusoid mush), which reads as "tech indicator" not "lazy pulse."
- **Color harmony (10/10):** Clean three-note palette — deep slate (SLATE_DEEP/MID/LIGHT), cool metal (METAL/METAL_LIGHT), cyan accent (CYAN/CYAN_DIM). Only warm breaks are the yellow sticky + rubber duck, and they land as intentional focal pops against the cool base. Disciplined.
- **Clutter / density (10/10):** I count roughly 20+ distinct props: dual monitors, stands, bases, under-bezel brand bars, keyboard, 3 cable grooves, mousepad, mouse, closed laptop + status LED, mug + coffee surface, 3-part headphones, 3 sticky notes, 2 USB drives, rubber duck (head+body+beak), server rack (body+door+top+4 slots+6 LEDs+fan housing+blade+cable coil), stacked crates + label, 3 product cubes, cable tray, floor bands, cyan stripe. Lived-in and credible.
- **Refinement (9/10):** Grid consistency is good. Tapered desk legs (two stacked chunks mimicking the MyRoom pattern). Lighting is intentional — cyan accent near rack + secondary cool fill from above. Tiny gripe: the three product cubes use `(Math.PI/6)*i` rotation which gives a slightly awkward middle-cube alignment — a `-Math.PI/12` center offset would balance it.
- **Vibe identity (15/15):** This visually screams "engineer's war room." Server rack with blinking colored LEDs + fan, dual cyan monitors, rubber duck debug buddy, closed laptop, sticky notes, USB drives, shipping crates. You cannot mistake this room.
- **Distinctness (10/10):** Cool slate + cyan is the only cool room in the house. Unmistakable vs the warm trio.

**Subtotal: 97/100**

---

## BookRoom — cozy library

**File:** `src/world3d/scene/rooms/BookRoom.tsx`

### Findings

- **Material variation (13/15):** Two-tone plank floor (WOOD_MID / WOOD_LIGHT alternating), central amber rug with bordered stripes, bookshelves with framed box + back panel tint, chair has base+seat cushion+back+back cushion in CHAIR_GREEN / CHAIR_GREEN_DK alternation. Side table has top+pedestal+base in 3 wood tints. Lamp has shade+bulb+base+stem split. Ding: the back panel wall behind the shelves could use a plank stripe too — it currently reads as one flat slab behind each bookshelf frame box.
- **Edge pop (14/15):** Edges on chair base, back rest, back cushion, throw pillow, blanket, side table top+base, lamp shade, open book pages, stacked floor books, globe, rug, picture frame. Hero reading chair silhouette (box + cushion layering + arms + blanket drape) is the strongest non-tech silhouette in the house. Very good.
- **Micro-animations (13/15):** Lamp flicker (two-wave 7.3+11.7 Hz combo — actually noisy, not just sinusoid), amber accent light breathing, open-book page flutter (±0.04 rad @1.5Hz), 5 floating dust motes with phase-offset vertical bob. That's 8+ affordances, well past minimum. Docking 2 points because none of the motion is as "hero" as IdeaLab's pulsing bulb or ProductRoom's spinning fan — the library feels alive but doesn't have a single focal animation that announces itself.
- **Color harmony (10/10):** Disciplined three-note: deep wood (WOOD_DEEP/MID/LIGHT), forest green (FOREST/CHAIR_GREEN), warm amber (AMBER/AMBER_WARM/BRASS/GOLD). Cream reads as neutral. The dusty pastel book spines (`DUSTY_SPINES`) **explicitly fix the F3.12 gap** — blush, sage, dusty blue, tan, mushroom, olive sage, terracotta. No more loud Crayola spines. This alone is a major upgrade.
- **Clutter / density (9/10):** 15+ props: 2 bookshelves, ladder (2 rails + 5 rungs), reading chair (base/seat/back/back cushion/2 arms/blanket/cushion), side table, reading lamp (4 parts), open book (2 pages), tea cup (3 parts), eyeglasses (2 lenses + bridge), 3 stacked floor books + bookmark, potted fern (4 parts), globe (base + post + sphere + brass ring), picture frame. Dock 1 because the left half of the room past the ladder feels a touch barer than the right reading nook — a stool or floor cushion would balance it.
- **Refinement (9/10):** Plank alignment is consistent. Light intent is clear: warm amber nook light + room-fill amber. Rug border stripes are a lovely MyRoom-style grid detail. Minor: the `torusGeometry` for eyeglasses is one of the few non-voxel primitives in the codebase — it's fine but slightly breaks the cubist language.
- **Vibe identity (14/15):** Library reads instantly — 2 packed shelves, ladder, leather-ish green chair, reading lamp, open book with tea, glasses, globe, framed picture. The only reason this isn't 15 is that the ladder reads as a stick against dark geometry in the screenshot — it could use slightly lighter wood or an edge highlight to pop.
- **Distinctness (9/10):** Green chair + amber rug + wood planks reads clearly different from the other 3 rooms. Slight risk of tonal overlap with IdeaLab (both are warm wood + orange/amber), but the chair silhouette and bookshelf mass carry the identity.

**Subtotal: 91/100**

---

## IdeaLab — maker workshop

**File:** `src/world3d/scene/rooms/IdeaLab.tsx`

### Findings

- **Material variation (13/15):** Two-tone plank floor (WOOD_MID / WOOD_PLANK alternating), oil-stain accent patches (nice touch — breaks floor texture), workbench has top + darker trim + cross-brace, pegboard has hole pattern (dark dots), prototype has base + circuit-board top + LED. Ding: the back wall behind the idea board is one flat slab — could use a wood-grain band or wainscoting strip.
- **Edge pop (14/15):** Edges on workbench top, chunky legs, vise, prototype, 3 gears, tape roll, jar, pencil cup, hanging tool, pegboard + 7 peg tools, corkboard, stool, idea board frame + paper. Good coverage. The pegboard with 7 distinctly-shaped tools is a really strong silhouette element. Workbench hero reads well.
- **Micro-animations (15/15):** This is the motion champion of the 3. Floating bulb (vertical bob + emissive pulse), bulb point-light co-moving + intensity pulse, **3 counter-rotating gears** (`GEAR_SPEED_A/B/C = 1.4, -1.9, 2.3`), prototype vibrating (high-freq x+z shake at 18 Hz — reads as "actively running"), hanging tool swinging on rope, soldering iron tip emissive pulse, amber accent light breathing. **~10 motion affordances**, and the gears + vibrating prototype + floating bulb are all HERO animations that announce themselves. Best motion work in the house.
- **Color harmony (9/10):** Three-note: warm wood (WOOD_DEEP/MID/LIGHT/PLANK), cool metal (METAL_DARK/MID/LIGHT), electric accents (ELECTRIC_GREEN + ORANGE_SPARK + AMBER_BULB). The idea board lines use green/amber/rose/blue/orange which is the messiest palette moment in the room — 5 colors at once on a single surface. It's thematically right (a brainstorming board IS messy) but tonally it's the loudest element. Dock 1.
- **Clutter / density (10/10):** 20+ props: idea board + 11 content lines + heading bar + marker tray + 3 markers, workbench + trim + 4 legs + cross-brace + vise, prototype + circuit board + LED, 3 gears, soldering iron (body + tip + nub), wrench, hammer (head + handle), jar of screws (glass + contents + lid), tape roll, pencil cup + 3 pencils, 2 blueprint rolls, pegboard + 15 holes + 7 tools, hanging tool, corkboard + 3 pinned sketches, stool (seat + 4 legs), floating bulb + screw base, 6 sketches scattered on floor, 2 oil stains. This is the densest room.
- **Refinement (9/10):** Workbench legs are properly chunky (0.12×0.6×0.12), scaled appropriately vs the 2.6m top. Gears use 6/8-sided cylinders — correct low-poly voxel choice. Lighting is intentional: floating bulb as key + workbench accent. Slight ding: the `PEG_TOOLS` layout is a bit symmetric — the hammer head + screwdriver grip don't quite line up visually with their handles due to the flat 2D projection onto the pegboard (they read as separate boxes rather than composite tools).
- **Vibe identity (15/15):** Maker workshop screams. Workbench + vise + prototype (actively vibrating) + counter-rotating gears + soldering iron + pegboard full of tools + blueprints + scattered paper sketches + floating idea bulb overhead. This is a textbook "inventor's lab" and the motion sells it hard.
- **Distinctness (9/10):** Distinct from ProductRoom (warm wood vs cool slate), distinct from MyRoom (metal/tools vs soft fabric). Slight overlap risk with BookRoom (both warm wood + amber), but the metal tool silhouettes, pegboard grid, and idea board immediately disambiguate. The floating bulb is also a unique vertical hero not found in any other room.

**Subtotal: 94/100**

---

## Cross-room (Distinctness)

Looking at the overview screenshot and comparing silhouettes/palettes across all 4 rooms:

- **MyRoom** — pink + white + warm wood. Soft, curtained, bed+desk hero.
- **ProductRoom** — slate + cyan. Cool, techy, dual-monitor silhouette + server rack hulk. The ONLY cool room.
- **BookRoom** — wood + forest green + amber. Warm but green-dominant chair silhouette.
- **IdeaLab** — wood + metal + electric multi-accent. Pegboard grid + floating bulb + gear silhouettes.

Each room has a different dominant secondary color (pink / cyan / forest / electric-multi). Each has a different hero silhouette (bed / dual monitors / armchair / workbench+pegboard). Each has a different motion signature (scanline+plant breath / fan+LEDs+scanlines / lamp flicker+dust / gears+bulb+vibration).

**The "three warm rooms will blur together" risk is real but mitigated** — MyRoom's pink pulls it away from the browns, BookRoom's forest green chair is its silhouette anchor, IdeaLab's electric green + cool-metal tools breaks up the wood. In the overview screenshot I can identify each room from a glance. Passes.

**One cross-room gap:** the 3 warm rooms all use similar `#6b4423` wood tones for their core wood furniture. Not a problem in isolation but if viewed side-by-side in animation they could feel like "the same wood." A single saturation/hue shift per room (e.g. IdeaLab wood pulled +5% warmer/redder, BookRoom pulled +5% cooler) would lock distinctness permanently. Low priority but noted.

---

## Average: (97 + 91 + 94) / 3 = **94/100**

## Verdict: 🔵 PASS (≥85)

All three rooms clear the bar with room to spare. They meet or beat MyRoom's polish level within the voxel+flatShading style. The four F3.12 cross-room gaps were all addressed:
1. ✅ Clutter density ≥8 — all 3 rooms have 13-20+ props
2. ✅ Micro-animations ≥3 — all 3 rooms have 4-12 distinct animations
3. ✅ Two-tone lighting bands — all 3 rooms have alternating-tint floor/surface bands
4. ✅ Desaturated bookshelf spines — BookRoom ships `DUSTY_SPINES` explicitly

---

## Top fixes for F3.15 (ranked by leverage)

1. **BookRoom left side balance** — the ladder+shelf area is visually lighter than the chair nook. Add a small floor stool, cat, or reading cushion near the ladder base. Cheap fix, noticeable silhouette gain. (BookRoom.tsx — add ~5 meshes near `shelfLX - 0.5, oz + 0.5`)

2. **Warm-room wood differentiation** — shift IdeaLab wood +5% red saturation and BookRoom wood +5% cooler/darker, so the 3 warm rooms each own a slightly different wood hue. One-line constant changes per room, massive cross-room distinctness win. (BookRoom.tsx `WOOD_MID` / IdeaLab.tsx `WOOD_MID` — nudge HSL)

3. **ProductRoom desk top break** — add a thin cable-grommet line or mid-trim cutout on the 2.2×0.95 desk top. Currently the single biggest flat surface in ProductRoom. (ProductRoom.tsx ~line 223 — insert ~1 mesh)

4. **BookRoom hero animation** — the library has breathing motion but no "wow" focal animation. Consider: one book slowly sliding out from a shelf and back (0.15s every 5s), or the lamp chain swaying. Library needs its spinning-fan equivalent. (BookRoom.tsx — add useFrame ref + position oscillation on one hero book)

5. **IdeaLab pegboard tool composition** — the hammer head + handle and screwdriver shaft + grip read as separate floating boxes because they share the same pegboard Z-plane with no parent grouping. Wrap each multi-part tool in a `<group>` at its base position. Minor composition fix, better silhouette read. (IdeaLab.tsx `PEG_TOOLS` → refactor to composite tool specs)
