# P1.2 Routing — a11y Review

Commit: cf47d57

Reviewed in detached worktree at `/tmp/iamsuri-cf47d57` (HEAD has moved on to P1.5/P1.7, so all assertions below reflect the source as of cf47d57). Dev server: Vite 8 on http://localhost:5174.

## Smoke test output

```
/             → title="Suri's Lab"               main=0 h1=0 header=0 footer=0 nav=1 focused-after-nav=BODY
/work         → title="Work — Suri's Lab"        main=1 h1=1 header=0 footer=0 nav=0 focused-after-nav=BODY
/work/foo     → title="Work / foo — Suri's Lab"  main=1 h1=1 header=0 footer=0 nav=0 focused-after-nav=BODY
/writing      → title="Writing — Suri's Lab"     main=1 h1=1 header=0 footer=0 nav=0 focused-after-nav=BODY
/ideas        → title="Ideas — Suri's Lab"       main=1 h1=1 header=0 footer=0 nav=0 focused-after-nav=BODY
/about        → title="About — Suri's Lab"       main=1 h1=1 header=0 footer=0 nav=0 focused-after-nav=BODY
/nonexistent  → title="404 — Suri's Lab"         main=1 h1=1 header=0 footer=0 nav=0 focused-after-nav=BODY  (redirected to /404)

LANDING tab order:
  BUTTON:Toggle theme:☀️ → A:Switch to 3D world:3D → BUTTON:Enter My Room → BUTTON:Enter Product Room
  → BUTTON:Enter Book Room → BUTTON:Enter Idea Lab → A:Blog → A:AnonCafe

ABOUT tab order:
  A:← Back to home → BODY → A:← Back to home → BODY → ...   (only one focusable inside <main>; no chrome)

ViewSwitcher box:           {x:1150.7, y:20, width:53.3,  height:44}    ← 53×44 (≥44 OK)
Placeholder back-link box:  {x:312,    y:119, width:108.9, height:18}   ← 18px tall (FAIL ≥44)
First-focus computed style: outline="rgb(0,95,204) auto 1px"  (UA default present, no custom :focus-visible)
After /→/work programmatic nav, document.activeElement = BODY
404 page:  url=/404, h1="404", main=1
```

## Findings

### New code (P1.1)

🔴 **No focus management on route change** — `App.tsx:178-249`. After navigating from `/` to `/work`, `document.activeElement` is `BODY`. `react-router-dom` v7 does NOT do this for you. Screen-reader / keyboard users hear nothing change, and the next Tab dumps them at the top of the persistent chrome (or browser UA). Fix in P1.5/P1.7: add a `RouteAnnouncer` (live region for `document.title`) + a `useFocusReset` hook that focuses `<main tabIndex={-1}>` after each `useLocation()` change. (HEAD already has `SkipLink` + `RouteAnnouncer` — they were added later.)

🔴 **No skip-link** — `App.tsx:178-249`. There is no "Skip to main content" anchor as the first focusable element. On the landing route a sighted-keyboard user must Tab through 8+ widgets (theme toggle, view switcher, four room tiles, blog, anoncafe) before reaching content. (HEAD adds `<SkipLink />` — out of P1.2 scope but the gap is real for cf47d57.)

🔴 **Placeholder back-link tap target** — `Placeholder.tsx:33-44`. The `← Back to home` link is plain inline text inside a `<p>`, measured 108.9 × 18 px. WCAG 2.5.5 requires ≥44×44 (or 2.5.8 ≥24×24 minimum). Same bug in `NotFound.tsx:24-33`. Fix: give the link `display:inline-block; padding:0.75rem 1rem; min-height:44px;` or wrap in a button-styled component.

🔴 **Persistent chrome missing on Placeholder + NotFound** — `App.tsx:117-126`. `LandingRoute` renders `<ThemeToggle />`, `<ViewSwitcher />`, `<ProjectsDock />`, but the Placeholder/NotFound routes render *only* the Placeholder/NotFound element. Net effect for a user landing on `/about` or `/404`: no theme toggle, no 3D switch, no projects dock, no nav. They can only Tab to the single back-link and out. Fix: wrap every route in a shared shell (HEAD does this with `ContentRoute`).

🟡 **No `:focus-visible` style on `.view-switcher`** — `ViewSwitcher.css:1-30`. The element relies on UA default outline, which works in Chrome (we captured `outline: rgb(0,95,204) auto 1px`) but is inconsistent across browsers and ignored when authors later set `outline:none`. Add an explicit `.view-switcher:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }`.

🟡 **No `prefers-reduced-motion` on ViewSwitcher hover transform** — `ViewSwitcher.css:19,24`. `transition: transform 0.2s, ...` + `transform: scale(1.05)` on hover. Wrap in `@media (prefers-reduced-motion: no-preference) { ... }` or zero the transition under `(prefers-reduced-motion: reduce)`.

🟡 **Placeholder uses raw `<main>` only — no landmark structure** — `Placeholder.tsx:21`, `NotFound.tsx:14`. There is `<main>` and `<h1>` (good), but no `<header>`, `<nav>`, or `<footer>` landmarks. A screen-reader user has only one landmark to jump to. Fix in P1.7 when real chrome lands.

🟡 **Inline-styled link colors** — `Placeholder.tsx:43`, `NotFound.tsx:29`. `color: '#7c5cfc'` is hard-coded with no underline. On the dark background `#7c5cfc` vs `#0a0a10` ≈ 5.4:1 — passes AA for normal text, but with **no underline** and **no other distinguishing mark**, it relies on color alone, which is a WCAG 1.4.1 failure when the link sits inside body text. The arrow glyph (←) is decorative and doesn't count as a non-color indicator. Fix: add `text-decoration: underline;` or use a button style.

