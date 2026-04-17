/**
 * Monogram — inline SVG personal mark for Suri Xing (P2.5).
 *
 * Why hand-drawn path data, not a styled letter?
 * ----------------------------------------------
 * The avatar slot on /about and landing "Me" previously rendered the
 * string `{about.name[0]}` styled with Fraunces italic. That means the
 * glyph looks wildly different depending on whether Fraunces has loaded
 * yet (FOUT) and carries the weight / contrast of a full variable font
 * just to draw one character. Design review flagged it as the single
 * most "no craft pass" tell on the page.
 *
 * This component draws the mark as raw SVG path data. No font
 * dependency, no FOUT, proportioned at every size from 24px to 200px,
 * inherits theme via `currentColor`.
 *
 * All glyph paths live inside a 64×64 viewBox so the five variants are
 * swappable 1:1. The default export picks the italic display-serif S
 * — editorial, mature, the safest default for a personal portfolio.
 * The four alternative path strings are exported as named constants so
 * the eval doc (`monogram-options.md`) can preview them and the user
 * can swap the default later without touching consumers.
 */

import type { CSSProperties } from 'react';

/* ------------------------------------------------------------------ *
 * Glyph path data — all in a 64×64 box, designed to read at 24px AND
 * 200px. Strokes are expressed as filled paths so they scale without
 * stroke-width tuning per size.
 * ------------------------------------------------------------------ */

/**
 * Italic display-serif S with terminal flourishes. Two curves forming
 * the spine + two serif terminals at top-right and bottom-left. The
 * safest editorial default. Alternate glyph variants (bold, interlock,
 * round, framed) were removed as dead code — restore from git history
 * if a new variant is needed.
 */
const MONOGRAM_S_ITALIC_SERIF =
  'M46.4 16.8c-1.6-3.4-5.2-5.6-10-5.6-7.4 0-13.2 4.4-13.2 10.6 0 4.2 2.6 6.8 8.6 9l6.6 2.4c4.4 1.6 6 3.2 6 5.8 0 3.8-3.6 6.6-8.6 6.6-4.2 0-7-1.8-9.2-5.8l-3.8 2.6c2.8 5.4 7.2 8 13.2 8 8.2 0 14.2-4.8 14.2-11.4 0-4.6-2.6-7.2-8.8-9.4l-6.4-2.4c-4.2-1.6-6-3-6-5.4 0-3.4 3.2-5.8 7.8-5.8 3.6 0 6 1.4 7.6 4.6zM50.4 52.8c0-1.2-1-2.2-2.2-2.2s-2.2 1-2.2 2.2 1 2.2 2.2 2.2 2.2-1 2.2-2.2zM17.8 11.6c0-1.2-1-2.2-2.2-2.2s-2.2 1-2.2 2.2 1 2.2 2.2 2.2 2.2-1 2.2-2.2z';

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */

type MonogramVariant = 'default' | 'mark-only';

interface MonogramProps {
  /** CSS size — number → px, string passes through (e.g. '1em', '4rem'). Default '1em'. */
  size?: number | string;
  /** `default` draws the italic serif S; `mark-only` strips any frame (currently equivalent — kept for future variants). */
  variant?: MonogramVariant;
  /** Extra className applied to the root <svg>. */
  className?: string;
  /** Accessible title used by SR users. Defaults to "Suri Xing monogram". */
  title?: string;
  /** Override style passed to the root svg. */
  style?: CSSProperties;
}

/**
 * Inline SVG monogram. Inherits color from the surrounding text color
 * via `currentColor`, so dark/light theme swaps cost zero work.
 */
export default function Monogram({
  size = '1em',
  variant = 'default',
  className,
  title = 'Suri Xing monogram',
  style,
}: MonogramProps) {
  const dimension = typeof size === 'number' ? `${size}px` : size;
  const d = MONOGRAM_S_ITALIC_SERIF; // default glyph
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={dimension}
      height={dimension}
      role="img"
      aria-label={title}
      className={className}
      style={style}
      data-variant={variant}
    >
      <title>{title}</title>
      <path d={d} fill="currentColor" />
    </svg>
  );
}
