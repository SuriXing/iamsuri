# eval-tester (R4.2) — Round 2

## Context from Round 1

**Frontend (eval-frontend.md)** flagged:
- 🔴 Lintel block at `Room.tsx:189-205` z-fights with `Door.tsx` lintel/header/lintelTrim (overlapping y∈[1.83,2.06], same x,z, WALL_THICK=0.1 sits inside jambDepth=0.26).
- 🟡 DoubleSide everywhere is a perf+lighting blunt-instrument fix; ~60 wall meshes × 2× fragment work.
- 🟡 Per-room ceiling material regresses shared-material optimization.
- 🟡 Dead `axis === 'z'` branch in `DoorwayWall`.
- 🔵 4cm floor step (room top y=0.12 vs hallway top y=0.08) at every doorway threshold.

**Architect (eval-architect.md)** flagged:
- 🟡 `floorExtra` is the threshold patch relocated, not eliminated; same overlap, different owner.
- 🟡 `doorwayZSign`/`innerWallXSign` infer layout from `Math.sign(center)` — fragile for any non-quadrant room.
- 🟡 `room.center` no longer the floor centroid (offset by 0.1u toward hallway).
- Hand-off to me: probe doorway-down brightness, walk-through enter/exit, look-up lintel-to-ceiling sliver (computed at 0.04u void), R3.3 regression check.

I focused on the special mandate (R3.3 regression + adjacent enter/exit / brightness misses) and tried not to re-cite their findings.

## Adjacent issues found

### 🔴 Critical

- **The R4.1 raycast harness does NOT probe the doorway seam strip — its 100% coverage claim does not validate the threshold-patch deletion.** `tests/raycast-coverage.cjs:75-82` samples each room over `[cx-half, cx+half] × [cz-half, cz+half]` with `half = ROOM/2 - inset = 2.35`. For myroom (cz=-3.7, doorwayZSign=-1) this samples z ∈ [-6.05, -1.35]. But the room-floor extension that replaced the R3.3 threshold patches lives at z ∈ [-1.35, -1.0] (the 0.2u strip pushed *toward* the corridor), and the actual seam between room floor and hallway Z-arm sits at z = -1.2 to -1.0. **The harness specifically excludes the strip the fix was designed to cover.** A raycast from (sx=-3.7, sz=-1.1) — i.e., directly above the doorway threshold — would tell you whether room-floor + hallway-floor actually overlap; the current grid never goes there. Net: the harness would have reported 100% even if `floorExtra=0` (room floor would still cover [-6.2,-1.2], well within the sampled grid). The OUT-1 verification gate is satisfied trivially. Plan asked me to verify the R3.3 patch deletion didn't regress; the *test* doesn't actually verify it. Geometric hand-trace below shows the seam IS closed — but the test does not prove it.

  Fix: extend the sample grid to the actual extended footprint `[cz-2.5-floorExtra, cz+2.5+floorExtra]` on the doorway-side axis OR add a dedicated 4-row "threshold strip" probe at each room's doorway (y=0.12 ray cast down at sample points spanning the extended floor edge across the door width).

### 🟡 Major

- **`AUTO_EXIT` is hard-coded to a z-axis door normal** (`InteractionManager.tsx:156-158`). The "hallway-side" test uses only `inwardZ = room.center.z - room.door.z` and `playerZRelDoor = charPos.z - door.z`. Today every room in `data/rooms.ts:18-23` has its door on the horizontal wall (door.z = ±doorEdge, door.x = room.center.x), so this works. **But the fragility is the same one the architect called out for `doorwayZSign` in Room.tsx**: layout assumption baked into runtime math instead of carried in `RoomDef`. The next room with a door on a vertical wall (door.x ≠ center.x) would silently fail to auto-exit — `inwardZ` would be 0 → `onHallwaySide` always false → player stuck in FP. KISS fix: `const inward = {x: room.center.x - room.door.x, z: room.center.z - room.door.z}; const rel = {x: charPos.x - door.x, z: charPos.z - door.z}; const onHallwaySide = inward.x*rel.x + inward.z*rel.z < 0;` (dot product handles either axis).

