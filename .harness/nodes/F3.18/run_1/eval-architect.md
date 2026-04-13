# F3.18 Ambient Layer — Architect Review

Commit: 1389a66
Files: StarField / Particles / Hallway / HallwayLanterns / IdeaLab

## Diff sanity

```
 src/world3d/scene/Hallway.tsx         |  48 +++++++++++-
 src/world3d/scene/HallwayLanterns.tsx | 134 +++++++++++++++++++++++++++-------
 src/world3d/scene/Particles.tsx       |  22 +++++-
 src/world3d/scene/StarField.tsx       |  68 +++++++++++++----
 src/world3d/scene/rooms/IdeaLab.tsx   | 113 ++++++++++++++++++++++++++--
 5 files changed, 334 insertions(+), 51 deletions(-)
```

All 5 files are in-plan. Zero frozen file touches: `data/rooms.ts`, `CameraController.tsx`, `PlayerController.tsx`, `MouseOrbitController.tsx`, `colliders.ts`, `store/worldStore.ts`, `hud/*`, and constants (`FOLLOW/CAMERA/FP/INTRO/ROOM/GAP`) all untouched.

## Gate results

- tsc: PASS (clean, no output)
- eslint: PASS (clean, no output)
- build: PASS (`vite v8.0.8`, built in 199 ms, chunk sizes unchanged-ish; `App3D` 1008.64 kB / 263.49 kB gzip — normal for this project)
- playwright: PASS (12/12 tests passed in 2.2 min; includes theme toggle, keyboard flow, and console-error tests)

All 4 gates green.

## Findings

### StarField.tsx 🔵

- `StarField.tsx:47` — `STAR_BUFFERS` built once at module load via seeded `makeRng(0xa11ce)`, fully deterministic.
- `StarField.tsx:18-23` — 4-entry palette (cool white, warm white, pale cyan, pale rose) is readonly and module-scope. LGTM.
- `StarField.tsx:55-63` — geometry built once in `useMemo([])`, color buffer is *cloned* from `STAR_BUFFERS.colors` so the mutable attribute doesn't poison the source. Correct.
- `StarField.tsx:67-69` — color attribute captured via `useEffect` into `colorAttrRef`. The comment explicitly calls out "refs shouldn't be mutated during render" — this is the canonical pattern the reviewer asked for.
- `StarField.tsx:74-99` — useFrame scans purely from typed arrays, writes `arr[i3+0..2] = src * op` into the attribute's underlying `Float32Array`. Zero allocations, per-star phase offset via `phases[i]`, shimmer range `0.55..1.0`. Bounded, stable.
- `StarField.tsx:77-80, 101-103` — light mode bails both the per-frame update and the draw call (`return null`). Nice optimization.
- No new `Math.random()`. No new imports. No dead code.

### Particles.tsx 🔵

- `Particles.tsx:33` — deterministic `makeRng(0xb0b)`.
- `Particles.tsx:40-57` — new `driftAmp` / `driftFreq` / `phase` typed arrays baked at module load. Nothing mutated per frame except position state.
- `Particles.tsx:65-69` — `RESET_RNG`, `DUMMY`, `TMP_COLOR` all module-scope. The only `new THREE.*` calls in this file are at lines 68-69 and execute once.
- `Particles.tsx:90-120` — useFrame loop uses `Math.sin(t*f + ph) * amp * dt` for X and `Math.cos(t*f*0.85 + ph) * amp * dt` for Z. Quadrature swirl is correct and bounded. Reset path uses `RESET_RNG()` (not `Math.random`) — determinism preserved across wraparounds.
- Flat shading present on the material. InstancedMesh retained. No alloc.

### Hallway.tsx 🔵

- `Hallway.tsx:13-15` — `BEAM_Z` / `BEAM_X` are readonly module-scope arrays. Crosshatch renders as 5 Z-beams × 4 X-beams, each with `Edges` in theme-aware `edgeColor` (`Hallway.tsx:58`, `'#0a0a14' : '#5a4830'`). Constraint satisfied.
- `Hallway.tsx:49-53` — `STEAM_OFFSETS` hoisted to module scope (previously presumably inline). Good hygiene.
- `Hallway.tsx:60-69` — useFrame only reads `STEAM_OFFSETS[i][1]` + writes to `child.position.y` and `mat.opacity`. Zero alloc. However: `g.children.forEach((child, i) => ...)` iterates over all children — fine for 3 steam cubes.
- `Hallway.tsx:114-123` — runner rugs (two `boxGeometry` at `z = ±2.2`) with theme-aware edges. LGTM.
- `Hallway.tsx:22-47` — `Plant` subcomponent corner-placed 4× at `Hallway.tsx:108-111`. Per-frame alloc: none — static meshes.
- `Hallway.tsx:127-146` — beam trim + center cross cap. All 11 new meshes are static, not refs, no allocation.
- Zero freeze-list touches.

### HallwayLanterns.tsx 🔵

- `HallwayLanterns.tsx:5-10` — `LANTERN_POSITIONS` static readonly.
- `HallwayLanterns.tsx:13` — `BOB_PHASES = [0, π/2, π, 3π/2]` — phase-quartered so the 4 lanterns never bob in sync.
- `HallwayLanterns.tsx:19-24` — `FRAME_POSTS` module-scope.
- `HallwayLanterns.tsx:28` — `groupRefs` array initialized once via `useRef<Array<...>>([null, null, null, null])`. Callback refs at `HallwayLanterns.tsx:44-46` are stable (no warning).
- `HallwayLanterns.tsx:30-37` — useFrame touches only `g.position.y = sin(...)`. Zero alloc, bounded.
- `HallwayLanterns.tsx:51-119` — anchor plate + 0.5-unit chain cylinder + crosslink + top cap + point top + 4 corner posts + body + bottom plate + glow + point light. Spec items all present.
- Warm glow tint: `color="#ffb870"`, `emissive="#ff9840"`, `emissiveIntensity={4.2}` — warmer than neutral yellow. Point light at `"#ffa860"`, `intensity={1.1}`, `distance={6.5}`. Matches "warmer glow" spec.
- All 9 `meshPhongMaterial` have `flatShading`.

