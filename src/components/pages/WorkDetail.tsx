import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { products } from '../../data/products';
import { formatDate } from '../../lib/date';
import { normalizeTags } from '../../lib/tags';
import { relatedByTags } from '../../lib/related';
import { Prose } from '../../lib/prose';
import '../../styles/fonts.css';
import './Landing.css';
import './CategoryPage.css';

/**
 * /work/:slug — single product case study.
 *
 * Hero: title + subtitle + tagline + status + date.
 * Body: markdown-ish prose via lib/prose.
 * Footer: metrics, tags, live + repo CTAs, related products strip.
 */
export default function WorkDetail() {
  const { slug } = useParams<{ slug: string }>();
  const product = products.find((p) => p.slug === slug);

  useEffect(() => {
    if (product) {
      document.title = `${product.title} — Work — Suri's Lab`;
    }
  }, [product]);

  if (!product) {
    return <Navigate to="/404" replace />;
  }

  const related = relatedByTags(product, products, 2);

  return (
    <main className="cat-page cat-page--narrow" id="main" tabIndex={-1}>
      <Link to="/work" className="cat-back">
        <span aria-hidden>←</span> all work
      </Link>

      <header className="cat-detail__hero">
        <p className="cat-detail__eyebrow">
          <span className={`badge badge--${product.status}`}>
            {product.status.replace('-', ' ')}
          </span>
          <time dateTime={product.date}>{formatDate(product.date)}</time>
        </p>
        <h1 className="cat-detail__title">{product.title}</h1>
        {product.subtitle && (
          <p className="cat-detail__subtitle">{product.subtitle}</p>
        )}
        <p className="cat-header__description">{product.excerpt}</p>

        {product.metrics && product.metrics.length > 0 && (
          <dl className="cat-detail__metrics" aria-label="Outcomes">
            {product.metrics.map((m) => (
              <div key={m.label} className="metric">
                <dt className="metric__label">{m.label}</dt>
                <dd className="metric__value">{m.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="cat-detail__actions">
          <a
            href={product.href}
            className="cat-detail__cta"
            target="_blank"
            rel="noopener noreferrer"
          >
            live <span aria-hidden>↗</span>
          </a>
          {product.repo && (
            <a
              href={product.repo}
              className="cat-detail__cta cat-detail__cta--secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              repo <span aria-hidden>↗</span>
            </a>
          )}
        </div>
      </header>

      <Prose body={product.body} className="cat-prose" />

      <ul
        className="card__tags"
        aria-label="Tags"
        style={{ marginTop: '2rem' }}
      >
        {normalizeTags(product.tags).map((tag) => (
          <li key={tag} className="chip">
            {tag}
          </li>
        ))}
      </ul>

      {related.length > 0 && (
        <section className="cat-related" aria-labelledby="related-work">
          <h2 className="cat-related__title" id="related-work">
            Related work
          </h2>
          <div className="cat-related__grid">
            {related.map((p) => (
              <article key={p.slug} className="card card--work">
                <Link to={`/work/${p.slug}`} className="card__link">
                  <div className="card__header">
                    <span className={`badge badge--${p.status}`}>
                      {p.status.replace('-', ' ')}
                    </span>
                    <time className="card__date" dateTime={p.date}>
                      {formatDate(p.date)}
                    </time>
                  </div>
                  <h3 className="card__title">{p.title}</h3>
                  {p.subtitle && (
                    <p className="card__subtitle">{p.subtitle}</p>
                  )}
                  <p className="card__excerpt">{p.excerpt}</p>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
