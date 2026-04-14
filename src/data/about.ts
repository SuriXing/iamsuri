/**
 * Canonical "About Suri" content for the 2D rich portfolio.
 *
 * Shape: `AboutSuri` from `./schema`. Seeded from the 3D MyRoom monitor
 * dialogue ("Suri Xing, Grade 8 — Math · Design · Debate · Building") and
 * expanded into a proper multi-paragraph bio for P1.7.
 *
 * The legacy `src/data/myRoom.ts` is NOT touched — it stays as the 3D
 * scene's interactable content source. This file is the 2D canonical one.
 */

import type { AboutSuri } from './schema';

export type { AboutSuri } from './schema';

export const about: AboutSuri = {
  name: 'Suri Xing',
  tagline: 'Grade 8 · Math · Design · Debate · Building',
  bio: [
    'Hi — I\'m Suri. I\'m in 8th grade. I build small things on the internet because it\'s the fastest way I know to turn an idea into something real.',
    '',
    'I grew up loving math the way other kids love sports — for the puzzles and the patterns. Somewhere along the way that turned into a habit of looking for structure in everything: debate cases, chord progressions, the layout of a webpage, the shape of my own worries.',
    '',
    'Most of my projects live at the intersection of math, design, and people. Problem Solver and Mentor Table are the first two that made it out into the world. The ideas page has the ones still brewing.',
    '',
    'If any of it resonates — or you\'ve thought about building one of these things yourself — find me. I\'d rather have one real conversation than a hundred page views.',
  ].join('\n'),
  contact: {
    email: 'hi@iamsuri.ai',
    github: 'https://github.com/surixing',
  },
  tags: ['Math', 'Design', 'Debate', 'Building', 'Writing', 'AI'],
};
