# Tester review — B1.1–B1.4

## Verdict
🟡 **ITERATE** — core walkthrough mechanic works, 许三观 interactable wired correctly, yaw hint clears on entry, but **OUT-2 has a visible cyan stripe regression** around the product-room floor slab and one targeted UX issue (chair focus is not reachable from natural standing positions in front of the chair without crouching/looking down).

## Probes run

### Probe driver
- `.harness-bugfix/nodes/B1.5/run_1/probes-v2.cjs` — full matrix (walk in/out × 4 rooms, interrupted, manual E, U key, yaw hint, no-yaw-for-other-rooms).
- `probes-v3.cjs` — targeted ping-pong stress + product-room top-down/FP screenshots + yaw stability.
- `probe-chair2.cjs` — chair focus reachability with controlled fpYaw/fpPitch.

### Results

1. **Walk in / walk out, all 4 rooms** (`probes-v2.cjs`):
   - myroom: entered ✓, exited ✓, flips=1, ping-pong=false ✓
   - product: entered ✓, exited ✓, flips=1, ping-pong=false ✓
   - book: entered ✓, exited ✓, flips=2, ping-pong=false ✓ (2 flips = enter+exit, gap >> 500ms)
   - idealab: entered ✓, exited ✓, flips=1, ping-pong=false ✓
   - **No FP↔overview flip within 0.5s on any straight walk.**

2. **Interrupted approach** (book threshold, 120ms tap then stop): brief nudge → pos (-3.92, 0.77), `fp=false vm=overview`. After 1.2s idle: still overview. After walk-back: still overview. **Pass.** (door at z=1.25; AUTO_ENTER_INSIDE=0.4 stops short)

3. **Diagonal approach** (45° SE toward idealab, D+S held): from (1.5, 0) → idealab entered=true within ≤4.5s in v2 sweep. (Initial v1 attempt failed because start coords were wrong — fixed in v2.) **Pass.**

4. **Manual E key** at (-3.7, 0): nearbyRoom=myroom, press E → vm=myroom fp=true. **Pass.**

5. **U key** (lock toggle): inconclusive in default test (auto-unlock at dist<1.4 races U press). Confirmed via code inspection: handler at `InteractionManager.tsx:94-101` still fires on `key === 'u'` when `s.nearbyRoom`. **Pass (by inspection).**

6. **Existing test suite** (`tests/3d-world.test.cjs`): 10 passed / 2 failed.
   - `keyboard flow` test fails at `expect(lockedBefore).toBe(false)` — char teleported to (-3.7,-1.8) is dist 0.55 from myroom door < AUTO_UNLOCK_DIST (1.4), so auto-unlock fires before U-key probe runs. **Pre-existing bug** — auto-unlock was introduced in c393b27 (R4.1 hotfix), BEFORE the bugfix loop's baseline a1513fa. Not a B1.1–B1.4 regression.
   - `no console errors during interaction` times out (uses `back-btn` element + `navigateToRoom`). Same root: this test was already broken at baseline. Not a B1.x regression.

7. **B1.4 yaw hint** (`probes-v2` Probe 7 + `probes-v3` Probe D):
   - Walking S into book: pre-entry yaw rotated 0.232 rad (auto-rotation working ✓).
   - Post-entry stability: yaw range 0.0000 rad over post-entry samples in v2; longer 2.5s sample in v3 also stable.
   - `InteractionManager.tsx:156` & `:174` clear `followCamYawHintRef.current = null` on FP-active and on no-nearby. **Pass — no fight with room tween.**
   - No-yaw-for-others (myroom approach): camY delta = 0.068 rad over 1.5s walk → well under 0.3 rad acceptance threshold and well under what'd be visible. **Pass.**

