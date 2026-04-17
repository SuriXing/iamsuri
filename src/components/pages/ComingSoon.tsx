import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/fonts.css';
import './Landing.css';
import './CategoryPage.css';
import './NotFound.css';

/**
 * Shared "Coming soon" page for links that don't have a destination yet
 * (Blog, AnonCafe). Reuses the NotFound editorial styling so the visual
 * language stays consistent — no new CSS needed.
 *
 * The label comes from the route's pathname so the same component serves
 * /blog and /anoncafe without duplication.
 */
const LABELS: Record<string, string> = {
  '/blog': 'Blog',
  '/anoncafe': 'AnonCafe',
};

export function ComingSoon() {
  const { pathname } = useLocation();
  const label = LABELS[pathname] ?? 'This page';

  useEffect(() => {
    document.title = `${label} — Coming soon — Suri's Lab`;
  }, [label]);

  return (
    <main className="cat-page cat-page--narrow notfound" id="main" tabIndex={-1}>
      <p className="notfound__eyebrow">{label}</p>
      <h1 className="notfound__display" aria-label={`${label} — coming soon`}>
        soon
      </h1>
      <p className="notfound__lede">
        {label} isn&apos;t live yet — I&apos;m still writing it. Check back
        in a few weeks.
      </p>
      <p className="notfound__sub">In the meantime:</p>
      <ul className="notfound__links" aria-label="Suggested destinations">
        <li>
          <Link to="/writing" className="notfound__link">
            <span className="notfound__link-label">Writing</span>
            <span className="notfound__link-sub">
              short essays on building and thinking
            </span>
          </Link>
        </li>
        <li>
          <Link to="/" className="notfound__link">
            <span className="notfound__link-label">Home</span>
            <span className="notfound__link-sub">back to the landing</span>
          </Link>
        </li>
      </ul>
    </main>
  );
}
