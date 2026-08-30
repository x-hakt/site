export const prerender = false;

import type { APIRoute } from 'astro';
import {
  COOKIE,
  adminEnabled,
  sessionValid,
  validSlug,
  noteExists,
  readNote,
  writeNote,
  frontmatterProblem,
  requestRebuild,
  sameOrigin,
} from '../../lib/admin';

/*
  Write the note, hand a rebuild.request to the supervisor, then exit the Astro
  server with code 75. server.mjs runs `astro build`: on success it commits +
  pushes and respawns; on failure it restores the previous content (or deletes a
  new file) and respawns. The live site never serves a note that failed to build.
*/

function holdingPage(msg: string, ok: boolean): Response {
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="14;url=/admin">
     <title>${ok ? 'saving' : 'not saved'}</title>
     <style>body{background:#07080a;color:#c9cacd;font:14px/1.6 ui-monospace,monospace;display:grid;place-content:center;min-height:100vh;text-align:center;padding:2rem}
     a{color:#38bdf8}.b{color:${ok ? '#26cb96' : '#e5484d'}}</style>
     <p class="b">${msg}</p>
     <p>Returning to <a href="/admin">the chart room</a>.</p>`,
    { status: ok ? 202 : 422, headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
}

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!adminEnabled()) return new Response('Not found', { status: 404 });
  if (!sameOrigin(request)) return new Response('cross-site request', { status: 403 });
  if (!sessionValid(cookies.get(COOKIE)?.value)) {
    return new Response(null, { status: 303, headers: { location: '/admin?e=session' } });
  }

  const form = await request.formData();
  const slug = String(form.get('slug') ?? '');
  const content = String(form.get('content') ?? '');
  const declaredNew = form.get('isNew') === '1';

  if (!validSlug(slug)) return holdingPage('Bad slug. Lower-case letters, digits and single hyphens only.', false);

  const problem = frontmatterProblem(content);
  if (problem) return holdingPage(problem, false);

  const existed = await noteExists(slug);
  if (declaredNew && existed) return holdingPage(`A note "${slug}" already exists.`, false);

  const prev = existed ? await readNote(slug) : null;
  if (prev !== null && prev === content.replace(/\r\n/g, '\n')) {
    return holdingPage('No changes to save.', false);
  }

  await writeNote(slug, content);
  await requestRebuild({
    slug,
    isNew: !existed,
    prev,
    commitMsg: `admin: ${existed ? 'edit' : 'add'} ${slug}`,
    at: new Date().toISOString(),
  });

  // give the response time to reach the client, then drop out for the rebuild
  setTimeout(() => process.exit(75), 600);
  return holdingPage(`Saved ${slug}. Rebuilding the site, about fifteen seconds.`, true);
};

export const GET: APIRoute = () => new Response(null, { status: 303, headers: { location: '/admin' } });
