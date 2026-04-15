import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { posts } from './src/data/posts';
import type { Post } from './src/data/schema';

const SITE_URL = 'https://iamsuri.ai';
const FEED_TITLE = "Suri's Writing";
const FEED_DESCRIPTION =
  'Short essays on building, thinking, and learning by shipping — by Suri Xing.';

/**
 * Escape XML special characters. Used on the entire rendered feed to
 * keep titles / excerpts from breaking the document.
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Convert a YYYY-MM or YYYY-MM-DD post date to an RFC-822 timestamp.
 * Undated / malformed dates fall back to Unix epoch so the feed still
 * validates instead of erroring out at build.
 */
function toRfc822(date: string): string {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(date);
  if (!match) return new Date(0).toUTCString();
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = match[3] ? Number(match[3]) : 1;
  return new Date(Date.UTC(year, month, day)).toUTCString();
}

/**
 * Naive paragraph → HTML converter for the feed body. Posts use `\n\n`
 * as paragraph separators; we wrap each in `<p>` and escape the
 * content. No markdown — matches the in-app Prose component's minimal
 * handling.
 */
function postBodyToHtml(body: string): string {
  return body
    .split('\n\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => `<p>${escapeXml(p)}</p>`)
    .join('\n');
}

/**
 * Render the full RSS 2.0 document for the portfolio writing feed.
 * Only `kind: 'inline'` posts ship — we don't link out to externals
 * that may 404, and draft / coming-soon posts don't have content yet.
 */
function renderRssFeed(allPosts: readonly Post[]): string {
  const items = allPosts
    .filter((p): p is Extract<Post, { kind: 'inline' }> => p.kind === 'inline')
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  const now = new Date().toUTCString();

  const itemsXml = items
    .map((post) => {
      const link = `${SITE_URL}/writing/${post.slug}`;
      const bodyHtml = postBodyToHtml(post.body);
      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        `      <pubDate>${toRfc822(post.date)}</pubDate>`,
        `      <description>${escapeXml(post.excerpt)}</description>`,
        `      <content:encoded><![CDATA[${bodyHtml}]]></content:encoded>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_URL}/writing</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
${itemsXml}
  </channel>
</rss>
`;
}

/**
 * Vite plugin that emits `dist/rss.xml` at build time from the
 * canonical posts data. P2.3 craft pass.
 */
function rssFeedPlugin(): Plugin {
  return {
    name: 'iamsuri-rss-feed',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'rss.xml',
        source: renderRssFeed(posts),
      });
    },
  };
}

// Deployed to iamsuri.ai via Vercel — root-relative paths.
// (Previously served under /iamsuri/ on GitHub Pages.)
export default defineConfig({
  plugins: [react(), rssFeedPlugin()],
  base: '/',
  build: {
    chunkSizeWarningLimit: 1500,
  },
  // Pre-bundle the heavy 3D deps at dev-server start so the first cold
  // navigation to `/3d` doesn't pay the ESM crawl cost. Measurable win
  // for the Playwright perf test (`page loads in reasonable time`)
  // which asserts a 5s upper bound on `goto('/?view=3d')`.
  optimizeDeps: {
    include: [
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'zustand',
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
    ],
  },
});
