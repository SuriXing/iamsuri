# eval-frontend (R4.2)

## Summary
Closed-volume builder is geometrically correct for all 4 rooms — sign flip is fixed, perimeter walls + cutout pillars + opposite/inner/outer walls land where they should and corners abut cleanly. Two real concerns: (1) Room.tsx's new "lintel block" sits inside the same vertical band as Door.tsx's lintel/header/lintelTrim and will z-fight; (2) the DoubleSide hotfix is a blunt instrument that doubles fragment work on every wall surface and reverses lighting on back faces — fine as a triage, but should not be the long-term answer. Other findings are minor (per-room ceiling material regression, dead axis='z' branch, slight wall/cap/plinth co-planar bands).

## Findings

### 🔴 Critical (must fix before R4.3)

- **Room lintel block z-fights with Door's lintel/header/lintelTrim** — `src/world3d/scene/Room.tsx:189-205` places a `boxGeometry args=[DOOR.width, ≥0.12, WALL_THICK=0.1]` at `y = (DOOR.frameHeight + WALL_H + 0.1)/2 = 1.9`, occupying y∈[1.84, 1.96] at the door's exact (x, z). Door.tsx already puts THREE meshes in the same volume at the same world position:
  - `lintel` (`Door.tsx:322-326`, args `[DOOR.width+0.30, 0.18, 0.22]`, center y=1.92 → y∈[1.83, 2.01])
  - `header` (`Door.tsx:275-279`, args `[…, 0.22, 0.26]`, center y=1.95 → y∈[1.84, 2.06])
  - `lintelTrim` (`Door.tsx:328-336`, center y=2.02)
  
  The Room lintel's z-extent (WALL_THICK=0.1) sits fully inside the Door header's z-extent (jambDepth=0.26), and the y-bands overlap. With DoubleSide on all four meshes, expect visible z-flicker on the lintel face when the camera is anywhere near the doorway. Either subtract the Room lintel's z-band from the Door header (or vice-versa), or drop the Room lintel entirely and let Door own the entire over-door volume — Door's three lintel layers were already the visual top of the opening before R4.1, and Room's new block was a precaution. Verify by orbiting the camera around any doorway in dev.

### 🟡 Major (fix before acceptance)

