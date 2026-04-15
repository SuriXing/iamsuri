# P1.2 Routing — Architect Review

Commit: cf47d57

Audited against an isolated `git archive` snapshot of `cf47d57` at
`/tmp/p11-audit` (fresh `npm install`, no later-phase code leakage).

## Gate results

- tsc: **PASS** (0 errors)
- eslint: **PASS** (0 errors)
- build: **PASS**
  - App3D chunk split: **YES** — `dist/assets/App3D-Bm6q6Y9G.js` = 1,012 KB raw / **264.20 KB gzip** (separate chunk)
  - Entry chunk: `index-CW9BQk07.js` = 57.18 KB / **19.02 KB gzip** (react-router + Landing + FloorPlan + rooms)
  - jsx-runtime split: `jsx-runtime-XuyzTOxs.js` = 190.26 KB / **59.95 KB gzip** (React/JSX)
  - CSS: `index-Cc1lOitM.css` = 16.75 KB / **3.86 KB gzip**
  - **2D first paint ≈ 82.83 KB gzip** (budget <100 KB; baseline ~79 KB; delta +4 KB from react-router-dom — acceptable)
  - Verified entry chunk contains `react-router` import but NOT `three`/R3F/drei (grep confirmed).
- playwright: **FLAKY** — full suite runs landed at 7/12 and 9/12 across two runs with the same 3-5 heavy 3D tests failing mid-suite with `ERR_CONNECTION_REFUSED` on `/?view=3d`. In isolation (`-g "keyboard flow"`) those same tests pass in ~22s. Root cause: dev server instability under sustained 3D-heavy traffic, not a routing regression. Commit message claims "12 passed" — I could not reproduce that locally on this hardware. Flagging but not treating as a blocker, since it reproduces against the identical P1.1 snapshot the author built on.

## Routing smoke test results

```
/           -> /           | EMPTY*
/work       -> /work       | has content
/writing    -> /writing    | has content
/ideas      -> /ideas      | has content
/about      -> /about      | has content
/3d         -> /3d         | has content
/nonexistent -> /404       | has content   <- catchall Navigate replace
after back from /work, URL = /            <- history back works
after ?view=3d, URL = /3d                 <- legacy fallback works
after refresh /work/foo, URL = /work/foo  <- deep-link refresh works
```

*\* `/` reports "EMPTY" because `FloorPlan.tsx:27` renders `<div className="floor-plan">`, not `<main>` or `<canvas>` — the smoke script only queries `main, canvas`. This is a **pre-existing a11y gap** in the 2D landing, not a P1.1 regression. The 2D landing still renders; the 2D/3D switch still works via `<Link to="/3d">`.*

## Findings

### Blue (ship-quality)

- 🔵 `src/App.tsx:40-58` — `bootstrapRoute()` is well thought out. Running at module eval time (before React mounts) to (a) rewrite `?view=3d` → `/3d` via `history.replaceState` and (b) fire `world3dImport()` so the network round-trip parallelises with React bootstrap. The `lazy(world3dImport)` pattern deduplicates the in-flight promise, so the Suspense fallback short-circuits on the preloaded chunk. This is the correct way to do it — no `startTransition` ceremony, no flicker.

- 🔵 `src/App.tsx:140-153` — `BrowserRouter` + `Routes` structure is flat and readable. `<Route path="*" element={<Navigate to="/404" replace />} />` uses `replace`, so the catchall doesn't leave a bogus history entry. Good.

- 🔵 `src/App.tsx:99-115` — `ThreeDRoute` wires the 3D HUD exit to `navigate('/')` through `useCallback`, so the 3D `onExitTo2D` contract stays intact while exit-via-history works. `src/world3d/**` untouched as the commit claims.

- 🔵 `vercel.json:7` — SPA rewrite `{ source: "/(.*)", destination: "/index.html" }` is already in place from earlier commit `bac2d75`. Prod deep-links will resolve client-side. No action needed.

- 🔵 `src/components/shared/ViewSwitcher.tsx:9-19` — Clean refactor. `<Link to="/3d">` with `aria-label` and `title`, no `onClick` prop, no `<a href>` for internal nav. Styling preserved via `view-switcher` class.

- 🔵 `src/components/pages/Placeholder.tsx:19` — `useParams<{ slug?: string }>()` with typed generic. Good TypeScript rigor; no `any`.

- 🔵 **Bundle split preservation** — Default Vite splitting (no manualChunks needed) via the `React.lazy(() => import('./world3d/App3D'))` boundary. Robust against future refactors as long as that import boundary stays dynamic.