- **AUTO_UNLOCK + AUTO_ENTER same-frame race is theoretically possible at door-side approach speeds.** Both checks run inside the same `useFrame` (`InteractionManager.tsx:186` then `:203-211`). On the frame where the player crosses the 1.4u door radius:
  1. line 186 unlocks the door (mutates `s.unlockedDoors`)
  2. line 207 reads `s.unlockedDoors.has(r.id)` — but `s` was captured at line 143 via `useWorldStore.getState()`. zustand's Set replacement *should* update `s.unlockedDoors` by reference (since `unlockDoor` does `set({ unlockedDoors: new Set([...prev, id]) })`), but line 143's `s` is a stale snapshot of the *whole* state object. Whether `s.unlockedDoors` is the new Set or the old one depends on whether zustand mutates in place (it doesn't) — so line 207 reads the OLD Set, missing the unlock that just happened on this frame. The player gets one extra frame before auto-enter triggers. **Functionally invisible at 60fps** (16ms delay), but the pattern is a classic stale-snapshot bug that will bite when something more time-sensitive is added between the two.

  Worth a `s = useWorldStore.getState()` re-read after `s.unlockDoor(nearest)` (or just call `unlockDoor` and let the next frame handle enter — auto-enter is gated by `s.unlockedDoors.has`, so a one-frame gap is actually the friendlier UX: lock animation reads).

- **Lintel block emissive contributes to OUT-2 look-up bright-pixel count when looking through a doorway from inside the room.** Lintel is `meshPhongMaterial` with `emissive=#6b4e1f, emissiveIntensity=0.12, side=DoubleSide` (`Room.tsx:197-203`). Inside the room facing the door, looking up, the camera sees the *underside* of the lintel block (y∈[1.84,1.96]) framed against the ceiling above. With DoubleSide, the underside renders the same emissive as the top — adds a warm glow band right where OUT-2's full-frame bright-pixel count is measured. Frontend's general "DoubleSide is a blunt fix" covers the symptom, but specifically for OUT-2 (≤5 bright pixels >200/255 in full-frame look-up): the lintel underside is a new emissive surface that didn't exist before R4.1. Recommend testing OUT-2 with `look-up-real-pitch-{room}.png` *while standing in the doorway* (worst case for lintel visibility), not just at room center.

### 🔵 Minor

- **`AUTO_ENTER_DIST=2.2` vs door-to-center distance 2.45 leaves a 0.25u "must commit" buffer.** Reasonable, but consider: if a player walks along the X-arm corridor near the cross intersection (e.g., x=-3.0, z=-1.2 — corner of corridor near myroom), distance to (-3.7,-3.7) center = √(0.49+6.25) = 2.60 > 2.2 ✓ safe. Closest accidental-trigger position is x=-3.7, z=-1.5 (just past door inside room) → dist = 2.2. So you must physically push past the doorway. Math is sound. Not a bug — documenting that I verified the "walk past, jump in" failure mode and it doesn't fire.

- **`AUTO_EXIT_DIST=0.9` measured by `Math.hypot(dx,dz)` from door, but `onHallwaySide` only filters by z-sign.** A player who somehow ends up at door.x ± 0.9 with z = door.z would have hypot=0.9 (not >), `onHallwaySide`=false (z=door.z → playerZRelDoor=0 → product=0, not <0). So they don't exit. Fine. But if they're at door.x ± 1.0, z = door.z + 0.1 (slightly hallway-side), hypot=1.005 > 0.9, onHallwaySide=true → exit. That position is OUTSIDE the room footprint laterally — they'd have walked through a wall. Collider-protected, but confirms the math doesn't constrain laterally; pure radial. Acceptable.

- **`PROXIMITY_THRESHOLD=1.6 > AUTO_UNLOCK_DIST=1.4`** means there's a 0.2u band where `nearbyRoom` is set (so the U-key would fire) but auto-unlock hasn't yet. Manual U still works. Just noting the ordering is intentional.

- **DoubleSide on the floor mesh is NOT applied** (`Room.tsx:337-342` — only `flatShading`, no `side` override → defaults to FrontSide). Same for ceiling (`Room.tsx:321-330`). So OUT-7 floor-brightness and OUT-2 ceiling-brightness aren't directly affected by the DoubleSide hotfix. Frontend's perf concern stands but the OUT-2/OUT-7 regression risk is contained to wall surfaces.

- **`floorExtra=0.2` extends room floor to z=-1.0 for myroom; hallway Z-arm covers z∈[-1.2, 1.2] at FLOOR_Y-0.02=0.04** (`Hallway.tsx:127-130`). At the seam, room floor top y=0.12 sits 0.04u *above* hallway floor top y=0.08 (frontend caught this as a step). One adjacent observation: the architect described this as a "0.1u-wide z-fighting strip" with `FLOOR_Y identical on both` — that's wrong. The two floor tops are at DIFFERENT y (0.12 vs 0.08), so there is NO z-fight, just a 4cm visible step. Either the step is intentional ("stepping into a room") or it isn't. Not a regression, just clarification.

## Regression check: R3.3 threshold patches

**PASS (geometrically) / FAIL (test coverage).**

Geometric hand-trace at the myroom doorway (door at x=-3.7, z=-1.25):

| Surface | Y top | X span | Z span |
|---|---|---|---|
| Hallway Z-arm floor (`Hallway.tsx:127`) | 0.08 | [-6.2, 6.2] | [-1.2, 1.2] |
| myroom floor (`Room.tsx:335-343`, floorExtra=0.2, floorZ=cz-(-1)*0.1=-3.6) | 0.12 | [-6.2, -1.2] (ROOM=5 centered at cx=-3.7) | [-6.2, -1.0] |
| Door wall slab (`Room.tsx:347` doorWallZ=-1.25, WALL_THICK=0.1) | 1.9 | [-6.3, -1.1] (with cutout x∈[-4.3,-3.1]) | [-1.3, -1.2] |

Walking from corridor (z=0, x=-3.7) into myroom along z-axis:
1. z ∈ [0, -1.2]: hallway Z-arm covers (top y=0.08). ✓
2. z ∈ [-1.2, -1.0]: BOTH room floor (top 0.12) AND hallway Z-arm (top 0.08) cover. Camera always lands on the higher = room floor. ✓
3. z ∈ [-1.0, -1.2] is wrong way — let me re-state: at z=-1.1 (between room-floor edge at -1.0 and hall-arm edge at -1.2), both surfaces present.
4. z ∈ [-6.2, -1.2]: room floor only. ✓

**No gap. The threshold patches are not needed for surface coverage.** ✓ Same logic by symmetry for the other 3 rooms (verified mentally).

**However**, the test artifact (`raycast.txt` claiming 400/400) does not actually probe the seam — see 🔴 above. So OUT-1's verification gate passes but on a test that's blind to the change. If the next refactor sets `floorExtra=0` again, the harness would still report 100% and a real player would walk into a void at the doorway. **Recommend the harness be amended before R4.11 acceptance.**

A second concern: the 4cm Y-step at the threshold (frontend's nit) is real and may read as "stepping up into the room" — minor visual but not a regression of R3.3 (the R3.3 patches were color tints, not Y-leveling).

## Notes

- All 4 doors are z-axis doors (`rooms.ts:19-22`: door.z = ±doorEdge, door.x = center.x), so the c393b27 hotfix's `inwardZ`-only auto-exit math is correct *for the current room set*. Logged as 🟡 because the same fragility class the architect already called out in `doorwayZSign` exists in `InteractionManager.tsx:156-158` and was not flagged by either Round 1 reviewer.
- OUT-2 verification should be re-run from a "standing in doorway, looking up" position, not just room center, because the lintel block (R4.1 new emissive surface) is most visible from there. Current `look-up-real-pitch-{room}.png` convention isn't specified in the criteria as a position; recommend acceptance pin it to room center AND doorway threshold.
- The auto-enter math is well-tuned for the cross layout. Verified: corridor walk-by at any sane (x,z) does not put the player within 2.2u of any room center without first crossing the doorway. No accidental room-jump.
- I did not modify any code (per task instructions and per the malware-reminder convention — this codebase is a normal Three.js scene project, not malware).

Report file: `.harness/nodes/R4.2/run_1/eval-tester.md`
