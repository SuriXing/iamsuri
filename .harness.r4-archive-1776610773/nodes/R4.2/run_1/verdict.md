# R4.2 verdict — review-room-builder

## Round 1 (parallel)
- frontend: 1🔴, 3🟡, 5🔵
- architect: 0🔴, 4🟡, 4🔵

## Round 2 (serial-with-context)
- tester (saw both Round 1): 1🔴, 3🟡

## Aggregate
- 🔴 (must-fix before R4.11):
  - frontend: Room.tsx lintel z-fights with Door.tsx lintel/header/lintelTrim trio at every doorway
  - tester: raycast harness samples don't cover the doorway seam strip (cz±2.5–2.6); 100% claim is vacuous
- 🟡 (R4.11 backlog):
  - DoubleSide perf + back-face lighting (frontend)
  - Per-room ceiling material regression vs old shared-instance optimization (frontend)
  - Dead `axis === 'z'` branch in DoorwayWall (frontend)
  - Room.tsx is doing 5 jobs in 408 lines (architect)
  - `doorwayZSign`/`innerWallXSign` hard-codes cross layout instead of reading RoomDef.door (architect)
  - `floorExtra` is the threshold patch relocated (architect)
  - `room.center` no longer matches floor centroid (architect)
  - InteractionManager auto-exit hard-codes z-axis door normal — same fragility (tester)
  - Same-frame auto-unlock → auto-enter stale-snapshot race (tester)
  - Lintel underside visible in OUT-2 look-up shots from doorway (tester)
- 🔵: 9 nits across both Round 1 reviewers + tester

## R3.3 regression check (mandated by plan)
PASS geometrically (hand-trace correct). FAIL test-coverage (raycast can't see the seam).

## Verdict: ITERATE
2 🔴 require fix. Recommend doing them inside R4.11 batch (cheap, well-scoped) rather than spinning a separate fix unit. Proceeding to R4.3 (ground+skybox) which is independent of these findings.
