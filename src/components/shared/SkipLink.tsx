import './SkipLink.css';

/**
 * Skip-to-content link (P1.7 a11y, drains P1.2 finding #5).
 *
 * Visually hidden until focused. Mounts as the first focusable element
 * in the DOM so keyboard users can press Tab → Enter to jump straight
 * to the page's `<main id="main">` without having to traverse the
 * persistent floating chrome (ThemeToggle, ViewSwitcher, ProjectsDock).
 *
 * Real anchor → uses native browser anchor-jump behavior. The matching
 * `<main id="main" tabIndex={-1}>` lives inside each route component.
 */
export default function SkipLink() {
  return (
    <a className="skip-link" href="#main">
      Skip to content
    </a>
  );
}
