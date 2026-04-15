# Monogram alternatives — P2.5

Five inline-SVG monogram designs. All share the same `viewBox="0 0 64 64"`
and render in `currentColor`, so swapping the default is literally a
one-line change in `src/components/shared/Monogram.tsx` (replace the `d`
constant passed to the `<path>`). The default shipped is **S Italic
Serif** — most editorial, most mature, pairs cleanly with Fraunces.

Each SVG below is sized at 96px so you can judge detail + proportion.
They all also need to hold up at 24px (favicon / inline icon) and 200px
(hero), which is why stroke weights and interior whitespace are tuned
for the smaller end.

---

## 1. S Italic Serif — `MONOGRAM_S_ITALIC_SERIF` (default, shipped)

Italic display-serif S with two small serif "punctuation" dots marking
the top and bottom terminals. Reads as editorial, sophisticated — the
safest default for a personal portfolio with Fraunces as the display
face.

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="96" height="96">
  <title>S Italic Serif</title>
  <path fill="#7c5cfc" d="M46.4 16.8c-1.6-3.4-5.2-5.6-10-5.6-7.4 0-13.2 4.4-13.2 10.6 0 4.2 2.6 6.8 8.6 9l6.6 2.4c4.4 1.6 6 3.2 6 5.8 0 3.8-3.6 6.6-8.6 6.6-4.2 0-7-1.8-9.2-5.8l-3.8 2.6c2.8 5.4 7.2 8 13.2 8 8.2 0 14.2-4.8 14.2-11.4 0-4.6-2.6-7.2-8.8-9.4l-6.4-2.4c-4.2-1.6-6-3-6-5.4 0-3.4 3.2-5.8 7.8-5.8 3.6 0 6 1.4 7.6 4.6zM50.4 52.8c0-1.2-1-2.2-2.2-2.2s-2.2 1-2.2 2.2 1 2.2 2.2 2.2 2.2-1 2.2-2.2zM17.8 11.6c0-1.2-1-2.2-2.2-2.2s-2.2 1-2.2 2.2 1 2.2 2.2 2.2 2.2-1 2.2-2.2z"/>
</svg>
```

**Rationale:** Editorial-forward. The serif dots echo the mono-font
punctuation marks used throughout the nav and card metadata. Italic
slant matches the "SuriXing" headline. Best pick for a mature personal
site.

---

## 2. S Bold — `MONOGRAM_S_BOLD`

Chunky bold sans-serif S. No flourishes. More logo-mark than glyph.
Reads louder, less editorial.

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="96" height="96">
  <title>S Bold</title>
  <path fill="#7c5cfc" d="M48 18c-2-5-7-8-14-8-9 0-16 5.4-16 13 0 5.6 3.4 9 11 11.4l6 2c4.6 1.4 6.4 3 6.4 5.4 0 3.2-3.4 5.4-8 5.4-5 0-8.4-2.4-10.6-7l-6 3c3 7 9 11 16.6 11 10 0 17-5.6 17-13.8 0-5.8-3.4-9-11.4-11.6l-6-2c-4.4-1.4-6-2.8-6-5 0-2.8 3-4.8 7-4.8 4.2 0 7 1.8 8.6 5.4z"/>
</svg>
```

**Rationale:** If the site pivots toward "startup / product brand"
vibes, this is the right move. For a grade-8 personal portfolio with
Fraunces editorial tone, it feels slightly too corporate.

---

## 3. SX Interlock — `MONOGRAM_SX_INTERLOCK`

S with an X crossing through the center. Dual-initial mark — reads as
"S.X." or Suri Xing more explicitly than a single-letter monogram.

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="96" height="96">
  <title>SX Interlock</title>
  <path fill="none" stroke="#7c5cfc" stroke-width="3" stroke-linecap="round" d="M42 14c-1.2-2.6-4-4.2-7.8-4.2-6 0-10.6 3.6-10.6 8.6 0 3.4 2 5.4 6.8 7.2l5 1.8c3.4 1.2 4.6 2.4 4.6 4.4 0 2.8-2.8 4.8-6.6 4.8-3.4 0-5.6-1.4-7.4-4.4l-3 2c2.2 4.2 5.8 6.2 10.6 6.2 6.6 0 11.4-3.8 11.4-9 0-3.6-2-5.6-7-7.4l-5-1.8c-3.2-1.2-4.4-2.2-4.4-4 0-2.6 2.4-4.4 6-4.4 2.8 0 4.6 1 5.8 3.4M14 42l36 16M50 42l-36 16"/>
</svg>
```

**Rationale:** Most explicit branding ("this is SX"). Trades
minimalism for clarity. Could feel over-designed for a portfolio whose
whole vibe is "small rough real things." Good favicon contender.

---

## 4. S Round — `MONOGRAM_S_ROUND`

All curves, no corners. Humanist, friendly, minimalist. The safest
choice for very small display sizes (16–24 px).

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="96" height="96">
  <title>S Round</title>
  <path fill="#7c5cfc" d="M48 20c0-6.6-6-11-14-11s-14 4.4-14 11c0 5.4 3.6 8.6 11 11l5 1.6c5 1.6 7 3.2 7 6 0 3.6-4 6.2-9 6.2s-9-2.6-11-7l-4 2c2.4 6 8 9.4 15 9.4 8.4 0 15-4.8 15-11.6 0-5.6-3.6-8.8-11.6-11.4l-5-1.6c-4.8-1.6-6.4-3-6.4-5.4 0-3 3.6-5.2 8-5.2s8 2.2 9 5.6z"/>
</svg>
```

**Rationale:** Friendly, approachable. Loses the editorial edge of the
italic serif. Strong candidate if you want the site to feel softer or
if you eventually migrate the display face away from Fraunces.

---

## 5. S Framed — `MONOGRAM_S_FRAMED`

Italic S inside a 25-px circle frame — monogram-as-medallion. More
formal, more decorative. Best at larger sizes where the frame reads
cleanly.

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="96" height="96">
  <title>S Framed</title>
  <path fill="#7c5cfc" d="M32 4a28 28 0 100 56 28 28 0 000-56zm0 3a25 25 0 110 50 25 25 0 010-50zM44 22c-1.4-2.8-4.2-4.6-8.2-4.6-6.2 0-11 3.6-11 8.8 0 3.4 2.2 5.6 7.2 7.4l5.4 2c3.6 1.4 5 2.6 5 4.8 0 3.2-3 5.6-7.2 5.6-3.4 0-5.8-1.6-7.6-4.8l-3.2 2.2c2.4 4.4 6 6.6 10.8 6.6 6.8 0 11.8-4 11.8-9.4 0-3.8-2.2-6-7.4-7.8l-5.2-2c-3.4-1.4-4.8-2.4-4.8-4.4 0-2.8 2.6-4.8 6.4-4.8 3 0 5 1.2 6.2 3.8z"/>
</svg>
```

**Rationale:** Strongest as a footer mark or favicon. In the 180-px
hero avatar slot it reads as a stamp, which can feel more "academic
publisher" than "personal lab." Swap in if you want that formal feel.

---

## To swap the default

Edit `src/components/shared/Monogram.tsx`:

```ts
// inside the Monogram function body
const d = MONOGRAM_S_ITALIC_SERIF; // <- change to one of the other
                                   //    named constants
```

All five constants are already exported so no other file needs to
change. If you want multiple variants at once (e.g. italic serif in
hero, framed in footer), pass the glyph via a prop — the component
accepts `variant` and could be extended to map variant → path lookup.
Defer until there's a real use case.
