## Backlog — Phase 2

### From P2.2 a11y review (🔴 → must land in P2.3)
- **🔴 SearchBox.css:174-176** — `outline: none` on `:focus-visible` removes the only focus ring on the input, the sole focusable element in the dialog. WCAG 2.4.7 fail. Restore visible focus indicator using `--accent` + outline-offset.
- **🔴 SearchBox.tsx:209-218** — Tab handler pins focus to the search input forever, making the Close button keyboard-unreachable. Replace with a proper roving Tab trap that includes Close button + input.
- **🔴 SearchBox dialog** — Background not `inert` while dialog is open. `aria-modal` alone does not block AT virtual cursors. Add `inert` attribute (or `aria-hidden="true"` fallback) to siblings of the dialog.
- **🟡 SearchBox mobile sizes** — trigger button 36×36, close button 36×28 — both below WCAG 2.5.5 (44×44). Bump to ≥44px.
- **🟡 SearchBox empty/no-results** — Missing `role="status"` / `aria-live="polite"` on the "No results" message. Screen reader users hear silence after a query update. Add a polite live region.
- **🟡 SearchBox text contrast** — placeholder + row excerpt use `--fg-muted` which fails AA 4.5:1 in both dark and light themes. Either tune `--fg-muted` (affects whole site) or override locally with `--fg-secondary`.

### From P2.2 architect review (🟡, non-blocking)
- **🟡 search.ts:60-74** — Three near-identical excerpt wrappers — DRY into a helper.
- **🟡 SearchBox.tsx:85-90** — 50ms debounce is over-engineering for instant client-side search. Drop it (KISS/YAGNI).

### From P2.4 designer review (🔵 non-blocking, surface in P2.5/P2.6)
- 320px chrome crowding — Search trigger / ViewSwitcher pill / ThemeToggle visually crash into "SuriXing" headline at 320×568. 390px is clean. 320 is stress-test, not target. Skip unless cheap.
- Card hover layered effect — border-color + 2px lift + accent shadow + bg-hover all fire simultaneously. On dense grids (Notes 5 cards), hover-walking can feel like the layout breathes. Consider dropping ONE of the three (shadow OR lift OR bg) to flatten.

### From P2.4 a11y review (🔵 non-blocking)
- Legacy `clip` SR-only pattern in use somewhere; modern `clip-path: inset(50%)` is more reliable. Cosmetic.
- Reading progress bar updates on every scroll tick — could throttle via rAF if perceived chatter on long pages. Not gate-impacting.
- 404 h1 aria-label richer than visible text — minor cosmetic.
