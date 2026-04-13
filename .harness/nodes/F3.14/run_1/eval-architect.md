# F3.14 Other Rooms — Architect Review

Commit: 2d34b4c
Files: ProductRoom.tsx / BookRoom.tsx / IdeaLab.tsx

## Gate results
- tsc: PASS (exit 0, no output)
- eslint: PASS (exit 0, no output)
- build: PASS (`vite build` succeeded, 647 modules, 209ms)

## Findings

### ProductRoom.tsx

- 🔵 Theme-aware edges correctly implemented via store selector. `ProductRoom.tsx:124-125` pulls `theme` from `useWorldStore` and derives `edgeColor`. This is actually *stronger* than the MyRoom reference, which still hardcodes `EDGE_COLOR = '#0a0a14'` at module scope (`MyRoom.tsx:25`). Edge color is propagated through `ScreenStand` props (`ProductRoom.tsx:68`).
- 🔵 All `flatShading` set. Every `meshPhongMaterial` in the file uses `flatShading` — verified by eye across lines 74-471. No textures, no post, no MSAA references.
- 🔵 Zero per-frame allocation. `useFrame` callback at `ProductRoom.tsx:150-182` only reads `clock.getElapsedTime()`, scalar math, and mutates pre-existing refs' material / position / rotation. No `new` anywhere. Module-scope constants (`LED_BLINK_SPEED`, `FAN_SPEED`, `SCANLINE_*`, `RACK_LEDS`, `DESK_LEGS`) are reused. The only `new THREE.Color` (`ProductRoom.tsx:130`) is inside `useMemo` — one-time init, correct.
- 🔵 Determinism. `bandTints` uses `makeRng(BAND_SEED)` with explicit seed `0xc0de01` (`ProductRoom.tsx:47,128-139`). No `Math.random` anywhere in the rooms dir.
- 🔵 Hero anatomy — server rack is split into: outer case (line 372), front panel (377), top cap (382), 4 horizontal slots (387-393), 6 LEDs (395-406), fan housing + blade (408-415), cable coils (417-424). Desk is top + trim + 8 legs (2 stacks) + cable tray (223-248). Both clearly multi-piece.
- 🔵 Clutter density. Counted small props on/around desk: keyboard, 3 keyboard key strips, mousepad, mouse, laptop body + LED, mug + coffee disc, 3 headphone pieces, 3 sticky notes, 2 USB drives, rubber duck body + head + beak, 3 product cubes, cyan floor stripe, cable coil ×2, crate sticker. Well over 20 props — exceeds target of 8.
- 🔵 Micro-animations: (1) dual monitor power LEDs blink (154-158), (2) 6 rack LEDs phased blink (161-167), (3) fan rotation (170-171), (4) dual scanline bars vertical sweep (174-177), (5) accent light breathing (180-181). Five independent animations, all via refs. Exceeds target of 3.
- 🔵 Accent lighting: cyan `<pointLight ref={accentLightRef}>` at line 462 with breathing animation at 180-181. Plus a secondary cool blue fill light at 470. Color = `CYAN` (`#22d3ee`).
- 🔵 Code hygiene. `ScreenStand` extracted as sub-component for DRY (68). `bandTints` memoized. `RACK_LEDS`, `DESK_LEGS`, `PRODUCT_COLORS` are module-scope readonly. No dead code, no logs.
- 🟡 Nit only: `RACK_LEDS` entry layout is `[dy, dx, color]` (Y before X) — unusual ordering and only documented by the code (`ProductRoom.tsx:50`). Not a correctness issue, but if someone extends this they'll trip. Non-blocking.

### BookRoom.tsx

- 🔵 Theme-aware edges via `useWorldStore` at `BookRoom.tsx:64-65`. Forwarded into `Bookshelf` via `edgeColor` prop (178, 208).
- 🔵 All materials `flatShading`. Verified across the file.
- 🔵 Zero per-frame alloc. `useFrame` at `BookRoom.tsx:88-119` only mutates `lamp.material.emissiveIntensity`, `accentLight.intensity`, `page.rotation.x`, and `dustRefs[i].position.y`. `dustMotes` is read-only from the memoized array — no allocation. All constants module-scope.
- 🔵 Determinism. `dustMotes` seeded via `makeRng(DUST_SEED = 0xb00c2a)` inside `useMemo` (68-80). Bookshelves take explicit seeds `0xb001a5` / `0xb0012e` (176, 206). No `Math.random`.
- 🔵 Hero anatomy — reading chair is a full 7-piece build: base block, seat cushion, back rest frame, back cushion, left arm, right arm, throw blanket, scatter cushion (237-281). Side table is top + pedestal + base (283-297). Lamp is base + stem + shade + glowing bulb element (300-318). Excellent.
- 🔵 Clutter density. Props in scene: throw blanket, scatter cushion, bookmark, tea cup base + body + liquid disc, eyeglasses (2 torus rings + bridge), 3 floor books, 3 fern box leaves + pot, globe base + stem + sphere + brass ring, framed picture frame + backing, 5 dust motes, open-book L/R halves. Well over 15 — exceeds target of 8.
- 🔵 Micro-animations: (1) lamp flicker (two-wave sin combo, 92-97), (2) amber accent light breathing (100-103), (3) open-book page flutter (106-109), (4) 5 floating dust motes (112-118). Four animations, all via refs. Exceeds target of 3.
- 🔵 Accent light: warm amber `pointLight` with breathing at 438-445. Color `#f5c678` (AMBER_WARM), distinct from ProductRoom's cyan. Plus a wide ambient fill at 447.
- 🔵 Code hygiene. `DUSTY_SPINES` is module scope, seeds documented, refs declared in stable order.
- 🟡 `dustMotes[i]` access at line 116 assumes `dustRefs.current.length === dustMotes.length`. Both driven by the same array so it's correct, but a `if (!spec) continue` guard would harden it. Non-blocking.

