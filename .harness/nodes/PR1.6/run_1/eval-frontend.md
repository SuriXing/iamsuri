# PR1.5 Frontend-R3F Review (run_1)

## Scope

Reviewing PR1.5 "project-stations" against frontend-r3f angles only:
collider correctness, z-fighting/depth precision, per-frame allocations,
OUT-7 interactable preservation, mesh budget, build status, React keys.
PR1.5 introduced 4 distinct project stations along the +z back wall
(`oz + 1.55`) with plinth + monitor + label + per-station decor, replacing
the prior flat back-wall card grid. Files touched:
`src/world3d/scene/rooms/ProductRoom.tsx` (PROJECT_SHOWCASE_ENTRIES.map
block, `~lines 551-779`; collider registration `lines 177-180`).

Build verified: `npm run build` exits 0 (Vite, not Next.js — auto-suggested
nextjs skill not applicable here). `App3D-Bedou_dm.js` 1,041 kB → unchanged
order of magnitude vs prior baseline.

## Findings

### 🟡 F1 — Plinth collider narrower than monitor bezel (clipping risk)
`ProductRoom.tsx:177-180` register colliders `hx=0.4, hz=0.3` per station.
The monitor bezel at `lines 584-588` is `0.85 × 0.55 × 0.06` → half-width
`0.425`. The avatar (head/upper-body height ~1.45 m, the bezel y) can squeeze
past the plinth collider's x±0.4 boundary and physically clip into the
bezel's outer 25 mm on each side. The plinth body itself is `0.7 × 0.55`
(half-width 0.35) so collider tightly bounds the plinth, but the wider mesh
above is uncovered.

**Reasoning:** OUT-7 requires "Avatar can not pass through any monitor,
plinth, or hero piece". The bezel sits inside the same vertical column as
the plinth, and the collider system is 2D top-down (no y-band). With
`hx=0.4` the avatar can graze the bezel ends.

**Fix:** widen station colliders to `hx=0.43` (covers bezel+1cm margin),
keep `hz=0.3` (bezel depth is only 0.06, fully inside plinth depth of 0.55).
Mirror BookRoom's pattern of sizing the collider to the widest above-floor
mesh in that column, not just the floor footprint.

### 🟡 F2 — Hard-coded `stationX[4]` will break if entries grow to 5
`ProductRoom.tsx:554`: `const stationX = [-1.65, -0.55, 0.55, 1.65]` then
`PROJECT_SHOWCASE_ENTRIES.map((entry, i) => { const sx = ox + stationX[i]`.
Acceptance OUT-2 says "~5 projects". `data/productRoom.ts:56-61` currently
has 4 entries, but the moment Suri adds a 5th, `stationX[4]` is `undefined`
→ `sx = NaN` → station rendered at origin, modal still wired, silent fail.

**Reasoning:** PR1.5 is supposed to make the room scale with the data
source; baking a fixed 4-element layout array defeats the point and is
exactly the kind of brittleness PR1.6 will inherit.

**Fix:** derive positions from length:
```ts
const N = PROJECT_SHOWCASE_ENTRIES.length;
const SPAN = 3.6; // total back-wall span
const sx = ox + (i - (N - 1) / 2) * (SPAN / Math.max(N - 1, 1));
```
Also add a runtime guard / dev-only console.warn if `N > 6`.

### 🟡 F3 — Sub-cm z-offset on label-plate accents (depth-precision violation)
Quality Constraints state: "avoid co-planar meshes <1cm apart with no
offset". Several station accents land 1.5–5 mm in front of their backing:

- Label plate front face at `stationZ - 0.27 - 0.01 = 1.27` (depth 0.02);
  brand bar at `stationZ - 0.281` z-center, 0.005 deep → back face
  `1.2715`, **front of plate by 1.5 mm only** (`line 617-624`).
- Title ticks at `stationZ - 0.281`, 0.005 deep → same 1.5 mm offset
  (`line 627-635`).
- Plinth front accent strip at `stationZ - 0.281` vs plinth front face
  `stationZ - 0.275` → strip back face `1.2715` vs plinth `1.275` →
  3.5 mm offset (`line 638-646`).

At the camera distance (player by door, ~3.5 m away from back wall) and
default near/far planes, 1.5 mm is below the depth-buffer resolution
threshold and *will* z-fight on lower-end GPUs.

