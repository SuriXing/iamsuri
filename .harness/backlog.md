## Backlog

(empty — accumulates during F3 polish loop)

- 🟡 F3.4 designer: lab coat is front-only, invisible from default follow-cam (back view). Suri lacks a back-visible hero element. Fix at F3.21 (final-polish): wrap lab coat around the body, or add a backpack/cape, or change body base color.

- 🔴 F3.8 designer: Door anatomy still reads as "colored wall panel with seam" at game distance. Needs real visible frame/jamb, stronger inset panel shadow (≥15% value drop), bigger handle. Walls still monochrome from overview distance — per-room tints are washed out by global lighting, sconces don't cast visible light pools. F3.21 cross-cutting polish must: rebuild door frame geometry with visible jamb + handle, add larger per-room tint gradient on walls, real point-lights per sconce.

- 🔴 F3.10 designer: MyRoom still reads as blocky voxel prototype — designer wants rounded corners, MSAA antialiasing, prop density 2x, vertex AO. Mostly beyond flatShading/voxel-art style scope. F3.21 cross-cutting: enable canvas antialias in Canvas props, bump prop density where easy.

- 🟡 F3.12 designer (in-style, actionable cross-cutting for F3.21): MyRoom 58/100, arch 91/100 PASS. Designer now accepts voxel+flat as the style bible and gives 4 priority fixes with high leverage:
  1. **Clutter pass** — each room needs ~10 small voxel props (rug, 2 wall frames, mug, book stack, slippers, stuffed toy, clock, string lights, 2nd plant). Cheap cubes + colors, huge density win. Applies to MyRoom + all 3 other rooms.
  2. **Wire ≥3 idle loops per room** — twinkling stars in window (sin emissive), plant sway, lamp pulse. Sub-30 lines per room.
  3. **Two-tone lighting fake** — split wall/floor meshes into banded regions with slightly different base colors to suggest warm-pool-under-lamp + cool-rim-from-window. On-style, cheap.
  4. **Desaturate bookshelf spines** to dusty pastels (blush/sage/cream/dusty blue). One-line swap.
  All 4 are within flatShading/voxel style bible. F3.21 must action items 1-3 cross-all-rooms; item 4 is a Bookshelf parts change.

- 🟡 [F3.16] IdeaLab ambient particle layer — F3.13 spec called for sparks/dust; F3.15 skipped. Low-cost fix: 20-40 LOC of emissive cubes with mulberry-seeded positions + zero-alloc useFrame Y drift. Target F3.17 implement-ambient.
- 🟡 [F3.16] IdeaLab ELECTRIC_GREEN heading bar (L256) + circuit-board top (L330) fight the gold room accent (#fbbf24). Re-tint to gold-family (~#fbbf24 desaturated) or warm-copper to unify. Target F3.17 or F3.21.
- 🟡 [F3.16] IdeaLab pegboard-hole array literals at IdeaLab.tsx:441-442 not hoisted to module scope. Minor — hoist in F3.21 cleanup pass.
- 🟡 [F3.16] BookRoom FRAME_GLOW_AMPLITUDE=0.18 on base 0.22 = ±82% swing. Too loose vs ±5% spec guideline. Recommend BASE=0.35 AMPLITUDE=0.08. Target F3.21.

## F3.21 owed from F3.18/F3.20 (7 items — ambient spec drift)
- 🟡 Particles.tsx:24-30 — trim PARTICLE_COLORS to 3 warm/pastel hues (ship-gate lever from F3.18 Reviewer A)
- 🟡 Particles.tsx:115 — precompute sizeScale to remove ~150 divisions/frame
- 🟡 HallwayLanterns.tsx:89-92, 66-69 — add drei <Edges> on lantern body + top cap
- 🟡 HallwayLanterns.tsx:114-119 — tune 4 overlapping point lights (intensity 0.8 or distance 4.5)
- 🟡 Hallway.tsx:60-69 — add ≥2 more idle loops (plant sway, beam dust drift) to lift micro-anim 75→85+
- 🟡 Hallway.tsx:127-141 — mulberry per-beam hue jitter for material variation
- 🟡 Hallway.tsx:64 — refactor forEach closure to indexed for-loop for true zero-alloc