### rooms/IdeaLab.tsx 🔵 (with one minor nit)

- `IdeaLab.tsx:31` — `COPPER_ACCENT = '#c97a2a'` applied at `IdeaLab.tsx:331-334` (heading bar) and `IdeaLab.tsx:405-408` (prototype circuit-board top). Both spec retints landed.
- `IdeaLab.tsx:47-66` — `buildSparkBuffers()` with `makeRng(0x1dea5 ^ SPARK_COUNT)`. Deterministic (XOR of two constants is still a compile-time constant; no Math.random). The comment at `IdeaLab.tsx:48-49` transparently flags the seed reinterpretation — this is exactly the kind of documented workaround the spec accepts.
- `IdeaLab.tsx:68` — `SPARK_BUF` baked once at module load.
- `IdeaLab.tsx:71-73` — `SPARK_DUMMY`, `SPARK_COLOR_ORANGE`, `SPARK_COLOR_WARM` all module-scope. The only `new THREE.*` calls in the file are these 3 and execute once.
- `IdeaLab.tsx:176-242` — useFrame: spark section (`IdeaLab.tsx:226-241`) uses `let y = SPARK_BUF.by[i]; y += SPEED * speed[i] * delta; if (y > MAX) y = MIN;` — pure scalar state update, mutates `SPARK_BUF.by` in place, no alloc. Wrap uses constant `SPARK_Y_MIN` (no rng, deterministic visually after first loop).
- `IdeaLab.tsx:245-256` — initial bake of matrices + colors in `useEffect([])`. Note: spark Y positions at mount are `SPARK_BUF.by[i]` which was just written by `buildSparkBuffers()` using the rng. After first mount they'll drift and eventually converge to `[MIN..MAX]` cycles. Deterministic across reloads.
- `IdeaLab.tsx:609-623` — `instancedMesh` with `boxGeometry 0.03³` + `meshPhongMaterial` with `flatShading`. Triangle cost: 14 sparks × 12 tri = 168 tri added. Draw calls: 1 instanced. Negligible.
- `IdeaLab.tsx:174` — new `sparksRef` cleanly typed `useRef<THREE.InstancedMesh>(null)`.
- 58 `meshPhongMaterial` / 58 `flatShading` (confirmed by grep). 100% coverage.

🟡 Minor nit — not blocking: `IdeaLab.tsx:252` uses `sm.setColorAt(i, SPARK_BUF.isOrange[i] ? SPARK_COLOR_ORANGE : SPARK_COLOR_WARM)` with `isOrange[i]` being a `Uint8Array` element (0 or 1). The ternary works because `0` is falsy — but a pedantic reader might prefer `=== 1`. Zero impact on behavior or perf; cosmetic only.

### Cross-file / global

- No new `Math.random()` anywhere (grep clean).
- No new textures, no post-processing, no shader edits.
- No `console.log`.
- Triangle budget: StarField unchanged count; Particles unchanged count; Hallway adds ~9 beam boxes + 4 plant groups (~24 simple meshes); HallwayLanterns grew from a minimal lantern to ~9 meshes × 4 = 36 meshes + 4 lights; IdeaLab adds 1 InstancedMesh (14 instances). Well under "50% growth" ceiling — this is a polish layer, not a content explosion.
- Determinism: StarField `0xa11ce`, Particles `0xb0b`, Particles reset `0xfeed`, IdeaLab sparks `0x1dea5 ^ 14`, IdeaLab sketches `0x1dea5c`. All seeded.

## Scores

1. Constraint compliance: **15**/15 — freeze list clean, every meshPhongMaterial flatShaded, spark InstancedMesh material flatShaded, edgeColor ternary correct.
2. Zero per-frame alloc: **15**/15 — all 5 useFrames scanned; every `new THREE.*` is module-scope or in an `useEffect`/`useMemo` that runs once. StarField attribute captured via `useEffect` ref as specified.
3. Determinism: **10**/10 — every scatter uses `makeRng(seed)`; spark seed reinterpretation is explicitly documented and evaluated to a constant at compile time; no `Math.random()` added.
4. Animation implementation: **15**/15 — refs + trig + bounded phases everywhere. No state-driven animation. Independent phase offsets in StarField + HallwayLanterns + Particles. Lantern groupRefs array pattern is clean.
5. Spec adherence: **15**/15 — per-star palette + phase twinkle ✓, per-particle sin/cos swirl ✓, ceiling beam crosshatch + runner rugs + corner plants ✓, lantern anchor/chain/top cap/4 posts/bottom plate/warm glow/bob ✓, IdeaLab ambient sparks + heading bar + circuit-top copper retint ✓.
6. Code hygiene: **10**/10 — named constants module-scope, readonly tuples where appropriate, comments explain non-obvious choices (seed workaround, ref-vs-render rule), no dead code, no console.log, no unused imports.
7. Performance feel: **10**/10 — InstancedMesh for sparks (not individual meshes), color attribute mutation for stars (not material swap per star), groupRef bob (not child iteration with alloc). No new per-frame mesh creation.
8. Gate status: **10**/10 — tsc/eslint/build/playwright all green.

## Total: 100/100
## Verdict: 🔵 PASS
