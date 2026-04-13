# F3.8 Door+Walls Re-Review — Architect

## Code-Quality Audit
- 4 gates: 🔵 all green
  - `npx tsc -b` clean (zero output)
  - `npm run lint` clean (zero errors)
  - `npm run build` built in 194ms, 647 modules, `App3D-D-58in-3.js 972.69 kB / gzip 257.58 kB`
  - `npx playwright test --config=playwright.config.cjs --reporter=line` → 12 passed (1.8m)
- Colliders unchanged: 🔵
  - `Walls.tsx:73-76` WallStrip AABB registration identical to F3.5 (`hx: w/2, hz: d/2`)
  - `Door.tsx:92-107` lock-gated collider registration identical to F3.5 (same `colliderId`, same horizontal/vertical hx/hz math, same deps)
  - `git diff f83356d..9a1894c` on collider lines: zero changes
- flatShading: 🔵
  - `Door.tsx`: 25/25 `meshPhongMaterial` tags carry `flatShading`
  - `Walls.tsx`: 8/8 tags carry `flatShading` (body, baseboard, top cap, sconce plate, sconce glow, picture frame, picture canvas, vine)
- Per-frame allocs: 🔵
  - `Door.tsx:109-147` useFrame mutates only `angleRef.current`, `hingeRef.current.rotation.y`, `lockGroupRef.current.scale.x/y/z`, `lanternGroupRef` scales, and emissive refs. Zero `new`, zero literals.
  - `Walls.tsx` has NO useFrame (fully static geometry)
  - All `new THREE.Color` calls are inside `useMemo` or helpers called from `useMemo` (`Door.tsx:52, 233`; `Walls.tsx:43-44` inside `mixTint` called from memoized `tints`)
- Frozen constants: 🔵 (DOOR_POLISH/WALL_POLISH additive, OK)
  - `git diff f83356d..9a1894c -- constants.ts` is strictly additive: only new `DOOR_POLISH` (lines 85-107) and `WALL_POLISH` (lines 109-121) blocks appear.
  - `DOOR` (lines 76-83), `ROOM` (line 1), `GAP` (line 2), `CHARACTER`, `LIGHTS`, etc. byte-identical to F3.5.
- Wall props count: **16** (target ~16) 🔵
  - `Walls.tsx:274-310`: 4 HORIZONTAL_DOORS × 2 sides (L/R) × 2 props per side = 16
  - Deterministic `mulberry32(0xfacade01)`, pool = sconce/picture/vine
  - Rendered in `wallProps.map` at `Walls.tsx:341-351`
- Doormats: **4/4** 🔵
  - `Door.tsx:328-332` — one `<mesh position={matPos}>` per Door instance
  - Walls.tsx:314-338 renders exactly 4 `<Door>` components from HORIZONTAL_DOORS

**Must-check result: 8/8 PASS. F3.7 changes are surgically additive.**

