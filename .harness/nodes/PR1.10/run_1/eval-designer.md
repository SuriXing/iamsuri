# PR1.10 — Designer Review (run_1)

## Scope

Final design review of `src/world3d/scene/rooms/ProductRoom.tsx` against acceptance criteria OUT-1 (composition depth), OUT-2 (station distinctness), OUT-4 (surface treatment), OUT-5 (palette + lighting), OUT-6 (brand voice / BookRoom parity), plus hero-focal anchoring and first-glance impact from the player's entry POV (door at -z, looking +z).

Reference: `~/.harness/design-note.md` (PR1.1) and gold standard `BookRoom.tsx`. Engineering correctness, modal wiring, collider math, perf, and TS types are out of scope (covered by frontend reviewer).

---

## Findings

### 🔴 [F-1] Legacy desk + server rack + crate stack NOT removed — break the 3-layer composition (OUT-1, OUT-6)
**File:** `ProductRoom.tsx:319-522` (desk block, server rack block, shipping-crate block, product-cubes-on-desk block)
**Reasoning:** Design note PR1.1 §"Compatibility Note" is explicit: *"Old desk + dual monitors + back-wall cards are removed."* The PR1.7 inline comment at line 319 even acknowledges *"legacy ScreenStand dual monitors removed; their dialogues now live on the unified station row"* — yet the **desk slab itself, both legs sets, keyboard, mousepad, mouse, laptop, mug, headphones, sticky notes, USB drives, rubber duck, server rack with LEDs + fan, and double crate stack all remain in the scene**. From the player's spawn POV walking through -z looking +z, this turns the supposed clean foreground (rug) → midground (6 stations) → background (hero) read into: rug → **massive cluttered desk wall + black server rack on the left + brown crates on the right** → tiny glimpses of stations behind them → hero buried at the back. The midground layer is dominated by abandoned props that the design note explicitly retired. This is the single biggest blocker to OUT-1 reading correctly.
**Fix suggestion:** Delete lines 319-522 wholesale (desk geometry, keyboard/mouse/pad, laptop, mug, headphones, sticky notes, USB drives, rubber duck, server rack + fan ref + LED refs + cables, crate stack, product cubes). Remove `pr-desk`, `pr-rack`, `pr-crate` colliders at lines 201-203. Keep only the 4 station + 1 hero colliders. The room will breathe; the 6 stations will become the actual midground; the hero will be visible. Cost: ~200 lines deleted, dramatic composition gain.

### 🔴 [F-2] Hero focal piece is visually outranked by the 6 station monitors (OUT-3 anchoring intent)
**File:** `ProductRoom.tsx:704-781` (hero glass case) vs `:609-616` (station screen emissive)
**Reasoning:** Hero cube emissive intensity = `0.9` (line 774). Station screens emissive intensity = `1.6` (line 612), and there are SIX of them in a row directly in front of the hero, each ~0.85m wide. The hero cube is only 0.22m and sits at y=0.95, while station monitors are centered at y≈1.45-1.55 and span much larger silhouettes. From the door, the eye reads "wall of glowing rectangles" and the small dim cube behind/below them never wins. Compare to BookRoom: the globe/gold-frame pair has nothing competing for attention in its z-band. Hero must be the brightest *or* the largest *or* the most isolated thing in the scene; here it is none of the three.
**Fix suggestion:** Pick one: (a) raise hero cube emissive to 1.8-2.2 and drop station screen emissive to 1.0; (b) raise the hero pedestal 0.3m so the cube center sits at y≈1.25 above the station bezel-tops; (c) widen the gap — push hero to oz+2.25 and pull stations forward to oz+1.35 so there's a clear 0.9m air gap. (a)+(b) combined is cleanest.