🟡 **`color: var(--text-primary, #e6e6f0)` fallback on Placeholder** — `Placeholder.tsx:28`. The fallback (`#e6e6f0`) is correct for dark mode; if the design system later flips light, the fallback won't match and the text could be invisible until tokens load. Hardcode-fallback risk is small but worth noting.

🟡 **`<h1>` font-size 2rem with `opacity: 0.6` on the slug span** — `Placeholder.tsx:35-39`. `opacity: 0.6` reduces contrast across the board. On dark bg the slug becomes `#e6e6f0 × 0.6` ≈ `#8a8a90` over `#0a0a10` ≈ 5.0:1 — passes AA for ≥2rem (large text), but barely. Acceptable here.

🟢 **`document.title` updates per route** — `Placeholder.tsx:18-20`, `NotFound.tsx:11-13`, plus `App.tsx:148` for `/3d` (HEAD only). At cf47d57, `ThreeDRoute` does NOT set `document.title`, so navigating to `/3d` leaves the previous title — minor.

🟢 **Each page has exactly one `<h1>`** — confirmed `h1=1` for /work, /writing, /ideas, /about, /404 in smoke output. Landing has `h1=0` because that's the legacy FloorPlan (preexisting, not P1.2 scope).

🟢 **`<Link>` semantics correct** — `ViewSwitcher.tsx:11`, `Placeholder.tsx:42`, `NotFound.tsx:28`. All use `react-router-dom`'s `<Link>`, which renders `<a href>`, so Enter activates and right-click "open in new tab" works. ViewSwitcher has `aria-label="Switch to 3D world"` — good.

🟢 **ViewSwitcher tap target** — measured 53.3 × 44 px on landing. Just barely meets WCAG 2.5.5 ≥44×44. (Width comes from padding 16+16 + glyph width, not min-width — fragile if text changes.)

🟢 **`PageLoading`/`world3d-loading` use `role="status" aria-live="polite"`** — `App.tsx:107, 152` (cf47d57 only has the latter). Loading state is announced. Good.

🟢 **404 catch-all uses `<Navigate to="/404" replace />`** — `App.tsx:130`. `replace` keeps history clean, so back-button behavior is sane for keyboard/SR users.

### Preexisting (out of P1.2 scope, logged for P1.5)

- 🟡 **`/` (Landing) has `main=0 h1=0 header=0 footer=0`** — the legacy FloorPlan has zero document landmarks. P1.5 must fix this when the editorial single-scroll lands.
- 🟡 **Landing tab order ends in `<a>:Blog → <a>:AnonCafe`** with no clear visual focus indication on those `ProjectsDock` items (need to confirm in P1.5).
- 🟡 **Theme toggle button label is just "☀️"** with `aria-label="Toggle theme"` — that's correct for SR but the visible label is the emoji only; localized SR may pronounce it weirdly.

## Scores

1. Focus management on route change: **3/15** — none implemented; route change leaves focus on BODY. Confirmed empirically.
2. Semantic HTML: **11/15** — Placeholder/NotFound have proper `<main>` + single `<h1>`, but no `<header>`/`<nav>`/`<footer>` landmarks; chrome missing on these routes.
3. Keyboard navigation: **9/15** — all interactive elements are reachable on `/`, but on `/work`, `/about`, `/404` the only focusable element is the back-link (no chrome wrapper). UA focus indicator works.
4. Screen reader announcements: **5/10** — `document.title` updates per route (good), but no live-region announcer; `/3d` route forgets to update title at all; no skip-link.
5. Reduced motion: **2/5** — no `prefers-reduced-motion` anywhere in the new code (ViewSwitcher hover scale transition is unconditional).
6. Color contrast: **7/10** — `#7c5cfc` link on `#0a0a10` ≈ 5.4:1 passes AA, but link is color-only (no underline) — WCAG 1.4.1 issue.
7. Tap target size: **4/10** — ViewSwitcher 53×44 just passes; Placeholder + NotFound back-link 109×18 fails.
8. Landmark structure: **5/10** — `<main>` present on Placeholder/NotFound, but no `<header>`/`<nav>`/`<footer>` and no skip-link. Landing route inherits preexisting zero-landmark FloorPlan.
9. Form + link labels: **5/5** — every interactive element has an accessible name (ViewSwitcher `aria-label`, all Links have visible text content).
10. Error page a11y: **4/5** — NotFound has `<main>`, single `<h1>="404"`, descriptive paragraph, and a back-link. Loses 1 for the same 18px tap-target problem as Placeholder.

## Total: 55/100
## Verdict: 🔴 FAIL

The dominant failure is **focus management on route change** combined with the **persistent chrome being absent on Placeholder/NotFound routes**. P1.7 cannot ship in its current shape without (a) wrapping every route in a shared shell that includes ThemeToggle / ViewSwitcher / ProjectsDock, (b) adding a `<SkipLink>` as the first focusable element, (c) adding a `RouteAnnouncer` that fires after each location change and resets focus to `<main tabIndex={-1}>`, and (d) fixing the 18px back-link tap target.

Note: P1.5 (94ec270) and P1.7 (a86a8d9) on `main` already address (a)/(b)/(c) — see `src/components/shared/SkipLink.tsx` and `src/components/shared/RouteAnnouncer.tsx` plus the `ContentRoute` wrapper in `src/App.tsx:121-134` of HEAD. The 18px back-link issue should still be re-verified post-P1.7.
