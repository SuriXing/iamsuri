# Acceptance Criteria — Product Room Polish

## Outcomes

- OUT-1: Player walks in through the -z door looking +z and sees a deliberately composed scene with foreground (entry threshold), midground (project stations), background (hero focal piece). No bare floor, no flat walls.
- OUT-2: Every entry in `PROJECT_SHOWCASE_ENTRIES` (~5 projects) has its own visually distinct station with monitor + plinth + label. Stations are arrayed left-to-right or in a curve so the player sees them in sequence.
- OUT-3: At least one hero focal piece (back wall or center) with idle ROTATION animation. No emissiveIntensity pulse. No scale pulse.
- OUT-4: Floor has plank/tile pattern + entry rug. Walls have baseboards and a top trim/cove. Ceiling has a recessed light cove panel. Zero bare-color flat boxes for any architectural surface.
- OUT-5: Cool tech palette (slate/steel/cyan) preserved with at least 3 distinct value tiers per surface. Layered lighting: key + fill + per-station accent.
- OUT-6: Visual quality parity with `BookRoom.tsx` — cozy hand-built voxel/low-poly aesthetic, not SaaS chrome.
- OUT-7: All existing `m.userData.interactable = ...` assignments still trigger their modals. Avatar can not pass through any monitor, plinth, or hero piece (playerOnly colliders registered).

## Verification

- VER-1 (verifies OUT-1, OUT-4, OUT-5, OUT-6): After `vercel deploy --prod`, take FP screenshot of Product Room at iamsuri.ai/3d via `webapp-testing` skill and compare side-by-side with BookRoom.tsx screenshot. Composition has 3 depth layers; surfaces are not flat color; palette has ≥3 value tiers; aesthetic matches BookRoom hand-built voxel style.
- VER-2 (verifies OUT-2): Visually confirm each of the ~5 PROJECT_SHOWCASE_ENTRIES entries renders as a distinct station (different position, label visible, no two stations identical) in the screenshot.
- VER-3 (verifies OUT-3): Capture two screenshots ~3s apart; the hero focal piece's rotation has visibly changed between frames; no brightness/scale changes (compare pixel histograms).
- VER-4 (verifies OUT-7): Manually test E-press near each interactable mesh in the deployed build — modal opens for PROBLEM_SOLVER, MENTOR_TABLE, and every PROJECT_SHOWCASE_ENTRIES entry. Walk avatar around all 4 walls — no clipping through monitors, plinths, or hero piece.
- VER-5 (verifies all OUT-*): `npm run build` exits 0 with no new TS errors. Console clean — no THREE.js warnings, no React key warnings, no R3F prop-spread warnings.

## Quality Constraints

- Performance: total mesh count ≤ +30% vs current ProductRoom.tsx baseline. Zero per-frame allocations in useFrame (no `new Color()` / `new Vector3()`).
- Reduced-motion: rotation animations gated via `prefers-reduced-motion: reduce` (mirror BookRoom globe pattern).
- Theme parity: `useWorldStore(s => s.theme)` already wired — preserve light/dark `edgeColor` derivation.
- Bundle size: do not add new heavy deps. Reuse `parts/Bookshelf.tsx` style if creating a new `parts/ProductPlinth.tsx`.
- Depth precision: avoid co-planar meshes <1cm apart with no offset (z-fighting at distance).

## Out of Scope

- BookRoom.tsx, IdeaLab.tsx, MyRoom.tsx — do not touch.
- The corridor / Overworld scene — do not touch.
- The door / EnterPrompt3D / InteractionManager logic — do not touch.
- `data/productRoom.ts` content (titles, dialogues) — do not modify content; only how it's presented.
- Adding new external 3D assets, textures, GLTF imports — stick to procedural primitives (boxGeometry, sphereGeometry, cylinderGeometry, torusGeometry).
- Pulsing emissive or scale animations on any element (forbidden by zero-brightness-motion rule).

## Quality Baseline (delightful)

- Idle animation: hero focal rotates slowly (gated on prefers-reduced-motion).
- Micro-interaction: every station screen reads as "alive" via position-bob scanline only.
- Layered lighting: at least 3 point lights (key + fill + accent).
- Hand-crafted detail: each station gets at least one decorative element (cable coil, sticky note, mug, keyboard) per BookRoom precedent.
