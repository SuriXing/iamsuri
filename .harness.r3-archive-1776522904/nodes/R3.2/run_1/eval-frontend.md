# Frontend Review — R3.1 Ceiling

## Verdict
ITERATE

The implementation is structurally sane (geometry math checks out, material choice is reasonable) but the **evidence is broken** and **OUT-2 is out of spec**. R3.1 cannot be accepted on this run's data.

## Findings

### 🔴 The "look-up" screenshot is not actually looking up — `/tmp/sw-verify-ceiling.py:21-26`
**Issue:** `look-up-myroom-dark.png` shows stars filling the upper ~half of the frame and an orange surface in the lower half with a single bright bloom in the middle. That bright bloom is a `pointLight` falloff on the **floor**, not the ceiling. The horizon split is at ~y=400 px — exactly where the horizon would sit at near-level pitch. The verify script drags the mouse from y=400 → y=80 (Δ -320 px) at `lookSensitivity=0.003` which yields ~0.96 rad of pitch delta. Either (a) the controller maps mouse-up to pitch-down (drag is inverted vs. expectation), or (b) the room transition completes with a non-zero starting pitch and the drag rolls it back toward zero. Either way, the camera is **not** at pitch ~+1.3 rad.

**Why the brightness check still "passed":** the 200×200 center crop of a 1280×800 frame is rows 300..500 — that crop straddles the horizon line, so it averages roughly half-bright-floor + half-dark-sky-with-stars ≈ 68. The threshold is ≥30, so it passed by accident. **The 68.94 number is not measuring the ceiling.**

**Evidence:** screenshot `look-up-myroom-dark.png`. Note the warm radial gradient centered around (640, 400) is the under-ceiling fill light bouncing off the wood floor, with the bed plane just below frame.

**Fix:** Drive pitch directly via the store instead of dragging:
```js
const s = window.__worldStore.getState();
s.setFpPitch?.(1.25); // or whatever the public setter is
```
…or invert the mouse Y delta and re-shoot. Until then, OUT-1 is **unverified**, not PASS.

### 🔴 OUT-2 brightness 81.10 vs baseline 64.19 = +26% — violates the ±10% spec — `World.tsx:106-120`
**Issue:** The acceptance criterion is explicit: `|new - old| / old < 0.10`. The new under-ceiling pointLights (8 of them — 2 per room × 4 rooms, intensity 0.25, distance 6) lifted floor brightness 26% above baseline. The implementer labeled this "intentional" in `brightness.txt:10`. Intent does not override the spec — the brief already covers floor brightness with "MUST NOT seal the lights above it" (i.e., must not get DIMMER) and a separate ±10% upper bound.

**Evidence:** `brightness.txt:2,6,10`.

**Fix:** Either (a) cut `intensity: 0.25 → 0.10` and re-measure, (b) cut `distance: 6 → 3` so the fill light only kisses the ceiling underside without flooding the floor, or (c) drop the under-ceiling lights entirely and let `emissiveIntensity=0.5` on the ceiling carry the look-up brightness alone (it already brings 68+ on its own). KISS option is (c) — one fewer light per room.

### 🟡 `renderOrder=-1` on the ceiling is redundant and the rationale comment is wrong — `Ceiling.tsx:21-23, 48, 61, 71`
**Issue:** The doc comment claims `renderOrder=-1` "forces the ceiling to draw before the StarField's transparent additive points." Three.js **already** renders all opaque materials before any transparent material, regardless of renderOrder. `renderOrder` only re-sorts within the same transparency bucket. Since `meshStandardMaterial` is opaque and the StarField `pointsMaterial` is `transparent: true`, the ceiling draws first **without** the renderOrder hint. The actual occlusion mechanism is depth-write (ceiling writes depth) → depth-test (stars test depth, fail below ceiling, get discarded). That works on its own.

The renderOrder=-1 also moves the ceiling **before** other opaque scene objects (walls, floors, room contents), which slightly defeats the early-Z optimization that opaque-front-to-back sort gives you — you draw the largest occluder first instead of the closest.

**Fix:** Remove `renderOrder={-1}` from all three meshes and rewrite the comment to credit depth-write, not draw order.

### 🟡 Wall top-cap (y=1.94..1.98) clips into ceiling-box bottom (y=1.95) — `Walls.tsx:103-104` × `Ceiling.tsx:26-27`
**Issue:** `WALL_H + CAP_H/2 + 0.1 = 1.8 + 0.04 + 0.1 = 1.94` puts the top cap centered at y=1.94 with thickness 0.08 → top cap top at **y=1.98**. Ceiling box centered at y=2.0 with thickness 0.1 → bottom at **y=1.95**. The top cap pokes through the ceiling by 3 cm. Not visible from a player below (cap is occluded by wall body), but in any 2D-overview / God-shot or if a future render-target captures the ceiling exterior, you'll see z-fighting.

**Fix:** Bump `CEILING_Y` to 2.05 (gives 7 cm clearance) or thin `CEILING_T` to 0.05 and lift y to 2.02. Either is one-line.

### 🟡 6× separate `meshStandardMaterial` instances — share one — `Ceiling.tsx:51-57, 63-69, 73-79`
**Issue:** Three identical material configs declared inline inside JSX → React creates a fresh material per mesh per render. Six meshes × full PBR uniform set is a small but pure waste; on theme toggle the entire ceiling re-instantiates materials. Not a perf cliff, but trivially fixed.

**Fix:** Hoist a single `useMemo(() => new THREE.MeshStandardMaterial({...}), [color, emissive])` and pass via `material={mat}` prop on each `<mesh>`.

### 🔵 Ceiling at y=2.0 with FP eye at y=1.5 = 0.5 m head clearance
Architecturally tight (the player's "head" is at 1.5 m and ceiling at 2.0 m gives less than head-to-ceiling for an average adult). Matches `WALL_H=1.8` so it's consistent with the existing wall envelope, but it does mean any future tall furniture/decor will clip the ceiling. Not blocking — just flag for future room-prop work.

### 🔵 Hallway ceiling cross is two overlapping boxes that double-draw a 2.4×2.4 square at the origin — `Ceiling.tsx:60-80`
The two hallway boxes overlap at the central 2.4×2.4 intersection (HALL_WIDTH × HALL_WIDTH). Both meshes render, depth-fight is harmless because both surfaces are coplanar with identical material, but you're paying 2× fragment cost on that center patch. Fix later: one cross-shaped extruded geometry, or two non-overlapping rectangles.

### 🔵 Geometry coverage at doorways — verified clean
ROOM_SIDE = 5.2 centered at room center ±3.7 → ceiling spans |x|,|z| ∈ [1.1, 6.3]. Hallway cross is HALL_WIDTH=2.4 → spans [-1.2, +1.2]. Overlap is 0.1 m at every doorway side — **no gap**. OUT-3 "no stars in top-third at doorway" should pass on geometry; verify with a real screenshot once the verify-script bug above is fixed.
