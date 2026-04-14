/**
 * Canonical idea catalogue for the 2D rich portfolio.
 *
 * Shape: `Idea` from `./schema`. Consolidates the three legacy 2D ideas
 * (Debate Flow Digitizer, Math × Music, Visual Proof Gallery) with the three
 * 3D IdeaLab whiteboard stubs (AI Study Buddy, Debate Trainer, Visual Math).
 *
 * Reconciliation notes:
 *   - "Debate Trainer" (3D) is the same space as "Debate Flow Digitizer" (2D).
 *     The 2D framing is more specific and is kept as the canonical title;
 *     "Debate Trainer" is mentioned in the body as an expansion path.
 *   - "Visual Math" (3D) maps onto "Visual Proof Gallery" (2D) — same
 *     intuition (make math visible). 2D title kept; 3D wording merged in.
 *   - "AI Study Buddy" (3D) has no 2D counterpart — promoted to its own entry.
 *   - "Math × Music" (2D) has no 3D counterpart — kept as-is.
 */

import type { Idea } from './schema';

// Re-export canonical type so legacy importers keep compiling.
export type { Idea } from './schema';

export const ideas: Idea[] = [
  {
    slug: 'debate-flow',
    title: 'Debate Flow Digitizer',
    why: 'Why do debate coaches still use paper flow sheets in 2026?',
    body: [
      'Flow sheets track who argued what, when, and who answered it — the DNA of a debate round. Every serious debater keeps one. Every coach wishes they could analyze them later. Almost nobody does, because they live on paper.',
      '',
      'A digital flow would unlock post-round review, pattern-matching across tournaments, and drills built from a debater\'s actual weak spots. Think "Strava for debate rounds" — plus an AI trainer that can walk you through how you should have responded.',
      '',
      'Long-term: pair this with a live voice transcript and it becomes a real-time Debate Trainer.',
    ].join('\n'),
    tags: ['Debate', 'AI', 'Education', 'Tooling'],
    status: 'brewing',
    icon: '🗣️',
  },
  {
    slug: 'math-music',
    title: 'Math × Music',
    why: 'Patterns in harmonic progressions that math can explain.',
    body: [
      'A chord progression is a path through a graph of tonal relationships. The "nice sounding" ones follow rules that are almost purely mathematical — voice leading, tension and release, symmetry.',
      '',
      'I want to build an interactive explainer where you can hear a progression *and* see the math that makes it work. Like Bret Victor\'s "Kill Math" but for harmony.',
    ].join('\n'),
    tags: ['Math', 'Music', 'Visualization'],
    status: 'brewing',
    icon: '🎵',
  },
  {
    slug: 'visual-proofs',
    title: 'Visual Proof Gallery',
    why: 'Beautiful mathematical proofs that you can see, not just read.',
    body: [
      'Some proofs are only hard because they\'re written as text. Show the same idea as a moving picture and it clicks instantly. The Pythagorean theorem, the sum of the first n odd numbers, the infinitude of primes — there are dozens of these and most people never see them.',
      '',
      'The 3D world has this filed as "Visual Math". Same idea — the gallery is the shipped surface for it.',
    ].join('\n'),
    tags: ['Math', 'Visualization', 'Education'],
    status: 'prototyping',
    icon: '📐',
  },
  {
    slug: 'ai-study-buddy',
    title: 'AI Study Buddy',
    why: 'A study partner that asks *you* the questions, not the other way around.',
    body: [
      'Most "AI tutors" answer questions. The best human study buddies do the opposite — they ask you to explain the thing you think you understand, and the gaps show up immediately.',
      '',
      'Build a tutor whose main loop is active recall: it feeds you the topic, you explain it out loud, it catches the parts you hand-waved and drills back in.',
    ].join('\n'),
    tags: ['AI', 'Education', 'Learning'],
    status: 'brewing',
    icon: '📚',
  },
];
