# iamsuri — 2D Explorable World Design Spec

## Overview

Suri's personal website reimagined as a 2D explorable world. Visitors see a top-down floor plan of "Suri's Lab" with rooms they click to explore. A character (Suri) stands in the hallway. Each room is a section of the site.

**Audience:** Mix, optimized for college admissions officers.  
**Vibe:** Creative lab run by someone who ships real things.  
**Reference:** Toca Boca World (playful rooms), Star Office UI (Phaser pixel art office), Gather.town (2D explorable space), jiebuild.com (interactive discovery).

## Architecture

**Hybrid structure:**
- **Landing view:** Top-down floor plan showing all rooms + character in hallway
- **Room view:** Click a room → smooth zoom/transition into full-page room content
- **Back:** Return to floor plan from any room

**Tech stack:** React + TypeScript + Vite (already scaffolded). CSS transitions for room zoom. No game engine needed for v1.

## Rooms

### 1. My Room (About Me) — Purple
- Bio: name, grade, interests (math, design, debate, building)
- Furniture: bed, desk with computer, art on walls, awards shelf
- Click furniture items for details (art piece opens larger, awards expand)

### 2. Product Room — Blue  
- Showcase shipped apps as display items on shelves/stands
- Each product: icon, name, one-line description, "Live" badge, link to external URL
- Current: Problem Solver (`https://surixing.github.io/ProblemSolver/`), Mentor Table (`https://surixing.github.io/MentorTable/`)
- Empty stands with "coming soon" for future products

### 3. Book Room (Blog) — Green
- Blog posts displayed as books on shelves
- Each post: title, topic tag, read time, date
- Posts stored as markdown in `/content/blog/`
- Click a book → opens the blog post (full page or overlay)

### 4. Idea Lab — Yellow
- Whiteboard with "What's Brewing" header
- Idea cards pinned to the board: title + one-line "why"
- Ideas stored as data in a config file (easy to add/remove)
- Dashed borders to signal "not yet built"

### 5. Future Rooms (extensible)
- Art Gallery, Trophy Room, Music Room, Guest Room (contact)
- Architecture: room config is data-driven, adding a room = adding an entry

## Floor Plan Layout

```
┌──────────────┐  hallway  ┌──────────────┐
│   My Room    │           │ Product Room  │
│   (purple)   │           │   (blue)      │
└──────┬───────┘           └──────┬────────┘
       │      ┌──────────┐       │
       └──────│  Hallway  │──────┘
       ┌──────│  [Suri]   │──────┐
       │      └──────────┘       │
┌──────┴───────┐           ┌─────┴─────────┐
│  Book Room   │           │   Idea Lab    │
│   (green)    │           │   (yellow)    │
└──────────────┘           └───────────────┘
```

Character stands in center hallway. Rooms in 2x2 grid around hallway cross.

## Visual Design

### Dark Mode (default)
- Background: `#0a0a10` (floor plan area), rooms have slightly lighter themed backgrounds
- Grid overlay: subtle pixel grid lines
- Room borders: themed color with low opacity
- Character: gradient avatar with speech bubble, floating animation
- Furniture: emoji icons with labels (v1), pixel art sprites (v2)

### Light Mode
- Background: warm off-white `#f0ede6`
- Rooms: pastel versions of their theme colors
- Same layout, cheerful feel

### Animations
- Room hover: subtle scale up (1.02x)
- Room enter: smooth zoom transition (CSS transform scale + translate)
- Character: gentle float animation (translateY bounce)
- Speech bubble: fade in on load

## Data Model

```typescript
interface Room {
  id: string;
  name: string;
  icon: string;
  color: string; // theme color
  position: { row: number; col: number };
  component: React.ComponentType;
}

interface Product {
  id: string;
  name: string;
  icon: string;
  description: string;
  url: string;
  status: 'live' | 'coming-soon';
  color: string;
}

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  readTime: string;
  tags: string[];
  // content loaded from /content/blog/{slug}.md
}

interface Idea {
  id: string;
  title: string;
  why: string;
}
```

## Component Structure

```
src/
  components/
    World/
      FloorPlan.tsx        — main floor plan with all rooms
      Room.tsx             — generic room wrapper (zoom transition)
      Character.tsx        — Suri avatar + speech bubble
      Hallway.tsx          — center corridor
    Rooms/
      MyRoom.tsx           — about me content
      ProductRoom.tsx      — product showcase
      BookRoom.tsx         — blog listing
      IdeaLab.tsx          — idea cards
    shared/
      ThemeToggle.tsx      — dark/light switch
      RoomTransition.tsx   — zoom in/out animation wrapper
  data/
    rooms.ts              — room config
    products.ts           — product data
    ideas.ts              — idea data
  content/
    blog/                 — markdown blog posts
  styles/
    world.css             — floor plan styles
    rooms.css             — room-specific styles
    theme.css             — dark/light variables
```

## Mobile

- Floor plan stacks rooms vertically (2 columns still, but smaller)
- Or: list view with room cards you tap to enter
- Room content is full-screen on mobile regardless

## Scope — v1 (this build)

- Floor plan with 4 rooms, dark/light mode
- Click room → zoom into room content → back to floor plan
- Character with speech bubble in hallway
- Products page with external links
- Blog page (static, 1-2 placeholder posts)
- Idea Lab with 2-3 ideas
- My Room with basic bio
- Theme toggle
- Deploy to GitHub Pages

## Out of Scope (v2+)

- Keyboard character movement (arrow keys)
- Pixel art sprites (v1 uses emoji)
- Phaser.js game engine
- Blog markdown rendering pipeline
- Room transition sound effects
- Visitor character customization