- **DoubleSide on every wall mesh is a perf + lighting trade, not a fix** — `Room.tsx:102, 113, 124, 202, 245` switch all wall/plinth/cap/lintel materials to `THREE.DoubleSide`. Flat-shaded `MeshPhongMaterial` with DoubleSide:
  1. Fragment shader runs on back faces too → ~2× fragment work over the wall surfaces. With 4 rooms × (3 perimeter WallStrips + 2 pillars) × 3 layers (wall + plinth + cap) = ~60 wall meshes, this is measurable, especially when the camera is inside a room and looks at the wall facing it (its back face is what's rendered).
  2. Back-face normals are flipped, but `flatShading` recomputes per-face normals at the geometry level, so back faces light *opposite* to fronts — under directional + 4 colored point lights this can read as patchy from outside the room.
  3. Edges (`<Edges />`) is fine — drei's edge geometry doesn't double — but FogExp2 with logarithmicDepthBuffer + 2× fragment work is exactly the regression the F3.x perf passes were trying to undo.
  
  The actual root cause of the "transparent walls when grazing/clipping" was that the camera could end up *behind* the inward-facing wall face (e.g., as the player slides along it). The cleaner fix is to keep FrontSide and either (a) ensure each WallStrip's normals point *inward* into the room (room walls' FrontSide should face the room interior, since that's where the camera lives 99% of the time), or (b) push the camera collider out so the camera never crosses a wall plane in the first place. DoubleSide is acceptable as a triage but should be tracked as tech debt.

- **Per-room ceiling material regresses the old shared-material optimization** — `Room.tsx:321-330` creates a new `MeshStandardMaterial` per `<Room>` instance via `useMemo([theme])`. The deleted Ceiling.tsx (per the R4.1 commit message and the `// Hoisted from Ceiling.tsx` comment at `Room.tsx:25-27`) was a single component that built one material and applied it to all 4 ceiling meshes. Now we have 4 distinct material instances → 4 shader programs to compile (somewhat mitigated by the `ShaderWarmup` in `World.tsx:55-68`, but it still bloats the cache) and 4 separate uniform updates on theme toggle. Fix: hoist the ceiling material to a module-level memoized factory keyed by theme, or build it once in `World.tsx` and pass into `<Room />`.

- **Dead `axis === 'z'` branch in DoorwayWall** — `Room.tsx:209-251`. All 4 rooms in `src/world3d/data/rooms.ts:18-23` have doors on the *horizontal* wall (door.z = ±1.25), so `<Room>` always passes `axis="x"` (line 351). The `axis: 'z'` branch in `DoorwayWall` is unreachable. KISS/YAGNI — delete it, or at minimum document why it exists. If it's there for a future "doors on vertical walls" world, leave a `// TODO(R4.x):` so the next reviewer doesn't have to hand-trace it again.

### 🔵 Minor / Nits

- **Room-floor / hallway-floor step at the doorway threshold** — Room floor is `[ROOM, 0.12, floorDepth]` at `y=FLOOR_Y=0.06` (top y=0.12, bottom y=0.0; `Room.tsx:335-343`). Hallway floor is `[HALL_WIDTH, 0.08, HALL_LEN]` at `y=FLOOR_Y-0.02=0.04` (top y=0.08, bottom y=0.0; `Hallway.tsx:123-130`). In the 0.20-deep overlap zone (e.g., z∈[-1.2, -1.0] for myroom), the room floor's top sits 4cm above the hallway floor's top — a visible step at the threshold. Bottom faces share y=0 but are FrontSide so no z-fight. The step is small and may even read as "stepping into a room," but if not intentional, lower the room-floor box top to match hallway (drop FLOOR_Y for the room floor by 0.04, or thin the box).

- **Cap mesh sits 0.10u above wall top — leaves a hairline horizontal seam** — `Room.tsx:117` puts the cap at `y = WALL_H + CAP_H/2 + 0.1 = 1.94`, so cap bottom is at y=1.9, exactly at wall top. Touching faces with no overlap → in motion you may see a 1-pixel seam (logarithmic depth helps but doesn't cure it). The lintel block's top at y=1.96 is 2cm *below* the cap top y=1.98, leaving a small gap above the doorway lintel where you can see through. Minor.

- **Plinth/cap geometry overlaps wall body** — Plinth box (`Room.tsx:106-116`) extends to y∈[0.01, 0.15], wall extends to y∈[0.1, 1.9]. They overlap from y=0.1 to y=0.15. The plinth is wider (`+TRIM_PAD=0.03`) so visible faces don't fight, but inside the overlap volume two DoubleSide materials coexist. If the player ever clips through (e.g., glitches into geometry) they'd see flicker. Negligible.

- **`registerCollider` in `WallStrip` only registers the body box, not plinth/cap overhang** — `Room.tsx:90` uses `hx: w/2, hz: d/2` matching the wall body. Plinth/cap stick out by `TRIM_PAD/2 = 0.015` on each side. Character collider radius is 0.28 (`constants.ts:163`) and walls are 0.1 thick, so the character is stopped well before grazing the plinth. Truly cosmetic.

- **`tints.doorL` is reused for the lintel block but `doorR` is unused for it** — `Room.tsx:198, 241`. The two pillars get distinct deterministic tints (`doorL` / `doorR`) but the lintel always takes `doorL`. With WALL_POLISH.tintJitter=0.24 the difference between pillars can be visible; the lintel matching only one pillar may read as "the right pillar is wrong." Consider averaging the two, or pick whichever side the player is more likely to look from.

- **`CEILING_Y` re-export is speculative** — `Room.tsx:27` exports `CEILING_Y` "in case other modules grow a dependency on it later." YAGNI. Drop the export until something actually needs it; otherwise the constant becomes part of the public API by accident.

## Notes

- Geometry math hand-trace for `myroom` (cx=-3.7, cz=-3.7, half=3.7): doorwayZSign=-1, doorWallZ=-1.25 (matches `door.z` in `data/rooms.ts:19`), oppositeWallZ=-6.25, innerWallX=-1.25, outerWallX=-6.25. Pillar L at x=-5.3 (range [-6.3,-4.3]), pillar R at x=-2.1 (range [-3.1,-1.1]), door at x=-3.7 (range [-4.3,-3.1]). Total perimeter spans x∈[-6.3,-1.1] = 5.2 = ROOM+0.2. Corners meet outer wall at x=-6.3 and inner wall at x=-1.2 cleanly. ✓ Same logic checks out for the other 3 rooms by symmetry.
- The R4.1 raycast (`raycast.txt`) shows 100% wall-hit coverage from inside each room — confirms the closed-volume topology works post sign-fix. Visual z-fight on the lintel won't show up in raycast counts; needs eyeball verification.
- DoubleSide + flatShading interaction is worth a follow-up issue even after the lintel z-fight is resolved.
