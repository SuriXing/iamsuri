/**
 * Canonical content schema for the 2D rich portfolio (P1.3).
 *
 * Anyone writing editorial pages (P1.5 / P1.7) imports the interfaces from
 * here and consumes the arrays/objects exported by:
 *   - src/data/products.ts   → Product[]
 *   - src/data/posts.ts      → Post[]
 *   - src/data/ideas.ts      → Idea[]
 *   - src/data/about.ts      → AboutSuri
 *
 * The legacy `src/data/{myRoom,productRoom,bookRoom,ideaLab}.ts` files are
 * kept as-is because `src/world3d/scene/rooms/*.tsx` still imports them and
 * `src/world3d/**` is frozen. They are NOT the canonical source of truth
 * for the 2D rich portfolio — this file is.
 */

export type ProductStatus = 'shipped' | 'in-progress' | 'archived';

export interface ProductMetric {
  label: string;
  value: string;
}

export interface Product {
  slug: string;
  title: string;
  /** Short tagline shown under the title on list/detail pages. */
  subtitle?: string;
  /** 1–2 sentence summary used in list cards. */
  excerpt: string;
  /** Full case-study body. Markdown-ish string; P1.7 may render. */
  body: string;
  tags: string[];
  /** ISO date — accepts YYYY-MM-DD or YYYY-MM. */
  date: string;
  /** Optional cover image URL/path. */
  cover?: string;
  status: ProductStatus;
  /** Authoritative live URL (Vercel canonical when applicable). */
  href: string;
  /** Optional GitHub repo URL. */
  repo?: string;
  /** Optional quantified outcomes shown as chips, e.g. { label: 'users', value: '500+' }. */
  metrics?: ProductMetric[];
}

/**
 * Shared fields every post variant carries. Individual variants narrow
 * the `kind`/`body`/`href`/`status` fields so the compiler forces the
 * correct shape at the call site.
 */
interface PostBase {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  /** ISO date — accepts YYYY-MM-DD or YYYY-MM. */
  date: string;
  /** Optional cover image URL/path. */
  cover?: string;
}

/**
 * Full body rendered in-app. `body` is required; `href` is forbidden.
 * Status is either `published` or `draft`.
 */
export interface InlinePost extends PostBase {
  kind: 'inline';
  body: string;
  href?: never;
  status: 'published' | 'draft';
}

/**
 * Link out to an external platform (Medium, personal blog, etc.).
 * `href` is required; `body` is forbidden.
 */
export interface ExternalPost extends PostBase {
  kind: 'external';
  href: string;
  body?: never;
  status: 'published' | 'draft';
}

/**
 * Placeholder card shown while the post is still being written.
 * Neither `body` nor `href` is present; status is pinned to `coming-soon`.
 */
export interface ComingSoonPost extends PostBase {
  kind: 'coming-soon';
  body?: never;
  href?: never;
  status: 'coming-soon';
}

/**
 * A writing entry. Discriminated union — narrow on `kind` to access
 * variant-specific fields type-safely.
 */
export type Post = InlinePost | ExternalPost | ComingSoonPost;

export type IdeaStatus = 'brewing' | 'prototyping' | 'shelved';

export interface Idea {
  slug: string;
  title: string;
  /** The core "why this" pitch — one sentence. */
  why: string;
  /** Fuller elaboration for the detail page. */
  body: string;
  tags: string[];
  status: IdeaStatus;
  /** Optional emoji / icon glyph for list cards. */
  icon?: string;
}

export interface AboutSuriContact {
  email?: string;
  github?: string;
  twitter?: string;
}

export interface AboutSuri {
  name: string;
  tagline: string;
  /** Multi-paragraph bio. Markdown-ish — P1.7 may render. */
  bio: string;
  /** Optional portrait URL. */
  photo?: string;
  contact: AboutSuriContact;
  /** Interests/skills shown as chips. */
  tags: string[];
}
