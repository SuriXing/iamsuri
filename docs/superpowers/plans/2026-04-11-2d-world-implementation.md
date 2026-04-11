# iamsuri 2D World — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current simple landing page with a 2D explorable world where visitors click rooms to discover content about Suri (products, blog, ideas, about me).

**Architecture:** React SPA with CSS-driven room transitions. Floor plan view shows 4 rooms in a 2×2 grid around a center hallway. Clicking a room zooms into full-page room content. Theme context manages dark/light mode. Data is config-driven for easy extension.

**Tech Stack:** React 19, TypeScript, Vite 8, CSS custom properties for theming. No external dependencies needed.

**Spec:** `docs/superpowers/specs/2026-04-11-iamsuri-2d-world-design.md`

**Benchmark targets:** Must look better than [Star Office UI](https://github.com/ringhyacinth/Star-Office-UI) and be inspired by [Gather.town](https://gather.town), [Toca Boca World](https://tocaboca.com/toca-boca-world), and [jiebuild.com](https://jiebuild.com).

---

## File Structure

```
src/
├── App.tsx                          — routes between FloorPlan and Room views
├── main.tsx                         — entry point (unchanged)
├── index.css                        — global reset (keep minimal)
├── context/
│   └── ThemeContext.tsx              — dark/light theme provider + hook
├── data/
│   ├── rooms.ts                     — room config array (id, name, icon, color, position)
│   ├── products.ts                  — product data (name, desc, url, status, color)
│   └── ideas.ts                     — idea data (title, why)
├── components/
│   ├── World/
│   │   ├── FloorPlan.tsx            — main floor plan layout with grid + hallway + character
│   │   ├── FloorPlan.css            — floor plan styles (dark/light)
│   │   ├── RoomTile.tsx             — single room tile on the floor plan (hover effects)
│   │   ├── RoomTile.css             — room tile styles
│   │   ├── Character.tsx            — Suri avatar with speech bubble + float animation
│   │   └── Character.css            — character styles
│   ├── Rooms/
│   │   ├── RoomView.tsx             — full-page room wrapper with back button + transition
│   │   ├── RoomView.css             — room view layout + transition animations
│   │   ├── MyRoom.tsx               — about me: bio, interests, desk, art
│   │   ├── MyRoom.css               — my room interior styles
│   │   ├── ProductRoom.tsx          — product showcase with display stands
│   │   ├── ProductRoom.css          — product room styles
│   │   ├── BookRoom.tsx             — blog listing with book shelf metaphor
│   │   ├── BookRoom.css             — book room styles
│   │   ├── IdeaLab.tsx              — idea whiteboard with pinned cards
│   │   └── IdeaLab.css              — idea lab styles
│   └── shared/
│       ├── ThemeToggle.tsx           — dark/light toggle button
│       └── ThemeToggle.css           — toggle styles
└── styles/
    └── theme.css                     — CSS custom properties for dark/light themes
```

Old files to delete: `src/components/LandingPage.tsx`, `src/styles/LandingPage.css`

---

## Task 1: Theme System

**Files:**
- Create: `src/styles/theme.css`
- Create: `src/context/ThemeContext.tsx`
- Create: `src/components/shared/ThemeToggle.tsx`
- Create: `src/components/shared/ThemeToggle.css`
- Modify: `src/index.css`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create CSS custom properties for themes**

Create `src/styles/theme.css`:

```css
:root {
  /* Dark mode (default) */
  --bg-primary: #0a0a10;
  --bg-secondary: #12121e;
  --bg-hallway: #16162a;
  --text-primary: #e0e0e0;
  --text-secondary: #888;
  --text-muted: #444;
  --border-subtle: rgba(255, 255, 255, 0.06);
  --grid-line: rgba(255, 255, 255, 0.015);
  --shadow-room: 0 4px 20px rgba(0, 0, 0, 0.4);
  --shadow-room-hover: 0 8px 32px rgba(0, 0, 0, 0.6);

  /* Room colors */
  --room-purple: #a78bfa;
  --room-purple-bg: #1e1a2e;
  --room-purple-border: rgba(167, 139, 250, 0.25);
  --room-purple-glow: rgba(167, 139, 250, 0.08);

  --room-blue: #60a5fa;
  --room-blue-bg: #1a1e2e;
  --room-blue-border: rgba(96, 165, 250, 0.25);
  --room-blue-glow: rgba(96, 165, 250, 0.08);

  --room-green: #4ade80;
  --room-green-bg: #1a2e1e;
  --room-green-border: rgba(74, 222, 128, 0.25);
  --room-green-glow: rgba(74, 222, 128, 0.08);

  --room-yellow: #fbbf24;
  --room-yellow-bg: #2a2a1e;
  --room-yellow-border: rgba(251, 191, 36, 0.25);
  --room-yellow-glow: rgba(251, 191, 36, 0.08);

  /* Character */
  --character-gradient: linear-gradient(135deg, #7c5cfc, #ff6b9d);
  --speech-bg: #ffffff;
  --speech-text: #1a1a2e;
}

[data-theme="light"] {
  --bg-primary: #f0ede6;
  --bg-secondary: #e8e4dc;
  --bg-hallway: #e0dcd4;
  --text-primary: #1a1a2e;
  --text-secondary: #666;
  --text-muted: #aaa;
  --border-subtle: rgba(0, 0, 0, 0.06);
  --grid-line: rgba(0, 0, 0, 0.03);
  --shadow-room: 0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-room-hover: 0 8px 28px rgba(0, 0, 0, 0.12);

  --room-purple: #7c5cfc;
  --room-purple-bg: #f5f0ff;
  --room-purple-border: #d4ccff;
  --room-purple-glow: rgba(124, 92, 252, 0.06);

  --room-blue: #3b82f6;
  --room-blue-bg: #f0f5ff;
  --room-blue-border: #bfdbfe;
  --room-blue-glow: rgba(59, 130, 246, 0.06);

  --room-green: #16a34a;
  --room-green-bg: #f0fdf4;
  --room-green-border: #bbf7d0;
  --room-green-glow: rgba(74, 222, 128, 0.06);

  --room-yellow: #d97706;
  --room-yellow-bg: #fffbeb;
  --room-yellow-border: #fde68a;
  --room-yellow-glow: rgba(251, 191, 36, 0.06);

  --speech-bg: #1a1a2e;
  --speech-text: #ffffff;
}
```

- [ ] **Step 2: Create ThemeContext**

Create `src/context/ThemeContext.tsx`:

```tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('suri-theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('suri-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

- [ ] **Step 3: Create ThemeToggle component**

Create `src/components/shared/ThemeToggle.tsx`:

```tsx
import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.css';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```

Create `src/components/shared/ThemeToggle.css`:

```css
.theme-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 100;
  box-shadow: var(--shadow-room);
}

.theme-toggle:hover {
  transform: scale(1.1);
  box-shadow: var(--shadow-room-hover);
}
```

- [ ] **Step 4: Update main.tsx to wrap with ThemeProvider**

Replace `src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/theme.css';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
```

- [ ] **Step 5: Update App.tsx as shell**

Replace `src/App.tsx`:

```tsx
import { useState } from 'react';
import ThemeToggle from './components/shared/ThemeToggle';

export default function App() {
  const [_activeRoom, _setActiveRoom] = useState<string | null>(null);

  return (
    <>
      <ThemeToggle />
      <div style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Theme system working — floor plan coming next</p>
      </div>
    </>
  );
}
```

- [ ] **Step 6: Verify build and theme toggle works**

Run: `cd /Users/surixing/Code/iamsuri && npx vite build 2>&1`
Expected: Build succeeds with no errors.

Start dev server, take screenshot, verify dark/light toggle works.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add theme system with dark/light CSS custom properties"
```

---

## Task 2: Data Layer

**Files:**
- Create: `src/data/rooms.ts`
- Create: `src/data/products.ts`
- Create: `src/data/ideas.ts`

- [ ] **Step 1: Create room configuration**

Create `src/data/rooms.ts`:

```ts
export interface RoomConfig {
  id: string;
  name: string;
  icon: string;
  label: string;
  colorVar: string; // CSS variable prefix, e.g. 'purple' maps to --room-purple-*
  position: { row: number; col: number };
}

export const rooms: RoomConfig[] = [
  {
    id: 'my-room',
    name: 'My Room',
    icon: '🛏️',
    label: 'About Me',
    colorVar: 'purple',
    position: { row: 0, col: 0 },
  },
  {
    id: 'product-room',
    name: 'Product Room',
    icon: '🚀',
    label: 'Shipped Apps',
    colorVar: 'blue',
    position: { row: 0, col: 1 },
  },
  {
    id: 'book-room',
    name: 'Book Room',
    icon: '📚',
    label: 'Blog',
    colorVar: 'green',
    position: { row: 1, col: 0 },
  },
  {
    id: 'idea-lab',
    name: 'Idea Lab',
    icon: '🧪',
    label: "What's Brewing",
    colorVar: 'yellow',
    position: { row: 1, col: 1 },
  },
];
```

- [ ] **Step 2: Create product data**

Create `src/data/products.ts`:

```ts
export interface Product {
  id: string;
  name: string;
  icon: string;
  description: string;
  url: string;
  status: 'live' | 'coming-soon';
  colorVar: string;
  tags: string[];
}

export const products: Product[] = [
  {
    id: 'problem-solver',
    name: 'Problem Solver',
    icon: '💡',
    description: 'AI-powered worry helper. Drop your problem in, get clarity out.',
    url: 'https://surixing.github.io/ProblemSolver/',
    status: 'live',
    colorVar: 'purple',
    tags: ['React', 'AI', 'Supabase'],
  },
  {
    id: 'mentor-table',
    name: 'Mentor Table',
    icon: '⭐',
    description: "Chat with history's greatest minds about your real problems.",
    url: 'https://surixing.github.io/MentorTable/',
    status: 'live',
    colorVar: 'pink',
    tags: ['React', 'AI', 'Personas'],
  },
];
```

- [ ] **Step 3: Create idea data**

Create `src/data/ideas.ts`:

```ts
export interface Idea {
  id: string;
  title: string;
  why: string;
  icon: string;
}

export const ideas: Idea[] = [
  {
    id: 'debate-flow',
    title: 'Debate Flow Digitizer',
    why: 'Why do debate coaches still use paper flow sheets in 2026?',
    icon: '🗣️',
  },
  {
    id: 'math-music',
    title: 'Math × Music',
    why: 'Patterns in harmonic progressions that math can explain.',
    icon: '🎵',
  },
  {
    id: 'visual-proofs',
    title: 'Visual Proof Gallery',
    why: "Beautiful mathematical proofs that you can see, not just read.",
    icon: '📐',
  },
];
```

- [ ] **Step 4: Verify types compile**

Run: `cd /Users/surixing/Code/iamsuri && npx tsc -b 2>&1`
Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add src/data/
git commit -m "feat: add data layer for rooms, products, and ideas"
```

---

## Task 3: Character Component

**Files:**
- Create: `src/components/World/Character.tsx`
- Create: `src/components/World/Character.css`

- [ ] **Step 1: Create Character component**

Create `src/components/World/Character.tsx`:

```tsx
import { useState, useEffect } from 'react';
import './Character.css';

interface CharacterProps {
  message?: string;
}

export default function Character({ message = "Welcome to my lab! 👋" }: CharacterProps) {
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowBubble(true), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="character">
      {showBubble && (
        <div className="character-speech">
          <span>{message}</span>
        </div>
      )}
      <div className="character-avatar">
        <span className="character-emoji">👩‍💻</span>
      </div>
      <div className="character-name">Suri</div>
      <div className="character-shadow" />
    </div>
  );
}
```

- [ ] **Step 2: Create Character styles**

Create `src/components/World/Character.css`:

```css
.character {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 15;
}

.character-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--character-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(124, 92, 252, 0.3);
  animation: character-float 2.5s ease-in-out infinite;
  position: relative;
  z-index: 2;
}

.character-emoji {
  font-size: 26px;
  line-height: 1;
}

.character-shadow {
  width: 36px;
  height: 8px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.2);
  margin-top: 4px;
  filter: blur(2px);
  animation: shadow-pulse 2.5s ease-in-out infinite;
}

.character-name {
  margin-top: 2px;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  color: #fff;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 2;
}

.character-speech {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--speech-bg);
  color: var(--speech-text);
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: bubble-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 3;
}

.character-speech::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: var(--speech-bg);
}

@keyframes character-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes shadow-pulse {
  0%, 100% { transform: scaleX(1); opacity: 0.2; }
  50% { transform: scaleX(0.8); opacity: 0.15; }
}

@keyframes bubble-in {
  from { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.9); }
  to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/World/Character.*
git commit -m "feat: add Character component with float animation and speech bubble"
```

---

## Task 4: RoomTile Component (Floor Plan Tiles)

**Files:**
- Create: `src/components/World/RoomTile.tsx`
- Create: `src/components/World/RoomTile.css`

- [ ] **Step 1: Create RoomTile component**

Create `src/components/World/RoomTile.tsx`:

```tsx
import type { RoomConfig } from '../../data/rooms';
import './RoomTile.css';

interface RoomTileProps {
  room: RoomConfig;
  onClick: (roomId: string) => void;
}

export default function RoomTile({ room, onClick }: RoomTileProps) {
  return (
    <button
      className={`room-tile room-tile--${room.colorVar}`}
      style={{
        gridRow: room.position.row + 1,
        gridColumn: room.position.col + 1,
      }}
      onClick={() => onClick(room.id)}
      aria-label={`Enter ${room.name}`}
    >
      {/* Room glow effect on hover */}
      <div className="room-tile__glow" />

      {/* Room header strip */}
      <div className="room-tile__header">
        <span className="room-tile__icon">{room.icon}</span>
        <span className="room-tile__name">{room.name}</span>
      </div>

      {/* Room interior preview */}
      <div className="room-tile__interior">
        <div className="room-tile__furniture">
          {room.id === 'my-room' && (
            <>
              <span className="furniture-item" style={{ top: '15%', left: '12%' }}>🖥️</span>
              <span className="furniture-item" style={{ bottom: '12%', left: '15%' }}>🛏️</span>
              <span className="furniture-item" style={{ top: '12%', right: '15%' }}>🎨</span>
              <span className="furniture-item" style={{ top: '12%', left: '48%' }}>🏆</span>
            </>
          )}
          {room.id === 'product-room' && (
            <>
              <span className="furniture-item" style={{ top: '20%', left: '20%' }}>💡</span>
              <span className="furniture-item" style={{ top: '20%', right: '20%' }}>⭐</span>
              <span className="furniture-item" style={{ bottom: '15%', left: '25%', opacity: 0.3 }}>📦</span>
              <span className="furniture-item" style={{ bottom: '15%', right: '25%', opacity: 0.3 }}>📦</span>
            </>
          )}
          {room.id === 'book-room' && (
            <>
              <span className="furniture-item" style={{ top: '10%', left: '35%', fontSize: '28px' }}>📚</span>
              <span className="furniture-item" style={{ bottom: '20%', right: '15%' }}>🪑</span>
              <span className="furniture-item" style={{ bottom: '10%', left: '10%' }}>📖</span>
            </>
          )}
          {room.id === 'idea-lab' && (
            <>
              <span className="furniture-item" style={{ top: '10%', left: '30%', fontSize: '24px' }}>📋</span>
              <span className="furniture-item" style={{ bottom: '15%', right: '15%' }}>🔬</span>
              <span className="furniture-item" style={{ bottom: '15%', left: '20%' }}>🧪</span>
            </>
          )}
        </div>
      </div>

      {/* Room label */}
      <div className="room-tile__label">{room.label}</div>

      {/* Door indicator */}
      <div className="room-tile__door" />
    </button>
  );
}
```

- [ ] **Step 2: Create RoomTile styles**

Create `src/components/World/RoomTile.css`:

```css
.room-tile {
  position: relative;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s,
              border-color 0.3s;
  box-shadow: var(--shadow-room);
  background: none;
  font-family: inherit;
  text-align: left;
  color: var(--text-primary);
}

.room-tile:hover {
  transform: scale(1.03);
  box-shadow: var(--shadow-room-hover);
}

.room-tile:active {
  transform: scale(0.98);
}

/* Color variants */
.room-tile--purple {
  background: var(--room-purple-bg);
  border-color: var(--room-purple-border);
}
.room-tile--purple:hover { border-color: var(--room-purple); }

.room-tile--blue {
  background: var(--room-blue-bg);
  border-color: var(--room-blue-border);
}
.room-tile--blue:hover { border-color: var(--room-blue); }

.room-tile--green {
  background: var(--room-green-bg);
  border-color: var(--room-green-border);
}
.room-tile--green:hover { border-color: var(--room-green); }

.room-tile--yellow {
  background: var(--room-yellow-bg);
  border-color: var(--room-yellow-border);
}
.room-tile--yellow:hover { border-color: var(--room-yellow); }

/* Glow effect */
.room-tile__glow {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  opacity: 0;
  transition: opacity 0.4s;
  pointer-events: none;
}

.room-tile--purple .room-tile__glow { background: radial-gradient(circle at center, var(--room-purple-glow), transparent 70%); }
.room-tile--blue .room-tile__glow { background: radial-gradient(circle at center, var(--room-blue-glow), transparent 70%); }
.room-tile--green .room-tile__glow { background: radial-gradient(circle at center, var(--room-green-glow), transparent 70%); }
.room-tile--yellow .room-tile__glow { background: radial-gradient(circle at center, var(--room-yellow-glow), transparent 70%); }

.room-tile:hover .room-tile__glow { opacity: 1; }

/* Header strip */
.room-tile__header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.room-tile--purple .room-tile__header { background: rgba(167, 139, 250, 0.12); color: var(--room-purple); }
.room-tile--blue .room-tile__header { background: rgba(96, 165, 250, 0.12); color: var(--room-blue); }
.room-tile--green .room-tile__header { background: rgba(74, 222, 128, 0.1); color: var(--room-green); }
.room-tile--yellow .room-tile__header { background: rgba(251, 191, 36, 0.1); color: var(--room-yellow); }

.room-tile__icon { font-size: 14px; }
.room-tile__name { font-size: 11px; }

/* Interior */
.room-tile__interior {
  flex: 1;
  position: relative;
  min-height: 100px;
}

.room-tile__furniture { position: relative; width: 100%; height: 100%; }

.furniture-item {
  position: absolute;
  font-size: 22px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  transition: transform 0.2s;
}

.room-tile:hover .furniture-item {
  animation: furniture-wiggle 0.4s ease-in-out;
}

/* Label */
.room-tile__label {
  padding: 6px 12px;
  font-size: 10px;
  color: var(--text-muted);
  text-align: center;
  letter-spacing: 0.5px;
}

/* Door */
.room-tile__door {
  position: absolute;
  width: 24px;
  height: 4px;
  border-radius: 2px;
  bottom: -3px;
  left: 50%;
  transform: translateX(-50%);
}

.room-tile--purple .room-tile__door { background: var(--room-purple); }
.room-tile--blue .room-tile__door { background: var(--room-blue); }
.room-tile--green .room-tile__door { background: var(--room-green); }
.room-tile--yellow .room-tile__door { background: var(--room-yellow); }

@keyframes furniture-wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-3deg); }
  75% { transform: rotate(3deg); }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/World/RoomTile.*
git commit -m "feat: add RoomTile component with hover effects and furniture"
```

---

## Task 5: FloorPlan Component

**Files:**
- Create: `src/components/World/FloorPlan.tsx`
- Create: `src/components/World/FloorPlan.css`

- [ ] **Step 1: Create FloorPlan component**

Create `src/components/World/FloorPlan.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { rooms } from '../../data/rooms';
import RoomTile from './RoomTile';
import Character from './Character';
import './FloorPlan.css';

interface FloorPlanProps {
  onEnterRoom: (roomId: string) => void;
}

export default function FloorPlan({ onEnterRoom }: FloorPlanProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    document.title = "Suri's Lab";
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Split rooms into top row and bottom row
  const topRooms = rooms.filter(r => r.position.row === 0);
  const bottomRooms = rooms.filter(r => r.position.row === 1);

  return (
    <div className={`floor-plan ${visible ? 'floor-plan--visible' : ''}`}>
      {/* Background grid */}
      <div className="floor-plan__grid" />

      <div className="floor-plan__content">
        {/* Title */}
        <div className="floor-plan__title">
          <span className="floor-plan__title-text">SURI'S LAB</span>
        </div>

        {/* Top rooms */}
        <div className="floor-plan__row">
          {topRooms.map(room => (
            <RoomTile key={room.id} room={room} onClick={onEnterRoom} />
          ))}
        </div>

        {/* Hallway with character */}
        <div className="floor-plan__hallway">
          <div className="floor-plan__hallway-floor" />
          <Character />
        </div>

        {/* Bottom rooms */}
        <div className="floor-plan__row">
          {bottomRooms.map(room => (
            <RoomTile key={room.id} room={room} onClick={onEnterRoom} />
          ))}
        </div>

        {/* Hint */}
        <div className="floor-plan__hint">
          🗺️ Click a room to explore
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create FloorPlan styles**

Create `src/components/World/FloorPlan.css`:

```css
.floor-plan {
  min-height: 100vh;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  opacity: 0;
  transition: opacity 0.6s ease;
}

.floor-plan--visible { opacity: 1; }

/* Grid background */
.floor-plan__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none;
}

