import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ideas } from '../../data/ideas';
import type { IdeaStatus } from '../../data/schema';
import { normalizeTag, normalizeTags } from '../../lib/tags';
import '../../styles/fonts.css';
import './Landing.css';
import './CategoryPage.css';

const ALL_STATUSES: readonly IdeaStatus[] = [
  'brewing',
  'prototyping',
  'shelved',
] as const;

/**
 * /ideas — list of all ideas with status + tag filters.
 */
export default function IdeasList() {
  const [activeStatus, setActiveStatus] = useState<IdeaStatus | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Ideas — Suri's Lab";
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const idea of ideas) {
      for (const t of normalizeTags(idea.tags)) set.add(t);
    }
    return [...set].sort();
  }, []);

  const visible = useMemo(() => {
    return ideas.filter((idea) => {
      if (activeStatus && idea.status !== activeStatus) return false;
      if (
        activeTag &&
        !idea.tags.some((t) => normalizeTag(t) === activeTag)
      ) {
        return false;
      }
      return true;
    });
  }, [activeStatus, activeTag]);

  return (
    <main className="cat-page" id="main" tabIndex={-1}>
      <Link to="/" className="cat-back">
        <span aria-hidden>←</span> back to home
      </Link>

      <header className="cat-header">
        <p className="cat-header__eyebrow">03 / Ideas</p>
        <h1 className="cat-header__title">Brewing</h1>
        <p className="cat-header__description">
          Things I&apos;d build if I had another week — or ten. Filter
          by status or tag below.
        </p>
      </header>

      <div
        className="cat-filters"
        role="group"
        aria-label="Filter ideas by status"
      >
        <span className="cat-filters__label">status:</span>
        <button
          type="button"
          className="cat-filter"
          aria-pressed={activeStatus === null}
          onClick={() => setActiveStatus(null)}
        >
          all
        </button>
        {ALL_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            className="cat-filter"
            aria-pressed={activeStatus === status}
            onClick={() => setActiveStatus(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {allTags.length > 0 && (
        <div
          className="cat-filters"
          role="group"
          aria-label="Filter ideas by tag"
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
        <p className="cat-list__empty">No ideas match that filter.</p>
      ) : (
        <div className="cat-grid cat-grid--ideas">
          {visible.map((idea) => (
            <article key={idea.slug} className="card card--idea">
              <Link to={`/ideas/${idea.slug}`} className="card__link">
                <div className="card__header">
                  {idea.icon && (
                    <span className="card__icon" aria-hidden>
                      {idea.icon}
                    </span>
                  )}
                  <span className={`badge badge--${idea.status}`}>
                    {idea.status}
                  </span>
                </div>
                <h2 className="card__title card__title--idea">{idea.title}</h2>
                <p className="card__excerpt">{idea.why}</p>
                <ul
                  className="card__tags"
                  aria-label={`${idea.title} tags`}
                >
                  {normalizeTags(idea.tags)
                    .slice(0, 4)
                    .map((tag) => (
                      <li key={tag} className="chip">
                        {tag}
                      </li>
                    ))}
                </ul>
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
