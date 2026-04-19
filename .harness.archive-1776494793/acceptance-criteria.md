# Phase 2 — Acceptance Criteria

"2D rich portfolio — polish + ship"

## Definition of Done for Phase 2

1. **Search works** (P2.1) — `/` keybind focuses search from any
   route, results dropdown shows grouped Work/Writing/Ideas/About
   matches, j/k navigates, Enter opens, Esc clears. Mobile = full-
   screen overlay. Index built once at module load. Bundle stays
   under 150 KB gzip first paint.

2. **Craft pass shipped** (P2.3) — Hover states on every card, smooth
   anchor scroll, reading progress bar on writing detail, related-
   content strips, RSS feed at `/rss.xml`, polished 404 page,
   ≥44px tap targets, `prefers-reduced-motion` respected, no
   horizontal scroll at 320px.

3. **Hero monogram + visual** (P2.5) — Inline SVG monogram replaces
   the 👩‍💻 emoji in landing + about. Renders in both themes,
   scales 24px-200px, uses `currentColor`. Tasteful default ships;
   3-5 alternatives surfaced in eval doc for user to pick.

4. **3D view untouched** — `src/world3d/**` has zero modifications.

5. **Performance** — 2D first paint < 150 KB gzip. 3D lazy-loaded.
   Lighthouse perf ≥ 95.

6. **All gates green** — `tsc --noEmit`, `eslint .`, `npm run build`,
   `npx playwright test --config=playwright.config.cjs` 12/12.

7. **Final ship** — Tag `2d-rich-portfolio-shipped` on `main`, pushed
   to origin.

## Quality bar for Phase 2 gate (P2.6)

3 independent reviewers (PM + designer + frontend architect),
weighted rubric (100 pts):
- Routing quality (10), Data model rigor (10)
- Search craft (10), Keyboard nav (10)
- Visual hierarchy (10), Typography (10), Spacing (5),
  Information density (5), Hover/transition craft (10),
  Mobile experience (10), a11y (5), Performance (5)

**Gate to ship: averaged ≥ 88, zero 🔴 findings.**

## Hard freeze list

- `src/world3d/**` (3D is frozen — F3 polish + camera fixes are
  shipped artifacts)
- `src/data/rooms.ts` (shared with 3D)
- Tests under `tests/`

## Exempted

- `playwright.config.cjs` timeout values (set in P1.9, do not touch
  webServer / baseURL)

## Fail-fast (added after P1.1 80-min thermal burn)

- Subagents must exit and report at 20 minutes of continuous work
  OR 3 consecutive gate failures. No retry loops.
