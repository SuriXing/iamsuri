# F3.2 Character Review — Designer

## Visual Impression
Reads as a tidy little voxel figurine — dark hair, yellow top, red shoes — but at the in-game camera distance she's a ~40px silhouette that feels more "placeholder cube stack" than crafted mascot. Recognizable as a character, not yet charming.

## Material Variation (15)
🟡 Score: 9/15
- The deterministic ±4% L tint table is a smart move, but at this camera distance the per-cube jitter is completely invisible — every yellow face reads as one flat slab.
- No specular / roughness contrast between hair, skin, fabric, and shoes. Everything is uniformly phong-matte, so "crafted" never lands.
- Blush emissive is a good instinct but it's buried at 0.3 and the face is 6px tall — invisible in situ.

## Edge / Silhouette Pop (15)
🟡 Score: 8/15
- Outline edges exist on head, hair cap, body top — good. But only 3 meshes get them. Legs, arms, shoes, jaw, collar all un-outlined, so the lower half of the body dissolves into a mushy dark blob against the dark floor.
- EDGE_DARK (#1a1a2e) is nearly identical to the dark theme ambient — edges barely separate from background. Needs higher contrast or a lighter outline color in dark theme.
- Silhouette from the back (which is what the player sees 90% of the time) is a rectangle with hair on top. Zero read.

## Proportions (15)
🟡 Score: 9/15
- The shoulder-wide-top / narrow-waist stack is a nice touch and does read subtly.
- Head is ~0.42 wide vs body ~0.42 wide → 1:1 head-to-shoulder. For a chibi/mascot look you want head clearly wider than shoulders (1.2–1.4×) to get that "cute" cue. Right now it reads as "adult miniature," not mascot.
- Legs feel stubby and the ankle taper is too subtle to see at this scale.
- Arms hanging straight at the sides with no bend = stiff toy soldier pose.

## Micro-animations (15)
🟡 Score: 10/15
- Can't judge motion from a still, but code shows: blink (4s/120ms), hair sway (±0.06 rad), arm swing, idle bob, idle head tilt, smooth facing lerp. That's a solid checklist.
- Concern: blink on a 6px eye is invisible. Hair sway at ±0.06 rad on a 0.44-wide cap is a ~1-pixel shift on screen. These animations exist but won't be felt — the polish tax is paid without the polish payoff.
- No squash-and-stretch on the bob, no foot step/lift, no secondary motion on the scarf. The "alive" bar is not cleared.

## Color Harmony (10)
🟡 Score: 6/10
- Yellow + dark hair + red shoes + pink collar = four primary accents competing on a tiny sprite. No clear hero color.
- The yellow body is the loudest element but it's also visually close to the gold building signage in the background — the character camouflages into her own world instead of popping.
- Pink collar is a smart accent in theory but it's a 0.05-tall strip — you can't see it at all in the screenshot.

## Accent / Polish (10)
🔴 Score: 4/10
- Zero readable accents at game distance. Blush, collar, toe-caps, hair highlight, eye blink — all designed, none visible.
- No hat, no prop, no weapon, no necklace, no belt, no pattern on the shirt. Nothing that says "this is *Suri*, not a generic NPC."
- The toe-cap idea is good but TOE_CAP (#b02940) vs shoe (COLORS.red) is a dark-on-dark contrast that disappears.

## Character Refinement (10)
🔴 Score: 4/10
- Still reads as "3rd person placeholder" rather than "the protagonist of Suri's Lab."
- No personality signal: no expression variation, no signature silhouette element (twin tails? lab coat? goggles? bow?). The spec said "Suri" and we got "generic voxel girl."
- Face at this scale is a black stripe with two dots. Not refined.

## Performance Feel (10)
🔵 Score: 9/10
- Screenshot is sharp, no visible shimmering / z-fighting, no overdraw artifacts, text UI crisp. The scene feels solid and responsive.
- Shadow disc tracks cleanly. No obvious jank signals in the still.

## Total: 59/100
## Verdict: 🔴 FAIL
## Top 3 visual gaps to fix in F3.3
1. **Silhouette is dead at game distance.** Outline every mesh with a high-contrast edge color (EDGE_LIGHT even in dark theme, or at least #6a6a8a). Bump head-to-shoulder ratio to ~1.3× so she reads as a chibi mascot from the back, which is the only angle the player actually sees.
2. **Give her ONE signature element that's visible at 40px.** A bright bow, a lab coat hem, a backpack, antenna hair, a glowing badge — something that survives the pixel budget and says "Suri." Right now the details (blush, collar, toe-caps, blink) are all sub-pixel and get zero return on effort.
3. **Color hierarchy: pick a hero color and commit.** Yellow body is camouflaging against gold signage. Either swap the body to a color that contrasts the world (teal? lavender?) or darken the environment gold so she pops. Also add one bright emissive accent (hair clip? scarf?) so the eye has a focal anchor.
