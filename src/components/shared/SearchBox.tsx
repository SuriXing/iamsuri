import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { search, type SearchHit, type SearchKind } from '../../lib/search';
import './SearchBox.css';

/**
 * Global SearchBox (P2.1, a11y-polished in P2.3).
 *
 * Visual: a pill button that sits in the app shell near ThemeToggle.
 * Pressing `/` from any non-input element OR clicking the button opens
 * a centered (desktop) / full-screen (mobile ≤640px) overlay dialog
 * with a search input and a grouped results listbox.
 *
 * Keyboard contract:
 *   - `/`           open overlay + focus input (if not already inside an input)
 *   - `Escape`      close overlay + restore focus to the trigger button
 *   - `↓` / `j`     highlight next result
 *   - `↑` / `k`     highlight prev result
 *   - `Enter`       navigate to highlighted result
 *   - `Tab`/`S+Tab` cycle focus between input and close button only
 *
 * a11y:
 *   - button has aria-label with keybind hint
 *   - overlay is role="dialog" aria-modal
 *   - background siblings get `inert` while open so AT virtual cursors
 *     cannot reach them (aria-modal alone is not enough)
 *   - results are role="listbox" with aria-activedescendant pointing
 *     at the highlighted option
 *   - empty-state / no-results messages are role="status" aria-live
 *   - focus is trapped inside the overlay while open; closing restores
 *     focus to the trigger button
 */

const KIND_LABELS: Record<SearchKind, string> = {
  work: 'Work',
  writing: 'Writing',
  ideas: 'Ideas',
  about: 'About',
};

const KIND_ORDER: readonly SearchKind[] = ['work', 'writing', 'ideas', 'about'];

interface GroupedHits {
  kind: SearchKind;
  items: SearchHit[];
}

function groupHits(hits: readonly SearchHit[]): GroupedHits[] {
  const buckets = new Map<SearchKind, SearchHit[]>();
  for (const h of hits) {
    const arr = buckets.get(h.kind);
    if (arr) arr.push(h);
    else buckets.set(h.kind, [h]);
  }
  const out: GroupedHits[] = [];
  for (const kind of KIND_ORDER) {
    const items = buckets.get(kind);
    if (items && items.length > 0) out.push({ kind, items });
  }
  return out;
}

