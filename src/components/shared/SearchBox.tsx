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
 * Global SearchBox (P2.1).
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
 *
 * a11y:
 *   - button has aria-label with keybind hint
 *   - overlay is role="dialog" aria-modal
 *   - results are role="listbox" with aria-activedescendant pointing
 *     at the highlighted option
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
  const [debounced, setDebounced] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listboxId = useId();
  const titleId = useId();

  const navigate = useNavigate();

  // Debounce query → debounced at 50ms to coalesce fast typing without
  // feeling laggy.
  useEffect(() => {
    if (query === debounced) return;
    const t = window.setTimeout(() => setDebounced(query), 50);
    return () => window.clearTimeout(t);
  }, [query, debounced]);

  // Flat results (for keyboard navigation by index) + grouped view
  // (for rendering). Both derive from the same source of truth so the
  // aria-activedescendant id always matches the rendered DOM.
  const results = useMemo<SearchHit[]>(() => {
    if (debounced.trim().length === 0) return [];
    return search(debounced, { limit: 12 });
  }, [debounced]);

  const grouped = useMemo(() => groupHits(results), [results]);

  // Derived-state reset: when the results array identity changes we
  // want to reset the highlight to 0. Use the React 19 "adjust state
  // during render" pattern (https://react.dev/reference/react/useState
  // #storing-information-from-previous-renders) — compare a tracker
  // state to the current results; if they differ, schedule a clean
  // update and skip rendering stale highlight.
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

  // When the overlay opens, lock body scroll. Restore on close so the
  // behind-page isn't stuck.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
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

  // Focus trap: Tab / Shift+Tab on the overlay cycles within it. With a
  // single input + result rows this is simple — we keep focus on the
  // input, and mouse clicks on rows dispatch navigation directly.
  const onDialogKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Tab') {
        // Only the input should hold focus; keep it there.
        event.preventDefault();
        inputRef.current?.focus();
      }
    },
    [],
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
              {debounced.trim().length === 0 && (
                <p className="search-dialog__empty">
                  Type to search across work, writing, and ideas.
                </p>
              )}
              {debounced.trim().length > 0 && results.length === 0 && (
                <p className="search-dialog__empty">
                  No results for &ldquo;{debounced}&rdquo;.
                </p>
              )}
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
