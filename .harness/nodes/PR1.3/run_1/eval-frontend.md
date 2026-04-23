# PR1.3 Frontend-R3F Review of PR1.2

## Scope
Reviewed `src/world3d/scene/rooms/ProductRoom.tsx` architectural shell additions (planks, rug+border, baseboards, top trim, ceiling cove) for z-fighting, perf, colliders, interactable preservation, theme parity, reduced-motion, and build cleanliness.

## Findings

### 🟡 Plank vs base-slab Y-offset is on the precision floor
- `ProductRoom.tsx:197` floor base top face = 0.18 + 0.02/2 = **0.19**
- `ProductRoom.tsx:206` plank center y=0.215, half-height 0.02 → bottom face = **0.195**
- Gap is only **5 mm**. PR1.2 eval criterion explicitly says "≥1cm offsets" and BookRoom `BookRoom.tsx:192,198` uses 0.11 base / 0.125 plank center (~10mm separation). At distance-16 camera with default near/far, 5mm is right where the BookRoom team had to bump the rug from 0.135→0.20 (`BookRoom.tsx:206-211` comment) to escape z-fight noise. Likely fine for stations near camera but risk grows toward back wall.
- Fix: bump plank center y from 0.215 → 0.225 (or drop the base slab entirely since planks span ROOM-0.04 ≈ full floor and only leave 2cm of edge gap that no one will see under baseboards).

### 🟡 Baseboards co-planar with the wall surface
- `ProductRoom.tsx:237-256` baseboards at `oz ± 2.45`, depth 0.05 → outer face at `oz ± 2.475`.
- I haven't read the wall-mesh source, but `ROOM=5` puts wall inner face at `oz ± 2.5`. Baseboard outer face at 2.475 is **2.5 cm inside** the wall, which is fine. However the four corners overlap each other: e.g. front baseboard `[ROOM × 0.12 × 0.05]` at `oz-2.45` extends in x from `ox-2.5` to `ox+2.5`, fully overlapping the side baseboards' end-caps at `ox±2.45` (they extend in z from `oz-2.5` to `oz+2.5`). The intersection volumes share faces — z-fight on the corner end-caps when the camera is in a corner.
- Same problem on the top trim `ProductRoom.tsx:259-278`.
- Fix: shorten the side trim/baseboard length from `ROOM` to `ROOM - 0.10` so they butt cleanly into the front/back pieces. (BookRoom doesn't use baseboards so no precedent to mirror, but it's standard CSG hygiene.)

### 🔵 Ceiling cove panel + emissive inset stack — geometry is fine
- `ProductRoom.tsx:281-290` outer panel center y=2.92, half-height 0.02 → bottom face 2.90. Inset emissive panel center y=2.895, half-height 0.01 → top face 2.905. Bottom of outer is **0.5 cm below** top of inset → they overlap by 5mm. Outer surrounds the inset visually but the geometries interpenetrate. Not a true z-fight (different XY footprints: 3.0 vs 2.9, so the visible faces are different planes), but worth a tiny clean-up.
- Suggest: drop inset to y=2.88 so its top face (2.89) sits 1cm below the outer's bottom (2.90).

### 🔵 Mesh count delta — within budget
- PR1.2 added: 8 planks + 1 rug + 4 rug border strips + 4 baseboards + 4 top trims + 2 ceiling cove meshes = **23 new meshes**. Pre-PR1.2 the room ran ~80 meshes by my count → **~+29%**, just under the +30% Quality Constraint cap. Stations PR1.5 will eat budget; flag for that PR but no action here.

### 🔵 Colliders — correctly absent for new pieces
- All new geometry is ground trim (≤ 0.26m tall), wall trim at floor or ceiling height, or a ceiling panel. Avatar can't clip into any of it. No `registerCollider` calls needed and none added — correct. `ProductRoom.tsx:184-192` collider list unchanged from baseline.

### 🔵 Interactables preserved
- `ProductRoom.tsx:96` PROBLEM_SOLVER on left ScreenStand, `ProductRoom.tsx:332` MENTOR_TABLE on right ScreenStand, `ProductRoom.tsx:576-578` 4× PROJECT_SHOWCASE_ENTRIES hit boxes — all intact. `grep -c "userData.interactable"` = 3 occurrences (matches design baseline: 2 explicit + 1 inside .map).

### 🔵 Theme parity preserved
- New planks (`:209`), rug border (n/a — no Edges), baseboards (`:240,245,250,255`), top trim (`:262,267,272,277`), cove (`:284`) all consume `edgeColor` derived from `useWorldStore(s => s.theme)` at `:127-128`. Rug body and inner cove panel intentionally have no Edges (broad surfaces) — fine.

### 🔵 Reduced-motion — no new animations
- `useFrame` block at `:153-165` was untouched by PR1.2. Only fan rotation + scanline bobs. New shell pieces are all static. ✅

### 🔵 Per-frame allocations — none added
- No `new Color()` / `new Vector3()` introduced. `bandTints` allocated once via `useMemo` at `:131-142`. ✅

### 🔵 Build clean
- `npm run build` exits 0, no new TS errors, no warnings. ✅

## Verdict
**ITERATE** — Build & interactables clean, but the plank/base 5mm gap and the corner-overlap on baseboards/top-trim violate the explicit "≥1cm offsets, no co-planar surfaces" constraint and will manifest as visible z-fight at distance. Two small geometry tweaks unblock PASS.
