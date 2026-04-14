import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { about } from '../../data/about';
import { normalizeTags } from '../../lib/tags';
import '../../styles/fonts.css';
import './Landing.css';
import './CategoryPage.css';

/**
 * /about — full bio. Photo placeholder, multi-paragraph bio, tags chips,
 * <address> contact block (P1.7 a11y: drains P1.6 backlog item).
 */
export default function About() {
  useEffect(() => {
    document.title = `About ${about.name} — Suri's Lab`;
  }, []);

  const bioParagraphs = about.bio
    .split('\n')
    .filter((p) => p.trim().length > 0);

  return (
    <main className="cat-page cat-page--narrow" id="main" tabIndex={-1}>
      <Link to="/" className="cat-back">
        <span aria-hidden>←</span> back to home
      </Link>

      <header className="cat-header">
        <p className="cat-header__eyebrow">04 / About</p>
        <h1 className="cat-header__title">{about.name}</h1>
        <p className="cat-header__description">{about.tagline}</p>
      </header>

      <div className="cat-about">
        <div className="cat-about__photo" aria-hidden>
          <span className="cat-about__photo-initial">{about.name[0]}</span>
        </div>

        <div className="cat-about__bio">
          {bioParagraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}

          <ul className="cat-about__chips" aria-label="Interests and skills">
            {normalizeTags(about.tags).map((tag) => (
              <li key={tag} className="chip chip--mono">
                {tag}
              </li>
            ))}
          </ul>

          <address className="cat-about__contact" aria-label="Contact">
            <ul className="cat-about__contact-list">
              {about.contact.email && (
                <li>
                  <a
                    href={`mailto:${about.contact.email}`}
                    className="cat-about__contact-link"
                  >
                    Email
                  </a>
                </li>
              )}
              {about.contact.github && (
                <li>
                  <a
                    href={about.contact.github}
                    className="cat-about__contact-link"
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
                    className="cat-about__contact-link"
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
    </main>
  );
}
