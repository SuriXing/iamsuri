# F3.18 Eval — Reviewer A (StarField + Particles + HallwayLanterns)

Scope: ambient layer only. Independent of Reviewer B (Hallway + IdeaLab backlog).
Diff reviewed: commit `1389a66` (F3.17 implement-ambient).

## StarField

File: `src/world3d/scene/StarField.tsx`

### Hard-constraint audit

- **[pass] flatShading N/A**: This file uses `pointsMaterial` (L106-114). `flatShading` does not apply to `PointsMaterial` — it's sprite-based, not mesh-shaded. No `meshPhongMaterial` / `meshStandardMaterial` in file. ✅
- **[pass] Zero useFrame allocation**: Walking `useFrame` body L74–99 line-by-line:
  - L75 `const m = matRef.current` — ref read
  - L76–80 early-return on null / light theme
  - L81 `m.opacity = 1` — scalar write
  - L82–87 `attr`, `arr`, `srcColors`, `phases`, `baseOp` — all local refs to pre-existing arrays, **no `new`**
  - L88 `clock.getElapsedTime()` — scalar
  - L89–97 loop body: `shimmer`, `op`, `i3` are all scalar locals. `Math.sin(t * 1.6 + phases[i])` is scalar. Direct Float32Array writes `arr[i3+0/1/2]`. **No allocation.**
  - L98 `attr.needsUpdate = true` — flag flip
  - Zero `new THREE.*()`, zero array/object literals, zero string concat. ✅
- **[pass] Derived arrays in useMemo / module-scope**: `STAR_BUFFERS` is module-scope (L47), built once at import time by `buildStarBuffers()` (L25-45). `geometry` wrapped in `useMemo` (L55-63). Per-star palette array `STAR_PALETTE` is module-scope readonly (L18-23). ✅
- **[pass] mulberry32 used**: L26 `const rng = makeRng(0xa11ce)`. Zero `Math.random` in file. ✅
- **[pass] InstancedMesh / reused scratch**: N/A — uses `<points>` with single BufferGeometry, which is the correct single-draw-call primitive for 500 stars. No InstancedMesh needed, no per-frame `new Matrix4`. The color attribute's underlying Float32Array is reused in place (L84 `arr = attr.array as Float32Array`). ✅

### Rubric

| Dim | Score | Weighted | Justification |
|---|---|---|---|
| Material variation | 92 | 13.80 | 4-color palette (cool/warm white, pale cyan, pale rose) per-star via `vertexColors`; deterministic pick at bake time (L39). Previously monochrome `#ffffff`. |
| Edge / silhouette pop | 75 | 11.25 | Points have no silhouette by construction; `sizeAttenuation` + varied `baseOpacity` does the work. `avgSize` is a single averaged scalar (L109) — loses per-star size variation that was *computed* at bake (L38 accumulates into `avgSize` but not a per-star array). Minor dim. |
| Proportions | 85 | 12.75 | `avgSize` × 6 (L44) yields sensible star spread; pointsMaterial scales with distance. Spatial spread via `STARS.spreadXZ`/`ySpread` unchanged (frozen constant). |
| Micro-animations | 95 | 14.25 | Per-star twinkle exactly to spec: independent phase offset `phases[i]` (L91), `0.55..1.0` shimmer range (L91), freq 1.6. Organic shimmer, not unison pulse. |
| Color harmony | 92 | 9.20 | Palette is subtle/desaturated — cool + warm whites anchor, cyan + rose accents. Integrates with warm hallway tones. Commit message's "starry not carnival" intent achieved. |
| Clutter / props | 90 | 9.00 | Ambient scope: star *density* unchanged at 500, feel-alive contribution is the shimmer + palette. Appropriate restraint. |
| Character refinement | 100 | 10.00 | N/A. |
| Performance feel | 88 | 8.80 | 500 stars × 3 Float32 writes + 1 `Math.sin` per frame = ~1500 ops — trivial CPU. Cost is the `attr.needsUpdate=true` GPU re-upload (6 KB/frame). Acceptable. Single draw call (points). |

**Avg: 89.05 / 100**

### Findings

