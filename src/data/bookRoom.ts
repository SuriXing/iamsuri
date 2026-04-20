/**
 * Shared content for the Book Room scene (used by both 2D and 3D views).
 * 3D rendering is the source of truth — see `src/world3d/scene/rooms/BookRoom.tsx`.
 */

import type { RoomDialogue } from './myRoom';

interface BlogPost {
  id: string;
  title: string;
  date: string;
}

interface BookRoomContent {
  blogPosts: readonly BlogPost[];
  blogStatus: string;
  dialogues: {
    blog: RoomDialogue;
    xuSanGuan: RoomDialogue;
  };
  shelfBookColors: readonly string[];
}

/** Hero books on the front-wall flanking shelves. Each becomes a clickable
 *  invisible plane that opens an InteractModal. Placeholder reviews for now —
 *  real reviews get filled in later. */
export interface BookEntry {
  id: string;
  title: string;
  author: string;
  /** Which shelf the book lives on. */
  shelf: 'front-left' | 'front-right';
  /** 0 = bottom plank, growing up. */
  row: number;
  /** 0..(booksPerRow-1) along that shelf. */
  col: number;
  spineColor: string;
  /** Review body shown in the modal. */
  review: string;
}

const PLACEHOLDER = '(Review coming soon — Suri is still reading.)';

export const BOOK_ENTRIES: ReadonlyArray<BookEntry> = [
  // ── front-left shelf (6 books) ───────────────────────────
  { id: 'fl-0', title: '三体',                  author: '刘慈欣',          shelf: 'front-left',  row: 3, col: 1, spineColor: '#dda0a0', review: PLACEHOLDER },
  { id: 'fl-1', title: '活着',                  author: '余华',            shelf: 'front-left',  row: 3, col: 3, spineColor: '#9bb58c', review: PLACEHOLDER },
  { id: 'fl-2', title: 'Sapiens',               author: 'Yuval N. Harari', shelf: 'front-left',  row: 2, col: 1, spineColor: '#8ba7b8', review: PLACEHOLDER },
  { id: 'fl-3', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', shelf: 'front-left',  row: 2, col: 3, spineColor: '#d4b48c', review: PLACEHOLDER },
  { id: 'fl-4', title: '小王子',                author: 'Saint-Exupéry',   shelf: 'front-left',  row: 1, col: 1, spineColor: '#c8a48c', review: PLACEHOLDER },
  { id: 'fl-5', title: 'The Martian',           author: 'Andy Weir',       shelf: 'front-left',  row: 1, col: 3, spineColor: '#b89d7a', review: PLACEHOLDER },
  // ── front-right shelf (6 books) ──────────────────────────
  { id: 'fr-0', title: '百年孤独',              author: 'Gabriel G. Márquez', shelf: 'front-right', row: 3, col: 1, spineColor: '#dda0a0', review: PLACEHOLDER },
  { id: 'fr-1', title: '人类简史',              author: 'Yuval N. Harari',    shelf: 'front-right', row: 3, col: 3, spineColor: '#a8b59c', review: PLACEHOLDER },
  { id: 'fr-2', title: 'Harry Potter 1',        author: 'J.K. Rowling',       shelf: 'front-right', row: 2, col: 1, spineColor: '#e8dcc4', review: PLACEHOLDER },
  { id: 'fr-3', title: '城南旧事',              author: '林海音',             shelf: 'front-right', row: 2, col: 3, spineColor: '#8ba7b8', review: PLACEHOLDER },
  { id: 'fr-4', title: '1984',                  author: 'George Orwell',      shelf: 'front-right', row: 1, col: 1, spineColor: '#d4b48c', review: PLACEHOLDER },
  { id: 'fr-5', title: 'The Little Prince',     author: 'Saint-Exupéry',      shelf: 'front-right', row: 1, col: 3, spineColor: '#c8a48c', review: PLACEHOLDER },
];

const BLOG_POSTS: readonly BlogPost[] = [
  { id: 'why-i-build-things', title: 'Why I Build Things', date: 'Apr 2026' },
  { id: 'learning-by-shipping', title: 'Learning by Shipping', date: 'Mar 2026' },
];

const BLOG_STATUS = 'Coming soon';

/** Preserve the exact body string the 3D scene originally hard-coded. */
const blogBody = `${BLOG_POSTS.map((p) => `${p.title} · ${p.date}`).join('. ')}. (${BLOG_STATUS})`;

export const BOOK_ROOM_CONTENT: BookRoomContent = {
  blogPosts: BLOG_POSTS,
  blogStatus: BLOG_STATUS,
  dialogues: {
    blog: {
      title: 'Blog',
      body: blogBody,
    },
    xuSanGuan: {
      title: '读《许三观卖血记》(余华)',
      body: '余华的长篇小说，讲述丝厂送茧工许三观靠一次次卖血撑起一家人——从娶妻、养子，到饥荒年代用血换一碗面条，再到文革风暴中为儿子续命。粗粝、荒诞又带着冷幽默的家庭寓言，写尽小人物在时代碾压下的隐忍与温情。',
    },
  },
  shelfBookColors: ['#e94560', '#3b82f6', '#ffd700', '#22c55e', '#a78bfa', '#f97316'],
};
