# P2.2 Search — Architect Review

Commit: 17472f9

## Diff sanity

```
 .harness/nodes/P2.1/run_1/landing-with-search-button.png      | Bin 0 -> 83420 bytes
 .harness/nodes/P2.1/run_1/search-overlay-empty.png            | Bin 0 -> 79940 bytes
 .harness/nodes/P2.1/run_1/search-overlay-mobile.png           | Bin 0 -> 29046 bytes
 .harness/nodes/P2.1/run_1/search-overlay-results.png          | Bin 0 -> 111996 bytes
 package-lock.json                                             |   7 +
 package.json                                                  |   1 +
 src/App.tsx                                                   |   3 +
 src/components/shared/SearchBox.css                           | 347 ++++++++++++++++++
 src/components/shared/SearchBox.tsx                           | 387 +++++++++++++++++++++
 src/lib/search.ts                                             | 207 +++++++++++
 10 files changed, 952 insertions(+)
```

Zero frozen-file touches. No changes under `src/world3d/**`, no touch to `src/data/rooms.ts`, `tests/**`, or `playwright.config.cjs`. Clean.

## Bundle analysis

2D first paint chunks (gzip, from fresh `npm run build`):

| Chunk                          | gzip   |
|--------------------------------|--------|
| client-BN5Dfv_y.js (react-dom) | 57.16  |
| chunk-OE4NN4TA-8f48AhKe.js     | 14.62  |
| index-BctjCKqo.js (entry)      | 10.63  |
| index-E6MXSiMw.css             |  3.13  |
| jsx-runtime-DWSWI4JT.js        |  3.25  |
| Landing-BwEAxQAE.js            |  2.30  |
| Landing-B9bCAr0B.css           |  4.92  |
| **Total (with Landing)**       | **96.01 KB gzip** |

Without the Landing route chunks the entry graph is ~88.8 KB as claimed. Either way — well under 150 KB budget.

App3D still lazy-split: `dist/assets/App3D-Cb2lYIoL.js` at 1012.28 KB raw / 264.31 KB gzip, separate chunk confirmed via `ls dist/assets/App3D-*.js`. App3D is NOT inlined into the entry.

## Gate results
- tsc:       PASS (exit 0)
- eslint:    PASS (exit 0, zero warnings/errors)
- build:     PASS (663 modules, 210ms)
- playwright: PASS (12/12 in 2.1m)

## Findings

### Strong points

- 🔵 `src/lib/search.ts:138-156` — MiniSearch index is constructed at module top-level with `index.addAll(docs)` immediately after. Singleton semantics enforced by ES module caching. Zero per-keystroke rebuilds.
- 🔵 `src/lib/search.ts:29-32` — Imports canonical sources directly from `src/data/{products,posts,ideas,about}.ts`. No duplication, no mutation (only read + map into new `SearchDoc` objects).
- 🔵 `src/lib/search.ts:81-134` — All 4 content kinds indexed (`work`, `writing`, `ideas`, `about`). Deduped id namespaces (`work:${slug}`, `writing:${slug}`, etc.) prevent collisions.
- 🔵 `src/lib/search.ts:147-150` — Tag boosting implemented as `boost: { title: 3, tagsText: 2, excerpt: 1.2, body: 1 }`. Title > tags > excerpt > body is the right ordering. `tagsText` pre-joined at collect time so minisearch's default tokenizer handles it cleanly (arrays aren't first-class).
- 🔵 `src/lib/search.ts:175-205` — `search()` wraps `index.search()` and explicitly narrows minisearch's loose `{[key: string]: any}` result into strict `SearchHit` via the `docsById` Map lookup. No `any` escapes.
- 🔵 `src/components/shared/SearchBox.tsx:92-106` — Results memoized on `debounced` via `useMemo`; grouping memoized separately. Index is created exactly once at module load so re-renders never rebuild it.
- 🔵 `src/components/shared/SearchBox.tsx:108-122` — Derived-state reset uses the correct "adjust state during render" pattern: `trackedResults` state is compared to `results` during render, and `setTrackedResults` + `setActiveIndex(0)` are called synchronously during render when they differ. This is the React 19 sanctioned pattern and avoids `react-hooks/set-state-in-effect` violations. Reference doc cited inline.
- 🔵 `src/components/shared/SearchBox.tsx:144-169` — Global `/` listener: attached via `useEffect` with proper cleanup (`removeEventListener`), checks `defaultPrevented`, bails on modifier keys, and bails when target is `INPUT`/`TEXTAREA`/`SELECT`/`contentEditable`. Calls `event.preventDefault()` before `openOverlay()` so the `/` character doesn't end up in the overlay input. No double-binding risk because dependency array is `[openOverlay]` and `openOverlay` is wrapped in `useCallback` with `[]`.
- 🔵 `src/components/shared/SearchBox.tsx:127-141` — `closeOverlay` restores focus to `triggerRef` via `requestAnimationFrame`. Keyboard users not stranded.
- 🔵 `src/components/shared/SearchBox.tsx:13` + `183` — Uses `useNavigate()` from `react-router-dom`, not `window.location`. Proper SPA navigation.
- 🔵 `src/App.tsx:114,130` — SearchBox mounted in `LandingRoute` and `ContentRoute` only. `/3d` route (via `App3D` lazy boundary) does NOT mount SearchBox, preserving the frozen 3D view.

