/**
 * Client-side search index for the 2D rich portfolio (P2.1).
 *
 * Built once at module load from the canonical content sources in
 * `src/data/{products,posts,ideas,about}.ts`. The index powers the
 * global SearchBox overlay mounted in `src/App.tsx`.
 *
 * Design choices:
 *   - minisearch chosen over flexsearch for small gzip size (~6 KB) +
 *     first-class TypeScript types.
 *   - Build the index synchronously at module evaluation time. It is
 *     cheap (tens of documents) and avoids any "index warm-up" UX.
 *   - One unified index covering four content kinds (work / writing /
 *     ideas / about), discriminated by `kind` on each document. A
 *     single pool is simpler than 4 and the search box groups results
 *     in the UI after scoring.
 *   - Strict types only — we wrap minisearch's loose `SearchResult`
 *     (which is typed `[key: string]: any`) into our own strict
 *     `SearchHit` record so no `any` escapes this module.
 */

import MiniSearch from 'minisearch';
import { products } from '../data/products';
import { posts } from '../data/posts';
import { ideas } from '../data/ideas';
import { about } from '../data/about';

export type SearchKind = 'work' | 'writing' | 'ideas' | 'about';

/**
 * One document fed into minisearch. `tagsText` is a pre-joined copy of
 * `tags` because minisearch prefers string fields over arrays for its
 * default tokenizer.
 */
interface SearchDoc {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  tagsText: string;
  kind: SearchKind;
  route: string;
}

/**
 * Strict result shape returned by `search()`. This is what the
 * SearchBox component consumes.
 */
export interface SearchHit {
  id: string;
  title: string;
  excerpt: string;
  kind: SearchKind;
  route: string;
  score: number;
}

export interface SearchOptions {
  limit?: number;
}

const DEFAULT_LIMIT = 12;

function productExcerpt(value: string): string {
  // Products already have short excerpts, but keep a ceiling to match
  // the other content kinds.
  return truncate(value, 180);
}

function postExcerpt(value: string): string {
  return truncate(value, 180);
}

function ideaExcerpt(value: string): string {
  return truncate(value, 180);
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return value.slice(0, max - 1).trimEnd() + '…';
}

/**
 * Collect all indexable documents from the canonical data sources.
 * Runs once at module load.
 */
function collectDocs(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const p of products) {
    docs.push({
      id: `work:${p.slug}`,
      title: p.title,
      excerpt: productExcerpt(p.excerpt),
      body: p.body,
      tagsText: p.tags.join(' '),
      kind: 'work',
      route: `/work/${p.slug}`,
    });
  }

  for (const post of posts) {
    // body is optional on external / coming-soon variants — fall back
    // to the excerpt so we still index something meaningful.
    const body = post.kind === 'inline' ? post.body : post.excerpt;
    docs.push({
      id: `writing:${post.slug}`,
      title: post.title,
      excerpt: postExcerpt(post.excerpt),
      body,
      tagsText: post.tags.join(' '),
      kind: 'writing',
      // External posts still get an in-app route; the WritingDetail
      // page decides whether to render inline body or link out.
      route: `/writing/${post.slug}`,
    });
  }

  for (const idea of ideas) {
    docs.push({
      id: `ideas:${idea.slug}`,
      title: idea.title,
      excerpt: ideaExcerpt(idea.why),
      body: idea.body,
      tagsText: idea.tags.join(' '),
      kind: 'ideas',
      route: `/ideas/${idea.slug}`,
    });
  }

  docs.push({
    id: 'about:suri',
    title: about.name,
    excerpt: truncate(about.tagline, 180),
    body: about.bio,
    tagsText: about.tags.join(' '),
    kind: 'about',
    route: '/about',
  });

  return docs;
}

const docs = collectDocs();
const docsById = new Map<string, SearchDoc>(docs.map((d) => [d.id, d]));

const index = new MiniSearch<SearchDoc>({
  fields: ['title', 'tagsText', 'excerpt', 'body'],
  storeFields: ['id'],
  idField: 'id',
  searchOptions: {
    // Prefix lets "prod" match "Problem Solver"; fuzzy 0.2 gives a
    // small edit-distance budget so typos still resolve.
    prefix: true,
    fuzzy: 0.2,
    // Title weight is highest, tags second, so a search for a tag
    // ("react") surfaces the right card over a body mention.
    boost: { title: 3, tagsText: 2, excerpt: 1.2, body: 1 },
    combineWith: 'AND',
  },
});

index.addAll(docs);

/**
 * Run a search. Returns at most `limit` hits (default 12), sorted by
 * minisearch's BM25-based score descending. Empty / whitespace-only
 * queries return an empty array.
 */
export function search(
  query: string,
  opts: SearchOptions = {},
): SearchHit[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const limit = opts.limit ?? DEFAULT_LIMIT;
  const raw = index.search(trimmed);

  const hits: SearchHit[] = [];
  for (const r of raw) {
    // minisearch types `id` as `any`; narrow to string via the
    // known-shape registry so no `any` escapes this module.
    const id = typeof r.id === 'string' ? r.id : String(r.id);
    const doc = docsById.get(id);
    if (!doc) continue;
    hits.push({
      id: doc.id,
      title: doc.title,
      excerpt: doc.excerpt,
      kind: doc.kind,
      route: doc.route,
      score: r.score,
    });
    if (hits.length >= limit) break;
  }

  return hits;
}

/**
 * Test-only / devtool hook — exposes the number of documents in the
 * index so callers can assert the index was built.
 */
export function indexSize(): number {
  return docs.length;
}