### 🔴 [F-3] Key light color violates the cool-tech palette (OUT-5)
**File:** `ProductRoom.tsx:805` (`color="#ffd9b0"`)
**Reasoning:** OUT-5 mandates *"Cool tech palette (slate/steel/cyan) preserved"* and the design-note lighting plan specifies key = `#e6ecf2` (cool white). The current key is `#ffd9b0` — that's a **warm amber/cream** straight out of BookRoom's vocabulary. It tints every slate surface warm, fights the cyan accents, and is the single biggest reason any screenshot will read "cozy library" instead of "cool war-room." This single hex value pulls the whole palette off-axis.
**Fix suggestion:** Restore `color="#e6ecf2"` per design note, OR a cool blue-white like `#dde8f5`. Bump intensity from 0.8 → 0.9 to compensate for the loss of warmth perceived brightness. Distance was changed from spec's 9 to 6 — also revert.

### 🟡 [F-4] Per-station decorative props missing on 3 of 6 stations (OUT-2)
**File:** `ProductRoom.tsx:668-699` (only `i === 1`, `i === 3`, `i === 4` get props)
**Reasoning:** Design note table specifies a deco prop *per station* (mug, sticky stack, trophy, books). Current code gives stations 0, 2, 5 nothing but the universal cable coil. Cable coil alone reads as repetition, not distinction — exactly the silhouette monotony OUT-2 is meant to break. BookRoom precedent: every reading-zone prop (chair, table, lamp, open book, tea cup, glasses, stacked floor books, dust motes) earns its place. Stations 0/2/5 currently look "unfinished" next to 1/3/4.
**Fix suggestion:** Add: station 0 → small white coffee mug (cylinder, like the desk one, 0.05r × 0.10h); station 2 → small gold trophy block (0.06×0.12×0.04 amber/gold); station 5 → mini book stack (2 small boxes, dusty colors from BookRoom palette). All should sit on plinth top at `plinthBaseY + plinthH + 0.04`.

### 🟡 [F-5] Station labels are oversized and risk visual collision (OUT-6 craft)
**File:** `ProductRoom.tsx:633-659` (`<Html transform>` with fontSize 34px, distanceFactor 1)
**Reasoning:** With `transform` mode + `distanceFactor=1` + 34px font and stations packed at ~0.84m stride, the label DOM elements render as roughly 0.7-1.0m wide rectangles in 3D space. Adjacent labels likely overlap when viewed at oblique angles, and the heavy `rgba(15,23,42,0.88)` background + 1px accent border + 6px shadow reads as "SaaS UI floating in 3D" rather than the hand-built voxel signage in BookRoom. BookRoom uses HTML sparingly and at smaller scale (BookRoom 14px for the 许三观 title).
**Fix suggestion:** Drop fontSize to 18-22px, reduce padding to `2px 8px`, set `distanceFactor={2}` to shrink in world space, and consider replacing the dark-pill background with a simple SLATE_LIGHT plate mesh under the label (more voxel, less DOM). Alternatively, render the label as a thin extruded box with a `<Text>` from drei for true low-poly parity.

### 🟡 [F-6] Coffer ceiling competes with the hero — too much surface emissive (OUT-5 layered lighting)
**File:** `ProductRoom.tsx:304-317` (9 white-cool emissive coffer cells, intensity 0.4 each)
**Reasoning:** Nine 0.86m squares of white-cool emissive at intensity 0.4 across the entire 3×3m ceiling = a giant glowing grid that draws the eye UP at first glance, away from the hero/stations at eye level. Layered lighting wants the brightest surfaces near the focal subject, not the architectural shell. BookRoom has zero ceiling emissive — the lamp shade is the brightest surface and it sits at table height where it belongs.
**Fix suggestion:** Drop coffer emissiveIntensity from 0.4 → 0.12, OR reduce to 4 cells (2×2) instead of 9, OR change color to a dim cyan-tinted `#b8c8d4` so the grid contributes ambient cool wash without pulling focus.

### 🟡 [F-7] Showcase wall shelf is dead geometry on -z wall behind the player (OUT-1, KISS)
**File:** `ProductRoom.tsx:784-792` (brushed-metal shelf + cyan glow strip at `oz - 2.4`)
**Reasoning:** This shelf was the mounting surface for the old back-wall showcase cards which the redesign collapsed into the station row (per design-note compatibility note). It now sits on the -z wall **behind the player on entry** — invisible during the critical first-glance moment, and its emissive cyan strip pulls the eye backward when the player turns around. Dead surface area, contributes nothing to the +z composition.
**Fix suggestion:** Delete lines 784-792.