.floor-plan__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: 24px;
  max-width: 700px;
  width: 100%;
}

/* Title */
.floor-plan__title {
  margin-bottom: 20px;
  text-align: center;
}

.floor-plan__title-text {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 4px;
  color: var(--text-muted);
}

/* Room rows */
.floor-plan__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
}

/* Hallway */
.floor-plan__hallway {
  width: 100%;
  padding: 20px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.floor-plan__hallway-floor {
  position: absolute;
  left: 10%;
  right: 10%;
  top: 0;
  bottom: 0;
  background: var(--bg-hallway);
  border-radius: 8px;
}

/* Hint */
.floor-plan__hint {
  margin-top: 20px;
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 1px;
}

/* Mobile */
@media (max-width: 560px) {
  .floor-plan__content { padding: 16px; }
  .floor-plan__row { gap: 10px; }
  .floor-plan__hallway { padding: 14px 0; }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/World/FloorPlan.*
git commit -m "feat: add FloorPlan layout with grid, hallway, and room tiles"
```

---

## Task 6: Room View (Zoom Transition + Back)

**Files:**
- Create: `src/components/Rooms/RoomView.tsx`
- Create: `src/components/Rooms/RoomView.css`

- [ ] **Step 1: Create RoomView wrapper**

Create `src/components/Rooms/RoomView.tsx`:

```tsx
import { useEffect, useState } from 'react';
import type { RoomConfig } from '../../data/rooms';
import './RoomView.css';

interface RoomViewProps {
  room: RoomConfig;
  onBack: () => void;
  children: React.ReactNode;
}

export default function RoomView({ room, onBack, children }: RoomViewProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    document.title = `${room.name} — Suri's Lab`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }, [room.name]);

  const handleBack = () => {
    setVisible(false);
    setTimeout(onBack, 350);
  };

  return (
    <div className={`room-view room-view--${room.colorVar} ${visible ? 'room-view--visible' : ''}`}>
      {/* Back button */}
      <button className="room-view__back" onClick={handleBack} aria-label="Back to floor plan">
        ← Back to Lab
      </button>

      {/* Room header */}
      <div className="room-view__header">
        <span className="room-view__icon">{room.icon}</span>
        <h1 className="room-view__title">{room.name}</h1>
        <span className="room-view__label">{room.label}</span>
      </div>

      {/* Room content */}
      <div className="room-view__content">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create RoomView styles**

Create `src/components/Rooms/RoomView.css`:

```css
.room-view {
  min-height: 100vh;
  background: var(--bg-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.room-view--visible {
  opacity: 1;
  transform: scale(1);
}

/* Back button */
.room-view__back {
  position: fixed;
  top: 20px;
  left: 20px;
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 100;
  font-family: inherit;
  box-shadow: var(--shadow-room);
}

.room-view__back:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-room-hover);
}

/* Header */
.room-view__header {
  text-align: center;
  padding: 60px 20px 24px;
}

.room-view__icon {
  font-size: 40px;
  display: block;
  margin-bottom: 8px;
}

.room-view__title {
  font-size: 28px;
  font-weight: 900;
  margin: 0 0 4px;
}

.room-view--purple .room-view__title { color: var(--room-purple); }
.room-view--blue .room-view__title { color: var(--room-blue); }
.room-view--green .room-view__title { color: var(--room-green); }
.room-view--yellow .room-view__title { color: var(--room-yellow); }

.room-view__label {
  font-size: 13px;
  color: var(--text-muted);
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* Content */
.room-view__content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px 60px;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Rooms/RoomView.*
git commit -m "feat: add RoomView wrapper with zoom transition and back button"
```

---

## Task 7: Room Interiors — MyRoom, ProductRoom, BookRoom, IdeaLab

**Files:**
- Create: `src/components/Rooms/MyRoom.tsx`
- Create: `src/components/Rooms/MyRoom.css`
- Create: `src/components/Rooms/ProductRoom.tsx`
- Create: `src/components/Rooms/ProductRoom.css`
- Create: `src/components/Rooms/BookRoom.tsx`
- Create: `src/components/Rooms/BookRoom.css`
- Create: `src/components/Rooms/IdeaLab.tsx`
- Create: `src/components/Rooms/IdeaLab.css`

- [ ] **Step 1: Create MyRoom**

Create `src/components/Rooms/MyRoom.tsx`:

```tsx
import './MyRoom.css';

export default function MyRoom() {
  return (
    <div className="my-room">
      <div className="my-room__bio">
        <div className="my-room__avatar">👩‍💻</div>
        <h2>Hey, I'm Suri.</h2>
        <p>
          I'm in 8th grade. I build things for curious minds — apps that help people think,
          ask better questions, and learn from the best.
        </p>
        <div className="my-room__tags">
          <span className="my-room__tag">🧮 Math</span>
          <span className="my-room__tag">🎨 Design</span>
          <span className="my-room__tag">🗣️ Debate</span>
          <span className="my-room__tag">💻 Building</span>
        </div>
      </div>

      <div className="my-room__shelves">
        <div className="my-room__shelf">
          <div className="my-room__shelf-label">🖥️ My Desk</div>
          <p>Where the building happens. React, TypeScript, Vite, Supabase — whatever gets the job done.</p>
        </div>
        <div className="my-room__shelf">
          <div className="my-room__shelf-label">🎨 On The Wall</div>
          <p>My artwork was exhibited at <em>Embracing Our Differences</em> — a billboard-sized outdoor art exhibit in Sarasota, FL.</p>
        </div>
        <div className="my-room__shelf">
          <div className="my-room__shelf-label">🏆 Awards Shelf</div>
          <p>Math competitions, debate tournaments, and art exhibits. The fun kind of collecting.</p>
        </div>
      </div>
    </div>
  );
}
```

Create `src/components/Rooms/MyRoom.css`:

```css
.my-room { display: flex; flex-direction: column; gap: 32px; }

.my-room__bio { text-align: center; }
.my-room__avatar { font-size: 48px; margin-bottom: 12px; }
.my-room__bio h2 {
  font-size: 24px; font-weight: 800; color: var(--text-primary);
  margin: 0 0 8px;
}
.my-room__bio p {
  font-size: 15px; color: var(--text-secondary); line-height: 1.6;
  max-width: 480px; margin: 0 auto;
}

.my-room__tags {
  display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
  margin-top: 16px;
}
.my-room__tag {
  padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600;
  background: var(--room-purple-bg); border: 1px solid var(--room-purple-border);
  color: var(--room-purple);
}

.my-room__shelves { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }

.my-room__shelf {
  padding: 20px; border-radius: 12px;
  background: var(--bg-secondary); border: 1px solid var(--border-subtle);
}
.my-room__shelf-label {
  font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;
}
.my-room__shelf p {
  font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0;
}
.my-room__shelf em { color: var(--room-purple); font-style: normal; font-weight: 600; }
```

- [ ] **Step 2: Create ProductRoom**

Create `src/components/Rooms/ProductRoom.tsx`:

```tsx
import { products } from '../../data/products';
import './ProductRoom.css';

export default function ProductRoom() {
  return (
    <div className="product-room">
      <div className="product-room__grid">
        {products.map(product => (
          <a
            key={product.id}
            className="product-card"
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="product-card__accent" />
            <div className="product-card__icon">{product.icon}</div>
            <h3 className="product-card__name">{product.name}</h3>
            <p className="product-card__desc">{product.description}</p>
            <div className="product-card__footer">
              <div className="product-card__tags">
                {product.tags.map(tag => (
                  <span key={tag} className="product-card__tag">{tag}</span>
                ))}
              </div>
              {product.status === 'live' && (
                <span className="product-card__status">● Live</span>
              )}
            </div>
          </a>
        ))}

        {/* Coming soon stands */}
        <div className="product-card product-card--empty">
          <div className="product-card__icon" style={{ opacity: 0.3 }}>📦</div>
          <p className="product-card__desc">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}
```

Create `src/components/Rooms/ProductRoom.css`:

```css
.product-room__grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;
}

.product-card {
  position: relative; overflow: hidden;
  padding: 24px; border-radius: 14px;
  background: var(--bg-secondary); border: 1px solid var(--border-subtle);
  text-decoration: none; color: inherit;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  display: flex; flex-direction: column; gap: 8px;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-room-hover);
  border-color: var(--room-blue);
}

.product-card__accent {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, var(--room-blue), var(--room-purple));
}

.product-card__icon { font-size: 32px; }
.product-card__name {
  font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0;
}
.product-card__desc {
  font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0; flex: 1;
}

.product-card__footer {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 8px;
}

.product-card__tags { display: flex; gap: 4px; flex-wrap: wrap; }
.product-card__tag {
  font-size: 10px; padding: 3px 8px; border-radius: 6px;
  background: var(--room-blue-bg); border: 1px solid var(--room-blue-border);
  color: var(--room-blue); font-weight: 600;
}

.product-card__status {
  font-size: 11px; font-weight: 700; color: var(--room-green);
}

.product-card--empty {
  border-style: dashed; cursor: default;
  display: flex; align-items: center; justify-content: center;
  min-height: 140px; text-align: center;
}
.product-card--empty:hover { transform: none; box-shadow: none; border-color: var(--border-subtle); }
```

- [ ] **Step 3: Create BookRoom**

Create `src/components/Rooms/BookRoom.tsx`:

```tsx
import './BookRoom.css';

interface BlogEntry {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tag: string;
}

const posts: BlogEntry[] = [
  {
    slug: 'broke-mentor-table',
    title: 'How I Broke Mentor Table',
    excerpt: 'What debugging taught me about architecture — and humility.',
    date: '2026-04-01',
    readTime: '4 min',
    tag: 'Build Log',
  },
  {
    slug: 'debate-needs-tech',
    title: 'Why Debate Needs Better Tech',
    excerpt: 'Paper flow sheets in 2026? We can do better.',
    date: '2026-03-15',
    readTime: '3 min',
    tag: 'Opinion',
  },
];

export default function BookRoom() {
  return (
    <div className="book-room">
      <div className="book-room__shelf">
        {posts.map(post => (
          <article key={post.slug} className="book-card">
            <div className="book-card__spine" />
            <div className="book-card__tag">{post.tag}</div>
            <h3 className="book-card__title">{post.title}</h3>
            <p className="book-card__excerpt">{post.excerpt}</p>
            <div className="book-card__meta">
              <span>{post.date}</span>
              <span>·</span>
              <span>{post.readTime}</span>
            </div>
          </article>
        ))}
      </div>
      <p className="book-room__hint">More posts coming soon — the shelf is still being stocked.</p>
    </div>
  );
}
```

Create `src/components/Rooms/BookRoom.css`:

```css
.book-room__shelf { display: flex; flex-direction: column; gap: 12px; }

.book-card {
  position: relative;
  padding: 20px 20px 20px 28px;
  border-radius: 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  transition: transform 0.2s, border-color 0.2s;
  cursor: pointer;
}
.book-card:hover {
  transform: translateX(4px);
  border-color: var(--room-green);
}

.book-card__spine {
  position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
  border-radius: 12px 0 0 12px;
  background: var(--room-green);
}

.book-card__tag {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 1px; color: var(--room-green);
  margin-bottom: 6px;
}

.book-card__title {
  font-size: 17px; font-weight: 800; color: var(--text-primary);
  margin: 0 0 4px;
}

.book-card__excerpt {
  font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0;
}

.book-card__meta {
  display: flex; gap: 6px; margin-top: 10px;
  font-size: 11px; color: var(--text-muted);
}

.book-room__hint {
  text-align: center; margin-top: 24px;
  font-size: 13px; color: var(--text-muted); font-style: italic;
}
```

- [ ] **Step 4: Create IdeaLab**

Create `src/components/Rooms/IdeaLab.tsx`:

```tsx
import { ideas } from '../../data/ideas';
import './IdeaLab.css';

export default function IdeaLab() {
  return (
    <div className="idea-lab">
      {/* Whiteboard */}
      <div className="idea-lab__whiteboard">
        <div className="idea-lab__whiteboard-header">
          <span>📋</span> What's Brewing
        </div>
        <p className="idea-lab__whiteboard-sub">
          Ideas I'm obsessed with. If you're thinking about these too — find me.
        </p>
      </div>

      {/* Idea cards */}
      <div className="idea-lab__grid">
        {ideas.map(idea => (
          <div key={idea.id} className="idea-card">
            <span className="idea-card__icon">{idea.icon}</span>
            <h3 className="idea-card__title">{idea.title}</h3>
            <p className="idea-card__why">{idea.why}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Create `src/components/Rooms/IdeaLab.css`:

```css
.idea-lab { display: flex; flex-direction: column; gap: 20px; }

.idea-lab__whiteboard {
  padding: 20px; border-radius: 12px;
  background: var(--bg-secondary); border: 1px solid var(--border-subtle);
}
.idea-lab__whiteboard-header {
  font-size: 16px; font-weight: 800; color: var(--room-yellow);
  display: flex; align-items: center; gap: 8px;
}
.idea-lab__whiteboard-sub {
  font-size: 13px; color: var(--text-secondary); margin: 6px 0 0; line-height: 1.5;
}

.idea-lab__grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;
}

.idea-card {
  padding: 20px; border-radius: 12px;
  border: 1.5px dashed var(--room-yellow-border);
  background: var(--room-yellow-glow);
  transition: transform 0.2s, border-color 0.2s;
}
.idea-card:hover {
  transform: translateY(-2px);
  border-color: var(--room-yellow);
}

.idea-card__icon { font-size: 24px; }
.idea-card__title {
  font-size: 15px; font-weight: 800; color: var(--text-primary);
  margin: 8px 0 4px;
}
.idea-card__why {
  font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 0;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Rooms/
git commit -m "feat: add all room interiors — MyRoom, ProductRoom, BookRoom, IdeaLab"
```

---

## Task 8: Wire Everything Together in App.tsx

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/components/LandingPage.tsx`
- Delete: `src/styles/LandingPage.css`

- [ ] **Step 1: Replace App.tsx with room routing**

Replace `src/App.tsx`:

```tsx
import { useState, useCallback } from 'react';
import { rooms } from './data/rooms';
import FloorPlan from './components/World/FloorPlan';
import RoomView from './components/Rooms/RoomView';
import MyRoom from './components/Rooms/MyRoom';
import ProductRoom from './components/Rooms/ProductRoom';
import BookRoom from './components/Rooms/BookRoom';
import IdeaLab from './components/Rooms/IdeaLab';
import ThemeToggle from './components/shared/ThemeToggle';

const roomComponents: Record<string, React.ComponentType> = {
  'my-room': MyRoom,
  'product-room': ProductRoom,
  'book-room': BookRoom,
  'idea-lab': IdeaLab,
};

export default function App() {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  const handleEnterRoom = useCallback((roomId: string) => {
    setActiveRoomId(roomId);
  }, []);

  const handleBack = useCallback(() => {
    setActiveRoomId(null);
  }, []);

  const activeRoom = activeRoomId ? rooms.find(r => r.id === activeRoomId) : null;
  const ActiveComponent = activeRoomId ? roomComponents[activeRoomId] : null;

  return (
    <>
      <ThemeToggle />
      {activeRoom && ActiveComponent ? (
        <RoomView room={activeRoom} onBack={handleBack}>
          <ActiveComponent />
        </RoomView>
      ) : (
        <FloorPlan onEnterRoom={handleEnterRoom} />
      )}
    </>
  );
}
```

- [ ] **Step 2: Delete old LandingPage files**

```bash
rm src/components/LandingPage.tsx src/styles/LandingPage.css
```

- [ ] **Step 3: Build and verify no errors**

Run: `cd /Users/surixing/Code/iamsuri && npx vite build 2>&1`
Expected: Build succeeds.

- [ ] **Step 4: Start dev server, visually verify floor plan + room navigation works**

Run: `cd /Users/surixing/Code/iamsuri && npx vite --port 3001`

Open `http://localhost:3001`. Verify:
1. Floor plan shows 4 rooms in 2×2 grid with character in center
2. Dark mode by default, light mode toggle works
3. Clicking a room shows the room interior with zoom-in animation
4. Back button returns to floor plan
5. Each room has correct content (products, blog, ideas, bio)

Take screenshots with Playwright for evidence.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: wire up 2D world — floor plan with room navigation"
```

---

## Task 9: Visual Polish Pass

**Files:** Various CSS files from tasks above.

This task is about making it look **better than Star Office UI**. The implementer should:

- [ ] **Step 1: Take screenshots of current state**

```bash
npx playwright screenshot --browser chromium "http://localhost:3001" /tmp/iamsuri-floor-dark.png
```

Then toggle to light mode and screenshot again.

- [ ] **Step 2: Compare against Star Office UI**

Take screenshot of Star Office UI:
```bash
npx playwright screenshot --browser chromium "https://star-office.onrender.com" /tmp/star-office.png
```

Read both screenshots. Identify what Star Office does well (pixel art charm, cohesive theme, character animation) and what iamsuri should do better (modern design, polished transitions, better typography, more visual depth).

- [ ] **Step 3: Polish based on comparison**

Focus areas:
1. **Room tile hover effects** — ensure glowing border + scale feels premium
2. **Character animation** — float should be smooth, shadow should pulse
3. **Transition quality** — room enter/exit should feel buttery
4. **Typography** — font weights, spacing, hierarchy should be crisp
5. **Color harmony** — room colors should feel cohesive, not jarring
6. **Empty states** — "coming soon" stands should look intentional, not broken
7. **Mobile** — test at 375px width, ensure rooms stack properly

Make CSS adjustments as needed. Every change should be verified with a screenshot.

- [ ] **Step 4: Final screenshot verification**

Take final screenshots of:
1. Floor plan dark mode
2. Floor plan light mode
3. Each room interior (4 rooms × 2 themes = 8 screenshots)

All 10 screenshots must look polished and cohesive.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "polish: visual refinements for floor plan and room interiors"
```

---

## Task 10: Deploy to GitHub Pages

**Files:**
- Modify: `vite.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Configure Vite for GitHub Pages**

Update `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/iamsuri/',
})
```

- [ ] **Step 2: Add deploy script**

Add to `package.json` scripts:

```json
"deploy": "vite build && gh-pages -d dist"
```

Install gh-pages: `npm install -D gh-pages`

- [ ] **Step 3: Build and verify**

```bash
cd /Users/surixing/Code/iamsuri && npx vite build 2>&1
```

- [ ] **Step 4: Push to GitHub**

```bash
git add -A
git commit -m "feat: configure GitHub Pages deployment"
git push origin main
```

- [ ] **Step 5: Deploy**

```bash
npm run deploy
```

Verify at `https://surixing.github.io/iamsuri/`
