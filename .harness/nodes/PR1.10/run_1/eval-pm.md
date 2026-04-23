# PR1.10 — PM Review (run_1)

## Scope

Final PM review of the SuriWorld 3D Product Room polish (PR1.2 → PR1.9) before
deploy. PM angle only — performance budgets and z-fighting are owned by the
frontend reviewer (`eval-frontend.md`); palette/composition/brand voice belongs
to the designer reviewer (`eval-designer.md`). This eval covers:

- OUT-1 .. OUT-7 acceptance-criteria coverage from a product-outcome lens.
- "Out of Scope" respect (`BookRoom.tsx`, `IdeaLab.tsx`, `MyRoom.tsx`, the
  corridor, `EnterPrompt3D`, `InteractionManager`, `data/productRoom.ts`
  content, no new external assets).
- Interactable-count math vs `PROJECT_SHOWCASE_ENTRIES` (N+2 expected).
- Cross-reviewer synthesis: where do the frontend and designer findings agree,
  conflict, or leave a gap, and what is the priority list for PR1.11?

Inputs read: `acceptance-criteria.md`, `design-note.md`, `eval-frontend.md`,
`eval-designer.md`, `src/world3d/scene/rooms/ProductRoom.tsx`,
`src/data/productRoom.ts`, `git log --oneline -20`.

---

## Findings

### 🔴 PM-1 — Two stations are duplicate content of two other stations (OUT-2)
**File:** `ProductRoom.tsx:103–128, 549–702` × `data/productRoom.ts:24–34, 56–61`
**Reasoning:** `STATIONS = [PROBLEM_SOLVER (dialogue), MENTOR_TABLE (dialogue),
...PROJECT_SHOWCASE_ENTRIES]`, and `PROJECT_SHOWCASE_ENTRIES[0..1]` are
literally `problem-solver` and `mentor-table` again with the same `title`,
`link`, and a placeholder `pitch`. Result: the player walks past **station 0
"Problem Solver" (real body)**, **station 1 "Mentor Table" (real body)**,
**station 2 "Problem Solver" (placeholder pitch + cool-overridden cyan)**,
**station 3 "Mentor Table" (placeholder pitch)**, then 2 unique projects
(debate-coach, study-stack). That is **4 of 6 stations carrying duplicate
titles**, and the duplicates' modal bodies say *"(Project pitch coming soon —
Suri is still writing this one up.)"*. OUT-2 says *"Every entry in
PROJECT_SHOWCASE_ENTRIES has its own visually distinct station"* — entries
themselves are the duplicates, so even strict criterion compliance still
ships a confusing UX. This is the single most embarrassing thing in the
build: two project cards labeled identically, one with the real pitch, one
saying "coming soon."
**Fix suggestion:** This is a content/spec clean-up, not a Product Room render
fix. Pick one:
  - (a) Drop `problem-solver` and `mentor-table` from `PROJECT_SHOWCASE_ENTRIES`
        in `data/productRoom.ts` so the showcase array becomes `[debate-coach,
        study-stack]` (or backfill 2 fresh project entries). Station count
        becomes 4 — closer to the design-note's "4 entries from
        PROJECT_SHOWCASE_ENTRIES" plan and also closer to the OUT-2 phrasing
        "~5 projects."
  - (b) Keep `STATIONS = PROJECT_SHOWCASE_ENTRIES` (no separate dialogue prepend);
        upgrade entries 0 and 1 to use the rich `dialogues.problemSolver/mentorTable`
        body instead of the placeholder pitch.
  - **Spec note:** "Out of Scope" forbids modifying `data/productRoom.ts`
    *content* (titles, dialogues) but de-duplicating an entry by pruning is
    arguably content-shape cleanup, not a string change. PM call required —
    but shipping with the duplicate is worse than the spec violation.

### 🔴 PM-2 — Design-note "Compatibility Note" violated; legacy props kept (OUT-1)
**File:** `ProductRoom.tsx:319–522` (desk + dual monitors→removed, but **desk,
keyboard, mouse, mug, headphones, sticky notes, USB drives, rubber duck,
server rack with LEDs+fan, double crate stack, product cubes** all retained)
**Reasoning:** `design-note.md:55` explicitly retires *"Old desk + dual monitors
+ back-wall cards are removed."* Designer F-1 already flagged this in detail.
Acceptance criteria don't forbid the props by name, but **OUT-1 demands a
deliberate 3-layer composition** (foreground → midground → background) and
**OUT-6 demands BookRoom-style hand-built voxel parity, not SaaS chrome**.
The current scene's midground is dominated by retired props, with the 6
intended midground stations off to the +z back wall, and the hero hidden
between them. This is a PM call because the design-note is the contract the
station row was built against; keeping the desk/rack/crates means the spec
shipped is not the spec we wrote. Designer F-1 reads this as the single
biggest visual blocker; I agree from a product-outcome lens because OUT-1
is one of only seven outcomes and it's being undermined by ~200 lines of
abandoned geometry.
**Fix suggestion:** Concur with designer F-1 — delete `ProductRoom.tsx:319–522`
plus the 3 colliders at `:201–203`. Net: ~200 LOC down, mesh budget down ~40%
(also resolves frontend F-R-2), composition reads cleanly. If we want to keep
*one* "lived-in" midground anchor for OUT-6 craft, keep just the desk OR just
the crate — not all three.