### IdeaLab.tsx

- 🔵 Theme-aware edges at `IdeaLab.tsx:100-101`. Used throughout.
- 🔵 All `flatShading` set. Verified.
- 🔵 Zero per-frame alloc. `useFrame` at `IdeaLab.tsx:130-178` reads `t = clock.getElapsedTime()`, computes `yOffset` once, and mutates ref positions/rotations/material scalars. The prototype uses `m.userData.baseX` / `baseZ` stored via `onUpdate` at mount (316-319) — this is a clean pattern to avoid re-reading `benchX/Z` from closure and still allows clean vibration math. No allocations.
- 🔵 Determinism. `sketches` memoized via `makeRng(0x1dea5c)` (104-117). `BOARD_LINES`, `BENCH_LEGS`, `PEG_TOOLS`, `PLANK_STRIPES` all readonly module-scope arrays.
- 🔵 Hero anatomy — workbench is top slab + darker trim band + 4 chunky legs + cross-brace + vise body + vise screw (278-310). Prototype is body + circuit-board top + LED indicator (313-335). Pegboard is board + 15 holes + 7 hanging tools (435-456). All multi-piece.
- 🔵 Clutter density. Counting props: 2 oil stains, 6 scattered paper sketches, 11 board lines, board heading bar, marker tray + 3 markers, vise body + screw, prototype body + PCB + LED, 3 gears, soldering iron body + tip + stem, bench wrench + hammer head + handle, jar outer + screws + cap, tape roll, pencil cup + 3 pencils, 2 paper rolls, 15 pegboard holes, 7 hanging tools, hanging rope + swinging wrench, cork board + 3 pinned sketches, stool seat + 4 legs, bulb + screw base. Well over 30 — exceeds target of 8.
- 🔵 Micro-animations: (1) floating bulb bob + pulse (134-140), (2) bulb light tracks position + intensity (141-145), (3) gear A rotate (148-149), (4) gear B counter-rotate (150-151), (5) gear C rotate (152-153), (6) prototype vibrate (156-160), (7) hanging tool swing (163-166), (8) solder tip glow pulse (169-173), (9) accent light breathing (176-177). Nine animations — blows past the target of 3.
- 🔵 Accent light: amber `pointLight ref={accentLightRef}` with breathing (527-533). Color `AMBER_BULB` (`#fbbf24`), distinct from ProductRoom cyan and BookRoom warm-amber. Plus `bulbLightRef` which tracks the bulb position, a second animated light (524).
- 🔵 Code hygiene. Excellent separation of interfaces (`BoardLine`), module-scope data. `PEG_TOOLS` uses a compact tuple with a documented shape. `userData.baseX/baseZ` stored via `onUpdate` rather than recomputed per frame — the right call.
- 🟡 `prototypeRef.current.userData.baseX` could theoretically be `undefined` on the first frame if React's ref is set before `onUpdate` fires. In practice `onUpdate` runs synchronously during the initial commit before useFrame ticks, so this is fine — but `proto.userData.baseX ?? benchX` would belt-and-suspenders it. Non-blocking.

## Cross-room / constraint compliance

- 🔵 Frozen files untouched — review is scoped to 3 room files + their natural callees.
- 🔵 No textures, no post-processing imports, no MSAA references. All materials are `meshPhong` with `flatShading`.
- 🔵 Theme-aware edges: all 3 rooms pull `theme` via `useWorldStore((s) => s.theme)` and use `#0a0a14` dark / `#5a4830` light. This matches spec exactly and is actually more correct than the MyRoom reference (which hardcodes the dark edge color). Flag for later: MyRoom should be retrofitted, but that's not in-scope for F3.14.
- 🔵 Accent lights differ across rooms: Product = cyan `#22d3ee`, Book = amber `#f5c678`, Idea = gold `#fbbf24`. Spec met.
- 🔵 All three rooms use `makeRng` with explicit hex seeds. Fully deterministic.

## Scores

1. Constraint compliance: **15/15** — all constraints met; theme-aware edges actually exceed the reference.
2. Zero per-frame alloc: **15/15** — clean scans of all three useFrame callbacks; only module-scope constants and ref mutations.
3. Determinism: **10/10** — `makeRng` with explicit seeds, memoized scatter data, no `Math.random`.
4. Proportions / anatomy: **15/15** — server rack 6+ pieces, reading chair 7 pieces, workbench 6+ pieces. No monolithic hero objects.
5. Clutter density: **15/15** — every room has 15+ props, IdeaLab has 30+. Way over target.
6. Micro-animations: **15/15** — 5 / 4 / 9 animations per room respectively, all ref-based, zero per-frame alloc.
7. Accent lighting: **10/10** — each room has a colored animated point light with distinct hues.
8. Code hygiene: **5/5** — sub-component extraction, memoized scatter, typed tuples, no dead code, no logs.

## Total: 100/100
## Verdict: 🔵 PASS

Code is genuinely clean. The F3.13 implementation meets or exceeds every quality dimension set by the MyRoom reference bar, and is actually ahead of MyRoom on theme-aware edges (worth filing as a future MyRoom retrofit, not an iteration blocker here). Gates all green. Ship it.
