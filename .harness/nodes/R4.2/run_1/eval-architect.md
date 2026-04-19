# R4.2 — Architect Review (Round 1)

Scope: refactor health, abstraction quality, file count, coupling, extensibility of
`Room.tsx` shell builder introduced in R4.1 (commit 4fe21d1, plus hotfixes c393b27,
c87612c).

## Summary

R4.1 hit the headline goal: three files (`Walls.tsx`, `Ceiling.tsx`, `RoomFloor.tsx`)
plus the four R3.3 doorway threshold patches collapsed into one `Room.tsx` shell
component invoked uniformly via `ROOMS.map(r => <Room room={r}/>)` in
`World.tsx:126-128`. Net file count is genuinely lower and the SHELL-vs-CONTENT split
(Room.tsx vs `scene/rooms/*.tsx`) is clean — no content file imports anything from
`Room.tsx`, and `Room.tsx` is content-agnostic.

The abstraction is, however, **leakier than it looks**. `Room.tsx` (408 lines) is
doing five jobs that are only loosely related: floor mesh, wall-strip primitive,
doorway-cutout primitive, ceiling material, wall-tint RNG. The "single closed
volume" framing reads more like "single file" than "single responsibility." The
seam-bridging `floorExtra` (lines 286-288) is the threshold-patch bandage relocated
from `Hallway.tsx` into `Room.tsx`, not eliminated — it's an honest fix in that
the seam is now owned by exactly one side, but the rationale ("floor tile-meets")
hides the fact that the room floor is now asymmetric in a way that makes
`room.center` no longer equal to the floor's geometric center.

The `RoomDef` contract is tight (4 fields actually consumed), but `Room.tsx`'s
internal coordinate math (`doorwayZSign`, `innerWallXSign`) hard-codes assumptions
that only hold for the current 4-room cross layout. Any 5th room not in the four
quadrants, or any room with two doors, would require non-trivial refactor — not
a config tweak.

Verdict for R4.11 fix queue: a small pile of 🟡 cleanup; one 🟡 architectural
debt (axis-sign math); no 🔴.

## Findings

### 🟡 Single-Responsibility creep inside Room.tsx
- `Room.tsx:78-130` (`WallStrip`), `Room.tsx:151-251` (`DoorwayWall`), `Room.tsx:295-318`
  (tint RNG), `Room.tsx:321-330` (ceiling material factory), `Room.tsx:54-76`
  (color-math helpers `muteHex`/`mixTint`) are five independently testable concerns
  fused into one module. The file is 408 lines, of which only ~75 (the
  `Room({room})` body) are the "shell composer." Splitting `WallStrip` +
  `DoorwayWall` into `scene/parts/WallSegment.tsx` (or similar) and color helpers
  into `util/color.ts` would shrink Room.tsx to ≤150 lines and make the shell
  composition itself reviewable at a glance.
- This is a 🟡, not 🔴, because nothing else currently imports the helpers — but
  the *next* component that wants the same baseboard/cap/tint treatment (e.g. an
  outdoor wall, a half-wall divider) will either copy-paste or reach into
  `Room.tsx`, which is the wrong direction.

### 🟡 Coordinate sign-math leaks layout assumptions into Room.tsx
- `Room.tsx:269-278`:
  ```
  const doorwayZSign: 1 | -1 = cz < 0 ? -1 : 1;
  const doorWallZ = doorwayZSign * (GAP + 0.05);
  const innerWallXSign: 1 | -1 = cx < 0 ? -1 : 1;
  ```
  These `sign(center.{x,z})` shortcuts encode the invariant "rooms live in the
  four quadrants of a + cross, doorway always faces the origin, perpendicular
  walls always face the inner corridor." That invariant is *not* in `RoomDef`; it
  has to be reconstructed from `center` every render.
- `RoomDef` already carries `door: {x,z}` (`rooms.ts:10`). The doorway side could
  be expressed directly as `Math.sign(door.z - center.z)` (or by adding a
  `doorAxis: 'x'|'z'` + `doorSide: -1|1` field), which would (a) make the math
  self-documenting, (b) survive future rooms placed off the cross layout, and
  (c) survive a room with two doors by becoming a `doors[]` loop.
- Author left a comment block (`Room.tsx:265-268`) explaining this sign was
  inverted in initial R4.1, which is exactly the bug class that disappears once
  the relationship is data-driven instead of inferred.
- Severity 🟡: works for the four committed rooms; the next room will pay the
  cost.

### 🟡 floorExtra is the threshold patch, relocated
- The R3.3 patches were 4 small tinted floor pieces in `Hallway.tsx` covering the
  seam between hallway floor and room floor. R4.1 deleted them and added
  `floorExtra = 0.2` (`Room.tsx:286-288`) extending each room's floor 0.2u toward
  the corridor. That is the same bandage on the same seam, just owned by a
  different file.
