# P2.4 Craft Pass — Designer Review

Commit: 3362601 — `feat(2d): P2.3 craft pass — a11y fixes + hover + RSS + 404 polish + reduced-motion`
Reviewer: P2.4 designer (visual + interaction craft only — a11y handled by sibling reviewer)
Evidence: `.harness/nodes/P2.4/run_1/*.png`

## Per-area findings

### 1. Hover/interaction craft
**Evidence:** `landing-card-hovered.png`, `landing-reduced-motion-hover.png`, `src/components/pages/Landing.css:259-294`

The card hover is exactly what you want for an editorial layout: 1-px violet (`var(--accent)`) border replaces the resting `var(--border)`, a 12-px translateY lift, and a long soft shadow `0 12px 32px -16px var(--accent)` so the card feels like it's leaning toward the cursor without going cartoonish. Both transitions are 200 ms ease — fast enough to feel responsive, slow enough to not strobe.

The reduced-motion path is correctly architected: only the *border-color/background* transition lives in the base rule; the `transform`, `box-shadow`, and the longer combined `transition` are wrapped in `@media (prefers-reduced-motion: no-preference)`. I verified this end-to-end with Playwright `reducedMotion: 'reduce'` — the hovered card had `transform: none` (vs `matrix(1, 0, 0, 1, 0, -2)` in default mode). Reduced-motion users still get the visual border-color change for clear affordance, just no movement. This is the correct interpretation of the spec — most implementations strip *all* hover feedback under reduced-motion, which is over-correction.

The `:active`/`.card:has(.card__link:active) { transform: scale(0.985); }` micro-interaction is understated and idiomatic. `:has()` selector is fine here — broad evergreen support.

One nit: the `--bg-hover` swap on hover plus the violet border plus the box-shadow plus the lift is *almost* too much at once. On dense card grids (Notes section, 5 cards) hover-walking a row would feel like the layout is breathing. Doesn't fail, but consider whether the lift OR the shadow could be dropped. Not blocking.

### 2. Reading progress bar
**Evidence:** `writing-progress-mid.png`, `src/components/shared/ReadingProgress.css`, `src/lib/scroll.ts`

Verified working end-to-end. The bar is `position: fixed; top: 0; height: 3px; z-index: 150` — pinned to the viewport, sitting above route chrome. At 50 % scroll the bar's transform is `matrix(0.5, 0, 0, 1, 0, 0)` (i.e., `scaleX(0.5)`); at 90 % it's `scaleX(0.9)`. Math is honest.

Implementation is well thought out:
- `transform: scaleX()` instead of `width:` keeps it on the GPU compositor — no layout/paint thrash.
- `will-change: transform` declared.
- No CSS transition, so the bar updates *instantly* with scroll position. This is the right call for a progress indicator: any interpolation would lag the actual scroll position and feel wrong.
- The `useScrollProgress` hook listens passively (`{ passive: true }`), also rebinds on `resize` (good — late-loading fonts can change document height), and clamps to `[0,1]` (kills iOS rubber-band overshoot).

Color is `var(--accent)` so it themes correctly. Visible on top of both light and dark backgrounds. Full marks.

### 3. Related-content strips
**Evidence:** `writing-detail-with-progress.png`, `work-detail.png`, `src/lib/related.ts`

Present at the end of every detail page. On the writing detail (Why I Build Things) the strip shows 3 cards: *Learning by Shipping*, *What I'm Reading*, *Debate as Thinking Practice (guest post)*. Cards inherit the same `.card` styling as the landing — same hover lift, accent border, eyebrow + title + body shape. Excellent visual consistency.

On the work detail (Problem Solver) the strip shows 1 card (*Mentor Table*) because the corpus only has 2 work items total and the algorithm correctly excludes self. The fallback to recency when tag overlap is zero is in place per the diff (`relatedByTags`). Max 3 enforced.

The "RELATED WRITING" / "RELATED WORK" eyebrow styling matches the existing mono uppercase tracking-widest section labels. Good.

### 4. 404 page polish
**Evidence:** `404-polished.png`, `404-light.png`, `src/components/pages/NotFound.tsx`, `src/components/pages/NotFound.css:1-129`

