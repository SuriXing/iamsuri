# Designer Review — R3.1 Ceiling

## Verdict
ITERATE

The numerical thresholds pass, but the visual story doesn't hold up in three places: light theme washout, ceiling/wall/floor monochrome stacking, and a look-up screenshot that — whatever its cause — does not read as "enclosed room overhead." OUT-1's number is green; OUT-6's intent (visually verified in BOTH themes) is amber.

## Findings

### 🔴 Light theme ceiling reads as more sky, not as a ceiling
**Issue:** `#e8dcb8` (tan) at brightness 225.36 sits within ~10 points of the off-white page/sky background. In `look-up-myroom-light.png` the ceiling is a near-invisible band along the bottom edge — there is no perceivable "lid" to the room. The emissive `#a08868 @ 0.5` adds a soft warm glow but doesn't establish a material boundary. Compared with the dark-theme version (where the brown clearly reads as wood against the navy sky), the light theme fails the "non-flat, theme-coordinated, reads as ceiling" intent of OUT-1, even while it passes the ≥180 brightness check.
**Evidence:** `screens/look-up-myroom-light.png` — visually compare against `screens/look-up-myroom-dark.png`. The dark version has clear figure/ground; the light version is ground-on-ground.
**Fix:** Drop the light tone two steps darker and slightly more saturated (e.g. `#c9a96e` honey-oak) and/or kill emissive in light theme (`emissiveIntensity: 0` when `theme === 'light'`) so the under-ceiling fill light alone shapes the surface. Goal: brightness ~190–200, not 225.

### 🔴 look-up dark screenshot only fills the lower ~45% of the frame
**Issue:** `look-up-myroom-dark.png` shows a sharp horizon roughly mid-screen with starfield filling everything above. At FP eye height ~1.6m with ceiling at y=2.0 (0.4m above eye) and ROOM_SIDE ≈ 8.2m, a true straight-up look should subtend ~84° in every direction — the ceiling should fill the entire FOV. What I see is the camera pitched ~45° upward, not 90°. Either the harness isn't actually pointing the camera straight up (test issue, not ceiling issue) OR the ceiling's lateral extent is somehow wrong. As a designer reviewing the artifact in front of me: this image absolutely does not communicate "enclosed room with a ceiling overhead." It communicates "skylight." That is not the architectural feel the brief asked for.
**Evidence:** `screens/look-up-myroom-dark.png` — the toast "Welcome to Suri's" sits at the visual horizon; sky+stars dominate the upper half.
**Fix:** Before iterating on materials, **resolve the camera pitch ambiguity in the harness first** — capture a verified pitch=+90° look-up shot. If, with true straight-up pitch, the ceiling still doesn't fill the frame, extend `ROOM_SIDE` margin or raise the camera FOV check. If the harness was correct and pitch really was 90°, then `CEILING_Y = 2.0` is too high relative to FP eye height — try y=1.95 or shrink eye height by 0.1. Do not accept this screenshot as evidence of a working ceiling.

### 🟡 Ceiling color is the same brown family as the wood floor and warm walls — room reads monochrome
**Issue:** In `look-down-myroom-dark.png` the strip of ceiling visible at the top is the same warm orange-brown as the floor planks and very close to the wall accent. The bed (pink) is the only chromatic break; everything architectural is one warm-brown family. This works *for myroom specifically* (cozy/bedroom mood) but the same `#8b5e2e` is applied to all four rooms. Productroom (blue), bookroom (green), idealab (gold) will get a warm brown ceiling that clashes — especially productroom blue, which goes muddy under warm bounce.
**Evidence:** `screens/look-down-myroom-dark.png` (top strip) + diff.patch line 32–35 (single global color, no per-room override).
**Fix:** Either (a) make the ceiling a neutral that coordinates with all four palettes — a desaturated warm gray like `#5a4a3e` dark / `#d4cabb` light — or (b) per-room tint via `ROOMS[i].accent` mixed 30% into the base brown. Option (a) is KISS-correct; option (b) is more cohesive but adds wiring. Recommend (a).

### 🟡 Light vs dark: room interior is nearly identical in look-down screenshots
**Issue:** `look-down-myroom-light.png` and `look-down-myroom-dark.png` look essentially identical except for HUD overlays. The 3D scene's mood does not respond to theme — same warm orange dominance, same shadow weight. This means OUT-6's "visually verified in BOTH themes" passes mechanically but the light theme isn't earning its existence inside the room.
**Evidence:** Side-by-side `look-down-myroom-{light,dark}.png`.
**Fix:** Bump the under-ceiling fill light intensity from 0.25 → 0.4 in light theme only, and lift ambient in light theme. (Out of strict scope for this ceiling diff but worth flagging — a follow-up R3.x ticket.)

### 🔵 Emissive on a "lit wood" surface is conceptually wrong
**Issue:** Wood doesn't emit light. Using `emissive` to fake a glow makes the ceiling read like a paper lantern in dark theme — fine as a stylistic choice for SuriWorld's flat-shaded look, but it bypasses the under-ceiling pointLights doing the actual work. If the pointLights at intensity 0.25 are insufficient, raise them; don't paint glow into the material.
**Evidence:** `Ceiling.tsx:55–56` `emissive={emissive} emissiveIntensity={0.5}`.
**Fix:** Try `emissiveIntensity: 0` and bump under-ceiling pointLights to `0.4`. Validates whether the lights alone do the job. If they do, the material is honest.

### 🔵 Hallway ceiling rendered as two crossed boxes overlaps at center
**Issue:** Two `HALL_LEN × HALL_WIDTH` boxes crossed at origin produce a doubled-thickness intersection at the central cross — invisible from below but a z-fighting risk if anything else lives at y=2.0 there. KISS: use one extruded plus-shape or accept the overlap (current choice).
**Evidence:** `Ceiling.tsx:60–80`.
**Fix:** Leave it; nit only.

## What works
- Dark-theme wood color `#8b5e2e` is a genuinely good choice for myroom — warm, cozy, reads as material.
- Box geometry over plane (with the depth-write reasoning in the file header comment) is the right architectural call. Stars occluding correctly per `mid-tween-dark.png` confirms it.
- `renderOrder = -1` + depth write strategy is clean and the mid-tween screenshot is the strongest evidence in this batch — it shows exactly the behavior OUT-4 wanted.
- Under-ceiling fill light intensity 0.25 doesn't muddy the room — `look-down-myroom-dark.png` (81.10) is brighter than baseline (64.19) but the +26% lift reads as "lived-in" not "blown out." Brief explicitly allows this.