🔵 LGTM — zero-alloc audit is clean and the per-star twinkle reads as a genuine upgrade in the screenshot bucket. Palette is tastefully desaturated.

🔵 `useFrame` branch at L77–80 (`if theme === 'light' { m.opacity = 0; return; }`) is dead code — the component returns `null` at L102 before the `<points>` mounts, so in light mode `matRef.current` is always null and L76 catches it first. Harmless but 2 lines of misleading guard. Not worth a fix cycle.

🟡 `STAR_BUFFERS.avgSize` (L44) discards per-star size variation — the loop *computed* per-star size increments into `avgSize` but never stored an `Float32Array` of per-star sizes. `pointsMaterial` only takes a single scalar `size` so this is a framework limit; to get per-star size you'd need a custom shader or switch to instanced sprites. Not a regression (F3 baseline had the same), but flagged as the ceiling on "star silhouette pop" dim.

## Particles

File: `src/world3d/scene/Particles.tsx`

### Hard-constraint audit

- **[pass] flatShading**: L134 `flatShading` on the single `meshPhongMaterial`. ✅
- **[pass] Zero useFrame allocation**: Walking `useFrame` body L90–120:
  - L91–92 ref + null-check — no alloc
  - L93 `dt = delta * 60` — scalar
  - L94 `t = clock.getElapsedTime()` — scalar
  - L95 loop
  - L96–98 `x`, `y`, `z` scalar locals from `BUF.p*[i]`
  - L100–102 `ph`, `f`, `amp` scalar locals
  - L103–105 scalar math with `Math.sin`/`Math.cos`
  - L106–110 wrap reset: `RESET_RNG()` returns a number (not an object); reused module-scope `RESET_RNG` declared at L65. No `new`.
  - L111–113 write-back to Float32Arrays
  - L114 `DUMMY.position.set(x, y, z)` — **reuses module-scope `DUMMY = new THREE.Object3D()`** from L68. `.set` mutates in place. ✅
  - L115 `DUMMY.scale.setScalar(...)` — mutates existing Vector3
  - L116 `DUMMY.updateMatrix()` — mutates `DUMMY.matrix` in place
  - L117 `mesh.setMatrixAt(i, DUMMY.matrix)` — passes existing matrix reference (internally copies into the instanced buffer)
  - L119 `mesh.instanceMatrix.needsUpdate = true` ✅
  - Zero `new THREE.Matrix4()`, zero `new THREE.Color()`, zero array/object literals. ✅
- **[pass] Derived arrays in useMemo / module-scope**: `BUF` is module-scope (L63), built once by `buildBuffers()` (L32-61) including new `driftAmp` and `driftFreq` Float32Arrays (L40-41). `DUMMY` and `TMP_COLOR` are module-scope scratch (L68-69). ✅
- **[pass] mulberry32 used**: L33 `makeRng(0xb0b)`, L65 `RESET_RNG = makeRng(0xfeed)`. Zero `Math.random`. ✅
- **[pass] InstancedMesh + reused scratch**: L123 `<instancedMesh args={[undefined, undefined, PARTICLE_COUNT]}>`. Initial bake uses DUMMY + TMP_COLOR (L78-87). Per-frame loop uses DUMMY only. `mesh.instanceMatrix.needsUpdate = true` is set at L119. `setColorAt` only called in initial `useEffect` (L84), not per-frame — correct. ✅

### Rubric