### 🟡 PM-3 — Showcase wall shelf on -z wall is dead geometry the brief retired (OUT-1, KISS)
**File:** `ProductRoom.tsx:783–792`
**Reasoning:** This shelf was the mounting surface for the back-wall showcase
cards which the redesign collapsed into the station row. It now hangs on the
**-z wall behind the player on entry** — invisible during the OUT-1 first-glance
moment, and its emissive cyan strip wastes one of the few `emissive` budget
points on a surface no one looks at. Designer F-7 caught the visual angle; the
PM angle is that this is dead inventory tied to a retired design — same class
of regression as PM-2 but smaller surface.
**Fix suggestion:** Delete `:783–792`. 9 LOC, 2 meshes, 1 emissive cleanup.

### 🟡 PM-4 — Out-of-Scope respect: PASS, but verify with `git diff` against the right base
**File:** repo-wide
**Reasoning:** `git log --oneline -20` confirms the last 6 commits are all
scoped to `feat(product-room)` / `fix(product-room)` (PR1.2, 1.4, 1.5, 1.7,
1.8, 1.9). Older commits are unrelated 3D door/sign/book work and a 2D MyRoom
edit, all from before the OPC unit. **No commits touch `BookRoom.tsx`,
`IdeaLab.tsx`, `MyRoom.tsx`, the corridor scene, `EnterPrompt3D`,
`InteractionManager`, or add new GLTF/texture assets** in this unit. ✓ on
the explicit Out-of-Scope list. The one ambiguity is `data/productRoom.ts`
content — it has not been edited (PRODUCT_COLORS / dialogues / showcase
entries are untouched), but PM-1 above asks for a content edit. Flag and
escalate before committing PM-1's fix. Also: `git diff main..HEAD --stat`
returned empty in this checkout, so I'm relying on the commit-log scope
labels rather than a true diff against the base branch — surface the diff
in PR1.11 to be safe.

