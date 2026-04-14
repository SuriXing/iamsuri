import { useEffect, useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { posts } from '../../data/posts';
import { formatDate } from '../../lib/date';
import { normalizeTags } from '../../lib/tags';
import { relatedByTags } from '../../lib/related';
import { Prose } from '../../lib/prose';
import '../../styles/fonts.css';
import './Landing.css';
import './CategoryPage.css';

/**
 * /writing/:slug — single writing entry. Discriminated-union switch on
 * `post.kind`:
 *
 *   inline       → render full body via Prose
 *   external     → render excerpt + prominent "read on ${host}" CTA
 *   coming-soon  → render title + excerpt + "coming soon" affordance
 */
export default function WritingDetail() {
  const { slug } = useParams<{ slug: string }>();
  const post = posts.find((p) => p.slug === slug);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} — Writing — Suri's Lab`;
    }
  }, [post]);

  const related = useMemo(
    () => (post ? relatedByTags(post, posts, 2) : []),
    [post],
  );

  if (!post) {
    return <Navigate to="/404" replace />;
  }

  const kindLabel =
    post.kind === 'external'
      ? 'external'
      : post.kind === 'coming-soon'
        ? 'coming soon'
        : 'essay';

  return (
    <main className="cat-page cat-page--narrow" id="main" tabIndex={-1}>
      <Link to="/writing" className="cat-back">
        <span aria-hidden>←</span> all writing
      </Link>

      <header className="cat-detail__hero">
        <p className="cat-detail__eyebrow">
          <span className={`badge badge--${post.kind}`}>{kindLabel}</span>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </p>
        <h1 className="cat-detail__title">{post.title}</h1>
        <p className="cat-header__description">{post.excerpt}</p>
      </header>

      {post.kind === 'inline' ? (
        <Prose body={post.body} className="cat-prose" />
      ) : post.kind === 'external' ? (
        <div className="cat-detail__actions">
          <a
            href={post.href}
            className="cat-detail__cta"
            target="_blank"
            rel="noopener noreferrer"
          >
            read on {hostnameOf(post.href)} <span aria-hidden>↗</span>
          </a>
        </div>
      ) : (
        <p className="cat-list__empty">
          This post is still in draft. Check back soon.
        </p>
      )}

      <ul
        className="card__tags"
        aria-label="Tags"
        style={{ marginTop: '2rem' }}
      >
        {normalizeTags(post.tags).map((tag) => (
          <li key={tag} className="chip">
            {tag}
          </li>
        ))}
      </ul>

      {related.length > 0 && (
        <section className="cat-related" aria-labelledby="related-writing">
          <h2 className="cat-related__title" id="related-writing">
            Related writing
          </h2>
          <div className="cat-related__grid">
            {related.map((p) => (
              <article key={p.slug} className="card card--writing">
                {p.kind === 'external' ? (
                  <a
                    href={p.href}
                    className="card__link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="card__header">
                      <span className={`badge badge--${p.kind}`}>external</span>
                      <time className="card__date" dateTime={p.date}>
                        {formatDate(p.date)}
                      </time>
                    </div>
                    <h3 className="card__title card__title--writing">
                      {p.title}
                    </h3>
                    <p className="card__excerpt">{p.excerpt}</p>
                  </a>
                ) : p.kind === 'coming-soon' ? (
                  <div
                    className="card__link card__link--static"
                    aria-disabled="true"
                  >
                    <div className="card__header">
                      <span className={`badge badge--${p.kind}`}>soon</span>
                      <time className="card__date" dateTime={p.date}>
                        {formatDate(p.date)}
                      </time>
                    </div>
                    <h3 className="card__title card__title--writing">
                      {p.title}
                    </h3>
                    <p className="card__excerpt">{p.excerpt}</p>
                  </div>
                ) : (
                  <Link to={`/writing/${p.slug}`} className="card__link">
                    <div className="card__header">
                      <span className={`badge badge--${p.kind}`}>essay</span>
                      <time className="card__date" dateTime={p.date}>
                        {formatDate(p.date)}
                      </time>
                    </div>
                    <h3 className="card__title card__title--writing">
                      {p.title}
                    </h3>
                    <p className="card__excerpt">{p.excerpt}</p>
                  </Link>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function hostnameOf(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return href;
  }
}
