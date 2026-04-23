# PR1.10 — Frontend-R3F Review (run_1)

## Scope

Final pre-deploy frontend review of `src/world3d/scene/rooms/ProductRoom.tsx`
after PR1.2/4/5/7/8/9. Brand/visual tonality belongs to designer; scope
trade-offs belong to PM. This review covers only:

- Build cleanliness (`npm run build`, TS errors/warnings).
- Static console-hygiene scan (React keys, R3F prop spread, THREE warns).
- `useFrame` per-frame allocations (Quality Constraint).
- Mesh-count budget vs ≤+30% baseline target.
- Z-fighting / co-planar offsets (≥1cm rule).
- Collider integrity for OUT-7 (every plinth + monitor + hero + desk).
- Interactable preservation (6 stations + legacy PROBLEM_SOLVER /
  MENTOR_TABLE migration).
- Reduced-motion gating on hero rotation (Quality Constraint).
- Light budget (≤8 pointLight).

Build result: `✓ built in 200ms`, 0 TS errors, no new warnings (VER-5 PASS).

Static metrics:
- `<mesh` literal count in ProductRoom.tsx: **156** (source-line, not
  expanded). Loop expansions (8 planks, 9 coffers, 8 desk legs, 6 RACK_LEDS,
  6 STATIONS × ~7 sub-meshes, 4 station accent lights, 5 PRODUCT_COLORS,
  etc.) push effective count to **~160 meshes**.
- `<pointLight>` literal count: **5 + 1 array of 4 = 8 lights total**, at cap.
- Per-frame `new Color/Vector3/Quaternion/Matrix4/Euler` in useFrame: **0**.

---

## Findings

### 🔴 Must-fix-before-deploy

**F-R-1 — Foot-kick / plank top 5 mm offset violates ≥1 cm depth-precision rule** ·
`ProductRoom.tsx:559–576`

