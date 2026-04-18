# R3.7 Final Acceptance — eval

**Verdict: ITERATE** (5/6 PASS, 1 FAIL: OUT-2 brightness +76% over baseline)

## Per-OUT results

| OUT | Status | Evidence |
|-----|--------|----------|
| OUT-1 | ✅ PASS | dark 69.50–78.75 (≥30 ✓), light 182.98–189.14 (≥180 ✓) |
| OUT-2 | ❌ FAIL | 112.98 vs baseline 64.19 → +76.0% (band ±10%) |
| OUT-3 | ✅ PASS | down 54.50–121.81 (≥10 ✓); up bright_count 0 across all 4 doorways (≤5 amended ✓) |
| OUT-4 | ✅ PASS | 30s soak look-up bright_count=0 — no piled particles on ceiling. Code grep confirms StarField gate removed. |
| OUT-5 | ✅ PASS | crosshair `focused` class, bg=`rgb(34,211,238)` cyan, scale 1.6×, tooltip active, `role="status"` `aria-live="polite"`, sessionStorage='1' |
| OUT-6 | ✅ PASS | 390×844: zero overlaps among `.back-btn`, `.exit-hint`, `.interact-tooltip` |

## Build / lint
- `npm run build` ✓
- `npm run lint` ✓ (silent)
- No console errors captured by Playwright `pageerror` handler (errors=[]).

## OUT-2 analysis (why FAIL)

Baseline `/tmp/sw-fp-down.png` was captured **pre-R3** when no ceiling existed.
Adding any opaque ceiling at y≈2.0 + under-ceiling fill light + emissive material
fundamentally raises floor luminance (more reflected/emissive bounces reach the
floor). Lowering emissive 0.4→0.25 dropped OUT-1-light below the ≥180 threshold,
so the two outcomes are in direct tension at this lighting tuning.

The spec's reverse intent — *"the ceiling fix MUST NOT seal the lights above it"*
— is preserved (the room got **brighter**, not dimmer). The literal ±10%
threshold cannot be hit without removing the ceiling that OUT-1 mandates.

**Recommendation for next iteration:** rebase the OUT-2 baseline by re-capturing
`sw-fp-down.png` against the new ceiling architecture, OR reframe OUT-2 as a
**lower-bound** check (`new ≥ baseline × 0.9`) since brighter is acceptable.

## Honest verification gaps

- **OUT-4 r3f scene introspection failed**: tried walking `canvas.__r3f` to count
  Particles instances/positions in the live scene; r3f did not expose `__r3f`
  on the canvas DOM node in dev. Fell back to visual proof (30s soak, look up,
  count bright pixels on ceiling = 0). Sufficient evidence the clamp/respawn
  works, but no direct numeric assertion on `py[i]<1.95`.
- OUT-2 brightness sample uses 200×200 center crop at FP-eye position; angle
  reconstruction matches baseline pose (yaw=0, pitch=-1.08, charPos=(-3.7,-2.0))
  via direct store mutation rather than mouse drag — equivalent camera state.
