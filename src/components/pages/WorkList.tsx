import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { products } from '../../data/products';
import { formatDate } from '../../lib/date';
import { normalizeTag, normalizeTags } from '../../lib/tags';
import '../../styles/fonts.css';
import './Landing.css';
import './CategoryPage.css';

/**
 * /work — list of all shipped products. Tag filter chips at top.
 *
 * Reuses `.card` / `.chip` / `.badge` primitives from Landing.css and
 * adds page-shell layout via CategoryPage.css.
 */
export default function WorkList() {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Work — Suri's Lab";
  }, []);

  // All unique tags across all products, normalized.
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      for (const t of normalizeTags(p.tags)) set.add(t);
    }
    return [...set].sort();
  }, []);

  const visible = useMemo(() => {
    if (!activeTag) return products;
    return products.filter((p) =>
      p.tags.some((t) => normalizeTag(t) === activeTag),
    );
  }, [activeTag]);

  return (
    <main className="cat-page" id="main" tabIndex={-1}>
      <Link to="/" className="cat-back">
        <span aria-hidden>←</span> back to home
      </Link>

      <header className="cat-header">
        <p className="cat-header__eyebrow">01 / Work</p>
        <h1 className="cat-header__title">Shipped</h1>
        <p className="cat-header__description">
          Small tools I built to solve a problem I actually had. Live on
          Vercel — click any card for the case study.
        </p>
      </header>

      {allTags.length > 0 && (
        <div
          className="cat-filters"
          role="group"
          aria-label="Filter work by tag"
        >
          <span className="cat-filters__label">tag:</span>
          <button
            type="button"
            className="cat-filter"
            aria-pressed={activeTag === null}
            onClick={() => setActiveTag(null)}
          >
            all
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="cat-filter"
              aria-pressed={activeTag === tag}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="cat-list__empty">No work matches that tag.</p>
      ) : (
        <div className="cat-grid cat-grid--work">
          {visible.map((product) => (
            <article key={product.slug} className="card card--work">
              <Link to={`/work/${product.slug}`} className="card__link">
                <div className="card__header">
                  <span className={`badge badge--${product.status}`}>
                    {product.status.replace('-', ' ')}
                  </span>
                  <time className="card__date" dateTime={product.date}>
                    {formatDate(product.date)}
                  </time>
                </div>
                <h2 className="card__title">{product.title}</h2>
                {product.subtitle && (
                  <p className="card__subtitle">{product.subtitle}</p>
                )}
                <p className="card__excerpt">{product.excerpt}</p>
                <ul
                  className="card__tags"
                  aria-label={`${product.title} tags`}
                >
                  {normalizeTags(product.tags)
                    .slice(0, 4)
                    .map((tag) => (
                      <li key={tag} className="chip">
                        {tag}
                      </li>
                    ))}
                </ul>
                {product.metrics && product.metrics.length > 0 && (
                  <dl className="card__metrics" aria-label="Outcomes">
                    {product.metrics.map((m) => (
                      <div key={m.label} className="metric">
                        <dt className="metric__label">{m.label}</dt>
                        <dd className="metric__value">{m.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
