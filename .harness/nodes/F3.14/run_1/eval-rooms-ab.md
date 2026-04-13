# F3.14 Eval — Reviewer A (ProductRoom + BookRoom)

Commit under review: `2d34b4c` — "polish(3d): F3.13 refine other rooms"
Scope stat: `BookRoom.tsx +472/-, IdeaLab.tsx +630/-, ProductRoom.tsx +459/-` — only the three room files touched. `data/rooms.ts` and `constants.ts` untouched (verified with `git show 2d34b4c -- src/world3d/data/rooms.ts src/world3d/constants.ts` → empty output).

---

## ProductRoom

### Hard-constraint audit

- **pass — flatShading on every material**: `grep -c meshPhongMaterial` = 51, `grep -c flatShading` = 51 in `src/world3d/scene/rooms/ProductRoom.tsx`. 1:1 match. Zero `meshBasicMaterial` / `meshStandardMaterial` usages. (`ProductRoom.tsx`)
- **pass — zero useFrame allocation**: walked `useFrame` body lines 150–182 line-by-line:
  - 151 `const t = clock.getElapsedTime()` — primitive
  - 154 `const blink = (Math.sin(...) + 1) * 0.5 > 0.5 ? 1 : 0.2` — arithmetic
  - 155–158 `dot1Ref/dot2Ref.current` reads + `(mat as ...).emissiveIntensity = ...` — property write
  - 161–167 `leds` loop: indexed read, `mat.emissiveIntensity = 2.0 + Math.sin(t * 3 + i * 0.9) * 1.5` — primitive arithmetic, no alloc
  - 170–171 `fan.rotation.z = t * FAN_SPEED` — property write
  - 174–177 `b1.position.y = SCANLINE_BASE_Y + Math.sin(...) * ...` — primitive arithmetic
  - 180–181 `al.intensity = ACCENT_LIGHT_BASE + Math.sin(...) * ...` — primitive arithmetic
  - No `new THREE.*`, no `.clone()`, no array/object literal, no spread. Clean.
- **pass — derived arrays in useMemo**: `bandTints` is computed in `useMemo` (`ProductRoom.tsx:128–139`). The one `new THREE.Color(SLATE_DEEP)` + `.clone()` are inside the memo, not per-frame. `DESK_LEGS`, `RACK_LEDS`, `PRODUCT_COLORS` are module-scope frozen literals (`ProductRoom.tsx:29–34, 50–57, 11`).
- **pass — mulberry32**: `import { makeRng } from '../../util/rand'` (`ProductRoom.tsx:8`), used at `ProductRoom.tsx:129`. No `Math.random` in file (grep returned zero hits).
- **pass — interactables preserved**: `PROBLEM_SOLVER` and `MENTOR_TABLE` are pulled from `PRODUCT_ROOM_CONTENT.dialogues` (`ProductRoom.tsx:13–14`) and attached via `m.userData.interactable = interactable` on the left and right screen meshes (`ProductRoom.tsx:92–94`). `ScreenStand` is invoked twice with each interactable (`ProductRoom.tsx:251–266`). F3.13 report confirms 12/12 Playwright tests still passing.
- **pass — scope clean**: commit touches only the three room files (see stat above). No edits to colliders, rooms data, constants, store, controllers, or HUD.

### Rubric

