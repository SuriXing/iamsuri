# Plan — SuriWorld 3D Bugfix Loop (sibling to R4)

Four targeted bug-fix units + one review. User-driven scope, separate from R4 architecture refactor.

## Project Context

- Repo: `/Users/surixing/Code/SuriWorld/SuriWorld` (branch `main`)
- Stack: Vite + React + TS + react-three-fiber + drei + zustand
- Dev: `npm run dev` :5173 route `/3d`
- Build: `npm run build`; Lint: `npm run lint`
- Mandatory UI verification: webapp-testing skill, headless Playwright

## Units

- B1.1: door-walkthrough — Replace center-distance auto-enter (`InteractionManager.tsx:207`, `AUTO_ENTER_DIST=2.2` from room center) with a "crossed the doorway" test using dot product `(player − door) · (roomCenter − door) > 0` plus a 0.4u inside-distance gate. Stop the camera teleport in `CameraController.tsx:234` when entry is auto: pass an `enterReason: 'auto'|'manual'` flag through `beginRoomTransition` (or a new optional 2nd arg); when 'auto', skip `setCharPos(cx,cz)` and tween FP camera to current player position. Fix auto-exit at `InteractionManager.tsx:159` to use the door's room-normal vector (works for any axis) instead of hard-coding z. Loosen `ROOM_MARGIN` clamp at `PlayerController.tsx:107-110` along the door axis by `DOOR.width/2 + colliderRadius` so the player can physically walk back out through the doorway.
  - **Files:** `src/world3d/scene/InteractionManager.tsx`, `src/world3d/scene/CameraController.tsx`, `src/world3d/scene/PlayerController.tsx`, `src/world3d/store/worldStore.ts`
  - **Verify:** `npm run build` + `npm run lint` clean. Playwright: load `/3d`, dismiss intro, walk W toward myroom door (north), verify FP engages near doorway WITHOUT teleporting deep, walk further W, verify can keep moving inside room, walk S back through door, verify auto-exit drops to overview without ping-pong. Capture 4 screenshots: outside-door, mid-doorway, just-inside, exiting.

- B1.2: product-room-rack-and-carpet — Move server rack farther from door, replace 3-band floor with single rectangle
  - Move `rackZ` from `oz + 0.9` → `oz - 1.6` in `src/world3d/scene/rooms/ProductRoom.tsx`. Update `pr-rack` collider z to match.
  - Replace 3-band floor (base 3.8×2.6 + two 1.4×2.55 bands + cyan stripe + dark "two-tone" band overlay at lines 196-220) with a single rectangular slab `[ox, 0.18, oz]` size `3.6 × 0.02 × 3.6` in `bandTints[0]` (the existing base slate color). Drop the 2 side bands, the cyan stripe, and the F3.21 dark overlay.
  - **Files:** `src/world3d/scene/rooms/ProductRoom.tsx`
  - **Verify:** `npm run build` + `npm run lint` clean. Playwright enter Product Room, FP screenshot showing carpet is a clean rectangle, rack visible against back wall (not crowding the doorway).

- B1.3: book-room-shelves-and-couch — Swap couch+shelves so shelves are behind couch, add 许三观卖血记 interactable on seat
  - Swap couch and shelves in `src/world3d/scene/rooms/BookRoom.tsx`: chair from `chairZ = oz + 0.9` → `oz - 0.5` (facing -z so the back is on +z side); shelves from `oz - 1.5` → `oz + 1.5` (behind the couch). Update all child positions: blanket, cushion, side table, lamp, open book, tea cup, glasses, stacked books, frame above chair, blog interactable plane, and all furniture colliders (`br-chair`, `br-table`, `br-shelf-l`, `br-shelf-r`, `br-ladder`).
  - Add a new interactable: invisible interaction box on the seat cushion at `(chairX, 0.55, chairZ + 0.02)` size `~0.7×0.2×0.6`, with `userData.interactable = { title: '读《许三观卖血记》(余华)', body: '一本关于一个小人物用血换生存的小说...' (a real 2-3 sentence summary), link?: undefined }`. Use existing `InteractableData` shape.
  - Add the interactable definition to `src/data/bookRoom.ts` (or define inline if cleaner) — match existing pattern of `BLOG_INTERACTABLE`.
  - **Files:** `src/world3d/scene/rooms/BookRoom.tsx`, possibly `src/data/bookRoom.ts`
  - **Verify:** `npm run build` + `npm run lint` clean. Playwright enter Book Room, screenshot showing shelves behind chair from FP angle, walk to chair, look at seat, screenshot focused interactable showing prompt, press E, screenshot opened modal with "许三观卖血记" content.

- B1.4: follow-cam-yaw-hint — Follow camera swings toward book/idealab on approach
  - Add a "yaw hint" mechanism: in `InteractionManager.tsx` useFrame, when `nearbyRoom === 'book' || 'idealab'` (and player is in overview/follow mode), compute target yaw = `atan2(roomCenter.x − charPos.x, roomCenter.z − charPos.z)` (3D cam look-direction convention) and publish via a new module-level ref `followCamYawHintRef` (in `src/world3d/scene/cameraRefs.ts`).
  - In `CameraController.tsx` follow-mode block, when `followCamYawHintRef.current !== null`, lerp `followCamYawRef.current` toward it gently (e.g. factor 0.02/frame) rather than the existing autoYawDrift. Clear the hint ref on `nearbyRoom = null`.
  - Don't fight active mouse drag — only apply when the user isn't currently dragging (check `MouseOrbitController` exposes a "isDragging" ref or fall back to gating on no recent input via timestamp).
  - **Files:** `src/world3d/scene/InteractionManager.tsx`, `src/world3d/scene/CameraController.tsx`, `src/world3d/scene/cameraRefs.ts`
  - **Verify:** `npm run build` + `npm run lint` clean. Playwright: walk character toward book room, screenshot shows camera has swung to face book room before player reaches the door. Same for idealab. Walking toward myroom or product MUST NOT auto-rotate the camera (only book/idealab per user request).

- B1.5: independent-review — Independent code review across B1-B4. Roles: frontend (R3F state machine correctness, ref vs setState ordering, lerp tuning), tester (interaction matrix: walk in/out, multiple rooms, interrupted approach, FP exit ping-pong probe). Round 2: a11y/UX persona checks discoverability — does the player understand they're being "auto-driven"?
  - **Verify:** 2-3 eval files in `.harness-bugfix/nodes/B-review/run_1/`; verdict synthesized; any 🔴 cycles back to the relevant Bx unit.

## Outright Off-Limits

- Don't touch R4 harness (`.harness/`). This is a sibling loop.
- Don't push to remote.
- Don't break the existing intro sequence (intro/* is off-limits).
- Don't break existing E (manual press to enter/exit) or U (unlock/lock) keybindings — they're complementary, not replaced.
