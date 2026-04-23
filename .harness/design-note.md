# Product Room — Design Note (PR1.1)

Coords use `ox = center.x`, `oz = center.z`. Room is 5m, stay inside `ox±2.4`, `oz±2.4`. Door on **-z** wall, player enters looking **+z**, so back wall = `oz+2.4` and stations face **-z** (toward player on entry).

## Station Layout — 4 entries from PROJECT_SHOWCASE_ENTRIES

Arrayed left→right along the back wall (+z), ~1.0m spacing, each station = monitor on plinth + label panel + one decorative item. All screens face **-z**. Player walking in sees a row of glowing screens flanking the hero.

| # | id              | x          | z         | facing | accent  | deco prop                |
|---|-----------------|------------|-----------|--------|---------|--------------------------|
| 1 | problem-solver  | ox-1.65    | oz+1.55   | -z     | #22d3ee | coffee mug (white+brown) |
| 2 | mentor-table    | ox-0.55    | oz+1.55   | -z     | #22c55e | sticky-note stack        |
| 3 | debate-coach    | ox+0.55    | oz+1.55   | -z     | #facc15 | small trophy box (gold)  |
| 4 | study-stack     | ox+1.65    | oz+1.55   | -z     | #fb7185 | mini book stack          |

Per station: plinth `0.7w x 0.85h x 0.55d` slate (SLATE_MID base, SLATE_LIGHT trim band at top), monitor `0.85w x 0.55h x 0.06d` bezel SLATE_DEEP at y=1.45 with cyan screen face at z = stationZ - 0.04, label plate `0.7w x 0.12h` SLATE_LIGHT under monitor with accent-color brand bar, deco prop on plinth top. Move existing `m.userData.interactable` assignment from old back-wall card onto each station screen mesh. Register playerOnly collider per plinth (`hx 0.4, hz 0.3`).

PROBLEM_SOLVER + MENTOR_TABLE dialogues remain on stations 1 & 2 screens (same dialogue payload as old desk monitors — collapse the two redundant desk monitors into the station row).

## Hero Focal Piece

**Glass display case with rotating logo cube** — center-back, away from stations.
- Position: `(ox, 0.0 base, oz+2.05)` — sits between stations 2 & 3 against back wall recess.
- Pedestal: `0.55w x 0.6h x 0.55d` slate plinth (SLATE_DEEP) with brushed-metal cap (METAL_LIGHT) at y=0.6.
- Glass case: 4 thin transparent box walls + top, `0.45 x 0.6 x 0.45`, opacity 0.18, color WHITE_COOL, no edges.
- Logo cube inside: `0.22 x 0.22 x 0.22`, color CYAN, faceted (flatShading), positioned at y=0.95.
- Idle animation: **rotation only** on Y axis, ~0.4 rad/s. Gate via `prefers-reduced-motion` (mirror BookRoom globe). Reuse existing `useFrame` block — add one `cubeRef.current.rotation.y = t * 0.4`. No bob, no emissive change.

## Surface Treatment

**Floor:** Replace single slab with plank pattern.
- 8 planks running along x-axis: each `0.6w x 0.04h x 5d`, alternating `bandTints[0]` / `bandTints[1]` / `bandTints[2]`, y=0.18, x positions `ox + (i-3.5)*0.6`.
- Entry rug at door (-z side): `2.0w x 0.005h x 1.2d` at `(ox, 0.205, oz-1.6)`, color SLATE_LIGHT with CYAN_DIM border strip (4 thin boxes inset 0.04m).

**Walls:** Add baseboards on all 4 walls — thin boxes `5.0 x 0.12 x 0.05` along inside face at y=0.25, color SLATE_DEEP (darker than wall). Add top cove trim at y=2.85, same shape, color METAL.

**Ceiling:** Recessed light cove panel — `3.0w x 0.04h x 3.0d` at y=2.92 centered on `(ox, _, oz)`, color SLATE_DEEP with `0.05` inset white-cool inner panel emissive 0.4 (static, no pulse).

## Lighting Plan (≤8 point lights)

| role           | pos                          | color   | intensity | distance |
|----------------|------------------------------|---------|-----------|----------|
| key (ceiling)  | (ox, 2.7, oz)                | #e6ecf2 | 0.8       | 9        |
| fill (entry)   | (ox, 2.4, oz-1.5)            | #60a5fa | 0.4       | 7        |
| hero accent    | (ox, 1.5, oz+1.7)            | #22d3ee | 0.7       | 5        |
| station 1 acc  | (ox-1.65, 2.0, oz+1.0)       | #22d3ee | 0.35      | 3.5      |
| station 2 acc  | (ox-0.55, 2.0, oz+1.0)       | #22c55e | 0.35      | 3.5      |
| station 3 acc  | (ox+0.55, 2.0, oz+1.0)       | #facc15 | 0.35      | 3.5      |
| station 4 acc  | (ox+1.65, 2.0, oz+1.0)       | #fb7185 | 0.35      | 3.5      |

7 lights, under cap. Static intensities (no pulses).

## Compatibility Note

Current interactables: `PROBLEM_SOLVER` and `MENTOR_TABLE` (on the two desk monitors), plus 4 showcase-card hitboxes on the back wall. New layout **collapses both** into the 4-station row — stations 1 & 2 screens carry PROBLEM_SOLVER/MENTOR_TABLE dialogues (same payload), stations 3 & 4 carry debate-coach/study-stack from `PROJECT_SHOWCASE_ENTRIES`. Old desk + dual monitors + back-wall cards are removed. Every existing `m.userData.interactable = ...` assignment is relocated, not deleted; modal triggers preserved. Three `playerOnly` colliders (desk/rack/crate) replaced with 4 station plinth + 1 hero pedestal colliders.
