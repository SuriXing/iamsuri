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
