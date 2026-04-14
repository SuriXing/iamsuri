import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { about } from '../../data/about';
import { products } from '../../data/products';
import { posts } from '../../data/posts';
import { ideas } from '../../data/ideas';
import type {
  Post,
  ExternalPost,
  InlinePost,
  ComingSoonPost,
} from '../../data/schema';
import { formatDate } from '../../lib/date';
import { normalizeTag } from '../../lib/tags';
// Font CSS is scoped to the Landing route so the /3d canvas route
// doesn't pay the cost. See src/styles/fonts.css for the three
// @fontsource-variable families.
import '../../styles/fonts.css';
import './Landing.css';

/**
 * Editorial single-scroll landing (P1.5).
 *
 * Sections top→bottom: hero → work → writing → ideas → about → footer.
 * Semantic HTML5 throughout (<main>, <header>, <section>, <article>, <footer>).
 *
 * Content comes straight from the canonical P1.3 data files. Any link into
 * a detail page (/work/:slug, /writing/:slug, /ideas/:slug) routes to the
 * P1.1 placeholder; P1.7 fills those in.
 */
export default function Landing() {
  useEffect(() => {
    document.title = `${about.name} — ${about.tagline}`;
  }, []);

  return (
    <main className="landing" id="main" tabIndex={-1}>
      <HeroSection />
      <WorkSection />
      <WritingSection />
      <IdeasSection />
      <AboutSection />
      <LandingFooter />
    </main>
  );
}

/* -----------------------------------------------------------------------
 * Hero
 * --------------------------------------------------------------------- */

function HeroSection() {
  const [firstName] = about.name.split(' ');
  return (
    <header className="landing-hero" id="top">
      <p className="landing-hero__eyebrow">Portfolio / 2026</p>
      <h1 className="landing-hero__name">
        <span className="landing-hero__name-primary">{firstName}</span>
        <span className="landing-hero__name-rest">
          {about.name.slice(firstName.length)}
        </span>
      </h1>
      <p className="landing-hero__tagline">{about.tagline}</p>
      <p className="landing-hero__intro">
        I&apos;m a Grade 8 builder who ships small, rough, real things to
        learn how ideas actually work. This is where I keep them —
        projects, writing, and ideas still brewing.
      </p>
      <ul className="landing-hero__chips" aria-label="Interests and skills">
        {about.tags.map((tag) => (
          <li key={tag} className="chip chip--mono">
            {tag}
          </li>
        ))}
      </ul>
      <a href="#work" className="landing-hero__scroll" aria-label="Scroll to work">
        <span aria-hidden>scroll</span>
        <span className="landing-hero__scroll-arrow" aria-hidden>
          ↓
        </span>
      </a>
    </header>
  );
}

/* -----------------------------------------------------------------------
 * Work (featured products)
 * --------------------------------------------------------------------- */