export default function SearchBox() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const listboxId = useId();
  const titleId = useId();

  const navigate = useNavigate();

  // Flat results (for keyboard navigation by index) + grouped view
  // (for rendering). Both derive from the same source of truth so the
  // aria-activedescendant id always matches the rendered DOM.
  // P2.3 (from P2.2 architect 🟡): dropped the 50ms debounce — client-
  // side search over tens of docs is instant; the debounce was
  // over-engineering that also stalled aria-activedescendant updates.
  const results = useMemo<SearchHit[]>(() => {
    if (query.trim().length === 0) return [];
    return search(query, { limit: 12 });
  }, [query]);

  const grouped = useMemo(() => groupHits(results), [results]);

  // Reset highlight to 0 whenever the results identity changes.
  // React 19 "adjust state during render" pattern:
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [trackedResults, setTrackedResults] =
    useState<readonly SearchHit[]>(results);
  if (trackedResults !== results) {
    setTrackedResults(results);
    setActiveIndex(0);
  }

  const closeOverlay = useCallback(() => {
    setOpen(false);
    // Restore focus to the trigger so keyboard users don't get stranded
    // in the document body.
    window.requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, []);

  const openOverlay = useCallback(() => {
    setOpen(true);
    // Focus the input after the overlay mounts.
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, []);

  // Global `/` keybind — opens the overlay from anywhere on the page
  // unless the user is already typing in an input/textarea/editable.
  useEffect(() => {
    function onKeydown(event: KeyboardEvent) {
      if (event.key !== '/') return;
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          target.isContentEditable
        ) {
          return;
        }
      }
      event.preventDefault();
      openOverlay();
    }
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [openOverlay]);

  // When the overlay opens, lock body scroll + mark background as inert
  // so AT virtual cursors + Tab cannot reach elements behind the dialog.
  // Clean up on close.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Mark every top-level body child (except the one hosting the
    // portal-less dialog, which is also a body child — we scope by
    // className to skip it) as `inert`. P2.3 a11y fix (P2.2 🔴).
    const touched: HTMLElement[] = [];
    const bodyChildren = Array.from(document.body.children);
    for (const child of bodyChildren) {
      if (!(child instanceof HTMLElement)) continue;
      // The dialog backdrop is rendered into #root alongside the rest
      // of the app, so we can't exclude by DOM parent alone. Instead
      // apply inert to #root's children except the search dialog.
      if (child.id === 'root') {
        for (const inner of Array.from(child.children)) {
          if (!(inner instanceof HTMLElement)) continue;
          if (inner.classList.contains('search-backdrop')) continue;
          if (!inner.hasAttribute('inert')) {
            inner.setAttribute('inert', '');
            inner.setAttribute('aria-hidden', 'true');
            touched.push(inner);
          }
        }
        continue;
      }
      if (child.classList.contains('search-backdrop')) continue;
      if (!child.hasAttribute('inert')) {
        child.setAttribute('inert', '');
        child.setAttribute('aria-hidden', 'true');
        touched.push(child);
      }
    }

    return () => {
      document.body.style.overflow = prev;
      for (const el of touched) {
        el.removeAttribute('inert');
        el.removeAttribute('aria-hidden');
      }
    };
  }, [open]);

  const handleNavigate = useCallback(
    (hit: SearchHit) => {
      setOpen(false);
      navigate(hit.route);
    },
    [navigate],
  );

  const onInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeOverlay();
        return;
      }
      if (results.length === 0) return;

      const isDown =
        event.key === 'ArrowDown' || (event.key === 'j' && !event.metaKey);
      const isUp =
        event.key === 'ArrowUp' || (event.key === 'k' && !event.metaKey);

      if (isDown) {
        event.preventDefault();
        setActiveIndex((i) => (i + 1) % results.length);
        return;
      }
      if (isUp) {
        event.preventDefault();
        setActiveIndex((i) => (i - 1 + results.length) % results.length);
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const hit = results[activeIndex];
        if (hit) handleNavigate(hit);
      }
    },
    [activeIndex, closeOverlay, handleNavigate, results],
  );

  // P2.3 a11y fix (P2.2 🔴): real focus trap. Cycle Tab / Shift+Tab
  // between input and close button. Previous implementation pinned
  // focus to the input, so the close button was keyboard-unreachable.
  const onDialogKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeOverlay();
        return;
      }
      if (event.key !== 'Tab') return;

      const input = inputRef.current;
      const close = closeRef.current;
      if (!input || !close) return;

      const focusables: HTMLElement[] = [input, close];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !focusables.includes(active as HTMLElement)) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    },
    [closeOverlay],
  );

  // Overlay backdrop click closes the dialog.
  const onBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) closeOverlay();
    },
    [closeOverlay],
  );

  const activeHit = results[activeIndex];
  const activeDescendantId = activeHit
    ? `${listboxId}-option-${activeHit.id}`
    : undefined;

  const trimmed = query.trim();
  const showEmptyHint = trimmed.length === 0;
  const showNoResults = trimmed.length > 0 && results.length === 0;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="search-trigger"
        onClick={openOverlay}
        aria-label="Search (press / to open)"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg
          className="search-trigger__icon"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span className="search-trigger__label">Search</span>
        <kbd className="search-trigger__kbd" aria-hidden="true">
          /
        </kbd>
      </button>

      {open && (
        <div
          className="search-backdrop"
          onMouseDown={onBackdropClick}
          role="presentation"
        >
          <div
            className="search-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onKeyDown={onDialogKeyDown}
          >
            <h2 id={titleId} className="search-dialog__title">
              Search
            </h2>
            <div className="search-dialog__inputRow">
              <svg
                className="search-dialog__inputIcon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                className="search-dialog__input"
                placeholder="Search work, writing, and ideas…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                aria-label="Search query"
                aria-controls={listboxId}
                aria-activedescendant={activeDescendantId}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                ref={closeRef}
                type="button"
                className="search-dialog__close"
                onClick={closeOverlay}
                aria-label="Close search"
              >
                Esc
              </button>
            </div>

            <div
              id={listboxId}
              className="search-dialog__results"
              role="listbox"
              aria-label="Search results"
            >
              {/* P2.3 a11y fix (P2.2 🟡): polite live region so screen
                  readers announce "no results" / empty-state guidance
                  instead of going silent after input. */}
              <div
                className="search-dialog__live"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {showEmptyHint && (
                  <p className="search-dialog__empty">
                    Type to search across work, writing, and ideas.
                  </p>
                )}
                {showNoResults && (
                  <p className="search-dialog__empty">
                    No results for &ldquo;{trimmed}&rdquo;.
                  </p>
                )}
              </div>
              {grouped.map((group) => (
                <section
                  key={group.kind}
                  className="search-dialog__group"
                  aria-label={KIND_LABELS[group.kind]}
                >
                  <h3 className="search-dialog__groupTitle">
                    {KIND_LABELS[group.kind]}
                  </h3>
                  <ul className="search-dialog__list">
                    {group.items.map((hit) => {
                      const flatIdx = results.indexOf(hit);
                      const isActive = flatIdx === activeIndex;
                      const optionId = `${listboxId}-option-${hit.id}`;
                      return (
                        <li
                          key={hit.id}
                          id={optionId}
                          role="option"
                          aria-selected={isActive}
                          className={
                            'search-dialog__row' +
                            (isActive ? ' is-active' : '')
                          }
                          onMouseEnter={() => setActiveIndex(flatIdx)}
                          onClick={() => handleNavigate(hit)}
                        >
                          <span className="search-dialog__rowTitle">
                            {hit.title}
                          </span>
                          <span className="search-dialog__rowExcerpt">
                            {hit.excerpt}
                          </span>
                          <span className="search-dialog__rowKind">
                            {KIND_LABELS[hit.kind]}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
