# Frontend review — B1.1–B1.4

## Verdict
🔵 LGTM (with minor notes — no blockers vs. acceptance criteria)

The state machine and per-frame math are sound. `useFrame` paths use module-level scratch vectors and zero per-frame allocation. All lerps are framerate-independent (`1 - exp(-rate*delta)`). Ref/state ordering checks out: `beginRoomTransition` writes `viewTransition='entering'` synchronously via Zustand, and `PlayerController` early-returns on `viewTransition !== 'idle'`, so player position is frozen during the room tween — `CameraController` reads a stable `s.charPos` for the auto-enter snap. No room-enter race I can construct ping-pongs (auto-enter requires `crossed && insideDist >= 0.4`; auto-exit requires hallway-side `&& dist > 0.9`, with movement frozen in between).

The findings below are real but small.

## Findings

### 🟡 [medium] `mouseDraggingRef` and DEV `window.__*` refs are not reset on unmount / HMR
- File: `src/world3d/scene/MouseOrbitController.tsx:129-136`, `src/world3d/scene/cameraRefs.ts:65`, `src/world3d/scene/CameraController.tsx:174-189`
- Problem: If `MouseOrbitController` unmounts (HMR, route change) while a drag is active, the cleanup function removes the `mouseup` / `touchend` listeners but never sets `mouseDraggingRef.current = false`. The module-level singleton stays `true`, which permanently suppresses the B1.4 yaw-hint AND the existing auto-yaw-drift in `CameraController`'s follow branch (line 421 gates on `!mouseDraggingRef.current`). Same pattern: `CameraController`'s DEV `useEffect` exposes `__followCamYawRef` / `__followCamYawHintRef` / `__mouseDraggingRef` on `window` but the cleanup only nulls `window.__camera`, leaving the other three pointing at stale module instances after HMR.
- Fix: Reset `mouseDraggingRef.current = false` in the listener-cleanup function. In the DEV block, also clear the three `w.__follow*` / `w.__mouseDraggingRef` keys on cleanup.

### 🟡 [low] ESC-to-overview bypasses `beginExitTransition`
- File: `src/world3d/scene/InteractionManager.tsx:74-78`, `src/world3d/store/worldStore.ts:149-163`
- Problem: ESC calls `s.setViewMode('overview')` directly. That path sets `viewMode` and clears focus/modal, but does NOT set `viewTransition='exiting'` — `viewTransition` stays `'idle'` for the one frame before `CameraController`'s tween-restart branch detects the `viewMode` change and writes `viewTransition='exiting'` itself (line 224-226). During that single-frame window, `MouseOrbitController.overviewOrbitEnabled` returns true (gates on `viewTransition === 'idle'` and `fpActive` is still `true` so it returns false — actually safe in practice). Inconsistent with the auto-exit path which uses `beginExitTransition` cleanly. Smell, not a bug.
- Fix: Have ESC call `s.beginExitTransition()` for parity.

### 🟡 [low] Auto-unlock + auto-enter race in `InteractionManager` useFrame
- File: `src/world3d/scene/InteractionManager.tsx:149,211-213,228-243`
- Problem: `s` is captured via `useWorldStore.getState()` at line 149. The auto-unlock at 211 calls `s.unlockDoor(nearest)` which mutates the store, but the auto-enter loop at 228 reads `s.unlockedDoors` from the stale snapshot. So a door auto-unlocked on frame N can't auto-enter until frame N+1. ~16 ms latency, harmless in practice — flagging because the flow reads sequentially and a reader would expect it to fire immediately.
- Fix: After `unlockDoor`, refresh: `const s2 = useWorldStore.getState();` and use `s2.unlockedDoors` in the auto-enter loop.

### 🟡 [low] Touch multi-finger latch in `MouseOrbitController`
- File: `src/world3d/scene/MouseOrbitController.tsx:91-102`
- Problem: `onTouchStart` only sets `dragging=true` when `e.touches.length === 1`, but `onTouchEnd` clears it unconditionally. If the user lifts a second finger first while keeping a primary drag finger down, `dragging` and `mouseDraggingRef` clear, then the next single-finger move is silently ignored until they lift+retap. Mostly cosmetic — desktop tests aren't affected.
- Fix: In `onTouchEnd`, only clear when `e.touches.length === 0`.

### 🔵 [info] PlayerController `doorIsZAxis = false` branch is dead today
- File: `src/world3d/scene/PlayerController.tsx:117,131-136`
- Note: All four rooms in `src/world3d/data/rooms.ts` have `door.x === center.x` (z-axis doors), so `doorDx === 0` and the `else` branch never executes. Not a bug — defensive code for a future x-wall door. Worth a comment so a future room author doesn't assume it's tested.

### 🔵 [info] `enterReason` is not explicitly reset by `completeRoomTransition`
- File: `src/world3d/store/worldStore.ts:212-215`
- Note: After an `auto` enter completes, `enterReason` stays `'auto'` until the next `beginRoomTransition` or `setViewMode(non-overview)` overwrites it. Both paths DO overwrite it (`beginRoomTransition` defaults to `'manual'`, `setViewMode` sets `'manual'` for non-overview), so there's no stale-read bug today. But the only consumer (`CameraController.tsx:247`) is gated on `s.viewMode !== 'overview'`, so a stale `'auto'` while in `'overview'` is harmless. Considered and dismissed — no fix needed, just documenting that I checked.

### 🔵 [info] B1.3 seat-cushion mesh is interactable-only, no collider registered
- File: `src/world3d/scene/rooms/BookRoom.tsx:299-307`
- Note: The new `XU_SAN_GUAN_INTERACTABLE` carrier mesh is a JSX-only invisible box with no `registerCollider` call — it's a raycast target via `userData.interactable`, picked up by `InteractionRaycaster`. Nothing to unregister, no leak. The pre-existing furniture colliders in the `useEffect` (line 144-169) register/unregister cleanly with the right deps.

### 🔵 [info] B1.2 floor-stage cleanup is clean
- File: `src/world3d/scene/rooms/ProductRoom.tsx:194-198`
- Note: Single slab at `(ox, 0.18, oz)`, dims `3.6 × 0.02 × 3.6`, `bandTints[0]`. The `bandTints[1..2]` indices and `CYAN` stripe / `#161e2f` overlay are removed. `bandTints` still computes 3 colors via `useMemo` but only index 0 is used — minor dead computation, not worth a fix.

### 🔵 [info] Auto-enter dot-product test is correct for non-axis-aligned doors too
- File: `src/world3d/scene/InteractionManager.tsx:233-239`
- Note: `(player−door)·(center−door) > 0` plus `Math.hypot(dxDoor, dzDoor) >= 0.4` matches the OUT-1 acceptance text exactly. Hysteresis vs. `AUTO_EXIT_DIST=0.9` is comfortable.
