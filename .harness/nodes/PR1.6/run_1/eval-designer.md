# PR1.5 Designer Review (run_1)

## Scope

Reviewing PR1.5 "project-stations" through the **designer** lens — OUT-1
composition depth, OUT-2 station distinctness, OUT-5 palette harmony,
OUT-6 brand voice, plus label legibility and station ↔ shell cohesion.
Colliders, perf, and depth-precision are owned by the frontend reviewer
(see `eval-frontend.md`); only called out here when they directly affect
visual reading. File under review:
`src/world3d/scene/rooms/ProductRoom.tsx` lines ~546–779 (the
`PROJECT_SHOWCASE_ENTRIES.map` block) compared against
`src/world3d/scene/rooms/BookRoom.tsx` as the cozy-hand-built gold
standard.

## Findings

### 🔴 D1 — Stations are clones with sprinkles, not "visually distinct" (OUT-2)

`ProductRoom.tsx:565–646` — every station shares the **same** silhouette:
`0.7 × 0.85 × 0.55` plinth, identical SLATE_MID body, identical SLATE_LIGHT
trim band, identical SLATE_DEEP foot kick, identical `0.85 × 0.55` bezel,
identical 4-tick "title block", identical brand-bar position, identical
plinth-front accent strip. The only deltas across the four stations are:

1. The emissive color of the screen face (`entry.accent`)
2. The emissive color of two small accent bars (`entry.accent`)
3. One ~0.1 m decorative prop on the plinth top (mug / sticky stack /
   trophy / book stack, lines 649–767)

From the door (~3.5 m away) the props occupy roughly 3–5 % of each
station's projected silhouette. The dominant visual signal is "row of
four identical slate boxes with different glow colors" — closer to a
trade-show product line-up than four distinct project shrines. OUT-2
literally says "Stations are arrayed left-to-right ... visually distinct
station with monitor + plinth + label" — bare minimum is met (each
station does exist) but the "distinct" word is weak.

**Reasoning:** Compare BookRoom — the bookshelf, the leaning ladder, the
green reading chair, and the side table all differ in *form*, not just
color. The player reads them as four different kinds of object even in a
black-and-white screenshot. Strip color out of the Product Room and the
four stations are indistinguishable.

**Fix suggestions (pick at least two):**
- Vary plinth heights ± 0.1 m so the row reads as a skyline, not a fence
  (e.g. `[0.85, 0.75, 0.95, 0.80]`). The hero of the row gets the
  tallest, anchoring the eye.
