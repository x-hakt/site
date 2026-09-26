# x-hakt.com

*a landlocked captain's log* — Astro + MDX, with plain files and a private editor.
Live at https://x-hakt.com. Voice and writing conventions: [VOICE.md](VOICE.md).

## Content workflow (XH-25)

1. Sign in at **/admin** with the existing allowed Google account.
2. Create a note or choose one from **Drafts** or **Published**.
3. **Save draft** keeps a private working copy. **Preview saved draft** opens it
   using the same layout, diagrams, glossary and typography as the public note.
4. Move between any drafts, edit, save and preview as often as needed.
5. **Publish** validates both frontmatter and rendered MDX, then makes the note
   live immediately. No site build, holding page, container restart or redeploy.

Saving an edit to an already published note leaves its live version intact.
Publish is the explicit action that replaces it. Draft and public status are set
by the button used, even if the textarea contains a different `draft:` value.

The editor keeps unsaved text in this browser, reports save/preview errors, and
rejects stale saves from another tab instead of silently overwriting newer work.
An unfinished MDX body can be saved; a rendering error blocks publication.
Frontmatter must match the schema to save.

### Writing from an agent or text editor

- **New note:** create `src/content/drafts/<slug>.mdx` with `draft: true`.
  It appears in /admin immediately, even after the server has started.
- **Revision to a live note:** copy it into `src/content/drafts/<slug>.mdx`,
  keep `draft: true`, and edit that copy. Leave the published file alone.
- Existing `draft: true` files in `src/content/notes/` are also discovered
  and reviewable. Private draft copies take precedence in the editor.
- **Do not set `draft: false` or overwrite a published note as part of writing
  a draft.** Leave publication to the editor unless explicitly asked to publish.
- Keep sources in Git. Drafts are private on the website, but are committed to
  the same Git remote as the site; they are not secret storage.

Draft files are under `src/content/drafts/`; published files are under
`src/content/notes/`. On publication the server atomically replaces the public
file and removes its private working copy. `CONTENT_DIR` and `DRAFT_DIR` can
override these locations (by default drafts are a sibling of CONTENT_DIR).

Public routes, pagination, map, tags, RSS, search and sitemaps read published
files at request time. Drafts are excluded in development as well as production.
Admin responses require the existing session for content access, are private /
no-store, and carry noindex headers. Invalid draft previews show an error without
changing public content.

### Planner bridge (PLN-12)

The content planner (Postiz at planner.x-hakt.com) connects to x-hakt as a **WordPress**
channel. `src/pages/wp-json/wp/v2/` answers the calls its connector makes:

| Call | Answer |
| --- | --- |
| `GET users/me` | connection check |
| `GET types` | one post type, `notes` |
| `GET categories` | the four tracks (ids 1 to 4) |
| `GET tags` | the `tech` values already used on notes (stable numeric ids) |
| `POST media` | a hero image (raw body, PNG/JPEG/WebP/GIF, 10 MB max), stored in `src/content/media/<yyyy-mm>/`, served at `/media/...` |
| `POST notes` | a note: `status: publish` makes it live after the same render check /admin does; any other status saves a draft for /admin |

The HTML from the planner's editor becomes MDX (headings start at `##`, `{ } < >` escaped),
the first paragraph becomes the summary, the date is today in Sydney, categories become
`tracks` (default `infrastructure`), tags become `tech`, the featured image becomes `hero`.
Writes go through the same save queue and Git sync as /admin.

Create-only: no edit or delete routes, and a slug that's taken gets `-2`, `-3`. The bridge
is 404 unless `WP_BRIDGE_USER` and `WP_BRIDGE_PASSWORD` are set; it uses HTTP Basic auth
with those (constant-time compare) and throttles 10 failed logins per address per 15
minutes. In Postiz: Add Channel > WordPress, domain `https://x-hakt.com`, that user and
password. Tests: `test/wp-bridge.mjs` (part of `npm test`).

### MDX

The runtime compiler uses Astro's JSX renderer, GFM, smart punctuation, heading
IDs and the existing Shiki theme. The supported component imports are:

```mdx
import Figure from '../../components/Figure.astro';
import Term from '../../components/Term.astro';
```

Other imports/exports give an explicit preview error. MDX expressions are code:
only trusted authors should have editor or repository write access.
Rendered HTML is cached by content hash (up to 64 revisions); edits invalidate
it automatically. No service restart is required for content changes.

### Git synchronization

Each admin save/publish commits only the affected content paths and pushes to
`origin HEAD`. It does not commit unrelated staged changes. A failed Git sync
is shown in the editor; the content remains saved on the server. Retry the
push before relying on the remote backup. `CONTENT_GIT=off` disables Git
operations for isolated tests.

## Develop and verify

```bash
npm ci
npm run dev
npm run check
npm run build
npm test
```

`npm test` starts the built server on loopback with temporary copies of the
notes, a temporary Git repository/remote, and test-only credentials. It tests every existing note, multiple drafts,
private preview, explicit publication, all public indexes, private revisions,
stale/concurrent writes, uninterrupted public reads, CSRF, broken MDX and Git failures. It never changes production content.
Set `TEST_PORT` if the default 44326 is occupied.

Important files:

- `src/lib/notes.ts`: runtime file storage, revisions, draft/public state.
- `src/lib/render-note.ts`: MDX compilation and rendered-content cache.
- `src/lib/note-schema.ts`: shared metadata validation.
- `src/components/NotePage.astro`: shared public/preview article.
- `src/pages/admin/`: Google login, list, editor, preview, save/publish.
- `src/lib/admin.ts`: existing Google OAuth/session helpers.
- `src/content.config.ts`: empty loader prevents build-time draft compilation.
- `server.mjs`: starts the built Astro server; no content rebuild loop.

## Authentication

Admin is 404 until `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and
`ADMIN_SESSION_SECRET` are set. The allowed Google email is
`ADMIN_ALLOWED_EMAIL`; sessions use the existing signed, Secure, HttpOnly cookie.
The Google callback is `https://x-hakt.com/admin/callback`. Production uses
the existing OAuth client and environment in the parent compose stack.

## Deploy code changes on Caspar

The live repo is `~/unified-services/x-hakt-site`. Work in an isolated checkout;
run checks and tests before integrating into its main branch.

```bash
cd ~/unified-services/x-hakt-site
npm ci
npm run check
npm run build
npm test
cd ..
docker compose -f docker-compose.x-hakt-site.yml up -d --build --renew-anon-volumes
```

Code deployments still build/restart the service. Normal content saves and
publication do neither. The anonymous node_modules volume must be refreshed
when dependencies change; `--renew-anon-volumes` handles that without touching
the source/content bind mount. The source-of-truth compose copy is
`deploy/docker-compose.x-hakt-site.yml`.

The container uses the existing write deploy key mounted from
`~/unified-services/x-hakt-site-deploy-key`. Content and drafts are in the
bind-mounted Git checkout. Back up the checkout/content before a cutover.
Rollback a code deployment by restoring the preceding Git revision and built
output, and recreating this service with its previous image. Preserve drafts.

The retired terminal portfolio is the separate `X_HAKT` repo, including the
still-live escape service. It is unrelated to this application's deploy.

## Logo assets

Source art is in `design/`. `npm run logo` regenerates the raster assets in
`public/` using `scripts/process-logo.mjs`.
