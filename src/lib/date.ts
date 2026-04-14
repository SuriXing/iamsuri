/**
 * Date formatting helpers (P1.7).
 *
 * Canonical input shape from `src/data/schema.ts` is `YYYY-MM-DD` or
 * `YYYY-MM` (most current entries are `YYYY-MM`). Output is a short
 * human-readable form like "Apr 2026" — paired with a `<time>` element
 * carrying the raw ISO string in `dateTime`.
 */
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export function formatDate(iso: string): string {
  // Accept YYYY-MM or YYYY-MM-DD; ignore anything past day for portfolio.
  const parts = iso.split('-');
  if (parts.length < 2) return iso;
  const year = parts[0];
  const monthIndex = Number(parts[1]) - 1;
  if (Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return iso;
  }
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}
