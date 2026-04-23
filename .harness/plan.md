# Plan — Product Room Polish (loop)

## Project

Polish `src/world3d/scene/rooms/ProductRoom.tsx` in the SuriWorld 3D repo (~/Code/SuriWorld/SuriWorld) to match BookRoom-quality showcase composition. Quality tier: **delightful**. See `.harness/acceptance-criteria.md` for full DoD.

## Repo Context

- Vite + React + R3F (NOT Next.js — ignore "use client" warnings).
- Build: `cd ~/Code/SuriWorld/SuriWorld && npm run build`. Dev: `npm run dev`.
- Deploy: `vercel deploy --prod` from repo root → aliased to https://iamsuri.ai/3d.
- Visual verification: `webapp-testing` skill (Playwright-based), screenshot iamsuri.ai/3d after navigating into the Product Room (press 2 on the keyboard, or walk avatar to product door and press U then walk in).

## Sibling Reference Files

- `src/world3d/scene/rooms/BookRoom.tsx` (681 LOC) — gold standard for showcase pattern.
- `src/world3d/scene/rooms/IdeaLab.tsx` (801 LOC) — sibling tone.
- `src/world3d/scene/parts/Bookshelf.tsx` (157 LOC) — param-driven part pattern; consider `parts/ProductPlinth.tsx`.
- `src/world3d/data/rooms.ts` — Product Room is at `center: { x: half, z: -half }`, door at `{ x: half, z: -doorEdge }` (-z wall, player enters looking +z).

## Units

- PR1.1: design-pass — Read existing ProductRoom.tsx end-to-end + BookRoom.tsx for pattern reference. Write `.harness/design-note.md` (~200 words) covering: station layout for ~5 PROJECT_SHOWCASE_ENTRIES, hero focal piece concept, wall/floor/ceiling treatment, lighting plan. Do NOT touch the .tsx yet.
  - verify: `test -f .harness/design-note.md && wc -w .harness/design-note.md` shows ≥150 words; file addresses all 4 bullets.
  - eval: Concept aligns with cozy/handcrafted brand voice; no SaaS-chrome traps; layout fits inside ±2.4m of room center; respects -z door entry direction.

- PR1.2: surface-treatment — Implement architectural shell in ProductRoom.tsx: floor planks + entry rug (player-facing side), baseboards on all 4 walls, top trim/cove, ceiling recessed light panel. Preserve all existing palette constants and interactables.
  - verify: `cd ~/Code/SuriWorld/SuriWorld && npm run build` exits 0; `grep -c "userData.interactable" src/world3d/scene/rooms/ProductRoom.tsx` matches main branch count (currently 2 explicit + 1 from .map = check baseline first); `git diff main -- src/world3d/scene/rooms/ProductRoom.tsx | grep "^-.*userData.interactable" | wc -l` returns 0.
  - eval: No flat-color walls remain; floor reads as planks not single box; baseboards / trim render at correct heights; no z-fighting between floor + rug + planks (≥1cm offsets); palette tokens unchanged.

- PR1.3: review-surface — Independent review of PR1.2 by frontend-r3f and designer roles. Each writes eval-{role}.md. Findings synthesized into verdict.
  - verify: `.harness/nodes/PR1.3/run_1/eval-frontend.md` and `eval-designer.md` exist; `node "$OPC_HARNESS" synthesize .harness --node PR1.3` returns a verdict.
  - eval: Frontend role checked z-fighting + perf + collider gaps; designer role checked composition + brand voice.

- PR1.4: fix-surface — Address all 🔴 and 🟡 findings from PR1.3. If verdict was PASS, this unit is a no-op — write a 1-line skip note.
  - verify: `cd ~/Code/SuriWorld/SuriWorld && npm run build` exits 0; if PR1.3 had findings, each is referenced in the commit message or a `.harness/nodes/PR1.4/run_1/fix-log.md`.
  - eval: All 🔴 findings closed; 🟡 findings either closed or explicitly deferred with rationale.

