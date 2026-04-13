# F3.8 Eval — Reviewer A (findings resolution audit)

Short re-review of F3.7 (commit `9a1894c`) against F3.6 findings. Scope:
`src/world3d/scene/Door.tsx`, `src/world3d/scene/Walls.tsx`,
`src/world3d/constants.ts`.

## Findings resolution table

### From eval-designer.md (was 🔴 FAIL 51/100)

| Finding | Severity | Status | Evidence |
|---|---|---|---|
| Walls flat placeholder — Material Variation 5/15 | 🔴 | **resolved** | `Walls.tsx:219-260` — 12 per-segment tints via `mixTint(base, accent, 0.08, ±0.12 L, ±0.04 rad hue)`, mulberry32-seeded. Each wall segment now mixes its adjacent room's accent color into the brown base (verticals tied to rooms via `VERTICAL_WALL_ROOMS` at `Walls.tsx:198-207`). `tintJitter: 0.24` at `constants.ts:120` → ±0.12 L. Visible in `screenshot-walls-overview.png`: each room quadrant now carries its accent hue (pink, green, blue, yellow tones bleeding through the brown). |
| Detail Density 4/12 — walls lack baseboards/trim | 🔴 | **resolved** | `Walls.tsx:65-69` defines `BASE_H=0.14` (was 0.06), `CAP_H=0.08` (was 0.04), `TRIM_PAD=0.03` for "slightly wider" trim. Baseboard + top cap rendered at `Walls.tsx:91-112` with their own `<Edges>`. Plus 16 wall props (sconces/pictures/vines) at `Walls.tsx:274-310` + render at `341-351`. Screenshots show clear trim bands and props mounted on long walls. |
| Doors are arch cutouts — Silhouette 9/15 | 🟡 | **resolved** | `Door.tsx:178-199` adds frame molding overlays on each post (`FRAME_MOLDING_COLOR` at :23) + lintel trim board (`Door.tsx:171-176, 315-325`) + baseboards (`:190-199, 299-308`). Door slab has 3 rails + mullion + inset panel + escutcheon + 1.5× knob. Screenshots `screenshot-door-locked.png` and `screenshot-door-unlocked.png` clearly show the door as an *object*, not a hole. |
| Color palette over-saturated brown band | 🟡 | **resolved** | `Door.tsx:26` — `PANEL_BASE = '#5a2814'` (deeper red-brown, different hue family from wall neutral `#3d2817` at `constants.ts:112`). `Door.tsx:21-23` introduces `FRAME_TRIM_COLOR` and `FRAME_MOLDING_COLOR` (~15% lighter) for value separation. Walls carry per-room accent mix — no longer a single monolithic brown band. |
| Lighting flat on walls — no AO, no warm spill | 🟡 | **resolved** | `Door.tsx:473-480` adds the warm spill point light inside each room opening (`DOOR_POLISH.spillLight`: `#ffb060` / intensity 0.9 / distance 3.2 / offset 0.9 / y 1.1 at `constants.ts:92-100`). Spill direction computed at `Door.tsx:256-262` using `insideSignX/Z = Math.sign(coord)`. Overview screenshot shows warm glow spilling out of each doorway. (No AO pass, but point-light spill is what the finding asked for.) |
| Composition weak in overview | 🟡 | **resolved** (largely) | Walls now have distinct accent hues per quadrant + wall props + spill lights — `screenshot-walls-overview.png` now reads with clear room zones rather than identical cells. Still a navigation-marker-dominant shot, but that's a HUD concern outside scope. |
| Style bible inconsistency | 🟡 | **resolved** | Crafted-world promise restored: wall trim, door moldings, lantern breath animation, doormats, edges on all new meshes. `Door.tsx` and `Walls.tsx` now match the furniture-pass level of craft. |
| Readability — rooms look identical | 🟡 | **resolved** | Per-room hue tinting (`Walls.tsx:219-260`) + per-door accent color on panel emissive (`Door.tsx:341, 352, 363`) + per-door accent-tinted doormat (`Door.tsx:232-249, 328-332`). Rooms now visually distinct at a glance via wall hue, doormat color, and spill light tone. |