- The honest part: ownership is now unambiguous (Room owns the seam, Hallway
  doesn't know), which satisfies the "one side owns the seam" architectural
  concern. The dishonest part: the comment frames it as "kills the seam" when it
  actually *covers* the seam by overlap. The hallway floor at `Hallway.tsx:122-130`
  spans `HALL_LEN = ROOM*2 + GAP*2 + 1`, which extends 0.5u past both door
  centers — so the room's 0.1u overlap into the corridor is z-fighting against
  the hallway floor in a 0.1u-wide strip at every doorway. With `FLOOR_Y`
  identical on both, the ordering is RNG-dependent.
- Suggested R4.11 cleanup: either (a) trim `HALL_LEN` so hallway stops *at*
  `GAP+0.05` and rooms own the doorway tile end-to-end, or (b) lower the room
  floor by a hairline (0.001u) under the overlap to win the depth fight
  deterministically. The current state passes screenshots but is fragile.
- Severity 🟡: visually fine today, will resurface as dark-mode flicker on the
  first GPU that resolves the tie differently.

### 🟡 `room.center` is no longer the floor's geometric center
- `Room.tsx:288`: `floorZ = cz - (doorwayZSign * floorExtra) / 2;` shifts the
  floor mesh 0.1u away from the room center toward the hallway. This silently
  breaks the "RoomDef.center is THE room's center" mental model that
  `World.tsx:30-34` (room lights), `World.tsx:160` (label position), and the
  R3.3-era raycast tests all depend on.
- It happens to not matter today because the offset is small and no consumer
  raycasts the *floor* relative to `RoomDef.center`. But a future raycast-
  coverage test that samples the room footprint as `[cx-ROOM/2, cx+ROOM/2] ×
  [cz-ROOM/2, cz+ROOM/2]` will now miss 0.1u on the back side of every room.
- Fix is a one-line comment in `RoomDef` ("`center` is the *wall* center, not
  the floor centroid") OR move `floorExtra/2` adjustment up into `RoomDef` as a
  derived field. Either makes the asymmetry explicit.

### 🔵 CEILING_Y export has no consumers
- `Room.tsx:27`: `export const CEILING_Y = 2.05;` with comment "kept exported in
  case other modules grow a dependency on it later." Nobody imports it
  (verified: `grep -rn "CEILING_Y" src/` returns only the definition + the
  internal usage at `Room.tsx:400`). This is YAGNI — the right home is a
  `const` inside Room.tsx until the second consumer materializes; if/when it
  does, lift to `constants.ts` (which already houses `ROOM`, `GAP`, `FLOOR_Y`,
  `DOOR`).

### 🔵 Wall-tint RNG seed reaches across the room.id namespace
- `Room.tsx:295-318`: hashes `room.id` (FNV-1a-ish) to seed a per-room RNG so
  tints stay stable across reloads. Fine. But the `mixTint` math, the seed
  hash, and the strip-by-strip generation are buried inside the shell
  component, so two rooms can never share a palette and the palette is not
  testable in isolation. Pulling out a `getRoomTints(roomId, accentColor)`
  function makes both possible. Low priority — not blocking.

### 🔵 `WallStrip` registers a collider for every wall segment, including the
ceiling-facing cap
- `Room.tsx:88-92`: each `WallStrip` registers ONE AABB sized `(w, d)` at
  `(x, z)`. The cap and baseboard meshes are visually trim, but the collider
  uses only the main wall slab dimensions. Correct. However, `DoorwayWall`
  produces TWO WallStrips per doorway, each registering separate colliders
  (`Room.tsx:169, 178`), which is correct, but there's no collider for the
  *lintel block* above the door (`Room.tsx:189-205`). A player who somehow
  jumped/teleported above DOOR.frameHeight could clip through. With current
  movement (no jump) this is unreachable. Note for the file, not a fix. 🔵.

### 🔵 `Math.sign` of `0` edge case unhandled
- `Room.tsx:269, 276`: if a future room placed exactly at `cx === 0` or
  `cz === 0`, `cz < 0 ? -1 : 1` returns `1`, which silently picks one side. The
  cross layout makes this impossible today, but combined with Finding #2 above,
  the right fix is "stop inferring sign from center."

### 🔵 `WallStrip` keys colliders on `id` but the prop comes from caller string
concat
- `Room.tsx:348, 367, 378, 389`: collider IDs are constructed inline as
  `wall-h-${room.id}`, `wall-back-${room.id}`, `wall-v-inner-${room.id}`,
  `wall-v-outer-${room.id}`, plus `${idPrefix}-L`/`-R` in DoorwayWall. Eight
  string templates with no central registry — easy to drift, hard to grep for
  "all colliders owned by myroom." A small `roomColliderIds(roomId)` helper
  in `colliders.ts` would centralize the namespace.

## Notes

### What was done well
- The SHELL/CONTENT split is the highest-value win. `scene/rooms/MyRoom.tsx` and
  siblings have zero coupling to wall/floor/ceiling primitives — they only place
  furniture inside the room footprint. This means R4.11+ can iterate on shell
  geometry (e.g., switching wall material) without touching content files.
- The collider lifecycle in `WallStrip` (`Room.tsx:89-92`) is properly scoped to
  the segment's own dimensions — refactor preserved the R3-era behavior that
  collider boxes match visual wall slabs.
- `World.tsx:126-128` is genuinely declarative: one `.map()` over a data array.
  This is the architectural shape OUT-1 was asking for.
- Hotfix c393b27 (DoubleSide on walls + walk-through enter/exit) and c87612c
  (DoubleSide on door) are scoped fixes against the new shell, not regressions
  of pre-R4.1 behavior.

### What I'd push to R4.11 backlog
- 🟡 Split `Room.tsx` into `Room.tsx` (composer, ~150 lines) +
  `parts/WallSegment.tsx` + `util/color.ts`. KISS now becomes worth it because
  the file has crossed the 400-line "too much in one place" threshold.
- 🟡 Replace `doorwayZSign`/`innerWallXSign` math with explicit fields on
  `RoomDef` (`doorSide`, `doorAxis`). Shrinks Room.tsx, kills a class of
  off-by-one bugs, makes 5th room / two-door room a config change.
- 🟡 Resolve the floor overlap z-fight at doorways (trim hallway floor or
  z-bias room floor).
- 🔵 Drop the unused `CEILING_Y` export.
- 🔵 Extract `getRoomTints()` for testability.

### Extensibility check (mental walkthrough)
- **Add a 5th room in a quadrant**: append to `ROOMS` in `rooms.ts:18-23`. Done.
  ✅
- **Add a 5th room NOT in a quadrant** (e.g., cz=0): breaks `doorwayZSign`
  inference; falls back to `+1` silently; door placement broken. ❌
- **Add a room with two doors**: would need a second `<DoorwayWall>` invocation
  with the *opposite* axis, requires changing `RoomDef.door` from a single
  `{x,z}` to `doors[]`, and replacing the four hard-coded wall-emit calls
  (`Room.tsx:347-396`) with a "for each side, pick doorway-or-solid" loop.
  Doable, ~60 lines refactor. 🟡
- **Different room footprint** (e.g., narrow alcove ROOM_W × ROOM_D): currently
  every wall reads `ROOM` constant. Would need `room.footprint: {w,d}` on
  RoomDef. Plumbing change, not a redesign. 🟡

### Tests/seams
- `Room.tsx` is render-only, no exported helpers other than `CEILING_Y`. To
  unit-test the geometry, a future test would have to either render the
  component (jsdom + r3f test renderer) OR the helpers would have to be
  extracted. Today: not testable without a renderer. Pulling out
  `computeWallLayout(room)` returning `{floorZ, doorWallZ, oppositeWallZ,
  innerWallX, outerWallX, segLen}` would make the layout asserts directly
  testable in jest, and would document the geometry in one return statement
  instead of scattered across 30 lines.
- Recommend R4.11 add such a helper *if* it splits the file per Finding #1;
  otherwise leave as 🔵.

### Round-1 hand-off to Round-2 (tester)
Things the tester should specifically probe:
- Doorway-down brightness at the 0.1u floor overlap strip (Finding #3) — does
  any room show z-fight banding in dark mode?
- Walk-through enter/exit at all 4 doorways (the c393b27 hotfix area) — does
  the player ever get stuck on the lintel collider hitbox? (Spoiler: there
  isn't one — see Finding 🔵 #6 — so the question is whether they pass cleanly
  *under* it.)
- Look-up screenshot inside each room — does the lintel block above each door
  read as wall, or does it have a visible gap to the ceiling? `Room.tsx:189-205`
  computes its height as `max(WALL_H + 0.1 - DOOR.frameHeight, 0.12)` =
  `max(1.9 - 1.9, 0.12) = 0.12`, so it's a 0.12u-tall block; verify the
  ceiling-to-lintel-top gap (ceiling bottom = 2.0, lintel top = (1.9 + 1.9)/2
  + 0.06 = 1.96) — there's a 0.04u sliver of void. That may or may not be
  visible at OUT-2's 200/255 brightness threshold.
- Verify R3.3 regression: walk to each doorway threshold and screenshot
  bottom-third — should be ≥30 brightness per OUT-1 verification.

---

Report file: `.harness/nodes/R4.2/run_1/eval-architect.md`
