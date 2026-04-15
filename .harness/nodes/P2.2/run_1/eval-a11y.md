# P2.2 Search — a11y Review

Commit: 17472f9

## Smoke test output

```
trigger count: 1 aria-label: Search (press / to open) aria-expanded: false aria-haspopup: dialog
desktop trigger size: 117.25 x 36
after /, dialog count: 1 aria-modal: true aria-labelledby: _r_1_ label text: Search focused: INPUT:(noid):Search query
after typing, listbox: 1 options: 8 listbox aria-activedescendant: null input aria-activedescendant: _r_0_-option-writing:why-i-build-things
after ArrowDown, input activedescendant: _r_0_-option-about:suri
after j, input activedescendant: _r_0_-option-ideas:ai-study-buddy
after k, input activedescendant: _r_0_-option-about:suri
after ArrowUp, input activedescendant: _r_0_-option-writing:why-i-build-things
after 10 tabs while overlay open, focus: INPUT#(noid):Search query
after Shift+Tab x5, focus: INPUT#(noid):Search query
aria-live regions: 1 role=status: 1   (both from RouteAnnouncer / other components — NOT SearchBox)
input focus style: {"outline":"none 3px rgb(237, 237, 245)"}
active row styles: {"rowBg":"rgb(28, 28, 42)","borderLeft":"rgb(124, 92, 252)","outline":"rgb(124, 92, 252) 2px","titleColor":"rgb(237, 237, 245)","excerptColor":"rgb(111, 111, 128)"}
desktop row height: 81.65625
desktop close button size: 36.4375 x 28
background inert check: {"bodyOverflow":"hidden","appInert":false,"appAriaHidden":null}
after Esc, dialog: 0 focus restored to: BUTTON:Search (press / to open)
empty state text: null
no-results text: No results for "zzzzzzqqqqxxxx". aria attrs: {"live":null,"role":null}
mobile trigger size: 36 x 36 (target >=44)
mobile row height: 85.65625 mobile close size: 36.4375 x 28
```

## Findings

### 🔴 Critical

1. **Background page is NOT inert while dialog is open** — `SearchBox.tsx:266-384`
   `aria-modal="true"` is set on the dialog, but the background (`#root` / `<main>`) has no `inert` attribute or `aria-hidden="true"`. `aria-modal` alone does not block AT virtual cursors in many screen readers (NVDA scan-list, JAWS virtual, VoiceOver rotor). Users can still swipe/arrow into background content. Fix: when `open`, set `inert` on the non-dialog app root (or apply `aria-hidden="true"` + `inert` to siblings of the backdrop).

2. **No visible focus ring on the search input** — `SearchBox.css:174-176`
   ```css
   .search-dialog__input:focus-visible { outline: none; }
   ```
   Global tokens.css:116-126 establishes a universal `input:focus-visible { outline: 2px solid var(--accent) }` ring. This component explicitly strips it. The input is the only focusable element inside the dialog and it actively cancels its focus indicator. WCAG 2.4.7 Focus Visible failure. The caret is not a sufficient indicator — sighted keyboard users with motor disabilities need a persistent ring around the input container. Verified via computed style: `outline: none 3px rgb(237,237,245)`.

