# Frontend Review — R3.3 Particles + Thresholds

## Verdict
ITERATE

## Findings

### 🔴 Particle clamp creates permanent pile-up at y=1.95 — Particles.tsx:119
**Issue:** `if (y > 1.95) y = 1.95;` runs *after* the recycle check `if (y > PARTICLES.ceiling /*=8*/)`. Particles rise via `vy ∈ [0.003, 0.011]`, hit the clamp, stick at y=1.95, and the recycle (`y > 8`) never triggers again. Over ~30s every particle migrates to and freezes on the y=1.95 plane. `BUF.py[i] = y` writes the clamped value back, so the trap is sticky.
**Evidence:** Logic order in useFrame; `PARTICLES.ceiling = 8` in constants.ts:160. No screenshot can prove this without a 60s-soak capture, but it's deterministic from the code.
**Fix:** Recycle when `y > 1.95` instead of clamping: change the existing reset block's threshold to `1.95` and delete the new clamp. Or: clamp + also `if (y >= 1.95) recycle()`.

### 🟡 OUT-3 "no stars in top-third" literally fails — all 4 doorway-up screenshots
**Issue:** Top-third bright(>200) counts: 817 / 922 / 364 / 383, all far above the ≤5 threshold. Implementer's defense ("finite roof; FoV sees sky past building edge — R3.1 architectural property") is geometrically plausible — the orange room ceiling does read as solid in-frame and the stars sit *above* the roof silhouette, not bleeding through it. But the acceptance criterion is unconditional and fails.
**Evidence:** `.harness/nodes/R3.3/run_1/threshold.txt` (own NOTE), doorway-up-{myroom,book,product,idealab}.png — large star band fills upper ~30% of frame.
**Fix:** Either (a) extend ceiling/roof footprint to occlude the doorway-sightline cone (cheapest: a thin occluder plane at ceiling height extending ±2u beyond the building footprint), or (b) get OUT-3 amended explicitly to exempt over-roof sky. Implementer cannot unilaterally reinterpret the criterion.

### 🔵 Threshold patch reads as a dark slate strip on orange room floor — Hallway.tsx:153
**Issue:** Patch uses `HALL_COLOR = '#1e2233'` (deep blue/slate) abutting the warm orange room floor. Visible color seam at the doorway. Brightness threshold passes (110/255), but visually it's a strip, not a "continuous floor".
**Evidence:** doorway-down-myroom.png — dark band at frame bottom under the doorway.
**Fix:** Match the adjacent room floor color per door (lookup via `rooms.ts`), or split each patch into room-half + hall-half. KISS option: use room accent.

### 🔵 Z-fight risk: none — Hallway.tsx:153
Patches at y=0.13–0.15 vs hall-floor top 0.08 / room-floor top 0.12 → ≥0.01–0.05 separation. Safe with `logarithmicDepthBuffer`. No new `useFrame` loops; 4 static meshes = negligible frame cost.
