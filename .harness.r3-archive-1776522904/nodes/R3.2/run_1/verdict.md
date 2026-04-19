# R3.2 Verdict — ITERATE

Two independent reviewers (frontend + designer) both verdict ITERATE. Findings deferred to R3.7 fix-and-accept per plan.

## 🔴 Blocking findings (must fix in R3.7)

1. **Look-up test methodology invalid** (frontend + designer)
   `/tmp/sw-verify-ceiling.py` mouse drag from y=400→80 is only ~320px, doesn't deliver a true straight-up pitch. The `look-up-myroom-dark.png` screenshot shows the camera at ~45° pitch — upper half of frame is open StarField, lower half is ceiling. The 200×200 center-crop brightness 68.94 lands on the ceiling-floor transition, not on a ceiling-only sample. **OUT-1 verification is unproven, not passed.**
   Fix: rewrite verify script to use PointerLockControls or direct camera.rotation.x manipulation to achieve true +π/2 pitch, then re-screenshot.

2. **OUT-2 floor brightness band exceeded** (frontend)
   81.10 vs baseline 64.19 = +26.3%, well outside ±10%. Implementer labeled "intentional" but the spec is the spec.
   Fix: reduce under-ceiling fill light intensity from 0.25 → ~0.10, or remove entirely and rely on the existing y=4 lights.

3. **Light-theme ceiling washes into background** (designer)
   `#e8dcb8` @ brightness 225 vs LIGHT_BG `#f0ede6` — passes the ≥180 number but visually disappears, breaking "reads as architecture."
   Fix: pick a deeper warm tone (e.g. `#c9b48a` or `#b89968`) for light theme that still hits ≥180 but contrasts the bg.

4. **Single ceiling color clashes with non-myroom rooms** (designer)
   `#8b5e2e` warm brown reads fine in myroom (pink accent) but fights productroom blue, bookroom green, idealab gold.
   Fix: use a neutral warm gray (e.g. `#6b5b4a` dark / `#cfc4b0` light) instead of saturated wood.

## 🟡 Should-fix findings

5. **`renderOrder=-1` redundant + comment misleading** (frontend) — opaque already draws before transparent in three.js. Either remove the prop or update the comment to reflect actual reasoning (depth-write occluding additive points).
6. **Wall/ceiling z-fight at y≈1.96** (frontend) — wall top-cap clips into ceiling box bottom by ~3cm. Lower wall top to 1.94 or raise CEILING_Y to 2.05.
7. **6 inline material instances** (frontend) — hoist to one `useMemo`'d material shared across all 6 ceiling meshes.

## 🔵 Notes
- Geometry coverage at doorways is fine: ROOM_SIDE=5.2 + HALL_WIDTH=2.4 = 0.1m overlap, no gaps.
- Mid-tween screenshot looks correct — depth occlusion does work when the camera is actually inside the room.
- Dark-theme wood color works well for myroom specifically.

## Decision
ITERATE → defer all findings to R3.7. Continue loop to R3.3 (particles + thresholds, independent of ceiling).
