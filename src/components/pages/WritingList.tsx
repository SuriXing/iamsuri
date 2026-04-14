import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { posts } from '../../data/posts';
import type {
  Post,
  InlinePost,
  ExternalPost,
  ComingSoonPost,
} from '../../data/schema';
import { formatDate } from '../../lib/date';
import { normalizeTags } from '../../lib/tags';
import '../../styles/fonts.css';
import './Landing.css';
import './CategoryPage.css';

/**
 * /writing — list of all writing entries (inline + external + coming-soon),
 * sorted by date desc.
 */
export default function WritingList() {
  useEffect(() => {
    document.title = "Writing — Suri's Lab";
  }, []);

  const sorted = useMemo(
    () => [...posts].sort((a, b) => b.date.localeCompare(a.date)),
    [],
  );

  return (
    <main className="cat-page" id="main" tabIndex={-1}>
      <Link to="/" className="cat-back">
        <span aria-hidden>←</span> back to home
      </Link>

      <header className="cat-header">
        <p className="cat-header__eyebrow">02 / Writing</p>
        <h1 className="cat-header__title">Notes</h1>
        <p className="cat-header__description">
          Short essays on building, thinking, and learning by shipping.
          Inline pieces open in-app; external posts link out; coming-soon
          ones are placeholders for things still in draft.
        </p>
      </header>

      <ul className="cat-list">
        {sorted.map((post) => (
          <li key={post.slug}>
            <WritingCard post={post} />
          </li>
        ))}
      </ul>
    </main>
  );
}

function WritingCard({ post }: { post: Post }) {
  switch (post.kind) {
    case 'external':
      return <ExternalCard post={post} />;
    case 'coming-soon':
      return <ComingSoonCard post={post} />;
    case 'inline':
    default:
      return <InlineCard post={post} />;
  }
}

function InlineCard({ post }: { post: InlinePost }) {
  return (
    <article className="card card--writing">
      <Link to={`/writing/${post.slug}`} className="card__link">
        <Meta date={post.date} kind="inline" />
        <h2 className="card__title card__title--writing">{post.title}</h2>
        <p className="card__excerpt">{post.excerpt}</p>
        <Tags tags={post.tags} title={post.title} />
      </Link>
    </article>
  );
}

function ExternalCard({ post }: { post: ExternalPost }) {
  return (
    <article className="card card--writing card--external">
      <a
        href={post.href}
        className="card__link"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Meta date={post.date} kind="external" />
        <h2 className="card__title card__title--writing">
          {post.title}
          <span className="card__external-icon" aria-hidden>
            {' '}
            ↗
          </span>
        </h2>
        <p className="card__excerpt">{post.excerpt}</p>
        <Tags tags={post.tags} title={post.title} />
      </a>
    </article>
  );
}

function ComingSoonCard({ post }: { post: ComingSoonPost }) {
  return (
    <article
      className="card card--writing card--coming-soon"
      aria-disabled="true"
    >
      <div className="card__link card__link--static">
        <Meta date={post.date} kind="coming-soon" />
        <h2 className="card__title card__title--writing">{post.title}</h2>
        <p className="card__excerpt">{post.excerpt}</p>
        <Tags tags={post.tags} title={post.title} />
      </div>
    </article>
  );
}

function Meta({ date, kind }: { date: string; kind: Post['kind'] }) {
  const label =
    kind === 'external'
      ? 'external'
      : kind === 'coming-soon'
        ? 'soon'
        : 'essay';
  return (
    <div className="card__header">
      <span className={`badge badge--${kind}`}>{label}</span>
      <time className="card__date" dateTime={date}>
        {formatDate(date)}
      </time>
    </div>
  );
}

function Tags({ tags, title }: { tags: string[]; title: string }) {
  if (tags.length === 0) return null;
  return (
    <ul className="card__tags" aria-label={`${title} tags`}>
      {normalizeTags(tags)
        .slice(0, 4)
        .map((tag) => (
          <li key={tag} className="chip">
            {tag}
          </li>
        ))}
    </ul>
  );
}
