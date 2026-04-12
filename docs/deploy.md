# Deploy to `iamsuri.ai`

The site is a Vite + React SPA. One build, one deployable. The 2D landing
page (`src/App.tsx`) lazy-loads the 3D world (`src/world3d/App3D.tsx`) the
first time a visitor clicks the **3D** switcher, so the initial download
is small (~5KB gzip) and 3D only pays its weight (~248KB gzip) if used.

## Quick local check

```bash
npm install
npm run build
npm run preview   # serves dist/ at http://localhost:4173
```

Visit `http://localhost:4173/` → should show the 2D floor plan. Click the
`3D` button top-right → R3F world loads. Click `2D` → back to floor plan.

## Vercel (recommended)

Vercel is already wired via `vercel.json` at the repo root. It auto-detects
Vite, caches `/assets/*` for a year, and rewrites all paths to
`index.html` so client-side state routing works on refresh.

### First-time setup

1. **Install the CLI once:**
   ```bash
   npm i -g vercel
   ```
2. **Link the repo to a Vercel project** (run from the repo root):
   ```bash
   vercel link
   ```
   - Scope: your personal account
   - Link to existing project? **No**
   - Project name: `iamsuri` (or whatever you like)
   - Directory: `./` (current)
3. **First production deploy:**
   ```bash
   vercel --prod
   ```
   Vercel will build, upload, and print a URL like
   `https://iamsuri-xxxxxx.vercel.app`.

### Point `iamsuri.ai` at Vercel

1. Open the project on [vercel.com](https://vercel.com) → **Settings →
   Domains**.
2. Add `iamsuri.ai` and `www.iamsuri.ai`.
3. Vercel will show you DNS records to add at your registrar (where you
   bought `iamsuri.ai`). Typically:
   - **A record**: `@` → `76.76.21.21`
   - **CNAME**: `www` → `cname.vercel-dns.com`
   Copy whatever Vercel shows — they update their IPs occasionally.
4. DNS propagation is usually 5–30 minutes. Vercel will show a green
   checkmark and provision HTTPS automatically (free, via Let's Encrypt).

### Subsequent deploys

Either:
- **CLI**: `vercel --prod` pushes the current local state.
- **Git integration**: in Vercel dashboard, connect the GitHub repo. Every
  push to `main` becomes a production deploy, every PR becomes a preview.
  Recommended — no manual command needed after setup.

## Known TODOs before launch

Two external URLs are placeholders in `src/data/links.ts` — edit them
when the real URLs exist:

- `blog` → `https://blog.iamsuri.ai`
- `anoncafe` → `https://anoncafe.iamsuri.ai`

Search for `TODO` in that file.

## Troubleshooting

- **`iamsuri.ai` shows a 404 or parked page** — DNS hasn't propagated, or
  you're hitting a cached nameserver. Try `dig iamsuri.ai` or wait 30 min.
- **Old GitHub Pages URL still works** — delete the `gh-pages` branch and
  disable Pages in repo settings once Vercel is serving the domain.
- **3D never loads for a visitor** — check the browser network tab: the
  `App3D-*.js` chunk should download when they click the 3D button. If it
  404s, the asset `Cache-Control` header may be blocking it — remove the
  headers block in `vercel.json` and redeploy.
- **Blank page on refresh at `/anything`** — the rewrite rule in
  `vercel.json` is what makes `/foo` fall through to `index.html`. Don't
  remove it.
