# IdeaLab 3D Inventory

Source: `src/world3d/scene/rooms/IdeaLab.tsx`, `src/world3d/data/rooms.ts`

## Identity
- Room id: `idealab`
- Label: `Idea Lab`
- Color (room base): `#ffd700` (`COLORS.gold`)
- Accent color: `#fbbf24`

## Palette (hard-coded in tsx) — "MONET"
- cream: `#ead9b8`
- lavender: `#b5a7d4`
- dustRose: `#d89cb0`
- sage: `#9ec79e`
- teal: `#8fb8c4`
- softBlue: `#9bb0cc`
- willow: `#7a9d7e`
- peach: `#e6b89c`
- fringe: `#c8b78f`
- Whiteboard body: `#8a8a8a`
- Whiteboard face: `#f5f1e8`
- Bulb color: `#ffe28a` emissive `#ffd77a`
- Bulb point light: `#ffe0a0`

## Labels / headings
None as 3D text meshes. Visible "idea" text is only in the single interactable body.

## Interactables

### 1. Whiteboard — Idea Board (`IDEA_BOARD_INTERACTABLE`)
- title: `Idea Board`
- body: `AI Study Buddy · Debate Trainer · Visual Math. Ideas brewing in the lab.`
- Triggered by: clicking the whiteboard face.

## Content blocks / objects in room
- Carpet base (cream) + inner ring (soft blue) + 16 scattered rug patches (lavender/dustRose/sage/teal/softBlue/willow/peach).
- Two fringe strips (cream) at north/south edges.
- Whiteboard with 11 painterly "writing" lines + heading bar.
- 3 floor cushions arranged in a cluster.
- Tea table with 4 legs, notebook, pencil, prototype cube, teacup + saucer.
- Floating glowing idea bulb + point light (animated bobbing).
- `PATCH_SEED` list (16 patches with x, z, w, d) — visual, not content.
- `BOARD_LINES` list (11 colored rectangles simulating notes on the whiteboard) — visual, not content.

## Inferred ideas from interactable body
Three ideas currently listed (comma/bullet separated in the body string):
1. `AI Study Buddy`
2. `Debate Trainer`
3. `Visual Math`
Tagline: `Ideas brewing in the lab.`

Note: `src/data/ideas.ts` ALREADY holds a separate idea list (`Debate Flow Digitizer`, `Math × Music`, `Visual Proof Gallery`). These are DIFFERENT ideas from the 3D Idea Lab whiteboard text. Reconciling the two is out of scope for F1.1.

## Hard-coded content currently embedded in TSX
- Idea board dialogue (title + body).
- MONET palette (visual).
- PATCH_SEED layout (visual).
- BOARD_LINES list (visual).

## Related: `src/world3d/hud/RoomOverlays.tsx` (OUT OF SCOPE for F1.1)
Holds richer idea-card content with descriptions:
- `AI Study Buddy` — `Personalized practice questions that adapt to what you struggle with`
- `Debate Trainer` — `Practice arguments against an AI that plays devil's advocate`
- `Visual Math` — `See calculus and algebra concepts as interactive 3D animations`
F1.11 (2D IdeaLab) should extract these for the card grid.

## Extraction decisions
- Create `src/data/ideaLab.ts` with:
  - `WhiteboardIdea` interface (`title: string`)
  - `WHITEBOARD_IDEAS: readonly WhiteboardIdea[]` populated with the three titles above
  - `WHITEBOARD_TAGLINE = 'Ideas brewing in the lab.'`
  - `IDEA_BOARD_DIALOGUE: InteractableData`-shaped object built from the above so the 3D body string is byte-identical to the current literal.
- Do NOT touch `src/data/ideas.ts`. The two lists are content conflicts for a future tick.
- Do NOT move `PATCH_SEED` / `BOARD_LINES` / `MONET` — those are visual constants, not content.