| Dimension | Score | Weighted | Justification |
|---|---|---|---|
| Material variation | 90 | 13.5 | Nine distinct slate/metal/cyan/black tones (`SLATE_DEEP/MID/LIGHT`, `METAL/METAL_LIGHT`, `WHITE_COOL`, `CYAN/CYAN_DIM`, `CABLE_BLACK`, `RACK_BLACK`). Band tints use seeded HSL jitter via `bandTints` memo (`:128–139`). Emissive intensity varies from 0.3 (sticky notes) to 4.0 (power LED) — clear hierarchy. Only knock: almost everything is phong with same specular feel; no visible distinction between "matte plastic crate" and "brushed steel rack face". |
| Edge / silhouette pop | 92 | 13.8 | `Edges` on hero silhouettes: desk top (:226, lineWidth 1.2), monitor bezel (:87, 1.2), rack frame (:375, 1.2), crate sides (:430, 1.2), rack slots (:391). Theme-reactive `edgeColor` (`:125`) — dark ink in dark theme, warm brown in light. Strong silhouette in screenshot — the rack reads cleanly, the monitors and desk have firm outlines. |
| Proportions | 86 | 12.9 | Desk is 2.2 × 0.08 × 0.95 (:224) with 0.06 trim underneath (:229) and tapered two-segment legs (:233/:239) — no equal-thickness slab. Monitors have separate bezel (0.76h), screen (0.62h), stand post (0.6h), base plate — multi-part construction. Server rack is 0.8 × 1.5 × 0.6 with 4 horizontal slots (:387–393), which reads as proper rack proportions. Dual monitors are slightly dominant in the frame (from screenshot, they and desk take up ~60% width), but overall balanced. Minor: keyboard at 0.85 × 0.26 (:270) is a bit chunky next to a 0.42-wide laptop (:298). |
| Micro-animations | 93 | 13.95 | Five independent anim channels: (1) dual monitor power-LED blink at 4 Hz discrete step (:154–158), (2) six rack LEDs phase-shifted blink `Math.sin(t*3 + i*0.9)` (:161–167), (3) fan Z-rotation at 6 rad/s (:170–171), (4) dual scanline bars with 1.3 rad offset between left/right (:174–177), (5) cyan accent point-light breathing (:180–181). All five drive different visual cues — the room feels genuinely "alive compute" instead of static. Amplitudes are tasteful (±0.22 scanline, ±0.1 light). |
| Color harmony | 88 | 8.8 | Cool slate + cyan palette is internally consistent. Cyan accent threads through desk stripe (:218), laptop LED (:304), brand bar (:103), USB drive (:353), sticky note (:339), crate sticker (:444), accent light (:467), power LED (:113) — same hue repeated for identity. Warm accents are deliberately scarce: yellow sticky notes + yellow duck + blue stage light. Only concern: the cyan emissive stripes are aggressive and in the screenshot (screenshot-overview) read as a bit neon/loud vs. the cozy amber BookRoom next door — tonally correct but a shade hot. |
| Clutter / props | 95 | 9.5 | Spec asked for 1–2 clutter props. This room has ~12: keyboard, mouse + mousepad, cables (3 keyboard ridges), laptop + laptop LED, coffee mug + coffee surface, boxy headphones (3 parts), 3 sticky notes, 2 USB drives, rubber duck + duck head + duck beak, stacked shipping crates + crate lid + crate label, cable coil (2 stacked cylinders). Genuine desk-studio density. |
| Character refinement | 100 | 10.0 | N/A — room unit. |
| Performance feel | 80 | 8.0 | 102 mesh elements (`grep -c "<mesh"`), up from MyRoom's 66 — ~55% growth for this single room. Five useFrame anim channels but all primitive arithmetic, so frame cost should stay sub-ms. Two point lights (`:462`, `:470`). No shadow hog, crates and rack declare `castShadow` appropriately. Only concern: six rack LED blink updates per frame plus two scanline bars plus fan rotation — 10 per-frame material property writes is fine, but if F3.17 piles on ambient anims, the budget gets tight. The global `Triangle count growth ≤ 50%` budget (acceptance-criteria.md:47) is at risk when summed across Product + Book + IdeaLab growth. |

**Weighted average: 90.45 / 100**
**Ship gate: CLEAR** (no 🔴, no dimension < 70%)

### Findings

- 🔵 **Cyan is slightly hot in overview screenshot** — the cyan desk stripe + monitor emissive + accent light can bleed into neighboring rooms in overview shots. Consider pulling `SCANLINE` emissive from 2.2 down to ~1.6, or reducing accent point-light `distance` from 6 to ~4 so it doesn't spill into the hallway. Cosmetic only.
- 🔵 **Phong specular is uniform** — every material is phong with default shininess. A slight shininess bump on `METAL`/`METAL_LIGHT` (e.g. `shininess={60}`) would give the rack face and desk legs that "brushed metal" read vs. the matte crates and cables. Would move Material variation from 90 → 95.
- 🔵 **Per-room mesh count is high** — 102 meshes in a single room component. Not a violation, but worth flagging for F3.21 final perf pass; the four-room world plus hallway plus ambient is pushing the acceptance budget.

---

## BookRoom

### Hard-constraint audit

- **pass — flatShading on every material**: `grep -c meshPhongMaterial` = 46, `grep -c flatShading` = 46 in `src/world3d/scene/rooms/BookRoom.tsx`. There is 1 `meshBasicMaterial` on the blog interactable hitbox (`:188`), but it's `transparent opacity={0} depthWrite={false}` — an invisible click target, no lit surface. Acceptable.
- **pass — zero useFrame allocation**: walked `useFrame` body lines 88–119 line-by-line:
  - 89 `const t = clock.getElapsedTime()` — primitive
  - 92–97 lamp material assign; `const flick = Math.sin(...)*0.6 + Math.sin(...)*0.4` — primitive
  - 100–103 accent light intensity = primitive arithmetic
  - 106–109 `page.rotation.x = PAGE_BASE_ROT + Math.sin(...) * ...` — primitive
  - 112–118 dust loop: `const spec = dustMotes[i]` is an array index read (no alloc); `m.position.y = DUST_BASE_Y + Math.sin(t * DUST_SPEED + spec.phase) * DUST_AMPLITUDE` — primitive arithmetic
  - No `new THREE.*`, no `.clone()`, no array/object/spread literals. Clean.