| Dim | Score | Weighted | Justification |
|---|---|---|---|
| Material variation | 85 | 12.75 | 5-color palette (gold/green/purple/blue/red) set via `setColorAt` in initial bake (L83-84). White emissive wash + `opacity=0.75` tempers. Varied sizes via `BUF.size[i]` (L49). |
| Edge / silhouette pop | 72 | 10.80 | `boxGeometry[0.04³]` with `flatShading` gives crisp cube facets, but at that size against a dark scene the silhouette is dominated by emissive bloom rather than edges. Appropriate for dust-mote scale but low on this dim. |
| Proportions | 85 | 12.75 | Per-instance `DUMMY.scale.setScalar(BUF.size[i] / 0.04)` (L115) — size range 0.02–0.06, 3× variation. No uniform slab look. |
| Micro-animations | 90 | 13.50 | Exact spec: per-particle `driftAmp` (0.0015–0.005) and `driftFreq` (0.4–1.3) with independent `phase[i]`; sin/cos quadrature for X/Z (L103, L105) with `f * 0.85` decorrelation on Z. Wrap-around at `PARTICLES.ceiling`. Feels organic vs F3 legacy `sin(phase + y*0.5)` single-axis drift. |
| Color harmony | 78 | 7.80 | This is the weakest dim. The 5-color palette (red/blue/purple/green/gold — L24-30) is the *only* visibly saturated element in an otherwise warm-copper/amber scene. 150 particles × full-sat hues reads slightly carnival against the warm room palette. Would integrate better trimmed to 3 warm hues (gold + pale rose + pale cyan). |
| Clutter / props | 92 | 9.20 | Ambient scope: 150 particles feels alive, wraparound keeps density stable. Good scope call. |
| Character refinement | 100 | 10.00 | N/A. |
| Performance feel | 85 | 8.50 | 150 instances, single draw call. Per-frame: 150 × (sin + cos + 4 scalar ops + Matrix compose + setMatrixAt). ~1-2K arithmetic ops — trivial. One minor inefficiency: L115 recomputes `BUF.size[i] / 0.04` every frame even though size is static per particle. Could precompute `scale[i]`. Not a hard-constraint violation, just ~150 divisions/frame wasted. |

**Avg: 85.30 / 100**

### Findings

🟡 **Color harmony drag.** `PARTICLE_COLORS` at L24-30 (gold/green/purple/blue/red) is the only saturated palette in the scene — everything else is warm copper/amber. The particles read as "prototype confetti" against the otherwise unified warm scene. Recommend trimming to 3 warm/cool coordinated hues (e.g. `COLORS.gold`, `#ffb870`, `#f4a8b8`) or desaturating to pastels. This is the single biggest lever to cross the 88 ship gate on aggregate. File:line `src/world3d/scene/Particles.tsx:24-30`.

🟡 **Static size scale recomputed every frame.** L115 `DUMMY.scale.setScalar(BUF.size[i] / 0.04)` — size is immutable per particle after bake, but this division runs 150× per frame forever. Add `sizeScale: Float32Array` to `ParticleBuffers`, bake once in `buildBuffers` (L45-59), read as `DUMMY.scale.setScalar(BUF.sizeScale[i])`. Micro-opt, not a ship blocker. File:line `src/world3d/scene/Particles.tsx:115`.

🔵 Zero-alloc useFrame audit is clean; DUMMY/TMP_COLOR module-scope pattern is textbook correct.

🔵 The quadrature swirl (`sin(tf+ph)` for X, `cos(tf*0.85+ph)` for Z at L103/L105) is a tasteful choice — the `0.85` Z-frequency decorrelation avoids perfect circles and gives lissajous-like organic paths. Good detail.

## HallwayLanterns

File: `src/world3d/scene/HallwayLanterns.tsx`

### Hard-constraint audit

- **[pass] flatShading**: Every `meshPhongMaterial` in file sets `flatShading` — L54, L58, L62, L68, L73, L84, L91, L97, L109. ✅
- **[pass] Zero useFrame allocation**: Walking `useFrame` body L30–37:
  - L31 `t = clock.getElapsedTime()` — scalar
  - L32 loop `i < 4`
  - L33 `g = groupRefs.current[i]` — ref read
  - L34 null-check
  - L35 `g.position.y = Math.sin(t * BOB_FREQ + BOB_PHASES[i]) * BOB_AMP` — direct mutation of existing `Vector3.y` property. No `.set()`, no new vector, no matrix.
  - Zero allocation. ✅
- **[pass] Derived arrays in useMemo / module-scope**: `LANTERN_POSITIONS` (L5), `BOB_PHASES` (L13), `FRAME_POSTS` (L19) are all module-scope readonly arrays. `BOB_FREQ`/`BOB_AMP`/`LANTERN_BASE_Y` are module-scope constants (L14-16). ✅
- **[pass] mulberry32 used**: N/A — this file has no random variation; lantern positions and bob phases are hand-picked for deterministic symmetry. Acceptable for 4 fixed instances. ✅
- **[pass] InstancedMesh + reused scratch**: N/A — 4 lanterns is below instancing threshold; using discrete mesh groups is the right call for per-lantern group transforms. The ref-array pattern (`groupRefs.current[i]`) is the correct zero-alloc animation hook. ✅