**Reasoning:** The ProductRoom.tsx PR1.4 changelog already had to fix
co-planar baseboards / cove panels for this same reason
(`lines 234, 257, 285-289`). PR1.5 reintroduces the pattern.

**Fix:** push every accent ≥ 1 cm forward of its backing. E.g. brand bar
and ticks: `stationZ - 0.29` (2 cm forward of plate front). Plinth strip:
`stationZ - 0.29` (1.5 cm forward of plinth). Cheap, no visual change.

### 🟡 F4 — Plinth foot kick intersects floor planks vertically
`line 579-582` foot kick at `y=0.225, height=0.05` → spans y `0.20–0.25`.
Floor planks at `y=0.225, height=0.04` → span `0.205–0.245`. The two
volumes physically intersect over a 4 cm vertical band wherever they
overlap in xz (the planks run full ROOM-0.04 in z, so they pass *through*
every station's footprint). Top of foot kick (0.25) is only 5 mm above
plank top (0.245) — visually a sliver of foot kick pokes above the plank,
but the bottom 4 cm is buried inside the plank.

**Reasoning:** Not strictly z-fighting (different surfaces), but it's an
intersecting-volume tell that becomes visible at low view angles and on
the plank seams. BookRoom.tsx avoids this by raising furniture bases
above plank top.

**Fix:** raise foot kick to `y=0.275` (10 mm clear of plank top 0.245),
or shrink foot-kick height to 0.02 sitting on plank top.

### 🔵 F5 — Mesh-count delta is high but probably under +30% cumulative
Per station: 9 structural meshes (plinth, top-trim, foot-kick, bezel,
screen, neck, label-plate, brand-bar, accent-strip) + 4 title ticks =
13. Decor: i=0 →3, i=1 →3, i=2 →4, i=3 →4. Even-index cable coils: +2.
Total new meshes ≈ **68**. Removed meshes (the previous flat 4-card
grid): ~16–20 estimate. Net delta ~+48–52 meshes against an existing
base of ~140+ meshes (desk + rack + crates + floor planks + baseboards +
cove + coffer 9 + dual monitors + desk props). Estimated cumulative
delta ~+30–35%.

**Reasoning:** Right at the constraint ceiling. PR1.6+ (hero focal
piece, accent lights, possibly a curve layout) will push it over.

**Fix (deferred):** when PR1.6/1.7 add the hero piece, consider
collapsing decor into a single instanced mesh or merging the 4 title
ticks per station into 1 textured plane.

### 🔵 F6 — `userData.interactable` preservation verified
`grep -c userData.interactable` → **2** matches in source: one in
`ScreenStand` (`line 97`, covers PROBLEM_SOLVER + MENTOR_TABLE via two
component instances) and one in the station map closure (`line 593`,
fires per entry × 4). At runtime that produces 2 + 4 = 6 interactable
meshes — handshake's `userData_interactable_count: 2` reports source
occurrences not runtime instances; both readings are consistent. OUT-7
preserved. ✓

### 🔵 F7 — Zero new per-frame allocations
`useFrame` block (`lines 140-152`) untouched by PR1.5. No `new Color()`
/ `new Vector3()` introduced anywhere in the station block. The
emissive accent colors come straight from `entry.accent` (string) into
`<meshPhongMaterial>` props. ✓

### 🔵 F8 — React keys are stable
Outer station group: `key={`station-${entry.id}`}` (`line 565`) — uses
data id, stable across re-orders. Inner title-tick map:
`key={`title-tick-${k}`}` (`line 629`) — index-keyed but the array is
literal `[-0.18, -0.06, 0.06, 0.18]` so order is fixed. No console
warnings expected. ✓

### 🔵 F9 — Build green
`cd ~/Code/SuriWorld/SuriWorld && npm run build` → built in 224 ms,
0 TS errors, 0 R3F warnings reported. App3D bundle 1,041 kB (within
existing baseline). ✓

## Verdict

**ITERATE** — F1 (collider too narrow for bezel) and F3 (sub-cm accent
offsets) directly threaten OUT-7 and the depth-precision quality
constraint; F2 will silently break the moment a 5th project lands.
Worth one tightening pass before PR1.6 layers a hero piece on top.
