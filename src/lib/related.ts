import { normalizeTag } from './tags';

/**
 * Find the N most-related items in a list by tag overlap with a
 * reference item. Excludes the reference itself. Ties broken by source
 * order so output is deterministic.
 */
export function relatedByTags<T extends { slug: string; tags: string[] }>(
  reference: T,
  pool: readonly T[],
  limit = 3,
): T[] {
  const referenceTags = new Set(reference.tags.map(normalizeTag));
  const scored = pool
    .filter((item) => item.slug !== reference.slug)
    .map((item) => {
      const overlap = item.tags.reduce(
        (n, tag) => (referenceTags.has(normalizeTag(tag)) ? n + 1 : n),
        0,
      );
      return { item, overlap };
    });

  scored.sort((a, b) => b.overlap - a.overlap);

  return scored.slice(0, limit).map(({ item }) => item);
}