### 🟡 PM-5 — Interactable count math: 6 actual vs N+2=6 expected ✓, but two are duplicates (OUT-7)
**File:** `ProductRoom.tsx:130, 549–616`
**Reasoning:** `PROJECT_SHOWCASE_ENTRIES.length === 4`, so the brief's formula
N+2 expects **6** interactables. Code produces exactly **6** station screens,
each with `m.userData.interactable = interactable` (`:602–607`). Counts match,
modal triggers preserved, OUT-7 satisfied at the wiring layer. The frontend
review (F-R-8) independently confirmed this. **Caveat:** because of PM-1, two
of the six modals open onto duplicate titles. From a strict OUT-7 perspective
this PASSES (every entry's interactable still triggers); from a product-outcome
perspective, two of the modals are redundant. Linked to PM-1.

### 🟡 PM-6 — Hero focal piece loses the visual hierarchy (OUT-3 intent)
**File:** `ProductRoom.tsx:704–781` vs `:602–616`
**Reasoning:** Designer F-2 nailed the mechanic — hero cube emissive `0.9` vs
6 station screens at `1.6` × ~0.85 m wide, hero only `0.22 m` and lower. From
the PM lens: OUT-3 says *"At least one hero focal piece … with idle ROTATION
animation."* Strictly, the hero exists and rotates, so the OUT-3 checkbox
ticks; however the *intent* of having a hero is that it reads as the focal
point. Currently it does not. Backing the designer recommendation here — this
is a polish blocker even though it doesn't fail the literal criterion text.
**Fix suggestion:** Adopt designer F-2 fix (a) + (b) combined: bump hero
emissive to ≥ 1.6, lower station screen emissive to ~1.0, optionally raise
hero pedestal +0.3 m. Cheap.

### 🟡 PM-7 — Key light color breaks "cool tech palette" (OUT-5)
**File:** `ProductRoom.tsx:805` (`color="#ffd9b0"`)
**Reasoning:** OUT-5 mandates the cool slate/steel/cyan palette. Designer F-3
documents that the current key is amber/cream and pulls every slate surface
toward warm — defeating OUT-5 at the lighting layer regardless of what the
albedo colors are. PM angle: OUT-5 is one of seven outcomes, and a single hex
literal (`#ffd9b0`) is putting it at risk. Trivial fix; no excuse to ship
with it wrong.
**Fix suggestion:** Concur with designer F-3 — restore `#e6ecf2` (or
`#dde8f5`), bump intensity 0.8→0.9, restore `distance: 9` per design-note.

### 🟡 PM-8 — Reviewer-budget clash: frontend says mesh count ~2× baseline; legacy props are the cause
**File:** `ProductRoom.tsx:319–522` (legacy props) + `:304–317` (9-cell coffer)
**Reasoning:** Frontend F-R-2 calls out ~160 effective meshes vs ~80 baseline,
which is well over the ≤+30 % budget. The single largest contributor is the
~200 lines of legacy desk/rack/crate (PM-2 above). **Killing PM-2 also
resolves frontend F-R-2 mostly for free** — that one delete drops ~50–60
meshes, putting the room close to or under the +30 % cap. PM call: prefer
the structural fix (delete legacy) over the cosmetic fix (cull coffer cells).
Synthesis win.

### 🔵 PM-9 — Cross-reviewer agreement matrix
**File:** N/A (synthesis)
**Reasoning:** Both reviewers independently flagged: (a) hero focal under-anchored
(designer F-2 ↔ implicit in frontend F-R-12 edges-on-glass), (b) some sub-cm
depth slips (frontend F-R-3 / F-R-4 — designer didn't surface these because
they're a perf concern not a brand one), (c) no conflicts between reviewers
were found. Where they're complementary:
  - Designer focuses on what the player *sees* (palette, composition, hero
    anchoring, decorative parity, label craft).
  - Frontend focuses on what the runtime *does* (mesh budget, z-fight margins,
    reduced-motion subscription, render-time allocations).
  - PM-1 (duplicate stations) is the gap neither reviewer explicitly surfaced —
    designer counted "6 stations" without checking content uniqueness;
    frontend counted "6 interactables" without checking modal payload
    distinctness. This is exactly the synthesis the PM lens exists to catch.

### 🔵 PM-10 — Quality-Baseline polish gaps acceptable for first deploy
**File:** `ProductRoom.tsx:602–616` (no scanline), `:663–666` (cable coil on
all stations), `:633–659` (oversized labels)
**Reasoning:** Designer F-4, F-5, F-10, F-12 are all "nice-to-have" polish
items — varied props per station, label sizing, coil variety, scanline
micro-anim. None of them block any OUT-* line; they're Quality-Baseline
items. Recommend: defer to PR1.12 if PR1.11 is the deploy unit; merge with
PR1.11 if there's headroom in the iteration.

### 🔵 PM-11 — Reduced-motion gating: spec ✓, robustness 🟡
**File:** `ProductRoom.tsx:157–160`
**Reasoning:** Frontend F-R-5 caught that `prefersReducedMotion` is read once
via `useMemo` and doesn't react to OS toggle changes. Acceptance criteria
("rotation animations gated via prefers-reduced-motion") is **literally
satisfied** at mount, so this passes the criterion. PM call: defer the
robustness fix to a later unit unless we also touch BookRoom (which is out
of scope this unit). Not a blocker.

### 🔵 PM-12 — Build cleanliness ✓ (VER-5)
**File:** `npm run build` per frontend F-R review
**Reasoning:** Frontend confirms build green, 0 TS errors, no new warnings.
VER-5 satisfied at the static layer. VER-1/2/3/4 still require live
deployed-build verification per the criteria.

---

## Priority list for PR1.11

| # | Source                | Item                                       | Effort |
|---|-----------------------|--------------------------------------------|--------|
| 1 | PM-1                  | De-duplicate Problem Solver / Mentor Table | S      |
| 2 | PM-2 / designer F-1   | Delete legacy desk + rack + crates         | M      |
| 3 | PM-7 / designer F-3   | Restore cool-white key light               | XS     |
| 4 | PM-6 / designer F-2   | Re-anchor hero (emissive + height)         | S      |
| 5 | PM-3 / designer F-7   | Delete dead -z wall showcase shelf         | XS     |
| 6 | frontend F-R-1/3/4    | Fix three z-fighting offsets (≥1 cm)       | XS     |
| 7 | designer F-4          | Add unique deco props to stations 0/2/5    | S      |

Items 1–6 land before deploy. Item 7 can ship in PR1.12 if iteration runs hot.

---

## Verdict

**ITERATE** — content duplication (PM-1) and the unremoved legacy desk/rack/
crate cluster (PM-2) are PM-side blockers that compound the designer and
frontend findings, but every fix is small and the structural fixes resolve
multiple findings at once.
