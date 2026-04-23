# PR1.3 — Designer Review of PR1.2 (Architectural Shell)

## Scope

Reviewing the architectural shell only — floor planks, entry rug, baseboards, top trim, ceiling cove, and overall palette/zoning that PR1.3 station + hero work will sit on top of. Performance, collider, and TS hygiene deferred to the frontend reviewer. Reference: `BookRoom.tsx` as the cozy gold-standard, `design-note.md` as the contract.

The desk + dual monitors + server rack + crates + back-wall showcase cards (lines 292–597) are scheduled for removal/refactor in PR1.3 and are NOT part of this review's pass/fail. Where they affect shell composition I flag it as 🔵.

## Findings

### 🔴 Must-fix

- **`ProductRoom.tsx:131-142` — floor plank tonal range collapses.** `bandTints` jitters HSL.lightness by ±0.06 around a single base (`SLATE_DEEP #1e293b`). All 3 tiers land within ~5% lightness of each other and ~0% hue separation, so the plank pattern reads as a flat dark surface from FP camera distance. Compare BookRoom `:197-202` which alternates two clearly distinct constants (`WOOD_MID #6b3a1e` vs `WOOD_LIGHT #9c5a30` — ~25% lightness gap) over a `WOOD_DEEP` base. **OUT-5 fails for the floor surface (only 1 perceptual tier, not 3).** Fix: pick 3 explicit named tones in the slate ramp (e.g. `#1e293b / #334155 / #475569`) and alternate, drop the RNG.

- **`ProductRoom.tsx:218-234` — entry rug border is neon, not handcrafted.** Four `CYAN_DIM` strips with `emissive={CYAN_DIM} emissiveIntensity={0.6}` ring the rug. Reads as LED light strip / SaaS dashboard accent, not a textile border. BookRoom rug border (`:215-223`) uses non-emissive `AMBER` with a thin 4cm stripe — reads as woven trim. **OUT-6 fails at the threshold the player sees first.** Fix: drop the emissive on the rug border (keep color), OR use a warm slate (e.g. `SLATE_LIGHT`) trim with no glow. Save emissive cyan for screens / hero.

### 🟡 Should-fix

- **`ProductRoom.tsx:280-290` — ceiling cove inner panel reads as office fluorescent.** Single 2.9×2.9 `WHITE_COOL` emissive 0.4 panel inside a `SLATE_DEEP` frame is the cheapest possible drop-ceiling light. BookRoom has no equivalent (no ceiling work) so this is the room's weakest "handmade" surface. Fix: subdivide into a 2×2 or 3×3 grid of smaller recessed panels with thin slate dividers — reads as architectural coffer instead of office tile. Same poly cost class.

- **`ProductRoom.tsx:258-278` — top trim is undifferentiated `METAL`.** Same `0.12 × 0.05` cross-section as the baseboard, just a different color, all 4 walls identical. No architectural articulation (no cove return, no shadow gap, no inlay). For a "war room" it works but for "cozy/handcrafted" it leans SaaS. Fix: add a thin warmer underline strip (e.g. a 0.02 tall `CYAN_DIM` line below the metal band, OR a wood-tone inlay) — gives the trim two materials the way BookRoom shelves layer plank + edge.

- **`ProductRoom.tsx:236-256` — baseboards lack value separation from wall.** Baseboard is `SLATE_DEEP`. The wall (rendered by `RoomFrame` upstream — not in this file) is presumed mid-slate, so contrast may be fine, but I can't verify from this PR alone; in the screenshot pass this needs to be checked. If the wall is also dark slate, baseboards disappear. Fix or confirm: ensure ≥20% lightness delta between wall and baseboard.

- **Back-wall (+z) zone for upcoming stations + hero is empty AND unframed.** OUT-1 wants the player to walk in and see foreground (rug ✅) → midground (stations, TBD) → background (hero, TBD). The shell does nothing to *invite* the eye toward +z: no cove light directional bias, no back-wall recess niche, no floor accent strip leading the eye. BookRoom anchors its hero (chair + lamp + framed picture) in clear depth layers because the shelves visually frame it. Fix in PR1.3: when laying out stations, add a subtle floor inlay strip at oz+1.55 (the station row line) or a back-wall recess panel to pre-frame the hero.

### 🔵 FYI

- **`ProductRoom.tsx:531-597` — front-wall (-z) card cluster + showcase shelf will conflict with the door sightline.** Player enters from -z looking +z; these cards sit at `wallZ = oz - 2.42` (the door wall, *behind* the player). They're invisible at entry, then face the player when they turn around to leave. Per design-note these are collapsed into the station row in PR1.3 — confirm they get removed, otherwise the back wall stays empty AND the front wall has unread content.

- **`ProductRoom.tsx:197-200` — base floor slab `SLATE_DEEP` underneath jittered planks.** With the plank fix above, the 3-tier ramp + 1 base = 4 tiers, comfortably clearing OUT-5 for floor. Keep the slab; it gives the planks a darker grout-line read at edges.

- **Palette overall is on-brand cool tech.** Slate/cyan + white-cool reads cohesive. The handcrafted gap is *texture/articulation*, not hue choice. Don't warm the palette — fix the surface treatment.

- **No hero focal piece exists yet (rotating logo cube in glass case per design-note).** Confirmed out of scope for PR1.2 shell; flagged so PR1.3 owner doesn't forget OUT-3.

- **Reduced-motion gate** for the upcoming hero rotation must mirror `BookRoom:108-135` `useFrame` pattern with `prefers-reduced-motion: reduce` check (currently absent from PR1.2 since no rotation exists yet).

## Verdict

**ITERATE** — the shell has all the required *parts* (planks, rug, baseboards, trim, cove) but the floor planks collapse to one tonal tier and the rug border + ceiling panel push the room toward SaaS-chrome instead of cozy/handcrafted; fix those three and the shell is ready for PR1.3 station + hero work.
