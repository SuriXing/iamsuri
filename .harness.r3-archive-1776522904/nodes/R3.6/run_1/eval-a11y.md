# A11y Review — R3.5 Crosshair + Tooltip

## Verdict
ITERATE

## Findings

### 🟡 Missing `prefers-reduced-motion` for crosshair scale — `world3d.css:382-389`
**Issue:** `.crosshair` has a 120ms `transform` transition and `.focused` applies `scale(1.6)`. Users with vestibular disorders (and the file already respects PRM elsewhere — see `.room-entry-toast` at line 626) get an un-suppressed scaling animation in the dead-center of their field of view, every focus event. Inconsistent with the codebase's own pattern.
**Fix:** Add `@media (prefers-reduced-motion: reduce) { .crosshair { transition: none; } .crosshair.focused { transform: translate(-50%,-50%); } }` — keep the color shift, drop the pulse.

### 🟡 Tooltip not announced to AT — `InteractTooltip.tsx:60`
**Issue:** Wrapper `<div>` has no `role="status"` / `aria-live="polite"`. The hint is transient (2.5 s, dismissed on E), so SR users get zero signal that "E does something here." Even in a pointer-locked 3D game, the keybind hint is the one piece of *textual* info worth surfacing.
**Fix:** `<div role="status" aria-live="polite">…</div>`. Cheap, no behavior change.

### 🔵 Color pair is actually CB-safe — informational
**Issue (none):** Gold `#ffd700` → cyan `#22d3ee` sits on the yellow↔blue axis, which is preserved under protanopia/deuteranopia (the red-green axes are the broken ones). Combined with the 1.6× scale + glow-radius change, focus state is discernible by **shape AND hue** for all three common CVD types. Non-color signal is sufficient. ✅

### 🔵 Crosshair has no ARIA — correctly so
Pure decorative reticle, `pointer-events:none`, no interactive semantics. Adding `role="img"` would create SR noise on every frame of focus toggling. Leave as-is.

### 🔵 Mobile overlap (OUT-6) — clear at 390×844
Tooltip sits at `top:50% translate(-50%, 40px)` (~y=462 px). EXIT button now `top:12px` (~y=12-44 px). Exit-hint `bottom:16px` (~y=810-840 px). ~400 px of vertical clearance both directions. No overlap. ✅

### 🔵 `<kbd>` contrast — passes
White text on rgba(255,215,0,0.2) over `#1a1a2e` backdrop computes to effective ~#3d3a1f bg → contrast >7:1. Fine.