8. **B1.3 seat interactable & cushion blocking** (`probe-chair2.cjs`):
   - Standing at z=4.3 with pitch=-1.2 (looking down at cushion) → focused = `读《许三观卖血记》(余华)` ✓
   - Press E → modal opens with title `读《许三观卖血记》(余华)`, body length 99 chars (≥60 ✓), text starts "余华的长篇小说，讲述丝厂送茧工许三观靠一次次卖血撑起一家人…" ✓
   - **Cushion as collider:** registered with `playerOnly:true` (`BookRoom.tsx:165`) for chair (0.95×0.85 base block) — player physically blocked. Invisible interactable mesh (no collider) sits above the cushion at y=0.55. **Player CAN walk around it but cannot stand ON the cushion** (that's intended).

## Findings

### 🟡 [medium] Product room floor has visible blue perimeter stripe — OUT-2 regression
- **Repro:** Enter Product Room (`s.setViewMode('product')`), look at the floor from FP eye height. See `screens/B-product-fp.png` + `B-product-topdown.png`.
- **Expected:** "No offset side bands, no cyan stripe" (acceptance criteria OUT-2).
- **Actual:** Slab in `ProductRoom.tsx:196-200` is `boxGeometry args={[3.6, 0.02, 3.6]}` inside the 5×5 room. The outer ~0.7u perimeter shows the underlying room floor (`Room.tsx:335-339`, `floorColor` = muted `#3b82f6` = blue). From any FP angle there's a clear continuous blue stripe ringing the dark slab. Visually reads as exactly the "cyan stripe / offset side bands" the acceptance forbids.
- **Fix direction:** Either expand the slab to ROOM size (5×5) or change the underlying room floor for product to slate so there's no contrast. (Don't touch Room.tsx — easier to make slab cover the room.)

### 🟡 [low] B1.3 chair focus requires looking down — natural standing approach yields no focus
- **Repro:** In FP inside book room, walk to z=4.5, stand at default pitch=0 facing chair direction. Probe `probe-chair2.cjs` confirmed `focused=null` at z=4.5 p=0, z=4.3 p=0, x=-3.6 p=0. Only acquires focus at pitch ≤ -0.9 (looking sharply down at cushion) AND z ≤ 4.3.
- **Expected (OUT-3):** "Does pressing E on chair work even when standing slightly off-center?" — implies natural standing approach should focus.
- **Actual:** Cushion interactable is at y=0.55 (cushion height) with halfheight 0.1 → top at y=0.65. From standing eye height 1.6 over horizontal distance ~0.6, the camera ray must aim 60° down to hit it. Player has to deliberately look down to focus. A regular "walk up and press E" doesn't work.
- **Fix direction:** Either raise the interactable mesh to head height (y≈1.4, hyHalfHeight 0.6) so a forward-looking ray hits it, or add a separate larger trigger box that overlaps the chair's head/torso volume.

### 🟢 [info] Pre-existing test failures — NOT B1.x regressions
- `tests/3d-world.test.cjs:138` (keyboard flow) and `:208` (console errors) fail. Auto-unlock @ dist<1.4 was added in c393b27 BEFORE baseline a1513fa, so the test contract was already stale. Recommend updating the test to teleport char to (-3.7, -2.5) (dist 1.25 — wait no, that triggers nearby but is just outside auto-unlock 1.4). Actually anywhere with `1.4 < dist < 1.6` from door — so z=-2.7 (dist 1.45). One-line fix; not in this loop's scope.

### 🟢 [info] Console / pageerror clean
- Zero `pageerror` and zero `console.error` across all probe runs (Probes 1–8b + targeted v3).

## Evidence files
- `probes.txt`, `probes-v2.txt`, `probes-v3.txt` — full logs
- `screens/B-product-fp.png` — **shows blue perimeter stripe**
- `screens/B-product-topdown.png` — top-down confirming border
- `screens/walk-{room}-inside.png` — walk-in success per room
- `screens/A2-modal.png` — 许三观 modal open
- `screens/book-fp-after-entry.png` — yaw stable post-entry

---

**One-sentence verdict:** B1.1/B1.3 (modal text)/B1.4 land cleanly with no ping-pong and no console errors, but B1.2 leaves a clearly visible blue perimeter band around the product-room slab (violates "no cyan stripe") and B1.3's chair focus is unreachable from a natural standing approach — both worth iterating before accepting.