Plank top sits at `y = 0.225 + 0.04/2 = 0.245`. Foot kick is centered at
`footY = 0.275` with `h = 0.05` → spans `0.250 – 0.300`. Bottom face of the
foot kick at `y = 0.250` is **5 mm** above the plank top — the comment on
line 558 even calls it out (`Plank top is at y=0.245; foot kick spans
0.25–0.30 (clear)`) but 5 mm is exactly the gap the Quality Constraint
flags as a z-fighting risk at distance ("avoid co-planar meshes <1 cm
apart"). With 6 stations × the full plank line behind them and the
distance-16 default camera, this will shimmer on the device the moment
the player walks the row. Reasoning: the constraint isn't about exact
co-planarity — it's about depth-precision at distance.

*Fix*: bump `const footY = 0.275` → `0.305` (or drop foot-kick `h` to 0.04
and push center to 0.27). Either restores ≥1 cm clearance over plank top
without raising the plinth visually.

---

### 🟡 Should-fix

**F-R-2 — Mesh budget overshoot vs +30 % baseline target** ·
whole-file (`ProductRoom.tsx:1–845`)

Acceptance criteria Quality Constraint: "total mesh count ≤ +30 % vs
current ProductRoom.tsx baseline." Reviewer briefing pegged baseline at
~80 meshes (ceiling ~104). Effective mesh count after expansion is
**~160**, roughly **2×** the assumed baseline. Concrete contributors:
9-cell ceiling coffer (`:304–317`), 8 planks + 4 rug-border strips
(`:221–252`), 6 stations × ~7 sub-meshes including foot+plinth+trim+neck+
bezel+screen+cable+optional-stacked (`:549–702`), 5-wall glass case
(`:733–763`). Reasoning: budget exists for frame-time on low-end mobile;
overshoot is the kind of debt a designer/PM will keep adding to.

*Fix*: PM call on whether to redefine baseline (since PR1.2/4/5/7/8/9
have already legitimately added geometry) OR cull the 9-cell coffer down
to a single emissive panel (–8 meshes), drop the 4 rug border strips
into an `Edges` overlay on the rug (–4 meshes), and skip per-station
foot-kick on the 4 stations not at room edges (–4 meshes). Net ~–16, gets
under 144.

**F-R-3 — Wall-shelf / accent-strip touching faces (0 mm gap)** ·
`ProductRoom.tsx:784–792`

`SHOWCASE WALL SHELF` (`y=2.08, h=0.04`) bottom face at `y=2.06`. Cyan
accent strip below (`y=2.05, h=0.02`) top face at `y=2.06`. **Exactly
co-planar.** Same risk class as F-R-1 but smaller surface area + above
eye-line so likely off-screen most of the time. Reasoning: still violates
the explicit ≥1 cm rule.

*Fix*: drop accent strip to `y=2.04` (gives 1 cm gap).

**F-R-4 — Rug border strip / rug top sub-cm offset** · `ProductRoom.tsx:233–252`

Rug at `y=0.255, h=0.005` → top at `0.2575`. Border strips at
`y=0.26, h=0.006` → bottom at `0.257`. Overlap of ~0.5 mm in z if any
border crosses rug interior. Borders sit at the rug perimeter so they
mostly extend outside the rug footprint, but the ±0.04 m strip at
`x=ox±0.98` shares planar overlap with the rug body. Reasoning: same
shimmer class.

*Fix*: lift borders to `y=0.27` (1 cm above rug top).

**F-R-5 — `prefersReducedMotion` is a one-shot `useMemo`, won't react to OS toggle** ·
`ProductRoom.tsx:157–160`

Mirrors how BookRoom is presumably wired, but: a user toggling
`prefers-reduced-motion` mid-session won't see the hero stop spinning
until the room remounts. The `matchMedia` MQ is read once. Acceptance
criteria gates "rotation animations gated via `prefers-reduced-motion`"
and is currently satisfied at mount but is brittle. Reasoning: low-prob
edge case but trivial to harden.

*Fix*: add a `useEffect` that subscribes to the MQ `change` event and
sets state, replacing the `useMemo`. ~6 lines.

**F-R-6 — `onUpdate` re-assigns `m.userData.interactable` every render** ·
`ProductRoom.tsx:602–607`

`onUpdate` fires on every commit; while the assignment itself is cheap,
the callback also closes over a fresh `interactable` object literal
created each render (lines 553–557). Six stations × every render = six
object allocations per render of the room. Not a per-frame allocation
(no `useFrame` involvement), so it does not violate the Quality
Constraint, but it's wasteful. Reasoning: cheap to fix.

*Fix*: wrap each station's `interactable` in `useMemo` keyed on `s.id`,
or hoist the onUpdate to assign once via `useEffect` + ref.

---

### 🔵 FYI

**F-R-7 — Collider coverage looks correct for OUT-7** · `ProductRoom.tsx:192–212`

6 station colliders (computed from `STATIONS.length`) + desk + rack +
crate + hero pedestal = **10 playerOnly colliders**, all `hx=0.45 hz=0.30`
on stations. Avatar can't clip into any monitor / plinth / hero. ✓

**F-R-8 — Interactable count = 6, source-of-truth correct** · `ProductRoom.tsx:549, 602–607`

Single source line `m.userData.interactable = interactable` inside the
`STATIONS.map` body. With `STATIONS = [PROBLEM_SOLVER, MENTOR_TABLE,
...PROJECT_SHOWCASE_ENTRIES (4)]`, modal triggers expand to 6. Legacy
desk monitors confirmed gone (`:319–323` comment); dialogues migrated to
stations 0 and 1. Matches design-note Compatibility section. ✓

**F-R-9 — Light budget exactly at cap** · `ProductRoom.tsx:803–841`

1 key + 1 fill + 1 hero accent + 1 shared-stations-0+1 + 4 per-station
(2..5) = **8**. Stations 0 & 1 share a mint-cyan accent positioned
between them. Comment block at `:794–802` documents the trade-off.
At cap, no headroom for designer to add another accent without culling. ✓
for now.

**F-R-10 — Hero rotation: rotation-only, no emissive/scale changes** ·
`ProductRoom.tsx:162–174`

`useFrame` body sets `cube.rotation.y = t * 0.4` only when not
reduced-motion. Cube's `emissiveIntensity={0.9}` is a static literal at
`:774`. No scale ops. Compliant with zero-brightness-motion rule. ✓

**F-R-11 — `accentLightRef` declared but never read** · `ProductRoom.tsx:150, 819`

Ref attached for "stable handle for any future ref-based work" per the
inline comment at `:801`. Dead weight. Not blocking. Could remove the
ref + the import line for `PointLight` to drop ~5 LOC.

**F-R-12 — Two `Edges` on transparent glass walls** · `ProductRoom.tsx:735–757`

Drei `<Edges>` on transparent (`opacity 0.18`) materials renders the
edge lines through both walls — front and back edges visible. Likely
intentional (spec says "no edges" on glass walls; current code DOES add
edges, mild spec deviation). Reasoning: designer/PM call on whether the
edge stroke helps the silhouette read better than spec-pure invisible
glass.

*Fix*: if strict spec compliance wanted, drop `<Edges>` on the 5 glass
meshes. If current visual reads better, leave and update design-note.

**F-R-13 — Console-clean static scan** ·

No spread props on R3F primitives. All `.map` results have `key`. No
deprecated `args={[Color, ...]}` patterns. No `attach="material-X"`
style children. Should run clean. ✓ (cannot verify without browser
runtime — relies on VER-5 manual screenshot pass.)

---

## Verdict

**ITERATE.** One must-fix (F-R-1, 5 mm foot-kick z-fight) plus four
should-fixes are all small surgical edits; none change scene topology.
Recommend a single PR1.11 round to land F-R-1, F-R-3, F-R-4 (z-fighting
trio), then deploy — F-R-2 (mesh budget) and F-R-5/6 are PM call.
