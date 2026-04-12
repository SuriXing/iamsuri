// External project links shown in the <ProjectsDock /> on the landing page.
// Edit these when URLs change.

export interface ProjectLink {
  id: string;
  label: string;
  description: string;
  href: string;
  // Accent hue for the dock card.
  hue: string;
}

export const PROJECT_LINKS: readonly ProjectLink[] = [
  {
    id: 'blog',
    label: 'Blog',
    description: 'Things I am writing',
    // TODO: replace with the real blog URL when ready.
    href: 'https://blog.iamsuri.ai',
    hue: '#4ade80',
  },
  {
    id: 'anoncafe',
    label: 'AnonCafe',
    description: 'Anonymous conversations',
    // TODO: replace with the real AnonCafe URL when ready.
    href: 'https://anoncafe.iamsuri.ai',
    hue: '#f4a8b8',
  },
  {
    id: 'mentor-table',
    label: 'Mentor Table',
    description: 'Chat with great minds',
    href: 'https://mentor-table.vercel.app',
    hue: '#fbbf24',
  },
] as const;