### Minor concerns

- 🟡 `src/components/shared/SearchBox.tsx:85-90` — 50ms debounce via `useEffect` + `setTimeout`. At 50ms it's effectively just coalescing within one animation frame, which is fine, but this does trigger a second render pass (`query` → `debounced`) on every keystroke. Could be eliminated by removing the debounce entirely (index is synchronous and cheap — tens of docs). Not a bug, just extra ceremony. KISS/YAGNI: consider dropping.
- 🟡 `src/components/shared/SearchBox.tsx:226-237` — `onDialogKeyDown` intercepts Tab and force-refocuses the input. This is a simplistic focus trap that works because the dialog has only one focusable element by design, but it also means the "Esc" close button and result rows are unreachable by Tab. Mouse/keyboard-arrow users are fine; strict keyboard-only users lose access to the close button via Tab. Non-blocking since Escape works and arrow keys navigate results, but worth noting.
- 🟡 `src/components/shared/SearchBox.tsx:308` — `results.indexOf(hit)` in the render loop is O(n) per row. With `limit: 12` it's negligible (max 144 ops), but a `Map<id, index>` built once in `useMemo` would be cleaner. Micro-nit.
- 🟡 `src/lib/search.ts:60-74` — Three near-identical `productExcerpt` / `postExcerpt` / `ideaExcerpt` wrappers that all just delegate to `truncate(value, 180)`. DRY violation; collapse to a single `excerpt(value)` helper or just inline `truncate(..., 180)`. Not a bug.
- 🟡 `src/components/shared/SearchBox.tsx:196-198` — `isDown`/`isUp` guards with `!event.metaKey` but not `!event.ctrlKey` / `!event.altKey`. On Linux/Windows `Ctrl+j` in some browsers toggles bookmarks bar; probably won't fire here because the input is focused, but for parity with the `/` handler consider guarding all three modifiers. Minor.

No 🔴 findings.

## Scores

1. Index build correctness: **15/15** — singleton at module load, all 4 kinds, tag boost, canonical sources, no mutation.
2. TypeScript rigor: **15/15** — zero `any`/`as unknown` outside comments; SearchHit interface explicit; minisearch's loose id field narrowed via `typeof r.id === 'string'` + Map lookup; `useNavigate` and `React.KeyboardEvent<T>` properly typed.
3. Bundle size compliance: **15/15** — 2D first paint ~96 KB gzip (well under 150 KB); App3D still lazy-split at 264 KB gzip in its own chunk.
4. No frozen-file touches: **10/10** — clean.
5. React 19 hook compliance: **10/10** — derived-state reset done via the "adjust state during render" pattern, not useEffect. Self-comparison gated by `trackedResults !== results`, safe against infinite loops.
6. Keyboard handler hygiene: **9/10** — proper attach/cleanup, preventDefault, input/textarea/contentEditable guards, modifier key guards, single-bind via stable `useCallback([])`. Minor: ctrl/alt not guarded on `j`/`k` inside input (see 🟡).
7. Memoization / re-render: **9/10** — index is module-level (never rebuilds), `results` and `grouped` both memoized on proper deps. Minor: `results.indexOf(hit)` in row render is O(n) per row (see 🟡).
8. Routing integration: **5/5** — `useNavigate` from `react-router-dom`, focus restored to trigger on close.
9. Gate health: **10/10** — all 4 gates green.

## Total: 98/100
## Verdict: 🔵 PASS (≥85)
