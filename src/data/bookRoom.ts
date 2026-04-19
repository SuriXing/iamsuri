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
