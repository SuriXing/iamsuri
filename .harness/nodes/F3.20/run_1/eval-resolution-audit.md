# F3.20 Eval — Reviewer A (findings resolution audit)

Scope: verify F3.19 (`28363f0`) resolves F3.18 findings and introduces no regressions.
F3.18 reviewed commit `1389a66` (F3.17). F3.19 touched only `Hallway.tsx` +
`IdeaLab.tsx`; ambient files flagged by Reviewer A (StarField / Particles /
HallwayLanterns) were not touched.

## F3.18 findings status

| # | Finding | Severity | F3.19 action | Status |
|---|---|---|---|---|
| 1 | Particles `PARTICLE_COLORS` 5 saturated hues drag color harmony (the single ship-gate lever, `Particles.tsx:24-30`) | 🟡 | No change. `git show 28363f0 --stat` shows `Particles.tsx` not in the diff. Current `src/world3d/scene/Particles.tsx:24-30` still holds gold/green/purple/blue/red. | **UNRESOLVED** |
| 2 | Particles static scale division recomputed per frame (`Particles.tsx:115`) | 🟡 | No change. File untouched in F3.19. `DUMMY.scale.setScalar(BUF.size[i] / 0.04)` still runs 150×/frame. | **UNRESOLVED** |
| 3 | HallwayLanterns missing drei `<Edges>` on body + top cap (`HallwayLanterns.tsx:89-92, 66-69`) | 🟡 | No change. File untouched in F3.19. | **UNRESOLVED** |
| 4 | HallwayLanterns 4 overlapping point lights at intensity 1.1 × distance 6.5 (`HallwayLanterns.tsx:114-119`) | 🟡 | No change. File untouched in F3.19. | **UNRESOLVED** |
| 5 | Hallway micro-animations weak (Reviewer B dim score 75, only 1 idle loop = steam bob) | 🟡 | No change. F3.19 only removed emissive flags on static meshes; no new useFrame targets, no plant sway, no beam dust, no runner ripple. Still 1 idle loop. | **UNRESOLVED** |
| 6 | Hallway material variation weak (Reviewer B dim score 82, beams single `#3a2510`, runner rugs monotonal) | 🟡 | No change. Beams still one wood tone, runners still `#6b3216` monotonal. F3.19 actually **reduced** material expressiveness by stripping the subtle `#d97034` emissive glow from the runners — a net wash (loses a warm kiss but the underlying monotonal critique stands). | **UNRESOLVED** |
| 7 | `Hallway.tsx:64` forEach closure allocated per frame | 🔵 (was flagged as minor) | No change. `Hallway.tsx:64` still reads `g.children.forEach((child, i) => { ... })` verbatim. | **UNRESOLVED** |

**Resolution rate: 0 / 7**

## F3.19 changes (designer top-2, not from F3.18 reviewer-A/B list)

F3.19 addressed a *different* designer's top findings — the F3.19 tick log
references "Designer F3.18 top-2" but the two items below do not appear in
either of the F3.18 eval files I re-read. This is spec drift: the F3.19
ticket resolved issues from a third review surface, not ours.

### (A) IdeaLab spark InstancedMesh → 2-bucket refactor

**Assessment: technically clean, genuinely fixes a real bug.**

- Root cause was correct: `meshPhongMaterial.emissive` is a material-level
  uniform, so the original F3.17 code (`IdeaLab.tsx:247-256` pre-F3.19)
  assigned per-instance colors via `setColorAt` but all 14 sparks shared the
  same emissive uniform. The orange/warm split was silently collapsed to a
  single glow hue at the shader stage. `setColorAt` only reaches the `color`
  uniform slot, and with emissive dominant in the visual (`emissiveIntensity
  1.6` was ~4× the base color contribution), the two buckets were
  indistinguishable.
- Fix is the correct shape: split into two `InstancedMesh` components, each
  with its own `meshPhongMaterial`, so each bucket carries its own emissive.
  Orange bucket `#f97316 intensity 2.0`, warm bucket `#fff3a0 intensity 1.5`
  (`IdeaLab.tsx:655-684`).
