# 2D Rich Portfolio — Phase 2: Polish + Ship

Phase 1 (P1.1–P1.8) shipped: routing, canonical data model, editorial
single-scroll landing, 4 detail page templates, a11y chrome, dark/light
theme, mobile responsive. Phase 2 takes the structural foundation to
production polish — search, craft pass, hero art — and ships the final
tag.

**Hard scope: 2D ONLY.** `src/world3d/**` is FROZEN. The 3D view stays
as it shipped (commits f4b7595 and earlier). All Phase 2 work touches
`src/components/`, `src/data/`, `src/lib/`, `src/styles/`, `src/App.tsx`.

**Principle:** Phase 1 made it work. Phase 2 makes it feel hand-crafted.
Every additive feature must clear the same gates as Phase 1 (4 gates,
12/12 playwright) without breaking 3D access or bundle split.

## Phase 2 units (7 total)

- P2.1: implement-search-keyboard — Add client-side search across all
  content (Product / Post / Idea / About). Use `minisearch` or
  `flexsearch` (~25-35 KB gzip). Build search index from canonical
  schema at module load, not request time. Add a global keyboard
  shortcut: `/` focuses the search input from any route, `Escape`
  clears + blurs, `j` / `k` move between result items, `Enter`
  navigates to the highlighted result. Add a small SearchBox component
  (input + dropdown of grouped results: Work / Writing / Ideas /
  About). Mount in the app shell so it's available on every route.
  Mobile: full-screen overlay variant. Result rendering reuses the
  existing card components / typography tokens so it doesn't drift.
  - verify: all 4 gates; screenshots of empty input, focused input,
    typed query with results, mobile overlay
  - eval: search returns relevant results across all 4 content types,
    keyboard nav works, no a11y regressions, bundle stays under
    150 KB gzip first paint

- P2.2: review-search-keyboard — 2 fresh subagents (frontend
  architect + a11y reviewer). Verify: search index is built once not
  per-keystroke, debouncing handled, focus management correct, ARIA
  roles on results listbox, no `any`, no per-route subscribe leaks.
  - verify: 2 eval files
  - eval: search is production-quality, ≥85 score, no 🔴

- P2.3: implement-craft-pass — Polish + a11y backlog. Touch:
  * Hover states on all clickable cards (lift + accent border, tokens
    only, no hardcoded colors)
  * Anchor-scroll smooth transitions on landing → section navigation
  * Card click micro-interaction (subtle scale + accent ring)
  * Reading progress bar on long writing detail pages
  * Related-content strip at end of each detail page (tags-overlap
    based, max 3 items, falls back to recency)
  * RSS feed at `/rss.xml` for writing posts (build-time generation
    via Vite plugin or static file at deploy time)
  * 404 polish (real layout matching landing, not the placeholder)
  * 18px back-link tap-target a11y issue (P1.2 designer flag): all
    text links inside cards / placeholders ≥ 44px tap area on mobile
  * `prefers-reduced-motion` respected on every transition
  * Mobile micro-refinements: tag-filter wrapping, card padding,
    bottom-of-fold spacing, fix any horizontal overflow
  - verify: all 4 gates; screenshots of hover states (desktop), card
    detail page with reading progress, 404 polished, mobile filter row
  - eval: every backlog item from P1.2 / P1.6 a11y reviews resolved,
    no `prefers-reduced-motion` violations, no horizontal scroll on
    320px

- P2.4: review-craft-pass — 2 fresh subagents (designer + a11y).
  Designer rubric: hover/transition craft, micro-interaction polish,
  mobile feel, 404 quality. a11y: tap targets, reduced-motion,
  keyboard, screen-reader announcements.
  - verify: 2 eval files
  - eval: ≥85 average, zero 🔴

- P2.5: implement-hero-monogram — Replace the 👩‍💻 emoji avatar in the
  About section + landing hero. Implement an inline SVG monogram as a
  React component (`src/components/shared/Monogram.tsx`) using the
  display serif (Fraunces) — a stylized "S" or "SX" mark in
  `currentColor` so it inherits theme. Ship a tasteful default;
  surface 3-5 design alternatives (different glyph weights, with /
  without serif flourishes, framed / unframed) as inline SVG snippets
  in the eval doc so the user can pick one in P2.6 review or after
  ship. Also add a small hero visual to the landing (SVG-only, < 3 KB,
  no images / no fonts beyond the type system).
  - verify: all 4 gates; screenshots of monogram in landing hero +
    about page (dark + light themes)
  - eval: monogram renders correctly in both themes, scales from 24px
    to 200px, inherits `currentColor`, no raster image dependency

- P2.6: review-final — Phase 2 gate. 3 fresh reviewers (PM + designer
  + frontend architect). Full weighted rubric:
    * Routing quality (10), Data model rigor (10)
    * Search craft (10), Keyboard nav (10)
    * Visual hierarchy (10), Typography (10), Spacing (5),
      Information density (5), Hover/transition craft (10),
      Mobile experience (10), a11y (5), Performance (5)
  Gate to ship: averaged ≥88, zero 🔴.
  - verify: 3 eval files
  - eval: averaged ≥88, zero 🔴

- P2.7: ship — Final summary commit + tag `2d-rich-portfolio-shipped`.
  Update progress.md with ship summary. Push to origin/main.
  - verify: git status clean, all 4 gates green, push succeeds
  - eval: tag exists on remote, deploy artifacts present in dist/

## Hard constraints (all units)

- Do NOT touch `src/world3d/**` (3D is frozen)
- Do NOT touch `src/data/rooms.ts` (shared with 3D)
- Do NOT touch tests in `tests/` directory beyond what P1.9 already
  exempted
- 2D first paint < 150 KB gzip (was 66 KB after P1; can grow up to
  150 KB to fit search index + monogram + craft polish)
- 3D stays lazy-loaded
- TypeScript strict, no `any`
- Dark + light themes both work for every change
- Mobile responsive ≥320px
- All implement/fix units run all 4 gates before commit
- Each implement/fix unit produces a git commit
- Each review unit produces ≥2 independent subagent eval files
- Fail-fast: subagents exit at 20 min / 3 gate fails, no thermal
  retry loops

## Ship target

Tag `2d-rich-portfolio-shipped` on `main`, pushed to origin. Site
deployed via Vercel auto-deploy on push.
