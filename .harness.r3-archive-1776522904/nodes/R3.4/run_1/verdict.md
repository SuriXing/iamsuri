# R3.4 Verdict — ITERATE

Both reviewers (frontend + tester) ITERATE. Findings deferred to R3.7.

## 🔴 Blocking

1. **Particle clamp causes permanent pile-up at ceiling** (frontend, `Particles.tsx`)
   `if (y > 1.95) y = 1.95` runs AFTER the `y > 8` recycle check — once a particle hits 1.95 it sticks there forever. Within ~30s every dust mote is frozen at the ceiling plane.
   Fix: recycle when `y > 1.95` instead of clamping. e.g. respawn at original spawn floor with new random x/z.

2. **Threshold patch color seam visible** (tester, 3/4 rooms; frontend nit)
   Patches use `HALL_COLOR` (slate) against the warm orange room floors → reads as a dark strip across each doorway in productroom, bookroom, idealab. myroom happens to align (its accent is dark too).
   Fix: tint each patch with the average of `roomFloor.color` and `HALL_COLOR`, or use the room's floor color directly so the seam is invisible from the room side.

## 🟡 Should-fix

3. **OUT-3 top-third star count literally fails** (frontend + tester both flag, both agree implementer's defense is geometrically true)
   All 4 rooms: 364–922 bright pixels in top third (criterion ≤5). Implementer's defense — "stars visible past finite ceiling extent, not through ceiling" — is visually correct. But the spec is the spec.
   Two paths to PASS: (a) amend OUT-3's UP check to a 200×200 overhead crop mirroring OUT-1, OR (b) extend hallway ceiling to overlap room ceiling at thresholds for full enclosure feel.
   **Recommendation: option (a) — amend criterion in R3.7.** Option (b) requires infinite ceiling dome which is out-of-scope per acceptance-criteria.

## 🔵 Notes

- Z-fighting: no risk (≥0.01u separation, log depth buffer enabled).
- No extra useFrame loops added.
- DOWN brightness passes cleanly in all 4 rooms.

## Decision
ITERATE → defer all to R3.7. Continue to R3.5 (crosshair).
