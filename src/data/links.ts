// External project links shown in the <ProjectsDock /> on the landing page.
// Edit these when URLs change.

interface ProjectLink {
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
    // Routes to an on-site "coming soon" page until the external blog
    // (blog.iamsuri.ai) is live. Kept as an internal path so the dock CTA
    // never 404s.
    href: '/blog',
    hue: '#4ade80',
  },
  {
    id: 'anoncafe',
    label: 'AnonCafe',
    description: 'Anonymous conversations',
    // Same as /blog above — internal "coming soon" until anoncafe.iamsuri.ai ships.
    href: '/anoncafe',
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
