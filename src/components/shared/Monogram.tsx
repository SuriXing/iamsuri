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
 * safest editorial default.
 */
export const MONOGRAM_S_ITALIC_SERIF =
  'M46.4 16.8c-1.6-3.4-5.2-5.6-10-5.6-7.4 0-13.2 4.4-13.2 10.6 0 4.2 2.6 6.8 8.6 9l6.6 2.4c4.4 1.6 6 3.2 6 5.8 0 3.8-3.6 6.6-8.6 6.6-4.2 0-7-1.8-9.2-5.8l-3.8 2.6c2.8 5.4 7.2 8 13.2 8 8.2 0 14.2-4.8 14.2-11.4 0-4.6-2.6-7.2-8.8-9.4l-6.4-2.4c-4.2-1.6-6-3-6-5.4 0-3.4 3.2-5.8 7.8-5.8 3.6 0 6 1.4 7.6 4.6zM50.4 52.8c0-1.2-1-2.2-2.2-2.2s-2.2 1-2.2 2.2 1 2.2 2.2 2.2 2.2-1 2.2-2.2zM17.8 11.6c0-1.2-1-2.2-2.2-2.2s-2.2 1-2.2 2.2 1 2.2 2.2 2.2 2.2-1 2.2-2.2z';

/**
 * Chunky bold sans-serif S. Heavier stroke, no flourishes — reads
 * almost like a logo mark. Good if you want punch over editorial.
 */
export const MONOGRAM_S_BOLD =
  'M48 18c-2-5-7-8-14-8-9 0-16 5.4-16 13 0 5.6 3.4 9 11 11.4l6 2c4.6 1.4 6.4 3 6.4 5.4 0 3.2-3.4 5.4-8 5.4-5 0-8.4-2.4-10.6-7l-6 3c3 7 9 11 16.6 11 10 0 17-5.6 17-13.8 0-5.8-3.4-9-11.4-11.6l-6-2c-4.4-1.4-6-2.8-6-5 0-2.8 3-4.8 7-4.8 4.2 0 7 1.8 8.6 5.4z';

/**
 * Interlocking SX — the S sweeps across while an X crosses through
 * the center. More complex, reads as a dual-initial mark.
 */
export const MONOGRAM_SX_INTERLOCK =
  'M42 14c-1.2-2.6-4-4.2-7.8-4.2-6 0-10.6 3.6-10.6 8.6 0 3.4 2 5.4 6.8 7.2l5 1.8c3.4 1.2 4.6 2.4 4.6 4.4 0 2.8-2.8 4.8-6.6 4.8-3.4 0-5.6-1.4-7.4-4.4l-3 2c2.2 4.2 5.8 6.2 10.6 6.2 6.6 0 11.4-3.8 11.4-9 0-3.6-2-5.6-7-7.4l-5-1.8c-3.2-1.2-4.4-2.2-4.4-4 0-2.6 2.4-4.4 6-4.4 2.8 0 4.6 1 5.8 3.4zM14 42l36 16M50 42l-36 16';

/**
 * Rounded soft S — all curves, no corners. Humanist, friendly.
 * Reads well at very small sizes because details are minimized.
 */
export const MONOGRAM_S_ROUND =
  'M48 20c0-6.6-6-11-14-11s-14 4.4-14 11c0 5.4 3.6 8.6 11 11l5 1.6c5 1.6 7 3.2 7 6 0 3.6-4 6.2-9 6.2s-9-2.6-11-7l-4 2c2.4 6 8 9.4 15 9.4 8.4 0 15-4.8 15-11.6 0-5.6-3.6-8.8-11.6-11.4l-5-1.6c-4.8-1.6-6.4-3-6.4-5.4 0-3 3.6-5.2 8-5.2s8 2.2 9 5.6z';

/**
 * Italic S inside a circle frame — monogram-as-medallion. More formal,
 * more decorative. Good as a favicon or footer mark.
 */
export const MONOGRAM_S_FRAMED =
  'M32 4a28 28 0 100 56 28 28 0 000-56zm0 3a25 25 0 110 50 25 25 0 010-50zM44 22c-1.4-2.8-4.2-4.6-8.2-4.6-6.2 0-11 3.6-11 8.8 0 3.4 2.2 5.6 7.2 7.4l5.4 2c3.6 1.4 5 2.6 5 4.8 0 3.2-3 5.6-7.2 5.6-3.4 0-5.8-1.6-7.6-4.8l-3.2 2.2c2.4 4.4 6 6.6 10.8 6.6 6.8 0 11.8-4 11.8-9.4 0-3.8-2.2-6-7.4-7.8l-5.2-2c-3.4-1.4-4.8-2.4-4.8-4.4 0-2.8 2.6-4.8 6.4-4.8 3 0 5 1.2 6.2 3.8z';

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */

export type MonogramVariant = 'default' | 'mark-only';

export interface MonogramProps {
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
