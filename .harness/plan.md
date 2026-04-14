# 2D Rich Portfolio — Phase 1: Structural

Task: Rebuild 2D view as a rich editorial portfolio. Phase 1 delivers the
structural foundation (routing, data model, editorial skeleton, content
pages). Phase 2 (search, craft polish, hero art) runs after user review.

**Hard scope: 2D ONLY.** Do not touch `src/world3d/` or its constants.
The 3D view is a shipped, polished artifact (commits `f70f73b` and
earlier) and stays as-is — accessible via `/3d` route but never modified.

**Principle:** 2D stops being a minimap of 3D. Every unit additively
enriches user-facing features while subtractively deleting 3D-mirror
scaffolding (FloorPlan, RoomTile, Character ghost, RoomView wrapper).

**Current status:** P1.1 already committed as `cf47d57`. Loop resumes
at P1.2 (review-routing).

## Phase 1 units (8 total)

- P1.1: implement-routing — ✅ DONE (commit cf47d57)
  Added react-router-dom@7.14.1, 10-route URL schema, replaced useState
  view flag with BrowserRouter + Routes, lazy-loaded 3D at /3d, created
  Placeholder.tsx + NotFound.tsx.

- P1.2: review-routing — 2 fresh subagents (frontend architect + a11y
  reviewer). Verify URL schema, back button, keyboard focus on route
  change, bundle split (3D lazy-loaded still), SPA fallback works on
  production build, deep-link refresh works.
  - verify: 2 eval files
  - eval: routing is production-quality, no a11y regressions,
    `playwright.config.cjs` timeout bump from 30s→60s is acceptable

- P1.3: implement-data-model — Consolidate parallel data sources. Define
  canonical types in `src/data/schema.ts`: `Product`, `Post`, `Idea`,
  `AboutSuri`. Each needs slug, title, excerpt, body, tags, date, cover,
  status. `Post` supports hybrid bodies — `kind: 'inline' | 'external'`,
  with `body: string` for inline and `href: string` for external.
  Migrate content from `src/data/products.ts`, `productRoom.ts`,
  `ideas.ts`, `ideaLab.ts`, `bookRoom.ts`, inline `BookRoom.tsx` posts.
  Scaffold missing fields with realistic placeholders (lorem for
  bodies, real titles). Keep `src/world3d/data/rooms.ts` untouched —
  it's shared room metadata.
  - verify: all gates; new `src/data/schema.ts` + migrated content files
  - eval: one canonical source per content type; all existing callers
    updated to canonical types; no duplicate data; 3D view still loads

- P1.4: review-data-model — 2 fresh subagents (frontend architect +
  content/schema reviewer). Verify type rigor, no `any`, all existing
  callers migrated, 3D view still reads its content correctly.
  - verify: 2 eval files
  - eval: data model is production-quality, types are strict, 3D not
    broken

- P1.5: implement-2d-skeleton — Delete 2D-as-3D-minimap scaffolding:
  `src/components/World/FloorPlan.tsx`, `RoomTile.tsx`,
  `World/Character.tsx`, `Rooms/RoomView.tsx`. Create new single-scroll
  editorial landing at `src/components/pages/Landing.tsx`: hero section
  → work (featured products) → writing (recent posts) → ideas (featured
  ideas) → about (bio + photo slot) → footer. Real typography system
  via CSS vars: one display serif (Fraunces or similar via @fontsource),
  one body sans, one mono. Font scale 1.25. One accent color `#7c5cfc`.
  Dark/light theme via CSS vars, driven by existing ThemeToggle.
  Semantic HTML5 (`<main>`, `<article>`, `<section>`, `<nav>`,
  `<footer>`). No polish/micro-interactions yet — structure only.
  Mobile-responsive from the start (≥320px).
  - verify: all gates; screenshots of dark landing, light landing,
    mobile landing (390×844)
  - eval: landing renders hero + 4 sections in one scroll, type system
    visible, accent color used, 3 themes work, no minimap scaffolding

- P1.6: review-2d-skeleton — 2 fresh subagents (designer + frontend
  architect). Designer rubric: typography, color, hierarchy, density,
  mobile, craft. Architect rubric: semantic HTML, a11y, code structure.
  - verify: 2 eval files
  - eval: no 🔴 findings, average ≥80 on 10-dimension rubric

- P1.7: implement-content-pages — Build parameterized `CategoryView`
  component that renders Product/Post/Idea detail pages. Routes
  `/work/:slug`, `/writing/:slug`, `/ideas/:slug` resolve to this
  component with appropriate content type. Post bodies support both
  inline (render with typography) and external (excerpt + "Read full
  post →" link). Ideas get filterable tag + status display. Products
  get hero image slot, metrics row, case study body. About page gets
  bio + photo slot + contact footer. Collapse MyRoom.tsx, ProductRoom.
  tsx, BookRoom.tsx, IdeaLab.tsx into one parameterized
  `CategoryListView` + config. Delete the 4 originals. Related-content
  strip at end of each detail page.
  - verify: all gates; screenshots of each page template
  - eval: one CategoryView + config replaces 4 room components; all
    detail pages render; inline vs external post bodies both work;
    filters work on ideas page

- P1.8: review-phase-1 — 3 fresh reviewers (PM + designer + frontend
  architect) audit the full Phase 1 output as the phase gate. Weighted
  rubric: routing quality (15), data model rigor (15), visual hierarchy
  (10), typography (10), spacing (10), information density (10),
  mobile (10), interaction baseline (10), a11y (5), performance (5).
  - verify: 3 eval files with full rubric scores
  - eval: weighted average ≥85, zero 🔴, ready for Phase 2 polish

## Phase 2 (not in this loop — user reviews first)

Search + keyboard nav, craft pass (hover/transitions/RSS/404), hero
art + monogram, final ≥88 gate, ship.

## Hard constraints (all units)

- Do NOT touch `src/world3d/` (ENTIRE 3D subtree — F3 polish frozen)
- Do NOT touch `src/data/rooms.ts` (shared with 3D)
- Do NOT touch tests in `tests/` directory
- `playwright.config.cjs` timeout bumps are OK if justified by commit
  message (exempted from freeze for e2e reliability)
- Keep 3D lazy-loaded (bundle split preserved; App3D chunk stays split)
- Mobile-responsive from start (≥320px viewport)
- Dark/light via CSS vars (no new CSS framework)
- One accent color `#7c5cfc` across all 2D
- Real typography system (not system defaults)
- Semantic HTML5, keyboard accessible by default
- TypeScript strict, no `any`, no `as unknown`
- Performance: 2D first paint < 100 KB gzip, Lighthouse perf ≥ 95
- All implement/fix units run: `npx tsc --noEmit && npx eslint . &&
  npm run build && npx playwright test --config=playwright.config.cjs`
  before commit
- Each implement/fix unit produces a git commit
- Each review unit produces ≥2 independent subagent eval files

## Fail-fast rule (added after P1.1 80-min burn incident)

- Subagents must report and exit if they hit 20 min of continuous work
  OR a single gate fails 3 times in a row. Do NOT retry through
  thermal throttling. Surrender + report honestly is better than
  burning an hour of tool uses on retries.
