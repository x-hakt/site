# x-hakt-site

Astro/MDX blog on Caspar. Read README.md for runtime, testing and deployment.
Read VOICE.md before writing prose.

## Drafts first

New writing belongs in src/content/drafts/<slug>.mdx with draft: true.
For revisions, copy the published source from src/content/notes/ to the drafts
directory and edit the copy. Drafts appear immediately at /admin, with styled
previews at /admin/preview/<slug>. No build is needed.

Do not publish notes as a side effect of drafting. Leave them for review unless
the user explicitly asks for publication. The /admin Publish action validates
and publishes without rebuilding. All public indexes exclude drafts.

## Development

Use an isolated checkout on Caspar; the live repo is bind-mounted into the
production container. Run npm run check, npm run build, and npm test for content
pipeline changes. The tests use temporary content and test credentials.

Follow the shared bosun-x handoff convention for project x-hakt. Deploy only
this site's compose service; do not incidentally change the shared stack.
