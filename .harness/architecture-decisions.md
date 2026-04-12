# Locked Architecture Decisions (from F2.4 review)

These decisions are binding for all subsequent ticks.

1. **Routing**: Vite MPA — `./3d-world.html` (project root, not `public/` — files in `public/` bypass the bundler and can't be HTML entry points) is a thin HTML shell that imports `src/world3d/main.tsx`. The legacy pre-refactor file at `public/3d-world-legacy.html` is unrelated and stays put. Single dev server, single build. No react-router needed.

2. **Test seam**: Zustand store must expose itself on `window.__worldStore` in dev/test mode so Playwright can drive state without prop drilling.

3. **Camera tween**: Manual lerp inside `useFrame`. No new dependencies. No drei CameraControls.

4. **YAGNI cut**: Drop "bone tagging" from F2.9 — character just needs walk-swing animation like the current HTML.

## Target directory layout

```
src/
  world3d/
    main.tsx                  # entry for the 3D route
    App3D.tsx                 # top-level layout (Canvas + HUD)
    constants.ts              # ROOM, GAP, palette, speeds
    store/
      worldStore.ts           # zustand store (+ window.__worldStore)
    data/
      rooms.ts                # typed room definitions
      interactables.ts        # interactable content
    scene/
      World.tsx               # scene root
      Hallway.tsx
      StarField.tsx
      Particles.tsx
      HallwayLanterns.tsx
      Character.tsx
      FirstPersonCamera.tsx
      OrbitCamera.tsx
      Door.tsx
      Wall.tsx
      RoomFloor.tsx
      rooms/
        MyRoom.tsx
        ProductRoom.tsx
        BookRoom.tsx
        IdeaLab.tsx
    hud/
      EnterPrompt.tsx
      ExitHint.tsx
      BackButton.tsx
      Crosshair.tsx
      InteractTooltip.tsx
      InteractModal.tsx
      IntroHint.tsx
      ThemeToggle.tsx
      ViewSwitcher.tsx
    hooks/
      useKeyboard.ts
      useProximity.ts
      usePointerLock.ts
```