### 🟡 [F-8] Foreground threshold layer is thin (OUT-1)
**File:** `ProductRoom.tsx:233-252` (entry rug + 4 border strips)
**Reasoning:** OUT-1 wants a real *foreground* layer. Current foreground = a flat 2.0×1.2m rug + 4 thin border strips, all on the floor at y=0.255. Nothing breaks the silhouette at eye level near the door. BookRoom equivalent has the front-wall flanking shelves bracketing the door at full height — that's what makes its entry read as a "threshold." Here the player walks past nothing tall before hitting the midground.
**Fix suggestion:** Add two short 0.6m-tall slate bollards / pylon posts flanking the door at `(ox±1.0, 0.5, oz-1.9)` with a small cyan accent strip on each — gives a vertical foreground silhouette and lets the eye step "through" something into the midground.

### 🔵 [F-9] Hero pedestal slate matches station plinth slate — hero blends into the row materially (OUT-2/OUT-3)
**File:** `ProductRoom.tsx:722` (pedestal `SLATE_DEEP`) vs `:580` (plinth `SLATE_MID`)
**Reasoning:** Both use the same slate family. To anchor as the hero, the pedestal should be *materially distinct* — e.g., pure brushed metal, dark walnut, or a concrete-y mid-grey — so the back-wall element reads as a different "kind of object." Currently the case looks like a 7th station with a cube on it.
**Fix suggestion:** Switch pedestal body to `WOOD_WARM` (`#8a6f4d`, already imported) for warm contrast against the cool palette — same trick BookRoom uses with its globe wood base in a green/gold room.

### 🔵 [F-10] Cable coil under every plinth = repeated motif, dilutes "lived-in" intent (OUT-6)
**File:** `ProductRoom.tsx:663-666` (cable coil per station, all stations)
**Reasoning:** When every station has the *same* prop, "lived-in detail" becomes "repeating texture." BookRoom varies its decorative pieces — no single prop appears six times.
**Fix suggestion:** Show cable coil on only 3 of 6 stations (e.g. odd indices), OR vary by index: coil / power brick / cable spool / ethernet bundle / surge strip / nothing.

### 🔵 [F-11] Sticky-note + USB-drive + rubber-duck cluster reads as SaaS-chrome creep (OUT-6)
**File:** `ProductRoom.tsx:414-451` (sticky notes, USB drives, rubber duck — all on legacy desk)
**Reasoning:** Resolved automatically if F-1 (delete legacy desk) is applied. If the desk stays for any reason, the duck + USB drives + 3 sticky notes pile is twee/quirky-startup, not the composed "war-room" the palette promises.
**Fix suggestion:** Covered by F-1.

### 🔵 [F-12] Station screen "scanline / alive" micro-interaction missing (Quality Baseline)
**File:** `ProductRoom.tsx:602-616` (station screen mesh — only static emissive)
**Reasoning:** Acceptance §Quality Baseline calls out *"every station screen reads as 'alive' via position-bob scanline only."* Current screens are static emissive boxes. No bob, no scanline. This is a polish miss, not a blocker.
**Fix suggestion:** Add one `<mesh>` per station as a thin 0.02h horizontal stripe inset 1cm in front of the screen, with `position.y = monitorY + Math.sin(t * 0.8 + i) * 0.04` in the existing useFrame. Position-only motion, palette-safe.

---

## Verdict

**ITERATE** — the core kit (palette, station variants, hero rotation, layered lighting, coffer ceiling, baseboards/trim, plank floor, rug) is in place, but legacy desk/rack/crate clutter (F-1) wrecks the 3-layer composition, the hero loses to 6 brighter screens (F-2), and the warm key light (F-3) breaks the cool-tech palette — three blockers must be fixed before deploy.
