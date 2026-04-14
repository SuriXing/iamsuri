# Phase 1 — Acceptance Criteria

"2D rich portfolio — structural foundation"

## Definition of Done for Phase 1

1. **Routing works** (P1.1 ✅ done commit cf47d57) — URLs reflect app
   state. `/`, `/work`, `/work/:slug`, `/writing`, `/writing/:slug`,
   `/ideas`, `/ideas/:slug`, `/about`, `/3d`, `/404`. Back button moves
   through history. Deep linking to any URL renders the right view.
   Refresh on deep link works. 3D stays lazy-loaded.

2. **Data model is canonical** (P1.3) — One source of truth per content
   type. `Product`, `Post`, `Idea`, `AboutSuri` types exported from
   `src/data/schema.ts`. Old parallel sources collapsed. `Post`
   supports hybrid bodies (inline + external). TypeScript strict.

3. **2D is an editorial portfolio, not a minimap** (P1.5) —
   `FloorPlan.tsx`, `RoomTile.tsx`, `World/Character.tsx`,
   `RoomView.tsx` deleted. Single-scroll landing renders hero + work +
   writing + ideas + about. Semantic HTML. Typography system. One
   accent color `#7c5cfc`. Dark + light both work.

4. **Rich detail pages** (P1.7) — `CategoryView` + config renders
   product/post/idea detail pages. Inline vs external post bodies both
   work. Ideas have tag/status filters. About has bio + photo + contact.
   Related-content strips. Replaces the 4 room detail components.

5. **Mobile responsive** — 390×844 and 320×568 usable. No horizontal
   scroll. Tap targets ≥44px.

6. **3D view untouched** — `src/world3d/` has zero modifications. F3
   polish commits pristine. `/3d` route renders existing 3D view.

7. **Performance** — 2D first paint < 100 KB gzip. 3D lazy-loaded.
   Lighthouse perf ≥ 95. Initial paint has usable content.

8. **All gates green** — `tsc --noEmit`, `eslint .`, `npm run build`,
   `npx playwright test --config=playwright.config.cjs` on every
   implement/fix commit.

## Quality bar for Phase 1 gate (P1.8)

3 independent reviewers (PM + designer + frontend architect), weighted:
- Routing quality (15), Data model rigor (15)
- Visual hierarchy (10), Typography (10), Spacing (10),
  Info density (10), Mobile (10), Interaction baseline (10)
- a11y (5), Performance (5)

**Gate to proceed to Phase 2: averaged ≥ 85, zero 🔴 findings.**

## Hard freeze list

- `src/world3d/**` (ENTIRE 3D subtree — F3 frozen)
- `src/data/rooms.ts` (shared with 3D)
- Tests under `tests/`
- `package.json` scripts (adding deps OK, don't change scripts)
- `vite.config.ts`, `tsconfig.json` (unless routing requires tweak —
  justify in commit)

## Exempted from freeze (justified case-by-case)

- `playwright.config.cjs` timeout values (60s bump from 30s accepted
  for 3D e2e reliability; don't touch anything else in this file)
