import { PROJECT_LINKS } from '../../data/links';
import './ProjectsDock.css';

/**
 * Floating bottom-bar shown on both 2D and 3D views. Links to external
 * projects (blog, anoncafe, mentor table) open in a new tab.
 */
export default function ProjectsDock() {
  return (
    <nav className="projects-dock" aria-label="External projects">
      <ul>
        {PROJECT_LINKS.map((p) => (
          <li key={p.id}>
            <a
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ['--hue' as string]: p.hue }}
              title={p.description}
            >
              <span className="dot" aria-hidden />
              <span className="label">{p.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
