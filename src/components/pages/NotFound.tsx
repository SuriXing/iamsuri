import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CategoryPage.css';

/**
 * 404 fallback. Rewritten in P1.7 to use the editorial token system
 * (drains the P1.2 a11y backlog item: hardcoded `#7c5cfc` link failed
 * WCAG AA on both themes; tap target was sub-44px).
 */
export function NotFound() {
  useEffect(() => {
    document.title = "404 — Suri's Lab";
  }, []);

  return (
    <main className="cat-page cat-page--narrow" id="main" tabIndex={-1}>
      <header className="cat-header">
        <p className="cat-header__eyebrow">Error</p>
        <h1 className="cat-header__title">404</h1>
        <p className="cat-header__description">
          This page doesn&apos;t exist — yet.
        </p>
      </header>
      <Link to="/" className="cat-back">
        <span aria-hidden>←</span> back to home
      </Link>
    </main>
  );
}