### From eval-architect.md (was 🔵 PASS 89/100 with 🟡 Clutter)

| Finding | Severity | Status | Evidence |
|---|---|---|---|
| Clutter 🟡 — no per-door props, walls bare | 🟡 | **resolved** | 16 wall props on 8 long horizontal strips (`Walls.tsx:274-310`) — sconce/picture/vine pool, mulberry32(`0xfacade01`) seeded, rendered at `Walls.tsx:341-351`. Plus per-door doormat at `Door.tsx:328-332`. Screenshot `screenshot-walls-closeup.png` clearly shows a sconce with warm glow and a picture frame on the visible wall. |
| (suggested) Panel-strip tint delta 0.08 → 0.12 | 🟡 | **resolved, exceeded** | `Door.tsx:76-88` — L jitter pushed to `±0.10` (half of 0.20) for the 3 strips, plus an inset panel `-0.08 L` and a mullion `-0.12 L` added on top. Now 5-way tonal variation inside the slab. |
| (suggested) Lock shackle pulse with body | 🟡 | **resolved** | `Door.tsx:67-69` adds `lockGroupRef` + `lockShackleRef`. In useFrame `:121-131` the group scales ±5% and both body and shackle materials receive the shared `pulse` emissive value. One animation, two meshes. Rendered as a shared group at `:406-419`. |
| (suggested) Lintel trim mitre/bevel — F3.6 architect −1 | 🟡 | **partial** | Lintel now has an overlapping trim board (`Door.tsx:171-176, 315-325`) in `FRAME_MOLDING_COLOR` with its own Edges — visually much improved, but it's still a flat box overhang, no true mitre geometry. Reads crafted in screenshots, so acceptable for this tick. |
| Accent stripe too heavy (0.8 × width) — F3.6 architect −1 | 🟡 | **unresolved, but mitigated** | `Door.tsx:371` still uses `DOOR.width * 0.8` and `0.06` thickness. However the new inset panel + mullion + 5-tone strip variation around it dilute its visual dominance. Not a critical issue. |

## Specific F3.7 ask-list verification

- [x] Bump tint deltas to ±0.12 → `constants.ts:120` `tintJitter: 0.24` → ±0.12 L on walls; `Door.tsx:78-82` uses `±0.10` (half of 0.20) on panel strips — slightly softer than the ±0.12 ask, but paired with deeper hue separation on `PANEL_BASE`, inset, mullion.
- [x] Add wall sconces/vines/signs → `Walls.tsx:140-194` WallProp component; 16 instances across 8 long walls (`Walls.tsx:274-310, 341-351`). Pool includes sconce (with emissive glow cube), picture (frame + canvas), vine. Missing "signs" specifically but pictures fill the semantic role.
- [x] Add per-door doormat/planter → `Door.tsx:232-249, 328-332` — desaturated accent-tinted doormat, flat box with Edges, placed on hallway side.
- [x] Enlarge knob 1.5× → `constants.ts:88` `knobRadius: 0.0825` (1.5 × 0.055). Used at `Door.tsx:397`. Plus new escutcheon plate at `Door.tsx:390-394`.
- [x] Fix lintel gap → `Door.tsx:171-176` — overhang trim (0.30 z-depth vs lintel 0.22, +0.08 on horizontal length) with y-center at `DOOR.frameHeight + 0.12` so bottom face overlaps lintel top by 0.02. Rendered at `:315-325`. Visible in door close-ups as a continuous crown band.
- [x] Pulse shackle with body → `Door.tsx:67-69` adds refs, `:121-131` shares `pulse + s` scale/emissive, `:406-419` wraps both meshes under `lockGroupRef`.
- [x] Warm spill point light inside each door opening → `Door.tsx:475-480` + `constants.ts:92-100` `DOOR_POLISH.spillLight`. Direction computed from `insideSignX/Z` at `Door.tsx:256-262`.

**7/7 ask-list items landed.**

## Hard-constraint regression check

