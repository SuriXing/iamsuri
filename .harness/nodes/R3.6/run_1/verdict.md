# R3.6 Verdict — ITERATE

a11y + pm both ITERATE. Findings deferred to R3.7.

## 🔴 Blocking

1. **Tooltip fires under intro modal — burns its one-shot before user sees it** (pm)
   `crosshair-focused.png` shows the Press-E tooltip rendering while the intro "CLICK ANYTHING TO READ" modal is open. The 2.5s timer + sessionStorage gate consume the only chance to show it. First-time users will likely never see the hint — recreating the original "no hints" complaint.
   Fix options:
   - Gate `shouldShow` on `!introModalOpen && !anyModalOpen` (preferred — defer trigger until UI is clear)
   - Show on first N=3 focuses instead of single one-shot (lower-touch fallback)
   - Both — defer first show AND retry up to 3 times

## 🟡 Should-fix

2. **No `prefers-reduced-motion` guard on crosshair scale/transition** (a11y)
   Codebase already respects PRM elsewhere (`.room-entry-toast` uses `@media (prefers-reduced-motion: reduce) { animation: none; }`). The 1.6× scale + 120ms transition should be wrapped similarly so users with motion sensitivity get instant snap or no scale.
   Fix: add `@media (prefers-reduced-motion: reduce) { .crosshair.focused { transition: none; transform: translate(-50%, -50%); /* or keep 1.6× sans transition */ } }`.

3. **Tooltip not announced to screen readers** (a11y)
   Transient text-only hint is exactly the SR use case. Add `role="status" aria-live="polite"` to the `.interact-tooltip` wrapper element.

## 🔵 Notes / what works

- Color-blind safety: gold→cyan crosses the yellow-blue axis, safe for protanopia/deuteranopia.
- Mobile overlap (OUT-6 partial): tooltip ~400px clear of EXIT ROOM and exit-hint at 390×844 — passes.
- 1.6× scale provides a non-color signal — color-blind users get the size cue.
- Crosshair correctly has NO ARIA (it's a game reticle, not interactive UI).

## Does this solve the original "no hints" complaint?
**Partially.** The mechanism is right (visual feedback when aiming at interactable + one-shot hint). But the tooltip-under-modal bug means the discoverability win doesn't reach first-time users. Once that's fixed in R3.7, this should fully address in-room interaction discoverability.

## Decision
ITERATE → defer to R3.7. Continue to R3.7 fix-and-accept.