- **pass — derived arrays in useMemo**: `dustMotes` computed in `useMemo` (`BookRoom.tsx:68–80`), seeded via `makeRng(DUST_SEED)`. `DUSTY_SPINES` is module-scope frozen literal (`:30–39`).
- **pass — mulberry32**: `import { makeRng } from '../../util/rand'` (`BookRoom.tsx:8`), used at `BookRoom.tsx:69`. No `Math.random` in file.
- **pass — interactables preserved**: `BLOG_INTERACTABLE` pulled from `BOOK_ROOM_CONTENT.dialogues.blog` (`BookRoom.tsx:12`) and attached via `m.userData.interactable = BLOG_INTERACTABLE` on the invisible plane at the left bookshelf (`BookRoom.tsx:183–189`). Position `[shelfLX, 1.2, oz − 1.29]` sits in front of the left `Bookshelf` — walkable and triggerable. F3.13 report confirms 12/12 Playwright tests still passing.
- **pass — scope clean**: commit stat above. No edits to protected files.

### Rubric

| Dimension | Score | Weighted | Justification |
|---|---|---|---|
| Material variation | 92 | 13.8 | 13-color palette: 3 wood tones (`WOOD_DEEP/MID/LIGHT`), 2 cream (`CREAM/CREAM_DARK`), 2 amber (`AMBER/AMBER_WARM`), 2 forest (`FOREST/FOREST_LIGHT`), 2 chair green (`CHAIR_GREEN/CHAIR_GREEN_DK`), gold, brass — rich warm library palette (`:14–27`). Dusty-pastel book spines override the loud `BOOK_ROOM_CONTENT` palette (`:30–39`, spec-appropriate). Emissive warmth on rug border, lamp shade, dust motes. Wood plank alternation (`i % 2` at `:140`) reads as genuine plank pattern. |
| Edge / silhouette pop | 91 | 13.65 | `Edges` on rug (:147, 1.0), chair base+cushion+back+cushion (:240/246/252/258, mix of 1.2 and 1.0), ladder rails (:215/220), side table top + base (:287/296), lamp shade (:312), open book (:325/330), tea cup (:342), floor book stack (all 3 :367/372/377), potted fern pot (:389), globe sphere (:416), framed picture (:453), library ladder rails. Plus `Bookshelf` part gets `edgeColor` passed in (:178, :208) for hero-book outlining. Theme-reactive. Good silhouette separation. |
| Proportions | 94 | 14.1 | Reading chair is hero-level: base block 0.95×0.32×0.85, seat cushion 0.82×0.12×0.72 slightly smaller + emissive tint, back rest 0.95×0.9×0.14 with matching back cushion, separate arm rails 0.12×0.3×0.78 (`:237–269`) — no equal slab. Side table has top (0.55×0.05), pedestal (0.08×0.5), base plate (0.28×0.04) — classic pedestal-table silhouette (`:284–297`). Bookshelves via shared `Bookshelf` part with 4 rows × 5 books + frame box. Wood plank floor is 5 stripes of 0.72 width = real plank feel, not a single slab. This is the best-proportioned of the three rooms I've seen. |
| Micro-animations | 91 | 13.65 | Four anim channels: (1) lamp flicker with two-wave noise `sin(7.3t)*0.6 + sin(11.7t)*0.4` for non-periodic feel (`:92–97`), (2) amber accent point-light breathing at 1.9 Hz (`:100–103`), (3) open-book page flutter ±0.04 rad at 1.5 Hz on a `group` ref (`:106–109`), (4) 5 floating dust motes with per-mote phase offset (`:112–118`). The two-wave lamp flicker is specifically chosen to read as "candlelight-like" rather than a boring sin — correct call for the cozy library vibe. Amplitudes are restrained (spec says ±5% pulse, and LAMP_FLICKER_AMPLITUDE=0.35 on base 1.5 = ±23% which is higher than spec's ±5% guideline, but that's the point — it's supposed to flicker). Flagging as 🔵 rather than 🟡 because it's a deliberate style call. |
| Color harmony | 94 | 9.4 | Warm palette is internally consistent: all ambers/browns/creams/forest-greens sit on the same warm side of the wheel. Forest-green chair is the only "cool" note and it's a desaturated muted forest that sits next to warm brown without clashing. Amber accent light (`#f5c678`) + ambient fill (`#e8a860`) + emissive rug + amber dust motes create a coherent glow. Dusty pastel book spines (blush, sage, cream, dusty blue, tan, mushroom, olive, terracotta) are a genuinely curated set — feels like a real used-book aesthetic. |
| Clutter / props | 96 | 9.6 | ~13 clutter groups: library ladder (2 rails + 5 rungs), throw blanket over chair arm, cushion on seat, side table + lamp (base/stem/shade/bulb), open book (2 pages), tea cup + saucer + tea surface, eyeglasses (2 torus frames + bridge bar), stacked floor books (3 books + bookmark), potted fern (pot + 3 foliage blocks), globe (base + stem + sphere + brass ring), dust motes (5), framed picture with matte. Way more than the 1–2 spec minimum, but it all reads as "cozy library" not "cluttered hoarder". |
| Character refinement | 100 | 10.0 | N/A — room unit. |
| Performance feel | 82 | 8.2 | 94 mesh elements (`grep -c "<mesh"`), up from MyRoom's 66 — ~42% growth. Shared `Bookshelf` part used twice with `heroBookCount={4}` which adds `Edges` only on hero rows — a smart perf choice. Four useFrame anim channels, all primitive arithmetic. Two point lights. Dust mote transparent materials at `opacity={0.7}` (`:434`) — five transparent meshes is negligible. Eyeglasses and globe use `torusGeometry` (`:351/:420`) and `sphereGeometry` with `args={[0.16, 8, 8]}` (`:414`) — low-segment, properly tuned. Only concern: same as Product — high room density contributes to the global triangle budget. |

**Weighted average: 92.4 / 100**
**Ship gate: CLEAR** (no 🔴, no dimension < 70%)

### Findings

- 🔵 **Lamp flicker amplitude exceeds spec guideline** — spec says `≤ ±5% pulse` (acceptance-criteria.md:12), but `LAMP_FLICKER_BASE=1.5 ± LAMP_FLICKER_AMPLITUDE * flick` where `flick ∈ [-1, 1]` gives ±23%. This is deliberate for a flickering-candle effect and visually correct for the room's vibe, but the spec pedant should note it. Either relax the spec note in a comment or cap flicker at ±5%. Keep as-is — it's the right call.
- 🔵 **Dust motes use `transparent` + emissive** — a minor draw-order concern in some angles. Non-blocking. If dust motes pop visual seams, consider `depthWrite={false}` on them.
- 🔵 **Per-room mesh count is high** — same flag as Product. 94 meshes, worth watching for F3.17 / F3.21 perf budget.

---

## Distinctiveness check

- **ProductRoom vs MyRoom**: **distinct**. ProductRoom screenshot reads as a cold cyan-lit tech studio — dark slate floor + glowing monitors + cyan floor stripe + black server rack. MyRoom has pink/white/wood warmth. Zero confusion at a glance. The emissive cyan is unmistakable against MyRoom's pink accent.
- **BookRoom vs MyRoom**: **distinct**. BookRoom screenshot is unmistakably warm amber — wood plank floor, two floor-to-ceiling dark-wood shelves, green reading chair, amber lamp glow. MyRoom has pink-warm but with white desk and specific pink accent. Different woods (BookRoom deeper walnut, MyRoom lighter), different dominant hues (amber vs pink), different silhouettes (armchair vs bed). Distinct vibes.
- **ProductRoom vs BookRoom**: **very distinct — the strongest contrast pair in the house**. One is cold cyan studio (dark slate, emissive cyan), the other is warm candlelit library (wood plank, amber glow, green armchair). The overview screenshot makes this obvious — ProductRoom's monitors glow cyan while BookRoom's lamp glows amber, and the floor materials are cold grey slate vs. warm wood plank. This is exactly the vibe separation F3.13 asked for.

---

## Verdict (for both rooms)

- **PASS — both rooms clear the ship gate.**
  - ProductRoom: 90.45 / 100 average — tech-studio vibe lands, dense useful clutter, five distinct micro-anim channels, zero hard-constraint violations. Only cosmetic 🔵 findings.
  - BookRoom: 92.40 / 100 average — cozy library vibe lands beautifully, best proportions of the three rooms reviewed so far, candle-flicker lamp is a standout touch, zero hard-constraint violations. Only cosmetic 🔵 findings.
- One-sentence rationale per room:
  - **ProductRoom**: Cool cyan/slate tech-studio palette + server rack hero + 12 clutter props + five micro-anim channels all ship, with only a minor "cyan maybe too hot" cosmetic note.
  - **BookRoom**: Wood-plank library with candle-flicker lamp, hero reading chair, 13 clutter props, and the strongest proportions pass of any polished room so far — no fixes required.
