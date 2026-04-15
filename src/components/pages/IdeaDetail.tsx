import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ideas } from '../../data/ideas';
import { normalizeTags } from '../../lib/tags';
import { relatedByTags } from '../../lib/related';
import { Prose } from '../../lib/prose';
import '../../styles/fonts.css';
import './Landing.css';
import './CategoryPage.css';

/**
 * /ideas/:slug — single idea page. Title, why, full body, status, tags,
 * related-ideas strip.
 */
export default function IdeaDetail() {
  const { slug } = useParams<{ slug: string }>();
  const idea = ideas.find((i) => i.slug === slug);

  useEffect(() => {
    if (idea) {
      document.title = `${idea.title} — Ideas — Suri's Lab`;
    }
  }, [idea]);

  if (!idea) {
    return <Navigate to="/404" replace />;
  }

  const related = relatedByTags(idea, ideas, 3);

  return (
    <main className="cat-page cat-page--narrow" id="main" tabIndex={-1}>
      <Link to="/ideas" className="cat-back">
        <span aria-hidden>←</span> all ideas
      </Link>

      <header className="cat-detail__hero">
        <p className="cat-detail__eyebrow">
          {idea.icon && (
            <span aria-hidden style={{ fontSize: '1.5rem', lineHeight: 1 }}>
              {idea.icon}
            </span>
          )}
          <span className={`badge badge--${idea.status}`}>{idea.status}</span>
        </p>
        <h1 className="cat-detail__title">{idea.title}</h1>
        <p className="cat-detail__subtitle">{idea.why}</p>
      </header>

      <Prose body={idea.body} className="cat-prose" />

      <ul
        className="card__tags"
        aria-label="Tags"
        style={{ marginTop: '2rem' }}
      >
        {normalizeTags(idea.tags).map((tag) => (
          <li key={tag} className="chip">
            {tag}
          </li>
        ))}
      </ul>

      {related.length > 0 && (
        <section className="cat-related" aria-labelledby="related-ideas">
          <h2 className="cat-related__title" id="related-ideas">
            Related ideas
          </h2>
          <div className="cat-related__grid">
            {related.map((i) => (
              <article key={i.slug} className="card card--idea">
                <Link to={`/ideas/${i.slug}`} className="card__link">
                  <div className="card__header">
                    {i.icon && (
                      <span className="card__icon" aria-hidden>
                        {i.icon}
                      </span>
                    )}
                    <span className={`badge badge--${i.status}`}>
                      {i.status}
                    </span>
                  </div>
                  <h3 className="card__title card__title--idea">{i.title}</h3>
                  <p className="card__excerpt">{i.why}</p>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