This is the strongest single deliverable in the commit. The page is no longer a placeholder — it's editorial.

- Massive display-serif "404" hero using `clamp(6rem, 22vw, 14rem)` with `font-variation-settings: 'SOFT' 40, 'WONK' 0.5` (variable-font axis tuning, same as landing hero) so the type has actual personality.
- The middle "0" is wrapped in `.notfound__display-accent` with `color: var(--accent); font-style: italic; font-weight: 400` — that single accent character anchors the page and makes it feel intentional rather than generic.
- Eyebrow "ERROR / 404" mono uppercase, lede in display-serif, sub line in mono uppercase — same triadic typography system as the landing hero. No ad-hoc fonts.
- 3 destination cards (Home / Writing / Work) with the same hover lift + border-color treatment as `.card`, but with a distinct `.notfound__link` class so they can have their own padding rhythm.
- The `aria-label="404 — page not found"` on the `<h1>` decoupled from the visual "404" glyph is a correct a11y trick (the visible glyph is a styled "4 0 4" with an accent span).
- Inherits the route chrome (SkipLink, ThemeToggle, SearchBox, ProjectsDock) via `cat-page` shell. ProjectsDock visible at bottom, theme toggle top right.
- Reduced-motion gate present on the link card hover lift (`@media (prefers-reduced-motion: no-preference) { .notfound__link { transition: …, transform 200ms ease, box-shadow 200ms ease } }`).
- Both themes work — light theme version retains the accent italic "0" and the cards swap to cream backgrounds correctly.

One micro-nit: `min-height: 100vh` on `.notfound` causes the page to fill the viewport, which is good for centering, but the chrome row at top (`top: 20px` fixed) sits visually crowded against the `.notfound__eyebrow` which starts at `padding-top` from the cat-page shell. On a 1280×900 viewport the eyebrow lands ~110 px from the top edge so it just barely clears. Acceptable.

### 5. Mobile experience
**Evidence:** `mobile-.png`, `mobile-writing.png`, `mobile-writing-why-i-build-things.png`, `mobile-work.png`, `mobile-320-landing.png`, `mobile-320-writing-detail.png`

**390 px:** Cards stack to single column cleanly. Tag filter rows wrap. Reading progress bar visible at top of mobile writing-detail. Top chrome row (Search trigger / ViewSwitcher / ThemeToggle) fits without collision since `right: 178px` was applied to the SearchBox at the same time. Tap targets verified ≥44 px on the SearchBox trigger and close.

**320 px:** This is the stress-test failure mode and the implementer claimed "zero horizontal overflow." Verified true: `document.documentElement.scrollWidth === 320` (no overflow). However the top chrome row at 320 px is *visually* very crowded — the SearchBox / ViewSwitcher pill / ThemeToggle 3 elements occupy almost the full 320 px width and crash visually into the "SuriXing" headline area at the top of the landing. No element overflows or clips, but the density is very high.

Why this still passes: 320 px is below the modern minimum (most reference iPhone SE is 375 px) and the implementer explicitly listed it as a stress test, not a target. At 390 px the chrome row spaces beautifully. Not penalizing, but flagging as the top mobile-craft concern.

Bottom dock (`ProjectsDock` "BLOG / WORKOUTS / MENTOR TABLE") on the mobile landing is clean — three short pills wrap into one row.

### 6. Theme consistency
**Evidence:** `landing-dark.png`, `landing-light.png`, `404-polished.png`, `404-light.png`

Both themes work for every change. The hover accent border, the box-shadow tinted with `var(--accent)`, the reading progress bar, the 404 hero italic accent, the related-content cards, and the SearchBox new position all theme correctly because every new style uses tokens — no hardcoded colors anywhere in the diff. I grepped the new CSS files and only saw `var(--accent)`, `var(--border)`, `var(--bg-elevated)`, `var(--bg-hover)`, `var(--fg)`, `var(--fg-secondary)`, `var(--fg-muted)`. Clean.

### 7. Typography rhythm
**Evidence:** `404-polished.png`, `writing-detail-with-progress.png`, `landing-dark.png`

