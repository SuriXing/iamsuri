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