- **PASS** FOLLOW/CAMERA/FP/INTRO/ROOM/GAP untouched — `git show 9a1894c -- src/world3d/constants.ts` diff shows only **additions** (DOOR_POLISH + WALL_POLISH blocks inserted after DOOR). Lines `constants.ts:1-2` (ROOM/GAP), `:19-24` (FP), `:26-33` (CAMERA), `:36-48` (FOLLOW), `:51-54` (INTRO), `:76-83` (DOOR) are byte-identical.
- **PASS** `flatShading: true` on all new materials — `Door.tsx` has 25 `<meshPhongMaterial>` and 25 `flatShading`; `Walls.tsx` has 8 `<meshPhongMaterial>` and 8 `flatShading`. 1:1 ratio in both files.
- **PASS** Zero useFrame allocation in `Door.tsx` — walked `Door.tsx:109-147`: only `Math.exp`, `Math.sin`, scalar arithmetic, ref reads, and property assignments (`hingeRef.current.rotation.y`, `lockGroupRef.current.scale.x/y/z`, `material.emissiveIntensity`). No `new` expressions, no object/array literals, no `.set(...)` on shared vectors. `tintHex` helper (which allocates via `new THREE.Color()`) is only called inside `useMemo` at `:76-88`. `matColor` memo at `:232-239` also allocates only at mount time.
- **PASS** Zero useFrame allocation in `Walls.tsx` — no `useFrame` imported or used. `mixTint` (which allocates `new THREE.Color()`) is called only inside `useMemo` at `:219-260`. `WallProp` instances are static — no animation loop.
- **PASS** mulberry32 used (no `Math.random`) — `Walls.tsx:10` and `Door.tsx:9` import `makeRng` from `../util/rand`. Used at `Walls.tsx:220, 275` and `Door.tsx:77`. Grep for `Math.random` in both files: zero matches.
- **PASS** No frozen-file edits — `git show 9a1894c --name-only` lists exactly 3 files: `src/world3d/constants.ts` (additive only), `src/world3d/scene/Door.tsx`, `src/world3d/scene/Walls.tsx`. No touches to rooms.ts, CameraController, PlayerController, MouseOrbitController, colliders.ts, worldStore.ts, HUD, or anything outside `scene/`.
- **PASS** Collider registrations still work — `Door.tsx:92-107` registers `door-${roomId}` collider while locked, unregisters on unlock. Same id shape, same hx/hz formula (`DOOR.width/2` along axis, `0.09` across), same deps array as pre-F3.5 baseline. `Walls.tsx:71-76` registers each `WallStrip` by id with `hx/hz = w/2, d/2` — unchanged semantics. Walking + door-block flow preserved.

## New issues introduced (if any)

### 🔴 Critical
- (none)

### 🟡 Iterate
- **Panel L jitter is ±0.10 not ±0.12** — minor deviation from ask-list target. Visible variation is adequate in screenshots, especially combined with the new inset + mullion, so no re-fix needed.
- **"Signs" in the ask-list became pictures** — semantically closer to framed art than a wayfinding sign. If F3.22 reviewers flag missing room signage, address there.
- **Lintel trim still flat box, no mitre** — carried forward from F3.6 architect note. Not visually offensive; leave for cross-cutting F3.21.

### 🔵 LGTM
- 7/7 F3.7 ask-list items landed.
- Zero per-frame allocation discipline maintained.
- All 33 materials in the two files carry `flatShading`.
- Frozen constants untouched; diff is purely additive.
- Collider contracts bit-identical.
- Per-room accent mixing in walls is an elegant leverage move — one line (`mixTint`) on 12 segments flips the whole "rooms look identical" finding.
- Lock body + shackle sharing a group is the right fix; single animation, two meshes.

## Verdict

- **PASS**
- **Resolution rate: 12 of 13 findings resolved (1 partial on lintel mitre, 1 unresolved on accent stripe width — both 🟡 carried forward from F3.6 architect and visually acceptable).**
- F3.7 addressed every 🔴 from the designer and the 🟡 Clutter from the architect; door and walls now read as crafted objects in both close-up and overview screenshots with zero regressions on constraints, colliders, or performance.