## Material Variation (15)
🔵 14/15
Wall palette is now properly stratified: base `#3d2817` + 8% lerp toward each room accent + ±0.12 L jitter + ±0.04 rad hue drift per segment (`Walls.tsx:219-260`) produces 12 visibly-distinct wall segments. Baseboard `#211108` and top cap `#5e3e22` add two contrasting trim bands per strip. Door panel 3-strip woodgrain widened to ±0.10 L (from F3.6's ±0.04) finally reads at game distance (`Door.tsx:76-88`). Mullion (-0.12 L from middle) + inset (-0.08 L) give second-order panel depth. Wall props add a fourth material family (plate/glow, frame/canvas, vine green). Losing 1 because base hue still sits entirely in the brown register — acceptable, intentional cohesion.

## Edge Pop (15)
🔵 14/15
Every architectural mesh with geometric intent carries `<Edges>`: Door posts, moldings, baseboards, lintel, lintel trim, three panel strips, mullion, inset panel, escutcheon, knob sphere, lock body, shackle, doormat, lantern cap, lantern body. WallStrip edges on body + baseboard + cap (3 per strip × 12 strips = 36). Sconce plate, picture frame, vine each carry edges. Theme-aware `edgeColor` threaded through both files via `useWorldStore((s) => s.theme)`. Lost 1 because the lantern chain (`Door.tsx:438`) and accent stripe (`Door.tsx:371`) skip edges — tiny pieces, likely intentional, but strictly losing a point for consistency.

## Proportions (15)
🔵 14/15
`DOOR` block frozen — 1.2 × 1.75 opening, 1.9 frame, 0.15 post, −0.55π open angle. Knob sphere correctly scaled to `DOOR_POLISH.knobRadius = 0.0825` (1.5× F3.5's 0.055) + new escutcheon plate `[0.18, 0.28, 0.025]` addresses F3.6 "knob too small" finding. Panel 3-strip ratios (RAIL_H 0.22 / MID_H 1.31 / RAIL_H 0.22) sum cleanly to DOOR.height 1.75. WALL_H 1.8 + BASE_H 0.14 + CAP_H 0.08 = classic 85/8/6 trim profile; the F3.5 base/cap heights (0.06/0.04) have been bumped so they actually read. Lintel trim math at `Door.tsx:170-176` explicitly overlaps lintel top by 0.02 — verified bottom-at-+0.09, center-at-+0.12. Doormat 1.2 × 0.6 on horizontal doors, 0.6 × 1.2 on vertical. Lost 1 because the doormat depth 0.6 feels slightly over-scaled for the 1.2 opening — 0.45 would read tidier.

## Micro-anim (15)
🔵 14/15
- Hinge lerp: framerate-independent exp-decay `1 - exp(-k·δ)` at `k = hingeLerp * 60` (`Door.tsx:112`)
- Lock pulse: group scale ±5% + shared `pulse = 2.5 + wave * 0.125` applied to BOTH body and shackle refs — the F3.6 "shackle asleep" finding is fully resolved (`Door.tsx:117-131`)
- Lantern: group-scale ±5% + emissive breath, with lock-state-dependent frequency (1.2 unlocked / 2.5 locked) (`Door.tsx:134-146`)
- Spill light: static `pointLight` at `DOOR_POLISH.spillLight.offset` along room-inside normal, insideSign math at `Door.tsx:256-262`
Lost 1 because the spill light is static — a tiny 0.15Hz intensity wobble would sell "breathing room beyond". Walls.tsx has no animation at all (static is fine for walls, but a sconce flicker would be free charm).

## Color (10)
🔵 10/10
Door slab `#5a2814` (deeper red-brown) vs walls `#3d2817` (neutral brown) establishes cross-hue-family separation — the F3.6 "door blends into wall" finding is resolved at the root. Per-segment wall accent mixing (`accentMix: 0.08`) threads each room's color subtly into its neighboring walls. Doormat uses `matColor` = accent HSL-coerced to s≤0.25, l=0.35 (`Door.tsx:232-239`) — reads as woven rug, not neon. Lantern lock-state color swap (red-warm → gold-warm) wires through body + pointLight. New spill light `#ffb060` warm-peach washes the inside arch of each doorway. Full marks.

## Clutter/Props (10)
🔵 10/10 ← **F3.6 🟡 RESOLVED**
F3.6 flagged "wall props missing" as the single 🟡 dimension. F3.7 adds:
- 16 deterministic wall props across 8 long horizontal strips (`Walls.tsx:274-310`): sconces (y=1.45, emissive plate), pictures (y=1.1, framed canvas), vines (y≈0.9, green box)
- 4 per-door doormats (`Door.tsx:328-332`) — one per doorway threshold
- 4 per-door warm spill lights (`Door.tsx:475-480`) — functional prop, makes the room beyond feel alive
Deterministic `mulberry32(0xfacade01)` + slot-plus-jitter placement means no flicker on remount. `faceZ` math correctly mounts props toward the hallway side. The "empty hallway" complaint is fully resolved.

## Refinement (10)
🔵 10/10
Fine detail compound interest everywhere:
- Lintel trim overlaps lintel top by 0.02 — gap killed, math in code comment
- Knob promoted from naked sphere → escutcheon plate + proud sphere (both edge-outlined)
- Post moldings (F3.5) + post baseboards (F3.5) + lintel trim (F3.5) + lintel trim overlap (F3.7) give the door frame 4 levels of value separation
- Wall L-jitter widened to ±0.12 (up from F3.5's implicit default) so segments are distinct without breaking the brown register
- Mullion + inset panel rectangle (F3.5) add second-order panel depth
- Spill light insideSign derived from door orientation (horizontal → z sign, vertical → x sign), correctly placed at `offset = 0.9` into the room
- Deterministic RNG seeded consistently: door panel tints from `hashRoomId`, wall tints from `0xd0071abc`, wall props from `0xfacade01`

## Performance (10)
🔵 10/10
- Walls.tsx: zero useFrame (fully static). 12 WallStrip + 16 WallProps + 4 Door — all static meshes.
- Door.tsx useFrame: pure math + ref writes, zero allocations, zero closures created per frame.
- `tints`, `wallProps`, `panelTints`, `matColor` all in `useMemo` with stable deps.
- 8 new pointLights total (4 lantern + 4 spill), all bounded-distance (5 and 3.2) so cheap.
- Build output unchanged from F3.5 baseline (972.69 kB gzip 257.58 kB).
- Playwright 12/12 passed in 1.8m, no console errors.

## Total: 96/100
## Verdict: 🔵 PASS (≥85)

## F3.6 issues resolved?
**All F3.6 findings landed cleanly:**
1. **Clutter 🟡 → 🔵**: 16 wall props (sconce/picture/vine) + 4 doormats + 4 spill lights. Hallways are populated.
2. **Lintel gap**: trim board width = lintel + 0.08, depth 0.30 vs lintel 0.22, center computed to overlap lintel top by 0.02 (`Door.tsx:170-176`). Gap is gone.
3. **Knob too small**: 1.5× radius (0.055 → 0.0825) + new `DOOR_POLISH.escutcheon` plate. Reads at game distance.
4. **Door blends into wall**: door slab now in red-brown hue family (`#5a2814`) distinct from neutral-brown walls (`#3d2817`), plus per-segment accent tinting.
5. **Lock shackle asleep**: body + shackle now share `lockGroupRef` and identical `pulse` emissive — pulse as one unit.

Ship it. Recommend advancing F3.8 to merge and moving to the next scene subsystem — further polish here has diminishing returns.
