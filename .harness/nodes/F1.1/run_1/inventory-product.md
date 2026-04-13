# ProductRoom 3D Inventory

Source: `src/world3d/scene/rooms/ProductRoom.tsx`, `src/world3d/data/rooms.ts`

## Identity
- Room id: `product`
- Label: `Product Room`
- Color (room base): `#3b82f6`
- Accent color: `#60a5fa`

## Palette (hard-coded in tsx)
- Stage base: `#1e293b`, emissive `#3b82f6`
- Screen stand body: `#cccccc`
- Screen bezel: `#222222`
- Screen material: `#112211`, emissive `#22c55e`
- Live dot: `#22c55e`
- Table top: `#334155`
- Table legs: `#555555`
- Product cube colors: `['#e94560', '#ffd700', '#22c55e']`
- Stage glow light: `#3b82f6`

## Labels / headings
None as 3D text meshes. All visible strings via interactables.

## Interactables

### 1. Left screen — Problem Solver (`PROBLEM_SOLVER`)
- title: `Problem Solver`
- body: `Drop your worry in, get help thinking it through.`
- link: `https://problem-solver.vercel.app`

### 2. Right screen — Mentor Table (`MENTOR_TABLE`)
- title: `Mentor Table`
- body: `Chat with great minds — practice thinking with AI versions of historical figures.`
- link: `https://mentor-table.vercel.app`

## Content blocks / objects in room
- Stage platform (wide, slightly glowing blue).
- Two vertical pillars, each with an animated green screen (blinking live dot).
- Product showcase table with 3 glowing cubes (red / gold / green).
- Stage glow point light (blue).

## Hard-coded content currently embedded in TSX
- Two dialogue blocks (title + body + link) for the two screens.
- Product cube color triple.
- Stage accent color `#3b82f6`.

## Related: `src/world3d/hud/RoomOverlays.tsx` (OUT OF SCOPE for F1.1)
Holds the hidden DOM overlay with richer product-card content: `Problem Solver — Drop your worry in — https://problem-solver.vercel.app` and `Mentor Table — Chat with great minds — https://mentor-table.vercel.app`, each tagged `LIVE`. F1.5 (2D ProductRoom) may want to reconcile these with `src/data/products.ts` + this module.

## Extraction decisions
- `src/data/products.ts` already has both products (`problem-solver`, `mentor-table`) but the URLs DIFFER from the 3D file:
  - data/products.ts: `https://surixing.github.io/ProblemSolver/` vs 3D `https://problem-solver.vercel.app`
  - data/products.ts: `https://surixing.github.io/MentorTable/` vs 3D `https://mentor-table.vercel.app`
  - Data/products.ts descriptions also differ slightly from 3D body text.
- **Decision:** Do NOT change `src/data/products.ts` — that file is already consumed by 2D path and modifying URLs/descriptions is out of scope for F1.1 (content choice question for F1.5+).
- Instead, add a small `dialogues` map on a new module `src/data/productRoom.ts` that mirrors the exact strings the 3D interactables use today. The 3D file imports from this new module, keeping 3D output byte-identical. F1.5 onwards can reconcile `products.ts` vs `productRoom.ts` during the 2D implementation.
- Product cube color triple moved into the same module as `SHOWCASE_CUBE_COLORS`.
