/**
 * Shared content for the Product Room scene (used by both 2D and 3D views).
 * 3D rendering is the source of truth — see `src/world3d/scene/rooms/ProductRoom.tsx`.
 *
 * Note: `src/data/products.ts` holds the canonical product catalogue used by
 * the 2D Product Room card grid. The strings below mirror the 3D scene's
 * interactable text exactly so this extraction is a pure refactor. Future
 * units can reconcile the two sources during the 2D ProductRoom rewrite.
 */

import type { RoomDialogue } from './myRoom';

interface ProductRoomContent {
  dialogues: {
    problemSolver: RoomDialogue;
    mentorTable: RoomDialogue;
  };
  /** Colors for the three showcase cubes on the product table. */
  showcaseCubeColors: readonly string[];
}

export const PRODUCT_ROOM_CONTENT: ProductRoomContent = {
  dialogues: {
    problemSolver: {
      title: 'Problem Solver',
      body: 'Drop your worry in, get help thinking it through.',
      link: 'https://problem-solver.vercel.app',
    },
    mentorTable: {
      title: 'Mentor Table',
      body: 'Chat with great minds — practice thinking with AI versions of historical figures.',
      link: 'https://mentor-table.vercel.app',
    },
  },
  showcaseCubeColors: ['#e94560', '#ffd700', '#22c55e'],
};