function WorkSection() {
  return (
    <section className="landing-section" id="work" aria-labelledby="work-heading">
      <SectionHeader
        eyebrow="01 / Work"
        title="Shipped"
        description="Small tools I built to solve a problem I actually had."
        indexLabel="See all work"
        indexHref="/work"
      />
      <div className="landing-grid landing-grid--work">
        {products.map((product) => (
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
              <h3 className="card__title">{product.title}</h3>
              {product.subtitle && (
                <p className="card__subtitle">{product.subtitle}</p>
              )}
              <p className="card__excerpt">{product.excerpt}</p>
              <ul className="card__tags" aria-label={`${product.title} tags`}>
                {product.tags.slice(0, 4).map((tag) => (
                  <li key={tag} className="chip">
                    {normalizeTag(tag)}
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
    </section>
  );
}

/* -----------------------------------------------------------------------
 * Writing
 * --------------------------------------------------------------------- */

function WritingSection() {
  return (
    <section
      className="landing-section"
      id="writing"
      aria-labelledby="writing-heading"
    >
      <SectionHeader
        eyebrow="02 / Writing"
        title="Notes"
        description="Short essays on building, thinking, and learning by shipping."
        indexLabel="See all writing"
        indexHref="/writing"
      />
      <ul className="landing-list">
        {posts.map((post) => (
          <li key={post.slug} className="landing-list__item">
            <WritingCard post={post} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function WritingCard({ post }: { post: Post }) {
  switch (post.kind) {
    case 'external':
      return <ExternalWritingCard post={post} />;
    case 'coming-soon':
      return <ComingSoonWritingCard post={post} />;
    case 'inline':
    default:
      return <InlineWritingCard post={post} />;
  }
}

function InlineWritingCard({ post }: { post: InlinePost }) {
  return (
    <article className="card card--writing">
      <Link to={`/writing/${post.slug}`} className="card__link">
        <WritingMeta date={post.date} kind="inline" />
        <h3 className="card__title card__title--writing">{post.title}</h3>
        <p className="card__excerpt">{post.excerpt}</p>
        <WritingTags tags={post.tags} title={post.title} />
      </Link>
    </article>
  );
}

function ExternalWritingCard({ post }: { post: ExternalPost }) {
  return (
    <article className="card card--writing card--external">
      <a
        href={post.href}
        className="card__link"
        target="_blank"
        rel="noopener noreferrer"
      >
        <WritingMeta date={post.date} kind="external" />
        <h3 className="card__title card__title--writing">
          {post.title}
          <span className="card__external-icon" aria-hidden>
            {' '}
            ↗
          </span>
        </h3>
        <p className="card__excerpt">{post.excerpt}</p>
        <WritingTags tags={post.tags} title={post.title} />
      </a>
    </article>
  );
}

function ComingSoonWritingCard({ post }: { post: ComingSoonPost }) {
  return (
    <article className="card card--writing card--coming-soon" aria-disabled="true">
      <div className="card__link card__link--static">
        <WritingMeta date={post.date} kind="coming-soon" />
        <h3 className="card__title card__title--writing">{post.title}</h3>
        <p className="card__excerpt">{post.excerpt}</p>
        <WritingTags tags={post.tags} title={post.title} />
      </div>
    </article>
  );
}

function WritingMeta({
  date,
  kind,
}: {
  date: string;
  kind: Post['kind'];
}) {
  const label =
    kind === 'external' ? 'external' : kind === 'coming-soon' ? 'soon' : 'essay';
  return (
    <div className="card__header">
      <span className={`badge badge--${kind}`}>{label}</span>
      <time className="card__date" dateTime={date}>
        {formatDate(date)}
      </time>
    </div>
  );
}

function WritingTags({ tags, title }: { tags: string[]; title: string }) {
  if (tags.length === 0) return null;
  return (
    <ul className="card__tags" aria-label={`${title} tags`}>
      {tags.slice(0, 4).map((tag) => (
        <li key={tag} className="chip">
          {normalizeTag(tag)}
        </li>
      ))}
    </ul>
  );
}

/* -----------------------------------------------------------------------
 * Ideas
 * --------------------------------------------------------------------- */

function IdeasSection() {
  return (
    <section
      className="landing-section"
      id="ideas"
      aria-labelledby="ideas-heading"
    >
      <SectionHeader
        eyebrow="03 / Ideas"
        title="Brewing"
        description={"Things I\u2019d build if I had another week — or ten."}
        indexLabel="See all ideas"
        indexHref="/ideas"
      />
      <div className="landing-grid landing-grid--ideas">
        {ideas.map((idea) => (
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
              <h3 className="card__title card__title--idea">{idea.title}</h3>
              <p className="card__excerpt">{idea.why}</p>
              <ul className="card__tags" aria-label={`${idea.title} tags`}>
                {idea.tags.slice(0, 4).map((tag) => (
                  <li key={tag} className="chip">
                    {normalizeTag(tag)}
                  </li>
                ))}
              </ul>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

/* -----------------------------------------------------------------------
 * About
 * --------------------------------------------------------------------- */

function AboutSection() {
  const bioParagraphs = about.bio.split('\n').filter((p) => p.trim().length > 0);
  return (
    <section
      className="landing-section landing-section--about"
      id="about"
      aria-labelledby="about-heading"
    >
      <SectionHeader
        eyebrow="04 / About"
        title="Me"
        description={null}
        indexLabel="Full bio"
        indexHref="/about"
      />
      <div className="landing-about">
        <div className="landing-about__photo" aria-hidden>
          <div className="landing-about__photo-inner">
            <span className="landing-about__photo-initial">
              {about.name[0]}
            </span>
          </div>
        </div>
        <div className="landing-about__body">
          {bioParagraphs.map((para, i) => (
            <p key={i} className="landing-about__para">
              {para}
            </p>
          ))}
          <address className="landing-about__contact" aria-label="Contact">
            <ul className="landing-about__contact-list">
              {about.contact.email && (
                <li>
                  <a
                    href={`mailto:${about.contact.email}`}
                    className="landing-about__contact-link"
                  >
                    Email
                  </a>
                </li>
              )}
              {about.contact.github && (
                <li>
                  <a
                    href={about.contact.github}
                    className="landing-about__contact-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                </li>
              )}
              {about.contact.twitter && (
                <li>
                  <a
                    href={about.contact.twitter}
                    className="landing-about__contact-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Twitter
                  </a>
                </li>
              )}
            </ul>
          </address>
        </div>
      </div>
    </section>
  );
}

/* -----------------------------------------------------------------------
 * Footer
 * --------------------------------------------------------------------- */

function LandingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="landing-footer">
      <div className="landing-footer__inner">
        <p className="landing-footer__copy">
          &copy; {year} {about.name}. Built in public.
        </p>
        <nav className="landing-footer__nav" aria-label="Footer">
          <Link to="/3d" className="landing-footer__link">
            3D world
          </Link>
          <a href="#top" className="landing-footer__link">
            Back to top
          </a>
        </nav>
      </div>
    </footer>
  );
}

/* -----------------------------------------------------------------------
 * Shared bits
 * --------------------------------------------------------------------- */

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description: string | null;
  indexLabel: string;
  indexHref: string;
}

function SectionHeader({
  eyebrow,
  title,
  description,
  indexLabel,
  indexHref,
}: SectionHeaderProps) {
  const id = `${eyebrow.split('/')[1]?.trim().toLowerCase() ?? 'section'}-heading`;
  return (
    <div className="section-header">
      <p className="section-header__eyebrow">{eyebrow}</p>
      <h2 id={id} className="section-header__title">
        {title}
      </h2>
      {description && (
        <p className="section-header__description">{description}</p>
      )}
      <Link to={indexHref} className="section-header__index">
        {indexLabel} <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