- PR1.5: project-stations — Refactor per-project station rendering. Each PROJECT_SHOWCASE_ENTRIES entry becomes a distinct station: monitor + plinth + label sign + per-station accent light. Stations arrayed left-to-right facing -z (toward door). Optional: extract to `parts/ProductPlinth.tsx`.
  - verify: `cd ~/Code/SuriWorld/SuriWorld && npm run build` exits 0; count of `userData.interactable` assignments matches baseline; each PROJECT_SHOWCASE_ENTRIES entry still renders (`grep "PROJECT_SHOWCASE_ENTRIES.map" src/world3d/scene/rooms/ProductRoom.tsx` returns 1 result).
  - eval: Stations are visually distinct (not 5 identical clones); each has a label sign; monitors face -z (toward door); per-station accent lights present; new colliders are playerOnly.

- PR1.6: review-stations — Independent review of PR1.5 by frontend-r3f and designer.
  - verify: `.harness/nodes/PR1.6/run_1/eval-frontend.md` and `eval-designer.md` exist; synthesize returns verdict.
  - eval: Stations check OUT-2 (visually distinct); composition checks OUT-1 (foreground/midground/background depth).

- PR1.7: fix-stations — Address PR1.6 findings. No-op if PASS.
  - verify: `cd ~/Code/SuriWorld/SuriWorld && npm run build` exits 0; findings referenced in commit message or fix-log.md.
  - eval: All 🔴 closed; 🟡 closed or deferred with rationale.

- PR1.8: hero-focal — Add ONE hero focal piece on back wall (z = oz + ~2.0) or center of room. Examples: large rotating holographic logo cube, glass display case, server tower with spinning fan. Idle ROTATION animation only — no brightness/scale pulse. Gate animation on `prefers-reduced-motion`.
  - verify: `cd ~/Code/SuriWorld/SuriWorld && npm run build` exits 0; new hero piece registers a playerOnly collider (`grep -c "registerCollider" src/world3d/scene/rooms/ProductRoom.tsx` increased by ≥1); rotation gated on reduced-motion media query (mirror BookRoom globe pattern at line ~107).
  - eval: Hero is visually anchoring the back of the room; rotation speed ≤ 0.5 rad/s; no emissiveIntensity changes per frame.

- PR1.9: lighting-pass — Add layered lighting: key (top-down warm wash), fill (soft cool bounce), per-station accent lights. Total point lights ≤ 8 to avoid mobile perf cliff.
  - verify: `cd ~/Code/SuriWorld/SuriWorld && npm run build` exits 0; `grep -c "<pointLight" src/world3d/scene/rooms/ProductRoom.tsx` ≤ 8.
  - eval: Each station has at least one accent light within 1.5m; light colors match palette; no 100%-white lights.

- PR1.10: review-final — Independent final review by frontend-r3f, designer, and pm. Compares full room to acceptance criteria OUT-1..OUT-7.
  - verify: 3 eval files exist; synthesize returns verdict.
  - eval: All 7 OUT-* outcomes addressed; quality parity with BookRoom confirmed.

- PR1.11: fix-final — Address PR1.10 findings. No-op if PASS.
  - verify: `cd ~/Code/SuriWorld/SuriWorld && npm run build` exits 0.
  - eval: All 🔴 closed; 🟡 closed or deferred.

- PR1.12: deploy-and-screenshot — Run `vercel deploy --prod` from repo root. Wait for alias to update (~30s). Use `webapp-testing` skill: `python ~/.claude/skills/webapp-testing/scripts/with_server.py --help` first to learn syntax, then write a Playwright script that navigates to https://iamsuri.ai/3d, clicks past intro, presses key "2" to enter Product Room, takes a screenshot. Save to `.harness/nodes/PR1.12/run_1/screenshot-product-room-after.png`.
  - verify: `vercel deploy --prod` exits 0 with a Production URL; screenshot file exists at expected path; screenshot is non-empty (>10KB).
  - eval: Deployed room visually matches design-note.md plan; visual parity with BookRoom standard.
