# Tester Review — R3.3 Threshold/Particles Coverage

## Verdict
ITERATE

## Per-Room Findings

### myroom — DOWN: ✓  UP: ✗
DOWN: continuous brown floor, no void, threshold seam not visible (L=110). UP: orange ceiling intact directly overhead; stars visible past ceiling's far-edge horizon (817 bright px). Defense plausible — finite ceiling, not bleed-through.

### productroom — DOWN: ✓  UP: ✗
DOWN: blue/dark floor uniform (L=118), no Ground void. Threshold patch reads as the dark central rectangle — color mismatch vs surrounding blue, **visible seam**. UP: orange ceiling band intact overhead; 922 bright px above ceiling edge — same finite-extent issue.

### bookroom — DOWN: ✓ (with seam)  UP: ✗
DOWN: red/orange floor, L=88. Threshold patch is a **clearly darker band** crossing the doorway — color discontinuity. UP: ceiling solid overhead, stars only beyond hallway lintel (364 px).

### idealab — DOWN: ✓ (with seam)  UP: ✗
DOWN: orange floor, L=93. Threshold patch shows a **light cream/white horizontal stripe** — strong color mismatch with surrounding floor. UP: ceiling intact, stars past edge (383 px).

## Cross-Cutting Findings

### 🔴 OUT-3 UP criterion fails as written (4/4 rooms)
Top-third bright count 364–922 ≫ 5 threshold. Implementer's defense (finite ceiling + shallow pitch sees over building edge) is **visually confirmed** — ceiling directly overhead is intact in every room. Root cause is R3.1 architecture: room ceiling ends at the wall, hallway ceiling doesn't extend over the doorway threshold. Either extend hallway ceiling to overlap room ceiling at doorways, or amend OUT-3 to sample only the immediate-overhead 200×200 crop (matching OUT-1's method).

### 🟡 Threshold patch color mismatch (book, idealab, product)
DOWN passes the brightness floor, but threshold patches are visibly distinct from room floor color — looks like a patch, not continuous flooring. Match patch material/color per-room (or sample room floor color). myroom is the only room where the seam is invisible; use it as reference.

### 🔵 myroom DOWN
Lower-center shows a small geometric artifact (looks like a dropped sprite/particle cluster). Not a void, but worth a glance — possibly a Particles `py` not yet clamped, or a stray interactable.

