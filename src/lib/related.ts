import { normalizeTag } from './tags';

interface Relatable {
  slug: string;
  tags: string[];
  /** Optional ISO date — used as a secondary sort when tag overlap ties. */
  date?: string;
}

/**
 * Find the N most-related items in a list by tag overlap with a
 * reference item. Excludes the reference itself. Ties broken by date
 * (most recent first) when available, otherwise by source order so
 * output is deterministic.
 *
 * If the pool has fewer overlapping items than `limit`, the remaining
 * slots are filled by the most recent non-reference items so detail
 * pages always get a non-empty related strip when the pool has content.
 */
export function relatedByTags<T extends Relatable>(
  reference: T,
  pool: readonly T[],
  limit = 3,
): T[] {
  const referenceTags = new Set(reference.tags.map(normalizeTag));
  const candidates = pool.filter((item) => item.slug !== reference.slug);

  const scored = candidates.map((item, index) => {
    const overlap = item.tags.reduce(
      (n, tag) => (referenceTags.has(normalizeTag(tag)) ? n + 1 : n),
      0,
    );
    return { item, overlap, index };
  });

  scored.sort((a, b) => {
    if (b.overlap !== a.overlap) return b.overlap - a.overlap;
    const ad = a.item.date ?? '';
    const bd = b.item.date ?? '';
    if (ad !== bd) return bd.localeCompare(ad);
    return a.index - b.index;
  });

  return scored.slice(0, limit).map(({ item }) => item);
}
