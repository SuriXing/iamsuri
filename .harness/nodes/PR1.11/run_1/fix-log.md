# PR1.11 — fix-log (run_1)

Final polish before deploy. All blockers from PR1.10 evaluators addressed.

## Findings addressed

### 🔴 PM-1 — Station content duplication (4-of-6 dupes)
**Before:** `STATIONS = [PROBLEM_SOLVER, MENTOR_TABLE, ...PROJECT_SHOWCASE_ENTRIES(4)]` → 6 stations, 2 duplicate titles ("Problem Solver" / "Mentor Table" appearing twice each, with the entry-derived ones carrying the placeholder pitch).
**Fix:** `buildStations()` now derives **purely** from `PROJECT_SHOWCASE_ENTRIES` (4 entries). For entries with id `problem-solver` and `mentor-table`, the canonical `PRODUCT_ROOM_CONTENT.dialogues.*` rich body+link is used (so each project keeps its real pitch). Other entries (`debate-coach`, `study-stack`) use the entry-derived data with cool-accent override applied as before.
**Result:** 4 distinct stations, every project represented exactly once. `data/productRoom.ts` untouched.

### 🔴 PM-2 / Designer F-1 — Legacy desk/rack/crates not removed
**Before:** ~lines 319–522 still rendered desk + keyboard/mouse/laptop/mug/headphones/sticky-notes/USB drives/rubber duck + server rack + LEDs + fan + crate stack + product cubes.
**Fix:** Entire block deleted (along with 3 colliders `pr-desk` / `pr-rack` / `pr-crate`). Removed now-unused code: `DESK_LEGS`, `RACK_LEDS`, `FAN_SPEED`, `PRODUCT_COLORS`, `fanRef`, `rackLedRefs`, `accentLightRef`, `PointLight` import, `useMemo` import. Removed deskX/Z/Y, rackX/Z, crateX/Z locals.
**Result:** Clean 3-layer composition (rug → 4 stations → hero), ~200 LOC removed (845 → 586, delta −259 LOC).

### 🔴 PM-3 / Designer F-7 — Dead -z wall showcase shelf
**Fix:** Lines 783–792 (brushed-metal shelf + cyan accent strip on -z back wall) deleted.

### 🔴 Designer F-2 — Hero outranked by station screens
**Fix:** Hero cube `emissiveIntensity` 0.9 → **1.6** (still STATIC, no per-frame change). Station screen `emissiveIntensity` 1.6 → **1.0** (stacked screen 1.4 → 0.9). Hero now has the brightest emissive surface in its z-band.

### 🔴 Designer F-3 — Key light wrong color
**Fix:** Key light `color="#ffd9b0"` (warm cream) → `#e6ecf2` (cool white) per design-note. Intensity 0.8 → 0.9, distance 6 → 9 also restored to spec.

### 🔴 Frontend F-R-1 — Foot-kick clearance 5 mm
**Fix:** `footY` 0.275 → **0.305**; `plinthBaseY` 0.30 → 0.33 (foot kick top now 0.33, plinth sits flush). Plank top is 0.245 → foot-kick bottom 0.28 → **3.5 cm clearance** (≥1 cm rule satisfied).

### 🟡 Frontend F-R-3 — z-fight (showcase shelf vs accent strip)
**Resolved by deletion** (both meshes were the dead -z wall shelf — see PM-3).

### 🟡 Frontend F-R-4 — Rug border / rug top sub-cm overlap
**Fix:** Rug border strips raised from y=0.26 → **y=0.27** (1 cm above rug top y=0.2575).

### 🟡 Frontend F-R-5 — Reduced-motion is one-shot useMemo
**Fix:** Replaced `useMemo` with `useState` + `useEffect` that subscribes to the MQ `change` event. User toggling OS preference mid-session now stops/resumes hero rotation without remount.

### 🟡 Designer polish — Per-station prop coverage
**Fix:** Added prop to station 0 (white coffee mug) and station 2 (small gold trophy block). All 4 stations now have unique deco beyond the universal cable coil. Stations 1 (mug coaster) and 3 (pen) preserved from before.

## Hard-rule verification

| Rule | Result |
|------|--------|
| `data/productRoom.ts` untouched | ✓ (only mapped by id at render time) |
| `npm run build` exits 0 | ✓ `✓ built in 228ms` |
| `grep -c "userData.interactable" ProductRoom.tsx` == 1 | ✓ (1 line in `STATIONS.map`; runtime count = 4) |
| `pointLight` count ≤ 8 | ✓ (5 literals → 6 lights total: key + fill + hero + shared(0+1) + 2 per-station array) |
| Out-of-Scope respect (BookRoom/IdeaLab/MyRoom/InteractionManager/EnterPrompt3D/door/corridor) | ✓ untouched |

## Numbers

- Stations: 6 → **4**
- Runtime interactable count: 6 → **4** (one per project, no dupes)
- pointLight count: 8 → **6** (room for designer to add later)
- File LOC: 845 → **586** (Δ −259)
- Mesh count effective: ~160 → ~80 (well under +30% baseline)
