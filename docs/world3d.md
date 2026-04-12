# 3D World Architecture

The 3D world is a React Three Fiber app mounted at `/iamsuri/3d-world.html` as a Vite MPA entry. Source lives in `src/world3d/`.

## Layout

```
3d-world.html              # MPA entry HTML (project root, NOT public/)
src/world3d/
  main.tsx                 # createRoot + window test bridges
  App3D.tsx                # <Canvas> + <Hud> shell
  constants.ts             # geometry, colors, speeds, storage keys
  global.d.ts              # window.__worldStore + bridges typing
  world3d.css              # HUD styles
  data/rooms.ts            # ROOMS table (id, label, center, colors)
  store/worldStore.ts      # Zustand store (single source of truth)
  scene/                   # All Three.js / R3F components
    World.tsx              # Composes ground, rooms, character, controllers
    CameraController.tsx   # Tweens camera between overview and FP
    PlayerController.tsx   # WASD movement (overview only)
    InteractionManager.tsx # Keyboard handler + proximity detection
    Door.tsx, RoomFloor.tsx, Walls.tsx, Hallway.tsx, ...
    rooms/                 # Per-room interactables (props, books, etc.)
  hud/                     # DOM overlay (back button, modals, hints)
  hooks/                   # useKeyboard, usePointerLock
```

The HTML entry must live at the project root because files in `public/` bypass Vite's bundler and can't import TS modules.

## State machine

Two coordinated fields in `worldStore`:

- `viewMode: 'overview' | RoomId` — which scene we're in.
- `viewTransition: 'idle' | 'entering' | 'exiting'` — camera tween phase.
- `fpActive: boolean` — set to `true` when the entering tween completes (CameraController calls `completeRoomTransition`). PlayerController reads this to disable WASD inside rooms.

The transition state exists to avoid `useFrame` ordering races between CameraController (writes `fpActive` at tween end) and PlayerController (reads `fpActive` to gate movement).

Transitions are driven by `beginRoomTransition`, `completeRoomTransition`, `beginExitTransition`, plus the simpler `setViewMode` for direct jumps (used by test bridges).

## Adding a new room

1. Add a row to `ROOMS` in `src/world3d/data/rooms.ts` (id, label, center, colors). The grid auto-extends.
2. Drop a per-room scene file under `src/world3d/scene/rooms/` and render it from `World.tsx` (or wherever rooms are composed).
3. Add a label `<div id="label-<id>">` to `hud/Hud.tsx` if you want a 2D label.
4. Add an overlay `<div id="overlay-<id>">` if the room has a DOM overlay.
5. Add a number-key entry to `ROOM_NUMBER_KEYS` in `InteractionManager.tsx` if it should be hot-keyable.

## Adding a new interactable

1. In the room scene file, add a mesh and tag it with userData for the raycaster (see `InteractionRaycaster.tsx`).
2. On hover the raycaster calls `setFocusedInteractable({ title, body, link? })`.
3. Pressing E in FP mode calls `openModal` (handled in `InteractionManager.tsx`).
4. The modal renders via `hud/InteractModal.tsx` and reads `modalInteractable` from the store.

## Store shape

See `WorldState` in `store/worldStore.ts`. Key slices:
- View: `viewMode`, `viewTransition`
- Player: `charPos`, `charFacing`
- FP camera: `fpActive`, `fpYaw`, `fpPitch`
- Doors: `unlockedDoors: Set<RoomId>` (persisted to `localStorage` key `suri-3d-doors-unlocked-v2`)
- Theme: `theme: 'dark' | 'light'` (persisted)
- Interaction: `nearbyRoom`, `focusedInteractable`, `modalInteractable`

The store is exposed on `window.__worldStore` for tests/devtools (typed in `global.d.ts`).

## Tests

Playwright tests live in `tests/3d-world.test.cjs`. Two flavors:
- **Bridge-based** (most tests): use `window.navigateToRoom(id)` from `main.tsx` to jump directly into a room. Fast and stable for asserting overlay/HUD content.
- **Real-flow** (`keyboard flow: teleport → unlock → enter → exit`): teleports the character to a doorway, then exercises the actual U/E/Escape key handlers in `InteractionManager`. Validates the unlock + nav + exit code paths.

Run: `npx playwright test --config=playwright.config.cjs`

## 2D → 3D hand-off

`src/components/shared/ViewSwitcher.tsx` is a plain anchor that links to `${BASE_URL}3d-world.html`. Vite's MPA build emits both `index.html` (the 2D site) and `3d-world.html` (this app) with shared chunks where possible. No client-side router involved — it's a hard navigation.