- Vary plinth widths or rotate stations 2 & 3 inward by ~8° so the row
  reads as a curve (already implied by the design-note: "arrayed
  left-to-right or in a curve").
- Make the decor BIGGER (currently ~0.1 m, push to 0.18–0.22 m so it
  reads from the door) AND attach decor to the *side* of the plinth, not
  just the top — e.g. a coffee cart with a kettle, a pinboard with
  paper, a trophy shelf with multiple cups, a leaning book ladder.
- Give one station a unique structural element (e.g. station 1 = open
  laptop + mug bench, station 4 = book-stack column instead of plinth).

### 🔴 D2 — Label is unreadable from the door (legibility)

Lines 627–635: the "title block" is four 0.08 × 0.02 m SLATE_DEEP boxes
laid in a row on a slate label plate. At ~3.5 m these don't read as
text — they read as a generic horizontal underline / progress bar. The
player has no way to know which station is *Problem Solver* vs *Mentor
Table* vs *Debate Coach* vs *Study Stack* before they walk up and press
E. That defeats the whole point of distinct stations: the user is
supposed to recognize "oh, *that* one is the debate project" from a
distance.

**Reasoning:** OUT-2 implies the label communicates identity. OUT-6
("hand-built voxel/low-poly aesthetic") doesn't forbid text — BookRoom
already uses `<Html>` from drei for the seat-read prompt; the
EnterPrompt3D for door labels uses the same pattern. A single drei
`<Html transform>` plate per station with the project title in the
existing UI font would be 4 extra Html nodes (cheap, off the GL hot
path) and immediately solves the read.

**Fix:** add per-station `<Html transform distanceFactor={4}>` with
`{entry.title}` text on the label plate, theme-aware color. Keep the
slate plate as the substrate. Drop the four meaningless ticks (lines
627–635) — they're noise without text.

### 🟡 D3 — Yellow + pink accents fight the cool-tech palette (OUT-5)

The four accents are `#22d3ee` cyan, `#22c55e` green, `#facc15` yellow,
`#fb7185` pink (sourced from `data/productRoom.ts:56–61`). Cyan + green
sit comfortably in the cool-slate base — both are blue-shifted, both
read as "tech glow". Yellow `#facc15` (saturated warm-warm) and pink
`#fb7185` (warm-coral) are the opposite temperature of the entire
room palette and the trophy + books place them at peak visual prominence
on the rightmost two stations.

The result on entry: the eye is dragged hard to the right side of the
room, breaking the symmetry and making the row feel "kindergarten" /
elementary-school-trophy-shelf rather than "startup war room". Brand
voice (OUT-6) wanted hand-built and editorial; this is closer to LEGO
Friends.

**Reasoning:** This is a **palette discipline** problem, not a color
identity problem. Each project legitimately deserves an accent — that's
fine. But emissive intensity 1.6 on the screen + emissive 1.4 on the
plinth strip + emissive 1.2 on the brand bar means each warm accent
gets *three* high-luma surfaces blasting it. Multiply that by saturated
yellow and saturated coral and the cool-tech base disappears.

**Value-tier check:** per station you have SLATE_DEEP / SLATE_MID /
SLATE_LIGHT / METAL on the structural mass — that's 4 tiers, OUT-5
satisfied for the *substrate*. The clash is purely the warm accents
overpowering the substrate, not a missing tier.

**Fix:**
- Desaturate the warm accents in the *room* (not in the data file —
  data accents are the brand truth, the room is just one display): map
  `facc15` → `#d4a843` (warmer slate-yellow), `fb7185` → `#c66f7e`
  (dusted coral). This pulls them ~30 % toward the slate axis.
- Drop emissive intensity on the plinth-front accent strip from 1.4 →
  0.6, and the brand bar from 1.2 → 0.5. Keep the screen at 1.6 — the
  screen is *supposed* to glow.
- Remove the plinth-front accent strip entirely (line 638–646). It
  reads as a kiosk LED strip and is the single biggest contributor to
  the trade-show-booth feel. The screen + brand bar already carry the
  per-station accent.

### 🟡 D4 — Composition: midground row is one flat plane, no depth staging (OUT-1)

All four stations sit at `stationZ = oz + 1.55` (line 552). The hero
focal piece is PR1.6 work, not yet present — so today the back half of
the room is: empty floor → flat row of stations at z=oz+1.55 → empty
back wall at oz+2.4. The midground is *one* slice, not staged. From the
door looking +z the player sees:

- Foreground: rug + planks (good)
- Mid-foreground: desk + dual monitors at oz-0.3 (good, BUT this is
  legacy from PR1.4 and the design-note says the desk is supposed to
  collapse into stations — it hasn't yet, see D6)
- Midground: 4 station row at oz+1.55 (single plane)
- Background: bare back wall (no hero — that's PR1.6)

The composition is currently *front-heavy* (desk eats foreground
attention) with a thin midground slice and an empty background. PR1.6
will fix the background; the question for THIS PR is whether the
midground plane is enough on its own. It isn't — the four stations all
front the same z line, monitors all at the same y (1.45), all facing -z.
It's a yardarm of flags, not a composed scene.

**Reasoning:** OUT-1 wants "deliberately composed scene with foreground
... midground ... background. No bare floor, no flat walls." The
midground itself needs internal depth.

**Fix (cheap):** stagger station Z by ±0.15 m so stations 1 & 4 sit at
oz+1.40 and stations 2 & 3 sit at oz+1.70. The row now reads as a
shallow V opening toward the door — eye gets pulled into the back wall
(where the PR1.6 hero will land) instead of dead-stopped at the row.

### 🟡 D5 — Brand voice gap vs BookRoom — too clean, no "lived-in" (OUT-6)

BookRoom's stations carry mess: dust motes float (`BookRoom.tsx:103`),
ladder leans crooked (line 334, rotation -0.18), books vary in height
within the shelf, a chair faces the door, sticky-note-style page on the
table. The product stations are by contrast spotless: every plinth
identical, every accent strip flush, every monitor at the exact same
height, every label plate exactly the same. Even the cable coil "mess"
is gated `i % 2 === 0` (line 770) — i.e. it's a regular pattern, not
genuinely scattered.

**Reasoning:** Hand-built voxel/low-poly aesthetic implies imperfection
as a feature. PR1.5 went production-line.

**Fix suggestions:**
- Rotate one or two stations on Y by ± 0.06 rad so the row isn't ruler-straight.
- Add a sticky note stuck to the side of station 1's monitor bezel
  (yellow, slightly off-axis), a coffee ring stain on station 2's
  plinth top (dark slate disc), a power strip with cable spaghetti
  along the back wall connecting all four stations (one continuous
  cable run reads as "yes a person works here").
- Vary the four cable coils — different sizes, one tipped over.

### 🟡 D6 — Stations + legacy desk feel like two unrelated rooms (cohesion)

The PR1.5 design-note explicitly said "PROBLEM_SOLVER + MENTOR_TABLE
dialogues remain on stations 1 & 2 ... collapse the two redundant desk
monitors into the station row" and "Old desk + dual monitors + back-wall
cards are removed". They weren't. `ProductRoom.tsx:307–390` still
renders the full desk + dual monitors + keyboard + mouse + duck +
laptop, AND `ScreenStand` instances at lines 336–351 still wire
PROBLEM_SOLVER + MENTOR_TABLE to the desk monitors — meaning those
dialogues fire from BOTH the desk monitors (lines 339, 347) AND the new
stations 1 & 2 (line 593 via `entry.id` matching).

Result: the room has two *competing* showcases — a desk hero in the
foreground and a station row in the midground. The eye doesn't know
which is the focus. From the door, the desk visually dominates (it's
closer, wider, and brightly lit by the cyan accent point light).

**Reasoning:** This is the single biggest cohesion failure. The room
reads as "old startup-war-room scene + new station row pasted on the
back wall" instead of a unified composition. OUT-1 demands deliberate
staging; the desk + stations together are accidentally redundant.

**Fix:** This may be intentionally scoped out of PR1.5 (the frontend
review didn't flag it because OUT-7 says interactables must be
preserved, and they are). But for designer purposes, by PR1.6 either
(a) execute the design-note's "collapse" — remove the desk + ScreenStand
duplicates, or (b) re-frame the desk as the *operator station* (a
seat/work pose) facing the four project monitors. Today it is neither.
Flag this loudly so it doesn't slip through PR1.6.

### 🔵 D7 — Plinth-front accent strip reads as kiosk LED, not editorial

Lines 638–646: emissive `entry.accent` strip at y=0.45 on the front of
each plinth. This is the single most "trade-show booth" element in the
room — every B2B conference plinth in the world has exactly this
under-knee glow strip. It's the opposite of BookRoom's hand-built voxel
feel. Already covered as a removal candidate under D3 (palette discipline);
listing here so the brand-voice case is on the record too.

### 🔵 D8 — All four monitor screens at identical y/size — micro-rhythm missed

Every screen face: 0.74 × 0.44, y=1.45, identical bezel. Even the
keyboard-style elements on BookRoom's bookshelf use varied book heights
to create rhythm. Cheap win: vary screen aspect (e.g. station 3 portrait,
station 4 wider). Doesn't need new geometry, just per-station args.

## Verdict

**ITERATE** — D1 (clone-row distinctness) + D2 (unreadable labels) + D6
(desk-stations redundancy) are the three blockers; together they mean
the player walking in cannot tell the four projects apart, can't read
their names, and is distracted by a competing desk hero — the exact
failure modes OUT-1/2/6 were written to prevent. Palette and composition
fixes (D3, D4, D5) are smaller dials but compound the trade-show feel.
