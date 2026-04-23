# PR1.7 fix-stations — fix-log (run_1)

Addresses 9 findings from PR1.6 reviews (`eval-designer.md`, `eval-frontend.md`).

## Findings → fixes

### 🔴 D1 — Station distinctness too weak
Introduced `STATION_VARIANTS` (6 entries) that vary per station:
- `plinthH` 0.78–0.95 (skyline, not fence)
- `plinthW` 0.62–0.74
- `monitorW × monitorH` mixes wide / tall / square / wide-stacked
- `top` material rotates `slate` / `wood` / `metal` (`SLATE_LIGHT`, `WOOD_WARM`, `METAL_LIGHT`)
- Variant 3 has `stacked: true` → secondary screen above the main bezel
Result: silhouettes differ in form, not just color.

### 🔴 D2 — Labels unreadable from door
Removed the 4-tick stub. Each station now renders a drei `<Html transform>`
plate showing `{s.title}` (e.g. "Problem Solver", "Mentor Table",
"Debate Coach"...). 34px font, white-cool on slate-deep with per-station
accent border. `pointerEvents="none"` so it never blocks the screen
interactable behind it. Pattern mirrors BookRoom `<Html transform>` use.

### 🔴 D6 — Legacy desk + dual monitors compete with station row
Removed both `<ScreenStand>` instances and the dialogue refs they used
(`dot1Ref`, `dot2Ref`, `bar1Ref`, `bar2Ref`, `SCANLINE_*`). Helper
component `ScreenStand` deleted. `PROBLEM_SOLVER` + `MENTOR_TABLE`
dialogues now live on stations 0 & 1 in the unified row (built via
`buildStations()` which prepends them to `PROJECT_SHOWCASE_ENTRIES`).
Desk stays as a workstation prop but carries zero interactables.

**Interactable count check** (hard rule):
- Source `userData.interactable` assignments: **1** (line 584, inside the
  STATIONS.map over 6 entries).
- Runtime mesh assignments: **6** (one per station).
- Old count: 2 ScreenStand + 4 station map = 6. Same total. ✓

### 🟡 D3 — Yellow/pink accents clash with cool-tech
Added `COOL_ACCENT_OVERRIDE` map at module scope:
- `#facc15` (debate-coach) → `#5eead4` (mint)
- `#fb7185` (study-stack) → `#c4b5fd` (lavender)
Override applied at render time inside `buildStations()`; data file
(`src/data/productRoom.ts`) untouched (brand truth preserved).
Removed the kiosk-style plinth-front accent strip entirely.

### 🟡 D4 — Midground is flat z-slice
New `stationDz(i, n)` helper returns ±0.15 m around `oz+1.55`: outer
stations toward door, inner stations away → shallow V opening toward
entry. Applied to both render `sz` and collider `z`.

### 🟡 D5 — Production-line cleanliness
- Cable coil now under EVERY station (was `i % 2 === 0`); radius varies
  slightly by index `(0.05 + (i%3)*0.008)`.
- Station 1: knocked-over coaster disc (slight rotation).
- Station 3: pen on plinth edge (rotated 90°).
- Station 4: folded paper (slight tilt).

### 🟡 F1 — Collider too narrow
Station collider `hx` widened `0.4 → 0.45` (covers widest monitor
`0.95 / 2 = 0.475` minus 2.5cm tolerance). `hz` left at 0.3.

### 🟡 F2 — stationX hardcoded for 4
Replaced `stationX = [-1.65, -0.55, 0.55, 1.65]` with a computed spread:
```ts
const STATION_SPAN = 4.2;
const STATION_STRIDE = STATIONS.length > 1 ? STATION_SPAN / (STATIONS.length - 1) : 0;
function stationX(i, ox) { return ox + (i - (STATIONS.length - 1) / 2) * STATION_STRIDE; }
```
Now scales for any N (currently 6). Both render and collider use it.

### 🟡 F3 — Co-planar accents
- Removed brand bar + title ticks + plinth accent strip entirely (D2/D3
  fixes).
- Screen face moved from `sz - 0.04` to `sz - 0.07` (4 cm in front of
  bezel front face at `sz - 0.03`).
- Label `<Html>` plate offset `sz - 0.08` (5 cm in front of bezel
  front, well above co-planar threshold).

### 🟡 F4 — Plinth foot intersects floor planks
Foot kick raised from `y=0.225` (intersecting plank y range
0.205–0.245) to `y=0.275` (5 mm clear above plank top 0.245). Plinth
body now sits on top of foot kick (`plinthBaseY = 0.30`), all geometry
above the plank layer.

## Hard-rule checks

- `npm run build`: ✓ exits 0 (Vite, ~206ms)
- Source `userData.interactable` count: 1 assignment, runs once per
  station → **6 runtime interactables** (Problem Solver, Mentor Table,
  + 4 PROJECT_SHOWCASE_ENTRIES).
- Per-frame allocations: none added (only the existing fan rotation
  remains; SCANLINE refs/anim removed entirely with the legacy stand).
- Reduced-motion: only fan rotation remains (pre-existing, unchanged).
- Procedural primitives only; labels via drei `<Html>` (allowed).

## Deferred (per scope)

- 🔵 D7 (kiosk LED strip) — strip removed via D3 fix.
- 🔵 D8 (per-station screen aspect) — addressed via STATION_VARIANTS.
- 🔵 F5 (mesh budget) — net mesh count slightly down vs PR1.5 (legacy
  ScreenStand removed; per-station decor reduced; no title ticks/brand
  bar/plinth strip).
- PR1.8 hero piece + PR1.9 lighting layers: not started (out of scope).
