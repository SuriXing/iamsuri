/**
 * Shared content for the My Room scene (used by both 2D and 3D views).
 * 3D rendering is the source of truth — see `src/world3d/scene/rooms/MyRoom.tsx`.
 */

export interface RoomDialogue {
  title: string;
  body: string;
  link?: string;
}

interface MyRoomContent {
  dialogues: {
    bed: RoomDialogue;
    monitor: RoomDialogue;
  };
  /** Book spine colors for the bookshelf visible inside My Room. */
  shelfBookColors: readonly string[];
}

export const MY_ROOM_CONTENT: MyRoomContent = {
  dialogues: {
    bed: {
      title: 'My Bed',
      body: 'A cozy corner. Sometimes the best ideas come right before sleep.',
    },
    monitor: {
      title: 'About Suri',
      body: 'Suri Xing, Grade 8 — Math · Design · Debate · Building. Check back for more.',
    },
  },
  shelfBookColors: ['#e94560', '#3b82f6', '#f4a8b8', '#f8c4d0', '#ffd700'],
};
