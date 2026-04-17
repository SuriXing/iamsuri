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
  };
  shelfBookColors: readonly string[];
}

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
  },
  shelfBookColors: ['#e94560', '#3b82f6', '#ffd700', '#22c55e', '#a78bfa', '#f97316'],
};
