# F3.12 MyRoom — Architect Re-Review

Commit under review: `35dab4d fix(3d): F3.11 MyRoom — micro-anim + proportion + z-fight fixes`
File: `src/world3d/scene/rooms/MyRoom.tsx` (HEAD, 375 lines)
Screenshot: `.harness/nodes/F3.11/run_1/screenshot-myroom-fixed.png`

## F3.10 Findings Resolved?

- **Micro-anim count: 4** (was 1, target ≥4) — 🔵
  - `DeskLamp` pulse (pre-existing, via `pulse` prop at `MyRoom.tsx:288`)
  - Monitor scanline sweep via `scanlineRef` (`MyRoom.tsx:102–108, 253–256`)
  - Plant leaf breathing via `plantLeavesRef` (`MyRoom.tsx:110–114, 273–276`)
  - Pink accent `pointLight` breathing via `accentLightRef` (`MyRoom.tsx:116–119, 366–372`)
- **Monitor size: 🔵** — Frame bumped `1.0×0.65 → 1.2×0.72` (`MyRoom.tsx:227`), screen `1.02×0.58` (line 238). Inline comment at line 225 confirms intent. Reads as a proper chibi monitor now, not a laptop lid.
- **Rug z-fight: 🔵** — Rug top surface at `y = 0.075 + 0.03/2 = 0.090` (line 310); inner-border strips at `y = 0.095` (lines 316, 320, 324, 328). `0.005` gap — well past any mobile GPU depth epsilon. Fixed.
- **Curtain clip: 🔵** — Rod at `z = oz − 1.89` (line 348), panels at `z = oz − 1.88` (lines 353, 359), back wall at `oz − 2.0`. `0.12` clearance with `0.04`-depth panels (extent `−1.86` to `−1.90`) — zero back-wall intersection. Comment at line 347 documents the fix.
- **Picture y: 🔵** — Frame raised from `y = 1.7` to `y = 1.85` (line 335), inner pink at `y = 1.85` (line 341). Shelf top plank sits at `~y = 1.45`, so `0.4m` vertical breathing room now. Comment at line 334 documents intent. Decrowded.
- **Monitor+curtain Edges: 🔵** — `<Edges>` added to monitor frame (line 229, lineWidth 1.2), monitor screen (line 240), left curtain panel (line 356), right curtain panel (line 362). All 4 F3.10 omissions closed.

**All 6 F3.10 findings fully resolved.**

## 4 Gates

🔵 PASS
- `npx tsc -b` — clean.
- `npm run lint` — clean (zero eslint output).
- `npm run build` — vite build succeeded in 239ms, 647 modules transformed, `App3D-CCJapoc9.js 977.14 kB / gzip 258.53 kB`.
- `npx playwright test --config=playwright.config.cjs` — **12 passed** in 2.3m, zero failures.

**Per-frame alloc audit on new useFrame** — `MyRoom.tsx:102–120` is textbook zero-alloc:
- Single closure captures `{ clock }` destructure — no `new THREE.X()`, no `{}`, no `[]`.
- All constants (`SCANLINE_BASE_Y`, `SCANLINE_SWEEP_AMPLITUDE`, `SCANLINE_SWEEP_SPEED`, `PLANT_BREATH_AMPLITUDE`, `PLANT_BREATH_SPEED`, `ACCENT_LIGHT_BASE`, `ACCENT_LIGHT_AMPLITUDE`, `ACCENT_LIGHT_SPEED`) hoisted to module scope (lines 48–59) with an explicit `"module-scope = zero per-frame alloc"` comment.
- Mutations: `scan.position.y = …`, `leaves.scale.setScalar(s)`, `al.intensity = …`. All scalar writes to existing refs.
- Null-guards (`if (scan)`, `if (leaves)`, `if (al)`) prevent runtime errors without allocation branches.
- Mirrors the DeskLamp pattern 1:1 as promised in the F3.10 recommendation.

## Material Variation (15)

🔵 **13/15** — Unchanged from F3.10. Palette still spans 4 pinks + 2 woods + 2 whites + gold + monitor dark-navy + terracotta + leaf green + deterministic pillow tint pool. F3.11 didn't touch the palette. Same ceiling: pink family dominates, so variety-count is high but hue-family contrast is narrow. Non-blocking.

## Edge / Silhouette Pop (15)

🔵 **14/15** — Up from 13. Monitor frame + screen + both curtain panels now have `<Edges>`, closing the biggest F3.10 gap. Inventory of `<Edges>` instances in MyRoom: bed base, mattress, sheet-fold (1.2), both pillows, headboard, desk top (1.2), drawer face (1.2), monitor frame (1.2, **NEW**), monitor screen (**NEW**), rug slab, picture frame, left curtain (**NEW**), right curtain (**NEW**) + bookshelf hero books via `heroBookCount={3}`. Total ~17. Soft silhouettes remaining are all small props (notebook, pen, plant pot/leaves, drawer handle, clothes stack, curtain rod, desk legs) — correct to leave uncut; outlining those would add noise without silhouette benefit. Losing 1 only because the clothes stack reads flat against the mattress from some angles.

## Proportions (15)

