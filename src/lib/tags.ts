/**
 * Tag normalization utility (P1.7).
 *
 * Tag casing is inconsistent across the canonical data files: posts.ts
 * uses lowercase ('building', 'philosophy'), products/ideas/about use
 * Title Case ('Building', 'Math'). Picking ONE canonical form at render
 * time keeps the source data unchanged while making sure
 * '/work?tag=education' and '/writing?tag=Education' don't resolve to
 * different things.
 *
 * Convention: lowercase-kebab. Cheaper to compare, conventional in URLs,
 * and matches the posts.ts pattern (which is the largest consumer of
 * tags in render-time filters).
 */
export function normalizeTag(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, '-');
}

/**
 * Normalize a list of tags, deduplicating after normalization. Stable
 * order: first occurrence wins.
 */
export function normalizeTags(tags: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    const norm = normalizeTag(tag);
    if (!seen.has(norm)) {
      seen.add(norm);
      out.push(norm);
    }
  }
  return out;
}
