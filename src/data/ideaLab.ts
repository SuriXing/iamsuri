/**
 * Shared content for the Idea Lab scene (used by both 2D and 3D views).
 * 3D rendering is the source of truth — see `src/world3d/scene/rooms/IdeaLab.tsx`.
 *
 * Note: `src/data/ideas.ts` holds a different list of ideas used by the 2D
 * idea-lab card grid. The whiteboard ideas below mirror the 3D scene's
 * interactable text exactly so this extraction is a pure refactor. Future
 * units can reconcile the two sources during the 2D IdeaLab rewrite.
 */

import type { RoomDialogue } from './myRoom';

interface WhiteboardIdea {
  id: string;
  title: string;
}

interface IdeaLabContent {
  whiteboardIdeas: readonly WhiteboardIdea[];
  whiteboardTagline: string;
  dialogues: {
    ideaBoard: RoomDialogue;
  };
}

const WHITEBOARD_IDEAS: readonly WhiteboardIdea[] = [
  { id: 'ai-study-buddy', title: 'AI Study Buddy' },
  { id: 'debate-trainer', title: 'Debate Trainer' },
  { id: 'visual-math', title: 'Visual Math' },
];

const WHITEBOARD_TAGLINE = 'Ideas brewing in the lab.';

/** Preserve the exact body string the 3D scene originally hard-coded. */
const ideaBoardBody = `${WHITEBOARD_IDEAS.map((i) => i.title).join(' · ')}. ${WHITEBOARD_TAGLINE}`;

export const IDEA_LAB_CONTENT: IdeaLabContent = {
  whiteboardIdeas: WHITEBOARD_IDEAS,
  whiteboardTagline: WHITEBOARD_TAGLINE,
  dialogues: {
    ideaBoard: {
      title: 'Idea Board',
      body: ideaBoardBody,
    },
  },
};