- Zero-alloc preserved: single module-scope `SPARK_DUMMY` Object3D reused
  across both `useFrame` passes (`IdeaLab.tsx:95`, consumed in both loops
  at L251-263 and L264-276). No per-loop closure. Both initial bake loops
  in the `useEffect` (L280-299) also reuse the same `SPARK_DUMMY`.
- Trade-off: +1 draw call (14 → 7+7 split, but now 2 InstancedMesh). Scale
  is trivial and the visual win is real — if the 50/50 split actually
  reads. I cannot verify visually without running the screenshot, but the
  architecture is correct.

### (B) Hallway de-emissive (floor cross + runner strips + rug base + rug inner)

**Assessment: defensible intent, uncertain payoff, minor negative drag on
Reviewer B dimensions.**

- Intent: stop faint self-lit floor surfaces from competing with the
  lanterns for visual dominance. The four surfaces stripped were:
  - Floor cross X (`Hallway.tsx:74-77`) emissive `#1e2233 @ 0.1` removed
  - Floor cross Z (`Hallway.tsx:78-81`) emissive `#1e2233 @ 0.1` removed
  - Runner strip +Z (`Hallway.tsx:114-118`) emissive `#d97034 @ 0.05` removed
  - Runner strip -Z (`Hallway.tsx:119-123`) emissive `#d97034 @ 0.05` removed
  - Rug base (`Hallway.tsx:149-152`) emissive `#ffd700 @ 0.05` removed
  - Rug inner (`Hallway.tsx:153-156`) emissive `#e94560 @ 0.05` removed