🔵 **13/15** — Up from 11. Monitor `1.2×0.72` on a `1.4m` desk is now ~86% desk width — reads as a proper CRT-ish chibi monitor, no longer a laptop lid. Screen face `1.02×0.58` sits correctly inside the frame with a ~9cm bezel. Picture raised to `y = 1.85` resolves the shelf-top crowding (0.4m gap above top plank at ~1.45). Losing 2: (a) scanline `boxGeometry(0.95, 0.02, 0.01)` is slightly narrower than the `1.02` screen face — fine as intentional inset. (b) Chair still absent — a desk with monitor+notebook+pen reads as "workspace you stand at." F3.12+ territory, not a regression.

## Micro-animations (15)

🔵 **14/15** — Up from 9. Target was ≥13, delivered 14. Four animated elements:
1. **DeskLamp pulse** (pre-existing) — head emissive + point-light intensity at `sin(t * 1.6) * 0.05`.
2. **Monitor scanline sweep** — `position.y = 1.25 + sin(t * 2.0) * 0.25`. Amplitude `0.25` fits within the `0.58 / 2 = 0.29` screen half-height — comment at line 52 explicitly checks this. Visible sweep across the hero desk element.
3. **Plant leaf breathing** — `scale.setScalar(1 + sin(t * 0.8) * 0.03)`. 3% pulse at 0.8 Hz, subtle but perceptible on the green sphere.
4. **Pink accent light breathing** — `intensity = 0.3 + sin(t * 0.6) * 0.03`. Slowest frequency, smallest relative amplitude (10% of base), ambient "room exhale" without drawing attention.

Frequency separation is good: 0.6 / 0.8 / 1.6 / 2.0 Hz — none phase-locked, so the room never feels mechanical. All four animations share one `useFrame` subscriber (`MyRoom.tsx:102`). Losing 1 only because curtains remain rigid — a ±0.5° `rotation.z` oscillation would complete the set.

## Color Harmony (10)

🔵 **9/10** — Unchanged from F3.10. Pink-dominant, gold-continuous (drawer handle, pen, curtain rod), `EDGE_COLOR = '#0a0a14'` unifies without fighting warm tones. Monitor pink emissive + lamp warm + pink accent light layer into consistent warm glow. Plant green is still the only cool spike, scoped tight. No changes here in F3.11.

## Clutter/Props (10)

🔵 **9/10** — Unchanged from F3.10. Dense: clothes stack, notebook + pen, potted plant, drawer handle, monitor + stand + base + scanline, dual pillows, sheet fold, picture, curtains, bordered rug, hero books. Still missing slippers/mug/headboard object — F3.12+ territory.

## Refinement (10)

🔵 **9/10** — Up from 7. Both F3.10-flagged refinement bugs fixed:
- Rug z-fight eliminated (`0.005` gap).
- Curtain back-wall clip eliminated (`0.12` clearance).
- Picture decrowded from shelf top (`0.4m` vertical gap).

Positive refinement from F3.10 preserved: rug inner-border strips, two-chunk tapered legs, drawer trim board, drawer handle sphere, pillow rotation offsets, clothes stack asymmetry, deterministic pillow tint seeding. Losing 1: notebook pink and pen gold still cluster on the desk — not a bug, just a missed contrast opportunity.

## Performance (10)

🔵 **10/10** — MyRoom now has one `useFrame` subscriber (`MyRoom.tsx:102`) alongside the existing `DeskLamp` subscriber — two per-frame hot paths total, both zero-alloc. Combined work per frame: ~4 `Math.sin` calls, ~4 scalar writes, 3 null-guards. Effectively free. Mesh count ~55. Two distance-capped point lights (lamp `distance: 6`, accent `distance: 3`). `pillowTints` memoized with `[]` dep. No regressions.

## Score Breakdown

| Dimension | F3.10 | F3.12 | Δ |
|---|---|---|---|
| Material Variation (15) | 13 | 13 | 0 |
| Edge / Silhouette Pop (15) | 13 | 14 | +1 |
| Proportions (15) | 11 | 13 | +2 |
| Micro-animations (15) | 9 | 14 | +5 |
| Color Harmony (10) | 9 | 9 | 0 |
| Clutter/Props (10) | 9 | 9 | 0 |
| Refinement (10) | 7 | 9 | +2 |
| Performance (10) | 10 | 10 | 0 |
| **Total** | **81** | **91** | **+10** |

## Total: 91/100
## Verdict: 🔵 PASS (91 ≥ 85)

F3.11 landed every F3.10 recommendation cleanly. Micro-animations jumped 9 → 14 (exceeded the 13+ target), all four visual bugs (monitor size, rug z-fight, curtain clip, picture crowding) resolved, and the 4 missing `<Edges>` are in place. Zero per-frame allocations in the new useFrame hot path — comment at `MyRoom.tsx:48` makes the intent explicit, implementation honors it. All 4 code-quality gates clean: tsc/lint/build/playwright 12/12.

## Remaining gaps (non-blocking, for F3.12+ polish)

1. **Curtain motion (micro-anim 14 → 15)** — `rotation.z` oscillation (±0.5° at ~0.4 Hz) on both panels. Mirrors existing ref + scalar-write pattern exactly.
2. **Material variation 13 → 14** — Introduce one non-pink, non-wood hue: blue book spine accent, teal mug, lavender throw on bed foot. Pure palette work.
3. **Desk chair (proportions 13 → 14)** — Low-poly chair would make the workspace read coherently from all angles. Pure prop addition.
4. **Refinement 9 → 10** — Shift pen from `GOLD` to a cool metal (`#c0c0c0`) or deep pink to contrast the notebook. One-line fix.
