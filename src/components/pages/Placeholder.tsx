import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import './CategoryPage.css';

interface PlaceholderProps {
  name: string;
}

/**
 * Lightweight placeholder for any leftover route whose real
 * implementation hasn't shipped yet. P1.7 replaces every concrete
 * route with a real page; this remains as a safety net for any
 * future routes added before their real component lands.
 *
 * Rewritten in P1.7 to consume tokens.css instead of hardcoded
 * `#7c5cfc` (which failed WCAG AA contrast on both themes).
 */
export function Placeholder({ name }: PlaceholderProps) {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug;

  useEffect(() => {
    document.title = `${name}${slug ? ` / ${slug}` : ''} — Suri's Lab`;
  }, [name, slug]);

  return (
    <main className="cat-page cat-page--narrow" id="main" tabIndex={-1}>
      <Link to="/" className="cat-back">
        <span aria-hidden>←</span> back to home
      </Link>
      <header className="cat-header">
        <p className="cat-header__eyebrow">Placeholder</p>
        <h1 className="cat-header__title">
          {name}
          {slug ? <span style={{ opacity: 0.6 }}> / {slug}</span> : null}
        </h1>
        <p className="cat-header__description">
          This route doesn&apos;t have a real page yet.
        </p>
      </header>
    </main>
  );
}
