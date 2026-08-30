# x-hakt.com

*a landlocked captain's log* — x-hakt.com rebuilt as a long-form technical blog.
One person (`x`) writing down how a small mesh of servers is actually wired, one
diagram carrying each idea. Every entry signs off `-x`.

Live on x-hakt.com since the XH-8 cutover (2026-08-29). The retired terminal
portfolio lives on in the separate `X_HAKT` repo (its `escape/` module,
escape.x-hakt.com, still ships from there) and is **not** touched from here.

- **Voice / persona**: `VOICE.md` (XH-3).
- **Visual style guide**: XH-7 artifact `claude.ai/code/artifact/5b1a2ebe-25c1-4379-93f2-401dffbc094b`.
- **Taxonomy** (XH-12): `sea` (named region) / `waters` (sub-areas) / `cargo`
  (loose tags) in note frontmatter; `src/seas.ts` is the sea registry; `/map`
  is the browse-all page with the client-side "spyglass" search over
  `/search.json`.

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
  site.ts                 site metadata, nav, byline, feed config
  seas.ts                 the sea registry (blurb + order per named region)
  content.config.ts       the "notes" collection schema (sea/waters/cargo)
  content/notes/*.mdx     one file per note
  styles/global.css       design tokens + base + .prose
  layouts/BaseLayout.astro
  components/
    Masthead.astro
    Figure.astro           the framed home for a diagram (XH-5 fills in the house style)
  pages/
    index.astro           notes index
    map.astro              browse-all + the spyglass search (XH-12)
    about.astro
    404.astro             the cartographic treatment (style guide s.07)
    notes/[...slug].astro
    cargo/[tag].astro      notes carrying one cargo tag
    rss.xml.ts
    search.json.ts         the spyglass index, built once
VOICE.md                  the persona + writing rules (XH-3)
public/                    generated logo assets (npm run logo) — see below
```

## Develop

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # -> dist/
npm run preview
npm run check      # astro check (types)
```

## Logo assets

Source art is in `design/` (`emblem-src.png`, `mark-src.png`). Regenerate the
public assets with:

```bash
npm run logo
```

`scripts/process-logo.mjs` hardens the alpha channel (the raw art has faint
semi-transparent speckle), flattens the mark to the `#8b949e` token colour, and
writes `public/{emblem,mark,og-default,favicon-16/32/48,apple-touch-icon}.png`.

## The /admin editor (XH-6)

`/admin` is a live SSR route. It is **404 until both `ADMIN_PASSWORD_HASH` and
`ADMIN_SESSION_SECRET` are set** in the environment.

- password-gated (scrypt hash, `scripts/admin-hash.mjs` makes the value), a
  stateless HMAC session cookie (`SameSite=Lax`), a per-IP in-memory rate limit,
  and an Origin/Referer-vs-Host check on the POST endpoints.
- list / create / edit notes as raw MDX in a textarea.
- **save** writes the `.mdx`, then `server.mjs` (the supervisor that owns the
  process) runs `astro build`. Build OK: it commits the notes dir and pushes,
  then respawns. Build fails: it restores the previous content (or deletes a new
  file) and respawns. A note that does not build never reaches the live site. A
  503 holding page covers the ~10s rebuild gap.

To turn it on: `node scripts/admin-hash.mjs '<password>'`, put the line in
`~/unified-services/.env` as `XHAKT_ADMIN_PASSWORD_HASH=...`, set
`XHAKT_ADMIN_SESSION_SECRET` to a random 32+ char string, and
`docker compose -f docker-compose.x-hakt-site.yml up -d`.

The container pushes with a dedicated deploy key
(`~/unified-services/x-hakt-site-deploy-key`, public half on the GitHub repo's
Deploy keys with write access). Without it, saves still build and show live;
they just are not pushed to git until the key is in place.

## Still open

- **Diagram house style** (XH-5): `Figure.astro` is the wrapper contract only.
  The 404, and the diagram in `a-key-with-one-job`, already show the intended
  register; XH-5 writes it down.
- **16px favicon**: the full wheel-and-skull mark scaled down. A purpose-drawn
  glyph, and an SVG trace of the mark, would read cleaner.
- Per-`sea` pages (`/seas/<slug>`). For now `/map#sea-<slug>` anchors cover it.
- `/admin` v1 has no MDX preview and no media library (inline SVG only, by design).

## Deploy

Runs as the Astro node server via the `server.mjs` supervisor (`Dockerfile` is
node + git + ssh; the repo is bind-mounted at `/app` in production, node_modules
is the image's via an anonymous volume). Its own compose project, never touches
the shared phase4 stack:

```bash
cd ~/unified-services
docker compose -f docker-compose.x-hakt-site.yml up -d --build   # -> https://x-hakt.com
```

Traefik router priority 200 sits above the retired `hugo-x-hakt`'s 100.
`deploy/docker-compose.x-hakt-site.yml` in this repo is the source-of-truth copy.
After a dependency change, refresh the node_modules volume:
`docker compose -f docker-compose.x-hakt-site.yml down && docker volume rm unified-services_... && up -d --build`.