- Intensities were already subtle (0.05-0.1); their removal gives the
  lantern point-lights more visual rank but at the cost of the one
  "warm copper kiss" Reviewer B credited at Hallway's Color-harmony dim
  (was 88, cited "runner emissive `#d97034` at 0.05 is subtle and ties to
  copper room accents"). That tie is now gone.
- Net effect on Reviewer B's rubric is slightly negative: material
  variation dim stays weak (82), color harmony dim loses the one warm-
  copper accent (88 → likely 83-85), micro-animations dim stays at 75
  (unchanged). So Hallway's 84.71 aggregate from F3.18 likely drifts
  *down* to ~83-84, not up. The change is a visual-authority lever, not a
  rubric-score lever.
- The rug inner `#e94560` removal is arguably correct regardless —
  `#e94560` is the magenta pink accent, not a warm copper, so losing it
  unifies the palette.

## Hard-constraint regression check

- **[pass] flatShading preserved on all materials in modified files**
  - Hallway.tsx: every `meshPhongMaterial` in the diff retains `flatShading`;
    verified lines 76, 80, 116, 121, 151, 155. Untouched materials (lines
    86, 90, 94, 102, 130, 138, 145, 162, 168) still have `flatShading`.
  - IdeaLab.tsx: 59 `flatShading` occurrences (grep count). New spark
    buckets have `flatShading` at L665 (orange) and L680 (warm).
  - Frozen ambient files (Particles, StarField, HallwayLanterns) unchanged
    — no regression possible.
- **[pass] Zero useFrame allocation — Hallway.tsx post-F3.19** (`Hallway.tsx:60-69`)
  - L60 destructure scalar `clock`
  - L61 ref read
  - L62 null-check
  - L63 `clock.getElapsedTime()` scalar
  - L64 `g.children.forEach((child, i) => { ... })` — **still a per-frame
    closure allocation** (the F3.18 🔵 finding). F3.19 did not introduce a
    NEW allocation, but it also did not fix the existing one. No new
    regression; pre-existing minor issue persists.
  - L65 scalar write
  - L66 property read + cast
  - L67 scalar write
  - No new `new THREE.*`, no new literal. **No new allocation regression.**
- **[pass] Zero useFrame allocation — IdeaLab.tsx post-F3.19** (`IdeaLab.tsx:199-277`)
  - Pre-spark section (L200-246) unchanged from F3.17: all scalar writes on
    pre-existing refs, `mat.emissiveIntensity` mutations, `Math.sin/cos`
    scalars. Confirmed clean.
  - Spark orange loop (L251-263): `for (let i = 0; i < SPARK_ORANGE_COUNT;
    i++)` — index for loop, no closure. Body reads from module-scope
    Float32Arrays (`SPARK_ORANGE.by/bx/bz/speed`), writes scalar `y` back to
    the typed array in place. `SPARK_DUMMY.position.set(...)` mutates the
    module-scope Object3D. `SPARK_DUMMY.updateMatrix()` mutates in place.
    `smO.setMatrixAt(i, SPARK_DUMMY.matrix)` passes matrix by reference (r3f
    copies into the internal instanced buffer). Zero new allocations.
  - Spark warm loop (L264-276): identical shape, same zero-alloc guarantee.
  - Both loops reuse the **single** `SPARK_DUMMY` from `IdeaLab.tsx:95` —
    no second Object3D, no per-bucket scratch. Clean.
  - No forEach closures. No object literals. No new Color/Vector/Matrix.
- **[pass] IdeaLab sparks InstancedMesh buckets zero-alloc**
  - `SPARK_ORANGE` and `SPARK_WARM` buckets built once at module load via
    `buildSparkBuckets()` (`IdeaLab.tsx:61-86`). Runtime buffers are
    Float32Arrays (`IdeaLab.tsx:74-79` and 81-86) after a one-time build
    from growable number[] — the growable arrays are discarded once the
    typed buffers are produced. Module-scope `SPARK_DUMMY` is the sole
    scratch across both buckets.
  - `SPARK_ORANGE_COUNT` / `SPARK_WARM_COUNT` cached at module scope
    (`IdeaLab.tsx:91-92`) — no `.length` reads in the hot loop.
  - `setColorAt` is no longer called anywhere (useEffect at L280-299 only
    calls `setMatrixAt`). Color is carried by the per-mesh material
    uniform, which is the whole point of the refactor. `instanceColor`
    buffer is never created, saving GPU memory.
- **[pass] mulberry32 used**
  - `IdeaLab.tsx:63` `const rng = makeRng(0x1dea5 ^ SPARK_COUNT)`. Zero
    `Math.random` in the file (confirmed via grep).
  - Hallway.tsx has no randomness (confirmed via grep — 0 matches for
    `Math.random`).
- **[pass] IDEA_BOARD interactable preserved**
  - `IdeaLab.tsx:12` declares `IDEA_BOARD_INTERACTABLE`.
  - `IdeaLab.tsx:360` wires `m.userData.interactable = IDEA_BOARD_INTERACTABLE`
    via `onUpdate` on the whiteboard mesh. Unchanged from F3.17.
- **[pass] Scope clean**
  - `git show 28363f0 --stat`:
    ```
    src/world3d/scene/Hallway.tsx       |  18 ++--
    src/world3d/scene/rooms/IdeaLab.tsx | 170 ++++++++++++++++++++++++------------
    2 files changed, 123 insertions(+), 65 deletions(-)
    ```
  - Only 2 files. Both under `src/world3d/scene/`. No controller / store /
    hud / data / constants touched.
- **[pass] Frozen constants untouched**
  - `git show 28363f0 -- src/world3d/constants.ts src/world3d/data/rooms.ts
    src/world3d/store/ src/world3d/hud/` returns empty. CameraController,
    PlayerController, MouseOrbitController, colliders all untouched.

## New issues introduced

### 🔴 Critical
*(none)*

### 🟡 Iterate
1. **Spec drift: F3.19 did not address F3.18's documented findings.** Both
   F3.18 eval files (eval-ambient-ab.md aggregate 87.97, eval-hallway-idealab.md
   aggregate 88.14) identified 7 concrete findings with file:line refs. F3.19
   resolved 0 of them and instead addressed two separate issues not present in
   either eval. Reviewer A's "single ship-gate lever" — `Particles.tsx:24-30`
   palette trim — is still untouched; aggregated Reviewer A avg is stuck at
   87.97, **still 0.03 below the 88 ship gate**, and F3.21 is now forced to
   pick up all 7 deferred items plus anything from F3.20's other reviewers.
2. **Hallway de-emissive has marginal-to-negative rubric effect.** Reviewer B
   cited the runner's `#d97034 @ 0.05` emissive specifically as a positive
   contributor to the Color-harmony dim ("subtle and ties to copper room
   accents"). F3.19 removed it. The rug inner `#e94560` strip is a defensible
   cleanup (it was the only pink in the otherwise warm hallway), but the
   runner strips were not broken — they were working. Net: Hallway likely
   scores *lower* in F3.20's rubric-based eval than it did in F3.18's. This
   change should have been paired with per-beam hue jitter (the actual
   Reviewer B material-variation ask from `Hallway.tsx:64-69` finding 🔵) to
   offset the loss.
3. **IdeaLab InstancedMesh count doubled from 1 → 2.** Not a hard-constraint
   violation (draw call budget is 30% growth on a ~80 baseline), but the
   F3.18 Reviewer B performance-feel dim was 92 partially on the basis of
   "sparks use `<instancedMesh>` at one draw call." F3.19 makes it two. The
   correct architectural alternative was a single custom `ShaderMaterial`
   with a per-instance emissive attribute, or a single mesh with two
   color-separated sub-populations baked via vertex-color attributes — both
   higher effort but zero-draw-call-growth. The 2-bucket approach is the
   KISS solution and I'm not going to flag it 🔴, but it's worth noting for
   F3.21 if draw-call pressure mounts.

### 🔵 LGTM
- IdeaLab useFrame is still truly zero-alloc after the refactor. Module-
  scope `SPARK_DUMMY` reused across both loops is the correct pattern.
- `setColorAt` removal + `instanceColor` buffer elimination is a small GPU
  memory win on the IdeaLab side.
- The build/lint/tsc/playwright gates all-green claim in the commit body is
  consistent with what I'd expect — no obvious syntax errors, no typing
  regressions.
- Frozen constants and frozen directories untouched. Scope discipline intact.
- The root-cause analysis in the commit body (emissive is a material
  uniform, not a per-instance attribute) is technically correct and
  demonstrates the fix was designed rather than trial-and-error.

## Verdict

- **ITERATE (🟡)**
- **Resolution rate: 0/7 F3.18 findings resolved**
- **Rationale:** F3.19 is internally clean (zero-alloc preserved, flatShading
  preserved, scope discipline intact, root-cause correct) but addresses a
  completely different finding set than F3.18 documented — the single
  ship-gate lever Reviewer A called out (`Particles.tsx:24-30` palette) is
  untouched, so the F3.18 aggregate (87.97) remains below the 88 gate, and
  the Hallway de-emissive change likely nudges Reviewer B's Hallway sub-
  score down rather than up. F3.19's own changes are worth keeping (the
  spark color bug was real and the fix is correct), but they should have
  been paired with the F3.18 ask list, not substituted for it.
- **F3.21 backlog — all 7 F3.18 findings still owed:**
  1. `src/world3d/scene/Particles.tsx:24-30` — trim `PARTICLE_COLORS` from
     5 saturated hues to 3 warm/pastel hues (e.g. `COLORS.gold`, `#ffb870`,
     `#f4a8b8`). Single biggest lever to cross the 88 aggregate gate.
  2. `src/world3d/scene/Particles.tsx:115` — precompute `sizeScale:
     Float32Array` in `buildBuffers` and read per-frame; removes 150
     divisions/frame.
  3. `src/world3d/scene/HallwayLanterns.tsx:89-92, 66-69` — add drei
     `<Edges>` outline on lantern body + top cap to match F3.7 door
     treatment.
  4. `src/world3d/scene/HallwayLanterns.tsx:114-119` — drop point lights
     to intensity 0.8 or distance 4.5, or collapse 4 lights to 2 at pair
     midpoints.
  5. `src/world3d/scene/Hallway.tsx:60-69` — add ≥2 more idle loops
     (plant sway, beam dust-mote drift, or runner emissive ripple) to
     lift the Hallway Micro-animations dim from 75 → 85+.
  6. `src/world3d/scene/Hallway.tsx:127-141` — mulberry-seeded per-beam
     hue jitter (±8% lightness on `#3a2510`) for material variation pop.
  7. `src/world3d/scene/Hallway.tsx:64` — refactor `forEach` callback
     closure to a `for (let i = 0; i < g.children.length; i++)` loop for
     true zero-alloc.
