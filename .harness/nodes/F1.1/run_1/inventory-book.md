# BookRoom 3D Inventory

Source: `src/world3d/scene/rooms/BookRoom.tsx`, `src/world3d/data/rooms.ts`

## Identity
- Room id: `book`
- Label: `Book Room`
- Color (room base): `#22c55e` (`COLORS.green`)
- Accent color: `#4ade80`

## Palette (hard-coded in tsx)
- Shelf book colors: `['#e94560', '#3b82f6', '#ffd700', '#22c55e', '#a78bfa', '#f97316']`
- Shelf plank: `#8B4513`
- Shelf frame box: `#6b3410`
- Chair seat: `#4a3728`
- Chair back / arms: `#5a4738`
- Lamp pole: `#888888`
- Lamp shade: `#ffd700` (emissive)
- Side table top: `#8B4513`, leg `#6b3410`
- Coffee cup: `#dddddd`, liquid `#4a2c0a`
- Lamp light color: `#ffeebb`
- Rug: `#22c55e` (green, low opacity)

## Labels / headings
None as 3D text meshes.

## Interactables

### 1. Left bookshelf invisible plane — Blog (`BLOG_INTERACTABLE`)
- title: `Blog`
- body: `Why I Build Things · Apr 2026. Learning by Shipping · Mar 2026. (Coming soon)`
- Triggered by: clicking the transparent plane on the front face of the left bookshelf.

## Content blocks / objects in room
- Two bookshelves (4 rows × 5 books, width 1.5, depth 0.38) with framed wood boxes.
- Reading chair (seat + back + 2 arms) facing right.
- Reading lamp (pole + glowing shade) with point light.
- Side table + coffee cup beside chair.
- Green rug covering the center.

## Content inferred from the single `BLOG_INTERACTABLE` body
Two posts currently listed as content:
1. `Why I Build Things` — `Apr 2026`
2. `Learning by Shipping` — `Mar 2026`
Status: `(Coming soon)`

## Hard-coded content currently embedded in TSX
- Blog dialogue (title + body).
- Shelf book color array (visual, but shared with MyRoom → could be centralised).
- Shelf plank and frame colors.

## Related: `src/world3d/hud/RoomOverlays.tsx` (OUT OF SCOPE for F1.1)
Holds richer blog-card content:
- `Why I Build Things` — `Apr 2026 · 3 min read`
- `Learning by Shipping` — `Mar 2026 · 5 min read`
F1.8 (2D BookRoom) should extract the `min read` field if needed.

## Extraction decisions
- Create `src/data/bookRoom.ts` with:
  - `BlogPost` interface (`title`, `date`)
  - `BLOG_POSTS` array populated from the current dialogue string
  - `BLOG_STATUS = 'Coming soon'`
  - `BLOG_DIALOGUE: InteractableData`-shaped object (id `blog`) whose `body` is re-derived from `BLOG_POSTS` + `BLOG_STATUS` at module load time so the 3D output stays byte-identical.
- Shelf book colors stay inline — they're visual constants, not content.
