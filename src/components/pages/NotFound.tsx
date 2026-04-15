import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/fonts.css';
import './Landing.css';
import './CategoryPage.css';
import './NotFound.css';

/**
 * /404 — editorial 404. Rewritten in P2.3 to match the landing
 * typography system: display-serif "404" hero + subhead + 3 helpful
 * links. Inherits the persistent chrome (SkipLink, ThemeToggle,
 * SearchBox, ProjectsDock) from the route shell in App.tsx.
 */
export function NotFound() {
  useEffect(() => {
    document.title = "404 — Suri's Lab";
  }, []);

  return (
    <main className="cat-page cat-page--narrow notfound" id="main" tabIndex={-1}>
      <p className="notfound__eyebrow">Error / 404</p>
      <h1 className="notfound__display" aria-label="404 — page not found">
        4<span className="notfound__display-accent">0</span>4
      </h1>
      <p className="notfound__lede">
        This page doesn&apos;t exist — yet. Either the link is wrong, or
        I haven&apos;t shipped it.
      </p>
      <p className="notfound__sub">
        No shame. Here&apos;s where to go instead:
      </p>
      <ul className="notfound__links" aria-label="Suggested destinations">
        <li>
          <Link to="/" className="notfound__link">
            <span className="notfound__link-label">Home</span>
            <span className="notfound__link-sub">
              the landing — hero, shipped work, notes, ideas
            </span>
          </Link>
        </li>
        <li>
          <Link to="/writing" className="notfound__link">
            <span className="notfound__link-label">Writing</span>
            <span className="notfound__link-sub">
              short essays on building and thinking
            </span>
          </Link>
        </li>
        <li>
          <Link to="/work" className="notfound__link">
            <span className="notfound__link-label">Work</span>
            <span className="notfound__link-sub">
              small tools I actually shipped
            </span>
          </Link>
        </li>
      </ul>
    </main>
  );
}