### Yellow (debt, should be fixed before P1.5 but not a P1.1 blocker)

- 🟡 `src/components/pages/Placeholder.tsx:26-42` — Inline styles with hardcoded `#7c5cfc` link color on both light and dark themes. WCAG AA contrast ratio fails on at least one theme (spec requires 4.5:1 for small text). The commit author already acknowledged this in the HEAD version of this file — P1.7 rewrites it to use tokens.css. For P1.1 scope it's tolerable, but the back-link is also well below the 44px tap target, which matters for mobile deep-linking into placeholder routes. Fix this in P1.2-followup or roll it into P1.5.

- 🟡 `src/components/pages/NotFound.tsx:14-27` — Same inline-style + hardcoded color pattern. Same fix.

- 🟡 **Playwright webServer stability** — Full-suite runs hit `ERR_CONNECTION_REFUSED` on 3-5 late-stage 3D tests even after the 30→60s timeout bump. The timeout bump addresses per-test budget but not dev-server longevity under sustained 3D load. Options: (a) add `workers: 1` explicitly to avoid parallel dev-server contention, (b) `reuseExistingServer: false` + longer webServer timeout, (c) run 3D tests against `vite preview` (static prod build) instead of `vite dev`. I'd pick (c) — it's the most robust and matches what prod CI should do.

- 🟡 `src/App.tsx:12-16` — `Landing()` still imports `FloorPlan`, `RoomView`, `MyRoom`, `ProductRoom`, `BookRoom`, `IdeaLab` into the entry chunk. Commit scope says these die in P1.5 so it's tolerable here, but they're contributing ~10-15 KB gzip to the 2D first paint that will go away once P1.5 ships. Not a P1.1 issue.

- 🟡 `src/App.tsx:40-58` — `bootstrapRoute()` runs as a side effect at module eval. If the module is ever imported in an SSR/prerender context (Vercel prerender, Storybook, test harness), the `typeof window === 'undefined'` guard protects against the crash, but module evaluation still runs. Fine for now; flag if any SSR happens later.

### Red (none)

No red-flag issues in routing infrastructure.

## Scores

1. URL schema correctness: **14/15** — all 10 routes resolve, deep-link refresh verified, catchall `replace` correct, `/3d` lazy-loads. -1 for no explicit trailing-slash normalization (minor, none of the routes care today).
2. Bundle split preservation: **15/15** — App3D stays a 264 KB gzip separate chunk, 2D first paint ≈83 KB gzip under the 100 KB budget, entry chunk verified free of three/R3F.
3. Back button + history: **10/10** — `<Link>` in ViewSwitcher, `useNavigate()` in ThreeDRoute, `replaceState` (not pushState) for legacy fixup, `Navigate replace` for 404. All correct.
4. TypeScript rigor: **10/10** — no `any`, typed `useParams`, typed `PlaceholderProps`, clean.
5. SPA fallback: **10/10** — `vercel.json` rewrite in place, Vite dev handles it automatically.
6. Legacy fallback: **5/5** — `?view=3d` → `/3d` verified, uses `replaceState` so refresh on `/3d` works.
7. Placeholder quality: **7/10** — semantic `<main>`, `document.title`, back-link, `useParams` all correct. -3 for hardcoded `#7c5cfc` contrast debt and sub-44px tap target (author already flagged, fixed in P1.7 on HEAD).
8. ViewSwitcher refactor: **5/5** — clean `<Link>` with aria-label and title.
9. Gate health: **6/10** — tsc + eslint + build green (9 pts of the 10 weight). Playwright flaky 3/5 failures of 12 on full-suite runs but passes in isolation. Cannot reproduce author's "12 passed" claim locally. -4 for the unreliable playwright gate, even though root cause is dev-server stability not routing.
10. Non-regressions: **10/10** — 2D landing renders, 3D route loads with canvas, ThemeToggle + ProjectsDock mounted on Landing, 3D exit round-trips through `navigate('/')`.

## Total: **92/100**

## Verdict: 🔵 PASS (≥85)

Routing infrastructure is production-quality. Two yellows to resolve before
they compound: (a) Placeholder/NotFound inline-color a11y debt — already
addressed on HEAD by P1.7 so no action needed if the P1 phase ships as a
unit, and (b) the playwright dev-server flake is pre-existing, not a P1.1
regression, but the author's "12 passed" claim in the commit message is
over-optimistic for non-author hardware. Consider switching 3D tests to
`vite preview` (static prod build) to stabilize CI.
