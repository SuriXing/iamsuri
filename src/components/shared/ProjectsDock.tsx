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
        {PROJECT_LINKS.map((p) => {
          // Internal routes (e.g. /blog coming-soon placeholder) stay in
          // the same tab; external absolute URLs open in a new tab.
          const isExternal = /^https?:\/\//.test(p.href);
          return (
            <li key={p.id}>
              <a
                href={p.href}
                {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                style={{ ['--hue' as string]: p.hue }}
                title={p.description}
              >
                <span className="dot" aria-hidden />
                <span className="label">{p.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
