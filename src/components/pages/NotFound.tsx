import { useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * 404 fallback for the catch-all route. Kept minimal until the P1.5
 * editorial landing ships — at that point this will adopt the same
 * typography system.
 */
export function NotFound() {
  useEffect(() => {
    document.title = "404 — Suri's Lab";
  }, []);

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
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>404</h1>
      <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>
        This page doesn&apos;t exist — yet.
      </p>
      <p>
        <Link to="/" style={{ color: '#7c5cfc' }}>
          &larr; Back to home
        </Link>
      </p>
    </main>
  );
}
