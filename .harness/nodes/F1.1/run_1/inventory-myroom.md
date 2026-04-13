# MyRoom 3D Inventory

Source: `src/world3d/scene/rooms/MyRoom.tsx`, `src/world3d/data/rooms.ts`

## Identity
- Room id: `myroom`
- Label: `My Room`
- Color (room base): `#8B5A2B`
- Accent color: `#f4a8b8` (pink, from `COLORS.pink`)

## Palette (hard-coded in tsx)
- PINK: `#f4a8b8`
- PINK_SOFT: `#f8c4d0`
- PINK_DARK: `#d87890`
- WHITE: `#f8f8f8`
- WHITE_OFF: `#e8e8e8`
- WOOD: `#6b4423`
- SHELF_BACK: `#4a3018`
- Bookshelf book colors: `['#e94560', '#3b82f6', '#f4a8b8', '#f8c4d0', '#ffd700']`
- Desk pen: `#ffd700`
- Desk plant pot: `#c06850`
- Desk plant leaves: `#4ade80` / emissive `#22c55e`

## Labels / headings / titles
None as 3D text meshes — the room uses scene geometry only. Visible strings all come via interactables.

## Interactables

### 1. Headboard (`HEADBOARD_INTERACTABLE`)
- title: `My Bed`
- body: `A cozy corner. Sometimes the best ideas come right before sleep.`
- Triggered by: clicking the headboard mesh at rear of bed.

### 2. Monitor screen (`MONITOR_INTERACTABLE`)
- title: `About Suri`
- body: `Suri Xing, Grade 8 — Math · Design · Debate · Building. Check back for more.`
- Triggered by: clicking the monitor screen on the desk.

## Content blocks / objects in room
- Bed (frame, mattress, sheet, 2 pillows, headboard, 4 legs) — pink palette.
- Desk (top, 4 legs, drawer + handle) — white palette.
- Monitor (frame, screen, stand, base, scanline overlay) on desk.
- Notebook + gold pen on desk.
- Desk lamp (part: `DeskLamp`) at corner of desk.
- Bookshelf (part: `Bookshelf`), 3 rows × 4 books, width 1.2, depth 0.3, at back.
- Pink rug in front of bed.
- Tiny potted plant on desk (terracotta pot + green leaves).

## Hard-coded content currently embedded in TSX
- Bed dialogue strings (title + body).
- Monitor dialogue strings (title + body).
- All palette hex values.
- Bookshelf config (rows/booksPerRow/width/depth/book colors).
- Bed leg offsets, desk leg offsets.

## Related: `src/world3d/hud/RoomOverlays.tsx` (OUT OF SCOPE for F1.1)
A hidden DOM overlay file exists at `src/world3d/hud/RoomOverlays.tsx`. It holds richer content not present in the scene/rooms file: tags `Math`, `Design`, `Debate`, `Building` and the bio label `Suri Xing, Grade 8`. F1.2 (2D MyRoom) should extract from there if it needs these tags.

## Extraction decisions for src/data/myRoom.ts
- Dialogues (`bed`, `monitor`) keyed by id.
- Shelf book-color palette.
- Tags / bio copy: NONE currently in the 3D file — the only bio text is the monitor body line "Suri Xing, Grade 8 — Math · Design · Debate · Building. Check back for more.". Keep that string as the single canonical bio line.
- Palette hex values stay in the TSX for now (they are visual constants, not content). Only user-visible copy and the bookshelf book-color list are moved.
