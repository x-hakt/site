# x-hakt.com

*notes from the workbench* — the rebuild of x-hakt.com as a long-form technical
blog. One person writing down how a small mesh of servers is actually wired, one
diagram carrying each idea.

This is the **new** site (Control Room project `x-hakt`, task XH-4). The current
live site is the separate `X_HAKT` repo / `hugo-x-hakt` container and is **not**
touched from here. Cutover is XH-8.

## Stack

- **Astro 5** + **MDX** — prose with inline components (diagrams, callouts).
- **Tailwind v4** via `@tailwindcss/vite` — the Control-Room-adjacent base look.
- **Static output.** The `@astrojs/node` adapter is wired so the `/admin` editor
  (XH-6) can opt individual routes into SSR later with `export const prerender = false`.
- Self-hosted **IBM Plex Mono / Sans** via `@fontsource`.
- Design tokens ported from the XH-7 style guide
  (`claude.ai/code/artifact/5b1a2ebe-25c1-4379-93f2-401dffbc094b`).

## Layout

```
src/
  site.ts                 site metadata, nav, feed config
  content.config.ts       the "notes" collection schema
  content/notes/*.mdx     one file per note
  styles/global.css       design tokens + base + .prose
  layouts/BaseLayout.astro
  components/
    Masthead.astro
    Figure.astro           the framed home for a diagram (XH-5 fills in the house style)
  pages/
    index.astro           notes index
    about.astro
    404.astro             the cartographic treatment (style guide s.07)
    notes/[...slug].astro
    rss.xml.ts
public/
  favicon.svg             PLACEHOLDER — replaced by the XH-9 generated mark
```

## Develop

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # -> dist/
npm run preview
npm run check      # astro check (types)
```

## Known placeholders

- `public/favicon.svg` — stand-in mark until XH-9.
- `public/og-default.png` — not created yet; add before launch.
- `src/site.ts` `handle` — pirate/hacker handle is fixed in XH-3.
- Diagram house style — `Figure.astro` is the wrapper contract only; XH-5.

## Deploy

Not wired yet. Planned: a small container built from `dist/` served behind the
shared Traefik, added to the `unified-services` compose stack alongside (then
replacing) `hugo-x-hakt`. See Control Room tasks XH-4 / XH-8.
