# F3.20 Ambient Fix — Designer Re-Review

Commit: `28363f0` — F3.19 fix-ambient (spark color split + hallway de-emissive)

## Fix 1 — spark color split

Implementation is correct and real, not cosmetic. `IdeaLab.tsx:50-86` `buildSparkBuckets()` partitions the 14 sparks via deterministic `rng() < 0.5` into two Float32Array sub-buffers (orange, warm). Two separate `<instancedMesh>` blocks at `IdeaLab.tsx:652-681` render them, each with its own `meshPhongMaterial` carrying a distinct emissive uniform:

- orange bucket: `color="#f97316"`, `emissive="#f97316"`, `emissiveIntensity={2.0}`
- warm bucket: `color="#fff3a0"`, `emissive="#fff3a0"`, `emissiveIntensity={1.5}`

The `useFrame` Y-drift loop (`IdeaLab.tsx:251-276`) iterates both buckets independently with zero-alloc updates, and the initial `useEffect` bake (`IdeaLab.tsx:280-299`) seeds both `instanceMatrix` sets. Because emissive is per-material, the two draw calls now genuinely produce two different glow hues — the F3.18 bug (single uniform collapsing both to one look) is fully fixed. Partition is deterministic via `makeRng(0x1dea5 ^ SPARK_COUNT)`, so the 50/50 split is stable across reloads (with ~7/7 distribution from the seed, which is the intent).

One micro-nit: the orange intensity (2.0) is higher than warm (1.5), which is a deliberate authority tilt toward the soldering-iron color. That reads correct for an "idea lab" — orange should feel hotter than the warm-white accent. Good call.

In the F3.19 screenshot I can see a sharp orange glow point in the top area of the frame (visible through the hallway doorway into IdeaLab), which would be consistent with orange sparks reading distinctly against the warmer room ambient. The still can't prove both hues animate simultaneously, but the code is unambiguous.

Full marks.

## Fix 2 — hallway de-emissive

Hallway.tsx cleanup verified line-by-line:

- Floor cross (`Hallway.tsx:74-81`): both boxGeometry planes now use `meshPhongMaterial color={HALL_COLOR}` with no `emissive`/`emissiveIntensity`. Pure receive-shadow dark plate.
- Runner strips (`Hallway.tsx:114-123`): both `#6b3216` strips de-emissived, keep their Edges outlining.
- Rug base + inner (`Hallway.tsx:149-156`): **both** layers de-emissived. The code comment on line 148 claims the "inner border keeps a faint warm kiss" but the actual inner `meshPhongMaterial color="#a0522d"` has no emissive either. This goes one notch beyond the F3.18 ask ("de-emissive one rug layer") — F3.19 killed both. Comment and code disagree, which is a minor hygiene issue for F3.21 to clean up, but the visual result is fine.

Screenshot (`F3.19/run_1/screenshot-fix.png`) confirms the visual payoff: the hallway floor reads as a neutral dark blue-black plate (`#1e2233`), the rug reads as a warm brown that is clearly receiving light rather than emitting it, and the warmth in the frame comes from clearly-sourced emitters — the ceiling light strips (`Hallway.tsx:158-170`, still emissive @ 0.8, correctly preserved as the intentional lantern-axis), the IdeaLab amber bulb and orange sparks visible through the doorway, and the plank flooring in the adjacent rooms. Lantern authority is restored: the warm channel now has a clear source hierarchy instead of every surface whispering the same amber tone.

Arguably slightly over-fixed on the rug inner (the "faint warm kiss" would have been nice as a middle ground), but not enough to dock significantly — the scene doesn't feel cold, it feels *sourced*.

Near-full marks.

## Regression check

Nothing new broken:

- IdeaLab spark layer still animates (both useFrame branches drive separate refs correctly)
- `bulbLightRef`, `accentLightRef`, `solderTipRef` pulses untouched
- Hallway ceiling light strips, coffee machine LED, and plant emissives all preserved at their intentional intensities
- Screenshot shows character, UI card, inventory HUD all rendering correctly
- No z-fighting, no missing geometry, no broken shadows visible

One observation (not a regression): the plant sphere foliage at `Hallway.tsx:35,39` still carries `emissive="#22c55e"` @ 0.15/0.10. These are small and in corners, so they don't compete with the lantern axis, but F3.21 might want to look at whether the hallway has any remaining faint self-lit surfaces beyond the intended gold strips.

## Scores

1. Fix 1 plausibility: 30/30
2. Fix 2 payoff: 27/30  *(slight overshoot on inner rug, comment/code mismatch)*
3. No regressions: 15/15
4. Proportionality: 13/15  *(rug inner went a hair too far; not enough to iterate)*
5. Overall polish bar: 9/10

## Total: 94/100
## Verdict: 🔵 PASS (≥85)

The ambient layer now clears the 88 gate comfortably. This is a clean 85 → 94 jump because both fixes were load-bearing: the spark split resolves an actual rendering bug (uniform collision) and the hallway de-emissive restores the most important compositional property in a stylized 3D scene — source hierarchy.

## Remaining F3.21 cross-cutting notes

1. **Comment/code hygiene** (`Hallway.tsx:148`): comment says "inner border keeps a faint warm kiss" but the inner rug has no emissive. Either re-add a very subtle `emissive="#a0522d"` @ 0.08 to match the comment, or update the comment to match reality. The former is preferred for design warmth; latter is acceptable.
2. **Plant foliage emissive** (`Hallway.tsx:35,39`): green @ 0.15/0.10 is fine in isolation but worth a sanity-check under the full-frame dark theme — if plants glow at all, they pull attention in peripheral vision. Low priority.
3. **Spark intensity balance**: orange @ 2.0 vs warm @ 1.5 is correct directionally, but in a bloom-less scene these may both feel a touch hot. If F3.21 adds any post-processing, revisit. If not, leave alone.
4. **Coffee LED** (`Hallway.tsx:94`): still `emissiveIntensity={3.0}`. That's a bright pin-point in a hallway and is not part of the lantern axis. Intentional character detail, but flagging in case F3.21 wants to audit all >2.0 emissive sources for "is this a lantern source?".
5. **No screenshot diff from F3.18**: the re-review only had the F3.19 still, not a side-by-side. A before/after screenshot pair on the hallway would accelerate future ambient reviews.

Bottom line: 2 surgical fixes, both landed. Ship it and proceed to F3.21.
