# Acceptance Criteria — 3D World Production Refactor

## Tech Stack Decision (locked)
- **React 19 + TypeScript** (already in project)
- **@react-three/fiber** for React-based Three.js
- **@react-three/drei** for helpers (PointerLockControls, raycasting, text)
- **Zustand** for global state (rooms, doors, player, camera mode)
- **Vite** (existing build tool)
- **Single dev server, single build, single deployable**

Rationale: React Three Fiber makes 3D scenes composable, testable, and type-safe. Zustand avoids prop drilling for cross-cutting game state. All existing tooling (Vite, TS, Playwright, ESLint) continues to work.

## Definition of Done

1. The pre-refactor monolithic HTML is gone or reduced to a stub. The 3D world is implemented in TypeScript React components under `src/world3d/` and mounted via Vite as an MPA entry at `./3d-world.html` (project root, served at `/iamsuri/3d-world.html`). Note: the entry HTML lives at the project root, not under `public/` — files in `public/` bypass Vite's bundler. The legacy pre-refactor copy at `public/3d-world-legacy.html` is separate and stays as a reference.
2. Scene graph is decomposed into typed components: `<World>`, `<Hallway>`, `<Room id>`, `<Door>`, `<Character>`, `<FirstPersonCamera>`, `<Interactable>`, per-room content (`<MyRoom>`, `<ProductRoom>`, etc.).
3. Global state lives in a Zustand store at `src/store/worldStore.ts` with typed slices: `viewMode` ('overview' | roomId), `fp` (yaw, pitch, active), `doors` (locked/unlocked), `charPos`.
4. Room config is data-driven: `src/data/rooms3d.ts` exports an array of room definitions (id, label, center, color, interactables). Adding a room = adding an entry.
5. All 11 existing Playwright tests still pass against the new implementation (URL may change to `/iamsuri/3d-world` instead of `.html`).
6. `npm run build` succeeds with zero TypeScript errors and zero ESLint errors.
7. `npm run lint` passes clean (no new violations).
8. Bundle split works: the 3D route lazy-loads so the 2D home page is unaffected (or stays under 150 KB initial JS).
9. The 2D→3D switcher in `src/App.tsx` navigates to the React-based 3D route instead of the HTML file.
10. Code review by independent reviewers confirms:
    - Clear component boundaries with single responsibilities
    - No `any` types
    - No inline magic numbers (constants extracted)
    - Accessibility: keyboard interaction docs, alt text where applicable
    - Performance: R3F best practices (useFrame not setInterval, no geometry allocation in render loop)

## How to Verify

- `npm run build` → passes
- `npm run lint` → passes
- `npx playwright test --config=playwright.config.cjs` → all 11 pass (test URLs updated to new route)
- Visual: all existing features still work — door unlock, walk-to-enter, first-person inside rooms, interactables, exit, theme toggle, character movement, 2D/3D switcher
- Bundle: `dist/assets/*.js` — the 3D chunk is separated from the main chunk

## Out of Scope (v2+)
- Adding new rooms or content
- Changing visual design
- Adding assets/textures (still programmatic geometry)
- Multiplayer
- Saving progress beyond localStorage