### Rubric

| Dim | Score | Weighted | Justification |
|---|---|---|---|
| Material variation | 88 | 13.20 | 8 distinct phong tones: anchor `#1a1a1a`, chain `#2a2a2a`/`#3a3a3a`, cap `#3a2512`, cap-point `#5a3820`, posts `#2a1808`, body `#a0522d`, bottom `#3a2512`, glow `#ffb870`/`#ff9840`. Clear wood/metal/glow separation. |
| Edge / silhouette pop | 82 | 12.30 | 4 corner posts + top cap + bottom plate + chain link cross give a rich pagoda-like silhouette. Missing: no `<Edges>` outline pop for extra silhouette definition. Frame stands on its own though. |
| Proportions | 90 | 13.50 | Stacked hierarchy reads crafted: top cap 0.28 → body 0.22 → glow 0.16 → bottom plate 0.26. No equal-thickness slab look. Chain cylinder segments give vertical scale anchor. |
| Micro-animations | 93 | 13.95 | 4 phases at π/2 intervals (L13), freq 1.1, amp 0.035 — well within the ≤±5% spec. Zero-alloc via direct `.y` mutation. Bob phase decorrelates the 4 lanterns — the commit's "not in unison" goal is achieved. |
| Color harmony | 92 | 9.20 | Warmer emissive `#ff9840` on core + `#ffa860` point light + `#a0522d` copper body + dark frame = fully unified warm palette. F3.17 commit note "warmer amber/orange" delivered vs the pre-F3.17 pale `#ffe090`. |
| Clutter / props | 88 | 8.80 | 4 lanterns × 9 meshes = 36-mesh assembly. For ambient scope, appropriate density. |
| Character refinement | 100 | 10.00 | N/A. |
| Performance feel | 87 | 8.70 | 4 discrete lantern groups = ~36 draw calls from this file alone (no instancing). Plus **4 live `pointLight`s** (L114-119) — these are the real cost. Three.js evaluates each point light per-fragment on every affected surface; with intensity 1.1 and distance 6.5 they overlap in the narrow hallway. Not over-budget (4 lights is standard), but close to the ceiling. Point lights don't `castShadow` here which is correct. |

**Avg: 89.65 / 100**

### Findings

🔵 Frame detail (corner posts + cap + bottom plate + chain) is a genuine refinement — pre-F3.17 this was a string + body + glow, now it reads as a crafted pagoda lantern. File:line `src/world3d/scene/HallwayLanterns.tsx:50-98`.

🔵 Zero-alloc animation via `g.position.y = ...` direct write (L35) is the idiomatic r3f pattern.

🟡 **No `<Edges>` outline** — drei `<Edges>` on the lantern body + top cap would push silhouette-pop from 82 → 88+ and match the F3.5/F3.7 door-frame treatment. Low-effort, high-visual payoff. File:line `src/world3d/scene/HallwayLanterns.tsx:89-92` (body) and `L66-69` (top cap).