Display-serif (Fraunces) for hero and large titles, body sans for prose, mono for eyebrows / kbd / labels. The 404 page uses the same `font-variation-settings: 'SOFT' 40, 'WONK' 0.5` axis values as the landing hero, so the giant "404" feels related to "SuriXing" rather than alien. The related-content cards inherit `.card__title` typography (display-serif, large, tracking-tight). The reading progress bar has no type at all (good — it's a 3-px strip).

No new fonts introduced. System is intact.

### 8. Information density
**Evidence:** `landing-dark.png`, `writing-list.png`

The hover affordance does *not* bloat the resting state of cards — the lift only happens on hover, and the resting card padding/border/shadow are unchanged from P2.2. The landing still has Hero / Shipped (2 cards) / Notes (5 cards) / Brewing (3 cards) / Me visible without scrolling on a 1280×900 desktop (full-page screenshot is dense and browsable). Card titles still show the eyebrow + title + body + tags + metric pattern with no wasted space.

### 9. Reduced-motion handling
**Evidence:** Playwright `reducedMotion: 'reduce'` test in `_design-shot.cjs`, `landing-reduced-motion-hover.png`

Verified end-to-end. With the OS-level reduced-motion preference set:
- `.card:hover` returns `transform: none` (vs `matrix(1,0,0,1,0,-2)` in normal mode).
- `html { scroll-behavior: smooth }` is gated by `@media (prefers-reduced-motion: no-preference)` in `tokens.css:140-144`, so anchor jumps are instant.
- `.notfound__link` hover lift gated correctly.
- Reading progress bar has *no* CSS transition by design — it just snaps to the new transform on each scroll event, which is the correct call (a transition would feel like animation to a reduced-motion user).

The `.card:hover { border-color: var(--accent); background: var(--bg-hover); }` rule is *not* gated — meaning reduced-motion users still get the visual color affordance. This is correct interpretation of the WCAG guidance: reduced-motion suppresses *motion*, not *all* feedback. Color/border changes are not motion.

### 10. RSS feed presence
**Evidence:** `curl http://localhost:4173/rss.xml`

Resolves with `200 OK` and serves valid RSS 2.0:
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:content="…" xmlns:atom="…">
  <channel>
    <title>Suri's Writing</title>
    <link>https://iamsuri.ai/writing</link>
    <atom:link href="https://iamsuri.ai/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>Wed, 15 Apr 2026 04:34:07 GMT</lastBuildDate>
    <item>
      <title>Why I Build Things</title>
      …
      <pubDate>Wed, 01 Apr 2026 00:00:00 GMT</pubDate>
      <content:encoded><![CDATA[<p>I don't build things because I want to launch a company…</p>]]></content:encoded>
    </item>
    <item>
      <title>Learning by Shipping</title>
      …
```

Two inline-kind posts present, RFC 822 `pubDate`, `content:encoded` CDATA bodies inline, `atom:link rel="self"`. Channel-level `<title>`, `<link>`, `<description>`, `<language>`, `<lastBuildDate>` all present. `<link rel="alternate" type="application/rss+xml">` added to `index.html` head per the diff. Spec-compliant.

## Scores

1. Hover/interaction craft: **14/15** (one nit on combined density of border + lift + shadow + bg swap on dense grids)
2. Reading progress bar: **10/10** (math verified, position fixed, scaleX, no transition, themed)
3. Related-content strips: **10/10** (max 3, recency fallback, consistent card styling)
4. 404 page polish: **15/15** (display-serif hero with italic accent "0", three destination cards, both themes, reduced-motion gated, inherits chrome — best deliverable in the commit)
5. Mobile experience: **13/15** (390 px excellent, 320 px no overflow but visually crowded chrome row)
6. Theme consistency: **10/10** (zero hardcoded colors, both themes verified for every new element)
7. Typography rhythm: **10/10** (no new fonts, axis values match landing, mono/serif/sans system intact)
8. Information density: **5/5** (hover affordance does not bloat resting state)
9. Reduced-motion handling: **5/5** (verified `transform: none` in Playwright reducedMotion mode; correct decision to keep border-color feedback)
10. RSS feed presence: **5/5** (valid RSS 2.0, inline post bodies, CDATA, atom self-link)

## Total: **97/100**

## Verdict: 🔵 PASS (≥85)
