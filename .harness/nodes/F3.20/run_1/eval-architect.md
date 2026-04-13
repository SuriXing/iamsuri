# F3.20 Ambient Fix — Architect Re-Review

Commit under review: 28363f0

## F3.18 findings resolved?

- **Fix 1 (spark color split)**: 🔵 RESOLVED

  The single InstancedMesh + setColorAt approach was correctly diagnosed
  (meshPhongMaterial emissive is a material uniform, not per-instance)
  and cleanly replaced with two disjoint buckets:

  - `buildSparkBuckets()` at `src/world3d/scene/rooms/IdeaLab.tsx:50-86`
    walks all 14 `SPARK_COUNT` sparks once, coin-flips each via
    `rng() < 0.5` (`IdeaLab.tsx:65`), and pushes each spark into exactly
    one of the `ox/oy/oz/os` or `wx/wy/wz/ws` arrays — disjoint by
    construction. Final Float32Arrays at `IdeaLab.tsx:72-85`.
  - Two module-scope bucket consts at `IdeaLab.tsx:88-92`:
    `SPARK_ORANGE`, `SPARK_WARM`, plus their lengths.
  - Two refs: `sparksOrangeRef` / `sparksWarmRef` at
    `IdeaLab.tsx:196-197`.
  - Two `<instancedMesh>` elements at `IdeaLab.tsx:652-666` and
    `IdeaLab.tsx:667-681`, each carrying its own `meshPhongMaterial`
    with distinct emissive:
      - Orange: `color="#f97316"`, `emissive="#f97316"`,
        `emissiveIntensity={2.0}` (`IdeaLab.tsx:659-661`)
      - Warm: `color="#fff3a0"`, `emissive="#fff3a0"`,
        `emissiveIntensity={1.5}` (`IdeaLab.tsx:674-676`)
  - `args={[undefined, undefined, SPARK_ORANGE_COUNT]}` and
    `SPARK_WARM_COUNT` (`IdeaLab.tsx:654`, `669`) correctly size each
    InstancedMesh to its own bucket length (not to 14).
  - Initial bake `useEffect` at `IdeaLab.tsx:280-299` seeds both
    buckets' matrices on mount — no stale identity matrices on frame 0.

- **Fix 2 (hallway de-emissive)**: 🔵 RESOLVED

  All four surfaces from the designer's list had their `emissive` /
  `emissiveIntensity` props stripped:

  - Floor cross, axis 1 — `Hallway.tsx:74-76`:
    `<meshPhongMaterial color={HALL_COLOR} flatShading />` (was
    `emissive={HALL_COLOR} emissiveIntensity={0.1}`).
  - Floor cross, axis 2 — `Hallway.tsx:78-80`: same treatment.
  - Runner strip +Z — `Hallway.tsx:114-116`: `emissive="#d97034"
    emissiveIntensity={0.05}` removed.
  - Runner strip −Z — `Hallway.tsx:119-121`: same.
  - Rug base — `Hallway.tsx:150-152`: `emissive="#ffd700"
    emissiveIntensity={0.05}` removed.
  - Rug inner — `Hallway.tsx:154-156`: `emissive="#e94560"
    emissiveIntensity={0.05}` removed.

  Minor doc nit: the comment at `Hallway.tsx:148` says "inner border
  keeps a faint warm kiss", but the actual code strips emissive from
  both the base and the inner. The implementation is cleaner than the
  comment — no visual side-effect, just a stale comment. Not worth
  bouncing.

  Intended glowers preserved (grep of `emissive` across `Hallway.tsx`):
    - Coffee machine green indicator LEDs: `Hallway.tsx:35`, `:39`
    - Kiosk red display: `Hallway.tsx:94`
    - Ceiling cross light strips: `Hallway.tsx:162`, `:168`

  So the lanterns (and the deliberate LEDs) now own the warm glow band
  without being diluted by the floor/rug self-lit layer.

## Gate results
- tsc:        PASS (`npx tsc --noEmit` → exit 0, no output)
- eslint:     PASS (`npx eslint .` → exit 0, no output)
- build:      PASS (`npm run build` → `vite v8.0.8` 647 modules,
              built in 200ms, exit 0)
- playwright: PASS (12/12 tests in 2.1m, exit 0) — full suite
              including `page loads without JS errors`,
              `no console errors during interaction`, and all four
              room navigation tests green.

## Regression check

- `git diff 28363f0^ 28363f0 --stat` confirms only 2 files changed:
    - `src/world3d/scene/Hallway.tsx` (18 lines)
    - `src/world3d/scene/rooms/IdeaLab.tsx` (170 lines)
  No frozen files touched.
- Zero new per-frame allocations in the split spark loops:
    - `useFrame` orange branch (`IdeaLab.tsx:251-263`): only
      `Float32Array` element reads/writes, `SPARK_DUMMY.position.set`,
      `SPARK_DUMMY.updateMatrix`, `setMatrixAt`. No `new THREE.X()`,
      no object literals, no array allocations.
    - `useFrame` warm branch (`IdeaLab.tsx:264-276`): identical
      pattern, same single module-scope `SPARK_DUMMY` reused across
      both loops (defined once at `IdeaLab.tsx:95`).
    - Initial bake `useEffect` (`IdeaLab.tsx:280-299`) also alloc-free
      and one-shot (empty dep array).
- The `buildSparkBuckets()` temp JS arrays (`ox`, `oy`, ... `ws`) are
  ephemeral construction-time allocations inside a module-scope
  function called exactly once when the module loads — not per-frame,
  not per-render. OK.
- No console errors in playwright run (test 12 explicitly asserts this).
- `THREE.Clock` / `PCFSoftShadowMap` deprecation warnings are
  pre-existing library noise, unrelated to this commit.

## Score
- Fix correctness:     40/40
- Zero alloc preserved: 20/20
- Gate health:         20/20
- No regressions:      19/20  (−1 for the stale "faint warm kiss"
                               comment in `Hallway.tsx:148`; code is
                               fine, comment lies slightly)

## Total: 99/100
## Verdict: 🔵 PASS

Both F3.18 findings surgically addressed. Gates all green. Per-frame
allocation budget preserved. Recommend landing and moving to the next
polish cycle.
