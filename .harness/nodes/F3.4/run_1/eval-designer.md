# F3.4 Character Re-Review — Designer

Reviewing the AFTER state as captured in `.harness/nodes/F3.3/run_1/screenshot-character-fixed.png` against the F3.2 FAIL (59/100). The screenshot was rendered from commit `a78a1e3` (F3.3 fix). Note: `Character.tsx` has since been edited further (0.54 head widen, pink hair bow) but those edits are NOT in the AFTER screenshot — they will be judged in a later loop.

## What changed since F3.2
- **Outlines everywhere**: `<Edges>` now on head upper/jaw, hair cap/tuft/fringe, body top/mid, scarf, both arms, thighs, shins, shoes. F3.2 had 3 meshes outlined; F3.3 has ~14. Theme-aware `EDGE_DARK #0a0a14` (bumped darker from #1a1a2e) in dark theme.
- **Chibi-ish head**: head upper 0.46 × 0.36, jaw 0.42 × 0.16 — vs shoulder 0.42. That's a 1.10× head-to-shoulder ratio. Bigger than F3.2's 1:1, but still shy of the 1.2–1.4× chibi target the F3.2 review explicitly asked for.
- **Lab coat hero element**: new white 0.42 × 0.40 × 0.10 box at `[0, 1.06, 0.09]` on the FRONT of the torso only. Theme-aware white/cream.
- **Legs restructured**: thigh 0.14×0.30 → shin 0.12×0.18 with a darker shin tint. Kills the old stubby ankle block.
- **Tint table extended** to cover every mesh (thigh/shin/shoe L/R separately) instead of just 8 entries.

## Material Variation (15)
🟡 Score: 10/15
- Tint table doubled in coverage (15 entries vs 8), so per-cube jitter now touches every primitive. Still ±4% L which is still sub-pixel at follow-cam distance. No structural change to how materials actually read.
- Still zero specular/roughness variation — every mesh is `meshPhongMaterial flatShading` with default shininess (except shoes at 60, which the screenshot can't confirm). Hair is uniformly matte.
- The BIG material win that would land — a genuinely different surface class (emissive accent, metalness on shoes, fabric weave on coat) — is absent. Coat is just another flat phong box.
- +1 vs F3.2 for broader tint coverage; still capped in the yellow zone because the craft payoff is still invisible.

## Edge / Silhouette Pop (15)
🟡 Score: 11/15
- Big structural improvement: nearly every mesh has Edges, and EDGE_DARK was pushed from `#1a1a2e` → `#0a0a14` for better contrast against dark ambient. This is the single most-impactful fix.
- But looking at the AFTER screenshot: I can BARELY see outline lift on the character. The figure still reads as a yellow-and-dark blob against the yellow door frame. The outlines exist in code but aren't visually separating the character from the background in situ. Likely because `#0a0a14` is still darker than the dark floor, so outlines blend into shadow instead of popping.
- **The back-silhouette problem from F3.2 is NOT solved.** Player sees the back 90% of the time. The back is: flat yellow body + dark legs + dark hair. Outlines help but there's still no distinctive shape cue from behind.
- +3 vs F3.2 for coverage, held back because the contrast-against-dark-background gap is only half-closed.

## Proportions (15)
🟡 Score: 10/15
- Head upper 0.46 wide vs shoulder 0.42 = **1.10× ratio**. F3.2 asked for 1.2–1.4×. This is an improvement from 1:1 but it **misses the target**. At game distance the difference between 1.0 and 1.1 is ~1 screen pixel — not enough to cue "chibi mascot."
- Leg restructure (thigh → tapered shin) is a real win, but at 40px tall total body the 0.14→0.12 width delta is again sub-pixel.
- Arms still hang straight at the sides, still no bend, still "toy soldier." F3.2 flagged this; F3.3 didn't address it.
- Head-to-body height ratio is unchanged — still an adult-mini stack, not a baby-stack-on-top.
- +1 vs F3.2 for direction, still yellow because the chibi cue doesn't land at game distance.

## Micro-animations (15)
🟡 Score: 10/15
- No code changes to the animation layer between F3.2 and F3.3. Blink/sway/swing/bob/tilt unchanged. Hair sway still ±0.06 rad on a now-slightly-larger cap. Same score as F3.2 is correct.
- The lab coat front and arms sitting at `x=±0.32` (outside the body) do open the possibility of silhouette-change-under-motion, but that's a structural byproduct, not a new animation.

## Color Harmony (10)
🔴 Score: 5/10
- **The hero-color problem from F3.2 is NOT solved and is arguably worse.** The body is still yellow. Yellow still camouflages into the yellow-gold door frame in the background. The lab coat — which SHOULD be the new hero color — is on the FRONT only, and the screenshot shows the character from the BACK. So in situ there is still no readable hero color.
- The white lab coat would be a good hero color IF it wrapped the torso (front + back + sides). Front-only means it's invisible for the most-common camera angle. This is a hero element that fails on its own terms.
- Pink scarf, pink blush, red shoes, yellow body, dark legs, dark hair = six competing accents on a 40px sprite. No hierarchy.
- -1 vs F3.2 because the fix introduced a new hero element that doesn't actually appear from the back.

## Accent / Polish (10)
🔴 Score: 5/10
- Outline coverage is the only polish win that reads at game distance. That's real — +1 from F3.2's 4/10.
- The lab coat does nothing from behind. The toe-caps still have the same dark-on-dark contrast problem (TOE_CAP `#b02940` vs `COLORS.red`) F3.2 flagged — unchanged in F3.3.
- No signature prop/hat/badge yet (the pink hair bow exists in the uncommitted working copy but is NOT in the reviewed screenshot). F3.2's #2 ask — "ONE readable signature element at 40px" — is technically answered by the lab coat but only from 3 of 8 viewing angles.
- No pattern, no emissive glow anywhere, no rim light. The dark theme is doing no favors for accent reads.

## Character Refinement (10)
🔴 Score: 5/10
- "Scientist" reading is attempted via lab coat, which is the right instinct for "Suri's Lab." +1 over F3.2 for having a conceptual hook at all.
- But in the AFTER screenshot the character still reads as "yellow voxel NPC" not "Suri the protagonist." Zero personality differentiation from behind.
- Face blush/mouth details are still on the front and still sub-pixel. No expression signal.
- Still no signature silhouette element visible from the back. The F3.2 top-3 ask #2 is partially answered and partially missed.

## Performance Feel (10)
🔵 Score: 9/10
- Scene is still crisp, no shimmering visible, text UI sharp. No z-fighting despite the new coat sitting 0.01 proud of the body front (tight but clean).
- Roughly 6 new meshes added (coat + extra leg segments + bow not yet shipped). Still trivial draw-call count. No performance concerns from the still.

## Total: 65/100
## Verdict: 🟡 ITERATE (up from 59 but well below 85)

F3.3 moved the needle ~6 points. Real wins: comprehensive outline coverage, leg restructure, broader tint table, a conceptual hero hook (lab coat). But the three core F3.2 failures are only partially fixed:

1. **Chibi proportions landed at 1.10×, not 1.2–1.4×.** Half-fix.
2. **Silhouette outlines exist but still don't separate the character from the dark background.** Partial fix — coverage yes, contrast no.
3. **Hero element is front-only, invisible from the back-camera that dominates play.** Unfixed in spirit.

## Remaining gaps for the rest of the polish loop

1. **Wrap the hero color around the torso.** The lab coat MUST be visible from the back, or the hero-color problem is unsolved. Options: (a) replace the yellow body with a full white/cream lab coat that fully wraps the torso block, (b) add back/side panels to the existing coat mesh, (c) swap the body hero color entirely (teal/lavender) and let the coat be a secondary highlight. The uncommitted hair bow helps from above but does not replace a back-readable torso hero.
2. **Push the chibi ratio to at least 1.25×.** Head upper to 0.52–0.56 wide. The current 0.46 is a timid half-step. At 40px tall, you need the head-to-shoulder delta to be at least 2 screen pixels or the cue is lost. (The uncommitted working copy already does 0.54 — ship it.)
3. **Fix outline contrast against dark floor, not just dark ambient.** `#0a0a14` is darker than the floor shadow it's sitting on. Either lighten to `#4a4a6a`-ish in dark theme (counter-intuitive but correct — outlines need to be LIGHTER than the background to separate, not darker) or add a subtle rim light from behind the character.
4. **Add bend to the arms.** The toy-soldier pose is still there. 10° forward bend at the elbow, or rotate the whole arm 8° forward from the shoulder — cheap, readable, breaks the stiff rectangle.
5. **Pick ONE accent color and kill the others.** Right now pink (scarf + blush + optional bow), red (shoes + mouth), yellow (body), white (coat front) all fight. Pick pink OR red as the accent and convert the other to a neutral. Color hierarchy is cheaper than more geometry.
6. **Kill the toe-cap dark-on-dark.** `#b02940` on `COLORS.red` was flagged in F3.2 and is still in the F3.3 code. Either make toe-caps much lighter (cream) or delete them — they're pixel debt that pays nothing.

Ship the next fix and re-shoot the screenshot from the same back-camera angle. If the back-silhouette hero color and the 1.25× head ratio both land, this jumps to ~80. Adult-mini proportions persisting into F3.4 would be a hard fail.
