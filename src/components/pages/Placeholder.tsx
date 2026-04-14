import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

interface PlaceholderProps {
  name: string;
}

/**
 * Lightweight placeholder for routes whose real implementation ships in
 * P1.7 (content pages). Exists now so P1.1 routing can resolve every URL
 * in the schema and downstream units can deep-link against them.
 */
export function Placeholder({ name }: PlaceholderProps) {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug;

  useEffect(() => {
    document.title = `${name}${slug ? ` / ${slug}` : ''} — Suri's Lab`;
  }, [name, slug]);

  return (
    <main
      style={{
        padding: '2rem',
        maxWidth: 720,
        margin: '0 auto',
        minHeight: '100vh',
        color: 'var(--text-primary, #e6e6f0)',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
        {name}
        {slug ? <span style={{ opacity: 0.6 }}> / {slug}</span> : null}
      </h1>
      <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>
        Coming in Phase 1 unit P1.7.
      </p>
      <p>
        <Link to="/" style={{ color: '#7c5cfc' }}>
          ← Back to home
        </Link>
      </p>
    </main>
  );
}
