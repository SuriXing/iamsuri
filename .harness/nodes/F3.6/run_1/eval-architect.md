# F3.6 Door+Walls Review — Architect

## Code-Quality Audit
- Collider regs unchanged: 🔵 — `Door.tsx:76-91` and `Walls.tsx:63-66` are byte-identical to `b016ac6` (pre-F3.5). Same `colliderId`, same conditional, same `hx/hz` formula, same deps array. No collision semantics drifted.
- flatShading discipline: 🔵 — All 18 `<meshPhongMaterial>` in `Door.tsx` carry `flatShading`; all 3 in `Walls.tsx` (body + baseboard + cap) carry `flatShading`. Zero smooth-shaded surfaces.
- Per-frame allocations: 🔵 — `Door.tsx:93-104` useFrame contains only `Math.exp`, `Math.sin`, ref writes, and an emissiveIntensity assignment. The `tintHex` helper (which allocates `new THREE.Color()`) is called exclusively inside `useMemo` at `Door.tsx:64-72` and `Walls.tsx:113-120`. No per-frame GC pressure.
- Frozen DOOR/ROOM constants: 🔵 — `constants.ts:76-83` DOOR block untouched (width 1.2, height 1.75, frameHeight 1.9, openAngle −0.55π, hingeLerp 0.12). ROOM/GAP untouched at `constants.ts:1-2`.
- Hinge logic: 🔵 — Same `hingeRef` group, same `angleRef`, same framerate-independent factor `1 − exp(−hingeLerp × 60 × delta)`. Panel simply re-partitioned into 3 strips under the same hinge group; transform stack identical.
- Theme reads outside useFrame: 🔵 — `useWorldStore((s) => s.theme)` at `Door.tsx:57` and `Walls.tsx:106`, both at component top. No store reads inside any useFrame. `edgeColor` derived once per render.

**Must-check result: 6/6 PASS.** Implementation is surgically clean — zero regressions, zero footguns introduced.

## Material Variation (15)
🔵 Score: 14/15
Door now has 4 distinct browns (frame `#6b4e1f`, trim `#3a2410`, 3 panel strips each seeded from `hashRoomId(roomId)` with ±0.04 HSL L jitter) + accent stripe + warm knob. Walls has 12 per-strip tints (±0.03 L jitter) + darker baseboard + lighter cap — clear three-tone hierarchy. The myroom screenshot shows the wall top cap catching light distinctly from the body. −1 because the panel-strip tint delta (0.08) is still subtle in the screenshot; could push to 0.12 without breaking cohesion.

## Edge / Silhouette Pop (15)
🔵 Score: 13/15
`<Edges>` with theme-aware `edgeColor` on frame posts, lintel, all 3 panel strips, escutcheon, lock body, and every wall body. Count audit: 8 per door × 4 + 12 wall bodies = 44 (matches spec). Light-theme lines `#5a4830` keep the warm palette coherent. −2 because the lintel trim board and baseboards skip edges — intentional trim hierarchy, but the silhouette read on them is softer than the main frame.

## Proportions (15)
🔵 Score: 14/15
Rail/field split uses `RAIL_H = 0.22` top+bottom with middle field = `height − 0.44 ≈ 1.31` — classic door proportion (≈1:6 rail-to-field), reads correctly in screenshot. Lintel trim at 0.04 thick + 0.02 overhang is restrained and correct. Knob placement at `x * 0.85` + escutcheon plate 0.14 × 0.22 + 0.055 sphere is well-scaled. −1 because the accent stripe at `DOOR.width * 0.8` width is slightly heavy against the 0.06 thickness — borderline dominant.

## Micro-animations (15)
🔵 Score: 14/15
Lock pulse tightened from `2.0 ± 0.8` (F3.4) to `2.5 ± 0.125` — much more refined, no longer strobes. Hinge lerp unchanged (good — framerate-independent stays correct). −1 because only the lock body pulses; the shackle above it stays static, creating a mild "only half alive" read. Trivial to extend.

## Color Harmony (10)
🔵 Score: 9/10
Warm brown family is tight: `#3d2817`, `#2a1a0d`, `#55361f`, `#6b4e1f`, `#4a2c0a`, `#3a2410` — all within the same hue band, just L variations. Accent colors come in through the per-door `accentColor` emissive (green/yellow/pink/blue) which keeps them off the palette but tied through low intensity (0.12–0.15). Knob color also theme-aware (`#c0b070` dark / `#998060` light). −1 for the lock red `#ff2244` — necessary for gameplay signaling but still the loudest note.

## Clutter/Props (10)
🟡 Score: 6/10
This dimension intentionally stayed bare — F3.6 is door+walls polish, not prop population. Door has lantern + lock + check + chain + cap (5 props per door, unchanged from F3.4). Walls have no attached props (no sconces, no signage, no vines). Screenshots show empty wall faces dominating the mid-range view. Acceptable for this node's scope but flagging since the rubric dimension exists.

## Refinement (10)
🔵 Score: 9/10
Fine details land: escutcheon plate flush-mounted behind proud knob sphere, 3-strip woodgrain with deterministic seed (won't flicker on re-mount), baseboard + lintel trim add architectural grammar, wall baseboard/cap trio. `hashRoomId` + `makeRng` is clean determinism. −1 because the lintel trim has no mitre/bevel — it's a flat overhang box.

## Performance (10)
🔵 Score: 10/10
useFrame body is 6 lines, pure math + ref writes. `tintHex` is memoized. All materials are `MeshPhongMaterial` + `flatShading` (cheap). Per-door mesh count went up ~6 (3 strips instead of 1 panel, baseboards, trim, knob escutcheon) but still under budget. Edges count 44 is negligible. Zero allocations per frame. No signs of GPU or GC pressure.

## Total: 89/100
## Verdict: 🔵 PASS (≥85)

## Top 3 fixes for F3.7
1. **Populate walls** — attach 4–6 low-poly sconces/signs/vines so the mid-range view in `screenshot-walls-overview.png` has something to catch on between doors. Biggest leverage on the score gap (Clutter dimension is the only 🟡).
2. **Push panel-strip tint delta from 0.08 → 0.12** and widen the accent stripe jitter so the 3-strip woodgrain reads more clearly at arm's length. Currently too subtle unless you stand right at the door.
3. **Pulse the lock shackle with the body** (share the same `lockRef` material or parent group) so the "danger" micro-animation reads as one object, not half-alive. One-line fix.