3. **Trigger button & Close button below 44×44 tap target (mobile)** — `SearchBox.css:13-35, 77-86, 178-194`
   - Mobile trigger: **36×36 px** (text label hidden at ≤640px, only icon + kbd remain; kbd also hidden → icon-only 36×36). WCAG 2.5.5 / 2.5.8 AAA/AA failure.
   - Desktop trigger height: **36 px** (WCAG 2.5.5 AAA target is 44; 2.5.8 AA minimum is 24 — passes AA, fails AAA).
   - Close button: **36×28 px** on all viewports — fails WCAG 2.5.8 AA (<24 on one dimension passes, but 28px height is below 44 AAA and visually cramped; the button also disappears from Tab order — see issue #4).

### 🟡 Should fix

4. **Close button is unreachable by keyboard** — `SearchBox.tsx:209-218`
   ```tsx
   const onDialogKeyDown = useCallback((event) => {
     if (event.key === 'Tab') {
       event.preventDefault();
       inputRef.current?.focus();
     }
   }, []);
   ```
   Tab is **always** preventDefaulted and focus is pinned to the input. This means the Close button (`aria-label="Close search"`) is never Tab-focusable. Escape still works, so it's not a full keyboard trap, but users who don't know Escape (or use a switch device stepping through Tab order) have no way to reach the Close control. Focus trap pattern should cycle: input → close → input, not pin. Fix: on Tab from input, move to Close; on Tab from Close, wrap to input; on Shift+Tab from input, move to Close.

5. **No live-region announcement for result count / no-results** — `SearchBox.tsx:329-338`
   ```tsx
   {debounced.trim().length > 0 && results.length === 0 && (
     <p className="search-dialog__empty">No results for "{debounced}".</p>
   )}
   ```
   The "No results" paragraph has no `role="status"`, `aria-live="polite"`, or equivalent. Screen reader users typing a query get no audible feedback that 0 results were returned — the paragraph is inserted silently. Same issue for result count changes ("12 results for 'build'" is never announced). Fix: wrap the empty/status region in `role="status" aria-live="polite"` and add a visually-hidden "{n} results" announcement that updates with `debounced`.

6. **`aria-activedescendant` lives on input, not on listbox** — `SearchBox.tsx:308-309, 324-328`
   The input has `aria-controls={listboxId}` + `aria-activedescendant`, and the `<div role="listbox">` has no `aria-activedescendant`. This is actually the **combobox** pattern (APG combobox with listbox popup), but the input lacks `role="combobox"`, `aria-expanded`, and `aria-autocomplete="list"`. As-is, the input is a plain `<input>` with `aria-controls` + `aria-activedescendant`, which is non-standard and confuses AT. Fix either:
   - (a) Add `role="combobox" aria-expanded="true" aria-autocomplete="list"` to the input, OR
   - (b) Move `aria-activedescendant` onto the `role="listbox"` element itself (it would then need `tabindex="0"` to be focusable).
   Option (a) matches APG and works with the existing code. See https://www.w3.org/WAI/ARIA/apg/patterns/combobox/

7. **Placeholder contrast fails WCAG AA** — `SearchBox.css:170-172`, `tokens.css:89-110`
   Placeholder uses `var(--fg-muted)`:
   - Dark: `#6f6f80` on `#151520` (input row bg via elevated) ≈ **3.3:1** — fails 4.5:1 AA for normal text. Placeholder is typically exempted but WCAG 1.4.3 applies when placeholder is the only cue.
   - Light: `#80808a` on `#f5f2ea` ≈ **3.4:1** — fails AA.
   The placeholder text "Search work, writing, and ideas…" is the only hint of what the input does once focused (the visually-hidden `<h2>Search</h2>` title is SR-only). Sighted low-vision users cannot read the hint.

8. **Row excerpt text below AA contrast** — `SearchBox.css:274-284`, active-row smoke evidence
   Excerpt color `#6f6f80` on active-row bg `#1c1c2a` ≈ **3.5:1**, on default bg `#151520` ≈ **3.3:1**. Fails WCAG 1.4.3 AA (4.5:1) for normal text. This is the same systemic `--fg-muted` issue that tokens.css:19-36 already flags for large display text. Excerpts are small body text — should use `--fg-secondary` (`#a0a0b0`, ≈6.5:1 on #151520) instead of `--fg-muted`.

### 🔵 Nit / informational

9. **Backdrop click handler uses `onMouseDown`** — `SearchBox.tsx:269`
   `onMouseDown` on backdrop means a user click-dragging *from* a result row *to* the backdrop will close the dialog (mousedown fires on backdrop only if target is backdrop, so this is probably fine, but the more common pattern is `onClick` to avoid dismissing on text-selection drag-releases). Minor UX/a11y for users with motor imprecision.

10. **Group headings (`<h3>`) jump outline without an `<h1>/<h2>` visible** — `SearchBox.tsx:279-281, 345-347`
    The `<h2 id={titleId}>Search</h2>` is visually hidden (sr-only). Group headings are `<h3>`. This is fine structurally (h2 precedes h3) but the visually-hidden h2 is fine. No action.

11. **`aria-label` on each `<section>` duplicates the `<h3>` text** — `SearchBox.tsx:340-343`
    `<section aria-label={KIND_LABELS[group.kind]}>` plus `<h3>{KIND_LABELS[group.kind]}</h3>` inside. `aria-label` overrides the heading for AT landmark naming, which is redundant here. Drop the `aria-label` — the h3 names the region implicitly via `aria-labelledby` convention, or explicit `aria-labelledby={groupHeadingId}`.

### Verified working

- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` → resolves to visually-hidden "Search" title ✓
- Focus on input when overlay opens ✓
- Focus restored to trigger button on Escape ✓
- `/` opens overlay, guarded against typing in input/textarea/contentEditable ✓ (SearchBox.tsx:130-152)
- Escape closes from input ✓
- ArrowDown / ArrowUp / j / k all move `aria-activedescendant` correctly ✓
- 8 options rendered with unique stable ids (`${listboxId}-option-${hit.id}`) ✓
- `role="option"` + `aria-selected` per row ✓
- Trigger button `:focus-visible` ring (outline 2px var(--accent)) ✓ `SearchBox.css:43-47`
- Active row visible indicator: background change + 2px outline + border-left color ✓ `SearchBox.css:254-263` — not color-shift-only
- Body scroll lock ✓ `SearchBox.tsx:156-163`
- `@media (prefers-reduced-motion: reduce)` disables fade-in animation + transitions ✓ `SearchBox.css:338-347`
- Icons marked `aria-hidden="true" focusable="false"` ✓
- `<kbd>` keybind hint marked `aria-hidden` (AT reads label instead) ✓
- Row height 81/85 px — far exceeds 44 px AA tap target ✓
- Active row title `#ededf5` on `#1c1c2a` ≈ 14:1 ✓ (title contrast is excellent; excerpt is the problem — see #8)

## Scores

1. **Dialog landmark: 10/15**
   Role/modal/labelledby all correct (+10). Background not inert while open is a -5 deduction because `aria-modal` alone leaks virtual-cursor navigation to background in several AT stacks. This is a real escape from the modal, not a theoretical nit.

2. **Focus management: 11/15**
   Focus on open ✓, focus restore on close ✓. But Tab is pinned to input → Close button unreachable by Tab — not a classic trap failure (Escape works) but focus cycle is broken. -4.

3. **Listbox/option pattern: 11/15**
   Options/ids/aria-selected/aria-activedescendant all wired correctly and verified updating on key events (+12). But `aria-activedescendant` on a plain `<input>` without `role="combobox"` + `aria-expanded` + `aria-autocomplete` is non-standard combobox pattern. -4.

4. **Keyboard navigation completeness: 12/15**
   `/` open, Escape close, arrows + j/k + Enter all work and verified. -3 because Tab does not cycle to close (same root cause as focus management).

5. **Visible focus indicators: 5/10**
   Trigger button ring ✓, active row highlight ✓ (background + outline + border-left, not color-only). Input explicitly sets `outline: none` in `:focus-visible` — the one focusable control inside the dialog has no focus ring. -5.

6. **Screen reader announcements: 3/10**
   No `role="status"` / `aria-live` on empty/no-results text, no result-count announcement region. Only existing aria-live on page is from elsewhere (RouteAnnouncer). Users get silence during the core search interaction loop. Route navigation on Enter will be announced by existing RouteAnnouncer (+3 for that).

7. **Tap target size: 1/5**
   Desktop trigger 117×36 (height <44), mobile trigger 36×36 (both dims <44), close button 36×28 (height <44). Row height 81/85 ✓. Three tap-target failures. +1 because rows pass.

8. **Color contrast: 5/10**
   Active row background + title: excellent. Border/outline visibility: excellent. Placeholder fails AA in both themes. Row excerpt fails AA in both themes. -5.

9. **prefers-reduced-motion: 5/5**
   `@media (prefers-reduced-motion: reduce)` covers backdrop fade + trigger/row/close transitions. Clean.

## Total: 63/100

## Verdict: 🔴 FAIL

**Top a11y concern:** The input has no visible focus ring (`.search-dialog__input:focus-visible { outline: none }`). Combined with the unreachable Close button (Tab pinned), keyboard-only sighted users get a dialog where the only focusable control is invisibly focused and the only other actionable affordance is Tab-unreachable. That's the hard fail.

**Fix priority for iteration:**
1. Restore input focus ring (delete line `SearchBox.css:174-176` or replace with a ring on the `.search-dialog__inputRow` container).
2. Fix focus trap: cycle input ↔ close instead of pinning (`SearchBox.tsx:209-218`).
3. Add `role="status" aria-live="polite"` wrapper around the empty/no-results region + a sr-only "{n} results" line.
4. Set `inert` on app root when `open=true` (`SearchBox.tsx:156-163` is the useEffect to extend).
5. Bump trigger + close to ≥44×44 on mobile (`SearchBox.css:77-86, 178-194`).
6. Swap `--fg-muted` → `--fg-secondary` for placeholder + row excerpt.
7. Promote input to proper combobox: add `role="combobox" aria-expanded={open} aria-autocomplete="list"` on the `<input>` (`SearchBox.tsx:299-312`).