🟡 **4 overlapping point lights in narrow hallway.** Each at intensity 1.1, distance 6.5 — in a 2ROOM-wide hallway these all overlap in the center. Consider dropping to intensity 0.8 or distance 4.5, or use 2 lights for the 4 lanterns (approximating the light at the lantern pair's midpoint). Not a ship blocker but worth watching when F3.21 perf sweeps. File:line `src/world3d/scene/HallwayLanterns.tsx:114-119`.

## Combined ambient verdict

- **ProductRoom/BookRoom/IdeaLab interactions with ambient layer**: Not affected. StarField renders only outside rooms (no theme-conditional suppression for rooms, but stars are `yMin: 5..30` so above all room ceilings). Particles have `spread: 28` which exceeds room scale — visible through room walls? No, Particles use `boxGeometry` with `transparent + opacity 0.75`, rendered in world space — rooms' walls occlude them naturally. HallwayLanterns are positioned at `(-1.5, 1.5)` × 2 — hallway-only, no room collision. ✅
- **Frozen constants untouched**: `git show 1389a66 -- src/world3d/constants.ts` returns empty diff. FOLLOW/CAMERA/FP/INTRO/ROOM/GAP/DOOR blocks (constants.ts:19-83) are pristine. STAR_COUNT/PARTICLE_COUNT/STARS/PARTICLES blocks at L72-73, L137-147 are additive — not in the frozen list. ✅
- **No files outside `src/world3d/scene/` and `src/world3d/util/` touched in the 3 files under review**: StarField/Particles/HallwayLanterns are all in `src/world3d/scene/`. StarField imports from `../util/rand`, Particles imports from `../util/rand`. ✅
- **`data/rooms.ts` untouched**: `git show 1389a66 --stat -- src/world3d/data/` returns empty. ✅
- **`store/`, `hud/`, controllers, colliders untouched**: empty stat output. ✅
- **Aggregated weighted average**: (89.05 + 85.30 + 89.65) / 3 = **87.97 / 100**
- **Ship gate (≥88 AND no 🔴 AND no dim <70%)**: **NOT CLEAR** — average is **87.97** (0.03 short of 88). Zero 🔴 findings. Lowest dim is Particles edge/silhouette at 72% (still ≥70). The single lever is Particles color harmony: trimming `PARTICLE_COLORS` from 5 saturated hues to 3 coordinated warm/pastel hues would lift that dim from 78 → ~87, pushing Particles avg from 85.30 → ~86.5, combined avg from 87.97 → ~88.4. Crosses the gate.

## Findings (combined)

### 🔴 Critical
*(none — zero hard-constraint violations, zero per-frame allocations, zero frozen-block mutations)*

### 🟡 Iterate
1. **Particles palette unification** — `src/world3d/scene/Particles.tsx:24-30`. The 5-color saturated palette (gold/green/purple/blue/red) is the only non-warm element in the scene and drags combined score below 88. Trim to 3 warm hues (e.g. `COLORS.gold`, `#ffb870`, `#f4a8b8`) or desaturate to pastels. **This is the single ship-gate lever.**
2. **Particles static scale recomputed per frame** — `src/world3d/scene/Particles.tsx:115`. Add `sizeScale: Float32Array` to buffers, bake once in `buildBuffers`, drop the runtime division. Micro-opt.
3. **HallwayLanterns missing `<Edges>` outline** — `src/world3d/scene/HallwayLanterns.tsx:89-92, 66-69`. Drei Edges on body + top cap would match F3.7 door treatment and push silhouette-pop dim +6.
4. **HallwayLanterns 4 overlapping point lights** — `src/world3d/scene/HallwayLanterns.tsx:114-119`. In the narrow hallway these heavily overlap. Consider intensity 0.8 or distance 4.5. Watch for F3.21.

### 🔵 LGTM
- StarField zero-alloc useFrame, per-star palette + independent twinkle phase. Clean audit.
- Particles zero-alloc useFrame with module-scope DUMMY/TMP_COLOR; quadrature swirl with 0.85 frequency decorrelation is a tasteful detail.
- HallwayLanterns zero-alloc bob via direct `.y` mutation and ref-array pattern.
- All three files use `flatShading: true` where applicable.
- Frozen constants (FOLLOW/CAMERA/FP/INTRO/ROOM/GAP/DOOR) and frozen dirs (data/, store/, hud/, controllers) untouched.
- mulberry32 used everywhere RNG is needed; zero `Math.random`.

### Dead-code note (🔵, not iterate)
- `StarField.tsx:77-80` — `if (theme === 'light') { m.opacity = 0; return; }` is unreachable because the component returns `null` at L102 in light mode, so `matRef.current` is always null in that branch and L76 catches first. Harmless cleanliness nit.

## Verdict

- **ITERATE** (🟡)
- Aggregate **87.97 / 100** — 0.03 short of the 88 ship gate. Zero 🔴, zero hard-constraint violations, zero dim <70. One concrete lever: **Particles color palette** (`src/world3d/scene/Particles.tsx:24-30`) unification would cross the gate in a single targeted fix. Ship after F3.19 if it addresses the palette (primary) and optionally Edges on lanterns (secondary).
